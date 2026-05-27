import { createFileRoute, Link } from "@tanstack/react-router";
import { useShop } from "@/lib/store";
import { useProducts } from "@/lib/catalog";
import { finalPrice, formatBRL } from "@/lib/types";
import { Trash2, ArrowRight } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_layout/carrinho")({
  component: CartPage,
});

function CartPage() {
  const { cart, setQty, removeFromCart } = useShop();
  const { data: products = [], isLoading } = useProducts();
  const items = cart
    .map((c) => {
      const p = products.find((pp) => pp.id === c.productId);
      return p ? { product: p, quantity: c.quantity } : null;
    })
    .filter((x): x is { product: (typeof products)[number]; quantity: number } => !!x);

  const subtotal = items.reduce((a, i) => a + finalPrice(i.product) * i.quantity, 0);
  const hasUnavailable = items.some(
    ({ product, quantity }) => product.stock <= 0 || quantity > product.stock,
  );

  if (isLoading && cart.length > 0) {
    return (
      <div className="aura-container py-16 text-center text-muted-foreground">
        Carregando carrinho...
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="aura-container py-24 text-center">
        <h1 className="aura-section-title">Seu carrinho está vazio</h1>
        <p className="text-muted-foreground mb-6">
          Que tal explorar o catálogo e encontrar sua próxima companheira de meditação?
        </p>
        <Link
          to="/catalogo"
          className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground"
        >
          Ver catálogo
        </Link>
      </div>
    );
  }

  const handleRemove = (id: string) => {
    removeFromCart(id);
    toast.success("Removido do carrinho");
  };

  return (
    <div className="aura-container py-12">
      <h1 className="aura-section-title mb-10">Seu carrinho</h1>
      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-3">
          {items.map(({ product, quantity }) => {
            const fp = finalPrice(product);
            return (
              <div
                key={product.id}
                className="flex gap-4 rounded-2xl border border-border bg-card p-4"
              >
                {product.image ? (
                  <img
                    src={product.image}
                    alt={product.name}
                    className="h-24 w-24 rounded-xl object-cover"
                  />
                ) : (
                  <div className="grid h-24 w-24 shrink-0 place-items-center rounded-xl bg-muted text-xs font-semibold uppercase tracking-[0.18em] text-primary">
                    AuraLeve
                  </div>
                )}
                <div className="flex-1">
                  <Link
                    to="/produto/$slug"
                    params={{ slug: product.slug }}
                    className="font-semibold hover:text-primary"
                  >
                    {product.name}
                  </Link>
                  <div className="text-sm text-muted-foreground mt-1">{formatBRL(fp)} cada</div>
                  {(product.stock <= 0 || quantity > product.stock) && (
                    <div className="mt-2 rounded-lg bg-destructive/10 px-2 py-1 text-xs text-destructive">
                      {product.stock <= 0
                        ? "Produto indisponível no momento"
                        : `Restam ${product.stock} unidade(s) em estoque`}
                    </div>
                  )}
                  <div className="mt-3 flex items-center gap-3">
                    <div className="inline-flex items-center rounded-full border border-border">
                      <button
                        onClick={() => setQty(product.id, quantity - 1)}
                        className="px-3 py-1 text-primary"
                      >
                        −
                      </button>
                      <span className="w-8 text-center text-sm">{quantity}</span>
                      <button
                        onClick={() => setQty(product.id, Math.min(product.stock, quantity + 1))}
                        disabled={quantity >= product.stock}
                        className="px-3 py-1 text-primary disabled:opacity-40"
                      >
                        +
                      </button>
                    </div>
                    <button
                      onClick={() => handleRemove(product.id)}
                      className="text-muted-foreground hover:text-destructive"
                      aria-label="Remover"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <div className="text-right font-semibold text-primary">
                  {formatBRL(fp * quantity)}
                </div>
              </div>
            );
          })}
        </div>

        <aside className="rounded-2xl border border-border bg-card p-6 h-fit sticky top-20">
          <h2 className="font-display text-xl text-primary mb-4">Resumo</h2>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-muted-foreground">Subtotal</span>
            <span>{formatBRL(subtotal)}</span>
          </div>
          <div className="flex justify-between text-sm mb-4">
            <span className="text-muted-foreground">Frete</span>
            <span className="text-muted-foreground">a calcular</span>
          </div>
          <div className="flex justify-between text-base font-semibold border-t border-border pt-4 mb-6">
            <span>Total</span>
            <span className="text-primary">{formatBRL(subtotal)}</span>
          </div>
          {hasUnavailable ? (
            <p className="rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
              Ajuste os itens indisponíveis antes de finalizar a compra.
            </p>
          ) : (
            <Link
              to="/checkout"
              className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:opacity-95"
            >
              Finalizar compra <ArrowRight className="h-4 w-4" />
            </Link>
          )}
        </aside>
      </div>
    </div>
  );
}
