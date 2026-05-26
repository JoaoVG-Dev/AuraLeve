import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, signOut } from "@/hooks/use-auth";
import { Field, AuraInputStyle } from "./login";
import { useMyOrders, useOrderDetail } from "@/lib/catalog";
import { formatBRL } from "@/lib/types";
import { LogOut, Package, MapPin, User, ChevronRight, ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/_layout/minha-conta")({
  component: AccountPage,
});

type Tab = "data" | "orders";

function AccountPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("data");
  const [openOrderId, setOpenOrderId] = useState<string | null>(null);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/login" });
  }, [user, loading, navigate]);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("full_name, phone")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setFullName(data.full_name ?? "");
          setPhone(data.phone ?? "");
        }
      });
  }, [user]);

  if (loading || !user) {
    return (
      <div className="aura-container py-20 text-center text-muted-foreground">Carregando...</div>
    );
  }

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .upsert({ id: user.id, full_name: fullName.trim(), phone: phone.trim() });
    setSaving(false);
    if (error) return toast.error("Não foi possível salvar");
    toast.success("Dados atualizados");
  };

  const logout = async () => {
    await signOut();
    toast.success("Você saiu da conta");
    navigate({ to: "/" });
  };

  return (
    <div className="aura-container py-12 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8 flex-wrap gap-3">
        <div>
          <h1 className="aura-section-title">Minha conta</h1>
          <p className="text-sm text-muted-foreground">{user.email}</p>
        </div>
        <button
          onClick={logout}
          className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm text-muted-foreground hover:text-primary hover:border-primary transition"
        >
          <LogOut className="h-4 w-4" /> Sair
        </button>
      </div>

      <div className="grid sm:grid-cols-3 gap-3 mb-8">
        <Card
          icon={<User className="h-5 w-5" />}
          title="Meus dados"
          active={tab === "data"}
          onClick={() => {
            setTab("data");
            setOpenOrderId(null);
          }}
        />
        <Card
          icon={<Package className="h-5 w-5" />}
          title="Meus pedidos"
          active={tab === "orders"}
          onClick={() => {
            setTab("orders");
          }}
        />
        <Card icon={<MapPin className="h-5 w-5" />} title="Endereços" hint="Em breve" />
      </div>

      {tab === "data" && (
        <form onSubmit={save} className="rounded-2xl border border-border bg-card p-6 space-y-4">
          <h2 className="font-display text-xl text-primary">Meus dados</h2>
          <Field label="Nome completo">
            <input
              className="aura-input"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              maxLength={100}
            />
          </Field>
          <Field label="Telefone">
            <input
              className="aura-input"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              maxLength={20}
            />
          </Field>
          <button
            type="submit"
            disabled={saving}
            className="rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:opacity-95 disabled:opacity-50"
          >
            {saving ? "Salvando..." : "Salvar alterações"}
          </button>
        </form>
      )}

      {tab === "orders" && !openOrderId && <OrdersList userId={user.id} onOpen={setOpenOrderId} />}
      {tab === "orders" && openOrderId && (
        <OrderDetail orderId={openOrderId} onBack={() => setOpenOrderId(null)} />
      )}

      <AuraInputStyle />
    </div>
  );
}

