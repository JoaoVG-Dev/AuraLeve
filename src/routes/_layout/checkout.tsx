import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useShop } from "@/lib/store";
import { useProducts, validateCoupon } from "@/lib/catalog";
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
import { CheckCircle2, X, Copy, Loader2, Clock, XCircle, RefreshCw, RotateCcw } from "lucide-react";

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
const maskCard = (v: string) => onlyDigits(v).slice(0, 19).replace(/(\d{4})(?=\d)/g, "$1 ");
const maskExpiry = (v: string) => {
  const d = onlyDigits(v).slice(0, 4);
  return d.length <= 2 ? d : `${d.slice(0, 2)}/${d.slice(2)}`;
};
const maskCpf = (v: string) =>
  onlyDigits(v).slice(0, 11).replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d)/, "$1-$2");

const debitPaymentMethodByBrand: Record<string, string> = {
  cabal: "debcabal",
  elo: "debelo",
  master: "debmaster",
  mastercard: "debmaster",
  visa: "debvisa",
};

function normalizeMpList(response: any) {
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

function resolveCardPaymentMethod(methods: any[], kind: "credit" | "debit", cardNumber: string) {
  const expectedType = kind === "debit" ? "debit_card" : "credit_card";
  const direct = methods.find((method: any) => method?.payment_type_id === expectedType);
  if (direct) return direct;

  const fallback = methods[0];
  if (kind !== "debit") return fallback;

  const id = debitPaymentMethodId(cardNumber, fallback?.id);
  if (!id) return fallback;

  return {
    ...fallback,
    id,
    payment_type_id: "debit_card",
  };
}

let mpSdkPromise: Promise<any> | null = null;
function loadMpSdk(): Promise<any> {
  if (typeof window === "undefined") return Promise.reject(new Error("SSR"));
  if ((window as any).MercadoPago) return Promise.resolve((window as any).MercadoPago);
  if (mpSdkPromise) return mpSdkPromise;
  mpSdkPromise = new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = "https://sdk.mercadopago.com/js/v2";
    s.async = true;
    s.onload = () => resolve((window as any).MercadoPago);
    s.onerror = () => reject(new Error("Falha ao carregar SDK do Mercado Pago"));
    document.head.appendChild(s);
  });
  return mpSdkPromise;
}

