import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useShop } from "@/lib/store";
import { useProducts, validateCouponFn } from "@/lib/catalog";
import { useAuth } from "@/hooks/use-auth";
import { createOrder } from "@/lib/orders.functions";
import {
  getMpPublicKey,
  payWithCard,
  refreshPaymentStatus,
  startPixPayment,
  validateMpCheckoutConfig,
} from "@/lib/payments.functions";
import type { CustomerInfo, Coupon } from "@/lib/types";
import { couponDiscount, finalPrice, formatBRL } from "@/lib/types";
import { useCallback, useEffect, useRef, useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import {
  CheckCircle2,
  Clock,
  Copy,
  CreditCard,
  Home,
  Loader2,
  MapPin,
  PackageCheck,
  RefreshCw,
  RotateCcw,
  ShieldCheck,
  Truck,
  X,
  XCircle,
} from "lucide-react";

export const Route = createFileRoute("/_layout/checkout")({
  component: CheckoutPage,
});

const schema = z.object({
  name: z.string().trim().min(2, "Informe seu nome").max(100),
  email: z.string().trim().email("E-mail inválido").max(255),
  phone: z.string().trim().min(10, "Telefone inválido").max(20),
  cep: z.string().trim().min(8, "CEP inválido").max(10),
  address: z.string().trim().min(3).max(200),
  number: z.string().trim().min(1).max(20),
  complement: z.string().trim().max(100).optional(),
  city: z.string().trim().min(2).max(100),
  state: z.string().trim().min(2).max(40),
  paymentMethod: z.enum(["pix", "credit", "debit"]),
});

const cardSchema = z.object({
  cardNumber: z.string().regex(/^\d{13,19}$/, "Número do cartão inválido"),
  cardName: z.string().trim().min(3).max(100),
  cardExpiry: z.string().regex(/^(0[1-9]|1[0-2])\/\d{2}$/, "Validade MM/AA"),
  cardCvv: z.string().regex(/^\d{3,4}$/, "CVV inválido"),
  cardCpf: z.string().regex(/^\d{11}$/, "CPF inválido"),
});

const onlyDigits = (v: string) => v.replace(/\D/g, "");
const maskCard = (v: string) =>
  onlyDigits(v)
    .slice(0, 19)
    .replace(/(\d{4})(?=\d)/g, "$1 ");
const maskExpiry = (v: string) => {
  const d = onlyDigits(v).slice(0, 4);
  return d.length <= 2 ? d : `${d.slice(0, 2)}/${d.slice(2)}`;
};
const maskCpf = (v: string) =>
  onlyDigits(v)
    .slice(0, 11)
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1-$2");

const debitPaymentMethodByBrand: Record<string, string> = {
  cabal: "debcabal",
  elo: "debelo",
  master: "debmaster",
  mastercard: "debmaster",
  visa: "debvisa",
};

type MpPaymentMethod = {
  id?: string;
  payment_type_id?: string;
};
type MpIssuer = {
  id?: string | number;
};
type MpListResponse<T> = T[] | { results?: T[] } | null | undefined;
type MercadoPagoClient = {
  createCardToken: (payload: Record<string, unknown>) => Promise<{ id?: string }>;
  getPaymentMethods: (payload: { bin: string }) => Promise<MpListResponse<MpPaymentMethod>>;
  getIssuers: (payload: {
    paymentMethodId: string;
    bin: string;
  }) => Promise<MpListResponse<MpIssuer>>;
};
type MercadoPagoConstructor = new (
  publicKey: string,
  options: { locale: string },
) => MercadoPagoClient;
type WindowWithMercadoPago = Window & { MercadoPago?: MercadoPagoConstructor };

function normalizeMpList<T>(response: MpListResponse<T>): T[] {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.results)) return response.results;
  return [];
}

function debitPaymentMethodId(cardNumber: string, fallbackBrand?: string) {
  const brand = fallbackBrand?.toLowerCase();
  if (brand && debitPaymentMethodByBrand[brand]) return debitPaymentMethodByBrand[brand];
  if (cardNumber.startsWith("506776")) return "debelo";
  if (cardNumber.startsWith("4")) return "debvisa";
  if (/^5[1-5]/.test(cardNumber) || /^2(2[2-9]|[3-6]|7[01])/.test(cardNumber)) return "debmaster";
  return "";
}

function resolveCardPaymentMethod(
  methods: MpPaymentMethod[],
  kind: "credit" | "debit",
  cardNumber: string,
) {
  const expectedType = kind === "debit" ? "debit_card" : "credit_card";
  const direct = methods.find((method) => method.payment_type_id === expectedType);
  if (direct) return direct;

  const fallback = methods[0];
  if (!fallback) return undefined;
  if (kind !== "debit") return fallback;

  const id = debitPaymentMethodId(cardNumber, fallback?.id);
  if (!id) return fallback;

  return {
    ...fallback,
    id,
    payment_type_id: "debit_card",
  };
}

