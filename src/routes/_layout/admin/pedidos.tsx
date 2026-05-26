import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { useAllOrders, useOrderDetail } from "@/lib/catalog";
import { useUpdateOrderStatus } from "@/lib/orders.functions";
import { formatBRL } from "@/lib/types";
import { StatusBadge, PaymentBadge } from "../minha-conta";
import {
  ArrowLeft,
  ChevronRight,
  Clock3,
  CreditCard,
  PackageCheck,
  Search,
  ShoppingBag,
} from "lucide-react";
import {
  AdminEmptyState,
  AdminMetricCard,
  AdminPageHeader,
  AdminPanel,
  adminInputClass,
} from "@/components/admin/AdminUi";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_layout/admin/pedidos")({
  component: AdminOrdersPage,
});

const STATUSES = ["pending", "paid", "processing", "shipped", "delivered", "cancelled"] as const;
// Admin cannot mark payment as paid. That comes only from the Mercado Pago webhook.
const PAYMENT_STATUSES = ["pending", "failed", "refunded", "expired"] as const;
const ORDER_STATUS_LABEL: Record<(typeof STATUSES)[number], string> = {
  pending: "Aguardando",
  paid: "Pago",
  processing: "Em preparo",
  shipped: "Enviado",
  delivered: "Entregue",
  cancelled: "Cancelado",
};
const ADMIN_PAYMENT_LABEL: Record<(typeof PAYMENT_STATUSES)[number], string> = {
  pending: "Pagamento pendente",
  failed: "Falhou",
  refunded: "Reembolsado",
  expired: "Expirado",
};

