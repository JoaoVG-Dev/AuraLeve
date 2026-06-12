import { Link } from "@tanstack/react-router";
import { Heart } from "lucide-react";
import type { Product } from "@/lib/types";
import { finalPrice, formatBRL } from "@/lib/types";
import { useEnergies } from "@/lib/catalog";
import { AuraLeveSymbol } from "@/components/AuraLeveLogo";

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
      className="group aura-card block overflow-hidden transition hover:-translate-y-1 hover:shadow-[var(--shadow-aura)]"
    >
      <div className="relative aspect-square overflow-hidden bg-champagne">
        {product.image ? (
          <img
            src={product.image}
            alt={product.name}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
        ) : (
          <div className="grid h-full w-full place-items-center px-4 text-center text-primary">
            <AuraLeveSymbol className="h-16" />
          </div>
        )}
        <button
          type="button"
          onClick={(event) => event.preventDefault()}
          className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-md bg-card/84 text-foreground shadow-sm backdrop-blur transition hover:text-primary"
          aria-label="Favoritar"
        >
          <Heart className="h-4 w-4" />
        </button>
        {onSale && (
          <span className="absolute left-3 top-3 rounded-md bg-primary px-2.5 py-1 text-[0.68rem] font-bold uppercase text-primary-foreground">
            -{product.discountPercent}%
          </span>
        )}
        {product.stock <= 0 && (
          <span className="absolute bottom-3 left-3 rounded-md bg-card/92 px-2.5 py-1 text-[0.68rem] font-bold uppercase text-muted-foreground ring-1 ring-border">
            Esgotado
          </span>
        )}
      </div>
      <div className="p-3 sm:p-4">
        {energyNames.length > 0 && (
          <div className="mb-1.5 text-xs font-semibold text-primary">
            {energyNames.slice(0, 2).join(" • ")}
          </div>
        )}
        <h3 className="mb-2 line-clamp-2 font-display text-xl text-foreground transition-colors group-hover:text-primary">
          {product.name}
        </h3>
        <div className="flex flex-wrap items-baseline gap-2">
          <span className="text-sm font-semibold text-foreground">{formatBRL(fp)}</span>
          {onSale && (
            <span className="text-xs text-muted-foreground line-through">
              {formatBRL(product.price)}
            </span>
          )}
        </div>
        <p className="mt-1 text-xs text-muted-foreground">4x de {formatBRL(fp / 4)} sem juros</p>
      </div>
    </Link>
  );
}