let mpSdkPromise: Promise<MercadoPagoConstructor> | null = null;
function loadMpSdk(): Promise<MercadoPagoConstructor> {
  if (typeof window === "undefined") return Promise.reject(new Error("SSR"));
  const mpWindow = window as WindowWithMercadoPago;
  if (mpWindow.MercadoPago) return Promise.resolve(mpWindow.MercadoPago);
  if (mpSdkPromise) return mpSdkPromise;
  mpSdkPromise = new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = "https://sdk.mercadopago.com/js/v2";
    s.async = true;
    s.onload = () => {
      const loadedWindow = window as WindowWithMercadoPago;
      if (loadedWindow.MercadoPago) resolve(loadedWindow.MercadoPago);
      else reject(new Error("SDK do Mercado Pago indisponível"));
    };
    s.onerror = () => reject(new Error("Falha ao carregar SDK do Mercado Pago"));
    document.head.appendChild(s);
  });
  return mpSdkPromise;
}

type Stage = "form" | "pix" | "approved" | "rejected" | "pending" | "expired";
type PixState = { qrBase64?: string; copyPaste?: string; expiresAt?: string | null };

const errorText = (error: unknown, fallback: string) =>
  error instanceof Error ? error.message : fallback;

function CheckoutPage() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { cart, clearCart } = useShop();
  const { data: products = [], isLoading: productsLoading } = useProducts();
  const items = cart
    .map((c) => {
      const p = products.find((pp) => pp.id === c.productId);
      return p ? { product: p, quantity: c.quantity } : null;
    })
    .filter((x): x is { product: (typeof products)[number]; quantity: number } => !!x);
  const subtotal = items.reduce((a, i) => a + finalPrice(i.product) * i.quantity, 0);

  const fetchPublicKey = useServerFn(getMpPublicKey);
  const startPix = useServerFn(startPixPayment);
  const payCard = useServerFn(payWithCard);
  const refreshStatus = useServerFn(refreshPaymentStatus);
  const validateMpConfig = useServerFn(validateMpCheckoutConfig);
  const createOrderServer = useServerFn(createOrder);
  const validateCouponServer = useServerFn(validateCouponFn);

  const [stage, setStage] = useState<Stage>("form");
  const [orderId, setOrderId] = useState<string | null>(null);
  const [orderPaymentMethod, setOrderPaymentMethod] = useState<
    CustomerInfo["paymentMethod"] | null
  >(null);
  const [pix, setPix] = useState<PixState | null>(null);
  const [statusDetail, setStatusDetail] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [statusLoading, setStatusLoading] = useState(false);
  const [pollFailures, setPollFailures] = useState(0);
  const [form, setForm] = useState<CustomerInfo>({
    name: "",
    email: "",
    phone: "",
    cep: "",
    address: "",
    number: "",
    complement: "",
    city: "",
    state: "",
    paymentMethod: "pix",
  });
  const [card, setCard] = useState({
    cardNumber: "",
    cardName: "",
    cardExpiry: "",
    cardCvv: "",
    cardCpf: "",
  });
  const [installments, setInstallments] = useState(1);
  const [couponCode, setCouponCode] = useState("");
  const [coupon, setCoupon] = useState<Coupon | null>(null);
  const [discount, setDiscount] = useState(0);
  const [validating, setValidating] = useState(false);
  const [mpPublicKey, setMpPublicKey] = useState<string | null>(null);
  const [mpInitError, setMpInitError] = useState<string | null>(null);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const mpClientRef = useRef<MercadoPagoClient | null>(null);
  const pollRef = useRef<number | null>(null);

  useEffect(() => {
    if (authLoading || productsLoading || stage !== "form") return;

    if (items.length === 0) {
      navigate({ to: "/carrinho" });
      return;
    }

    if (!user) {
      toast.info("Faça login para finalizar a compra");
      navigate({ to: "/login", search: { redirect: "/checkout" } as never });
    }
  }, [user, authLoading, productsLoading, navigate, items.length, stage]);

  useEffect(() => {
    if (user) setForm((f) => ({ ...f, email: f.email || user.email || "" }));
  }, [user]);

  useEffect(() => {
    let active = true;

    if (form.paymentMethod === "pix") {
      setMpInitError(null);
      return () => {
        active = false;
      };
    }

    (async () => {
      try {
        const { publicKey } = await fetchPublicKey();
        if (!publicKey) throw new Error("MP public key não configurado");

        const MercadoPagoCtor = await loadMpSdk();
        if (!MercadoPagoCtor) throw new Error("SDK do Mercado Pago indisponível");

        if (!active) return;

        mpClientRef.current = new MercadoPagoCtor(publicKey, { locale: "pt-BR" });
        setMpPublicKey(publicKey);
        setMpInitError(null);
      } catch (error: unknown) {
        if (!active) return;
        mpClientRef.current = null;
        setMpPublicKey(null);
        setMpInitError(errorText(error, "Não foi possível inicializar o Mercado Pago"));
      }
    })();

    return () => {
      active = false;
    };
  }, [form.paymentMethod, fetchPublicKey]);

  const orderPayload = () => ({
    items: items.map((i) => ({ product_id: i.product.id, quantity: i.quantity })),
    couponCode: coupon?.code ?? null,
    customer: {
      name: form.name,
      email: form.email,
      phone: form.phone,
      cep: form.cep,
      address: form.address,
      number: form.number,
      complement: form.complement,
      city: form.city,
      state: form.state,
    },
    paymentMethod: form.paymentMethod,
  });

  const ensureOrderForPayment = async () => {
    if (orderId && orderPaymentMethod === form.paymentMethod) return orderId;

    const { orderId: id } = await createOrderServer({ data: orderPayload() });
    setOrderId(id);
    setOrderPaymentMethod(form.paymentMethod);
    toast.success("Pedido criado");
    return id;
  };

  const refreshCurrentStatus = useCallback(
    async ({ manual = false }: { manual?: boolean } = {}) => {
      if (!orderId) return;
      if (manual) setStatusLoading(true);

      try {
        const r = await refreshStatus({ data: { orderId } });
        setPollFailures(0);
        setStatusDetail(
          ("providerStatus" in r ? r.providerStatus : null) ?? r.paymentStatus ?? null,
        );
        if (r.expiresAt)
          setPix((current) => (current ? { ...current, expiresAt: r.expiresAt } : current));

        if (r.paymentStatus === "paid") {
          setStage("approved");
          clearCart();
          toast.success("Pagamento aprovado");
        } else if (r.paymentStatus === "expired") {
          setStage("expired");
          toast.error("Pix expirado");
        } else if (r.paymentStatus === "failed") {
          setStage("rejected");
          toast.error("Pagamento recusado");
        } else if (manual) {
          toast.message("Pagamento ainda pendente");
        }
      } catch {
        setPollFailures((count) => count + 1);
        if (manual) toast.error("Não foi possível atualizar o status agora");
      } finally {
        if (manual) setStatusLoading(false);
      }
    },
    [orderId, refreshStatus, clearCart],
  );

  // Pix polling
  useEffect(() => {
    if (stage !== "pix" || !orderId) return;
    pollRef.current = window.setInterval(() => {
      void refreshCurrentStatus();
    }, 4000);
    return () => {
      if (pollRef.current) window.clearInterval(pollRef.current);
    };
  }, [stage, orderId, refreshCurrentStatus]);

  useEffect(() => {
    if (stage !== "pix" || !pix?.expiresAt) return;
    const msUntilExpiration = new Date(pix.expiresAt).getTime() - Date.now();
    if (msUntilExpiration <= 0) {
      setStage("expired");
      return;
    }
    const timeout = window.setTimeout(() => setStage("expired"), msUntilExpiration);
    return () => window.clearTimeout(timeout);
  }, [stage, pix?.expiresAt]);

  const total = Math.max(0, subtotal - discount);

  useEffect(() => {
    if (!coupon) return;
    const nextDiscount = couponDiscount(coupon, subtotal);
    setDiscount((current) => (current === nextDiscount ? current : nextDiscount));
  }, [coupon, subtotal]);

  if ((authLoading || productsLoading) && stage === "form") {
    return (
      <div className="aura-container py-16 text-center text-muted-foreground">
        Carregando checkout...
      </div>
    );
  }

  if (items.length === 0 && stage === "form") {
    return null;
  }

  const applyCoupon = async () => {
    setValidating(true);
    const res = await validateCouponServer({ data: { code: couponCode, subtotal } });
    setValidating(false);
    if (!res.ok) {
      setCoupon(null);
      setDiscount(0);
      toast.error(res.reason || "Cupom inválido");
      return;
    }
    setCoupon(res.coupon!);
    setDiscount(res.discount!);
    toast.success(`Cupom aplicado: -${formatBRL(res.discount!)}`);
  };
  const removeCoupon = () => {
    setCoupon(null);
    setDiscount(0);
    setCouponCode("");
    toast.info("Cupom removido");
  };

  const refreshAppliedCoupon = async () => {
    if (!coupon) return true;
    const res = await validateCouponServer({ data: { code: coupon.code, subtotal } });
    if (!res.ok) {
      setCoupon(null);
      setDiscount(0);
      setCouponCode("");
      toast.error(res.reason || "Cupom inválido ou inativo.");
      return false;
    }
    setCoupon(res.coupon!);
    setDiscount(res.discount!);
    return true;
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return toast.error("Faça login para finalizar a compra");
    const result = schema.safeParse(form);
    if (!result.success) return toast.error(result.error.issues[0].message);

    for (const i of items) {
      if (i.quantity > i.product.stock)
        return toast.error(`Estoque insuficiente para ${i.product.name}`);
    }

    if (!(await refreshAppliedCoupon())) return;

    if (form.paymentMethod !== "pix") {
      const c = cardSchema.safeParse({
        cardNumber: onlyDigits(card.cardNumber),
        cardName: card.cardName,
        cardExpiry: card.cardExpiry,
        cardCvv: card.cardCvv,
        cardCpf: onlyDigits(card.cardCpf),
      });
      if (!c.success) return toast.error(c.error.issues[0].message);
    }

    setSubmitting(true);
    setCheckoutError(null);
    try {
      const mpConfig = await validateMpConfig();
      if (form.paymentMethod === "pix" && mpConfig.pixAvailable === false) {
        throw new Error(
          "Pix indisponível nesta conta Mercado Pago. Use cartão ou tente novamente mais tarde.",
        );
      }

      if (form.paymentMethod === "pix") {
        const id = await ensureOrderForPayment();
        const r = await startPix({ data: { orderId: id } });
        setPix({ qrBase64: r.qrCodeBase64, copyPaste: r.qrCode, expiresAt: r.expiresAt ?? null });
        setStatusDetail(r.statusDetail ?? null);
        setStage("pix");
        toast.message("Escaneie o QR Code Pix para pagar");
      } else {
        if (mpInitError || !mpPublicKey || !mpClientRef.current) {
          throw new Error(mpInitError || "MP public key não configurado");
        }

        const mp = mpClientRef.current;
        const [mm, yy] = card.cardExpiry.split("/");
        const tokenRes = await mp.createCardToken({
          cardNumber: onlyDigits(card.cardNumber),
          cardholderName: card.cardName.trim(),
          cardExpirationMonth: mm,
          cardExpirationYear: `20${yy}`,
          securityCode: card.cardCvv,
          identificationType: "CPF",
          identificationNumber: onlyDigits(card.cardCpf),
        });
        if (!tokenRes?.id) throw new Error("Não foi possível tokenizar o cartão");

        // Discover payment_method_id from BIN
        const cardNumber = onlyDigits(card.cardNumber);
        const bin = cardNumber.slice(0, 8);
        const methodsRes = await mp.getPaymentMethods({ bin });
        const methods = normalizeMpList<MpPaymentMethod>(methodsRes);
        const method = resolveCardPaymentMethod(methods, form.paymentMethod, cardNumber);
        if (!method?.id) throw new Error("Bandeira do cartão não suportada");

        let issuerId: string | undefined;
        try {
          const issuersRes = await mp.getIssuers({ paymentMethodId: method.id, bin });
          const issuer = normalizeMpList<MpIssuer>(issuersRes)[0];
          issuerId = issuer?.id == null ? undefined : String(issuer.id);
        } catch {
          issuerId = undefined;
        }

        const id = await ensureOrderForPayment();
        const r = await payCard({
          data: {
            orderId: id,
            token: tokenRes.id,
            paymentMethodId: method.id,
            issuerId,
            installments: form.paymentMethod === "credit" ? installments : 1,
            payerEmail: form.email,
            identification: { type: "CPF", number: onlyDigits(card.cardCpf) },
            kind: form.paymentMethod,
          },
        });
        setStatusDetail(r.statusDetail);
        if (r.status === "approved") {
          setStage("approved");
          clearCart();
          toast.success("Pagamento aprovado");
        } else if (
          r.status === "in_process" ||
          r.status === "authorized" ||
          r.status === "pending"
        ) {
          setStage("pending");
          toast.message("Pagamento em análise");
        } else {
          setStage("rejected");
          toast.error("Pagamento recusado");
        }
      }
    } catch (err: unknown) {
      const message = errorText(err, "Não foi possível finalizar o pedido");
      setCheckoutError(message);
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  const retryPixPayment = async () => {
    if (!orderId || orderPaymentMethod !== "pix") {
      setOrderId(null);
      setOrderPaymentMethod(null);
      setStage("form");
      return;
    }

    setSubmitting(true);
    setCheckoutError(null);
    try {
      const r = await startPix({ data: { orderId } });
      setPix({ qrBase64: r.qrCodeBase64, copyPaste: r.qrCode, expiresAt: r.expiresAt ?? null });
      setStatusDetail(r.statusDetail ?? null);
      setPollFailures(0);
      setStage("pix");
      toast.message("Novo QR Code Pix gerado");
    } catch (err: unknown) {
      const message = errorText(err, "Não foi possível gerar outro Pix");
      setCheckoutError(message);
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  const set = <K extends keyof CustomerInfo>(k: K, v: CustomerInfo[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  // ---------- Render screens ----------
  if (stage === "approved") {
    return (
      <div className="aura-container py-24 text-center">
        <CheckCircle2 className="h-14 w-14 text-primary mx-auto mb-4" />
        <h1 className="aura-section-title">Pagamento aprovado</h1>
        <p className="text-muted-foreground max-w-md mx-auto mb-6">
          Recebemos seu pagamento via Mercado Pago. Em breve enviaremos os próximos passos.
        </p>
        <div className="flex gap-3 justify-center flex-wrap">
          {orderId && (
            <Link to="/minha-conta" className="aura-button">
              Ver meu pedido
            </Link>
          )}
          <button onClick={() => navigate({ to: "/" })} className="aura-button-outline">
            Voltar à home
          </button>
        </div>
      </div>
    );
  }

  if (stage === "pending") {
    return (
      <div className="aura-container py-24 text-center">
        <Clock className="h-14 w-14 text-primary mx-auto mb-4" />
        <h1 className="aura-section-title">Pagamento em análise</h1>
        <p className="text-muted-foreground max-w-md mx-auto mb-2">
          O Mercado Pago está revisando o pagamento. Avisaremos por e-mail assim que confirmar.
        </p>
        {statusDetail && (
          <p className="text-xs text-muted-foreground mb-6">Detalhe: {statusDetail}</p>
        )}
        {orderId && (
          <Link to="/minha-conta" className="aura-button">
            Acompanhar pedido
          </Link>
        )}
      </div>
    );
  }

  if (stage === "rejected") {
    return (
      <div className="aura-container py-24 text-center">
        <XCircle className="h-14 w-14 text-destructive mx-auto mb-4" />
        <h1 className="aura-section-title">Pagamento recusado</h1>
        <p className="text-muted-foreground max-w-md mx-auto mb-2">
          O Mercado Pago não autorizou o pagamento. Você pode tentar outra forma de pagamento.
        </p>
        {statusDetail && (
          <p className="text-xs text-muted-foreground mb-6">Detalhe: {statusDetail}</p>
        )}
        <div className="flex gap-3 justify-center flex-wrap">
          <button
            onClick={() => {
              setStage("form");
              setCheckoutError(null);
            }}
            className="aura-button"
          >
            <RotateCcw className="h-4 w-4" /> Tentar cartão novamente
          </button>
          <button
            onClick={() => {
              setOrderId(null);
              setOrderPaymentMethod(null);
              setStage("form");
              setCheckoutError(null);
            }}
            className="aura-button-outline"
          >
            Trocar forma de pagamento
          </button>
        </div>
      </div>
    );
  }

  if (stage === "expired") {
    return (
      <div className="aura-container py-24 text-center">
        <Clock className="h-14 w-14 text-destructive mx-auto mb-4" />
        <h1 className="aura-section-title">Pix expirado</h1>
        <p className="text-muted-foreground max-w-md mx-auto mb-2">
          O QR Code Pix venceu antes da confirmação. Você pode atualizar o status ou gerar um novo
          QR Code para o mesmo pedido.
        </p>
        {statusDetail && (
          <p className="text-xs text-muted-foreground mb-6">Detalhe: {statusDetail}</p>
        )}
        {checkoutError && <p className="text-xs text-destructive mb-4">{checkoutError}</p>}
        <div className="flex gap-3 justify-center flex-wrap">
          <button
            onClick={() => void refreshCurrentStatus({ manual: true })}
            disabled={statusLoading}
            className="aura-button-outline disabled:opacity-50"
          >
            {statusLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            Atualizar status
          </button>
          <button
            onClick={() => void retryPixPayment()}
            disabled={submitting}
            className="aura-button disabled:opacity-50"
          >
            {submitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RotateCcw className="h-4 w-4" />
            )}
            Gerar novo Pix
          </button>
          {orderId && (
            <Link to="/minha-conta" className="aura-button-outline">
              Acompanhar pedido
            </Link>
          )}
        </div>
      </div>
    );
  }

  if (stage === "pix") {
    const expiresAt = pix?.expiresAt ? new Date(pix.expiresAt) : null;

    return (
      <div className="aura-container py-12 max-w-lg">
        <div className="aura-card space-y-4 p-6 text-center">
          <h1 className="font-display text-2xl text-primary">Pague com Pix</h1>
          <p className="text-sm text-muted-foreground">
            Escaneie o QR Code com o app do seu banco. Aguardaremos a confirmação automaticamente.
          </p>
          {pix?.qrBase64 ? (
            <img
              alt="QR Code Pix"
              src={`data:image/png;base64,${pix.qrBase64}`}
              className="mx-auto h-64 w-64 rounded-lg border border-border bg-white p-2"
            />
          ) : (
            <div className="h-64 w-64 mx-auto flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          )}
          {pix?.copyPaste && (
            <div>
              <label className="aura-label">Pix copia e cola</label>
              <div className="flex gap-2">
                <input readOnly value={pix.copyPaste} className="aura-input flex-1 text-xs" />
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(pix.copyPaste!);
                    toast.success("Código copiado");
                  }}
                  className="aura-button-outline min-h-10 px-3 py-2"
                >
                  <Copy className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
          {expiresAt && (
            <p className="text-xs text-muted-foreground">
              QR Code válido até {expiresAt.toLocaleString("pt-BR")}
            </p>
          )}
          <div className="text-xs text-muted-foreground inline-flex items-center gap-2">
            <Loader2 className="h-3 w-3 animate-spin" /> Aguardando confirmação do Mercado Pago...
          </div>
          {pollFailures > 0 && (
            <p className="text-xs text-destructive">
              Não foi possível consultar o status agora. A tentativa automática continuará.
            </p>
          )}
          <button
            type="button"
            onClick={() => void refreshCurrentStatus({ manual: true })}
            disabled={statusLoading}
            className="aura-button-outline mx-auto min-h-10 px-4 py-2 disabled:opacity-50"
          >
            {statusLoading ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <RefreshCw className="h-3 w-3" />
            )}
            Atualizar status
          </button>
          {orderId && (
            <Link to="/minha-conta" className="block text-xs text-primary hover:underline">
              Acompanhar pelo Minha Conta
            </Link>
          )}
        </div>
      </div>
    );
  }

  // form
  return (
    <div className="aura-container py-10 md:py-14">
      <div className="mb-9">
        <span className="aura-eyebrow">Checkout seguro</span>
        <h1 className="mt-2 font-display text-4xl text-foreground md:text-6xl">
          Finalize sua compra
        </h1>
        <p className="mt-2 max-w-xl text-muted-foreground">
          Um fluxo claro, protegido e cuidadoso para receber suas peças AuraLeve.
        </p>
        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          {[
            { icon: ShieldCheck, title: "Pagamento seguro", text: "Mercado Pago" },
            { icon: Truck, title: "Entrega acompanhada", text: "Para todo o Brasil" },
            { icon: PackageCheck, title: "Embalagem especial", text: "Com intenção" },
          ].map((item) => (
            <div
              key={item.title}
              className="flex items-center gap-3 rounded-lg border border-border bg-card/72 p-3"
            >
              <item.icon className="h-5 w-5 shrink-0 text-primary" />
              <span>
                <strong className="block text-xs text-foreground">{item.title}</strong>
                <span className="text-xs text-muted-foreground">{item.text}</span>
              </span>
            </div>
          ))}
        </div>
      </div>
      <form onSubmit={submit} className="grid gap-8 lg:grid-cols-[1fr_390px]">
        <div className="space-y-5">
          <Section title="Dados do cliente" number={1}>
            <Field label="Nome completo">
              <input
                className="aura-input"
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                maxLength={100}
                required
              />
            </Field>
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="E-mail">
                <input
                  type="email"
                  className="aura-input"
                  value={form.email}
                  onChange={(e) => set("email", e.target.value)}
                  maxLength={255}
                  required
                />
              </Field>
              <Field label="Telefone">
                <input
                  className="aura-input"
                  value={form.phone}
                  onChange={(e) => set("phone", e.target.value)}
                  maxLength={20}
                  required
                />
              </Field>
            </div>
          </Section>

          <Section title="Endereço de entrega" number={2}>
            <div className="grid sm:grid-cols-3 gap-4">
              <Field label="CEP">
                <input
                  className="aura-input"
                  value={form.cep}
                  onChange={(e) => set("cep", e.target.value)}
                  maxLength={10}
                  required
                />
              </Field>
              <Field label="Cidade">
                <input
                  className="aura-input"
                  value={form.city}
                  onChange={(e) => set("city", e.target.value)}
                  maxLength={100}
                  required
                />
              </Field>
              <Field label="Estado">
                <input
                  className="aura-input"
                  value={form.state}
                  onChange={(e) => set("state", e.target.value)}
                  maxLength={40}
                  required
                />
              </Field>
            </div>
            <Field label="Endereço">
              <input
                className="aura-input"
                value={form.address}
                onChange={(e) => set("address", e.target.value)}
                maxLength={200}
                required
              />
            </Field>
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Número">
                <input
                  className="aura-input"
                  value={form.number}
                  onChange={(e) => set("number", e.target.value)}
                  maxLength={20}
                  required
                />
              </Field>
              <Field label="Complemento (opcional)">
                <input
                  className="aura-input"
                  value={form.complement}
                  onChange={(e) => set("complement", e.target.value)}
                  maxLength={100}
                />
              </Field>
            </div>
          </Section>

          <Section title="Entrega" number={3}>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="flex cursor-pointer items-center justify-between gap-4 rounded-lg border border-primary bg-champagne/45 p-4 text-sm">
                <span className="flex items-center gap-3">
                  <span className="grid h-8 w-8 place-items-center rounded-md bg-primary text-primary-foreground">
                    <Truck className="h-4 w-4" />
                  </span>
                  <span>
                    <strong className="block text-foreground">Entrega padrão</strong>
                    <span className="text-xs text-muted-foreground">
                      Prazo estimado: 5 a 7 dias úteis
                    </span>
                  </span>
                </span>
                <span className="font-semibold text-primary">No checkout</span>
              </label>
              <label className="flex cursor-pointer items-center justify-between gap-4 rounded-lg border border-border bg-card p-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-3">
                  <span className="grid h-8 w-8 place-items-center rounded-md bg-champagne text-primary">
                    <MapPin className="h-4 w-4" />
                  </span>
                  <span>
                    <strong className="block text-foreground">Envio com cuidado</strong>
                    <span className="text-xs">O frete final é calculado pelo pedido.</span>
                  </span>
                </span>
              </label>
            </div>
          </Section>

          <Section title="Cupom de desconto" number={4}>
            {coupon ? (
              <div className="flex items-center justify-between rounded-lg border border-primary/40 bg-champagne px-3 py-2 text-sm">
                <span className="font-semibold uppercase text-primary">{coupon.code}</span>
                <button
                  type="button"
                  onClick={removeCoupon}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-2 sm:flex-row">
                <input
                  className="aura-input flex-1 uppercase"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  placeholder="Digite seu cupom"
                  maxLength={40}
                />
                <button
                  type="button"
                  onClick={applyCoupon}
                  disabled={validating || !couponCode.trim()}
                  className="aura-button-outline disabled:opacity-50"
                >
                  {validating ? "Validando..." : "Aplicar"}
                </button>
              </div>
            )}
          </Section>

          <Section title="Pagamento" number={5}>
            <div className="grid gap-3 sm:grid-cols-3">
              {(["pix", "credit", "debit"] as const).map((m) => (
                <label
                  key={m}
                  className={`cursor-pointer rounded-lg border p-4 text-center text-sm font-semibold transition ${form.paymentMethod === m ? "border-primary bg-champagne text-primary" : "border-border bg-card text-muted-foreground hover:border-primary"}`}
                >
                  <input
                    type="radio"
                    name="payment"
                    className="sr-only"
                    checked={form.paymentMethod === m}
                    onChange={() => set("paymentMethod", m)}
                  />
                  {m === "pix" ? "Pix" : m === "credit" ? "Cartão de crédito" : "Cartão de débito"}
                </label>
              ))}
            </div>

            {form.paymentMethod !== "pix" && (
              <div className="mt-4 grid gap-4 rounded-lg border border-border bg-card/55 p-5">
                {mpInitError && (
                  <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                    {mpInitError}
                  </div>
                )}
                <Field label="Número do cartão">
                  <input
                    className="aura-input"
                    value={card.cardNumber}
                    onChange={(e) => setCard({ ...card, cardNumber: maskCard(e.target.value) })}
                    placeholder="0000 0000 0000 0000"
                    inputMode="numeric"
                    maxLength={23}
                  />
                </Field>
                <Field label="Nome impresso no cartão">
                  <input
                    className="aura-input"
                    value={card.cardName}
                    onChange={(e) => setCard({ ...card, cardName: e.target.value })}
                    maxLength={100}
                  />
                </Field>
                <div className="grid sm:grid-cols-3 gap-4">
                  <Field label="Validade">
                    <input
                      className="aura-input"
                      value={card.cardExpiry}
                      onChange={(e) => setCard({ ...card, cardExpiry: maskExpiry(e.target.value) })}
                      placeholder="MM/AA"
                      maxLength={5}
                      inputMode="numeric"
                    />
                  </Field>
                  <Field label="CVV">
                    <input
                      className="aura-input"
                      value={card.cardCvv}
                      onChange={(e) =>
                        setCard({ ...card, cardCvv: onlyDigits(e.target.value).slice(0, 4) })
                      }
                      placeholder="123"
                      inputMode="numeric"
                    />
                  </Field>
                  <Field label="CPF do titular">
                    <input
                      className="aura-input"
                      value={card.cardCpf}
                      onChange={(e) => setCard({ ...card, cardCpf: maskCpf(e.target.value) })}
                      placeholder="000.000.000-00"
                      inputMode="numeric"
                    />
                  </Field>
                </div>
                {form.paymentMethod === "credit" && (
                  <Field label="Parcelas">
                    <select
                      className="aura-input"
                      value={installments}
                      onChange={(e) => setInstallments(Number(e.target.value))}
                    >
                      {[1, 2, 3, 4, 5, 6, 10, 12].map((n) => (
                        <option key={n} value={n}>
                          {n}x {formatBRL(total / n)}
                          {n === 1 ? " à vista" : " sem juros"}
                        </option>
                      ))}
                    </select>
                  </Field>
                )}
                <p className="text-[11px] text-muted-foreground">
                  Os dados do cartão são enviados diretamente ao Mercado Pago e nunca passam pelos
                  nossos servidores.
                </p>
              </div>
            )}

            {form.paymentMethod === "pix" && (
              <div className="mt-4 rounded-lg border border-border bg-champagne/45 p-5 text-sm text-muted-foreground">
                Após finalizar, geraremos um QR Code Pix real via Mercado Pago. A confirmação é
                automática.
              </div>
            )}
          </Section>
        </div>

        <aside className="aura-card h-fit space-y-5 p-6 lg:sticky lg:top-28">
          <h2 className="font-display text-2xl text-foreground">Resumo do pedido</h2>
          <ul className="space-y-2 text-sm">
            {items.map((i) => (
              <li key={i.product.id} className="flex justify-between gap-2">
                <span className="text-muted-foreground line-clamp-1">
                  {i.quantity}x {i.product.name}
                </span>
                <span>{formatBRL(finalPrice(i.product) * i.quantity)}</span>
              </li>
            ))}
          </ul>

          <div className="pt-2 border-t border-border space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span>{formatBRL(subtotal)}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-sm text-primary">
                <span>Cupom {coupon?.code}</span>
                <span>{formatBRL(discount)}</span>
              </div>
            )}
          </div>

          <div className="flex justify-between text-base font-semibold border-t border-border pt-4">
            <span>Total</span>
            <span className="text-primary">{formatBRL(total)}</span>
          </div>

          <button
            type="submit"
            disabled={
              submitting || (form.paymentMethod !== "pix" && (!!mpInitError || !mpPublicKey))
            }
            className="aura-button w-full disabled:opacity-50"
          >
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
            {submitting
              ? form.paymentMethod === "pix"
                ? "Gerando Pix..."
                : "Processando pagamento..."
              : "Finalizar compra"}
          </button>
          {checkoutError && (
            <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
              {checkoutError}
            </p>
          )}
          <p className="text-[11px] text-muted-foreground text-center">
            Pagamentos processados pelo Mercado Pago.
          </p>
          <div className="space-y-3 border-t border-border pt-4">
            {[
              { icon: CreditCard, title: "Pagamento protegido" },
              { icon: Home, title: "Pedido acompanhado na sua conta" },
              { icon: PackageCheck, title: "Peças embaladas com cuidado" },
            ].map((item) => (
              <div
                key={item.title}
                className="flex items-center gap-2 text-xs text-muted-foreground"
              >
                <item.icon className="h-4 w-4 text-primary" />
                {item.title}
              </div>
            ))}
          </div>
        </aside>
      </form>
    </div>
  );
}

function Section({
  title,
  number,
  children,
}: {
  title: string;
  number?: number;
  children: React.ReactNode;
}) {
  return (
    <div className="aura-card p-5 md:p-6">
      <div className="mb-4 flex items-center gap-3">
        {number ? (
          <span className="grid h-8 w-8 place-items-center rounded-md bg-primary text-sm font-bold text-primary-foreground">
            {number}
          </span>
        ) : null}
        <h2 className="font-display text-2xl text-foreground">{title}</h2>
      </div>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="aura-label">{label}</span>
      {children}
    </label>
  );
}
