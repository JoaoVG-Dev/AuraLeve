export type Product = {
    id: string;
    databaseId?: number;
    name: string;
    price: number;
    cat: string;
    stone: string;
    badge?: string;
    reviews: number;
    desc: string;
    image: string;
    detailImage?: string;
    stock?: number;
    active?: boolean;
};

export type CartRow = {
    id: string;
    qty: number;
};

export type ShippingRate = {
    id: string;
    name: string;
    eta: string;
    price: number;
};

export type PayMethod = {
    id: 'pix' | 'cartao' | 'boleto';
    name: string;
    note: string;
    tag?: string;
};

export const brand = {
    symbol: '/images/brand/auraleve-symbol.png',
    video: '/videos/hero.mp4',
    board: '/images/auraleve/mobile-board.png',
    splashHands:
        '/images/auraleve/official/official-atelier-blue-japamala.jpeg',
    homeHero: '/images/auraleve/official/official-hero-blue-japamala.jpeg',
    detailHands: '/images/auraleve/official/official-close-blue-japamala.jpeg',
};

export const products: Product[] = [
    {
        id: 'p6',
        name: 'Japamala Lápis Lazúli',
        price: 219.9,
        cat: 'Japamalas',
        stone: 'Lápis Lazúli',
        badge: 'MAIS VENDIDA',
        reviews: 120,
        desc: 'Intuição, presença e verdade. O Lápis Lazúli ajuda a acalmar a mente e sustentar práticas de conexão.',
        image: '/images/auraleve/official/official-product-blue-japamala.jpeg',
        detailImage:
            '/images/auraleve/official/official-close-blue-japamala.jpeg',
    },
    {
        id: 'p1',
        name: 'Japamala Ágata',
        price: 189.9,
        cat: 'Japamalas',
        stone: 'Ágata Branca',
        reviews: 84,
        desc: 'Serenidade e equilíbrio. A Ágata acalma a mente e sustenta a prática diária de respiração.',
        image: '/images/auraleve/product-p1.png',
    },
    {
        id: 'p3',
        name: 'Colar Quartzo Rosa',
        price: 199.9,
        cat: 'Colares',
        stone: 'Quartzo Rosa',
        badge: 'NOVA',
        reviews: 156,
        desc: 'A pedra do amor-próprio. Abre o coração para relações mais leves e verdadeiras.',
        image: '/images/auraleve/product-p3.png',
    },
    {
        id: 'p4',
        name: 'Pulseira Hematita',
        price: 89.9,
        cat: 'Pulseiras',
        stone: 'Hematita',
        reviews: 97,
        desc: 'Aterramento e proteção. A Hematita devolve foco ao corpo quando a cabeça acelera.',
        image: '/images/auraleve/product-p4.png',
    },
    {
        id: 'p2',
        name: 'Pulseira 7 Nós',
        price: 99.9,
        cat: 'Pulseiras',
        stone: 'Algodão encerado',
        reviews: 212,
        desc: 'Sete nós, sete intenções. Amarre no punho esquerdo e faça um pedido a cada nó.',
        image: '/images/auraleve/product-p2.png',
    },
    {
        id: 'p5',
        name: 'Patuá Proteção',
        price: 129.9,
        cat: 'Patuás',
        stone: 'Arruda e sal grosso',
        badge: 'ÚLTIMAS',
        reviews: 61,
        desc: 'Feito e selado à mão para guardar sua casa. Leve na bolsa ou pendure na porta.',
        image: '/images/auraleve/product-p5.png',
    },
];

export const categories = [
    'Todas',
    'Japamalas',
    'Colares',
    'Pulseiras',
    'Patuás',
];

export const intentions = [
    { label: 'Proteção', note: 'Lápis Lazúli, Hematita' },
    { label: 'Amor-próprio', note: 'Quartzo Rosa' },
    { label: 'Foco', note: 'Ametista, Sodalita' },
    { label: 'Prosperidade', note: 'Citrino, Pirita' },
    { label: 'Calma', note: 'Ágata, Quartzo Leitoso' },
];

export const shippingRates: ShippingRate[] = [
    { id: 'pac', name: 'PAC', eta: '7 a 10 dias úteis', price: 15.9 },
    { id: 'sedex', name: 'SEDEX', eta: '3 a 5 dias úteis', price: 25.9 },
    { id: 'sedex10', name: 'SEDEX 10', eta: '1 a 2 dias úteis', price: 35.9 },
];

export const payMethods: PayMethod[] = [
    {
        id: 'pix',
        name: 'Pix',
        note: 'Aprovação imediata pelo Mercado Pago',
        tag: '5% OFF',
    },
    {
        id: 'cartao',
        name: 'Cartão de crédito',
        note: 'Até 6x sem juros pelo Mercado Pago',
    },
    {
        id: 'boleto',
        name: 'Boleto bancário',
        note: 'Compensa em até 2 dias úteis',
    },
];

export const defaultCart: CartRow[] = [
    { id: 'p6', qty: 1 },
    { id: 'p3', qty: 1 },
];

export const statusOptions = [
    { label: 'Em preparação', bg: '#f4ebda', fg: '#8a6b2c' },
    { label: 'Enviado', bg: '#e6eddb', fg: '#56633f' },
    { label: 'Entregue', bg: '#eae5dc', fg: '#5c554d' },
];

export const brl = (value: number) =>
    `R$ ${value.toFixed(2).replace('.', ',')}`;

export const getProduct = (id: string, catalog: Product[] = products) =>
    catalog.find((product) => product.id === id) ?? catalog[0] ?? products[0];

export const cartCount = (cart: CartRow[]) =>
    cart.reduce((total, row) => total + row.qty, 0);

export const cartSubtotal = (cart: CartRow[], catalog: Product[] = products) =>
    cart.reduce(
        (total, row) => total + getProduct(row.id, catalog).price * row.qty,
        0,
    );