function OrdersList({ userId, onOpen }: { userId: string; onOpen: (id: string) => void }) {
  const { data: orders = [], isLoading } = useMyOrders(userId);
  if (isLoading)
    return <div className="text-center text-muted-foreground py-12">Carregando pedidos...</div>;
  if (orders.length === 0) {
    return (
      <div className="rounded-2xl border border-border bg-card p-10 text-center">
        <Package className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
        <p className="text-muted-foreground">Você ainda não fez nenhum pedido.</p>
      </div>
    );
  }
  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden">
      <h2 className="font-display text-xl text-primary px-6 pt-6">Meus pedidos</h2>
      <ul className="divide-y divide-border mt-4">
        {orders.map((o) => (
          <li key={o.id}>
            <button
              onClick={() => onOpen(o.id)}
              className="w-full flex items-center justify-between gap-3 px-6 py-4 hover:bg-accent/40 transition text-left"
            >
              <div className="min-w-0">
                <div className="text-sm font-medium text-foreground">
                  Pedido #{o.id.slice(0, 8).toUpperCase()}
                </div>
                <div className="text-xs text-muted-foreground">
                  {new Date(o.created_at).toLocaleString("pt-BR")} ·{" "}
                  {o.payment_method.toUpperCase()}
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <StatusBadge status={o.status} />
                <span className="font-semibold text-primary">{formatBRL(Number(o.total))}</span>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </div>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function OrderDetail({ orderId, onBack }: { orderId: string; onBack: () => void }) {
  const { data, isLoading } = useOrderDetail(orderId);
  if (isLoading || !data)
    return <div className="text-center text-muted-foreground py-12">Carregando pedido...</div>;
  const { order, items } = data;
  if (!order)
    return <div className="text-center text-muted-foreground py-12">Pedido não encontrado.</div>;

  return (
    <div className="space-y-6">
      <button
        onClick={onBack}
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary"
      >
        <ArrowLeft className="h-4 w-4" /> Voltar para pedidos
      </button>

      <div className="rounded-2xl border border-border bg-card p-6">
        <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
          <div>
            <h2 className="font-display text-xl text-primary">
              Pedido #{order.id.slice(0, 8).toUpperCase()}
            </h2>
            <p className="text-xs text-muted-foreground">
              {new Date(order.created_at).toLocaleString("pt-BR")}
            </p>
          </div>
          <div className="flex gap-2">
            <StatusBadge status={order.status} />
            <PaymentBadge status={order.payment_status} />
          </div>
        </div>

        <ul className="divide-y divide-border">
          {items.map((it) => (
            <li key={it.id} className="flex gap-3 py-3 items-center">
              {it.product_image && (
                <img src={it.product_image} alt="" className="h-14 w-14 rounded-lg object-cover" />
              )}
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium line-clamp-1">{it.product_name}</div>
                <div className="text-xs text-muted-foreground">
                  {it.quantity} × {formatBRL(Number(it.unit_price))}
                </div>
              </div>
              <div className="text-sm font-semibold">{formatBRL(Number(it.subtotal))}</div>
            </li>
          ))}
        </ul>

        <div className="border-t border-border pt-4 mt-4 space-y-1 text-sm">
          <Row label="Subtotal" value={formatBRL(Number(order.subtotal))} />
          {Number(order.discount) > 0 && (
            <Row
              label={`Cupom ${order.coupon_code ?? ""}`}
              value={`−${formatBRL(Number(order.discount))}`}
              accent
            />
          )}
          <Row label="Frete" value={formatBRL(Number(order.shipping))} />
          <div className="flex justify-between text-base font-semibold pt-2 border-t border-border mt-2">
            <span>Total</span>
            <span className="text-primary">{formatBRL(Number(order.total))}</span>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-6 text-sm">
        <h3 className="font-display text-lg text-primary mb-3">Entrega</h3>
        <p className="text-foreground">{order.customer_name}</p>
        <p className="text-muted-foreground">
          {order.customer_email} · {order.customer_phone}
        </p>
        <p className="text-muted-foreground mt-2">
          {order.address_line}, {order.address_number}
          {order.address_complement ? ` — ${order.address_complement}` : ""}
          <br />
          {order.address_city} / {order.address_state} · CEP {order.address_cep}
        </p>
      </div>
    </div>
  );
}

function Row({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className={`flex justify-between ${accent ? "text-primary" : "text-muted-foreground"}`}>
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}

const STATUS_LABEL: Record<string, string> = {
  pending: "Aguardando",
  paid: "Pago",
  processing: "Em preparo",
  shipped: "Enviado",
  delivered: "Entregue",
  cancelled: "Cancelado",
};
const PAYMENT_LABEL: Record<string, string> = {
  pending: "Pgto. pendente",
  paid: "Pago",
  failed: "Falhou",
  refunded: "Reembolsado",
  expired: "Expirado",
};

export function StatusBadge({ status }: { status: string }) {
  const tone =
    status === "delivered"
      ? "bg-primary/10 text-primary ring-primary/15"
      : status === "cancelled"
        ? "bg-destructive/10 text-destructive ring-destructive/15"
        : status === "shipped" || status === "processing"
          ? "bg-gold/15 text-gold-foreground ring-gold/25"
          : "bg-muted text-muted-foreground ring-border";
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider ring-1 ${tone}`}
    >
      {STATUS_LABEL[status] ?? status}
    </span>
  );
}
export function PaymentBadge({ status }: { status: string }) {
  const tone =
    status === "paid"
      ? "bg-primary/10 text-primary ring-primary/15"
      : status === "failed" || status === "expired"
        ? "bg-destructive/10 text-destructive ring-destructive/15"
        : "bg-muted text-muted-foreground ring-border";
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider ring-1 ${tone}`}
    >
      {PAYMENT_LABEL[status] ?? status}
    </span>
  );
}

function Card({
  icon,
  title,
  hint,
  active,
  onClick,
}: {
  icon: React.ReactNode;
  title: string;
  hint?: string;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!onClick}
      className={`text-left rounded-2xl border p-4 flex items-center gap-3 transition ${active ? "border-primary bg-accent/40" : "border-border bg-card hover:border-primary/40"} ${!onClick ? "opacity-60 cursor-not-allowed" : ""}`}
    >
      <div
        className={`h-10 w-10 rounded-full grid place-items-center ${active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}
      >
        {icon}
      </div>
      <div>
        <div className="font-medium text-sm text-foreground">{title}</div>
        {hint && <div className="text-xs text-muted-foreground">{hint}</div>}
      </div>
    </button>
  );
}
