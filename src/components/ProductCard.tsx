import { Link } from "@tanstack/react-router";
import type { Product } from "@/lib/types";
import { finalPrice, formatBRL } from "@/lib/types";
import { useEnergies } from "@/lib/catalog";

export function ProductCard({ product }: { product: Product }) {
  const { data: energies = [] } = useEnergies();
  const energyNames = product.energyIds
    .map((id) => energies.find((e) => e.id === id)?.name)
    .filter(Boolean) as string[];
  const onSale = product.discountPercent > 0;
  const fp = finalPrice(product);

  return (
    <Link
      to="/produto/$slug"
      params={{ slug: product.slug }}
      className="group block rounded-2xl bg-card border border-border overflow-hidden transition-all hover:-translate-y-1 hover:shadow-[var(--shadow-aura)]"
    >
      <div className="relative aspect-square overflow-hidden bg-[var(--gradient-soft)]">
        {product.image ? (
          <img
            src={product.image}
            alt={product.name}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
        ) : (
          <div className="grid h-full w-full place-items-center px-4 text-center font-display text-lg text-primary">
            AuraLeve
          </div>
        )}
        {onSale && (
          <span className="absolute top-3 left-3 rounded-full bg-gold text-gold-foreground px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider">
            -{product.discountPercent}%
          </span>
        )}
        {product.stock <= 0 && (
          <span className="absolute bottom-3 left-3 rounded-full bg-background/90 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground ring-1 ring-border">
            Esgotado
          </span>
        )}
      </div>
      <div className="p-3 sm:p-4">
        {energyNames.length > 0 && (
          <div className="text-[10px] uppercase tracking-[0.22em] text-primary/80 font-semibold mb-1.5">
            {energyNames.slice(0, 2).join(" · ")}
          </div>
        )}
        <h3 className="mb-1.5 line-clamp-2 text-sm font-semibold text-foreground transition-colors group-hover:text-primary sm:mb-2">
          {product.name}
        </h3>
        <div className="flex items-baseline gap-2">
          {onSale && (
            <span className="text-xs text-muted-foreground line-through">
              {formatBRL(product.price)}
            </span>
          )}
          <span className="text-base font-semibold text-primary">{formatBRL(fp)}</span>
        </div>
      </div>
    </Link>
  );
}
