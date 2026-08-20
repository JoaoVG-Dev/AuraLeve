import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import {
    FRAME_COUNT,
    HERO_PIN_VH,
    INTRO_AUTOPLAY_END_FRAME,
    INTRO_AUTOPLAY_MIN_BUFFER,
    INTRO_FRAME_DURATION_MS,
    disableHeroIntro,
    frameSrc,
    getHeroIntroState,
    prefersReducedMotion,
    setScrubStartFrame,
} from '@/lib/hero-intro';

const PRELOAD_CONCURRENCY = 6;

/** Frames kept decoded on either side of the current one. This bounds both the
 *  prefetch window and what stays referenced, so worst-case decoded memory is
 *  (2*20+1) * 720*1280*4 bytes ≈ 144MB rather than the ~450MB the whole
 *  sequence would cost. Frames outside the window are dereferenced so their
 *  bitmaps can be reclaimed; scrolling back re-requests them, which normally
 *  costs only a decode because the bytes are still in the browser's HTTP
 *  cache. */
const RETAIN_RADIUS = 20;

/** How long the intro may spend failing to paint its first frame before we give
 *  up and hand the visitor the Home. Generous enough that a slow mobile
 *  connection still gets the intro (a frame is only ~25KB), short enough that a
 *  broken sequence — 404s, no WebP support, a dead CDN — can never turn into an
 *  endless loader. */
const INIT_TIMEOUT_MS = 8000;

/** Largest time step the automatic phase will honour in one tick. A tab in the
 *  background stops firing rAF, so without this the first tick back would carry
 *  seconds of elapsed time and flush dozens of frames at once. */
const MAX_AUTOPLAY_STEP_MS = INTRO_FRAME_DURATION_MS * 2;

/**
 * `prefers-reduced-motion`, read in a way that survives hydration.
 *
 * The page is server-rendered, where no media query exists, so the server has
 * to assume full motion. A `useState` initialiser would compute the right
 * value on the client but React would not repaint the already-hydrated markup
 * with it, leaving a reduced-motion visitor looking at a 300dvh pinned section
 * that never animates. `useSyncExternalStore` re-renders precisely when the
 * client snapshot disagrees with the server's, which is what collapses the
 * hero to a single viewport for those visitors.
 */
const reducedMotionStore = {
    subscribe(onChange: () => void) {
        if (typeof window === 'undefined' || !window.matchMedia) {
            return () => {};
        }

        const query = window.matchMedia('(prefers-reduced-motion: reduce)');
        query.addEventListener('change', onChange);

        return () => query.removeEventListener('change', onChange);
    },
    getSnapshot: () => prefersReducedMotion(),
    getServerSnapshot: () => false,
};

/**
 * Scroll-scrubbed hero: draws the pre-rendered frame sequence to a canvas
 * instead of seeking a `<video>` (see `hero-intro.ts` for why native seeking
 * doesn't work here).
 *
 * Three phases, with `currentFrame()` as the single authority over which frame
 * is on screen so autoplay and scroll never fight over the timeline:
 *
 *   A. autoplay  — a requestAnimationFrame loop walks frames 0 →
 *      `INTRO_AUTOPLAY_END_FRAME` at the sequence's own 8fps, started once
 *      `INTRO_AUTOPLAY_MIN_BUFFER` frames are decoded. It advances on elapsed
 *      time (never one frame per repaint), holds rather than skips when the
 *      next frame hasn't arrived, and clamps its step so a backgrounded tab
 *      resumes instead of catching up in a burst.
 *   B. handoff   — reaching the end frame, or any scroll/touch/wheel from the
 *      visitor, stops playback and records where it stopped via
 *      `setScrubStartFrame`, so scroll progress 0 is exactly that frame.
 *   C. scrubbing — scroll position drives the rest of the sequence.
 *
 * Loading: a window of `RETAIN_RADIUS` frames around the current frame is kept
 * filled, nearest-first and biased forward, with bounded concurrency. The
 * window doubles as the retention policy — frames outside it are dereferenced —
 * so the sequence never holds all 128 decoded bitmaps at once. While a target
 * frame hasn't arrived the nearest loaded frame is drawn rather than leaving
 * the canvas blank, and a frame that fails is left to its neighbour instead of
 * being retried forever.
 *
 * Escapes: no 2D context, or nothing painted within `INIT_TIMEOUT_MS`, and the
 * intro is abandoned via `disableHeroIntro()` so the Home becomes immediately
 * reachable — a visitor is never trapped in a pinned section that cannot
 * advance.
 */
