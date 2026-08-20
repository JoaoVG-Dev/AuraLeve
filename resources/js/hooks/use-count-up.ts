import { useEffect, useRef, useState } from 'react';

/**
 * Animates a number from 0 to `target` once the returned ref scrolls into view.
 */
export function useCountUp<T extends HTMLElement>(
    target: number,
    durationMs = 1400,
) {
    const ref = useRef<T | null>(null);
    const [value, setValue] = useState(0);
    const started = useRef(false);

    useEffect(() => {
        const node = ref.current;

        if (!node) {
            return;
        }

        if (typeof IntersectionObserver === 'undefined') {
            const frame = requestAnimationFrame(() => setValue(target));

            return () => cancelAnimationFrame(frame);
        }

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (!entry.isIntersecting || started.current) {
                    return;
                }

                started.current = true;

                const start = performance.now();
                const step = (now: number) => {
                    const progress = Math.min((now - start) / durationMs, 1);
                    const eased = 1 - Math.pow(1 - progress, 3);
                    setValue(Math.round(eased * target));

                    if (progress < 1) {
                        requestAnimationFrame(step);
                    }
                };
                requestAnimationFrame(step);
                observer.unobserve(node);
            },
            { threshold: 0.4 },
        );

        observer.observe(node);

        return () => observer.disconnect();
    }, [target, durationMs]);

    return { ref, value };
}