function AdminOrdersPage() {
  const { data: orders = [], isLoading } = useAllOrders();
  const [open, setOpen] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  const filteredOrders = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return orders;
    return orders.filter((order) =>
      [
        order.id,
        order.customer_name,
        order.customer_email,
        order.customer_phone,
        order.payment_method,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(normalized)),
    );
  }, [orders, query]);

  const paidTotal = orders
    .filter((order) => order.payment_status === "paid")
    .reduce((sum, order) => sum + Number(order.total), 0);
  const pendingOrders = orders.filter((order) => order.status === "pending").length;
  const paidOrders = orders.filter((order) => order.payment_status === "paid").length;

  if (open) return <OrderAdminDetail orderId={open} onBack={() => setOpen(null)} />;

  return (
    <div className="space-y-4 sm:space-y-6">
      <AdminPageHeader
        eyebrow="Operação"
        title="Pedidos"
        description="Acompanhe pagamentos, atualize o andamento e consulte dados de entrega em um só lugar."
      />

      <div className="grid gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-4">
        <AdminMetricCard
          label="Pedidos"
          value={orders.length}
          helper="Total recebido pela loja"
          icon={ShoppingBag}
        />
        <AdminMetricCard
          label="Receita paga"
          value={formatBRL(paidTotal)}
          helper={`${paidOrders} pagamento(s) confirmado(s)`}
          icon={CreditCard}
          tone="gold"
        />
        <AdminMetricCard
          label="Pendentes"
          value={pendingOrders}
          helper="Aguardando ação ou pagamento"
          icon={Clock3}
          tone={pendingOrders > 0 ? "danger" : "neutral"}
        />
        <AdminMetricCard
          label="Entregues"
          value={orders.filter((order) => order.status === "delivered").length}
          helper="Pedidos finalizados"
          icon={PackageCheck}
        />
      </div>

      <label className="relative block">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          className={cn(adminInputClass, "pl-9")}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Buscar por cliente, e-mail, telefone, método ou ID"
        />
      </label>

      <AdminPanel
        title="Lista de pedidos"
        description={`${filteredOrders.length} pedido(s) exibidos`}
      >
        {isLoading ? (
          <div className="px-4 py-8 text-center text-sm text-muted-foreground sm:px-5 sm:py-12">
            Carregando pedidos...
          </div>
        ) : filteredOrders.length === 0 ? (
          <AdminEmptyState
            icon={ShoppingBag}
            title="Nenhum pedido encontrado"
            description="Quando houver compras ou quando a busca encontrar resultados, os pedidos aparecerão aqui."
          />
        ) : (
          <ul className="divide-y divide-border">
            {filteredOrders.map((o) => (
              <li key={o.id}>
                <button
                  onClick={() => setOpen(o.id)}
                  className="grid w-full gap-3 px-4 py-3 text-left transition hover:bg-accent/30 sm:px-5 sm:py-4 md:grid-cols-[1fr_auto] md:items-center"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2 text-sm font-semibold text-foreground">
                      <span>#{o.id.slice(0, 8).toUpperCase()}</span>
                      <span className="text-muted-foreground">{o.customer_name}</span>
                    </div>
                    <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                      <span>{new Date(o.created_at).toLocaleString("pt-BR")}</span>
                      <span>{o.payment_method.toUpperCase()}</span>
                      <span>{o.customer_email}</span>
                    </div>
                  </div>
                  <div className="flex min-w-0 flex-wrap items-center gap-2 md:justify-end">
                    <StatusBadge status={o.status} />
                    <PaymentBadge status={o.payment_status} />
                    <span className="font-semibold text-primary md:min-w-[92px] md:text-right">
                      {formatBRL(Number(o.total))}
                    </span>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </AdminPanel>
    </div>
  );
}

function OrderAdminDetail({ orderId, onBack }: { orderId: string; onBack: () => void }) {
  const { data, isLoading } = useOrderDetail(orderId);
  const update = useUpdateOrderStatus();
  const [status, setStatus] = useState<string>("");
  const [paymentStatus, setPaymentStatus] = useState<string>("");

  if (isLoading || !data)
    return <div className="py-8 text-center text-muted-foreground sm:py-12">Carregando...</div>;
  const { order, items } = data;
  if (!order)
    return (
      <div className="py-8 text-center text-muted-foreground sm:py-12">Pedido não encontrado.</div>
    );

  const currentStatus = status || order.status;
  const currentPayment = paymentStatus || order.payment_status;

  const save = async () => {
    try {
      await update.mutateAsync({ orderId, status: currentStatus, paymentStatus: currentPayment });
      toast.success("Status atualizado");
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Erro ao atualizar");
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <button
        onClick={onBack}
        className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition hover:text-primary"
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar para pedidos
      </button>

      <AdminPageHeader
        eyebrow="Detalhe do pedido"
        title={`Pedido #${order.id.slice(0, 8).toUpperCase()}`}
        description={`Criado em ${new Date(order.created_at).toLocaleString("pt-BR")}`}
        action={
          <div className="flex flex-wrap gap-2">
            <StatusBadge status={order.status} />
            <PaymentBadge status={order.payment_status} />
          </div>
        }
      />

      <div className="grid gap-4 sm:gap-6 xl:grid-cols-[1fr_340px]">
        <div className="space-y-4 sm:space-y-6">
          <AdminPanel
            title="Atualização operacional"
            description="O status pago só pode ser confirmado pelo webhook do Mercado Pago."
          >
            <div className="grid gap-4 p-4 sm:grid-cols-2 sm:p-5">
              <label>
                <span className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.18em] text-primary">
                  Status
                </span>
                <select
                  className={adminInputClass}
                  value={currentStatus}
                  onChange={(e) => setStatus(e.target.value)}
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {ORDER_STATUS_LABEL[s]}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.18em] text-primary">
                  Pagamento
                </span>
                <select
                  className={adminInputClass}
                  value={currentPayment}
                  onChange={(e) => setPaymentStatus(e.target.value)}
                >
                  {currentPayment === "paid" && <option value="paid">Pago pelo Mercado Pago</option>}
                  {PAYMENT_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {ADMIN_PAYMENT_LABEL[s]}
                    </option>
                  ))}
                </select>
              </label>
              <div className="sm:col-span-2">
                <button
                  onClick={save}
                  disabled={update.isPending}
                  className="w-full rounded-lg bg-primary px-5 py-2 text-sm font-medium text-primary-foreground transition hover:bg-primary/90 disabled:opacity-50 sm:w-auto"
                >
                  {update.isPending ? "Salvando..." : "Salvar status"}
                </button>
              </div>
            </div>
          </AdminPanel>

          <AdminPanel title="Itens do pedido">
            <ul className="divide-y divide-border">
              {items.map((it) => (
                <li
                  key={it.id}
                  className="flex flex-wrap items-center gap-3 px-4 py-3 sm:flex-nowrap sm:px-5 sm:py-4"
                >
                  {it.product_image ? (
                    <img
                      src={it.product_image}
                      alt=""
                      className="h-14 w-14 rounded-lg object-cover ring-1 ring-border"
                    />
                  ) : null}
                  <div className="min-w-0 flex-1">
                    <div className="line-clamp-1 text-sm font-medium">{it.product_name}</div>
                    <div className="text-xs text-muted-foreground">
                      {it.quantity} x {formatBRL(Number(it.unit_price))}
                    </div>
                  </div>
                  <div className="ml-auto text-sm font-semibold">
                    {formatBRL(Number(it.subtotal))}
                  </div>
                </li>
              ))}
            </ul>
            <div className="space-y-2 border-t border-border px-4 py-3 text-sm sm:px-5 sm:py-4">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal</span>
                <span>{formatBRL(Number(order.subtotal))}</span>
              </div>
              {Number(order.discount) > 0 && (
                <div className="flex justify-between text-primary">
                  <span>Cupom {order.coupon_code}</span>
                  <span>-{formatBRL(Number(order.discount))}</span>
                </div>
              )}
              <div className="flex justify-between border-t border-border pt-3 font-semibold">
                <span>Total</span>
                <span className="text-primary">{formatBRL(Number(order.total))}</span>
              </div>
            </div>
          </AdminPanel>
        </div>

        <div className="space-y-4 sm:space-y-6">
          <AdminPanel title="Pagamento">
            <dl className="space-y-3 p-4 text-sm sm:p-5">
              <Info label="Provedor" value={order.payment_provider || "Não informado"} />
              <Info label="Método" value={order.payment_method} />
              <Info label="Payment ID" value={order.payment_id || "Não informado"} mono />
              <Info label="Detalhe" value={order.payment_status_detail || "Não informado"} />
              {order.paid_at && (
                <Info label="Pago em" value={new Date(order.paid_at).toLocaleString("pt-BR")} />
              )}
              {order.canceled_at && (
                <Info
                  label="Cancelado em"
                  value={new Date(order.canceled_at).toLocaleString("pt-BR")}
                />
              )}
            </dl>
          </AdminPanel>

          <AdminPanel title="Cliente e entrega">
            <div className="space-y-3 p-4 text-sm sm:p-5">
              <div>
                <p className="font-semibold text-foreground">{order.customer_name}</p>
                <p className="text-muted-foreground">{order.customer_email}</p>
                <p className="text-muted-foreground">{order.customer_phone}</p>
              </div>
              <div className="rounded-lg bg-muted/60 p-3 text-muted-foreground">
                <p>
                  {order.address_line}, {order.address_number}
                </p>
                {order.address_complement ? <p>{order.address_complement}</p> : null}
                <p>
                  {order.address_city} / {order.address_state}
                </p>
                <p>CEP {order.address_cep}</p>
              </div>
            </div>
          </AdminPanel>
        </div>
      </div>
    </div>
  );
}

function Info({ label, value, mono }: { label: string; value: React.ReactNode; mono?: boolean }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
        {label}
      </dt>
      <dd className={cn("mt-1 text-foreground", mono && "break-all font-mono text-xs")}>{value}</dd>
    </div>
  );
}
