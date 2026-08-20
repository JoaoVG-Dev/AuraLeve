/**
 * Shared timing for the hero's scroll-scrubbed intro.
 *
 * The video itself is served as a sequence of pre-rendered WebP frames
 * (see `resources/js/hooks/use-hero-frames.ts` for why) drawn to a canvas.
 * Frames were extracted from `public/videos/hero.mp4` (kept in place as the
 * source asset) with:
 *
 *   ffmpeg -i hero.mp4 -vf "fps=8,scale=720:1280:flags=lanczos" \
 *     -c:v libwebp -quality 76 public/videos/hero-frames/frame-%04d.webp
 *
 * Reason: the source video keyframes only every ~3s (90-frame GOP), so
 * native `video.currentTime` seeking has to decode dozens of frames on every
 * scrub tick — unusable for scroll-driven playback, especially on mobile.
 * A flat image sequence makes every frame directly addressable.
 *
 * The intro runs in three phases:
 *
 *   A. autoplay  — frames advance on their own from 0 to
 *      `INTRO_AUTOPLAY_END_FRAME`, so the visitor's first contact is already
 *      moving footage rather than a loading screen.
 *   B. handoff   — playback stops on that frame and control passes to scroll.
 *   C. scrubbing — the pinned section is `HERO_PIN_VH` (vh) of scroll
 *      distance, and progress across it maps 0→1 onto the *remaining* frames
 *      (see `getHeroIntroState`), so the first scroll state is exactly the
 *      frame autoplay left off on — never a jump back to frame 0.
 *
 * The last `1 - HOME_TRANSITION_START_FRACTION` of the scrub range is an
 * overlapping transition where the frame fades out and the nav/brand content
 * fades in — not a separate held pause.
 */
export const FRAME_COUNT = 128;
export const FRAME_BASE_PATH = '/videos/hero-frames/frame-';

export const HERO_PIN_VH = 200;
export const HOME_TRANSITION_START_FRACTION = 0.85;

/**
 * Where the automatic opening stops and the visitor takes over (0-based).
 *
 * Chosen from the footage, not from a round percentage: the sequence opens on
 * one hand letting the strand hang off-centre (frame 0), then both hands come
 * together and by frame 24 the japamala is held centred in a symmetric doubled
 * loop — the most composed, stable beat in the opening. Immediately after it
 * the hands separate again and movement resumes, which is exactly the moment
 * that invites the visitor to keep going. It is also far ahead of the brand
 * reveal, which only begins at `HOME_TRANSITION_START_FRACTION` of the scrub.
 */
export const INTRO_AUTOPLAY_END_FRAME = 23;

/** Playback rate of the automatic phase — the sequence's own 8fps, so the
 *  opening reads at the speed it was shot. 24 frames ≈ 3.0s. */
export const INTRO_FRAME_DURATION_MS = 125;

/** Consecutive frames from 0 that must be decoded before autoplay starts, so
 *  the opening never stutters on its first second. */
export const INTRO_AUTOPLAY_MIN_BUFFER = 8;

export function frameSrc(index: number) {
    return `${FRAME_BASE_PATH}${String(index + 1).padStart(4, '0')}.webp`;
}

export function prefersReducedMotion() {
    return (
        typeof window !== 'undefined' &&
        window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    );
}

let introDisabled = false;
const introDisabledListeners = new Set<() => void>();

/**
 * Marks the scroll-scrubbed intro as unrunnable — there is no 2D canvas
 * context, or the frame sequence never managed to paint. Everything reading
 * the intro's state then reports it as already finished, so the nav appears
 * and the Home is immediately reachable instead of stranding the visitor in a
 * pinned section that will never advance. One-way: an intro we gave up on
 * stays given up for the rest of the session.
 */
export function disableHeroIntro() {
    if (introDisabled) {
        return;
    }

    introDisabled = true;
    introDisabledListeners.forEach((listener) => listener());
}

/** Subscribe to `disableHeroIntro`; returns an unsubscribe function. */
export function onHeroIntroDisabled(listener: () => void) {
    introDisabledListeners.add(listener);

    return () => {
        introDisabledListeners.delete(listener);
    };
}

let scrubStartFrame = INTRO_AUTOPLAY_END_FRAME;

/**
 * Pins scroll progress 0 to the frame the automatic phase actually finished
 * on. Normally that is `INTRO_AUTOPLAY_END_FRAME`, but a visitor who scrolls
 * during the opening cuts it short — recording the real frame is what keeps
 * the handoff seamless in both cases instead of snapping to a fixed index.
 */
export function setScrubStartFrame(frame: number) {
    scrubStartFrame = Math.min(Math.max(frame, 0), FRAME_COUNT - 1);
}

export function getScrubStartFrame() {
    return scrubStartFrame;
}

export function getHeroIntroState() {
    if (introDisabled || prefersReducedMotion()) {
        return {
            pinRange: 0,
            scrollProgress: 1,
            frameIndex: FRAME_COUNT - 1,
            transitionProgress: 1,
            introComplete: true,
        };
    }

    const pinRange = window.innerHeight * (HERO_PIN_VH / 100);
    const scrollProgress =
        pinRange > 0 ? Math.min(Math.max(window.scrollY / pinRange, 0), 1) : 1;
    // Scroll drives only the segment after the automatic opening, so progress
    // 0 lands on the frame playback stopped at rather than rewinding to 0.
    const frameIndex = Math.min(
        FRAME_COUNT - 1,
        scrubStartFrame +
            Math.round(scrollProgress * (FRAME_COUNT - 1 - scrubStartFrame)),
    );
    const transitionProgress = Math.min(
        Math.max(
            (scrollProgress - HOME_TRANSITION_START_FRACTION) /
                (1 - HOME_TRANSITION_START_FRACTION),
            0,
        ),
        1,
    );
    const introComplete = scrollProgress >= HOME_TRANSITION_START_FRACTION;

    return {
        pinRange,
        scrollProgress,
        frameIndex,
        transitionProgress,
        introComplete,
    };
}
