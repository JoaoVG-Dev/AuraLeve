import { createFileRoute } from "@tanstack/react-router";
import {
  useCategories,
  useDeleteProduct,
  useEnergies,
  useProducts,
  useSaveProduct,
  useSubcategories,
} from "@/lib/catalog";
import type { Product } from "@/lib/types";
import { finalPrice, formatBRL, slugify } from "@/lib/types";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { AlertTriangle, Pencil, Plus, Search, Trash2, X } from "lucide-react";
import {
  AdminBadge,
  AdminEmptyState,
  AdminIconButton,
  AdminPageHeader,
  AdminPanel,
  adminInputClass,
  adminTableCellClass,
  adminTableHeaderClass,
} from "@/components/admin/AdminUi";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_layout/admin/produtos")({
  component: AdminProducts,
});

const empty = (): Product & { isNew?: boolean } => ({
  id: "",
  name: "",
  slug: "",
  description: "",
  price: 0,
  discountPercent: 0,
  image: "",
  categoryId: null,
  subcategoryId: null,
  energyIds: [],
  stock: 0,
  featured: false,
  promo: false,
  createdAt: new Date().toISOString(),
  isNew: true,
});

type ProductFilter = "all" | "promo" | "low-stock";

function AdminProducts() {
  const { data: products = [] } = useProducts();
  const { data: categories = [] } = useCategories();
  const { data: subcategories = [] } = useSubcategories();
  const { data: energies = [] } = useEnergies();
  const save = useSaveProduct();
  const del = useDeleteProduct();
  const [editing, setEditing] = useState<(Product & { isNew?: boolean }) | null>(null);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<ProductFilter>("all");

  const filteredProducts = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return products.filter((product) => {
      const matchesSearch =
        !normalized ||
        product.name.toLowerCase().includes(normalized) ||
        product.slug.toLowerCase().includes(normalized);
      const matchesFilter =
        filter === "all" ||
        (filter === "promo" && product.promo) ||
        (filter === "low-stock" && product.stock <= 5);

      return matchesSearch && matchesFilter;
    });
  }, [filter, products, query]);

  const open = (p?: Product) => setEditing(p ? { ...p } : empty());
  const close = () => setEditing(null);

  const onSave = () => {
    if (!editing) return;
    if (!editing.name || !editing.categoryId || editing.price <= 0) {
      toast.error("Preencha nome, categoria e preço válido");
      return;
    }
    if (editing.stock < 0) return toast.error("Estoque não pode ser negativo");
    if (editing.discountPercent < 0 || editing.discountPercent > 100) {
      toast.error("Desconto deve ficar entre 0% e 100%");
      return;
    }
    if (editing.promo) {
      const promoCount = products.filter((p) => p.promo && p.id !== editing.id).length;
      if (promoCount >= 3) {
        toast.error("Máximo de 3 produtos em promoção na home");
        return;
      }
    }
    const slug = editing.slug || slugify(editing.name);
    save.mutate(
      { ...editing, slug },
      {
        onSuccess: () => {
          toast.success(editing.isNew ? "Produto criado" : "Produto atualizado");
          close();
        },
        onError: (error: unknown) => toast.error(errorMessage(error, "Erro ao salvar")),
      },
    );
  };

  const remove = (id: string) => {
    if (!confirm("Excluir produto?")) return;
    del.mutate(id, {
      onSuccess: () => toast.success("Produto removido"),
      onError: (error: unknown) => toast.error(errorMessage(error, "Erro ao excluir")),
    });
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <AdminPageHeader
        eyebrow="Catálogo"
        title="Produtos"
        description="Cadastre peças, preços, estoque, destaques e promoções exibidas na vitrine."
        action={
          <button
            onClick={() => open()}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm transition hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" />
            Novo produto
          </button>
        }
      />

      <div className="grid min-w-0 gap-3 lg:grid-cols-[1fr_auto] lg:items-center">
        <label className="relative block">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            className={cn(adminInputClass, "pl-9")}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar por nome ou slug"
          />
        </label>
        <div className="grid w-full grid-cols-3 rounded-lg border border-border bg-card p-1 shadow-sm sm:inline-flex sm:w-auto">
          {[
            ["all", "Todos"],
            ["promo", "Promoção"],
            ["low-stock", "Estoque baixo"],
          ].map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setFilter(value as ProductFilter)}
              className={cn(
                "min-w-0 rounded-md px-2 py-2 text-xs font-semibold transition sm:px-3 sm:py-1.5",
                filter === value
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-primary",
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <AdminPanel
        title="Produtos cadastrados"
        description={`${filteredProducts.length} item(ns) exibidos`}
      >
        {filteredProducts.length === 0 ? (
          <AdminEmptyState
            icon={Search}
            title="Nenhum produto encontrado"
            description="Ajuste a busca ou crie um novo produto para preencher o catálogo."
            action={
              <button
                onClick={() => open()}
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
              >
                <Plus className="h-4 w-4" />
                Novo produto
              </button>
            }
          />
        ) : (
          <div className="max-w-full overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead className={adminTableHeaderClass}>
                <tr>
                  <th className={adminTableCellClass}>Produto</th>
                  <th className={adminTableCellClass}>Categoria</th>
                  <th className={adminTableCellClass}>Preço</th>
                  <th className={adminTableCellClass}>Estoque</th>
                  <th className={adminTableCellClass}>Promoção</th>
                  <th className={cn(adminTableCellClass, "text-right")}>Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredProducts.map((p) => {
                  const category =
                    categories.find((c) => c.id === p.categoryId)?.name ?? "Sem categoria";
                  return (
                    <tr key={p.id} className="transition hover:bg-accent/30">
                      <td className={adminTableCellClass}>
                        <div className="flex items-center gap-3">
                          {p.image ? (
                            <img
                              src={p.image}
                              className="h-11 w-11 rounded-lg object-cover ring-1 ring-border"
                              alt=""
                            />
                          ) : (
                            <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-muted text-[10px] font-semibold uppercase tracking-[0.16em] text-primary">
                              Aura
                            </span>
                          )}
                          <div className="min-w-0">
                            <p className="truncate font-medium text-foreground">{p.name}</p>
                            <p className="truncate text-xs text-muted-foreground">{p.slug}</p>
                          </div>
                        </div>
                      </td>
                      <td className={adminTableCellClass}>
                        <span className="text-muted-foreground">{category}</span>
                      </td>
                      <td className={adminTableCellClass}>
                        {p.discountPercent > 0 ? (
                          <div>
                            <s className="text-xs text-muted-foreground">{formatBRL(p.price)}</s>
                            <p className="font-semibold text-primary">{formatBRL(finalPrice(p))}</p>
                          </div>
                        ) : (
                          <span className="font-medium">{formatBRL(p.price)}</span>
                        )}
                      </td>
                      <td className={adminTableCellClass}>
                        {p.stock <= 5 ? (
                          <AdminBadge tone="danger">
                            <AlertTriangle className="mr-1 h-3.5 w-3.5" />
                            {p.stock} un.
                          </AdminBadge>
                        ) : (
                          <AdminBadge tone="neutral">{p.stock} un.</AdminBadge>
                        )}
                      </td>
                      <td className={adminTableCellClass}>
                        {p.promo ? (
                          <AdminBadge tone="primary">Ativa</AdminBadge>
                        ) : (
                          <span className="text-xs text-muted-foreground">Não</span>
                        )}
                      </td>
                      <td className={cn(adminTableCellClass, "text-right")}>
                        <AdminIconButton onClick={() => open(p)} aria-label={`Editar ${p.name}`}>
                          <Pencil className="h-4 w-4" />
                        </AdminIconButton>
                        <AdminIconButton
                          onClick={() => remove(p.id)}
                          aria-label={`Excluir ${p.name}`}
                          className="hover:bg-destructive/10 hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </AdminIconButton>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </AdminPanel>

      {editing && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4">
          <div className="max-h-[92dvh] w-full max-w-2xl overflow-y-auto rounded-t-xl border border-border bg-card shadow-xl sm:rounded-xl">
            <div className="flex items-start justify-between gap-3 border-b border-border p-4 sm:p-5">
              <div className="min-w-0">
                <h2 className="font-display text-xl text-primary">
                  {editing.isNew ? "Novo produto" : "Editar produto"}
                </h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  Mantenha dados comerciais e apresentação da peça sempre atualizados.
                </p>
              </div>
              <AdminIconButton onClick={close} aria-label="Fechar modal">
                <X className="h-5 w-5" />
              </AdminIconButton>
            </div>
            <div className="grid gap-4 p-4 sm:p-5">
              <Input
                label="Nome"
                value={editing.name}
                onChange={(v) => setEditing({ ...editing, name: v })}
              />
              <Input
                label="Slug (opcional)"
                value={editing.slug}
                onChange={(v) => setEditing({ ...editing, slug: v })}
                placeholder="auto a partir do nome"
              />
              <div>
                <Label>Descrição</Label>
                <textarea
                  className={adminInputClass}
                  rows={3}
                  value={editing.description}
                  onChange={(e) => setEditing({ ...editing, description: e.target.value })}
                />
              </div>
              <Input
                label="Imagem (URL)"
                value={editing.image}
                onChange={(v) => setEditing({ ...editing, image: v })}
              />
              <div className="grid gap-4 sm:grid-cols-3">
                <Input
                  label="Preço (R$)"
                  type="number"
                  value={String(editing.price)}
                  onChange={(v) => setEditing({ ...editing, price: parseFloat(v) || 0 })}
                />
                <Input
                  label="Desconto (%)"
                  type="number"
                  value={String(editing.discountPercent ?? 0)}
                  onChange={(v) => setEditing({ ...editing, discountPercent: parseFloat(v) || 0 })}
                />
                <Input
                  label="Estoque"
                  type="number"
                  value={String(editing.stock)}
                  onChange={(v) => setEditing({ ...editing, stock: parseInt(v) || 0 })}
                />
              </div>
              {editing.discountPercent > 0 ? (
                <p className="rounded-lg bg-primary/10 px-3 py-2 text-xs text-muted-foreground">
                  Preço promocional:{" "}
                  <span className="font-semibold text-primary">
                    {formatBRL(finalPrice(editing))}
                  </span>
                </p>
              ) : null}

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label>Categoria</Label>
                  <select
                    className={adminInputClass}
                    value={editing.categoryId ?? ""}
                    onChange={(e) =>
                      setEditing({
                        ...editing,
                        categoryId: e.target.value || null,
                        subcategoryId: null,
                      })
                    }
                  >
                    <option value="">Selecione</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label>Subcategoria</Label>
                  <select
                    className={adminInputClass}
                    value={editing.subcategoryId ?? ""}
                    onChange={(e) =>
                      setEditing({ ...editing, subcategoryId: e.target.value || null })
                    }
                  >
                    <option value="">Sem subcategoria</option>
                    {subcategories
                      .filter((s) => s.categoryId === editing.categoryId)
                      .map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              <div>
                <Label>Energias / Intenção</Label>
                <div className="flex flex-wrap gap-2">
                  {energies.map((e) => {
                    const on = editing.energyIds.includes(e.id);
                    return (
                      <button
                        key={e.id}
                        type="button"
                        onClick={() =>
                          setEditing({
                            ...editing,
                            energyIds: on
                              ? editing.energyIds.filter((x) => x !== e.id)
                              : [...editing.energyIds, e.id],
                          })
                        }
                        className={cn(
                          "rounded-full border px-3 py-1.5 text-xs font-medium transition",
                          on
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border bg-card text-muted-foreground hover:border-primary hover:text-primary",
                        )}
                      >
                        {e.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid gap-3 rounded-lg border border-border bg-background p-3 sm:grid-cols-2 sm:gap-4">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={editing.featured}
                    onChange={(e) => setEditing({ ...editing, featured: e.target.checked })}
                  />
                  Destaque na vitrine
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={editing.promo}
                    onChange={(e) => setEditing({ ...editing, promo: e.target.checked })}
                  />
                  Promoção na home, máximo 3
                </label>
              </div>
            </div>
            <div className="flex flex-col-reverse gap-2 border-t border-border p-4 sm:flex-row sm:justify-end sm:p-5">
              <button
                onClick={close}
                className="w-full rounded-lg border border-border px-5 py-2 text-sm font-medium transition hover:bg-accent sm:w-auto"
              >
                Cancelar
              </button>
              <button
                onClick={onSave}
                disabled={save.isPending}
                className="w-full rounded-lg bg-primary px-5 py-2 text-sm font-medium text-primary-foreground transition hover:bg-primary/90 disabled:opacity-50 sm:w-auto"
              >
                {save.isPending ? "Salvando..." : "Salvar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <span className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.18em] text-primary">
      {children}
    </span>
  );
}

function Input({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <Label>{label}</Label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={adminInputClass}
      />
    </label>
  );
}

function errorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}
