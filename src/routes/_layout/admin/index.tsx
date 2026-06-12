import { createFileRoute } from "@tanstack/react-router";
import {
  AlertTriangle,
  BadgePercent,
  BarChart3,
  Gem,
  Package,
  PackageCheck,
  Tags,
  TicketPercent,
  WalletCards,
} from "lucide-react";
import {
  AdminBadge,
  AdminEmptyState,
  AdminMetricCard,
  AdminPageHeader,
  AdminPanel,
} from "@/components/admin/AdminUi";
import { useAllOrders, useCategories, useCoupons, useEnergies, useProducts } from "@/lib/catalog";
import { finalPrice, formatBRL, getCouponStatus } from "@/lib/types";

export const Route = createFileRoute("/_layout/admin/")({
  component: AdminDash,
});

function AdminDash() {
  const { data: products = [] } = useProducts();
  const { data: categories = [] } = useCategories();
  const { data: energies = [] } = useEnergies();
  const { data: coupons = [] } = useCoupons();
  const { data: orders = [] } = useAllOrders();
  const promo = products.filter((p) => p.promo);
  const lowStock = products.filter((p) => p.stock <= 5);
  const featured = products.filter((p) => p.featured);
  const activeCoupons = coupons.filter((c) => getCouponStatus(c) === "active");
  const blockedCoupons = coupons.length - activeCoupons.length;
  const stockValue = products.reduce((sum, p) => sum + finalPrice(p) * p.stock, 0);
  const paidRevenue = orders
    .filter((order) => order.payment_status === "paid")
    .reduce((sum, order) => sum + Number(order.total), 0);
  const processingOrders = orders.filter((order) =>
    ["pending", "paid", "processing"].includes(order.status),
  ).length;

  return (
    <div className="space-y-4 sm:space-y-6">
      <AdminPageHeader
        eyebrow="Resumo da loja"
        title="Visão geral"
        description="Acompanhe pedidos, faturamento, catálogo, cupons e pontos que precisam de atenção."
      />

      <div className="grid gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-4">
        <AdminMetricCard
          label="Faturamento pago"
          value={formatBRL(paidRevenue)}
          helper={`${orders.length} pedido(s) no total`}
          icon={WalletCards}
          tone="gold"
        />
        <AdminMetricCard
          label="Pedidos em fluxo"
          value={processingOrders}
          helper="Aguardando, pagos ou em preparo"
          icon={PackageCheck}
          tone={processingOrders > 0 ? "primary" : "neutral"}
        />
        <AdminMetricCard
          label="Produtos"
          value={products.length}
          helper={`${featured.length} em destaque`}
          icon={Package}
        />
        <AdminMetricCard
          label="Estoque"
          value={formatBRL(stockValue)}
          helper={`${lowStock.length} produto(s) com estoque baixo`}
          icon={WalletCards}
          tone={lowStock.length > 0 ? "danger" : "neutral"}
        />
      </div>

      <div className="grid gap-4 sm:gap-6 xl:grid-cols-2">
        <AdminPanel title="Pedidos por status" description="Leitura rápida da operação comercial.">
          {orders.length === 0 ? (
            <AdminEmptyState
              icon={BarChart3}
              title="Nenhum pedido ainda"
              description="Quando os pedidos entrarem, a distribuição por status aparecerá aqui."
            />
          ) : (
            <div className="grid gap-3 p-4 sm:grid-cols-2 sm:p-5">
              {[
                ["Aguardando", orders.filter((order) => order.status === "pending").length],
                ["Pagos", orders.filter((order) => order.status === "paid").length],
                ["Em preparo", orders.filter((order) => order.status === "processing").length],
                ["Enviados", orders.filter((order) => order.status === "shipped").length],
                ["Entregues", orders.filter((order) => order.status === "delivered").length],
                ["Cancelados", orders.filter((order) => order.status === "cancelled").length],
              ].map(([label, value]) => (
                <div key={label} className="rounded-lg border border-border bg-card/70 p-4">
                  <p className="text-xs font-bold uppercase text-muted-foreground">{label}</p>
                  <p className="mt-1 text-2xl font-semibold text-foreground">{value}</p>
                </div>
              ))}
            </div>
          )}
        </AdminPanel>

        <AdminPanel
          title="Organização do catálogo"
          description="Categorias, intenções e campanhas."
        >
          <div className="grid gap-3 p-4 sm:grid-cols-3 sm:p-5">
            <div className="rounded-lg border border-border bg-card/70 p-4">
              <Tags className="mb-3 h-5 w-5 text-primary" />
              <p className="text-2xl font-semibold text-foreground">{categories.length}</p>
              <p className="text-xs text-muted-foreground">Categorias</p>
            </div>
            <div className="rounded-lg border border-border bg-card/70 p-4">
              <Gem className="mb-3 h-5 w-5 text-primary" />
              <p className="text-2xl font-semibold text-foreground">{energies.length}</p>
              <p className="text-xs text-muted-foreground">Energias</p>
            </div>
            <div className="rounded-lg border border-border bg-card/70 p-4">
              <TicketPercent className="mb-3 h-5 w-5 text-primary" />
              <p className="text-2xl font-semibold text-foreground">{activeCoupons.length}</p>
              <p className="text-xs text-muted-foreground">Cupons ativos</p>
            </div>
            {blockedCoupons > 0 ? (
              <div className="rounded-lg border border-border bg-champagne/55 p-4 sm:col-span-3">
                <p className="text-sm text-muted-foreground">
                  {blockedCoupons} cupom(ns) indisponível(is) por regra, data ou status.
                </p>
              </div>
            ) : null}
          </div>
        </AdminPanel>
      </div>

      <div className="grid gap-4 sm:gap-6 xl:grid-cols-2">
        <AdminPanel
          title="Promoções ativas"
          description="A home exibe no máximo 4 produtos promocionais."
        >
          {promo.length === 0 ? (
            <AdminEmptyState
              icon={BadgePercent}
              title="Nenhum produto em promoção"
              description="Marque produtos como promoção para destacar ofertas na vitrine."
            />
          ) : (
            <ul className="divide-y divide-border">
              {promo.map((p) => (
                <li
                  key={p.id}
                  className="flex items-center justify-between gap-3 px-4 py-3 sm:gap-4 sm:px-5 sm:py-4"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">{p.name}</p>
                    <p className="text-xs text-muted-foreground">Preço base {formatBRL(p.price)}</p>
                  </div>
                  <div className="text-right">
                    <AdminBadge tone="primary">{p.discountPercent}% off</AdminBadge>
                    <p className="mt-1 text-sm font-semibold text-primary">
                      {formatBRL(finalPrice(p))}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </AdminPanel>

        <AdminPanel
          title="Estoque baixo"
          description="Produtos com 5 unidades ou menos precisam de atenção."
        >
          {lowStock.length === 0 ? (
            <AdminEmptyState
              icon={Gem}
              title="Estoque saudável"
              description="Nenhum produto entrou no limite de atenção neste momento."
            />
          ) : (
            <ul className="divide-y divide-border">
              {lowStock.map((p) => (
                <li
                  key={p.id}
                  className="flex items-center justify-between gap-3 px-4 py-3 sm:gap-4 sm:px-5 sm:py-4"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">{p.name}</p>
                    <p className="text-xs text-muted-foreground">
                      Valor unitário {formatBRL(finalPrice(p))}
                    </p>
                  </div>
                  <AdminBadge tone="danger">
                    <AlertTriangle className="mr-1 h-3.5 w-3.5" />
                    {p.stock} un.
                  </AdminBadge>
                </li>
              ))}
            </ul>
          )}
        </AdminPanel>
      </div>
    </div>
  );
}
