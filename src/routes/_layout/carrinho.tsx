import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, PackageCheck, ShieldCheck, Trash2, Truck } from "lucide-react";
import { toast } from "sonner";
import { useProducts } from "@/lib/catalog";
import { useShop } from "@/lib/store";
import { finalPrice, formatBRL } from "@/lib/types";

export const Route = createFileRoute("/_layout/carrinho")({
  component: CartPage,
});

const FREE_SHIPPING_TARGET = 199;

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
  const remainingForFreeShipping = Math.max(0, FREE_SHIPPING_TARGET - subtotal);
  const progress = Math.min(100, (subtotal / FREE_SHIPPING_TARGET) * 100);

  if (isLoading && cart.length > 0) {
    return (
      <div className="aura-container py-16 text-center text-muted-foreground">
        Carregando carrinho...
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="aura-container py-20 text-center md:py-28">
        <div className="aura-card mx-auto max-w-xl p-8 md:p-12">
          <PackageCheck className="mx-auto mb-5 h-14 w-14 text-primary" />
          <h1 className="aura-section-title">Seu carrinho está vazio</h1>
          <p className="mx-auto mb-7 max-w-sm text-muted-foreground">
            Explore o catálogo e escolha uma peça com alma para acompanhar sua intenção.
          </p>
          <Link to="/catalogo" className="aura-button">
            Ver catálogo
          </Link>
        </div>
      </div>
    );
  }

  const handleRemove = (id: string) => {
    removeFromCart(id);
    toast.success("Removido do carrinho");
  };

  return (
    <div className="aura-container py-10 md:py-14">
      <div className="mb-9">
        <span className="aura-eyebrow">Carrinho</span>
        <h1 className="mt-2 font-display text-4xl text-foreground md:text-6xl">Seu carrinho</h1>
        <p className="mt-2 text-muted-foreground">Produtos selecionados com intenção.</p>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
        <div className="space-y-4">
          <div className="hidden grid-cols-[1fr_140px_160px_110px] border-b border-border pb-3 text-xs font-bold uppercase text-muted-foreground md:grid">
            <span>Produto</span>
            <span>Preço</span>
            <span>Quantidade</span>
            <span className="text-right">Total</span>
          </div>

          {items.map(({ product, quantity }) => {
            const fp = finalPrice(product);
            return (
              <div
                key={product.id}
                className="aura-card grid gap-4 p-4 md:grid-cols-[1fr_140px_160px_110px] md:items-center"
              >
                <div className="flex gap-4">
                  {product.image ? (
                    <img
                      src={product.image}
                      alt={product.name}
                      className="h-24 w-24 shrink-0 rounded-md object-cover"
                    />
                  ) : (
                    <div className="grid h-24 w-24 shrink-0 place-items-center rounded-md bg-champagne text-xs font-semibold uppercase text-primary">
                      AuraLeve
                    </div>
                  )}
                  <div className="min-w-0">
                    <Link
                      to="/produto/$slug"
                      params={{ slug: product.slug }}
                      className="font-display text-xl text-foreground hover:text-primary"
                    >
                      {product.name}
                    </Link>
                    <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                      {product.description}
                    </p>
                    {(product.stock <= 0 || quantity > product.stock) && (
                      <div className="mt-2 rounded-md bg-destructive/10 px-2 py-1 text-xs text-destructive">
                        {product.stock <= 0
                          ? "Produto indisponível no momento"
                          : `Restam ${product.stock} unidade(s) em estoque`}
                      </div>
                    )}
                  </div>
                </div>

                <div className="text-sm font-semibold text-foreground">{formatBRL(fp)}</div>

                <div className="flex items-center gap-3">
                  <div className="inline-flex h-10 items-center rounded-md border border-border bg-card">
                    <button
                      onClick={() => setQty(product.id, quantity - 1)}
                      className="grid h-10 w-10 place-items-center text-primary"
                      type="button"
                    >
                      -
                    </button>
                    <span className="w-8 text-center text-sm font-semibold">{quantity}</span>
                    <button
                      onClick={() => setQty(product.id, Math.min(product.stock, quantity + 1))}
                      disabled={quantity >= product.stock}
                      className="grid h-10 w-10 place-items-center text-primary disabled:opacity-40"
                      type="button"
                    >
                      +
                    </button>
                  </div>
                  <button
                    onClick={() => handleRemove(product.id)}
                    className="grid h-10 w-10 place-items-center rounded-md text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive"
                    aria-label="Remover"
                    type="button"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                <div className="text-right text-sm font-semibold text-primary">
                  {formatBRL(fp * quantity)}
                </div>
              </div>
            );
          })}

          <div className="aura-card p-5">
            <div className="flex items-center gap-4">
              <Truck className="h-8 w-8 shrink-0 text-primary" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-foreground">
                  {remainingForFreeShipping > 0
                    ? `Faltam ${formatBRL(remainingForFreeShipping)} para frete grátis`
                    : "Você ganhou frete grátis"}
                </p>
                <p className="text-xs text-muted-foreground">
                  Frete grátis para compras acima de {formatBRL(FREE_SHIPPING_TARGET)}.
                </p>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-champagne">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          <Link to="/catalogo" className="aura-button-outline">
            Continuar comprando
          </Link>
        </div>

        <aside className="aura-card h-fit p-6 lg:sticky lg:top-28">
          <h2 className="font-display text-2xl text-foreground">Resumo do pedido</h2>
          <div className="mt-5 space-y-3 border-b border-border pb-5 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span>{formatBRL(subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Desconto</span>
              <span>{formatBRL(0)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Frete</span>
              <span className="text-muted-foreground">Calcular no checkout</span>
            </div>
          </div>
          <div className="mt-5 flex justify-between text-lg font-semibold">
            <span>Total</span>
            <span className="text-primary">{formatBRL(subtotal)}</span>
          </div>
          <p className="mt-1 text-right text-xs text-muted-foreground">
            em até 6x de {formatBRL(subtotal / 6)} sem juros
          </p>

          {hasUnavailable ? (
            <p className="mt-6 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
              Ajuste os itens indisponíveis antes de finalizar a compra.
            </p>
          ) : (
            <Link to="/checkout" className="aura-button mt-6 w-full">
              Ir para o checkout <ArrowRight className="h-4 w-4" />
            </Link>
          )}

          <div className="mt-6 space-y-4 border-t border-border pt-5">
            {[
              { icon: ShieldCheck, title: "Compra segura", text: "Seus dados protegidos" },
              { icon: PackageCheck, title: "Embalagem com alma", text: "Cada detalhe importa" },
              { icon: Truck, title: "Troca fácil", text: "Até 7 dias após o recebimento" },
            ].map((item) => (
              <div key={item.title} className="flex gap-3 text-sm">
                <item.icon className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                <span>
                  <strong className="block text-foreground">{item.title}</strong>
                  <span className="text-xs text-muted-foreground">{item.text}</span>
                </span>
              </div>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}
