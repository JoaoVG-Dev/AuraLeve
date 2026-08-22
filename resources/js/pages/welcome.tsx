import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    ArrowRight,
    Check,
    ChevronDown,
    Menu,
    Minus,
    Plus,
    Search,
    ShoppingBag,
    Trash2,
    UserRound,
    X,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

import {
    BeadsIcon,
    FlameIcon,
    HandIcon,
    HeartIcon,
    TruckIcon,
} from '@/components/auraleve-icons';
import {
    brand,
    brl,
    cartCount,
    cartSubtotal,
    categories,
    getProduct,
    intentions,
    products,
} from '@/data/auraleve';
import type { CartRow, Product } from '@/data/auraleve';

type StorefrontUser = {
    name: string;
    email: string;
};

type PageProps = {
    products?: Product[];
    auth?: {
        user: StorefrontUser | null;
    };
    can?: {
        accessAdmin?: boolean;
    };
};

const CART_KEY = 'auraleve.cart';

const readStoredCart = (): CartRow[] => {
    if (typeof window === 'undefined') {
        return [];
    }

    try {
        const parsed = JSON.parse(
            window.localStorage.getItem(CART_KEY) ?? '[]',
        );

        if (!Array.isArray(parsed)) {
            return [];
        }

        return parsed
            .map((row) => ({
                id: String(row.id),
                qty: Number(row.qty),
            }))
            .filter(
                (row) => row.id && Number.isInteger(row.qty) && row.qty > 0,
            );
    } catch {
        return [];
    }
};

const cx = (...classes: Array<string | false | null | undefined>) =>
    classes.filter(Boolean).join(' ');