type Stage = "form" | "pix" | "approved" | "rejected" | "pending" | "expired";
type PixState = { qrBase64?: string; copyPaste?: string; expiresAt?: string | null };

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

  const [stage, setStage] = useState<Stage>("form");
  const [orderId, setOrderId] = useState<string | null>(null);
  const [orderPaymentMethod, setOrderPaymentMethod] = useState<CustomerInfo["paymentMethod"] | null>(null);
  const [pix, setPix] = useState<PixState | null>(null);
  const [statusDetail, setStatusDetail] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [statusLoading, setStatusLoading] = useState(false);
  const [pollFailures, setPollFailures] = useState(0);
  const [form, setForm] = useState<CustomerInfo>({
    name: "", email: "", phone: "", cep: "", address: "", number: "",
    complement: "", city: "", state: "", paymentMethod: "pix",
  });
  const [card, setCard] = useState({ cardNumber: "", cardName: "", cardExpiry: "", cardCvv: "", cardCpf: "" });
  const [installments, setInstallments] = useState(1);
  const [couponCode, setCouponCode] = useState("");
  const [coupon, setCoupon] = useState<Coupon | null>(null);
  const [discount, setDiscount] = useState(0);
  const [validating, setValidating] = useState(false);
  const [mpPublicKey, setMpPublicKey] = useState<string | null>(null);
  const [mpInitError, setMpInitError] = useState<string | null>(null);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const mpClientRef = useRef<any>(null);
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
      } catch (error: any) {
        if (!active) return;
        mpClientRef.current = null;
        setMpPublicKey(null);
        setMpInitError(error?.message || "Não foi possível inicializar o Mercado Pago");
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
      name: form.name, email: form.email, phone: form.phone,
      cep: form.cep, address: form.address, number: form.number,
      complement: form.complement, city: form.city, state: form.state,
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

  const refreshCurrentStatus = useCallback(async ({ manual = false }: { manual?: boolean } = {}) => {
    if (!orderId) return;
    if (manual) setStatusLoading(true);

    try {
      const r = await refreshStatus({ data: { orderId } });
      setPollFailures(0);
      setStatusDetail(("providerStatus" in r ? r.providerStatus : null) ?? r.paymentStatus ?? null);
      if (r.expiresAt) setPix((current) => current ? { ...current, expiresAt: r.expiresAt } : current);

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
  }, [orderId, refreshStatus, clearCart]);

  // Pix polling
  useEffect(() => {
    if (stage !== "pix" || !orderId) return;
    pollRef.current = window.setInterval(() => {
      void refreshCurrentStatus();
    }, 4000);
    return () => { if (pollRef.current) window.clearInterval(pollRef.current); };
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
    return <div className="aura-container py-16 text-center text-muted-foreground">Carregando checkout...</div>;
  }

  if (items.length === 0 && stage === "form") {
    return null;
  }

  const applyCoupon = async () => {
    setValidating(true);
    const res = await validateCoupon(couponCode, subtotal);
    setValidating(false);
    if (!res.ok) { setCoupon(null); setDiscount(0); toast.error(res.reason || "Cupom inválido"); return; }
    setCoupon(res.coupon!); setDiscount(res.discount!);
    toast.success(`Cupom aplicado: -${formatBRL(res.discount!)}`);
  };
  const removeCoupon = () => { setCoupon(null); setDiscount(0); setCouponCode(""); toast.info("Cupom removido"); };

  const refreshAppliedCoupon = async () => {
    if (!coupon) return true;
    const res = await validateCoupon(coupon.code, subtotal);
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
      if (i.quantity > i.product.stock) return toast.error(`Estoque insuficiente para ${i.product.name}`);
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
        throw new Error("Pix indisponível nesta conta Mercado Pago. Use cartão ou tente novamente mais tarde.");
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
        const methods = normalizeMpList(methodsRes);
        const method = resolveCardPaymentMethod(methods, form.paymentMethod, cardNumber);
        if (!method?.id) throw new Error("Bandeira do cartão não suportada");

        let issuerId: string | undefined;
        try {
          const issuersRes = await mp.getIssuers({ paymentMethodId: method.id, bin });
          const issuer = normalizeMpList(issuersRes)[0];
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
        if (r.status === "approved") { setStage("approved"); clearCart(); toast.success("Pagamento aprovado"); }
        else if (r.status === "in_process" || r.status === "authorized" || r.status === "pending") {
          setStage("pending"); toast.message("Pagamento em análise");
        } else {
          setStage("rejected"); toast.error("Pagamento recusado");
        }
      }
    } catch (err: any) {
      const message = err?.message || "Não foi possível finalizar o pedido";
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
    } catch (err: any) {
      const message = err?.message || "Não foi possível gerar outro Pix";
      setCheckoutError(message);
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  const set = <K extends keyof CustomerInfo>(k: K, v: CustomerInfo[K]) => setForm((f) => ({ ...f, [k]: v }));

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
          {orderId && <Link to="/minha-conta" className="rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground">Ver meu pedido</Link>}
          <button onClick={() => navigate({ to: "/" })} className="rounded-full border border-border px-6 py-3 text-sm font-medium text-muted-foreground hover:text-primary hover:border-primary">Voltar à home</button>
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
        {statusDetail && <p className="text-xs text-muted-foreground mb-6">Detalhe: {statusDetail}</p>}
        {orderId && <Link to="/minha-conta" className="rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground">Acompanhar pedido</Link>}
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
        {statusDetail && <p className="text-xs text-muted-foreground mb-6">Detalhe: {statusDetail}</p>}
        <div className="flex gap-3 justify-center flex-wrap">
          <button
            onClick={() => { setStage("form"); setCheckoutError(null); }}
            className="rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground inline-flex items-center gap-2"
          >
            <RotateCcw className="h-4 w-4" /> Tentar cartão novamente
          </button>
          <button
            onClick={() => { setOrderId(null); setOrderPaymentMethod(null); setStage("form"); setCheckoutError(null); }}
            className="rounded-full border border-border px-6 py-3 text-sm font-medium text-muted-foreground hover:text-primary hover:border-primary"
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
          O QR Code Pix venceu antes da confirmação. Você pode atualizar o status ou gerar um novo QR Code para o mesmo pedido.
        </p>
        {statusDetail && <p className="text-xs text-muted-foreground mb-6">Detalhe: {statusDetail}</p>}
        {checkoutError && <p className="text-xs text-destructive mb-4">{checkoutError}</p>}
        <div className="flex gap-3 justify-center flex-wrap">
          <button
            onClick={() => void refreshCurrentStatus({ manual: true })}
            disabled={statusLoading}
            className="rounded-full border border-border px-6 py-3 text-sm font-medium text-muted-foreground hover:text-primary hover:border-primary disabled:opacity-50 inline-flex items-center gap-2"
          >
            {statusLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            Atualizar status
          </button>
          <button
            onClick={() => void retryPixPayment()}
            disabled={submitting}
            className="rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground disabled:opacity-50 inline-flex items-center gap-2"
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4" />}
            Gerar novo Pix
          </button>
          {orderId && <Link to="/minha-conta" className="rounded-full border border-border px-6 py-3 text-sm font-medium text-muted-foreground hover:text-primary hover:border-primary">Acompanhar pedido</Link>}
        </div>
      </div>
    );
  }

  if (stage === "pix") {
    const expiresAt = pix?.expiresAt ? new Date(pix.expiresAt) : null;

    return (
      <div className="aura-container py-12 max-w-lg">
        <div className="rounded-2xl border border-border bg-card p-6 text-center space-y-4">
          <h1 className="font-display text-2xl text-primary">Pague com Pix</h1>
          <p className="text-sm text-muted-foreground">Escaneie o QR Code com o app do seu banco. Aguardaremos a confirmação automaticamente.</p>
          {pix?.qrBase64 ? (
            <img alt="QR Code Pix" src={`data:image/png;base64,${pix.qrBase64}`} className="mx-auto h-64 w-64 rounded-xl border border-border bg-white p-2" />
          ) : (
            <div className="h-64 w-64 mx-auto flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
          )}
          {pix?.copyPaste && (
            <div>
              <label className="block text-xs uppercase tracking-wider text-primary font-semibold mb-1.5">Pix copia e cola</label>
              <div className="flex gap-2">
                <input readOnly value={pix.copyPaste} className="aura-input flex-1 text-xs" />
                <button
                  type="button"
                  onClick={() => { navigator.clipboard.writeText(pix.copyPaste!); toast.success("Código copiado"); }}
                  className="rounded-full bg-accent text-primary px-4 text-xs font-semibold hover:bg-accent/80"
                ><Copy className="h-4 w-4" /></button>
              </div>
            </div>
          )}
          {expiresAt && (
            <p className="text-xs text-muted-foreground">
              QR Code válido até {expiresAt.toLocaleString("pt-BR")}
            </p>
          )}
          <div className="text-xs text-muted-foreground inline-flex items-center gap-2"><Loader2 className="h-3 w-3 animate-spin" /> Aguardando confirmação do Mercado Pago…</div>
          {pollFailures > 0 && (
            <p className="text-xs text-destructive">
              Não foi possível consultar o status agora. A tentativa automática continuará.
            </p>
          )}
          <button
            type="button"
            onClick={() => void refreshCurrentStatus({ manual: true })}
            disabled={statusLoading}
            className="mx-auto rounded-full border border-border px-4 py-2 text-xs font-medium text-muted-foreground hover:text-primary hover:border-primary disabled:opacity-50 inline-flex items-center gap-2"
          >
            {statusLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
            Atualizar status
          </button>
          {orderId && <Link to="/minha-conta" className="block text-xs text-primary hover:underline">Acompanhar pelo Minha Conta</Link>}
        </div>
        <style>{`
          .aura-input { width: 100%; border-radius: 0.75rem; border: 1px solid var(--color-border);
            background: var(--color-card); padding: 0.55rem 0.7rem; font-size: 0.875rem;
            color: var(--color-foreground); outline: none; }
        `}</style>
      </div>
    );
  }

  // form
  return (
    <div className="aura-container py-12">
      <h1 className="aura-section-title mb-10">Checkout</h1>
      <form onSubmit={submit} className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <Section title="Seus dados">
            <Field label="Nome completo">
              <input className="aura-input" value={form.name} onChange={(e) => set("name", e.target.value)} maxLength={100} required />
            </Field>
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="E-mail"><input type="email" className="aura-input" value={form.email} onChange={(e) => set("email", e.target.value)} maxLength={255} required /></Field>
              <Field label="Telefone"><input className="aura-input" value={form.phone} onChange={(e) => set("phone", e.target.value)} maxLength={20} required /></Field>
            </div>
          </Section>

          <Section title="Endereço de entrega">
            <div className="grid sm:grid-cols-3 gap-4">
              <Field label="CEP"><input className="aura-input" value={form.cep} onChange={(e) => set("cep", e.target.value)} maxLength={10} required /></Field>
              <Field label="Cidade"><input className="aura-input" value={form.city} onChange={(e) => set("city", e.target.value)} maxLength={100} required /></Field>
              <Field label="Estado"><input className="aura-input" value={form.state} onChange={(e) => set("state", e.target.value)} maxLength={40} required /></Field>
            </div>
            <Field label="Endereço"><input className="aura-input" value={form.address} onChange={(e) => set("address", e.target.value)} maxLength={200} required /></Field>
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Número"><input className="aura-input" value={form.number} onChange={(e) => set("number", e.target.value)} maxLength={20} required /></Field>
              <Field label="Complemento (opcional)"><input className="aura-input" value={form.complement} onChange={(e) => set("complement", e.target.value)} maxLength={100} /></Field>
            </div>
          </Section>

          <Section title="Forma de pagamento">
            <div className="grid sm:grid-cols-3 gap-3">
              {(["pix", "credit", "debit"] as const).map((m) => (
                <label key={m} className={`cursor-pointer rounded-xl border p-4 text-center text-sm font-medium transition ${form.paymentMethod === m ? "border-primary bg-accent text-primary" : "border-border bg-card text-muted-foreground hover:border-primary"}`}>
                  <input type="radio" name="payment" className="sr-only" checked={form.paymentMethod === m} onChange={() => set("paymentMethod", m)} />
                  {m === "pix" ? "PIX" : m === "credit" ? "Cartão de crédito" : "Cartão de débito"}
                </label>
              ))}
            </div>

            {form.paymentMethod !== "pix" && (
              <div className="mt-4 rounded-2xl border border-border p-5 grid gap-4">
                {mpInitError && (
                  <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                    {mpInitError}
                  </div>
                )}
                <Field label="Número do cartão">
                  <input className="aura-input" value={card.cardNumber} onChange={(e) => setCard({ ...card, cardNumber: maskCard(e.target.value) })} placeholder="0000 0000 0000 0000" inputMode="numeric" maxLength={23} />
                </Field>
                <Field label="Nome impresso no cartão"><input className="aura-input" value={card.cardName} onChange={(e) => setCard({ ...card, cardName: e.target.value })} maxLength={100} /></Field>
                <div className="grid sm:grid-cols-3 gap-4">
                  <Field label="Validade"><input className="aura-input" value={card.cardExpiry} onChange={(e) => setCard({ ...card, cardExpiry: maskExpiry(e.target.value) })} placeholder="MM/AA" maxLength={5} inputMode="numeric" /></Field>
                  <Field label="CVV"><input className="aura-input" value={card.cardCvv} onChange={(e) => setCard({ ...card, cardCvv: onlyDigits(e.target.value).slice(0, 4) })} placeholder="123" inputMode="numeric" /></Field>
                  <Field label="CPF do titular"><input className="aura-input" value={card.cardCpf} onChange={(e) => setCard({ ...card, cardCpf: maskCpf(e.target.value) })} placeholder="000.000.000-00" inputMode="numeric" /></Field>
                </div>
                {form.paymentMethod === "credit" && (
                  <Field label="Parcelas">
                    <select className="aura-input" value={installments} onChange={(e) => setInstallments(Number(e.target.value))}>
                      {[1,2,3,4,5,6,10,12].map((n) => (
                        <option key={n} value={n}>{n}× {formatBRL(total / n)}{n === 1 ? " à vista" : " sem juros"}</option>
                      ))}
                    </select>
                  </Field>
                )}
                <p className="text-[11px] text-muted-foreground">
                  Os dados do cartão são enviados diretamente ao Mercado Pago e nunca passam pelos nossos servidores.
                </p>
              </div>
            )}

            {form.paymentMethod === "pix" && (
              <div className="mt-4 rounded-2xl border border-border bg-accent/30 p-5 text-sm text-muted-foreground">
                Após finalizar, geraremos um QR Code Pix real via Mercado Pago. A confirmação é automática.
              </div>
            )}
          </Section>
        </div>

        <aside className="rounded-2xl border border-border bg-card p-6 h-fit sticky top-20 space-y-4">
          <h2 className="font-display text-xl text-primary">Resumo do pedido</h2>
          <ul className="space-y-2 text-sm">
            {items.map((i) => (
              <li key={i.product.id} className="flex justify-between gap-2">
                <span className="text-muted-foreground line-clamp-1">{i.quantity}× {i.product.name}</span>
                <span>{formatBRL(finalPrice(i.product) * i.quantity)}</span>
              </li>
            ))}
          </ul>

          <div className="pt-2 border-t border-border space-y-2">
            <div className="flex justify-between text-sm"><span className="text-muted-foreground">Subtotal</span><span>{formatBRL(subtotal)}</span></div>
            {discount > 0 && <div className="flex justify-between text-sm text-primary"><span>Cupom {coupon?.code}</span><span>−{formatBRL(discount)}</span></div>}
          </div>

          <div className="pt-2 border-t border-border">
            <label className="block text-xs uppercase tracking-[0.18em] text-primary font-semibold mb-1.5">Cupom de desconto</label>
            {coupon ? (
              <div className="flex items-center justify-between rounded-xl border border-primary/40 bg-accent px-3 py-2 text-sm">
                <span className="font-semibold uppercase text-primary">{coupon.code}</span>
                <button type="button" onClick={removeCoupon} className="text-muted-foreground hover:text-destructive"><X className="h-4 w-4" /></button>
              </div>
            ) : (
              <div className="flex gap-2">
                <input className="aura-input flex-1 uppercase" value={couponCode} onChange={(e) => setCouponCode(e.target.value.toUpperCase())} placeholder="AURA10" maxLength={40} />
                <button type="button" onClick={applyCoupon} disabled={validating || !couponCode.trim()} className="rounded-full bg-accent text-primary px-4 text-xs font-semibold hover:bg-accent/80 disabled:opacity-50">{validating ? "..." : "Aplicar"}</button>
              </div>
            )}
          </div>

          <div className="flex justify-between text-base font-semibold border-t border-border pt-4"><span>Total</span><span className="text-primary">{formatBRL(total)}</span></div>

          <button type="submit" disabled={submitting || (form.paymentMethod !== "pix" && (!!mpInitError || !mpPublicKey))} className="w-full rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:opacity-95 disabled:opacity-50 inline-flex items-center justify-center gap-2">
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
            {submitting ? (form.paymentMethod === "pix" ? "Gerando Pix..." : "Processando pagamento...") : "Finalizar compra"}
          </button>
          {checkoutError && (
            <p className="rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
              {checkoutError}
            </p>
          )}
          <p className="text-[11px] text-muted-foreground text-center">Pagamentos processados pelo Mercado Pago.</p>
        </aside>
      </form>

      <style>{`
        .aura-input { width: 100%; border-radius: 0.75rem; border: 1px solid var(--color-border);
          background: var(--color-card); padding: 0.65rem 0.9rem; font-size: 0.875rem;
          color: var(--color-foreground); outline: none; transition: border-color .15s, box-shadow .15s; }
        .aura-input:focus { border-color: var(--color-primary); box-shadow: 0 0 0 3px color-mix(in oklab, var(--color-primary) 18%, transparent); }
      `}</style>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <h2 className="font-display text-xl text-primary mb-4">{title}</h2>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-xs uppercase tracking-[0.18em] text-primary font-semibold mb-1.5">{label}</span>
      {children}
    </label>
  );
}
