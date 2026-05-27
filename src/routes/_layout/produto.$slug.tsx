import { createFileRoute, Link } from "@tanstack/react-router";
import { useShop, WHATSAPP } from "@/lib/store";
import { useCategories, useEnergies, useProducts } from "@/lib/catalog";
import { finalPrice, formatBRL } from "@/lib/types";
import { ArrowLeft, MessageCircle, ShoppingBag } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/_layout/produto/$slug")({
  component: ProductPage,
});

function ProductPage() {
  const { slug } = Route.useParams();
  const { data: products = [], isLoading } = useProducts();
  const { data: categories = [] } = useCategories();
  const { data: energies = [] } = useEnergies();
  const { addToCart, cart } = useShop();
  const product = products.find((p) => p.slug === slug);
  const [qty, setQty] = useState(1);

  if (isLoading) {
    return (
      <div className="aura-container py-24 text-center text-muted-foreground">Carregando...</div>
    );
  }

  if (!product) {
    return (
      <div className="aura-container py-24 text-center">
        <p className="text-muted-foreground">Produto não encontrado.</p>
        <Link to="/catalogo" className="text-primary underline mt-4 inline-block">
          Voltar ao catálogo
        </Link>
      </div>
    );
  }

  const cat = categories.find((c) => c.id === product.categoryId);
  const ens = product.energyIds.map((id) => energies.find((e) => e.id === id)).filter(Boolean);
  const onSale = product.discountPercent > 0;
  const fp = finalPrice(product);
  const cartQty = cart.find((item) => item.productId === product.id)?.quantity ?? 0;
  const availableToAdd = Math.max(0, product.stock - cartQty);

  const wa = `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(
    `Olá! Tenho interesse na peça "${product.name}".`,
  )}`;

  return (
    <div className="aura-container py-12">
      <Link
        to="/catalogo"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-6"
      >
        <ArrowLeft className="h-4 w-4" /> Voltar
      </Link>

      <div className="grid md:grid-cols-2 gap-10">
        <div className="rounded-2xl overflow-hidden bg-[var(--gradient-soft)] border border-border">
          {product.image ? (
            <img
              src={product.image}
              alt={product.name}
              className="w-full h-full object-cover aspect-square"
            />
          ) : (
            <div className="grid aspect-square place-items-center px-6 text-center font-display text-2xl text-primary">
              AuraLeve
            </div>
          )}
        </div>

        <div>
          {cat && (
            <div className="text-[10px] uppercase tracking-[0.22em] text-primary font-semibold mb-2">
              {cat.name}
            </div>
          )}
          <h1 className="font-display text-3xl md:text-4xl text-primary mb-4">{product.name}</h1>

          <div className="flex items-baseline gap-3 mb-6">
            {onSale && (
              <span className="text-base text-muted-foreground line-through">
                {formatBRL(product.price)}
              </span>
            )}
            <span className="text-3xl font-semibold text-primary">{formatBRL(fp)}</span>
            {onSale && (
              <span className="rounded-full bg-gold text-gold-foreground px-2 py-0.5 text-xs font-semibold">
                -{product.discountPercent}%
              </span>
            )}
          </div>

          <p className="text-muted-foreground mb-6">{product.description}</p>

          {ens.length > 0 && (
            <div className="mb-6">
              <div className="text-[10px] uppercase tracking-[0.22em] text-primary font-semibold mb-2">
                Energia · Intenção
              </div>
              <div className="flex flex-wrap gap-2">
                {ens.map((e) => (
                  <span
                    key={e!.id}
                    className="rounded-full border border-border bg-accent text-primary px-3 py-1 text-xs font-medium"
                  >
                    {e!.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center gap-3 mb-6">
            <label className="text-sm text-muted-foreground">Quantidade</label>
            <div className="inline-flex items-center rounded-full border border-border">
              <button
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                className="px-3 py-1.5 text-primary"
              >
                −
              </button>
              <span className="w-8 text-center text-sm">{qty}</span>
              <button
                onClick={() => setQty((q) => Math.min(Math.max(1, availableToAdd), q + 1))}
                disabled={availableToAdd <= 0 || qty >= availableToAdd}
                className="px-3 py-1.5 text-primary disabled:opacity-40"
              >
                +
              </button>
            </div>
            <span className="text-xs text-muted-foreground">
              {product.stock > 0 ? `${product.stock} em estoque` : "Produto esgotado"}
            </span>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => {
                const safeQty = Math.min(qty, availableToAdd);
                if (safeQty <= 0) {
                  toast.error("Este produto está indisponível no momento");
                  return;
                }
                addToCart(product.id, safeQty);
                toast.success("Adicionado ao carrinho");
              }}
              disabled={availableToAdd <= 0}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground shadow-[var(--shadow-aura)] hover:opacity-95 disabled:opacity-50"
            >
              <ShoppingBag className="h-4 w-4" /> {availableToAdd > 0 ? "Comprar" : "Indisponível"}
            </button>
            <a
              href={wa}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-border bg-card px-6 py-3 text-sm font-medium hover:border-primary hover:text-primary"
            >
              <MessageCircle className="h-4 w-4" /> WhatsApp
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
