import { Link } from '@inertiajs/react';
import {
    ArrowRight,
    ChevronDown,
    Gem,
    Hand,
    Heart,
    Home as HomeIcon,
    Instagram,
    Menu,
    MessageCircle,
    ShoppingBag,
    Sparkles,
    User,
    X,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { dashboard, login } from '@/routes';
import { Button } from '@/components/ui/button';
import { useHeroFrames } from '@/hooks/use-hero-frames';
import { useIntroComplete } from '@/hooks/use-intro-complete';
import { useReveal } from '@/hooks/use-reveal';
import { HERO_PIN_VH } from '@/lib/hero-intro';
import { cn } from '@/lib/utils';
import type { Auth } from '@/types';
import { RotatingBadge } from './gem-art';

/* -------------------------------------------------------------------------- */
/*  Shared bits                                                               */
/* -------------------------------------------------------------------------- */

function Reveal({
    children,
    className,
    delay = 0,
}: {
    children: ReactNode;
    className?: string;
    delay?: number;
}) {
    const ref = useReveal<HTMLDivElement>(delay);

    return (
        <div ref={ref} className={cn('reveal', className)}>
            {children}
        </div>
    );
}

function Eyebrow({
    children,
    dark = false,
}: {
    children: ReactNode;
    dark?: boolean;
}) {
    return (
        <span
            className={cn(
                'inline-flex items-center gap-2 text-xs font-medium tracking-[0.25em] uppercase',
                dark ? 'text-aura-rose/80' : 'text-aura-plum/50',
            )}
        >
            <span
                className={cn(
                    'h-1.5 w-1.5 rounded-full',
                    dark ? 'bg-aura-rose' : 'bg-aura-gold',
                )}
            />
            {children}
        </span>
    );
}

const NAV_LINKS = [
    { href: '#intencao', label: 'Intenção' },
    { href: '#colecao', label: 'Coleção' },
];

/* -------------------------------------------------------------------------- */
/*  Nav                                                                       */
/* -------------------------------------------------------------------------- */

export function Nav({ auth }: { auth: Auth }) {
    const [scrolled, setScrolled] = useState(false);
    const [open, setOpen] = useState(false);
    const introComplete = useIntroComplete();

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 24);
        onScroll();
        window.addEventListener('scroll', onScroll, { passive: true });

        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    return (
        <header
            className={cn(
                'fixed inset-x-0 top-0 z-50 transition-all duration-700',
                scrolled ? 'py-3' : 'py-6',
                // Hidden through load and the automatic opening; it slips in
                // only once the visitor is driving the scroll-driven segment.
                introComplete
                    ? 'translate-y-0 opacity-100'
                    : 'pointer-events-none -translate-y-2 opacity-0',
            )}
        >
            <div
                className={cn(
                    'mx-auto grid max-w-6xl grid-cols-[1fr_auto_1fr] items-center gap-2 rounded-full px-5 transition-all duration-500 sm:px-6 md:flex md:justify-between',
                    scrolled
                        ? 'border border-aura-plum/10 bg-aura-cream/90 py-2 shadow-[0_10px_40px_-15px_rgba(36,28,44,0.25)] backdrop-blur-md'
                        : 'border border-transparent bg-transparent py-2',
                )}
            >
                {/* Mobile: hamburger — brand — bag. Desktop: brand — links — auth. */}
                <button
                    onClick={() => setOpen((v) => !v)}
                    className={cn(
                        'flex h-9 w-9 items-center justify-center justify-self-start rounded-full transition-colors duration-500 md:hidden',
                        scrolled ? 'text-aura-plum' : 'text-aura-cream',
                    )}
                    aria-label={open ? 'Fechar menu' : 'Abrir menu'}
                >
                    {open ? (
                        <X className="h-5 w-5" />
                    ) : (
                        <Menu className="h-5 w-5" />
                    )}
                </button>

                <a
                    href="#inicio"
                    className="col-start-2 flex items-center gap-2.5 justify-self-center md:justify-self-auto"
                >
                    <img
                        src="/images/brand/aura-symbol-icon.png"
                        alt=""
                        className="h-9 w-9"
                    />
                    <span
                        className={cn(
                            'font-serif text-lg tracking-[0.15em] transition-colors duration-500',
                            scrolled ? 'text-aura-plum' : 'text-aura-cream',
                        )}
                    >
                        AURALEVE
                    </span>
                </a>

                <nav className="hidden items-center gap-8 md:flex">
                    {NAV_LINKS.map((link) => (
                        <a
                            key={link.href}
                            href={link.href}
                            className={cn(
                                'text-sm transition-colors duration-500',
                                scrolled
                                    ? 'text-aura-plum/70 hover:text-aura-plum'
                                    : 'text-aura-cream/70 hover:text-aura-cream',
                            )}
                        >
                            {link.label}
                        </a>
                    ))}
                </nav>

                <div className="hidden items-center gap-4 md:flex">
                    <Link
                        href={auth.user ? dashboard() : login()}
                        className={cn(
                            'text-sm transition-colors duration-500',
                            scrolled
                                ? 'text-aura-plum/60 hover:text-aura-plum'
                                : 'text-aura-cream/60 hover:text-aura-cream',
                        )}
                    >
                        {auth.user ? 'Painel' : 'Entrar'}
                    </Link>
                    <Button
                        asChild
                        size="sm"
                        className={cn(
                            'rounded-full px-5 transition-colors duration-500',
                            scrolled
                                ? 'bg-aura-plum text-aura-cream hover:bg-aura-plum/90'
                                : 'bg-aura-cream text-aura-plum-deep hover:bg-aura-cream/90',
                        )}
                    >
                        <a href="#contato">Fale Conosco</a>
                    </Button>
                </div>

                <a
                    href="#colecao"
                    aria-label="Ver coleções"
                    className={cn(
                        'flex h-9 w-9 items-center justify-center justify-self-end rounded-full transition-colors duration-500 md:hidden',
                        scrolled ? 'text-aura-plum' : 'text-aura-cream',
                    )}
                >
                    <ShoppingBag className="h-5 w-5" strokeWidth={1.75} />
                </a>
            </div>

            {open && (
                <div className="mx-4 mt-2 flex flex-col gap-1 rounded-3xl border border-aura-plum/10 bg-aura-cream/95 p-4 shadow-xl backdrop-blur-md md:hidden">
                    {NAV_LINKS.map((link) => (
                        <a
                            key={link.href}
                            href={link.href}
                            onClick={() => setOpen(false)}
                            className="rounded-xl px-3 py-2.5 text-sm text-aura-plum/80 hover:bg-aura-plum/5"
                        >
                            {link.label}
                        </a>
                    ))}
                    <div className="mt-2 flex items-center gap-3 border-t border-aura-plum/10 px-3 pt-3">
                        <Link
                            href={auth.user ? dashboard() : login()}
                            className="text-sm text-aura-plum/70"
                        >
                            {auth.user ? 'Painel' : 'Entrar'}
                        </Link>
                        <a
                            href="#contato"
                            className="ml-auto text-sm font-medium text-aura-plum"
                        >
                            Fale Conosco
                        </a>
                    </div>
                </div>
            )}
        </header>
    );
}

