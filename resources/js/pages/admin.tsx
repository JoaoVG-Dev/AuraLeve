import { Head, Link, router } from '@inertiajs/react';
import {
    BarChart3,
    Box,
    ClipboardList,
    ExternalLink,
    Hammer,
    Minus,
    PackagePlus,
    Plus,
} from 'lucide-react';
import { useEffect, useState } from 'react';

import {
    brand,
    brl,
    products as fallbackProducts,
    statusOptions,
} from '@/data/auraleve';
import type { Product } from '@/data/auraleve';

type AdminView = 'visao' | 'pedidos' | 'produtos' | 'atelie';

type Order = {
    id: number;
    number?: string;
    cliente: string;
    data: string;
    total: number;
    st: number;
    status?: string;
    paymentStatus?: string;
};

type DashboardStats = {
    revenue: number;
    orders: number;
    averageTicket: number;
    toShip: number;
};

type AdminProps = {
    dashboard?: DashboardStats;
    orders?: Order[];
    products?: Product[];
};

const cx = (...classes: Array<string | false | null | undefined>) =>
    classes.filter(Boolean).join(' ');

const initialOrders: Order[] = [
    {
        id: 10235,
        cliente: 'Fernanda Marques',
        data: '12/05',
        total: 335.7,
        st: 0,
    },
    { id: 10234, cliente: 'Juliana Prado', data: '12/05', total: 189.9, st: 1 },
    { id: 10233, cliente: 'Carla Nunes', data: '11/05', total: 99.9, st: 2 },
    {
        id: 10232,
        cliente: 'Beatriz Amaral',
        data: '11/05',
        total: 429.8,
        st: 1,
    },
    { id: 10231, cliente: 'Rafaela Souza', data: '10/05', total: 129.9, st: 2 },
    { id: 10230, cliente: 'Marina Castro', data: '09/05', total: 219.9, st: 0 },
];

const initialStock: Record<string, number> = {
    p6: 8,
    p1: 3,
    p3: 12,
    p4: 0,
    p2: 24,
    p5: 2,
};

const stockFromProducts = (catalog: Product[]) =>
    Object.fromEntries(
        catalog.map((product) => [product.id, product.stock ?? 0]),
    );

