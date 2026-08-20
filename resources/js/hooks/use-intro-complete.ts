import { useEffect, useState } from 'react';
import { getHeroIntroState, onHeroIntroDisabled } from '@/lib/hero-intro';

/**
 * True once the visitor has scrolled through the hero's pinned video intro.
 * Shared by the nav (which stays hidden until then) and the hero's own
 * brand content, so both reveal at the same scroll position. Reverses if
 * the visitor scrolls back up, matching native scroll-linked animation.
 */
export function useIntroComplete() {
    const [done, setDone] = useState(false);

    useEffect(() => {
        const check = () => {
            const { introComplete } = getHeroIntroState();
            setDone((prev) => (prev === introComplete ? prev : introComplete));
        };

        check();
        window.addEventListener('scroll', check, { passive: true });
        window.addEventListener('resize', check);
        // Giving up on the intro completes it without any scrolling, so the
        // nav has to be told rather than waiting for the next scroll event.
        const unsubscribe = onHeroIntroDisabled(check);

        return () => {
            window.removeEventListener('scroll', check);
            window.removeEventListener('resize', check);
            unsubscribe();
        };
    }, []);

    return done;
}