export default function Welcome() {
    const { auth, can, products: serverProducts } = usePage<PageProps>().props;
    const catalog = serverProducts?.length ? serverProducts : products;
    const user = auth?.user ?? null;
    const canAccessAdmin = can?.accessAdmin ?? false;
    const [pastHero, setPastHero] = useState(false);
    const [cart, setCart] = useState<CartRow[]>(readStoredCart);
    const [cartOpen, setCartOpen] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);
    const [cat, setCat] = useState('Todas');
    const [query, setQuery] = useState('');
    const [favs, setFavs] = useState<Record<string, boolean>>({ p3: true });
    const [toast, setToast] = useState('');
    const [email, setEmail] = useState('');
    const [subscribed, setSubscribed] = useState('');
    const [activeProduct, setActiveProduct] = useState<Product | null>(null);
    const [productQty, setProductQty] = useState(1);

    useEffect(() => {
        const onScroll = () =>
            setPastHero(window.scrollY > window.innerHeight * 0.72);
        onScroll();
        window.addEventListener('scroll', onScroll, { passive: true });

        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    useEffect(() => {
        if (!toast) {
            return;
        }

        const timer = window.setTimeout(() => setToast(''), 2200);

        return () => window.clearTimeout(timer);
    }, [toast]);

    useEffect(() => {
        window.localStorage.setItem(CART_KEY, JSON.stringify(cart));
    }, [cart]);

    const validCart = useMemo(
        () =>
            cart.filter((row) =>
                catalog.some((product) => product.id === row.id),
            ),
        [cart, catalog],
    );

    const visibleProducts = useMemo(() => {
        const cleanQuery = query.trim().toLowerCase();

        return catalog.filter((product) => {
            const matchesCat = cat === 'Todas' || product.cat === cat;
            const matchesQuery =
                !cleanQuery ||
                `${product.name} ${product.stone} ${product.cat}`
                    .toLowerCase()
                    .includes(cleanQuery);

            return matchesCat && matchesQuery;
        });
    }, [cat, query, catalog]);

    const count = cartCount(validCart);
    const subtotal = cartSubtotal(validCart, catalog);

    const showToast = (message: string) => setToast(message);

    const addToCart = (product: Product, qty = 1) => {
        if ((product.stock ?? 1) <= 0) {
            showToast('Essa peça está sem estoque no momento');

            return;
        }

        setCart((current) => {
            const index = current.findIndex((row) => row.id === product.id);
            const maxQty = product.stock ?? 99;

            if (index === -1) {
                return [
                    ...current,
                    { id: product.id, qty: Math.min(qty, maxQty) },
                ];
            }

            return current.map((row) =>
                row.id === product.id
                    ? { ...row, qty: Math.min(maxQty, row.qty + qty) }
                    : row,
            );
        });

        showToast(`${product.name} na sacola`);
    };

    const updateQty = (id: string, delta: number) => {
        setCart((current) =>
            current.map((row) => {
                const product = getProduct(row.id, catalog);
                const maxQty = product.stock ?? 99;

                return row.id === id
                    ? {
                          ...row,
                          qty: Math.min(maxQty, Math.max(1, row.qty + delta)),
                      }
                    : row;
            }),
        );
    };

    const removeFromCart = (id: string) => {
        setCart((current) => current.filter((row) => row.id !== id));
        showToast('Item removido');
    };

    const toggleFav = (product: Product) => {
        setFavs((current) => ({
            ...current,
            [product.id]: !current[product.id],
        }));
        showToast(
            favs[product.id] ? 'Removido dos favoritos' : 'Salvo nos favoritos',
        );
    };

    const openProduct = (product: Product) => {
        setProductQty(1);
        setActiveProduct(product);
    };

    const subscribe = () => {
        if (!/^[^@\s]+@[^@\s]+\.[a-z]{2,}$/i.test(email.trim())) {
            showToast('Confira o e-mail');

            return;
        }

        setSubscribed('Pronto! Sua primeira carta chega em breve.');
        setEmail('');
    };

    return (
        <>
            <Head title="AuraLeve">
                <meta
                    name="description"
                    content="Acessórios autorais feitos à mão com pedras naturais."
                />
            </Head>

            <main className="aura-body min-h-screen overflow-x-hidden bg-[#fdfaf4] text-[#26221e]">
                <StoreNav
                    count={count}
                    menuOpen={menuOpen}
                    pastHero={pastHero}
                    user={user}
                    onCart={() => setCartOpen(true)}
                    onMenu={() => setMenuOpen(true)}
                />

                <Hero />
                <Marquee />

                <section
                    id="atelie"
                    className="mx-auto grid max-w-6xl gap-11 px-5 py-20 md:grid-cols-[1.02fr_.98fr] md:items-center md:gap-16 md:px-10 md:py-28"
                >
                    <div>
                        <Kicker>O ATELIÊ</Kicker>
                        <h2 className="aura-display mt-5 text-3xl leading-tight text-[#26221e] md:text-5xl">
                            Cada peça nasce de uma intenção, não de uma linha de
                            produção.
                        </h2>
                        <p className="mt-6 max-w-xl text-[15.5px] leading-8 text-[#5c554d] md:text-base">
                            Escolhemos as pedras uma a uma, sentimos o peso na
                            mão e montamos no fio até o desenho ficar em pé
                            sozinho. Quando a sua peça sai daqui, ela já passou
                            por três pares de mãos e uma limpeza energética.
                        </p>
                        <div className="mt-10 grid grid-cols-3 gap-5">
                            {[
                                ['7', 'ANOS DE ATELIÊ'],
                                ['2.4k', 'PEÇAS ENTREGUES'],
                                ['100%', 'FEITO À MÃO'],
                            ].map(([value, label]) => (
                                <div key={label}>
                                    <div className="aura-display text-3xl leading-none text-[#b0813c] md:text-4xl">
                                        {value}
                                    </div>
                                    <div className="mt-2 text-[10px] tracking-[.1em] text-[#8a8178] md:text-xs">
                                        {label}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="relative">
                        <div className="h-[390px] overflow-hidden rounded-t-[180px] rounded-b-[22px] bg-[#efe7d9] md:h-[560px] md:rounded-t-[250px] md:rounded-b-[26px]">
                            <img
                                src={brand.splashHands}
                                alt="Mãos montando uma peça AuraLeve"
                                className="h-full w-full object-cover"
                            />
                        </div>
                        <div className="absolute -bottom-6 left-2 h-32 w-32 overflow-hidden rounded-full bg-[#e4d7bf] shadow-[0_22px_48px_rgba(60,44,22,.22)] md:bottom-12 md:-left-12 md:h-44 md:w-44">
                            <img
                                src={brand.detailHands}
                                alt="Detalhe de pedra natural"
                                className="h-full w-full object-cover"
                            />
                        </div>
                    </div>
                </section>

                <section id="colecoes" className="bg-[#f6efe2] py-20 md:py-28">
                    <div className="mx-auto max-w-6xl px-5 md:px-10">
                        <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
                            <div>
                                <Kicker>COLEÇÕES</Kicker>
                                <h2 className="aura-display mt-4 text-3xl leading-tight md:text-4xl">
                                    Três caminhos, uma mesma origem
                                </h2>
                            </div>
                            <a
                                href="#pecas"
                                className="inline-flex items-center gap-2 text-xs tracking-[.14em] text-[#a97b34]"
                            >
                                VER TODAS AS PEÇAS
                                <ArrowRight size={15} />
                            </a>
                        </div>

                        <div className="mt-10 grid gap-5 md:grid-cols-3">
                            {[
                                {
                                    title: 'Japamalas',
                                    body: '108 contas para a sua prática diária',
                                    image:
                                        catalog[0].detailImage ??
                                        catalog[0].image,
                                    filter: 'Japamalas',
                                },
                                {
                                    title: 'Colares',
                                    body: 'Pedras que ficam perto do coração',
                                    image: catalog[2].image,
                                    filter: 'Colares',
                                },
                                {
                                    title: 'Pulseiras & Patuás',
                                    body: 'Proteção que você leva no punho',
                                    image: catalog[4].image,
                                    filter: 'Pulseiras',
                                },
                            ].map((collection) => (
                                <a
                                    href="#pecas"
                                    key={collection.title}
                                    className="group relative h-[360px] overflow-hidden rounded-[24px] bg-[#e7ded0] md:h-[460px]"
                                    onClick={() => setCat(collection.filter)}
                                >
                                    <img
                                        src={collection.image}
                                        alt=""
                                        className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[rgba(24,18,12,.84)]" />
                                    <div className="absolute right-6 bottom-6 left-6">
                                        <div className="aura-display text-2xl text-[#fbf3e6]">
                                            {collection.title}
                                        </div>
                                        <div className="mt-2 text-sm leading-6 text-[rgba(246,236,219,.74)]">
                                            {collection.body}
                                        </div>
                                    </div>
                                </a>
                            ))}
                        </div>
                    </div>
                </section>

                <section
                    id="intencoes"
                    className="mx-auto max-w-6xl px-5 py-20 text-center md:px-10 md:py-28"
                >
                    <Kicker>ESCOLHA SUA INTENÇÃO</Kicker>
                    <h2 className="aura-display mx-auto mt-4 max-w-2xl text-3xl leading-tight md:text-4xl">
                        O que você quer chamar para perto?
                    </h2>
                    <div className="aura-hide-scrollbar mt-10 flex gap-5 overflow-x-auto pb-2 md:flex-wrap md:justify-center md:gap-8">
                        {intentions.map((intention) => (
                            <button
                                key={intention.label}
                                type="button"
                                className="group flex w-[118px] flex-none flex-col items-center gap-4"
                                onClick={() =>
                                    showToast(
                                        `Filtrando por ${intention.label}`,
                                    )
                                }
                            >
                                <span className="grid h-[92px] w-[92px] place-items-center rounded-full bg-[#f4ebda] text-[#b0813c] transition group-hover:-translate-y-1 group-hover:bg-[#ecdfc4] group-hover:shadow-[0_16px_32px_rgba(90,68,32,.16)] md:h-[118px] md:w-[118px]">
                                    <BeadsIcon size={38} />
                                </span>
                                <span className="aura-display text-base">
                                    {intention.label}
                                </span>
                                <span className="hidden text-xs leading-5 text-[#8a8178] md:block">
                                    {intention.note}
                                </span>
                            </button>
                        ))}
                    </div>
                </section>

                <section id="pecas" className="bg-[#fffdf9] py-20 md:py-28">
                    <div className="mx-auto max-w-6xl px-5 md:px-10">
                        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
                            <div>
                                <Kicker>PEÇAS</Kicker>
                                <h2 className="aura-display mt-4 text-3xl leading-tight md:text-4xl">
                                    Escolha pelo que toca primeiro
                                </h2>
                            </div>
                            <div className="relative w-full md:w-80">
                                <Search
                                    className="absolute top-1/2 right-4 -translate-y-1/2 text-[#a89d8c]"
                                    size={17}
                                />
                                <input
                                    value={query}
                                    onChange={(event) =>
                                        setQuery(event.target.value)
                                    }
                                    placeholder="Buscar produtos..."
                                    className="h-12 w-full rounded-full border border-[#e6dcc9] bg-[#fdfaf4] pr-11 pl-5 text-sm outline-none focus:border-[#b0813c]"
                                />
                            </div>
                        </div>

                        <div className="aura-hide-scrollbar mt-7 flex gap-2 overflow-x-auto pb-1">
                            {categories.map((name) => (
                                <button
                                    key={name}
                                    type="button"
                                    onClick={() => setCat(name)}
                                    className={cx(
                                        'flex-none rounded-full border px-5 py-2.5 text-xs tracking-[.1em] transition',
                                        cat === name
                                            ? 'border-[#b0813c] bg-[#b0813c] text-[#fffdf8]'
                                            : 'border-[#e2d7c2] bg-[#fffdf9] text-[#5c554d] hover:border-[#c9b48c] hover:bg-[#f6efe2]',
                                    )}
                                >
                                    {name.toUpperCase()}
                                </button>
                            ))}
                        </div>

                        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                            {visibleProducts.map((product) => (
                                <ProductCard
                                    key={product.id}
                                    fav={!!favs[product.id]}
                                    product={product}
                                    onAdd={() => addToCart(product)}
                                    onFav={() => toggleFav(product)}
                                    onOpen={() => openProduct(product)}
                                />
                            ))}
                        </div>

                        {visibleProducts.length === 0 && (
                            <div className="mt-14 rounded-[22px] border border-[#ece3d2] bg-[#fdfaf4] px-6 py-10 text-center text-[#8a8178]">
                                Nenhuma peça encontrada com esse filtro.
                            </div>
                        )}
                    </div>
                </section>

                <section className="bg-[#26221e] py-20 text-[#f6ecdb] md:py-28">
                    <div className="mx-auto max-w-6xl px-5 md:px-10">
                        <Kicker light>COMO SUA PEÇA CHEGA ATÉ VOCÊ</Kicker>
                        <div className="mt-10 grid gap-8 md:grid-cols-4">
                            {[
                                [
                                    '01',
                                    'Você escolhe a intenção',
                                    'A pedra vem depois. Primeiro entendemos o que você quer chamar para perto.',
                                ],
                                [
                                    '02',
                                    'Montamos à mão',
                                    'Fio por fio, no ateliê, com as pedras selecionadas uma a uma naquele lote.',
                                ],
                                [
                                    '03',
                                    'Limpeza e energização',
                                    'Cada peça passa por defumação antes de ser embalada.',
                                ],
                                [
                                    '04',
                                    'Chega até você',
                                    'Embalagem de presente, carta com o significado da pedra e envio rastreado.',
                                ],
                            ].map(([num, title, body]) => (
                                <div
                                    key={num}
                                    className="border-t border-[rgba(246,236,219,.18)] pt-6"
                                >
                                    <div className="aura-display text-sm tracking-[.16em] text-[#d8ab5c]">
                                        {num}
                                    </div>
                                    <h3 className="aura-display mt-4 text-[22px] leading-tight">
                                        {title}
                                    </h3>
                                    <p className="mt-3 text-sm leading-7 text-[rgba(246,236,219,.62)]">
                                        {body}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                <section className="mx-auto max-w-6xl px-5 py-20 md:px-10 md:py-28">
                    <div className="relative overflow-hidden rounded-[28px] bg-[#f4ebda] px-6 py-14 text-center md:rounded-[36px] md:px-14 md:py-20">
                        <img
                            src={brand.symbol}
                            alt=""
                            className="pointer-events-none absolute -top-16 -right-16 w-56 opacity-[.12]"
                        />
                        <h2 className="aura-display mx-auto max-w-2xl text-3xl leading-tight md:text-4xl">
                            Receba as peças novas antes de todo mundo
                        </h2>
                        <p className="mx-auto mt-5 max-w-lg text-[15px] leading-8 text-[#5c554d]">
                            Uma carta por mês: lançamentos, o significado de
                            cada pedra e rituais simples para usar no dia a dia.
                        </p>
                        <div className="mx-auto mt-8 flex max-w-xl flex-col gap-3 sm:flex-row">
                            <input
                                value={email}
                                onChange={(event) => {
                                    setEmail(event.target.value);
                                    setSubscribed('');
                                }}
                                placeholder="seu@email.com"
                                className="h-14 min-w-0 flex-1 rounded-full border border-[#ddd0b7] bg-[#fffdf9] px-6 text-[15px] outline-none focus:border-[#b0813c]"
                            />
                            <button
                                type="button"
                                onClick={subscribe}
                                className="h-14 rounded-full bg-[#b0813c] px-8 text-xs tracking-[.14em] text-[#fffdf8] transition hover:-translate-y-0.5 hover:bg-[#96702f]"
                            >
                                QUERO RECEBER
                            </button>
                        </div>
                        {subscribed && (
                            <div className="mt-4 text-sm text-[#6f8a4e]">
                                {subscribed}
                            </div>
                        )}
                    </div>
                </section>

                <StoreFeatureStrip />
                <Footer />

                <CartDrawer
                    cart={validCart}
                    catalog={catalog}
                    open={cartOpen}
                    subtotal={subtotal}
                    onClose={() => setCartOpen(false)}
                    onDec={(id) => updateQty(id, -1)}
                    onInc={(id) => updateQty(id, 1)}
                    onRemove={removeFromCart}
                />

                <AccountMenu
                    canAccessAdmin={canAccessAdmin}
                    count={count}
                    favs={favs}
                    open={menuOpen}
                    user={user}
                    onCart={() => {
                        setMenuOpen(false);
                        setCartOpen(true);
                    }}
                    onClose={() => setMenuOpen(false)}
                    onLogout={() => {
                        setMenuOpen(false);
                        router.post('/logout');
                    }}
                />

                {activeProduct && (
                    <ProductSheet
                        fav={!!favs[activeProduct.id]}
                        product={activeProduct}
                        qty={productQty}
                        onAdd={() => addToCart(activeProduct, productQty)}
                        onBuy={() => {
                            addToCart(activeProduct, productQty);
                            setActiveProduct(null);
                            setCartOpen(true);
                        }}
                        onClose={() => setActiveProduct(null)}
                        onFav={() => toggleFav(activeProduct)}
                        onQtyDown={() =>
                            setProductQty((value) => Math.max(1, value - 1))
                        }
                        onQtyUp={() =>
                            setProductQty((value) =>
                                Math.min(activeProduct.stock ?? 9, value + 1),
                            )
                        }
                    />
                )}

                {toast && <Toast>{toast}</Toast>}
            </main>
        </>
    );
}

function StoreNav({
    count,
    menuOpen,
    pastHero,
    user,
    onCart,
    onMenu,
}: {
    count: number;
    menuOpen: boolean;
    pastHero: boolean;
    user: StorefrontUser | null;
    onCart: () => void;
    onMenu: () => void;
}) {
    return (
        <header
            className={cx(
                'fixed inset-x-0 top-0 z-40 transition duration-300',
                pastHero
                    ? 'bg-[rgba(253,250,244,.94)] text-[#26221e] shadow-[0_1px_0_rgba(38,34,30,.08)] backdrop-blur-md'
                    : 'bg-transparent text-[#f6ecdb]',
            )}
        >
            <div className="flex h-16 items-center justify-between px-4 md:h-[72px] md:px-10">
                <nav className="hidden flex-1 items-center gap-8 text-xs tracking-[.14em] md:flex">
                    <a href="#colecoes">COLEÇÕES</a>
                    <a href="#atelie">O ATELIÊ</a>
                    <a href="#pecas">PEÇAS</a>
                </nav>

                <a href="#top" className="flex items-center gap-3">
                    <img
                        src={brand.symbol}
                        alt="AuraLeve"
                        className={cx(
                            'h-9 w-auto md:h-7',
                            !pastHero &&
                                'drop-shadow-[0_3px_10px_rgba(0,0,0,.45)]',
                        )}
                    />
                    <span className="aura-display hidden text-lg tracking-[.2em] md:inline">
                        AURALEVE
                    </span>
                </a>

                <div className="flex flex-1 items-center justify-end gap-3 md:gap-5">
                    <button
                        type="button"
                        onClick={onCart}
                        className={cx(
                            'relative inline-flex h-11 items-center gap-2 rounded-full border px-4 text-xs tracking-[.12em] transition md:px-5',
                            pastHero
                                ? 'border-[#26221e] bg-[#26221e] text-[#f6ecdb]'
                                : 'border-[rgba(246,236,219,.55)] bg-[rgba(255,253,249,.12)] text-[#f6ecdb] backdrop-blur-md',
                        )}
                        aria-label="Abrir sacola"
                    >
                        <ShoppingBag size={16} />
                        <span className="hidden sm:inline">SACOLA</span>
                        <span>({count})</span>
                    </button>

                    {user ? (
                        <button
                            type="button"
                            onClick={onMenu}
                            aria-expanded={menuOpen}
                            aria-label="Menu da conta"
                            className="hidden h-11 items-center gap-2 rounded-full bg-[#26221e] px-3 text-[#f6ecdb] shadow-[0_6px_18px_rgba(38,34,30,.24)] md:inline-flex"
                        >
                            <UserRound size={16} />
                            <span className="text-xs tracking-[.14em]">
                                MINHA CONTA
                            </span>
                        </button>
                    ) : (
                        <Link
                            href="/login"
                            className="hidden text-xs tracking-[.14em] md:inline-flex"
                        >
                            ENTRAR
                        </Link>
                    )}

                    <button
                        type="button"
                        onClick={onMenu}
                        aria-label="Menu"
                        className="grid h-11 w-11 place-items-center rounded-full bg-[#26221e] text-[#f6ecdb] md:hidden"
                    >
                        <Menu size={19} />
                    </button>
                </div>
            </div>
        </header>
    );
}

function Hero() {
    return (
        <section
            id="top"
            className="relative flex min-h-[700px] items-center justify-center overflow-hidden bg-[#17130f] px-6 text-center text-[#f6ecdb]"
        >
            <img
                src={brand.homeHero}
                alt=""
                className="absolute inset-0 h-full w-full object-cover object-[54%_42%] brightness-[.58] saturate-[.95]"
            />
            <div className="absolute inset-0 bg-[radial-gradient(120%_90%_at_50%_40%,rgba(18,13,9,.28)_0%,rgba(18,13,9,.72)_70%,rgba(18,13,9,.94)_100%)]" />
            <div className="relative z-10 flex max-w-2xl flex-col items-center">
                <img
                    src={brand.symbol}
                    alt=""
                    className="h-28 w-auto drop-shadow-[0_6px_22px_rgba(0,0,0,.5)]"
                />
                <h1 className="aura-display mt-8 text-5xl leading-none tracking-[.16em] text-[#e0b866] md:text-7xl">
                    AURALEVE
                </h1>
                <p className="aura-display mt-5 text-2xl leading-snug tracking-[.06em] md:text-4xl">
                    Sinta a energia que te conecta
                </p>
                <p className="mt-5 max-w-lg text-[15px] leading-8 text-[rgba(240,229,212,.78)] md:text-base">
                    Acessórios autorais feitos à mão com pedras naturais, um a
                    um, no nosso ateliê em São Paulo.
                </p>
                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                    <a
                        href="#pecas"
                        className="rounded-full bg-[#b0813c] px-8 py-4 text-xs tracking-[.14em] text-[#fffdf8] transition hover:-translate-y-0.5 hover:bg-[#c8974a]"
                    >
                        VER AS PEÇAS
                    </a>
                    <a
                        href="#atelie"
                        className="rounded-full border border-[rgba(246,236,219,.44)] px-8 py-4 text-xs tracking-[.14em] text-[#f6ecdb] transition hover:bg-[rgba(246,236,219,.12)]"
                    >
                        CONHEÇA O ATELIÊ
                    </a>
                </div>
            </div>
            <div className="absolute bottom-9 left-1/2 flex -translate-x-1/2 flex-col items-center gap-2">
                <span className="text-[10px] tracking-[.28em] text-[rgba(226,211,187,.75)]">
                    ROLE
                </span>
                <ChevronDown
                    size={22}
                    className="text-[#d8ab5c]"
                    style={{ animation: 'aura-bob 2s ease-in-out infinite' }}
                />
            </div>
        </section>
    );
}

function Marquee() {
    const words = [
        'PEDRAS NATURAIS',
        'FEITO À MÃO',
        'ENERGIA E INTENÇÃO',
        'PEÇAS ÚNICAS',
        'ENVIO PARA TODO BRASIL',
    ];

    return (
        <div className="overflow-hidden bg-[#26221e] py-5">
            <div
                className="aura-display flex w-max gap-11 text-sm tracking-[.2em] whitespace-nowrap text-[#d8ab5c]"
                style={{ animation: 'aura-marquee 34s linear infinite' }}
            >
                {[0, 1].map((round) => (
                    <div key={round} className="flex items-center gap-11 pr-11">
                        {words.map((word) => (
                            <span key={`${round}-${word}`}>
                                {word}
                                <span className="ml-11 opacity-45">✦</span>
                            </span>
                        ))}
                    </div>
                ))}
            </div>
        </div>
    );
}

function ProductCard({
    fav,
    product,
    onAdd,
    onFav,
    onOpen,
}: {
    fav: boolean;
    product: Product;
    onAdd: () => void;
    onFav: () => void;
    onOpen: () => void;
}) {
    const soldOut = (product.stock ?? 1) <= 0;

    return (
        <article>
            <button
                type="button"
                onClick={onOpen}
                className="group block w-full text-left"
            >
                <span className="relative block aspect-[4/5] overflow-hidden rounded-[18px] bg-[#efe7d9]">
                    <img
                        src={product.image}
                        alt={product.name}
                        className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                    />
                    {product.badge && (
                        <span className="absolute top-3 left-3 rounded-full bg-[#26221e] px-3 py-1 text-[10px] tracking-[.12em] text-[#f6ecdb]">
                            {product.badge}
                        </span>
                    )}
                    {soldOut && (
                        <span className="absolute bottom-3 left-3 rounded-full bg-[#a8503a] px-3 py-1 text-[10px] tracking-[.12em] text-[#fffdf8]">
                            ESGOTADO
                        </span>
                    )}
                    <span
                        role="button"
                        tabIndex={0}
                        className="absolute top-3 right-3 grid h-9 w-9 place-items-center rounded-full bg-[rgba(255,253,249,.88)] text-[#8a6b2c] shadow-sm"
                        onClick={(event) => {
                            event.stopPropagation();
                            onFav();
                        }}
                        onKeyDown={(event) => {
                            if (event.key === 'Enter' || event.key === ' ') {
                                event.preventDefault();
                                onFav();
                            }
                        }}
                        aria-label="Favoritar"
                    >
                        <HeartIcon filled={fav} size={17} />
                    </span>
                </span>
                <span className="mt-4 flex items-start justify-between gap-4">
                    <span className="min-w-0">
                        <span className="aura-display block text-lg leading-snug">
                            {product.name}
                        </span>
                        <span className="mt-1 block text-xs text-[#8a8178]">
                            {product.stone}
                        </span>
                    </span>
                    <span className="aura-display text-base whitespace-nowrap">
                        {brl(product.price)}
                    </span>
                </span>
            </button>
            <button
                type="button"
                onClick={onAdd}
                disabled={soldOut}
                className="mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-full border border-[#ded2ba] bg-[#fffdf9] text-xs tracking-[.12em] text-[#5c554d] transition hover:border-[#b0813c] hover:bg-[#f6efe2] disabled:cursor-not-allowed disabled:opacity-55"
            >
                <ShoppingBag size={15} />
                {soldOut ? 'ESGOTADO' : 'ADICIONAR'}
            </button>
        </article>
    );
}

function ProductSheet({
    fav,
    product,
    qty,
    onAdd,
    onBuy,
    onClose,
    onFav,
    onQtyDown,
    onQtyUp,
}: {
    fav: boolean;
    product: Product;
    qty: number;
    onAdd: () => void;
    onBuy: () => void;
    onClose: () => void;
    onFav: () => void;
    onQtyDown: () => void;
    onQtyUp: () => void;
}) {
    const soldOut = (product.stock ?? 1) <= 0;

    return (
        <div className="fixed inset-0 z-50 bg-[rgba(26,20,13,.44)] p-0 md:grid md:place-items-center md:p-8">
            <button
                type="button"
                aria-label="Fechar produto"
                className="absolute inset-0 cursor-default"
                onClick={onClose}
            />
            <div className="absolute inset-x-0 bottom-0 max-h-[92vh] overflow-y-auto rounded-t-[28px] bg-[#fdfaf4] shadow-[0_-24px_60px_rgba(50,36,18,.24)] md:relative md:grid md:w-full md:max-w-4xl md:grid-cols-[.9fr_1fr] md:overflow-hidden md:rounded-[26px]">
                <div className="relative aspect-square bg-[#efe7d9] md:aspect-auto">
                    <img
                        src={product.detailImage ?? product.image}
                        alt={product.name}
                        className="h-full w-full object-cover"
                    />
                    <button
                        type="button"
                        onClick={onClose}
                        className="absolute top-4 right-4 grid h-10 w-10 place-items-center rounded-full bg-[rgba(255,253,249,.9)] text-[#3d3832]"
                        aria-label="Fechar"
                    >
                        <X size={18} />
                    </button>
                </div>
                <div className="p-6 md:p-9">
                    <div className="flex items-start justify-between gap-5">
                        <div>
                            <Kicker>{product.cat}</Kicker>
                            <h2 className="aura-display mt-3 text-3xl leading-tight">
                                {product.name}
                            </h2>
                            <div className="aura-display mt-3 text-2xl text-[#26221e]">
                                {brl(product.price)}
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={onFav}
                            className="grid h-11 w-11 place-items-center rounded-full border border-[#e6dcc9] text-[#8a6b2c]"
                            aria-label="Favoritar"
                        >
                            <HeartIcon filled={fav} size={18} />
                        </button>
                    </div>
                    <p className="mt-5 text-[15px] leading-8 text-[#5c554d]">
                        {product.desc}
                    </p>
                    <div className="mt-6 grid gap-4 sm:grid-cols-2">
                        <div className="rounded-[18px] bg-[#f6efe2] p-4">
                            <div className="text-[11px] tracking-[.14em] text-[#8a8178]">
                                PEDRA
                            </div>
                            <div className="mt-2 flex items-center gap-2 text-sm">
                                <span className="h-5 w-5 rounded-full bg-[#a97b34] shadow-inner" />
                                {product.stone}
                            </div>
                        </div>
                        <div className="rounded-[18px] bg-[#f6efe2] p-4">
                            <div className="text-[11px] tracking-[.14em] text-[#8a8178]">
                                AVALIAÇÕES
                            </div>
                            <div className="mt-2 text-sm text-[#5c554d]">
                                ★★★★★ ({product.reviews})
                            </div>
                        </div>
                    </div>
                    <div className="mt-7">
                        <div className="text-[11px] tracking-[.14em] text-[#8a8178]">
                            QUANTIDADE
                        </div>
                        <div className="mt-3 inline-flex h-11 items-center overflow-hidden rounded-full border border-[#e6dcc9] bg-[#fffdf9]">
                            <button
                                type="button"
                                onClick={onQtyDown}
                                className="grid h-full w-11 place-items-center"
                                aria-label="Diminuir quantidade"
                            >
                                <Minus size={15} />
                            </button>
                            <span className="min-w-9 text-center text-sm">
                                {qty}
                            </span>
                            <button
                                type="button"
                                onClick={onQtyUp}
                                className="grid h-full w-11 place-items-center"
                                aria-label="Aumentar quantidade"
                            >
                                <Plus size={15} />
                            </button>
                        </div>
                    </div>
                    <div className="mt-7 flex flex-col gap-3">
                        <button
                            type="button"
                            onClick={onAdd}
                            disabled={soldOut}
                            className="h-14 rounded-full bg-[#b0813c] text-xs tracking-[.16em] text-[#fffdf8] transition hover:bg-[#96702f] disabled:cursor-not-allowed disabled:opacity-55"
                        >
                            {soldOut ? 'ESGOTADO' : 'ADICIONAR AO CARRINHO'}
                        </button>
                        <button
                            type="button"
                            onClick={onBuy}
                            disabled={soldOut}
                            className="h-14 rounded-full border border-[#ded2ba] text-xs tracking-[.16em] text-[#3d3832] transition hover:bg-[#f6efe2] disabled:cursor-not-allowed disabled:opacity-55"
                        >
                            COMPRAR AGORA
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

function CartDrawer({
    cart,
    catalog,
    open,
    subtotal,
    onClose,
    onDec,
    onInc,
    onRemove,
}: {
    cart: CartRow[];
    catalog: Product[];
    open: boolean;
    subtotal: number;
    onClose: () => void;
    onDec: (id: string) => void;
    onInc: (id: string) => void;
    onRemove: (id: string) => void;
}) {
    if (!open) {
        return null;
    }

    return (
        <div className="fixed inset-0 z-50 bg-[rgba(26,20,13,.44)]">
            <button
                type="button"
                className="absolute inset-0 cursor-default"
                onClick={onClose}
                aria-label="Fechar sacola"
            />
            <aside className="absolute top-0 right-0 bottom-0 flex w-full max-w-[420px] flex-col bg-[#fdfaf4] p-6 shadow-[-24px_0_60px_rgba(50,36,18,.24)] sm:w-[92vw] md:p-7">
                <div className="flex items-center justify-between">
                    <div className="aura-display text-2xl">
                        Sua sacola ({cartCount(cart)})
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="grid h-10 w-10 place-items-center rounded-full text-[#5c554d] hover:bg-[#f3ece0]"
                        aria-label="Fechar"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="mt-6 flex flex-1 flex-col gap-5 overflow-y-auto">
                    {cart.length === 0 && (
                        <div className="grid flex-1 place-items-center text-center text-sm text-[#8a8178]">
                            Sua sacola está vazia.
                        </div>
                    )}

                    {cart.map((row) => {
                        const product = getProduct(row.id, catalog);

                        return (
                            <div key={row.id} className="flex gap-4">
                                <img
                                    src={product.image}
                                    alt={product.name}
                                    className="h-24 w-20 flex-none rounded-[14px] object-cover"
                                />
                                <div className="min-w-0 flex-1">
                                    <div className="aura-display text-[17px] leading-tight">
                                        {product.name}
                                    </div>
                                    <div className="mt-1 text-sm text-[#8a8178]">
                                        {brl(product.price)}
                                    </div>
                                    <div className="mt-3 flex items-center gap-3">
                                        <span className="inline-flex h-9 items-center overflow-hidden rounded-full border border-[#e6dcc9] bg-[#fffdf9]">
                                            <button
                                                type="button"
                                                onClick={() => onDec(row.id)}
                                                className="grid h-full w-9 place-items-center"
                                                aria-label="Diminuir"
                                            >
                                                <Minus size={14} />
                                            </button>
                                            <span className="min-w-8 text-center text-sm">
                                                {row.qty}
                                            </span>
                                            <button
                                                type="button"
                                                onClick={() => onInc(row.id)}
                                                className="grid h-full w-9 place-items-center"
                                                aria-label="Aumentar"
                                            >
                                                <Plus size={14} />
                                            </button>
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => onRemove(row.id)}
                                            className="inline-flex items-center gap-1 text-xs text-[#a89d8c] hover:text-[#a8503a]"
                                        >
                                            <Trash2 size={13} />
                                            remover
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {cart.length > 0 && (
                    <div className="mt-6 border-t border-[#f0e8da] pt-5">
                        <div className="flex justify-between text-sm text-[#5c554d]">
                            <span>Subtotal</span>
                            <span>{brl(subtotal)}</span>
                        </div>
                        <div className="mt-2 text-xs text-[#8a8178]">
                            Frete calculado no checkout · até 6x sem juros
                        </div>
                        <Link
                            href="/checkout"
                            className="mt-5 inline-flex h-14 w-full items-center justify-center gap-2 rounded-full bg-[#b0813c] text-xs tracking-[.16em] text-[#fffdf8] transition hover:bg-[#96702f]"
                        >
                            IR PARA O CHECKOUT
                            <ArrowRight size={15} />
                        </Link>
                    </div>
                )}
            </aside>
        </div>
    );
}

function AccountMenu({
    canAccessAdmin,
    count,
    favs,
    open,
    user,
    onCart,
    onClose,
    onLogout,
}: {
    canAccessAdmin: boolean;
    count: number;
    favs: Record<string, boolean>;
    open: boolean;
    user: StorefrontUser | null;
    onCart: () => void;
    onClose: () => void;
    onLogout: () => void;
}) {
    if (!open) {
        return null;
    }

    const favCount = Object.values(favs).filter(Boolean).length;

    return (
        <div className="fixed inset-0 z-50 bg-[rgba(26,20,13,.44)]">
            <button
                type="button"
                className="absolute inset-0 cursor-default"
                onClick={onClose}
                aria-label="Fechar menu"
            />
            <aside className="absolute top-0 right-0 bottom-0 flex w-full max-w-[360px] flex-col bg-[#fdfaf4] p-7 shadow-[-24px_0_60px_rgba(50,36,18,.24)]">
                <div className="flex items-center justify-between gap-4">
                    <div className="flex min-w-0 items-center gap-3">
                        <span className="aura-display grid h-11 w-11 flex-none place-items-center rounded-full bg-[#f4ebda] text-[#a97b34]">
                            {user?.name.slice(0, 1).toUpperCase() ?? 'A'}
                        </span>
                        <div className="min-w-0">
                            <div className="aura-display text-lg">
                                {user
                                    ? `Olá, ${user.name.split(' ')[0]}`
                                    : 'Boa noite'}
                            </div>
                            <div className="truncate text-xs text-[#8a8178]">
                                {user?.email ?? 'Entre para acompanhar pedidos'}
                            </div>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="grid h-10 w-10 place-items-center rounded-full text-[#5c554d] hover:bg-[#f3ece0]"
                        aria-label="Fechar"
                    >
                        <X size={19} />
                    </button>
                </div>

                <div className="mt-6 h-px bg-[#f0e8da]" />

                <div className="mt-5 flex flex-col">
                    {[
                        {
                            label: 'Minha sacola',
                            meta: `${count} itens`,
                            action: onCart,
                        },
                        {
                            label: 'Meus pedidos',
                            meta: user ? '' : 'login',
                            action: onClose,
                            href: user ? '/dashboard' : '/login',
                        },
                        {
                            label: 'Favoritos',
                            meta: String(favCount),
                            action: onClose,
                        },
                        {
                            label: 'Coleções',
                            meta: '',
                            action: onClose,
                            href: '#colecoes',
                        },
                        {
                            label: 'Peças',
                            meta: '',
                            action: onClose,
                            href: '#pecas',
                        },
                    ].map((item) =>
                        item.href ? (
                            <a
                                key={item.label}
                                href={item.href}
                                onClick={item.action}
                                className="aura-display flex items-center justify-between border-b border-[#f2ebdd] py-4 text-xl text-[#26221e] hover:text-[#a97b34]"
                            >
                                {item.label}
                                <span className="aura-body text-xs text-[#b3a999]">
                                    {item.meta}
                                </span>
                            </a>
                        ) : (
                            <button
                                key={item.label}
                                type="button"
                                onClick={item.action}
                                className="aura-display flex items-center justify-between border-b border-[#f2ebdd] py-4 text-left text-xl text-[#26221e] hover:text-[#a97b34]"
                            >
                                {item.label}
                                <span className="aura-body text-xs text-[#b3a999]">
                                    {item.meta}
                                </span>
                            </button>
                        ),
                    )}
                    {canAccessAdmin && (
                        <Link
                            href="/admin"
                            className="aura-display flex items-center justify-between border-b border-[#f2ebdd] py-4 text-xl text-[#26221e] hover:text-[#a97b34]"
                        >
                            Painel do ateliê
                            <span className="aura-body text-xs text-[#b3a999]">
                                admin
                            </span>
                        </Link>
                    )}
                </div>

                {user ? (
                    <button
                        type="button"
                        onClick={onLogout}
                        className="mt-auto h-12 rounded-full border border-[#ded2ba] text-xs tracking-[.14em] text-[#5c554d] hover:bg-[#f6efe2]"
                    >
                        SAIR DA CONTA
                    </button>
                ) : (
                    <div className="mt-auto grid gap-3">
                        <Link
                            href="/login"
                            className="inline-flex h-12 items-center justify-center rounded-full bg-[#b0813c] text-xs tracking-[.14em] text-[#fffdf8]"
                        >
                            ENTRAR
                        </Link>
                        <Link
                            href="/register"
                            className="inline-flex h-12 items-center justify-center rounded-full border border-[#ded2ba] text-xs tracking-[.14em] text-[#5c554d] hover:bg-[#f6efe2]"
                        >
                            CRIAR CONTA
                        </Link>
                    </div>
                )}
            </aside>
        </div>
    );
}

function Footer() {
    return (
        <footer className="border-t border-[#ece3d2] px-5 py-12 md:px-10">
            <div className="mx-auto grid max-w-6xl gap-9 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
                <div>
                    <div className="flex items-center gap-3">
                        <img src={brand.symbol} alt="" className="h-8 w-auto" />
                        <span className="aura-display text-lg tracking-[.2em]">
                            AURALEVE
                        </span>
                    </div>
                    <p className="mt-5 max-w-xs text-sm leading-7 text-[#8a8178]">
                        Acessórios autorais com alma e significado. Feitos à mão
                        em São Paulo.
                    </p>
                </div>
                {[
                    ['LOJA', 'Japamalas', 'Colares', 'Pulseiras', 'Patuás'],
                    [
                        'AJUDA',
                        'Envio e prazos',
                        'Trocas',
                        'Como cuidar da peça',
                        'Fale com a gente',
                    ],
                    ['ONDE ESTAMOS', 'Instagram', 'WhatsApp', 'Pinterest'],
                ].map(([title, ...links]) => (
                    <div key={title}>
                        <div className="text-[11px] tracking-[.18em] text-[#a97b34]">
                            {title}
                        </div>
                        <div className="mt-4 flex flex-col gap-3 text-sm text-[#5c554d]">
                            {links.map((link) => (
                                <a
                                    key={link}
                                    href="#top"
                                    className="hover:text-[#a97b34]"
                                >
                                    {link}
                                </a>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
            <div className="mx-auto mt-12 flex max-w-6xl flex-col gap-4 border-t border-[#f2ebdd] pt-6 text-xs text-[#a89d8c] md:flex-row md:justify-between">
                <span>© 2026 Auraleve · CNPJ 00.000.000/0001-00</span>
                <span className="tracking-[.16em]">
                    MINIMALISTA · SOFISTICADO · LEVE · AUTORAL
                </span>
            </div>
        </footer>
    );
}

function Kicker({
    children,
    light = false,
}: {
    children: string;
    light?: boolean;
}) {
    return (
        <div
            className={cx(
                'text-[11px] tracking-[.22em]',
                light ? 'text-[#d8ab5c]' : 'text-[#a97b34]',
            )}
        >
            {children}
        </div>
    );
}

function Toast({ children }: { children: string }) {
    return (
        <div
            className="fixed bottom-9 left-1/2 z-[70] flex -translate-x-1/2 items-center gap-2 rounded-full bg-[#26221e] px-6 py-4 text-sm text-[#f6ecdb] shadow-[0_12px_34px_rgba(30,22,12,.34)]"
            style={{ animation: 'aura-toast .3s ease both' }}
        >
            <Check size={16} className="text-[#d8ab5c]" />
            {children}
        </div>
    );
}

function StoreFeatureStrip() {
    const features = [
        [BeadsIcon, 'PEDRAS NATURAIS', 'Selecionadas com intenção e qualidade'],
        [HandIcon, 'FEITO À MÃO', 'Cada peça é única e exclusiva'],
        [
            FlameIcon,
            'ENERGIA E INTENÇÃO',
            'Acessórios que conectam beleza e propósito',
        ],
        [TruckIcon, 'ENVIO PARA TODO BRASIL', 'Com carinho e segurança'],
    ] as const;

    return (
        <section className="bg-[#f6efe2] px-5 py-12 md:px-10">
            <div className="mx-auto grid max-w-6xl gap-4 rounded-[24px] bg-[#fffdf9] p-5 text-sm shadow-[0_20px_50px_rgba(80,58,28,.08)] md:grid-cols-4 md:p-7">
                {features.map(([Icon, title, body]) => (
                    <div key={title} className="flex items-center gap-4">
                        <span className="grid h-12 w-12 flex-none place-items-center rounded-full border border-[#e6dcc9] text-[#a97b34]">
                            <Icon size={22} />
                        </span>
                        <span>
                            <span className="block text-[11px] tracking-[.12em]">
                                {title}
                            </span>
                            <span className="mt-1 block text-xs leading-5 text-[#8a8178]">
                                {body}
                            </span>
                        </span>
                    </div>
                ))}
            </div>
        </section>
    );
}
