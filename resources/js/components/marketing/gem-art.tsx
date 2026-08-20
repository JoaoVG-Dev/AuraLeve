import { cn } from '@/lib/utils';

export const GEM_THEMES = {
    amethyst: {
        base: 'linear-gradient(155deg, #4a3468 0%, #8a6bc4 38%, #d9c3f2 62%, #7454a8 100%)',
        glow: '#b79bee',
    },
    rose: {
        base: 'linear-gradient(155deg, #7a4a58 0%, #d98fa3 38%, #f8dde3 62%, #c76b84 100%)',
        glow: '#f2b8c8',
    },
    citrine: {
        base: 'linear-gradient(155deg, #6b4a1e 0%, #d1a13f 38%, #f6dfa0 62%, #b5822c 100%)',
        glow: '#f0c46a',
    },
    obsidian: {
        base: 'linear-gradient(155deg, #0d0c10 0%, #35323f 38%, #6b6678 62%, #201e27 100%)',
        glow: '#8c86a0',
    },
    amazonite: {
        base: 'linear-gradient(155deg, #234a3e 0%, #5fa48c 38%, #cdeade 62%, #3d7d68 100%)',
        glow: '#8fd6bd',
    },
    moon: {
        base: 'linear-gradient(155deg, #4a4258 0%, #a79bc4 38%, #f1ecf8 62%, #877aae 100%)',
        glow: '#d8ceef',
    },
} as const;

export type GemTheme = keyof typeof GEM_THEMES;

/**
 * Abstract gradient-mesh "gemstone" swatch used in place of product photography.
 * Facets are layered radial highlights over a linear base; a shimmer sweep
 * plays on hover and a soft bead pattern can be toggled for japamala pieces.
 */
export function GemArt({
    theme,
    beads = false,
    className,
}: {
    theme: GemTheme;
    beads?: boolean;
    className?: string;
}) {
    const { base, glow } = GEM_THEMES[theme];

    return (
        <div
            className={cn(
                'group/gem relative isolate overflow-hidden',
                className,
            )}
            style={{ background: base }}
        >
            <div
                className="absolute inset-0 opacity-70 mix-blend-soft-light"
                style={{
                    background: `radial-gradient(120% 90% at 18% 12%, white 0%, transparent 45%), radial-gradient(80% 70% at 85% 88%, black 0%, transparent 50%)`,
                }}
            />
            <div
                className="absolute -inset-1/3 animate-float-slower opacity-60 blur-2xl"
                style={{
                    background: `radial-gradient(closest-side, ${glow}, transparent 70%)`,
                }}
            />
            {beads && (
                <div className="absolute inset-0 flex items-center justify-center gap-[6%] px-[8%] opacity-90">
                    {Array.from({ length: 7 }).map((_, i) => (
                        <span
                            key={i}
                            className="aspect-square flex-1 rounded-full shadow-[inset_-2px_-2px_5px_rgba(0,0,0,0.35),inset_2px_2px_4px_rgba(255,255,255,0.3)]"
                            style={{ background: base }}
                        />
                    ))}
                </div>
            )}
            <div
                className="absolute inset-0 -translate-x-full bg-[linear-gradient(115deg,transparent_0%,rgba(255,255,255,0.45)_50%,transparent_100%)] bg-[length:60%_100%] bg-no-repeat opacity-0 transition-opacity duration-500 group-hover/gem:translate-x-full group-hover/gem:opacity-100"
                style={{
                    transitionProperty: 'transform, opacity',
                    transitionDuration: '1100ms, 300ms',
                }}
            />
        </div>
    );
}

/** Slowly-rotating circular seal, e.g. "PEÇAS ARTESANAIS • CRISTAIS NATURAIS •" */
export function RotatingBadge({
    text,
    className,
}: {
    text: string;
    className?: string;
}) {
    const id = 'badge-circle-path';

    return (
        <div className={cn('animate-spin-slow', className)}>
            <svg viewBox="0 0 200 200" className="h-full w-full">
                <defs>
                    <path
                        id={id}
                        d="M 100,100 m -78,0 a 78,78 0 1,1 156,0 a 78,78 0 1,1 -156,0"
                    />
                </defs>
                <text fill="currentColor" fontSize="13.5" letterSpacing="3.2">
                    <textPath href={`#${id}`} startOffset="0%">
                        {text}
                    </textPath>
                </text>
            </svg>
        </div>
    );
}
