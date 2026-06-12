import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  CreditCard,
  Heart,
  LogOut,
  MapPin,
  Package,
  Settings,
  Star,
  User,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AuraLeveSymbol } from "@/components/AuraLeveLogo";
import { useAuth, signOut } from "@/hooks/use-auth";
import { useMyOrders, useOrderDetail } from "@/lib/catalog";
import { formatBRL } from "@/lib/types";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_layout/minha-conta")({
  component: AccountPage,
});

type Tab = "data" | "orders";

const menu = [
  { id: "data" as const, label: "Minha conta", icon: User },
  { id: "orders" as const, label: "Meus pedidos", icon: Package },
  { id: "addresses", label: "Endereços", icon: MapPin, disabled: true },
  { id: "payments", label: "Formas de pagamento", icon: CreditCard, disabled: true },
  { id: "favorites", label: "Favoritos", icon: Heart, disabled: true },
  { id: "reviews", label: "Avaliações", icon: Star, disabled: true },
  { id: "settings", label: "Configurações", icon: Settings, disabled: true },
];

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
    <div className="aura-container py-10 md:py-14">
      <div className="mb-8">
        <span className="aura-eyebrow">Conta do cliente</span>
        <h1 className="mt-2 font-display text-4xl text-foreground md:text-6xl">Minha conta</h1>
        <p className="mt-2 text-sm text-muted-foreground">{user.email}</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
        <aside className="aura-card h-fit overflow-hidden p-3 lg:sticky lg:top-28">
          <nav className="space-y-1">
            {menu.map((item) => {
              const Icon = item.icon;
              const active = item.id === tab;
              return (
                <button
                  key={item.id}
                  type="button"
                  disabled={item.disabled}
                  onClick={() => {
                    if (item.id === "data" || item.id === "orders") {
                      setTab(item.id);
                      setOpenOrderId(null);
                    }
                  }}
                  className={`flex w-full items-center gap-3 rounded-md px-3 py-3 text-left text-sm font-semibold transition ${
                    active
                      ? "bg-champagne text-primary"
                      : "text-muted-foreground hover:bg-champagne/55 hover:text-primary"
                  } ${item.disabled ? "cursor-not-allowed opacity-55" : ""}`}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </button>
              );
            })}
          </nav>
          <button
            onClick={logout}
            className="mt-3 flex w-full items-center gap-3 border-t border-border px-3 py-3 text-sm font-semibold text-primary transition hover:bg-champagne"
            type="button"
          >
            <LogOut className="h-4 w-4" /> Sair da conta
          </button>
        </aside>

        <section className="min-w-0">
          {tab === "data" && (
            <form onSubmit={save} className="aura-card relative overflow-hidden p-5 md:p-7">
              <AuraLeveSymbol className="aura-symbol-watermark absolute right-8 top-8 h-36" />
              <div className="relative">
                <h2 className="font-display text-3xl text-foreground">Meus dados</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Atualize suas informações pessoais com segurança.
                </p>
                <div className="mt-6 grid gap-4">
                  <Field label="Nome completo">
                    <input
                      className="aura-input"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      maxLength={100}
                    />
                  </Field>
                  <Field label="E-mail">
                    <input className="aura-input" value={user.email ?? ""} disabled />
                  </Field>
                  <Field label="Telefone">
                    <input
                      className="aura-input"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      maxLength={20}
                    />
                  </Field>
                </div>
                <button type="submit" disabled={saving} className="aura-button mt-6">
                  {saving ? "Salvando..." : "Salvar alterações"}
                </button>
              </div>
            </form>
          )}

          {tab === "orders" && !openOrderId && (
            <OrdersList userId={user.id} onOpen={setOpenOrderId} />
          )}
          {tab === "orders" && openOrderId && (
            <OrderDetail orderId={openOrderId} onBack={() => setOpenOrderId(null)} />
          )}
        </section>
      </div>
    </div>
  );
}

