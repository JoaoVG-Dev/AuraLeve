import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { z } from "zod";
import { Gem, Search, SlidersHorizontal, Sparkles, X } from "lucide-react";
import { ProductCard } from "@/components/ProductCard";
import { useCategories, useEnergies, useProducts, useSubcategories } from "@/lib/catalog";
import { finalPrice, normalize } from "@/lib/types";
import heroBg from "@/assets/product-citrine.jpg";

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
      { title: "Catálogo — AuraLeve" },
      {
        name: "description",
        content:
          "Explore acessórios autorais AuraLeve por categoria, energia, intenção, preço e novidades.",
      },
    ],
  }),
});

const PAGE_SIZE = 8;

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
  const [page, setPage] = useState(1);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(qInput), 250);
    return () => clearTimeout(t);
  }, [qInput]);

  useEffect(() => {
    setPage(1);
  }, [search.categoria, search.sub, search.energia, search.ordem, debouncedQ]);

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
        sorted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
    return sorted;
  }, [products, cat, search.sub, search.energia, nQ, order, subcategories, energies, categories]);

  const suggestions = useMemo(() => {
    if (!qInput.trim()) return [];
    const n = normalize(qInput);
    return products.filter((p) => normalize(p.name).includes(n)).slice(0, 5);
  }, [qInput, products]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const visible = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const setFilter = (key: keyof typeof search, value?: string) =>
    navigate({
      search: (prev: typeof search) => ({ ...prev, [key]: value || undefined }),
    });

  const hasFilters = !!(
    search.categoria ||
    search.sub ||
    search.energia ||
    debouncedQ ||
    search.ordem
  );

  const clearAll = () => {
    setQInput("");
    navigate({ search: () => ({}) });
  };

  return (
    <div>
      <section className="relative overflow-hidden border-b border-border">
        <img
          src={heroBg}
          alt="Catálogo AuraLeve com acessórios e cristais"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/84 to-background/22" />
        <div className="relative aura-container py-14 md:py-20">
          <div className="max-w-xl">
            <span className="aura-eyebrow">Catálogo</span>
            <h1 className="mt-3 font-display text-5xl text-foreground md:text-7xl">
              Peças autorais para elevar sua energia
            </h1>
            <p className="mt-4 max-w-md text-muted-foreground">
              Busque por produto, cristal, categoria ou intenção e encontre acessórios com presença
              para todos os dias.
            </p>
            <SearchBox
              qInput={qInput}
              setQInput={setQInput}
              setShowSug={setShowSug}
              showSug={showSug}
              suggestions={suggestions}
              categories={categories}
            />
          </div>
        </div>
      </section>

      <section className="aura-container py-8 md:py-10">
        <div className="aura-panel p-4 md:p-5">
          <div className="grid gap-5">
            <FilterStrip
              label="Categorias"
              options={categories.map((c) => ({ value: c.slug, label: c.name }))}
              value={search.categoria}
              onChange={(v) => {
                setFilter("categoria", v);
                setFilter("sub", undefined);
              }}
            />

            {subs.length > 0 && (
              <FilterStrip
                label="Subcategorias"
                options={subs.map((s) => ({ value: s.slug, label: s.name }))}
                value={search.sub}
                onChange={(v) => setFilter("sub", v)}
              />
            )}

            <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
              <FilterStrip
                label="Energia / intenção"
                options={energies.map((e) => ({ value: e.slug, label: e.name }))}
                value={search.energia}
                onChange={(v) => setFilter("energia", v)}
                icon
              />
              <div className="flex flex-wrap items-center gap-3">
                <label className="block">
                  <span className="aura-label">Ordenar por</span>
                  <select
                    value={order}
                    onChange={(e) =>
                      setFilter("ordem", e.target.value === "recentes" ? undefined : e.target.value)
                    }
                    className="aura-input min-w-44"
                  >
                    <option value="recentes">Mais recentes</option>
                    <option value="menor">Menor preço</option>
                    <option value="maior">Maior preço</option>
                    <option value="promo">Promoções</option>
                  </select>
                </label>
                {hasFilters && (
                  <button
                    onClick={clearAll}
                    className="aura-button-outline mt-6 min-h-10 px-3 py-2"
                    type="button"
                  >
                    <X className="h-4 w-4" />
                    Limpar
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="aura-container pb-10 md:pb-16">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">
            <strong className="text-foreground">{filtered.length}</strong> produtos encontrados
          </p>
          <button className="aura-button-outline min-h-10 px-3 py-2" type="button">
            <SlidersHorizontal className="h-4 w-4" />
            Filtrar
          </button>
        </div>

        {filtered.length === 0 ? (
          <div className="aura-card py-20 text-center">
            <Gem className="mx-auto mb-4 h-12 w-12 text-primary" />
            <h3 className="font-display text-3xl text-foreground">Nenhuma peça encontrada</h3>
            <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
              Tente ajustar a busca ou explorar outra energia.
            </p>
            {hasFilters && (
              <button onClick={clearAll} className="aura-button mt-6" type="button">
                Limpar filtros
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
              {visible.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
            <Pagination page={page} totalPages={totalPages} setPage={setPage} />
          </>
        )}
      </section>

      <section className="aura-container pb-16 md:pb-24">
        <div className="grid overflow-hidden rounded-lg border border-border bg-card shadow-[var(--shadow-card)] md:grid-cols-[1fr_0.7fr]">
          <div className="grid gap-4 p-6 sm:grid-cols-3 md:p-8">
            {[
              ["Energia e intenção", "Cada peça criada para harmonizar e transformar."],
              ["Pedras naturais", "Selecionadas com cuidado e significado."],
              ["Feito com alma", "Acessórios autorais em pequenas quantidades."],
            ].map(([title, text]) => (
              <div
                key={title}
                className="border-b border-border pb-4 last:border-b-0 sm:border-b-0 sm:border-r sm:pr-4 sm:last:border-r-0"
              >
                <Sparkles className="mb-3 h-6 w-6 text-primary" />
                <h3 className="font-display text-xl text-foreground">{title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{text}</p>
              </div>
            ))}
          </div>
          <div className="hidden bg-champagne md:block" />
        </div>
      </section>
    </div>
  );
}

function SearchBox({
  qInput,
  setQInput,
  setShowSug,
  showSug,
  suggestions,
  categories,
}: {
  qInput: string;
  setQInput: (value: string) => void;
  setShowSug: (value: boolean) => void;
  showSug: boolean;
  suggestions: ReturnType<typeof useProducts>["data"];
  categories: { id: string; name: string }[];
}) {
  return (
    <div className="relative mt-8 max-w-md">
      <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <input
        value={qInput}
        onChange={(e) => {
          setQInput(e.target.value);
          setShowSug(true);
        }}
        onFocus={() => setShowSug(true)}
        onBlur={() => setTimeout(() => setShowSug(false), 150)}
        placeholder="Buscar por produto, cristal ou intenção..."
        className="aura-input pl-11 pr-10"
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
      {showSug && suggestions && suggestions.length > 0 && (
        <div className="aura-panel absolute left-0 right-0 top-full z-30 mt-2 overflow-hidden">
          {suggestions.map((p) => (
            <button
              key={p.id}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                setQInput(p.name);
                setShowSug(false);
              }}
              className="flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-champagne/55"
            >
              <img src={p.image} alt="" className="h-11 w-11 rounded-md object-cover" />
              <span className="min-w-0 flex-1 text-sm">
                <span className="block line-clamp-1 font-semibold text-foreground">{p.name}</span>
                <span className="text-xs text-muted-foreground">
                  {categories.find((c) => c.id === p.categoryId)?.name}
                </span>
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function FilterStrip({
  label,
  options,
  value,
  onChange,
  icon,
}: {
  label: string;
  options: { value: string; label: string }[];
  value?: string;
  onChange: (v?: string) => void;
  icon?: boolean;
}) {
  return (
    <div>
      <span className="aura-label">{label}</span>
      <div className="flex gap-2 overflow-x-auto pb-1">
        <Chip active={!value} onClick={() => onChange(undefined)}>
          Todos
        </Chip>
        {options.map((o) => (
          <Chip key={o.value} active={value === o.value} onClick={() => onChange(o.value)}>
            {icon && <Sparkles className="h-3.5 w-3.5" />}
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
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-md border px-3 py-2 text-xs font-semibold transition ${
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-card text-muted-foreground hover:border-primary hover:text-primary"
      }`}
      type="button"
    >
      {children}
    </button>
  );
}

function Pagination({
  page,
  totalPages,
  setPage,
}: {
  page: number;
  totalPages: number;
  setPage: (page: number) => void;
}) {
  if (totalPages <= 1) return null;
  return (
    <div className="mt-8 flex items-center justify-center gap-2">
      {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
        <button
          key={p}
          type="button"
          onClick={() => setPage(p)}
          className={`grid h-9 w-9 place-items-center rounded-md border text-sm font-semibold transition ${
            p === page
              ? "border-primary bg-primary text-primary-foreground"
              : "border-border bg-card text-muted-foreground hover:border-primary hover:text-primary"
          }`}
        >
          {p}
        </button>
      ))}
    </div>
  );
}
