import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    ArrowLeft,
    Check,
    CreditCard,
    FileText,
    Lock,
    MapPin,
    Minus,
    PackageCheck,
    Plus,
    QrCode,
    Truck,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import type { ChangeEvent, ReactNode } from 'react';

import {
    brand,
    brl,
    cartCount,
    cartSubtotal,
    getProduct,
    payMethods,
    products,
    shippingRates,
} from '@/data/auraleve';
import type { CartRow, Product } from '@/data/auraleve';

type CheckoutStep = 'ident' | 'entrega' | 'pagamento' | 'ok';

type CustomerForm = {
    nome: string;
    email: string;
    whats: string;
    cpf: string;
    cep: string;
    rua: string;
    numero: string;
    complemento: string;
    bairro: string;
    cidade: string;
    estado: string;
};

type Errors = Partial<Record<keyof CustomerForm, string>>;

const initialForm: CustomerForm = {
    nome: '',
    email: '',
    whats: '',
    cpf: '',
    cep: '',
    rua: '',
    numero: '',
    complemento: '',
    bairro: '',
    cidade: '',
    estado: '',
};

export const STATES = [
    'AC',
    'AL',
    'AP',
    'AM',
    'BA',
    'CE',
    'DF',
    'ES',
    'GO',
    'MA',
    'MT',
    'MS',
    'MG',
    'PA',
    'PB',
    'PR',
    'PE',
    'PI',
    'RJ',
    'RN',
    'RS',
    'RO',
    'RR',
    'SC',
    'SP',
    'SE',
    'TO',
];

type ConfirmedOrder = {
    orderNumber: string;
    status: string;
    paymentStatus: string;
    total: number;
    payName: string;
    ship: string;
    address: { line1: string; line2: string; line3: string };
};

type CheckoutUser = {
    name: string;
    email: string;
};

