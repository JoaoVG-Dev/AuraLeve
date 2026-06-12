import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  Gem,
  Heart,
  Minus,
  PackageCheck,
  Plus,
  ShieldCheck,
  ShoppingBag,
  Star,
  Truck,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { ProductCard } from "@/components/ProductCard";
import { useCategories, useEnergies, useProducts } from "@/lib/catalog";
import { useShop } from "@/lib/store";
import { finalPrice, formatBRL } from "@/lib/types";

export const Route = createFileRoute("/_layout/produto/$slug")({
  component: ProductPage,
});

type Tab = "descricao" | "cristais" | "significado" | "cuidados" | "envio";

function ProductPage() {
  const { slug } = Route.useParams();
  const { data: products = [], isLoading } = useProducts();
  const { data: categories = [] } = useCategories();
  const { data: energies = [] } = useEnergies();
  const { addToCart, cart } = useShop();
  const product = products.find((p) => p.slug === slug);
  const [qty, setQty] = useState(1);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("descricao");

  useEffect(() => {
    setQty(1);
    setSelectedImage(null);
    setTab("descricao");
  }, [product?.id]);

  const related = useMemo(() => {
    if (!product) return [];
    return products
      .filter((p) => p.id !== product.id && p.categoryId === product.categoryId)
      .slice(0, 4);
  }, [product, products]);

  if (isLoading) {
    return (
      <div className="aura-container py-24 text-center text-muted-foreground">Carregando...</div>
    );
  }

  if (!product) {
    return (
      <div className="aura-container py-24 text-center">
        <h1 className="aura-section-title">Produto não encontrado</h1>
        <p className="mb-6 text-muted-foreground">Essa peça pode ter saído do catálogo.</p>
        <Link to="/catalogo" className="aura-button">
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
  const displayImage = selectedImage || product.image;
  const gallery = [product.image, ...related.map((p) => p.image)].filter(Boolean).slice(0, 5);

  const add = () => {
    const safeQty = Math.min(qty, availableToAdd);
    if (safeQty <= 0) {
      toast.error("Este produto está indisponível no momento");
      return;
    }
    addToCart(product.id, safeQty);
    toast.success("Adicionado ao carrinho");
  };

  return (
    <div className="aura-container py-8 md:py-12">
      <Link
        to="/catalogo"
        className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground transition hover:text-primary"
      >
        <ArrowLeft className="h-4 w-4" /> Voltar ao catálogo
      </Link>

      <div className="grid gap-8 lg:grid-cols-[0.95fr_1fr]">
        <div className="grid gap-3 sm:grid-cols-[76px_1fr]">
          <div className="order-2 flex gap-2 overflow-x-auto sm:order-1 sm:flex-col">
            {gallery.map((image) => (
              <button
                key={image}
                type="button"
                onClick={() => setSelectedImage(image)}
                className={`h-[4.5rem] w-[4.5rem] shrink-0 overflow-hidden rounded-md border bg-card transition sm:h-20 sm:w-20 ${
                  displayImage === image ? "border-primary" : "border-border hover:border-primary"
                }`}
              >
                <img src={image} alt="" className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
          <div className="order-1 overflow-hidden rounded-lg border border-border bg-champagne shadow-[var(--shadow-card)] sm:order-2">
            {displayImage ? (
              <img
                src={displayImage}
                alt={product.name}
                className="aspect-square h-full w-full object-cover"
              />
            ) : (
              <div className="grid aspect-square place-items-center font-display text-3xl text-primary">
                AuraLeve
              </div>
            )}
          </div>
        </div>

        <div className="lg:pl-4">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            {cat && <span className="aura-eyebrow">{cat.name}</span>}
            {onSale && (
              <span className="rounded-md bg-primary px-2 py-1 text-xs font-bold uppercase text-primary-foreground">
                Oferta
              </span>
            )}
          </div>
          <h1 className="font-display text-4xl text-foreground md:text-6xl">{product.name}</h1>
          <p className="mt-3 text-sm text-primary">
            {ens
              .map((e) => e?.name)
              .filter(Boolean)
              .join(" • ") || "Beleza autoral • Presença • Significado"}
          </p>

          <div className="mt-4 flex items-center gap-2">
            {Array.from({ length: 5 }).map((_, index) => (
              <Star key={index} className="h-4 w-4 fill-primary text-primary" />
            ))}
            <span className="text-xs text-muted-foreground">(128 avaliações)</span>
          </div>

          <div className="mt-6 flex flex-wrap items-baseline gap-3">
            <span className="text-3xl font-semibold text-foreground">{formatBRL(fp)}</span>
            {onSale && (
              <span className="text-base text-muted-foreground line-through">
                {formatBRL(product.price)}
              </span>
            )}
            <span className="text-sm text-muted-foreground">
              4x de {formatBRL(fp / 4)} sem juros
            </span>
          </div>

          <p className="mt-5 max-w-xl text-muted-foreground">{product.description}</p>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            {[
              { icon: Gem, title: "Pedras naturais", text: "Selecionadas" },
              { icon: PackageCheck, title: "Artesanal", text: "Com alma" },
              { icon: Truck, title: "Envio", text: "Todo o Brasil" },
            ].map((item) => (
              <div key={item.title} className="rounded-lg border border-border bg-card p-3">
                <item.icon className="mb-2 h-5 w-5 text-primary" />
                <p className="text-xs font-semibold text-foreground">{item.title}</p>
                <p className="text-xs text-muted-foreground">{item.text}</p>
              </div>
            ))}
          </div>

          <div className="mt-7 flex flex-wrap items-end gap-3">
            <label>
              <span className="aura-label">Quantidade</span>
              <div className="inline-flex h-12 items-center rounded-md border border-border bg-card">
                <button
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  className="grid h-12 w-11 place-items-center text-primary"
                  type="button"
                  aria-label="Diminuir quantidade"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="w-10 text-center text-sm font-semibold">{qty}</span>
                <button
                  onClick={() => setQty((q) => Math.min(Math.max(1, availableToAdd), q + 1))}
                  disabled={availableToAdd <= 0 || qty >= availableToAdd}
                  className="grid h-12 w-11 place-items-center text-primary disabled:opacity-40"
                  type="button"
                  aria-label="Aumentar quantidade"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </label>
            <button
              onClick={add}
              disabled={availableToAdd <= 0}
              className="aura-button h-12 flex-1 px-6 sm:flex-none"
              type="button"
            >
              <ShoppingBag className="h-4 w-4" />
              {availableToAdd > 0 ? "Adicionar ao carrinho" : "Indisponível"}
            </button>
            <button className="aura-button-outline h-12 px-4" type="button" aria-label="Favoritar">
              <Heart className="h-4 w-4" />
            </button>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            {product.stock > 0 ? `${product.stock} unidade(s) em estoque` : "Produto esgotado"}
          </p>

          <div className="mt-6 rounded-lg border border-border bg-card p-4">
            <label className="aura-label">Calcule o frete</label>
            <div className="flex gap-2">
              <input className="aura-input" placeholder="Digite seu CEP" maxLength={10} />
              <button className="aura-button-outline min-h-11 px-4 py-2" type="button">
                Calcular
              </button>
            </div>
          </div>
        </div>
      </div>

      <section className="mt-10 overflow-hidden rounded-lg border border-border bg-card shadow-[var(--shadow-card)]">
        <div className="flex gap-2 overflow-x-auto border-b border-border px-4">
          {tabs.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              className={`shrink-0 border-b-2 px-3 py-4 text-xs font-bold uppercase transition ${
                tab === item.id
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-primary"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
        <div className="grid gap-6 p-5 md:grid-cols-[1fr_320px] md:p-8">
          <div className="text-sm text-muted-foreground">
            {tab === "descricao" && (
              <>
                <p>{product.description}</p>
                <ul className="mt-4 list-inside list-disc space-y-1">
                  <li>Peça autoral AuraLeve</li>
                  <li>Acabamento manual e seleção cuidadosa</li>
                  <li>Indicada para uso diário ou presente especial</li>
                </ul>
              </>
            )}
            {tab === "cristais" && (
              <p>
                As pedras naturais da peça são escolhidas pela beleza, textura e presença. Variações
                de cor e desenho fazem parte do caráter artesanal.
              </p>
            )}
            {tab === "significado" && (
              <p>
                {ens.length > 0
                  ? `Essa peça conversa com ${ens
                      .map((e) => e?.name)
                      .filter(Boolean)
                      .join(", ")}.`
                  : "Uma peça para carregar intenção, presença e significado nos detalhes do cotidiano."}
              </p>
            )}
            {tab === "cuidados" && (
              <p>
                Evite contato com água, perfume e produtos químicos. Guarde separadamente e limpe
                com pano macio para preservar o banho e o brilho das pedras.
              </p>
            )}
            {tab === "envio" && (
              <p>
                Enviamos com embalagem especial e proteção adequada. O prazo e valor de frete são
                calculados no checkout conforme seu CEP.
              </p>
            )}
          </div>
          <div className="rounded-lg bg-champagne/60 p-5">
            <ShieldCheck className="mb-3 h-6 w-6 text-primary" />
            <h3 className="font-display text-2xl text-foreground">Compra segura</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Pagamento protegido, atendimento humano e envio com cuidado em cada detalhe.
            </p>
          </div>
        </div>
      </section>

      {related.length > 0 && (
        <section className="py-12 md:py-16">
          <div className="mb-7 flex items-end justify-between gap-4">
            <div>
              <span className="aura-eyebrow">Produtos relacionados</span>
              <h2 className="aura-section-title mt-2">Continue explorando</h2>
            </div>
            <Link
              to="/catalogo"
              className="text-sm font-semibold text-primary hover:text-foreground"
            >
              Ver todos
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

const tabs: { id: Tab; label: string }[] = [
  { id: "descricao", label: "Descrição" },
  { id: "cristais", label: "Cristais" },
  { id: "significado", label: "Significado" },
  { id: "cuidados", label: "Cuidados" },
  { id: "envio", label: "Envio e trocas" },
];
