import { Head, Link, router } from '@inertiajs/react';
import {
    BarChart3,
    Box,
    ClipboardList,
    CreditCard,
    Download,
    ExternalLink,
    Gift,
    Hammer,
    Mail,
    MapPin,
    Minus,
    PackagePlus,
    Pencil,
    Phone,
    Plus,
    Truck,
    Trash2,
    X,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import type { FormEvent, ReactNode } from 'react';

import {
    brand,
    brl,
    products as fallbackProducts,
    statusOptions,
} from '@/data/auraleve';
import type { Product } from '@/data/auraleve';

type AdminView = 'visao' | 'pedidos' | 'produtos' | 'atelie';

type OrderItem = {
    name: string;
    qty: number;
    total: number;
};

type Order = {
    id: number;
    number?: string;
    cliente: string;
    data: string;
    total: number;
    st: number;
    status?: string;
    paymentStatus?: string;
    items?: OrderItem[];
    placedAt?: string;
    email?: string;
    phone?: string;
    cpf?: string;
    address?: { line1: string; line2: string; line3: string };
    subtotal?: number;
    discount?: number;
    shippingAmount?: number;
    shipping?: string;
    payment?: string;
    giftWrap?: boolean;
    giftMessage?: string | null;
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

const csvCell = (value: unknown) =>
    `"${String(value ?? '').replace(/"/g, '""')}"`;

const orderStatusLabel = (order: Order) =>
    statusOptions[order.st]?.label ?? order.status ?? 'Em preparação';

const orderAddress = (order: Order) =>
    [order.address?.line1, order.address?.line2, order.address?.line3]
        .filter(Boolean)
        .join(' | ');

const downloadCsv = (filename: string, rows: unknown[][]) => {
    const csv = rows.map((row) => row.map(csvCell).join(';')).join('\r\n');
    const blob = new Blob([`\ufeff${csv}`], {
        type: 'text/csv;charset=utf-8;',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
};

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
    const [editing, setEditing] = useState<Product | null>(null);
    const [creating, setCreating] = useState(false);
    const [detail, setDetail] = useState<Order | null>(null);

    useEffect(() => {
        if (!toast) {
            return;
        }

        const timer = window.setTimeout(() => setToast(''), 2200);

        return () => window.clearTimeout(timer);
    }, [toast]);

    // Re-sync with the server whenever Inertia hands us fresh props (after a
    // stock change, a product save or an order status update).
    const [synced, setSynced] = useState({
        products: serverProducts,
        orders: serverOrders,
    });

    if (synced.products !== serverProducts || synced.orders !== serverOrders) {
        setSynced({ products: serverProducts, orders: serverOrders });

        if (serverProducts?.length) {
            setStock(stockFromProducts(serverProducts));
        }

        if (serverOrders?.length) {
            setOrders(serverOrders);
        }
    }

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
    const selectedOrder = detail
        ? (orders.find((order) => order.id === detail.id) ?? detail)
        : null;

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

    const removeProduct = (product: Product) => {
        router.delete(`/admin/products/${product.id}`, {
            preserveScroll: true,
            onSuccess: () => setToast(`${product.name} removida`),
            onError: (errors) =>
                setToast(
                    (errors.product as string | undefined) ??
                        'Não foi possível remover a peça',
                ),
        });
    };

    const exportOrders = () => {
        if (!visibleOrders.length) {
            setToast('Nenhum pedido para exportar');

            return;
        }

        downloadCsv('auraleve-pedidos.csv', [
            [
                'Pedido',
                'Cliente',
                'Data',
                'Status',
                'Pagamento',
                'Entrega',
                'Subtotal',
                'Desconto',
                'Frete',
                'Total',
                'E-mail',
                'Telefone',
                'CPF',
                'Endereço',
                'Presente',
                'Mensagem',
            ],
            ...visibleOrders.map((order) => [
                order.number ?? order.id,
                order.cliente,
                order.placedAt ?? order.data,
                orderStatusLabel(order),
                order.payment ?? order.paymentStatus ?? '',
                order.shipping ?? '',
                order.subtotal ?? '',
                order.discount ?? '',
                order.shippingAmount ?? '',
                order.total,
                order.email ?? '',
                order.phone ?? '',
                order.cpf ?? '',
                orderAddress(order),
                order.giftWrap ? 'Sim' : 'Não',
                order.giftMessage ?? '',
            ]),
        ]);

        setToast('CSV de pedidos exportado');
    };

    const headerAction = () => {
        if (view === 'pedidos') {
            exportOrders();

            return;
        }

        if (view === 'atelie') {
            setToast(`${meta.action.toLowerCase()} — a definir`);

            return;
        }

        setEditing(null);
        setCreating(true);
        setView('produtos');
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
                                    onClick={headerAction}
                                    className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-[#b0813c] px-6 text-xs tracking-[.14em] text-[#fffdf8] transition hover:bg-[#96702f]"
                                >
                                    {view === 'pedidos' ? (
                                        <Download size={15} />
                                    ) : (
                                        <PackagePlus size={15} />
                                    )}
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
                                    onOpen={setDetail}
                                />
                            )}
                            {view === 'produtos' && (
                                <ProductsStock
                                    products={catalog}
                                    stock={stock}
                                    onStock={updateStock}
                                    onCreate={() => {
                                        setEditing(null);
                                        setCreating(true);
                                    }}
                                    onEdit={(product) => {
                                        setCreating(false);
                                        setEditing(product);
                                    }}
                                    onRemove={removeProduct}
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

                {(creating || editing) && (
                    <ProductDialog
                        product={editing}
                        onClose={() => {
                            setCreating(false);
                            setEditing(null);
                        }}
                        onSaved={(message) => {
                            setCreating(false);
                            setEditing(null);
                            setToast(message);
                        }}
                    />
                )}

                {selectedOrder && (
                    <OrderDetail
                        order={selectedOrder}
                        onAdvance={() =>
                            advanceOrder(selectedOrder.id, selectedOrder.st)
                        }
                        onClose={() => setDetail(null)}
                    />
                )}

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
    onOpen,
}: {
    filter: string;
    orders: Order[];
    onAdvance: (id: number, currentStatus: number) => void;
    onFilter: (filter: string) => void;
    onOpen: (order: Order) => void;
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
                                <button
                                    type="button"
                                    onClick={() => onOpen(order)}
                                    className="justify-self-start text-[#a97b34] transition hover:underline"
                                >
                                    #{order.number ?? order.id}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => onOpen(order)}
                                    className="truncate text-left transition hover:text-[#a97b34]"
                                >
                                    {order.cliente}
                                </button>
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
                                    <button
                                        type="button"
                                        onClick={() => onOpen(order)}
                                        className="text-sm text-[#a97b34] underline"
                                    >
                                        #{order.number ?? order.id}
                                    </button>
                                    <span>{brl(order.total)}</span>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => onOpen(order)}
                                    className="text-left text-[15px]"
                                >
                                    {order.cliente}
                                </button>
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
                Toque no número ou no nome para ver o pedido completo; toque no
                status para avançá-lo: em preparação, enviado, entregue.
            </div>
        </div>
    );
}

function OrderDetail({
    order,
    onAdvance,
    onClose,
}: {
    order: Order;
    onAdvance: () => void;
    onClose: () => void;
}) {
    const status = statusOptions[order.st] ?? statusOptions[0];
    const items = order.items ?? [];
    const canAdvance = order.st < statusOptions.length - 1;

    return (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-[rgba(30,22,12,.42)] p-0 backdrop-blur-sm md:items-center md:p-6">
            <section className="aura-hide-scrollbar max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-t-[26px] bg-[#fdfaf4] p-6 md:rounded-[26px] md:p-8">
                <div className="flex items-start justify-between gap-6">
                    <div>
                        <div className="text-[11px] tracking-[.2em] text-[#a97b34]">
                            DETALHE DO PEDIDO
                        </div>
                        <h2 className="aura-display mt-3 text-2xl">
                            #{order.number ?? order.id}
                        </h2>
                        <div className="mt-2 text-sm text-[#6f675d]">
                            {order.cliente} · {order.placedAt ?? order.data}
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Fechar"
                        className="grid h-10 w-10 flex-none place-items-center rounded-full border border-[#e6dcc9] bg-[#fffdf9] text-[#5c554d]"
                    >
                        <X size={17} />
                    </button>
                </div>

                <div className="mt-6 grid gap-4 md:grid-cols-2">
                    <DetailBlock
                        icon={<Mail size={17} />}
                        title="Contato"
                        rows={[
                            ['E-mail', order.email ?? 'Não informado'],
                            ['Telefone', order.phone ?? 'Não informado'],
                            ['CPF', order.cpf ?? 'Não informado'],
                        ]}
                    />
                    <DetailBlock
                        icon={<Truck size={17} />}
                        title="Entrega"
                        rows={[
                            ['Método', order.shipping ?? 'Não informado'],
                            ['Endereço', orderAddress(order) || 'Não informado'],
                        ]}
                    />
                    <DetailBlock
                        icon={<CreditCard size={17} />}
                        title="Pagamento"
                        rows={[
                            ['Forma', order.payment ?? 'Não informado'],
                            ['Status', order.paymentStatus ?? 'Não informado'],
                        ]}
                    />
                    <DetailBlock
                        icon={<Gift size={17} />}
                        title="Presente"
                        rows={[
                            ['Embalagem', order.giftWrap ? 'Sim' : 'Não'],
                            ['Mensagem', order.giftMessage || 'Sem mensagem'],
                        ]}
                    />
                </div>

                <div className="mt-6 overflow-hidden rounded-[20px] border border-[#e7dcc7] bg-[#fffdf9]">
                    <div className="flex items-center gap-2 border-b border-[#f2ebdd] px-5 py-4 text-[11px] tracking-[.12em] text-[#8a8178]">
                        <MapPin size={15} />
                        ITENS DO PEDIDO
                    </div>
                    <div className="divide-y divide-[#f5efe3]">
                        {items.length ? (
                            items.map((item) => (
                                <div
                                    key={`${item.name}-${item.qty}-${item.total}`}
                                    className="grid grid-cols-[1fr_auto] gap-4 px-5 py-4 text-sm"
                                >
                                    <div>
                                        <div>{item.name}</div>
                                        <div className="mt-1 text-xs text-[#8a8178]">
                                            Quantidade: {item.qty}
                                        </div>
                                    </div>
                                    <div>{brl(item.total)}</div>
                                </div>
                            ))
                        ) : (
                            <div className="px-5 py-4 text-sm text-[#8a8178]">
                                Itens não disponíveis neste pedido.
                            </div>
                        )}
                    </div>
                    <div className="space-y-2 border-t border-[#f2ebdd] px-5 py-4 text-sm">
                        <PriceLine label="Subtotal" value={order.subtotal} />
                        <PriceLine label="Desconto" value={order.discount} />
                        <PriceLine
                            label="Frete"
                            value={order.shippingAmount}
                        />
                        <div className="flex items-center justify-between pt-2 text-base">
                            <span>Total</span>
                            <strong>{brl(order.total)}</strong>
                        </div>
                    </div>
                </div>

                <div className="mt-7 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <span
                        className="inline-flex self-start rounded-full px-3 py-2 text-[11px] tracking-[.08em]"
                        style={{
                            backgroundColor: status.bg,
                            color: status.fg,
                        }}
                    >
                        {status.label.toUpperCase()}
                    </span>
                    <div className="flex flex-col gap-3 md:flex-row">
                        <button
                            type="button"
                            onClick={onClose}
                            className="h-12 rounded-full border border-[#e6dcc9] bg-[#fffdf9] px-7 text-xs tracking-[.14em] text-[#5c554d]"
                        >
                            FECHAR
                        </button>
                        <button
                            type="button"
                            onClick={onAdvance}
                            disabled={!canAdvance}
                            className="h-12 rounded-full bg-[#b0813c] px-7 text-xs tracking-[.14em] text-[#fffdf8] transition hover:bg-[#96702f] disabled:opacity-50"
                        >
                            AVANÇAR STATUS
                        </button>
                    </div>
                </div>
            </section>
        </div>
    );
}

function DetailBlock({
    icon,
    rows,
    title,
}: {
    icon: ReactNode;
    rows: Array<[string, string]>;
    title: string;
}) {
    return (
        <div className="rounded-[20px] border border-[#e7dcc7] bg-[#fffdf9] p-5">
            <div className="mb-4 flex items-center gap-2 text-[11px] tracking-[.12em] text-[#a97b34]">
                {icon}
                {title.toUpperCase()}
            </div>
            <div className="space-y-3">
                {rows.map(([label, value]) => (
                    <div key={label}>
                        <div className="text-[11px] tracking-[.12em] text-[#8a8178]">
                            {label.toUpperCase()}
                        </div>
                        <div className="mt-1 text-sm leading-6 text-[#3b332b]">
                            {value}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

function PriceLine({
    label,
    value,
}: {
    label: string;
    value?: number;
}) {
    return (
        <div className="flex items-center justify-between text-[#6f675d]">
            <span>{label}</span>
            <span>{typeof value === 'number' ? brl(value) : '—'}</span>
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
    onCreate,
    onEdit,
    onRemove,
}: {
    products: Product[];
    stock: Record<string, number>;
    onStock: (id: string, delta: number) => void;
    onCreate: () => void;
    onEdit: (product: Product) => void;
    onRemove: (product: Product) => void;
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
                            <div className="mt-4 flex items-center justify-between gap-3 border-t border-[#f2ebdd] pt-4">
                                <button
                                    type="button"
                                    onClick={() => onEdit(product)}
                                    className="inline-flex items-center gap-2 text-xs tracking-[.1em] text-[#a97b34] transition hover:text-[#7e5a20]"
                                >
                                    <Pencil size={14} />
                                    EDITAR
                                </button>
                                <div className="flex items-center gap-3">
                                    {product.active === false && (
                                        <span className="rounded-full bg-[#eae5dc] px-3 py-1.5 text-[11px] text-[#5c554d]">
                                            Inativa
                                        </span>
                                    )}
                                    <button
                                        type="button"
                                        onClick={() => onRemove(product)}
                                        className="inline-flex items-center gap-2 text-xs tracking-[.1em] text-[#a89d8c] transition hover:text-[#a8503a]"
                                    >
                                        <Trash2 size={14} />
                                        EXCLUIR
                                    </button>
                                </div>
                            </div>
                        </div>
                    </article>
                );
            })}

            <button
                type="button"
                onClick={onCreate}
                className="grid min-h-56 place-items-center rounded-[20px] border border-dashed border-[#d5c3a0] bg-[#fbf6ec] p-8 text-center transition hover:border-[#b0813c]"
            >
                <span>
                    <PackagePlus
                        className="mx-auto text-[#b0813c]"
                        size={26}
                        strokeWidth={1.4}
                    />
                    <span className="aura-display mt-4 block text-lg">
                        Nova peça
                    </span>
                    <span className="mt-2 block text-xs leading-5 text-[#8a8178]">
                        Cadastre uma peça nova no catálogo da loja
                    </span>
                </span>
            </button>
        </div>
    );
}

const productFields = (product: Product | null) => ({
    name: product?.name ?? '',
    slug: product?.id ?? '',
    description: product?.desc ?? '',
    category: product?.cat ?? '',
    stone: product?.stone ?? '',
    price: product ? String(product.price) : '',
    stock: String(product?.stock ?? 0),
    badge: product?.badge ?? '',
    reviews: String(product?.reviews ?? 0),
    image_path: product?.image ?? '',
    detail_image_path: product?.detailImage ?? '',
    active: product?.active ?? true,
});

function ProductDialog({
    product,
    onClose,
    onSaved,
}: {
    product: Product | null;
    onClose: () => void;
    onSaved: (message: string) => void;
}) {
    const [values, setValues] = useState(() => productFields(product));
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [processing, setProcessing] = useState(false);

    const set = (
        field: keyof ReturnType<typeof productFields>,
        value: string | boolean,
    ) => {
        setValues((current) => ({ ...current, [field]: value }));
        setErrors((current) => ({ ...current, [field]: '' }));
    };

    const submit = (event: FormEvent) => {
        event.preventDefault();
        setProcessing(true);

        const options = {
            preserveScroll: true,
            onSuccess: () =>
                onSaved(
                    product
                        ? `${values.name} atualizada`
                        : `${values.name} adicionada ao catálogo`,
                ),
            onError: (nextErrors: Record<string, string>) =>
                setErrors(nextErrors),
            onFinish: () => setProcessing(false),
        };

        if (product) {
            router.patch(`/admin/products/${product.id}`, values, options);

            return;
        }

        router.post('/admin/products', values, options);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-[rgba(30,22,12,.42)] p-0 backdrop-blur-sm md:items-center md:p-6">
            <form
                onSubmit={submit}
                className="aura-hide-scrollbar max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-t-[26px] bg-[#fdfaf4] p-6 md:rounded-[26px] md:p-8"
            >
                <div className="flex items-start justify-between gap-6">
                    <div>
                        <div className="text-[11px] tracking-[.2em] text-[#a97b34]">
                            {product ? 'EDITAR PEÇA' : 'NOVA PEÇA'}
                        </div>
                        <h2 className="aura-display mt-3 text-2xl">
                            {product ? product.name : 'Cadastrar no catálogo'}
                        </h2>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Fechar"
                        className="grid h-10 w-10 flex-none place-items-center rounded-full border border-[#e6dcc9] bg-[#fffdf9] text-[#5c554d]"
                    >
                        <X size={17} />
                    </button>
                </div>

                <div className="mt-6 grid gap-4">
                    <AdminField
                        error={errors.name}
                        label="Nome"
                        placeholder="Japamala Lápis Lazúli"
                        value={values.name}
                        onChange={(value) => set('name', value)}
                    />
                    <AdminField
                        error={errors.description}
                        label="Descrição"
                        multiline
                        placeholder="O que essa peça carrega"
                        value={values.description}
                        onChange={(value) => set('description', value)}
                    />
                    <div className="grid gap-4 md:grid-cols-2">
                        <AdminField
                            error={errors.category}
                            label="Categoria"
                            placeholder="Japamalas"
                            value={values.category}
                            onChange={(value) => set('category', value)}
                        />
                        <AdminField
                            error={errors.stone}
                            label="Pedra / material"
                            placeholder="Lápis Lazúli"
                            value={values.stone}
                            onChange={(value) => set('stone', value)}
                        />
                    </div>
                    <div className="grid gap-4 md:grid-cols-3">
                        <AdminField
                            error={errors.price}
                            label="Preço (R$)"
                            placeholder="219.90"
                            value={values.price}
                            onChange={(value) => set('price', value)}
                        />
                        <AdminField
                            error={errors.stock}
                            label="Estoque"
                            placeholder="8"
                            value={values.stock}
                            onChange={(value) => set('stock', value)}
                        />
                        <AdminField
                            error={errors.reviews}
                            label="Avaliações"
                            placeholder="120"
                            value={values.reviews}
                            onChange={(value) => set('reviews', value)}
                        />
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                        <AdminField
                            error={errors.badge}
                            label="Selo (opcional)"
                            placeholder="MAIS VENDIDA"
                            value={values.badge}
                            onChange={(value) => set('badge', value)}
                        />
                        <AdminField
                            error={errors.slug}
                            label="Identificador"
                            placeholder="gerado a partir do nome"
                            value={values.slug}
                            onChange={(value) => set('slug', value)}
                        />
                    </div>
                    <AdminField
                        error={errors.image_path}
                        label="Imagem principal"
                        placeholder="/images/auraleve/product-p1.png"
                        value={values.image_path}
                        onChange={(value) => set('image_path', value)}
                    />
                    <AdminField
                        error={errors.detail_image_path}
                        label="Imagem de detalhe (opcional)"
                        placeholder="/images/auraleve/detail-p1.png"
                        value={values.detail_image_path}
                        onChange={(value) => set('detail_image_path', value)}
                    />

                    {values.image_path && (
                        <img
                            src={values.image_path}
                            alt=""
                            className="h-40 w-full rounded-[18px] border border-[#ece3d2] object-cover"
                        />
                    )}

                    <label className="flex cursor-pointer items-center gap-3 text-sm text-[#5c554d]">
                        <input
                            type="checkbox"
                            checked={values.active}
                            onChange={(event) =>
                                set('active', event.target.checked)
                            }
                            className="h-4.5 w-4.5 accent-[#b0813c]"
                        />
                        Visível na loja
                    </label>

                    {errors.product && (
                        <div className="rounded-[16px] border border-[#e6c3b8] bg-[#fff4ef] p-4 text-sm text-[#a8503a]">
                            {errors.product}
                        </div>
                    )}
                </div>

                <div className="mt-7 flex flex-col gap-3 md:flex-row md:justify-end">
                    <button
                        type="button"
                        onClick={onClose}
                        className="h-12 rounded-full border border-[#e6dcc9] bg-[#fffdf9] px-7 text-xs tracking-[.14em] text-[#5c554d]"
                    >
                        CANCELAR
                    </button>
                    <button
                        type="submit"
                        disabled={processing}
                        className="h-12 rounded-full bg-[#b0813c] px-7 text-xs tracking-[.14em] text-[#fffdf8] transition hover:bg-[#96702f] disabled:opacity-60"
                    >
                        {processing
                            ? 'SALVANDO...'
                            : product
                              ? 'SALVAR ALTERAÇÕES'
                              : 'ADICIONAR AO CATÁLOGO'}
                    </button>
                </div>
            </form>
        </div>
    );
}

function AdminField({
    error,
    label,
    multiline = false,
    placeholder,
    value,
    onChange,
}: {
    error?: string;
    label: string;
    multiline?: boolean;
    placeholder: string;
    value: string;
    onChange: (value: string) => void;
}) {
    const shared = cx(
        'w-full border bg-[#fffdf9] px-5 text-[15px] outline-none transition focus:border-[#b0813c]',
        error ? 'border-[#a8503a]' : 'border-[#e6dcc9]',
    );

    return (
        <label className="block">
            <span className="mb-2 block text-[11px] tracking-[.14em] text-[#8a8178] uppercase">
                {label}
            </span>
            {multiline ? (
                <textarea
                    value={value}
                    onChange={(event) => onChange(event.target.value)}
                    placeholder={placeholder}
                    rows={3}
                    className={cx(shared, 'rounded-[18px] py-4')}
                />
            ) : (
                <input
                    value={value}
                    onChange={(event) => onChange(event.target.value)}
                    placeholder={placeholder}
                    className={cx(shared, 'h-12 rounded-full')}
                />
            )}
            {error && (
                <span className="mt-1.5 block text-xs text-[#a8503a]">
                    {error}
                </span>
            )}
        </label>
    );
}

function Atelier() {
    return (
        <div className="mt-7 grid gap-5 xl:grid-cols-2">
            <div className="rounded-[20px] border border-[#e7dcc7] bg-[#fffdf9] p-5 md:p-6">
                <div className="aura-display text-xl">Fila de produção</div>
                <div className="mt-6 grid gap-5">
                    {[
                        ['Japamala Lápis Lazúli · 4 peças', '75%'],
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
                        ['Lápis Lazúli 8mm', '1.240 contas', '#35559c'],
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