/* -------------------------------------------------------------------------- */
/*  Hero                                                                      */
/* -------------------------------------------------------------------------- */

export function Hero() {
    const {
        sectionRef,
        canvasRef,
        overlayRef,
        brandRef,
        showMark,
        reducedMotion,
        unavailable,
    } = useHeroFrames();
    const introComplete = useIntroComplete();
    // Nothing to scrub through: collapse the pinned scroll distance so the
    // Home sits directly below instead of behind two dead viewports.
    const isStatic = reducedMotion || unavailable;

    return (
        <section
            id="inicio"
            className="relative"
            style={{
                height: isStatic ? '100dvh' : `${HERO_PIN_VH + 100}dvh`,
            }}
        >
            <a
                href="#home"
                className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:rounded-full focus:bg-aura-cream focus:px-4 focus:py-2 focus:text-sm focus:text-aura-plum"
            >
                Pular introdução
            </a>

            <div
                ref={sectionRef}
                className="sticky top-0 h-dvh overflow-hidden bg-aura-plum-deep"
            >
                <div
                    ref={overlayRef}
                    aria-hidden
                    className="pointer-events-none absolute inset-0 origin-center will-change-transform"
                >
                    <canvas
                        ref={canvasRef}
                        className="absolute inset-0 h-full w-full"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-aura-plum-deep via-aura-plum-deep/35 to-aura-plum-deep/50" />
                    <svg
                        className="absolute inset-0 h-full w-full opacity-[0.08] mix-blend-overlay"
                        aria-hidden
                    >
                        <filter id="grain">
                            <feTurbulence
                                type="fractalNoise"
                                baseFrequency="0.85"
                                numOctaves="2"
                                stitchTiles="stitch"
                            />
                        </filter>
                        <rect width="100%" height="100%" filter="url(#grain)" />
                    </svg>
                </div>

                {/* Touch-reachable escape from the intro. The sr-only skip link
                    above covers keyboard users, but it can never be focused by
                    tap — so this stays visible (above the loader, so it works
                    even if the sequence never initialises) until the intro is
                    through. */}
                <a
                    href="#home"
                    className={cn(
                        'absolute top-5 right-5 z-30 px-2 py-1 text-[11px] tracking-[0.18em] text-aura-cream/50 uppercase transition-opacity duration-500 hover:text-aura-cream/80',
                        introComplete
                            ? 'pointer-events-none opacity-0'
                            : 'opacity-100',
                    )}
                >
                    Pular
                </a>

                {/* Not a loading screen: the footage itself is the backdrop
                    from the first decoded frame, and this wordmark simply sits
                    over it until the opening is actually moving. Transparent,
                    so there is never a visual seam between "loading" and
                    "video". */}
                <div
                    aria-hidden
                    className={cn(
                        'pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-3 transition-opacity duration-700',
                        showMark ? 'opacity-100' : 'opacity-0',
                    )}
                >
                    <span className="font-serif text-2xl tracking-[0.2em] text-aura-cream/80 uppercase">
                        AuraLeve
                    </span>
                    <Sparkles className="h-4 w-4 animate-pulse-soft text-aura-gold" />
                </div>

                {/* Brand-mark moment: the intro's climax, not a second hero —
                    the real hero (headline, tagline, CTA) lives in HomeHero,
                    just below, so nothing is announced twice. Opacity and
                    offset are driven frame-by-frame from the scrub progress in
                    `useHeroFrames`, so the mark grows out of the footage
                    instead of being switched on at a threshold. */}
                <div
                    ref={brandRef}
                    style={{ opacity: 0, transform: 'translateY(14px)' }}
                    className={cn(
                        'relative mx-auto flex h-full w-full max-w-6xl flex-col items-center justify-center gap-3 px-6 text-center',
                        !introComplete && 'pointer-events-none',
                    )}
                >
                    <img
                        src="/images/brand/aura-symbol-icon.png"
                        alt=""
                        className="h-12 w-12"
                    />
                    <span className="font-serif text-3xl tracking-[0.15em] text-aura-cream uppercase sm:text-4xl">
                        AuraLeve
                    </span>
                    <span className="font-serif text-base text-aura-rose italic">
                        com alma e significado
                    </span>
                </div>

                <div className="absolute right-6 bottom-8 hidden h-28 w-28 text-aura-cream/50 sm:block lg:right-10">
                    <RotatingBadge
                        text="✦ PEÇAS ARTESANAIS ✦ CRISTAIS NATURAIS ✦ "
                        className="h-full w-full"
                    />
                    <img
                        src="/images/brand/aura-symbol-icon.png"
                        alt=""
                        className="absolute inset-0 m-auto h-9 w-9 opacity-90"
                    />
                </div>

                {/* The invitation to take over, once the opening is playing
                    and before the brand starts consolidating. */}
                <div
                    className={cn(
                        'absolute inset-x-0 bottom-8 flex flex-col items-center gap-2 transition-opacity duration-500',
                        introComplete || showMark
                            ? 'pointer-events-none opacity-0'
                            : 'opacity-100',
                    )}
                >
                    <span className="text-[11px] tracking-[0.2em] text-aura-cream/40 uppercase">
                        Deslize para entrar
                    </span>
                    <ChevronDown className="h-4 w-4 animate-bounce text-aura-cream/40" />
                </div>
            </div>
        </section>
    );
}

