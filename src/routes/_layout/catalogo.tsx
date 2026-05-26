import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ProductCard } from "@/components/ProductCard";
import {
  useCategories,
  useEnergies,
  useProducts,
  useSubcategories,
} from "@/lib/catalog";
import { normalize, finalPrice } from "@/lib/types";
import { Search, X } from "lucide-react";
import { z } from "zod";

const searchSchema = z.object({
  categoria: z.string().optional(),
  sub: z.string().optional(),
  energia: z.string().optional(),
  q: z.string().optional(),
  ordem: z.enum(["recentes", "menor", "maior", "promo"]).optional(),
});

export const Route = createFileRoute("/_layout/catalogo")({
  validateSearch: searchSchema,
  component: CatalogPage,
  head: () => ({
    meta: [
      { title: "Catálogo — AuraLeve Japamalas" },
      {
        name: "description",
        content:
          "Veja todas as japamalas, pulseiras e colares da AuraLeve. Filtre por categoria, energia e intenção.",
      },
    ],
  }),
});

function CatalogPage() {
  const { data: products = [] } = useProducts();
  const { data: categories = [] } = useCategories();
  const { data: subcategories = [] } = useSubcategories();
  const { data: energies = [] } = useEnergies();
  const search = Route.useSearch();
  const navigate = Route.useNavigate();

  const [qInput, setQInput] = useState(search.q ?? "");
  const [debouncedQ, setDebouncedQ] = useState(qInput);
  const [showSug, setShowSug] = useState(false);

  // debounce
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(qInput), 250);
    return () => clearTimeout(t);
  }, [qInput]);

  const cat = categories.find((c) => c.slug === search.categoria);
  const subs = subcategories.filter((s) => !cat || s.categoryId === cat.id);

  const order = search.ordem ?? "recentes";
  const nQ = normalize(debouncedQ.trim());

  const filtered = useMemo(() => {
    const list = products.filter((p) => {
      if (cat && p.categoryId !== cat.id) return false;
      if (search.sub) {
        const sub = subcategories.find((s) => s.slug === search.sub);
        if (sub && p.subcategoryId !== sub.id) return false;
      }
      if (search.energia) {
        const en = energies.find((e) => e.slug === search.energia);
        if (en && !p.energyIds.includes(en.id)) return false;
      }
      if (nQ) {
        const inName = normalize(p.name).includes(nQ);
        const inDesc = normalize(p.description).includes(nQ);
        const cName = categories.find((c) => c.id === p.categoryId)?.name ?? "";
        const inCat = normalize(cName).includes(nQ);
        const energyMatches = p.energyIds.some((eid) =>
          normalize(energies.find((e) => e.id === eid)?.name ?? "").includes(nQ),
        );
        if (!inName && !inDesc && !inCat && !energyMatches) return false;
      }
      return true;
    });

    const sorted = [...list];
    switch (order) {
      case "menor":
        sorted.sort((a, b) => finalPrice(a) - finalPrice(b));
        break;
      case "maior":
        sorted.sort((a, b) => finalPrice(b) - finalPrice(a));
        break;
      case "promo":
        sorted.sort(
          (a, b) =>
            Number(b.discountPercent > 0) - Number(a.discountPercent > 0) ||
            b.discountPercent - a.discountPercent,
        );
        break;
      default:
        sorted.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        );
    }
    return sorted;
  }, [products, cat, search.sub, search.energia, nQ, order, subcategories, energies, categories]);

  const suggestions = useMemo(() => {
    if (!qInput.trim()) return [];
    const n = normalize(qInput);
    return products
      .filter((p) => normalize(p.name).includes(n))
      .slice(0, 5);
  }, [qInput, products]);

  const setFilter = (key: keyof typeof search, value?: string) =>
    navigate({
      search: (prev: typeof search) => ({ ...prev, [key]: value || undefined }),
    });

  const hasFilters = !!(search.categoria || search.sub || search.energia || debouncedQ || search.ordem);

  const clearAll = () => {
    setQInput("");
    navigate({ search: () => ({}) });
  };

  return (
    <div className="aura-container py-12">
      <div className="text-center mb-10">
        <span className="aura-eyebrow">Catálogo</span>
        <h1 className="aura-section-title mt-2">Toda a coleção</h1>
        <p className="text-muted-foreground max-w-md mx-auto">
          Filtre pela energia que você está chamando.
        </p>
      </div>

      {/* Search */}
      <div className="max-w-md mx-auto relative mb-6">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <input
          value={qInput}
          onChange={(e) => {
            setQInput(e.target.value);
            setShowSug(true);
          }}
          onFocus={() => setShowSug(true)}
          onBlur={() => setTimeout(() => setShowSug(false), 150)}
          placeholder="Buscar por nome, energia ou categoria..."
          className="w-full rounded-full border border-border bg-card pl-11 pr-10 py-3 text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          maxLength={80}
        />
        {qInput && (
          <button
            type="button"
            onClick={() => setQInput("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary"
            aria-label="Limpar busca"
          >
            <X className="h-4 w-4" />
          </button>
        )}
        {showSug && suggestions.length > 0 && (
          <div className="absolute left-0 right-0 top-full mt-2 rounded-2xl border border-border bg-card shadow-lg overflow-hidden z-30">
            {suggestions.map((p) => (
              <button
                key={p.id}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  setQInput(p.name);
                  setShowSug(false);
                }}
                className="flex items-center gap-3 w-full px-4 py-2.5 text-left hover:bg-accent/50 transition"
              >
                <img src={p.image} alt="" className="h-10 w-10 rounded-lg object-cover" />
                <div className="flex-1 text-sm">
                  <div className="font-medium text-foreground line-clamp-1">{p.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {categories.find((c) => c.id === p.categoryId)?.name}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Sort + clear */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6 max-w-3xl mx-auto">
        <div className="flex items-center gap-2 text-xs">
          <span className="uppercase tracking-[0.18em] text-primary font-semibold">Ordenar</span>
          <select
            value={order}
            onChange={(e) => setFilter("ordem", e.target.value === "recentes" ? undefined : e.target.value)}
            className="rounded-full border border-border bg-card px-3 py-1.5 text-xs focus:outline-none focus:border-primary"
          >
            <option value="recentes">Mais recentes</option>
            <option value="menor">Menor preço</option>
            <option value="maior">Maior preço</option>
            <option value="promo">Promoções</option>
          </select>
        </div>
        {hasFilters && (
          <button
            onClick={clearAll}
            className="text-xs uppercase tracking-[0.18em] text-muted-foreground hover:text-primary inline-flex items-center gap-1.5"
          >
            <X className="h-3 w-3" /> Limpar filtros
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="grid gap-4 md:grid-cols-3 mb-10">
        <FilterGroup
          label="Categoria"
          options={categories.map((c) => ({ value: c.slug, label: c.name }))}
          value={search.categoria}
          onChange={(v) => {
            setFilter("categoria", v);
            setFilter("sub", undefined);
          }}
        />
        <FilterGroup
          label="Subcategoria"
          options={subs.map((s) => ({ value: s.slug, label: s.name }))}
          value={search.sub}
          onChange={(v) => setFilter("sub", v)}
        />
        <FilterGroup
          label="Energia / Intenção"
          options={energies.map((e) => ({ value: e.slug, label: e.name }))}
          value={search.energia}
          onChange={(v) => setFilter("energia", v)}
        />
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-20">
          <h3 className="font-display text-2xl text-primary mb-2">
            Nenhuma peça encontrada
          </h3>
          <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
            Tente ajustar a busca ou explorar outra energia.
          </p>
          {hasFilters && (
            <button
              onClick={clearAll}
              className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground"
            >
              Limpar filtros
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {filtered.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  );
}

function FilterGroup({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { value: string; label: string }[];
  value?: string;
  onChange: (v?: string) => void;
}) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-[0.22em] text-primary font-semibold mb-2">
        {label}
      </div>
      <div className="flex flex-wrap gap-2">
        <Chip active={!value} onClick={() => onChange(undefined)}>Todas</Chip>
        {options.map((o) => (
          <Chip key={o.value} active={value === o.value} onClick={() => onChange(o.value)}>
            {o.label}
          </Chip>
        ))}
      </div>
    </div>
  );
}

function Chip({
  active,
  children,
  onClick,
}: {
  active?: boolean;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
        active
          ? "bg-primary text-primary-foreground border-primary"
          : "bg-card text-muted-foreground border-border hover:border-primary hover:text-primary"
      }`}
    >
      {children}
    </button>
  );
}
