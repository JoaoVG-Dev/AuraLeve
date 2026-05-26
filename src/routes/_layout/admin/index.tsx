import { createFileRoute } from "@tanstack/react-router";
import { useCategories, useCoupons, useEnergies, useProducts } from "@/lib/catalog";
import { finalPrice, formatBRL, getCouponStatus } from "@/lib/types";
import {
  AdminBadge,
  AdminEmptyState,
  AdminMetricCard,
  AdminPageHeader,
  AdminPanel,
} from "@/components/admin/AdminUi";
import {
  AlertTriangle,
  BadgePercent,
  Gem,
  Package,
  Tags,
  TicketPercent,
  WalletCards,
} from "lucide-react";

export const Route = createFileRoute("/_layout/admin/")({
  component: AdminDash,
});

function AdminDash() {
  const { data: products = [] } = useProducts();
  const { data: categories = [] } = useCategories();
  const { data: energies = [] } = useEnergies();
  const { data: coupons = [] } = useCoupons();
  const promo = products.filter((p) => p.promo);
  const lowStock = products.filter((p) => p.stock <= 5);
  const featured = products.filter((p) => p.featured);
  const activeCoupons = coupons.filter((c) => getCouponStatus(c) === "active");
  const blockedCoupons = coupons.length - activeCoupons.length;
  const stockValue = products.reduce((sum, p) => sum + finalPrice(p) * p.stock, 0);

  return (
    <div className="space-y-4 sm:space-y-6">
      <AdminPageHeader
        eyebrow="Resumo da loja"
        title="Visão geral"
        description="Acompanhe os principais cadastros do catálogo e veja rapidamente onde precisa agir."
      />

      <div className="grid gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-4">
        <AdminMetricCard
          label="Produtos"
          value={products.length}
          helper={`${featured.length} em destaque`}
          icon={Package}
        />
        <AdminMetricCard
          label="Categorias"
          value={categories.length}
          helper={`${energies.length} energias cadastradas`}
          icon={Tags}
          tone="gold"
        />
        <AdminMetricCard
          label="Cupons ativos"
          value={activeCoupons.length}
          helper={`${blockedCoupons} indisponível(is) por regra ou status`}
          icon={TicketPercent}
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
        <AdminPanel
          title="Promoções ativas"
          description="A home exibe no máximo 3 produtos promocionais."
        >
          {promo.length === 0 ? (
            <AdminEmptyState
              icon={BadgePercent}
              title="Nenhum produto em promoção"
              description="Marque até três produtos como promoção para destacar ofertas na vitrine."
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