/* -------------------------------------------------------------------------- */
/*  Home hero — "Acessórios Autorais" (first real screen after the intro)     */
/* -------------------------------------------------------------------------- */

export function HomeHero() {
    return (
        <section id="home" className="scroll-mt-24 bg-aura-cream">
            <Reveal className="mx-auto max-w-md px-6 pt-16 pb-10 text-center sm:max-w-2xl sm:pt-24">
                <h2 className="font-serif text-4xl leading-[1.05] tracking-[0.02em] text-aura-plum uppercase sm:text-5xl">
                    Acessórios
                    <br />
                    Autorais
                </h2>
                <p className="mt-3 font-serif text-lg text-aura-plum/60 italic">
                    com alma e significado
                </p>
                <Button
                    asChild
                    size="lg"
                    className="mt-7 rounded-full bg-aura-gold px-8 text-aura-plum-deep hover:bg-aura-gold/90"
                >
                    <a href="#colecao">Conheça as Coleções</a>
                </Button>
            </Reveal>

            <Reveal
                delay={100}
                className="aspect-[4/5] w-full overflow-hidden sm:aspect-[21/9]"
            >
                <img
                    src="/images/products/japamala/japamala-06-completa.png"
                    alt="Japamala AuraLeve sobre pedra, com borla vermelha"
                    className="h-full w-full object-cover"
                />
            </Reveal>
        </section>
    );
}