function OrdersList({ userId, onOpen }: { userId: string; onOpen: (id: string) => void }) {
  const { data: orders = [], isLoading } = useMyOrders(userId);

  if (isLoading) {
    return <div className="py-12 text-center text-muted-foreground">Carregando pedidos...</div>;
  }

  if (orders.length === 0) {
    return (
      <div className="aura-card p-10 text-center">
        <Package className="mx-auto mb-4 h-12 w-12 text-primary" />
        <h2 className="font-display text-3xl text-foreground">Você ainda não fez nenhum pedido</h2>
        <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
          Quando uma compra for finalizada, o histórico aparecerá aqui com status e detalhes.
        </p>
        <Link to="/catalogo" className="aura-button mt-6">
          Explorar catálogo
        </Link>
      </div>
    );
  }

  return (
    <div className="aura-card overflow-hidden">
      <div className="border-b border-border px-5 py-5 md:px-6">
        <h2 className="font-display text-3xl text-foreground">Meus pedidos</h2>
        <p className="text-sm text-muted-foreground">
          Acompanhe status e detalhes dos seus pedidos.
        </p>
      </div>
      <ul className="divide-y divide-border">
        {orders.map((o) => (
          <li key={o.id}>
            <button
              onClick={() => onOpen(o.id)}
              className="grid w-full gap-4 px-5 py-4 text-left transition hover:bg-champagne/38 md:grid-cols-[1fr_auto] md:items-center md:px-6"
              type="button"
            >
              <div className="min-w-0">
                <div className="text-sm font-semibold text-foreground">
                  Pedido #{o.id.slice(0, 8).toUpperCase()}
                </div>
                <div className="text-xs text-muted-foreground">
                  {new Date(o.created_at).toLocaleString("pt-BR")} •{" "}
                  {o.payment_method.toUpperCase()}
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2 md:justify-end">
                <StatusBadge status={o.status} />
                <span className="font-semibold text-primary">{formatBRL(Number(o.total))}</span>
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
    return <div className="py-12 text-center text-muted-foreground">Carregando pedido...</div>;
  const { order, items } = data;
  if (!order)
    return <div className="py-12 text-center text-muted-foreground">Pedido não encontrado.</div>;

  return (
    <div className="space-y-5">
      <button
        onClick={onBack}
        className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-primary"
        type="button"
      >
        <ArrowLeft className="h-4 w-4" /> Voltar para pedidos
      </button>

      <div className="aura-card p-5 md:p-6">
        <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="font-display text-3xl text-foreground">
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
            <li key={it.id} className="flex items-center gap-3 py-3">
              {it.product_image && (
                <img src={it.product_image} alt="" className="h-14 w-14 rounded-md object-cover" />
              )}
              <div className="min-w-0 flex-1">
                <div className="line-clamp-1 text-sm font-semibold text-foreground">
                  {it.product_name}
                </div>
                <div className="text-xs text-muted-foreground">
                  {it.quantity} x {formatBRL(Number(it.unit_price))}
                </div>
              </div>
              <div className="text-sm font-semibold">{formatBRL(Number(it.subtotal))}</div>
            </li>
          ))}
        </ul>

        <div className="mt-4 space-y-1 border-t border-border pt-4 text-sm">
          <Row label="Subtotal" value={formatBRL(Number(order.subtotal))} />
          {Number(order.discount) > 0 && (
            <Row
              label={`Cupom ${order.coupon_code ?? ""}`}
              value={`-${formatBRL(Number(order.discount))}`}
              accent
            />
          )}
          <Row label="Frete" value={formatBRL(Number(order.shipping))} />
          <div className="mt-2 flex justify-between border-t border-border pt-3 text-base font-semibold">
            <span>Total</span>
            <span className="text-primary">{formatBRL(Number(order.total))}</span>
          </div>
        </div>
      </div>

      <div className="aura-card p-5 text-sm md:p-6">
        <h3 className="font-display text-2xl text-foreground">Entrega</h3>
        <p className="mt-3 text-foreground">{order.customer_name}</p>
        <p className="text-muted-foreground">
          {order.customer_email} • {order.customer_phone}
        </p>
        <p className="mt-2 text-muted-foreground">
          {order.address_line}, {order.address_number}
          {order.address_complement ? ` - ${order.address_complement}` : ""}
          <br />
          {order.address_city} / {order.address_state} • CEP {order.address_cep}
        </p>
      </div>
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
      ? "bg-primary/10 text-primary ring-primary/20"
      : status === "cancelled"
        ? "bg-destructive/10 text-destructive ring-destructive/20"
        : status === "shipped" || status === "processing"
          ? "bg-champagne text-primary ring-border"
          : "bg-muted text-muted-foreground ring-border";
  return (
    <span
      className={`inline-flex rounded-md px-2.5 py-1 text-[11px] font-bold uppercase ring-1 ${tone}`}
    >
      {STATUS_LABEL[status] ?? status}
    </span>
  );
}

export function PaymentBadge({ status }: { status: string }) {
  const tone =
    status === "paid"
      ? "bg-primary/10 text-primary ring-primary/20"
      : status === "failed" || status === "expired"
        ? "bg-destructive/10 text-destructive ring-destructive/20"
        : "bg-muted text-muted-foreground ring-border";
  return (
    <span
      className={`inline-flex rounded-md px-2.5 py-1 text-[11px] font-bold uppercase ring-1 ${tone}`}
    >
      {PAYMENT_LABEL[status] ?? status}
    </span>
  );
}