export default function Admin({
    dashboard,
    orders: serverOrders,
    products: serverProducts,
}: AdminProps) {
    const catalog = serverProducts?.length ? serverProducts : fallbackProducts;
    const [view, setView] = useState<AdminView>('visao');
    const [filter, setFilter] = useState('Todos');
    const [orders, setOrders] = useState(
        serverOrders?.length ? serverOrders : initialOrders,
    );
    const [stock, setStock] = useState(
        serverProducts?.length ? stockFromProducts(catalog) : initialStock,
    );
    const [toast, setToast] = useState('');

    useEffect(() => {
        if (!toast) {
            return;
        }

        const timer = window.setTimeout(() => setToast(''), 2200);

        return () => window.clearTimeout(timer);
    }, [toast]);

    const meta = {
        visao: {
            kicker: 'PAINEL',
            title: 'Visão geral',
            action: 'NOVO PRODUTO',
        },
        pedidos: { kicker: 'GESTÃO', title: 'Pedidos', action: 'EXPORTAR CSV' },
        produtos: {
            kicker: 'CATÁLOGO',
            title: 'Produtos e estoque',
            action: 'NOVO PRODUTO',
        },
        atelie: {
            kicker: 'PRODUÇÃO',
            title: 'Ateliê',
            action: 'REGISTRAR LOTE',
        },
    }[view];

    const visibleOrders = orders.filter(
        (order) =>
            filter === 'Todos' || statusOptions[order.st].label === filter,
    );

    const nav = [
        { id: 'visao', label: 'Visão geral', short: 'Visão', icon: BarChart3 },
        {
            id: 'pedidos',
            label: 'Pedidos',
            short: 'Pedidos',
            icon: ClipboardList,
        },
        { id: 'produtos', label: 'Produtos', short: 'Produtos', icon: Box },
        { id: 'atelie', label: 'Ateliê', short: 'Ateliê', icon: Hammer },
    ] as const;

    const advanceOrder = (id: number, currentStatus: number) => {
        const nextStatus = Math.min(
            statusOptions.length - 1,
            currentStatus + 1,
        );
        const backendStatus =
            ['preparing', 'shipped', 'delivered'][nextStatus] ?? 'delivered';

        setOrders((current) =>
            current.map((order) =>
                order.id === id
                    ? {
                          ...order,
                          st: nextStatus,
                          status: backendStatus,
                      }
                    : order,
            ),
        );

        if (currentStatus < statusOptions.length - 1) {
            setToast(`Pedido #${id} → ${statusOptions[nextStatus].label}`);

            router.patch(
                `/admin/orders/${id}/status`,
                { status: backendStatus },
                { preserveScroll: true },
            );
        }
    };

    const updateStock = (id: string, delta: number) => {
        setStock((current) => {
            const nextStock = Math.max(0, (current[id] ?? 0) + delta);

            router.patch(
                `/admin/products/${id}/stock`,
                { stock: nextStock },
                { preserveScroll: true },
            );

            return {
                ...current,
                [id]: nextStock,
            };
        });
    };

    return (
        <>
            <Head title="Painel do Ateliê - AuraLeve" />
            <main className="aura-body min-h-screen bg-[#f6efe2] text-[#26221e]">
                <div className="grid min-h-screen md:grid-cols-[252px_1fr]">
                    <aside className="sticky top-0 hidden h-screen flex-col gap-8 bg-[#26221e] p-6 text-[#f6ecdb] md:flex">
                        <AdminBrand />
                        <nav className="flex flex-col gap-1">
                            {nav.map((item) => (
                                <NavButton
                                    key={item.id}
                                    active={view === item.id}
                                    icon={item.icon}
                                    label={item.label}
                                    onClick={() => setView(item.id)}
                                />
                            ))}
                        </nav>
                        <div className="mt-auto border-t border-[rgba(246,236,219,.14)] pt-5">
                            <div className="flex items-center gap-3">
                                <span className="aura-display grid h-10 w-10 place-items-center rounded-full bg-[rgba(216,171,92,.18)] text-[#e8c98a]">
                                    F
                                </span>
                                <div>
                                    <div className="text-sm">Fernanda</div>
                                    <div className="text-xs text-[rgba(246,236,219,.5)]">
                                        Administradora
                                    </div>
                                </div>
                            </div>
                            <Link
                                href="/"
                                className="mt-5 inline-flex items-center gap-2 text-xs tracking-[.12em] text-[rgba(246,236,219,.6)]"
                            >
                                VER A LOJA
                                <ExternalLink size={14} />
                            </Link>
                        </div>
                    </aside>

                    <div className="min-w-0">
                        <header className="sticky top-0 z-30 flex items-center justify-between bg-[#26221e] px-5 py-4 text-[#f6ecdb] md:hidden">
                            <AdminBrand compact />
                            <span className="aura-display grid h-9 w-9 place-items-center rounded-full bg-[rgba(216,171,92,.2)] text-[#e8c98a]">
                                F
                            </span>
                        </header>

                        <section className="px-5 py-7 pb-28 md:px-10 md:py-9">
                            <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
                                <div>
                                    <div className="text-[11px] tracking-[.2em] text-[#a97b34]">
                                        {meta.kicker}
                                    </div>
                                    <h1 className="aura-display mt-3 text-[26px] leading-tight md:text-4xl">
                                        {meta.title}
                                    </h1>
                                </div>
                                <button
                                    type="button"
                                    onClick={() =>
                                        setToast(
                                            `${meta.action.toLowerCase()} — a definir`,
                                        )
                                    }
                                    className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-[#b0813c] px-6 text-xs tracking-[.14em] text-[#fffdf8] transition hover:bg-[#96702f]"
                                >
                                    <PackagePlus size={15} />
                                    {meta.action}
                                </button>
                            </div>

                            {view === 'visao' && (
                                <Overview dashboard={dashboard} />
                            )}
                            {view === 'pedidos' && (
                                <Orders
                                    filter={filter}
                                    orders={visibleOrders}
                                    onAdvance={advanceOrder}
                                    onFilter={setFilter}
                                />
                            )}
                            {view === 'produtos' && (
                                <ProductsStock
                                    products={catalog}
                                    stock={stock}
                                    onStock={updateStock}
                                />
                            )}
                            {view === 'atelie' && <Atelier />}
                        </section>
                    </div>
                </div>

                <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-4 border-t border-[#ece3d2] bg-[rgba(253,250,244,.97)] px-2 pt-2 pb-[calc(.75rem+env(safe-area-inset-bottom))] backdrop-blur-md md:hidden">
                    {nav.map((item) => (
                        <button
                            key={item.id}
                            type="button"
                            onClick={() => setView(item.id)}
                            className="flex min-h-12 flex-col items-center justify-center gap-1"
                        >
                            <span
                                className={cx(
                                    'h-1.5 w-1.5 rounded-full',
                                    view === item.id
                                        ? 'bg-[#b0813c]'
                                        : 'bg-[#d5c9b5]',
                                )}
                            />
                            <span
                                className={cx(
                                    'text-[11px]',
                                    view === item.id
                                        ? 'text-[#b0813c]'
                                        : 'text-[#9a8f80]',
                                )}
                            >
                                {item.short}
                            </span>
                        </button>
                    ))}
                </nav>

                {toast && (
                    <div
                        className="fixed bottom-24 left-1/2 z-50 -translate-x-1/2 rounded-full bg-[#26221e] px-6 py-4 text-sm text-[#f6ecdb] shadow-[0_12px_34px_rgba(30,22,12,.34)]"
                        style={{ animation: 'aura-toast .3s ease both' }}
                    >
                        {toast}
                    </div>
                )}
            </main>
        </>
    );
}

function AdminBrand({ compact = false }: { compact?: boolean }) {
    return (
        <div className="flex items-center gap-3">
            <img src={brand.symbol} alt="" className="h-8 w-auto" />
            <div>
                <div
                    className={cx(
                        'aura-display tracking-[.16em]',
                        compact ? 'text-base' : 'text-[16px]',
                    )}
                >
                    AURALEVE
                </div>
                {!compact && (
                    <div className="text-[10px] tracking-[.16em] text-[rgba(246,236,219,.5)]">
                        PAINEL DO ATELIÊ
                    </div>
                )}
            </div>
        </div>
    );
}

function NavButton({
    active,
    icon: Icon,
    label,
    onClick,
}: {
    active: boolean;
    icon: typeof BarChart3;
    label: string;
    onClick: () => void;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={cx(
                'flex items-center gap-3 rounded-[14px] px-4 py-3 text-left text-[14.5px] transition',
                active
                    ? 'bg-[rgba(216,171,92,.16)] text-[#e8c98a]'
                    : 'text-[rgba(246,236,219,.72)] hover:bg-[rgba(246,236,219,.08)] hover:text-[#f6ecdb]',
            )}
        >
            <Icon size={17} />
            {label}
        </button>
    );
}

function Overview({ dashboard }: { dashboard?: DashboardStats }) {
    return (
        <div className="animate-in duration-300 fade-in">
            <div className="mt-7 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                {[
                    {
                        label: 'FATURAMENTO',
                        value: brl(dashboard?.revenue ?? 18400),
                        delta: 'online',
                        color: '#6f8a4e',
                    },
                    {
                        label: 'PEDIDOS',
                        value: String(dashboard?.orders ?? 86),
                        delta: 'total',
                        color: '#6f8a4e',
                    },
                    {
                        label: 'TICKET MÉDIO',
                        value: brl(dashboard?.averageTicket ?? 214),
                        delta: 'médio',
                        color: '#6f8a4e',
                    },
                    {
                        label: 'A ENVIAR',
                        value: String(dashboard?.toShip ?? 9),
                        delta: 'fila',
                        color: '#a8503a',
                    },
                ].map((item) => (
                    <div
                        key={item.label}
                        className="rounded-[20px] border border-[#e7dcc7] bg-[#fffdf9] p-5 md:p-6"
                    >
                        <div className="text-[11px] tracking-[.14em] text-[#8a8178]">
                            {item.label}
                        </div>
                        <div className="aura-display mt-3 text-3xl leading-none">
                            {item.value}
                        </div>
                        <div className="mt-3 flex items-center gap-2 text-xs">
                            <span style={{ color: item.color }}>
                                {item.delta}
                            </span>
                            <span className="text-[#a89d8c]">
                                atualizado pelo banco
                            </span>
                        </div>
                    </div>
                ))}
            </div>

            <div className="mt-5 grid gap-5 xl:grid-cols-[1.5fr_1fr]">
                <div className="rounded-[20px] border border-[#e7dcc7] bg-[#fffdf9] p-5 md:p-6">
                    <div className="flex items-baseline justify-between gap-4">
                        <div className="aura-display text-xl">
                            Vendas dos últimos 7 dias
                        </div>
                        <div className="text-xs text-[#8a8178]">
                            R$ 4.280 na semana
                        </div>
                    </div>
                    <div className="mt-7 flex h-44 items-end gap-3">
                        {[
                            ['seg', '54%'],
                            ['ter', '72%'],
                            ['qua', '46%'],
                            ['qui', '88%'],
                            ['sex', '100%'],
                            ['sáb', '64%'],
                            ['dom', '32%'],
                        ].map(([day, height]) => (
                            <div
                                key={day}
                                className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-2"
                            >
                                <div
                                    className="w-full rounded-t-[10px] rounded-b-[4px] bg-gradient-to-b from-[#d8ab5c] to-[#b0813c]"
                                    style={{ height }}
                                />
                                <div className="text-[11px] text-[#a89d8c]">
                                    {day}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="rounded-[20px] border border-[#e7dcc7] bg-[#fffdf9] p-5 md:p-6">
                    <div className="aura-display text-xl">
                        Precisa de atenção
                    </div>
                    <div className="mt-5 grid gap-3">
                        {[
                            {
                                title: 'Pulseira Hematita sem estoque',
                                note: 'Zerada há 2 dias - 4 pessoas na lista de espera',
                                dot: '#a8503a',
                            },
                            {
                                title: 'Patuá Proteção com 2 unidades',
                                note: 'Repor antes do fim de semana',
                                dot: '#c99b45',
                            },
                            {
                                title: '3 pedidos aguardando envio',
                                note: 'Coleta dos Correios amanhã às 14h',
                                dot: '#8fa073',
                            },
                        ].map((alert) => (
                            <div
                                key={alert.title}
                                className="flex gap-3 rounded-[16px] bg-[#fbf6ec] p-4"
                            >
                                <span
                                    className="mt-2 h-2 w-2 flex-none rounded-full"
                                    style={{ backgroundColor: alert.dot }}
                                />
                                <div>
                                    <div className="text-sm text-[#26221e]">
                                        {alert.title}
                                    </div>
                                    <div className="mt-1 text-xs leading-5 text-[#8a8178]">
                                        {alert.note}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

function Orders({
    filter,
    orders,
    onAdvance,
    onFilter,
}: {
    filter: string;
    orders: Order[];
    onAdvance: (id: number, currentStatus: number) => void;
    onFilter: (filter: string) => void;
}) {
    return (
        <div className="animate-in duration-300 fade-in">
            <div className="aura-hide-scrollbar mt-7 flex gap-2 overflow-x-auto pb-1">
                {['Todos', 'Em preparação', 'Enviado', 'Entregue'].map(
                    (item) => (
                        <button
                            key={item}
                            type="button"
                            onClick={() => onFilter(item)}
                            className={cx(
                                'flex-none rounded-full border px-5 py-2.5 text-xs',
                                filter === item
                                    ? 'border-[#b0813c] bg-[#b0813c] text-[#fffdf8]'
                                    : 'border-[#e2d7c2] bg-[#fffdf9] text-[#5c554d]',
                            )}
                        >
                            {item}
                        </button>
                    ),
                )}
            </div>

            <div className="mt-5 overflow-hidden rounded-[20px] border border-[#e7dcc7] bg-[#fffdf9]">
                <div className="hidden grid-cols-[1fr_1.6fr_1fr_.9fr_1.1fr] gap-4 border-b border-[#f2ebdd] px-6 py-4 text-[11px] tracking-[.12em] text-[#8a8178] md:grid">
                    <span>PEDIDO</span>
                    <span>CLIENTE</span>
                    <span>DATA</span>
                    <span>TOTAL</span>
                    <span>STATUS</span>
                </div>
                {orders.map((order) => {
                    const status = statusOptions[order.st];

                    return (
                        <div
                            key={order.id}
                            className="border-b border-[#f5efe3]"
                        >
                            <div className="hidden grid-cols-[1fr_1.6fr_1fr_.9fr_1.1fr] items-center gap-4 px-6 py-5 text-sm md:grid">
                                <span className="text-[#a97b34]">
                                    #{order.number ?? order.id}
                                </span>
                                <span className="truncate">
                                    {order.cliente}
                                </span>
                                <span className="text-[#8a8178]">
                                    {order.data}
                                </span>
                                <span>{brl(order.total)}</span>
                                <StatusButton
                                    label={status.label}
                                    bg={status.bg}
                                    fg={status.fg}
                                    onClick={() =>
                                        onAdvance(order.id, order.st)
                                    }
                                />
                            </div>
                            <div className="flex flex-col gap-2 p-5 md:hidden">
                                <div className="flex items-baseline justify-between gap-3">
                                    <span className="text-sm text-[#a97b34]">
                                        #{order.number ?? order.id}
                                    </span>
                                    <span>{brl(order.total)}</span>
                                </div>
                                <div className="text-[15px]">
                                    {order.cliente}
                                </div>
                                <div className="flex items-center justify-between gap-3">
                                    <span className="text-xs text-[#8a8178]">
                                        {order.data}
                                    </span>
                                    <StatusButton
                                        label={status.label}
                                        bg={status.bg}
                                        fg={status.fg}
                                        onClick={() =>
                                            onAdvance(order.id, order.st)
                                        }
                                    />
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
            <div className="mt-4 text-xs text-[#8a8178]">
                Toque no status para avançar o pedido: em preparação, enviado,
                entregue.
            </div>
        </div>
    );
}

function StatusButton({
    bg,
    fg,
    label,
    onClick,
}: {
    bg: string;
    fg: string;
    label: string;
    onClick: () => void;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className="justify-self-start rounded-full px-3 py-2 text-[11px] tracking-[.08em]"
            style={{ backgroundColor: bg, color: fg }}
        >
            {label.toUpperCase()}
        </button>
    );
}

function ProductsStock({
    products,
    stock,
    onStock,
}: {
    products: Product[];
    stock: Record<string, number>;
    onStock: (id: string, delta: number) => void;
}) {
    return (
        <div className="mt-7 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {products.map((product) => {
                const amount = stock[product.id] ?? 0;
                const low = amount === 0 ? 2 : amount <= 3 ? 1 : 0;
                const badge = [
                    ['Em estoque', '#e6eddb', '#56633f'],
                    ['Estoque baixo', '#f7ecd6', '#8a6b2c'],
                    ['Sem estoque', '#f7e3dc', '#a8503a'],
                ][low];

                return (
                    <article
                        key={product.id}
                        className="overflow-hidden rounded-[20px] border border-[#e7dcc7] bg-[#fffdf9]"
                    >
                        <img
                            src={product.image}
                            alt={product.name}
                            className="h-44 w-full object-cover"
                        />
                        <div className="p-5">
                            <div className="flex items-baseline justify-between gap-4">
                                <div className="aura-display min-w-0 text-lg leading-tight">
                                    {product.name}
                                </div>
                                <div className="text-sm whitespace-nowrap">
                                    {brl(product.price)}
                                </div>
                            </div>
                            <div className="mt-2 text-xs text-[#8a8178]">
                                {product.cat} · {product.stone}
                            </div>
                            <div className="mt-5 flex items-center justify-between gap-3">
                                <span
                                    className="rounded-full px-3 py-2 text-[11px] tracking-[.06em]"
                                    style={{
                                        backgroundColor: badge[1],
                                        color: badge[2],
                                    }}
                                >
                                    {badge[0]}
                                </span>
                                <span className="inline-flex h-9 items-center overflow-hidden rounded-full border border-[#e6dcc9] bg-[#fdfaf4]">
                                    <button
                                        type="button"
                                        onClick={() => onStock(product.id, -1)}
                                        className="grid h-full w-9 place-items-center"
                                        aria-label="Diminuir estoque"
                                    >
                                        <Minus size={14} />
                                    </button>
                                    <span className="min-w-8 text-center text-sm">
                                        {amount}
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => onStock(product.id, 1)}
                                        className="grid h-full w-9 place-items-center"
                                        aria-label="Aumentar estoque"
                                    >
                                        <Plus size={14} />
                                    </button>
                                </span>
                            </div>
                        </div>
                    </article>
                );
            })}
        </div>
    );
}

function Atelier() {
    return (
        <div className="mt-7 grid gap-5 xl:grid-cols-2">
            <div className="rounded-[20px] border border-[#e7dcc7] bg-[#fffdf9] p-5 md:p-6">
                <div className="aura-display text-xl">Fila de produção</div>
                <div className="mt-6 grid gap-5">
                    {[
                        ['Japamala Olho de Tigre · 4 peças', '75%'],
                        ['Colar Quartzo Rosa · 2 peças', '40%'],
                        ['Patuá Proteção · 6 peças', '20%'],
                        ['Pulseira 7 Nós · 10 peças', '90%'],
                    ].map(([label, pct]) => (
                        <div key={label}>
                            <div className="flex justify-between gap-4 text-sm">
                                <span className="truncate">{label}</span>
                                <span className="text-[#8a8178]">{pct}</span>
                            </div>
                            <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#f2ebdd]">
                                <div
                                    className="h-full rounded-full bg-gradient-to-r from-[#d8ab5c] to-[#b0813c]"
                                    style={{ width: pct }}
                                />
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="rounded-[20px] border border-[#e7dcc7] bg-[#fffdf9] p-5 md:p-6">
                <div className="aura-display text-xl">Pedras em estoque</div>
                <div className="mt-6 grid gap-4">
                    {[
                        ['Olho de Tigre 8mm', '1.240 contas', '#a97b34'],
                        ['Quartzo Rosa 8mm', '860 contas', '#e2b7b6'],
                        ['Hematita 6mm', '120 contas', '#4a4a52'],
                        ['Ágata Branca 8mm', '640 contas', '#e6ddcd'],
                        ['Ametista 8mm', '410 contas', '#8f7bab'],
                    ].map(([name, qty, color]) => (
                        <div key={name} className="flex items-center gap-4">
                            <span
                                className="h-7 w-7 flex-none rounded-full shadow-inner"
                                style={{ backgroundColor: color }}
                            />
                            <span className="min-w-0 flex-1 truncate text-sm">
                                {name}
                            </span>
                            <span className="text-sm whitespace-nowrap text-[#8a8178]">
                                {qty}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