/* -------------------------------------------------------------------------- */
/*  Pillars                                                                    */
/* -------------------------------------------------------------------------- */

const PILLARS = [
    { icon: Gem, label: 'Pedras Naturais' },
    { icon: Sparkles, label: 'Energia e Intenção' },
    { icon: Hand, label: 'Feito à Mão' },
];

export function Pillars() {
    return (
        <section className="border-y border-aura-plum/10 bg-aura-cream px-6 py-8">
            <Reveal className="mx-auto grid max-w-md grid-cols-3 gap-4 text-center sm:max-w-2xl">
                {PILLARS.map((item) => (
                    <div
                        key={item.label}
                        className="flex flex-col items-center gap-2"
                    >
                        <item.icon
                            className="h-6 w-6 text-aura-plum/70"
                            strokeWidth={1.5}
                        />
                        <span className="text-xs leading-tight tracking-wide text-aura-plum/60 uppercase">
                            {item.label}
                        </span>
                    </div>
                ))}
            </Reveal>
        </section>
    );
}

/* -------------------------------------------------------------------------- */
/*  Escolha Sua Intenção                                                       */
/* -------------------------------------------------------------------------- */

const INTENTIONS = ['Japamalas', 'Colares', 'Pulseiras', 'Patuás', '7 Nós'];

export function ChooseIntention() {
    return (
        <section
            id="intencao"
            className="scroll-mt-24 bg-aura-cream px-6 py-10"
        >
            <Reveal className="mx-auto max-w-6xl">
                <h2 className="text-sm font-semibold tracking-[0.15em] text-aura-plum uppercase">
                    Escolha Sua Intenção
                </h2>
                <div className="mt-5 flex [scrollbar-width:none] gap-4 overflow-x-auto pb-2 [&::-webkit-scrollbar]:hidden">
                    {INTENTIONS.map((label) => (
                        <a
                            key={label}
                            href="#colecao"
                            className="flex shrink-0 flex-col items-center gap-2"
                        >
                            <span className="flex h-20 w-16 items-center justify-center rounded-full bg-aura-cream-dark/50">
                                <img
                                    src="/images/brand/aura-symbol-icon.png"
                                    alt=""
                                    className="h-8 w-8 opacity-80"
                                />
                            </span>
                            <span className="text-xs text-aura-plum/70">
                                {label}
                            </span>
                        </a>
                    ))}
                </div>
            </Reveal>
        </section>
    );
}

/* -------------------------------------------------------------------------- */
/*  Mais Vendidos                                                             */
/* -------------------------------------------------------------------------- */