type PageProps = {
    products?: Product[];
    confirmedOrder?: ConfirmedOrder;
    errors?: Record<string, string>;
    auth?: {
        user: CheckoutUser | null;
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

const onlyDigits = (value: string) => value.replace(/\D+/g, '');

const maskCpf = (value: string) =>
    onlyDigits(value)
        .slice(0, 11)
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
        .replace(/(\d{3})\.(\d{3})\.(\d{3})(\d)/, '$1.$2.$3-$4');

const maskCep = (value: string) =>
    onlyDigits(value)
        .slice(0, 8)
        .replace(/(\d{5})(\d)/, '$1-$2');

const maskPhone = (value: string) => {
    const digits = onlyDigits(value).slice(0, 11);

    if (digits.length <= 10) {
        return digits
            .replace(/(\d{2})(\d)/, '($1) $2')
            .replace(/(\d{4})(\d)/, '$1-$2');
    }

    return digits
        .replace(/(\d{2})(\d)/, '($1) $2')
        .replace(/(\d{5})(\d)/, '$1-$2');
};

const masks: Partial<Record<keyof CustomerForm, (value: string) => string>> = {
    cpf: maskCpf,
    cep: maskCep,
    whats: maskPhone,
    estado: (value) =>
        value
            .toUpperCase()
            .replace(/[^A-Z]/g, '')
            .slice(0, 2),
};

const isValidCpf = (value: string) => {
    const cpf = onlyDigits(value);

    if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) {
        return false;
    }

    return [9, 10].every((position) => {
        let sum = 0;

        for (let index = 0; index < position; index++) {
            sum += Number(cpf[index]) * (position + 1 - index);
        }

        const remainder = (sum * 10) % 11;

        return (remainder === 10 ? 0 : remainder) === Number(cpf[position]);
    });
};

type ViaCepResponse = {
    erro?: boolean | string;
    logradouro?: string;
    bairro?: string;
    localidade?: string;
    uf?: string;
};

export default function Checkout() {
    const {
        auth,
        confirmedOrder,
        errors: serverErrors = {},
        products: serverProducts,
    } = usePage<PageProps>().props;
    const catalog = serverProducts?.length ? serverProducts : products;
    const user = auth?.user ?? null;
    const [step, setStep] = useState<CheckoutStep>('ident');
    const [form, setForm] = useState<CustomerForm>(() => ({
        ...initialForm,
        nome: user?.name ?? '',
        email: user?.email ?? '',
    }));
    const [errors, setErrors] = useState<Errors>({});
    const [cart, setCart] = useState<CartRow[]>(readStoredCart);
    const [cepLoading, setCepLoading] = useState(false);
    const [ship, setShip] = useState('pac');
    const [pay, setPay] = useState<'pix' | 'cartao' | 'boleto'>('pix');
    const [parcela, setParcela] = useState(1);
    const [present, setPresent] = useState(false);
    const [recado, setRecado] = useState('');
    const [toast, setToast] = useState('');
    const [processing, setProcessing] = useState(false);
    const [lookedUpCep, setLookedUpCep] = useState('');

    useEffect(() => {
        if (confirmedOrder) {
            window.localStorage.removeItem(CART_KEY);
        }
    }, [confirmedOrder]);

    useEffect(() => {
        if (confirmedOrder) {
            return;
        }

        window.localStorage.setItem(CART_KEY, JSON.stringify(cart));
    }, [cart, confirmedOrder]);

    const subtotal = cartSubtotal(cart, catalog);
    const discount = pay === 'pix' ? subtotal * 0.05 : 0;
    const shipping =
        shippingRates.find((rate) => rate.id === ship) ?? shippingRates[0];
    const total = subtotal - discount + shipping.price;
    const cepDigits = form.cep.replace(/\D/g, '');
    const cepOk = cepDigits.length === 8;

    const rows = useMemo(
        () =>
            cart.map((row) => {
                const product = getProduct(row.id, catalog);

                return {
                    ...row,
                    product,
                    line: product.price * row.qty,
                };
            }),
        [cart, catalog],
    );

    const lookupCep = (cep: string) => {
        if (lookedUpCep === cep) {
            return;
        }

        setLookedUpCep(cep);
        setCepLoading(true);

        fetch(`https://viacep.com.br/ws/${cep}/json/`)
            .then((response) => response.json() as Promise<ViaCepResponse>)
            .then((data) => {
                if (data.erro) {
                    setErrors((current) => ({
                        ...current,
                        cep: 'Não encontramos esse CEP.',
                    }));

                    return;
                }

                setForm((current) => ({
                    ...current,
                    rua: current.rua.trim() || (data.logradouro ?? ''),
                    bairro: current.bairro.trim() || (data.bairro ?? ''),
                    cidade: data.localidade ?? current.cidade,
                    estado: data.uf ?? current.estado,
                }));
                setErrors((current) => ({
                    ...current,
                    cep: undefined,
                    rua: undefined,
                    cidade: undefined,
                    estado: undefined,
                }));
            })
            .catch(() => {
                // Offline or blocked: the customer can still type the address.
            })
            .finally(() => setCepLoading(false));
    };

    const setField =
        (field: keyof CustomerForm) =>
        (event: ChangeEvent<HTMLInputElement>) => {
            const mask = masks[field];
            const value = mask ? mask(event.target.value) : event.target.value;

            setForm((current) => ({ ...current, [field]: value }));
            setErrors((current) => ({ ...current, [field]: undefined }));

            if (field === 'cep' && onlyDigits(value).length === 8) {
                lookupCep(onlyDigits(value));
            }
        };

    const setQty = (id: string, delta: number) => {
        setCart((current) =>
            current
                .map((row) =>
                    row.id === id
                        ? { ...row, qty: Math.min(10, row.qty + delta) }
                        : row,
                )
                .filter((row) => row.qty > 0),
        );
    };

    const removeRow = (id: string) => {
        setCart((current) => current.filter((row) => row.id !== id));
    };

    const flash = (message: string) => {
        setToast(message);
        window.setTimeout(() => setToast(''), 2200);
    };

    const validateIdent = () => {
        const nextErrors: Errors = {};

        if (form.nome.trim().split(' ').filter(Boolean).length < 2) {
            nextErrors.nome = 'Informe nome e sobrenome';
        }

        if (!/^[^@\s]+@[^@\s]+\.[a-z]{2,}$/i.test(form.email.trim())) {
            nextErrors.email = 'E-mail inválido';
        }

        if (onlyDigits(form.whats).length < 10) {
            nextErrors.whats = 'Informe DDD + número';
        }

        if (!isValidCpf(form.cpf)) {
            nextErrors.cpf = 'CPF inválido';
        }

        if (!cepOk) {
            nextErrors.cep = 'CEP incompleto';
        }

        if (form.rua.trim().length < 5) {
            nextErrors.rua = 'Informe a rua';
        }

        if (form.numero.trim() === '') {
            nextErrors.numero = 'Informe o número';
        }

        if (form.cidade.trim() === '') {
            nextErrors.cidade = 'Informe a cidade';
        }

        if (!STATES.includes(form.estado)) {
            nextErrors.estado = 'UF inválida';
        }

        setErrors(nextErrors);

        return Object.keys(nextErrors).length === 0;
    };

    const goDelivery = () => {
        if (!validateIdent()) {
            flash('Revise os campos destacados');

            return;
        }

        setStep('entrega');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const finalize = () => {
        if (cart.length === 0) {
            flash('Sua sacola está vazia');

            return;
        }

        setProcessing(true);
        router.post(
            '/orders',
            {
                ...form,
                items: cart,
                shipping_method: ship,
                payment_method: pay,
                gift_wrap: present,
                gift_message: recado,
            },
            {
                preserveScroll: true,
                onError: (nextErrors) => {
                    const fieldErrors: Errors = {};

                    (
                        Object.keys(initialForm) as Array<keyof CustomerForm>
                    ).forEach((field) => {
                        const message = nextErrors[field];

                        if (message) {
                            fieldErrors[field] = message;
                        }
                    });

                    if (Object.keys(fieldErrors).length > 0) {
                        setErrors(fieldErrors);
                        setStep('ident');
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                        flash('Revise os campos destacados');

                        return;
                    }

                    flash(
                        (nextErrors.payment as string | undefined) ??
                            (nextErrors.items as string | undefined) ??
                            'Revise os dados do pedido',
                    );
                },
                onFinish: () => setProcessing(false),
            },
        );
    };

    const address = {
        line1: [form.rua.trim(), form.numero.trim()].filter(Boolean).join(', '),
        line2: [form.complemento.trim(), form.bairro.trim()]
            .filter(Boolean)
            .join(' · '),
        line3: [
            [form.cidade.trim(), form.estado].filter(Boolean).join(' - '),
            cepOk ? `${cepDigits.slice(0, 5)}-${cepDigits.slice(5)}` : '',
        ]
            .filter(Boolean)
            .join(' · '),
    };

    if (confirmedOrder) {
        return (
            <CheckoutShell secure={false}>
                <Head title="Pedido confirmado - AuraLeve" />
                <Confirmation
                    address={confirmedOrder.address}
                    orderNumber={confirmedOrder.orderNumber}
                    payName={confirmedOrder.payName}
                    paymentStatus={confirmedOrder.paymentStatus}
                    ship={confirmedOrder.ship}
                    status={confirmedOrder.status}
                    total={confirmedOrder.total}
                />
            </CheckoutShell>
        );
    }

    return (
        <CheckoutShell secure>
            <Head title="Checkout - AuraLeve" />
            <div className="mx-auto grid w-full max-w-6xl flex-1 gap-0 px-5 py-7 pb-36 md:grid-cols-[1.35fr_.8fr] md:gap-12 md:px-10 md:py-11 md:pb-20">
                <div className="min-w-0">
                    <Stepper step={step} onStep={setStep} />

                    {step === 'ident' && (
                        <section className="animate-in duration-300 fade-in">
                            <h1 className="aura-display mt-11 text-3xl">
                                Quem vai receber
                            </h1>
                            <p className="mt-2 text-sm text-[#8a8178]">
                                Usamos seus dados para emitir a nota e avisar do
                                envio.
                            </p>
                            <div className="mt-7 rounded-[22px] border border-[#ece3d2] bg-[#fffdf9] p-5 md:p-7">
                                <div className="grid gap-5">
                                    <Field
                                        error={errors.nome}
                                        label="Nome completo"
                                        placeholder="Como está no documento"
                                        value={form.nome}
                                        onChange={setField('nome')}
                                    />
                                    <div className="grid gap-5 md:grid-cols-2">
                                        <Field
                                            error={errors.email}
                                            label="E-mail"
                                            placeholder="seu@email.com"
                                            value={form.email}
                                            onChange={setField('email')}
                                        />
                                        <Field
                                            error={errors.whats}
                                            inputMode="tel"
                                            label="WhatsApp"
                                            placeholder="(00) 00000-0000"
                                            value={form.whats}
                                            onChange={setField('whats')}
                                        />
                                    </div>
                                    <div className="grid gap-5 md:grid-cols-2">
                                        <Field
                                            error={errors.cpf}
                                            inputMode="numeric"
                                            label="CPF (nota fiscal)"
                                            placeholder="000.000.000-00"
                                            value={form.cpf}
                                            onChange={setField('cpf')}
                                        />
                                        <Field
                                            error={errors.cep}
                                            hint={
                                                cepLoading
                                                    ? 'buscando...'
                                                    : undefined
                                            }
                                            inputMode="numeric"
                                            label="CEP"
                                            placeholder="00000-000"
                                            value={form.cep}
                                            onChange={setField('cep')}
                                        />
                                    </div>
                                    {cepOk && form.cidade.trim() !== '' && (
                                        <div className="flex gap-3 rounded-[18px] border border-[#dfe6cf] bg-[#f4f7ec] p-4 text-sm leading-6 text-[#4d5a38]">
                                            <Truck
                                                className="mt-1 flex-none text-[#6f8a4e]"
                                                size={18}
                                            />
                                            Entregamos em {form.cidade.trim()}
                                            {form.estado
                                                ? ` - ${form.estado}`
                                                : ''}{' '}
                                            · frete a partir de {brl(15.9)}.
                                        </div>
                                    )}
                                    <div className="grid gap-5 md:grid-cols-[1fr_.42fr]">
                                        <Field
                                            error={errors.rua}
                                            label="Rua"
                                            placeholder="Nome da rua"
                                            value={form.rua}
                                            onChange={setField('rua')}
                                        />
                                        <Field
                                            error={errors.numero}
                                            label="Número"
                                            placeholder="123"
                                            value={form.numero}
                                            onChange={setField('numero')}
                                        />
                                    </div>
                                    <div className="grid gap-5 md:grid-cols-2">
                                        <Field
                                            label="Complemento"
                                            placeholder="Apto, bloco, referência"
                                            value={form.complemento}
                                            onChange={setField('complemento')}
                                        />
                                        <Field
                                            label="Bairro"
                                            placeholder="Bairro"
                                            value={form.bairro}
                                            onChange={setField('bairro')}
                                        />
                                    </div>
                                    <div className="grid gap-5 md:grid-cols-[1fr_.42fr]">
                                        <Field
                                            error={errors.cidade}
                                            label="Cidade"
                                            placeholder="Cidade"
                                            value={form.cidade}
                                            onChange={setField('cidade')}
                                        />
                                        <Field
                                            error={errors.estado}
                                            label="UF"
                                            placeholder="SP"
                                            value={form.estado}
                                            onChange={setField('estado')}
                                        />
                                    </div>
                                </div>
                            </div>
                            <ActionBar onClick={goDelivery}>
                                CONTINUAR PARA A ENTREGA
                            </ActionBar>
                        </section>
                    )}

                    {step === 'entrega' && (
                        <section className="animate-in duration-300 fade-in">
                            <h1 className="aura-display mt-11 text-3xl">
                                Como você quer receber
                            </h1>
                            <p className="mt-2 text-sm text-[#8a8178]">
                                Enviamos de segunda a sexta, com rastreio no
                                WhatsApp.
                            </p>
                            <div className="mt-7 flex gap-4 rounded-[22px] border border-[#ece3d2] bg-[#fffdf9] p-5">
                                <MapPin
                                    className="mt-1 flex-none text-[#b0813c]"
                                    size={19}
                                />
                                <div className="min-w-0 flex-1 text-sm leading-7 text-[#3d3832]">
                                    {address.line1}
                                    <br />
                                    {address.line2}
                                    <br />
                                    {address.line3}
                                    <button
                                        type="button"
                                        onClick={() => setStep('ident')}
                                        className="mt-2 block text-sm text-[#a97b34]"
                                    >
                                        Alterar endereço
                                    </button>
                                </div>
                            </div>

                            <div className="mt-7 grid gap-3">
                                {shippingRates.map((rate) => (
                                    <Choice
                                        key={rate.id}
                                        checked={ship === rate.id}
                                        meta={rate.eta}
                                        price={brl(rate.price)}
                                        title={rate.name}
                                        onClick={() => setShip(rate.id)}
                                    />
                                ))}
                            </div>

                            <div className="mt-5 rounded-[20px] border border-dashed border-[#ddd0b7] bg-[#fbf6ec] p-5">
                                <label className="flex cursor-pointer items-start gap-3">
                                    <input
                                        checked={present}
                                        onChange={() =>
                                            setPresent((value) => !value)
                                        }
                                        type="checkbox"
                                        className="mt-1 h-5 w-5 accent-[#b0813c]"
                                    />
                                    <span>
                                        <span className="block text-[15px] text-[#26221e]">
                                            Embalar para presente
                                        </span>
                                        <span className="mt-1 block text-sm leading-6 text-[#8a8178]">
                                            Caixa de papel reciclado, fita de
                                            algodão e cartão escrito à mão. Sem
                                            custo.
                                        </span>
                                    </span>
                                </label>
                                {present && (
                                    <input
                                        value={recado}
                                        onChange={(event) =>
                                            setRecado(event.target.value)
                                        }
                                        placeholder="Escreva o recado do cartão"
                                        className="mt-4 h-12 w-full rounded-full border border-[#e6dcc9] bg-[#fffdf9] px-5 text-sm outline-none focus:border-[#b0813c]"
                                    />
                                )}
                            </div>
                            <ActionBar onClick={() => setStep('pagamento')}>
                                IR PARA O PAGAMENTO
                            </ActionBar>
                        </section>
                    )}

                    {step === 'pagamento' && (
                        <section className="animate-in duration-300 fade-in">
                            <h1 className="aura-display mt-11 text-3xl">
                                Pagamento
                            </h1>
                            <p className="mt-2 text-sm text-[#8a8178]">
                                Ambiente criptografado. Não guardamos dados do
                                cartão.
                            </p>
                            <div className="mt-7 grid gap-3">
                                {payMethods.map((method) => (
                                    <PaymentChoice
                                        key={method.id}
                                        checked={pay === method.id}
                                        method={method.id}
                                        note={method.note}
                                        tag={method.tag}
                                        title={method.name}
                                        onClick={() => setPay(method.id)}
                                    />
                                ))}
                            </div>

                            {pay === 'cartao' && (
                                <div className="mt-5 rounded-[22px] border border-[#ece3d2] bg-[#fffdf9] p-5 md:p-7">
                                    <div className="grid gap-5">
                                        <div className="rounded-[18px] bg-[#fbf6ec] p-4 text-sm leading-6 text-[#5c554d]">
                                            Você será redirecionado para o
                                            Checkout Pro do Mercado Pago para
                                            informar os dados do cartão com
                                            segurança.
                                        </div>
                                        <div>
                                            <div className="mb-3 text-xs text-[#5c554d]">
                                                Parcelas
                                            </div>
                                            <div className="flex flex-wrap gap-2">
                                                {[1, 2, 3, 4, 5, 6].map(
                                                    (item) => (
                                                        <button
                                                            key={item}
                                                            type="button"
                                                            onClick={() =>
                                                                setParcela(item)
                                                            }
                                                            className={cx(
                                                                'rounded-full border px-4 py-2.5 text-sm',
                                                                parcela === item
                                                                    ? 'border-[#b0813c] bg-[#b0813c] text-[#fffdf8]'
                                                                    : 'border-[#e2d7c2] bg-[#fdfaf4] text-[#5c554d]',
                                                            )}
                                                        >
                                                            {item === 1
                                                                ? `À vista ${brl(total)}`
                                                                : `${item}x ${brl(total / item)}`}
                                                        </button>
                                                    ),
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {pay === 'pix' && (
                                <div className="mt-5 flex gap-5 rounded-[22px] border border-[#ece3d2] bg-[#fffdf9] p-5">
                                    <div className="grid h-24 w-24 flex-none place-items-center rounded-[18px] bg-[#26221e] text-[#d8ab5c]">
                                        <QrCode size={52} strokeWidth={1.25} />
                                    </div>
                                    <div className="min-w-0">
                                        <div className="aura-display text-xl">
                                            QR Code na próxima tela
                                        </div>
                                        <p className="mt-2 text-sm leading-6 text-[#8a8178]">
                                            Aprovação em segundos e 5% de
                                            desconto aplicado no resumo.
                                        </p>
                                    </div>
                                </div>
                            )}

                            {(serverErrors.payment || serverErrors.items) && (
                                <div className="mt-5 rounded-[18px] border border-[#e6c3b8] bg-[#fff4ef] p-4 text-sm leading-6 text-[#a8503a]">
                                    {serverErrors.payment ?? serverErrors.items}
                                </div>
                            )}

                            <ActionBar
                                disabled={processing || cart.length === 0}
                                onClick={finalize}
                            >
                                <span className="inline-flex items-center justify-center gap-2">
                                    <Lock size={16} />
                                    {processing
                                        ? 'ABRINDO MERCADO PAGO...'
                                        : `PAGAR ${brl(total)}`}
                                </span>
                            </ActionBar>
                        </section>
                    )}
                </div>

                <OrderSummary
                    count={cartCount(cart)}
                    discount={discount}
                    rows={rows}
                    shipping={shipping}
                    subtotal={subtotal}
                    total={total}
                    pay={pay}
                    onQty={setQty}
                    onRemove={removeRow}
                />
            </div>

            {toast && (
                <div
                    className="fixed bottom-24 left-1/2 z-50 -translate-x-1/2 rounded-full bg-[#26221e] px-6 py-4 text-sm text-[#f6ecdb] shadow-[0_12px_34px_rgba(30,22,12,.34)]"
                    style={{ animation: 'aura-toast .3s ease both' }}
                >
                    {toast}
                </div>
            )}
        </CheckoutShell>
    );
}

function CheckoutShell({
    children,
    secure,
}: {
    children: ReactNode;
    secure: boolean;
}) {
    return (
        <main className="aura-body flex min-h-screen flex-col bg-[#fdfaf4] text-[#26221e]">
            <header className="flex h-[70px] items-center justify-between gap-4 border-b border-[#f0e8da] px-5 md:px-10">
                <Link
                    href="/"
                    className="inline-flex items-center gap-2 text-xs tracking-[.14em] text-[#5c554d]"
                >
                    <ArrowLeft size={16} />
                    <span className="hidden sm:inline">VOLTAR À LOJA</span>
                </Link>
                <Link
                    href="/"
                    className="flex items-center gap-3 text-[#26221e]"
                >
                    <img src={brand.symbol} alt="" className="h-7 w-auto" />
                    <span className="aura-display text-lg tracking-[.2em]">
                        AURALEVE
                    </span>
                </Link>
                <div className="flex items-center gap-2 text-[11px] tracking-[.1em] text-[#8a8178]">
                    {secure && <Lock size={15} />}
                    <span className="hidden sm:inline">COMPRA SEGURA</span>
                </div>
            </header>
            {children}
        </main>
    );
}

function Stepper({
    step,
    onStep,
}: {
    step: CheckoutStep;
    onStep: (step: CheckoutStep) => void;
}) {
    const current = { ident: 2, entrega: 3, pagamento: 4, ok: 4 }[step];
    const steps = [
        ['1', 'Sacola', 1],
        ['2', 'Identificação', 2],
        ['3', 'Entrega', 3],
        ['4', 'Pagamento', 4],
    ] as const;

    return (
        <div className="relative flex max-w-xl items-start justify-between">
            <div className="absolute top-[17px] right-[12%] left-[12%] h-px bg-[#e6dcc9]" />
            {steps.map(([num, label, index]) => {
                const done = index < current;
                const active = index === current;

                return (
                    <button
                        key={label}
                        type="button"
                        disabled={index > current}
                        onClick={() => {
                            if (index === 2) {
                                onStep('ident');
                            }

                            if (index === 3 && current > 3) {
                                onStep('entrega');
                            }
                        }}
                        className="relative flex flex-1 flex-col items-center gap-2 disabled:cursor-default"
                    >
                        <span
                            className={cx(
                                'grid h-[35px] w-[35px] place-items-center rounded-full text-sm shadow-[0_0_0_5px_#fdfaf4]',
                                active && 'bg-[#b0813c] text-[#fffdf8]',
                                done && 'bg-[#ecdfc4] text-[#8a6b2c]',
                                !active &&
                                    !done &&
                                    'border border-[#ddd0b7] bg-[#fdfaf4] text-[#a89d8c]',
                            )}
                        >
                            {done ? <Check size={17} /> : num}
                        </span>
                        <span className="hidden text-[11px] tracking-[.06em] text-[#8a8178] sm:inline">
                            {label}
                        </span>
                    </button>
                );
            })}
        </div>
    );
}

function Field({
    error,
    hint,
    inputMode,
    label,
    placeholder,
    value,
    onChange,
}: {
    error?: string;
    hint?: string;
    inputMode?: 'numeric' | 'tel';
    label: string;
    placeholder: string;
    value: string;
    onChange: (event: ChangeEvent<HTMLInputElement>) => void;
}) {
    return (
        <label className="block">
            <span className="mb-2 flex items-baseline justify-between gap-3 text-xs text-[#5c554d]">
                {label}
                {hint && <span className="text-[#a89d8c]">{hint}</span>}
            </span>
            <input
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                inputMode={inputMode}
                className={cx(
                    'h-12 w-full rounded-full border bg-[#fdfaf4] px-5 text-[15px] outline-none focus:border-[#b0813c]',
                    error ? 'border-[#a8503a]' : 'border-[#e6dcc9]',
                )}
            />
            {error && (
                <span className="mt-1.5 block text-xs text-[#a8503a]">
                    {error}
                </span>
            )}
        </label>
    );
}

function Choice({
    checked,
    meta,
    price,
    title,
    onClick,
}: {
    checked: boolean;
    meta: string;
    price: string;
    title: string;
    onClick: () => void;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className="flex w-full items-center gap-4 rounded-[20px] border border-[#ece3d2] bg-[#fffdf9] p-5 text-left transition hover:border-[#ddd0b7] hover:bg-[#fdf8ee]"
        >
            <RadioDot checked={checked} />
            <span className="min-w-0 flex-1">
                <span className="block text-[15px] text-[#26221e]">
                    {title}
                </span>
                <span className="mt-1 block text-sm text-[#8a8178]">
                    {meta}
                </span>
            </span>
            <span className="text-sm whitespace-nowrap text-[#3d3832]">
                {price}
            </span>
        </button>
    );
}

function PaymentChoice({
    checked,
    method,
    note,
    tag,
    title,
    onClick,
}: {
    checked: boolean;
    method: 'pix' | 'cartao' | 'boleto';
    note: string;
    tag?: string;
    title: string;
    onClick: () => void;
}) {
    const Icon =
        method === 'pix' ? QrCode : method === 'cartao' ? CreditCard : FileText;

    return (
        <button
            type="button"
            onClick={onClick}
            className="flex w-full items-center gap-4 rounded-[20px] border border-[#ece3d2] bg-[#fffdf9] p-5 text-left transition hover:border-[#ddd0b7] hover:bg-[#fdf8ee]"
        >
            <RadioDot checked={checked} />
            <Icon size={20} className="text-[#a97b34]" />
            <span className="min-w-0 flex-1">
                <span className="block text-[15px] text-[#26221e]">
                    {title}
                </span>
                <span className="mt-1 block text-sm text-[#8a8178]">
                    {note}
                </span>
            </span>
            {tag && (
                <span className="text-sm whitespace-nowrap text-[#a97b34]">
                    {tag}
                </span>
            )}
        </button>
    );
}

function RadioDot({ checked }: { checked: boolean }) {
    return (
        <span
            className={cx(
                'grid h-[22px] w-[22px] flex-none place-items-center rounded-full border',
                checked ? 'border-[#b0813c]' : 'border-[#ddd0b7]',
            )}
        >
            {checked && (
                <span className="h-[11px] w-[11px] rounded-full bg-[#b0813c]" />
            )}
        </span>
    );
}

function ActionBar({
    children,
    disabled = false,
    onClick,
}: {
    children: ReactNode;
    disabled?: boolean;
    onClick: () => void;
}) {
    return (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-[#ece3d2] bg-[rgba(253,250,244,.96)] p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] backdrop-blur-md md:static md:mt-6 md:border-0 md:bg-transparent md:p-0 md:backdrop-blur-none">
            <button
                type="button"
                disabled={disabled}
                onClick={onClick}
                className="h-14 w-full rounded-full bg-[#b0813c] text-xs tracking-[.16em] text-[#fffdf8] transition hover:bg-[#96702f] disabled:cursor-not-allowed disabled:opacity-60"
            >
                {children}
            </button>
        </div>
    );
}

function OrderSummary({
    count,
    discount,
    rows,
    shipping,
    subtotal,
    total,
    pay,
    onQty,
    onRemove,
}: {
    count: number;
    discount: number;
    rows: Array<{
        id: string;
        qty: number;
        product: ReturnType<typeof getProduct>;
        line: number;
    }>;
    shipping: (typeof shippingRates)[number];
    subtotal: number;
    total: number;
    pay: 'pix' | 'cartao' | 'boleto';
    onQty: (id: string, delta: number) => void;
    onRemove: (id: string) => void;
}) {
    return (
        <aside className="order-first mb-7 rounded-[24px] border border-[#ece3d2] bg-[#fffdf9] p-5 md:sticky md:top-7 md:order-none md:mb-0 md:p-7">
            <div className="flex items-baseline justify-between gap-3">
                <div className="aura-display text-xl">Seu pedido</div>
                <div className="text-sm text-[#8a8178]">{count} itens</div>
            </div>
            <div className="mt-5 flex flex-col gap-4">
                {rows.map((row) => (
                    <div key={row.id} className="flex items-center gap-4">
                        <img
                            src={row.product.image}
                            alt={row.product.name}
                            className="h-[70px] w-[60px] rounded-[14px] object-cover"
                        />
                        <div className="min-w-0 flex-1">
                            <div className="text-sm leading-tight text-[#26221e]">
                                {row.product.name}
                            </div>
                            <div className="mt-1 text-xs text-[#8a8178]">
                                {brl(row.product.price)} a unidade
                            </div>
                            <div className="mt-2 flex items-center gap-3">
                                <span className="inline-flex h-8 items-center overflow-hidden rounded-full border border-[#e6dcc9] bg-[#fdfaf4]">
                                    <button
                                        type="button"
                                        onClick={() => onQty(row.id, -1)}
                                        className="grid h-full w-8 place-items-center text-[#5c554d]"
                                        aria-label={`Diminuir ${row.product.name}`}
                                    >
                                        <Minus size={13} />
                                    </button>
                                    <span className="min-w-6 text-center text-sm">
                                        {row.qty}
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => onQty(row.id, 1)}
                                        className="grid h-full w-8 place-items-center text-[#5c554d]"
                                        aria-label={`Aumentar ${row.product.name}`}
                                    >
                                        <Plus size={13} />
                                    </button>
                                </span>
                                <button
                                    type="button"
                                    onClick={() => onRemove(row.id)}
                                    className="text-xs text-[#a89d8c] transition hover:text-[#a8503a]"
                                >
                                    Remover
                                </button>
                            </div>
                        </div>
                        <div className="text-sm whitespace-nowrap">
                            {brl(row.line)}
                        </div>
                    </div>
                ))}
            </div>
            {rows.length === 0 && (
                <div className="mt-5 rounded-[18px] bg-[#fbf6ec] p-4 text-sm leading-6 text-[#8a8178]">
                    Sua sacola está vazia. Volte à loja para escolher uma peça.
                </div>
            )}
            <div className="my-5 h-px bg-[#f2ebdd]" />
            <SummaryLine label="Subtotal" value={brl(subtotal)} />
            {discount > 0 && (
                <SummaryLine
                    label="Desconto Pix (5%)"
                    tone="success"
                    value={`-${brl(discount)}`}
                />
            )}
            <SummaryLine
                label={`Frete · ${shipping.name}`}
                value={brl(shipping.price)}
            />
            <div className="my-4 h-px bg-[#f2ebdd]" />
            <div className="flex items-baseline justify-between">
                <span className="text-[15px]">Total</span>
                <span className="aura-display text-3xl">{brl(total)}</span>
            </div>
            <div className="mt-1 text-right text-xs text-[#9a8f80]">
                {pay === 'cartao'
                    ? `em até 6x de ${brl(total / 6)} sem juros`
                    : pay === 'pix'
                      ? 'à vista no Pix'
                      : 'à vista no boleto'}
            </div>
            <div className="mt-6 grid gap-3 text-xs text-[#8a8178]">
                {[
                    'Peça feita à mão, uma a uma',
                    'Troca grátis em até 30 dias',
                    'Embalagem de presente sem custo',
                ].map((seal) => (
                    <div key={seal} className="flex items-center gap-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-[#d8ab5c]" />
                        {seal}
                    </div>
                ))}
            </div>
        </aside>
    );
}

function SummaryLine({
    label,
    tone,
    value,
}: {
    label: string;
    tone?: 'success';
    value: string;
}) {
    return (
        <div
            className={cx(
                'flex justify-between py-1 text-sm',
                tone === 'success' ? 'text-[#6f8a4e]' : 'text-[#5c554d]',
            )}
        >
            <span>{label}</span>
            <span>{value}</span>
        </div>
    );
}

function Confirmation({
    address,
    orderNumber,
    payName,
    paymentStatus,
    ship,
    status,
    total,
}: {
    address: { line1: string; line2: string; line3: string };
    orderNumber: string;
    payName: string;
    paymentStatus: string;
    ship: string;
    status: string;
    total: number;
}) {
    const statusText =
        paymentStatus === 'approved'
            ? 'Pagamento aprovado. Seu pedido já entrou na fila do ateliê.'
            : 'Pedido recebido. Assim que o Mercado Pago confirmar, atualizamos a produção.';

    return (
        <section className="grid flex-1 place-items-center px-5 py-14 text-center">
            <div className="w-full max-w-lg">
                <div className="mx-auto grid h-28 w-28 place-items-center rounded-full border border-[#e4d5b4]">
                    <Check
                        size={52}
                        strokeWidth={1.6}
                        className="text-[#b0813c]"
                    />
                </div>
                <h1 className="aura-display mt-8 text-4xl leading-tight">
                    Pedido realizado com sucesso!
                </h1>
                <p className="mt-5 text-[15px] leading-8 text-[#5c554d]">
                    Seu pedido{' '}
                    <span className="text-[#a97b34]">#{orderNumber}</span> foi
                    criado. {statusText} Você recebe o rastreio no WhatsApp
                    assim que ele sair daqui.
                </p>
                <div className="mt-8 grid gap-4 rounded-[22px] border border-[#ece3d2] bg-[#fffdf9] p-6 text-left text-sm">
                    <SummaryLine label="Total pago" value={brl(total)} />
                    <SummaryLine label="Forma" value={payName} />
                    <SummaryLine label="Entrega" value={ship} />
                    <SummaryLine label="Status" value={status} />
                    <SummaryLine
                        label="Endereço"
                        value={`${address.line1}, ${address.line3}`}
                    />
                </div>
                <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
                    <Link
                        href="/"
                        className="inline-flex h-14 items-center justify-center rounded-full bg-[#b0813c] px-8 text-xs tracking-[.14em] text-[#fffdf8]"
                    >
                        VOLTAR PARA A LOJA
                    </Link>
                    <Link
                        href="/checkout"
                        className="inline-flex h-14 items-center justify-center rounded-full border border-[#ded2ba] px-8 text-xs tracking-[.14em] text-[#3d3832]"
                    >
                        NOVA COMPRA
                    </Link>
                </div>
                <div className="mx-auto mt-9 flex max-w-sm items-center justify-center gap-3 text-xs text-[#8a8178]">
                    <PackageCheck size={17} className="text-[#b0813c]" />
                    Produção artesanal acompanhada pelo painel do ateliê.
                </div>
            </div>
        </section>
    );
}
