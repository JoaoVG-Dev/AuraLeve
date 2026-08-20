import { useEffect, useRef } from 'react';

/**
 * Adds `.reveal` to the element and toggles `.is-visible` the first time it
 * scrolls into view, triggering the fade-up keyframes defined in app.css.
 */
export function useReveal<T extends HTMLElement>(delayMs = 0) {
    const ref = useRef<T | null>(null);

    useEffect(() => {
        const node = ref.current;

        if (!node) {
            return;
        }

        if (typeof IntersectionObserver === 'undefined') {
            node.classList.add('is-visible');

            return;
        }

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    const timer = window.setTimeout(() => {
                        node.classList.add('is-visible');
                    }, delayMs);
                    observer.unobserve(node);

                    return () => window.clearTimeout(timer);
                }
            },
            { threshold: 0.15, rootMargin: '0px 0px -8% 0px' },
        );

        observer.observe(node);

        return () => observer.disconnect();
    }, [delayMs]);

    return ref;
}