const BEST_SELLERS = [
    {
        name: 'Japamala 108 Contas',
        price: 'R$ 219,90',
        image: '/images/products/japamala/japamala-01-hero.jpg',
    },
    {
        name: 'Pulseira Pedra Natural',
        price: 'R$ 99,90',
        image: '/images/products/pulseira-pedra-natural.jpg',
    },
    {
        name: 'Colar Pedra Natural',
        price: 'R$ 189,90',
        image: '/images/products/colar-pedra-natural.jpg',
    },
];

// Last content section before the footer, so it carries a little more bottom
// room than the blocks stacked above it.
export function BestSellers() {
    return (
        <section
            id="colecao"
            className="scroll-mt-24 bg-aura-cream px-6 pt-10 pb-16"
        >
            <Reveal className="mx-auto max-w-6xl">
                <div className="flex items-center justify-between">
                    <h2 className="text-sm font-semibold tracking-[0.15em] text-aura-plum uppercase">
                        Mais Vendidos
                    </h2>
                    <a
                        href="#colecao"
                        className="flex items-center gap-1 text-xs text-aura-plum/60"
                    >
                        Ver todos <ArrowRight className="h-3 w-3" />
                    </a>
                </div>
                <div className="mt-5 grid grid-cols-3 gap-3 sm:gap-4">
                    {BEST_SELLERS.map((item) => (
                        <a key={item.name} href="#colecao" className="group">
                            <div className="aspect-square overflow-hidden rounded-2xl bg-aura-cream-dark">
                                <img
                                    src={item.image}
                                    alt={item.name}
                                    loading="lazy"
                                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                                />
                            </div>
                            <p className="mt-2 truncate text-xs text-aura-plum/70">
                                {item.name}
                            </p>
                            <p className="text-xs font-medium text-aura-plum">
                                {item.price}
                            </p>
                        </a>
                    ))}
                </div>
            </Reveal>
        </section>
    );
}

/* -------------------------------------------------------------------------- */
/*  Bottom navigation (mobile)                                                */
/* -------------------------------------------------------------------------- */

export function BottomNav({ auth }: { auth: Auth }) {
    return (
        <nav
            className="fixed inset-x-0 bottom-0 z-40 flex items-stretch justify-around border-t border-aura-plum/10 bg-aura-cream/95 pt-2 backdrop-blur-md md:hidden"
            style={{
                paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom))',
            }}
        >
            <a
                href="#inicio"
                className="flex flex-1 flex-col items-center gap-1 py-1 text-aura-gold"
            >
                <HomeIcon className="h-5 w-5" strokeWidth={1.75} />
                <span className="text-[10px] tracking-wide">Início</span>
            </a>
            <a
                href="#colecao"
                className="flex flex-1 flex-col items-center gap-1 py-1 text-aura-plum/50"
            >
                <ShoppingBag className="h-5 w-5" strokeWidth={1.5} />
                <span className="text-[10px] tracking-wide">Shop</span>
            </a>
            <a
                href="#colecao"
                className="flex flex-1 flex-col items-center gap-1 py-1 text-aura-plum/50"
            >
                <Heart className="h-5 w-5" strokeWidth={1.5} />
                <span className="text-[10px] tracking-wide">Favoritos</span>
            </a>
            <Link
                href={auth.user ? dashboard() : login()}
                className="flex flex-1 flex-col items-center gap-1 py-1 text-aura-plum/50"
            >
                <User className="h-5 w-5" strokeWidth={1.5} />
                <span className="text-[10px] tracking-wide">Conta</span>
            </Link>
            <a
                href="#contato"
                className="flex flex-1 flex-col items-center gap-1 py-1 text-aura-plum/50"
            >
                <Menu className="h-5 w-5" strokeWidth={1.5} />
                <span className="text-[10px] tracking-wide">Menu</span>
            </a>
        </nav>
    );
}

/* -------------------------------------------------------------------------- */
/*  Footer                                                                    */
/* -------------------------------------------------------------------------- */

const FOOTER_COLUMNS = [
    {
        title: 'Loja',
        links: ['Japamalas', 'Colares', 'Pulseiras', 'Patuás', '7 Nós'],
    },
    {
        title: 'Ateliê',
        links: ['Sobre Nós', 'Como Trabalhamos'],
    },
    {
        title: 'Ajuda',
        links: [
            'Perguntas Frequentes',
            'Trocas e Devoluções',
            'Cuidados com as Peças',
        ],
    },
];