export function useHeroFrames() {
    const reducedMotion = useSyncExternalStore(
        reducedMotionStore.subscribe,
        reducedMotionStore.getSnapshot,
        reducedMotionStore.getServerSnapshot,
    );
    /**
     * Whether this visit gets an automatic opening at all. Decided once, on
     * mount: reduced motion never does, and neither does a reload that landed
     * past the intro — that visitor has already been through it, so the
     * sequence stays scroll-driven behind them.
     */
    const [autoplayWanted] = useState(
        () =>
            typeof window !== 'undefined' &&
            !prefersReducedMotion() &&
            window.scrollY < window.innerHeight * (HERO_PIN_VH / 100),
    );
    const sectionRef = useRef<HTMLDivElement | null>(null);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const overlayRef = useRef<HTMLDivElement | null>(null);
    const brandRef = useRef<HTMLDivElement | null>(null);
    const [firstFramePainted, setFirstFramePainted] = useState(false);
    const [introStarted, setIntroStarted] = useState(() => !autoplayWanted);
    const [unavailable, setUnavailable] = useState(false);

    const imagesRef = useRef<(HTMLImageElement | null)[]>(
        new Array(FRAME_COUNT).fill(null),
    );
    const loadedRef = useRef<boolean[]>(new Array(FRAME_COUNT).fill(false));
    const inFlightRef = useRef<boolean[]>(new Array(FRAME_COUNT).fill(false));
    /** Frames whose request failed. Sticky for the session: the window is
     *  rescanned on every tick, so without this a broken frame would be
     *  re-requested forever. One missing frame is invisible anyway — its
     *  neighbour stands in. */
    const failedRef = useRef<boolean[]>(new Array(FRAME_COUNT).fill(false));
    const inFlightCountRef = useRef(0);
    const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
    const lastDrawnRef = useRef(-1);
    const paintedRef = useRef(false);
    const abandonedRef = useRef(false);

    const autoplayRef = useRef({
        /** Whether the rAF loop is currently running. */
        active: false,
        /** Whether the automatic phase is over for good (played out, cut short
         *  by the visitor, or never applicable). Scroll owns the timeline from
         *  this point on. */
        done: !autoplayWanted,
        wanted: autoplayWanted,
        frame: 0,
        accumulator: 0,
        lastTick: 0,
        raf: 0,
    });

    // Hand the visitor the Home and stop trying. Safe to call repeatedly.
    const abandonIntro = () => {
        if (abandonedRef.current) {
            return;
        }

        abandonedRef.current = true;
        autoplayRef.current.active = false;
        autoplayRef.current.done = true;
        disableHeroIntro();
        setUnavailable(true);
        setFirstFramePainted(true);
        setIntroStarted(true);
    };

    const getCtx = () => {
        if (ctxRef.current) {
            return ctxRef.current;
        }

        const ctx = canvasRef.current?.getContext('2d');

        if (!ctx) {
            return null;
        }

        ctxRef.current = ctx;

        return ctx;
    };

    /**
     * The frame that should be on screen right now. Until the automatic phase
     * is finished it owns the timeline (and sits on frame 0 while the opening
     * buffers); afterwards scroll position does.
     */
    const currentFrame = () => {
        const autoplay = autoplayRef.current;

        if (autoplay.wanted && !autoplay.done) {
            return autoplay.frame;
        }

        return getHeroIntroState().frameIndex;
    };

    /**
     * Starts a fetch for `index` unless it is already decoded, already in
     * flight, or known to have failed. Returns true only when a request was
     * actually started, and in that case `onSettle` runs exactly once — on
     * success and on failure alike — so a caller tracking concurrency can never
     * leak a slot.
     */
    const loadFrame = (index: number, onSettle?: () => void) => {
        if (index < 0 || index >= FRAME_COUNT) {
            return false;
        }

        if (
            loadedRef.current[index] ||
            inFlightRef.current[index] ||
            failedRef.current[index]
        ) {
            return false;
        }

        inFlightRef.current[index] = true;

        const img = new Image();
        img.decoding = 'async';

        let settled = false;
        const settle = (ok: boolean) => {
            if (settled) {
                return;
            }

            settled = true;
            inFlightRef.current[index] = false;

            if (ok) {
                imagesRef.current[index] = img;
                loadedRef.current[index] = true;
            } else {
                failedRef.current[index] = true;
            }

            onSettle?.();
        };

        img.onload = () => settle(true);
        img.onerror = () => settle(false);
        img.src = frameSrc(index);

        return true;
    };

    // Draw whichever frame is closest to `target` among those already loaded.
    const drawNearest = (target: number) => {
        const canvas = canvasRef.current;

        if (!canvas) {
            return;
        }

        const ctx = getCtx();

        if (!ctx) {
            // No 2D context at all — the intro can never paint.
            abandonIntro();

            return;
        }

        let index = target;

        if (!loadedRef.current[index]) {
            let offset = 1;
            index = -1;

            while (offset < FRAME_COUNT) {
                if (loadedRef.current[target - offset]) {
                    index = target - offset;
                    break;
                }

                if (loadedRef.current[target + offset]) {
                    index = target + offset;
                    break;
                }

                offset += 1;
            }
        }

        if (index === -1 || index === lastDrawnRef.current) {
            return;
        }

        const img = imagesRef.current[index];

        if (!img) {
            return;
        }

        const cw = canvas.width;
        const ch = canvas.height;
        const scale = Math.max(cw / img.width, ch / img.height);
        const dw = img.width * scale;
        const dh = img.height * scale;
        ctx.clearRect(0, 0, cw, ch);
        ctx.drawImage(img, (cw - dw) / 2, (ch - dh) / 2, dw, dh);
        lastDrawnRef.current = index;

        if (!paintedRef.current) {
            paintedRef.current = true;
            setFirstFramePainted(true);
        }
    };

    /**
     * Keeps the retention window around `center` filled — nearest frame first,
     * biased forward because forward is the direction of travel — without ever
     * exceeding `PRELOAD_CONCURRENCY` simultaneous requests. Idempotent.
     */
    const pump = (center: number) => {
        if (abandonedRef.current) {
            return;
        }

        for (let offset = 0; offset <= RETAIN_RADIUS; offset++) {
            const candidates =
                offset === 0 ? [center] : [center + offset, center - offset];

            for (const index of candidates) {
                if (inFlightCountRef.current >= PRELOAD_CONCURRENCY) {
                    return;
                }

                const started = loadFrame(index, () => {
                    inFlightCountRef.current -= 1;
                    drawNearest(currentFrame());
                    maybeStartAutoplay();
                    pump(currentFrame());
                });

                if (started) {
                    inFlightCountRef.current += 1;
                }
            }
        }
    };

    // Drop decoded frames outside the retention window so the browser can
    // reclaim their bitmap memory. Only the JS reference goes — the bytes
    // usually stay in the HTTP cache, so scrolling back costs a decode rather
    // than a download.
    const evictFarFrames = (center: number) => {
        for (let i = 0; i < FRAME_COUNT; i++) {
            if (Math.abs(i - center) > RETAIN_RADIUS && loadedRef.current[i]) {
                imagesRef.current[i] = null;
                loadedRef.current[i] = false;
            }
        }
    };

    /** Ends the automatic phase and pins scroll progress 0 to wherever it
     *  stopped, so the visitor's first swipe continues from that exact frame. */
    const endAutoplay = () => {
        const autoplay = autoplayRef.current;

        if (autoplay.done) {
            return;
        }

        autoplay.done = true;
        autoplay.active = false;

        if (autoplay.raf) {
            cancelAnimationFrame(autoplay.raf);
            autoplay.raf = 0;
        }

        setScrubStartFrame(autoplay.frame);
    };

    const autoplayTick = (now: number) => {
        const autoplay = autoplayRef.current;

        if (!autoplay.active) {
            return;
        }

        // First tick just anchors the clock to rAF's own timestamp.
        if (!autoplay.lastTick) {
            autoplay.lastTick = now;
        }

        const delta = Math.min(now - autoplay.lastTick, MAX_AUTOPLAY_STEP_MS);
        autoplay.lastTick = now;
        autoplay.accumulator += delta;

        while (
            autoplay.accumulator >= INTRO_FRAME_DURATION_MS &&
            autoplay.frame < INTRO_AUTOPLAY_END_FRAME
        ) {
            // Hold on the current frame rather than skipping over one that
            // hasn't decoded yet — a stutter is better than a gap.
            if (!loadedRef.current[autoplay.frame + 1]) {
                break;
            }

            autoplay.accumulator -= INTRO_FRAME_DURATION_MS;
            autoplay.frame += 1;
        }

        // Never bank more than one frame of unspent time.
        autoplay.accumulator = Math.min(
            autoplay.accumulator,
            INTRO_FRAME_DURATION_MS,
        );

        drawNearest(autoplay.frame);
        pump(autoplay.frame);

        if (autoplay.frame >= INTRO_AUTOPLAY_END_FRAME) {
            endAutoplay();

            return;
        }

        autoplay.raf = requestAnimationFrame(autoplayTick);
    };

    /** Number of frames decoded consecutively from the start of the sequence. */
    const bufferedFromStart = () => {
        let count = 0;

        while (count < FRAME_COUNT && loadedRef.current[count]) {
            count += 1;
        }

        return count;
    };

    const maybeStartAutoplay = () => {
        const autoplay = autoplayRef.current;

        if (
            !autoplay.wanted ||
            autoplay.active ||
            autoplay.done ||
            abandonedRef.current ||
            bufferedFromStart() < INTRO_AUTOPLAY_MIN_BUFFER
        ) {
            return;
        }

        autoplay.active = true;
        autoplay.lastTick = 0;
        autoplay.accumulator = 0;
        setIntroStarted(true);
        autoplay.raf = requestAnimationFrame(autoplayTick);
    };

    // Kick off loading and arm the escape hatch.
    useEffect(() => {
        const autoplay = autoplayRef.current;

        // Read the media query live rather than trusting the render snapshot:
        // the first client render still carries the server's "full motion"
        // assumption, and without this the sequence would start prefetching
        // before hydration corrects it — downloading frames at the one visitor
        // who asked for less.
        if (reducedMotion || prefersReducedMotion()) {
            // Reduced motion gets no automatic playback and no long scrub —
            // just the closing still.
            loadFrame(FRAME_COUNT - 1, () => drawNearest(FRAME_COUNT - 1));
        } else {
            // A reload inside the intro restarts the experience from frame 0
            // rather than dropping the visitor mid-sequence.
            if (autoplay.wanted && window.scrollY > 0) {
                window.scrollTo(0, 0);
            }

            pump(currentFrame());
        }

        const timer = window.setTimeout(() => {
            if (!paintedRef.current) {
                abandonIntro();
            }
        }, INIT_TIMEOUT_MS);

        return () => {
            window.clearTimeout(timer);

            if (autoplay.raf) {
                cancelAnimationFrame(autoplay.raf);
                autoplay.raf = 0;
            }

            autoplay.active = false;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [reducedMotion]);

    // Size the canvas to the container (accounting for DPR) and redraw on
    // scroll, resize, or orientation change.
    useEffect(() => {
        const section = sectionRef.current;
        const canvas = canvasRef.current;

        if (!section || !canvas) {
            return;
        }

        let raf = 0;
        // Same live read as the loading effect — the hydration render still
        // carries the server's "full motion" assumption.
        const isReduced = reducedMotion || prefersReducedMotion();

        const paint = () => {
            const frame = currentFrame();
            drawNearest(frame);

            if (!isReduced && !abandonedRef.current) {
                evictFarFrames(frame);
                pump(frame);
            }

            const { transitionProgress } = getHeroIntroState();
            const overlay = overlayRef.current;

            if (overlay) {
                overlay.style.opacity = String(1 - transitionProgress * 0.5);
                overlay.style.transform = `scale(${1 + transitionProgress * 0.02})`;
            }

            // The brand rides the same progress as the footage instead of
            // being switched on at a threshold, so it grows out of the
            // composition rather than cutting over it.
            const brand = brandRef.current;

            if (brand) {
                brand.style.opacity = String(transitionProgress);
                brand.style.transform = `translateY(${(1 - transitionProgress) * 14}px)`;
            }
        };

        const resize = () => {
            const dpr = Math.min(window.devicePixelRatio || 1, 2);
            canvas.width = Math.round(section.clientWidth * dpr);
            canvas.height = Math.round(section.clientHeight * dpr);
            lastDrawnRef.current = -1;
            paint();
        };

        const schedule = () => {
            if (!raf) {
                raf = requestAnimationFrame(() => {
                    raf = 0;
                    paint();
                });
            }
        };

        // Any real gesture during the opening hands control over immediately
        // rather than making the visitor wait it out.
        const interrupt = () => {
            if (autoplayRef.current.wanted && !autoplayRef.current.done) {
                endAutoplay();
            }

            schedule();
        };

        resize();

        const resizeObserver = new ResizeObserver(resize);
        resizeObserver.observe(section);

        window.addEventListener('scroll', interrupt, { passive: true });
        window.addEventListener('wheel', interrupt, { passive: true });
        window.addEventListener('touchmove', interrupt, { passive: true });
        window.addEventListener('orientationchange', resize);

        return () => {
            window.removeEventListener('scroll', interrupt);
            window.removeEventListener('wheel', interrupt);
            window.removeEventListener('touchmove', interrupt);
            window.removeEventListener('orientationchange', resize);
            resizeObserver.disconnect();

            if (raf) {
                cancelAnimationFrame(raf);
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [reducedMotion]);

    return {
        sectionRef,
        canvasRef,
        overlayRef,
        brandRef,
        /** The AuraLeve wordmark sits over the footage until the opening is
         *  actually moving — there is no separate loading screen to dismiss. */
        showMark: !introStarted || !firstFramePainted,
        reducedMotion,
        unavailable,
    };
}