export function Footer() {
    return (
        <footer id="contato" className="bg-aura-plum-deep px-6 pt-20">
            <div className="mx-auto max-w-6xl">
                <div className="flex flex-col gap-8 border-b border-aura-cream/10 pb-16 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <Eyebrow dark>Fique por dentro</Eyebrow>
                        <h3 className="mt-4 max-w-sm font-serif text-2xl text-aura-cream sm:text-3xl">
                            Novidades & conteúdo sobre cristais
                        </h3>
                    </div>
                    <form
                        onSubmit={(e) => e.preventDefault()}
                        className="flex w-full max-w-sm items-center gap-2 rounded-full border border-aura-cream/15 bg-aura-cream/5 p-1.5"
                    >
                        <input
                            type="email"
                            required
                            placeholder="seu@email.com"
                            className="min-w-0 flex-1 bg-transparent px-4 text-sm text-aura-cream placeholder:text-aura-cream/35 focus:outline-none"
                        />
                        <Button
                            type="submit"
                            size="sm"
                            className="shrink-0 rounded-full bg-aura-cream text-aura-plum-deep hover:bg-aura-cream/90"
                        >
                            Assinar
                        </Button>
                    </form>
                </div>

                <div className="grid grid-cols-2 gap-10 py-16 sm:grid-cols-4">
                    <div>
                        <div className="flex items-center gap-2.5">
                            <img
                                src="/images/brand/aura-symbol-icon.png"
                                alt=""
                                className="h-8 w-8"
                            />
                            <span className="font-serif text-base tracking-[0.15em] text-aura-cream">
                                AURALEVE
                            </span>
                        </div>
                        <p className="mt-4 max-w-[16rem] text-sm text-aura-cream/45 italic">
                            Acessórios autorais — com alma e significado.
                        </p>
                        <div className="mt-5 flex gap-3">
                            <a
                                href="#"
                                aria-label="Instagram"
                                className="flex h-9 w-9 items-center justify-center rounded-full border border-aura-cream/15 text-aura-cream/70 transition-colors hover:border-aura-cream/40 hover:text-aura-cream"
                            >
                                <Instagram className="h-4 w-4" />
                            </a>
                            <a
                                href="#"
                                aria-label="WhatsApp"
                                className="flex h-9 w-9 items-center justify-center rounded-full border border-aura-cream/15 text-aura-cream/70 transition-colors hover:border-aura-cream/40 hover:text-aura-cream"
                            >
                                <MessageCircle className="h-4 w-4" />
                            </a>
                        </div>
                    </div>

                    {FOOTER_COLUMNS.map((col) => (
                        <div key={col.title}>
                            <h4 className="text-xs font-medium tracking-[0.2em] text-aura-cream/40 uppercase">
                                {col.title}
                            </h4>
                            <ul className="mt-4 space-y-3">
                                {col.links.map((link) => (
                                    <li key={link}>
                                        <a
                                            href="#"
                                            className="text-sm text-aura-cream/60 transition-colors hover:text-aura-cream"
                                        >
                                            {link}
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>

                <div className="flex flex-col gap-4 border-t border-aura-cream/10 py-8 text-xs text-aura-cream/40 sm:flex-row sm:items-center sm:justify-between">
                    <span>
                        © {new Date().getFullYear()} AuraLeve. Todos os direitos
                        reservados.
                    </span>
                    <div className="flex gap-6">
                        <a href="#" className="hover:text-aura-cream/70">
                            Política de Privacidade
                        </a>
                        <a href="#" className="hover:text-aura-cream/70">
                            Termos de Uso
                        </a>
                    </div>
                </div>

                <div className="border-t border-aura-cream/10 py-10 text-center">
                    <p className="mb-4 text-xs tracking-[0.3em] text-aura-cream/25 uppercase">
                        Minimalista · Sofisticado · Leve · Autoral
                    </p>
                    <span className="font-serif text-[13vw] leading-none tracking-[0.04em] text-aura-cream/10 uppercase sm:text-8xl">
                        AuraLeve
                    </span>
                </div>
            </div>
        </footer>
    );
}
