import { createFileRoute } from "@tanstack/react-router";
import {
  useCategories,
  useSubcategories,
  useSaveSubcategory,
  useDeleteSubcategory,
  useProducts,
} from "@/lib/catalog";
import { slugify } from "@/lib/types";
import { useState } from "react";
import { toast } from "sonner";
import { Layers, Pencil, Plus, Trash2, X } from "lucide-react";
import {
  AdminEmptyState,
  AdminIconButton,
  AdminPageHeader,
  AdminPanel,
  adminInputClass,
  adminTableCellClass,
  adminTableHeaderClass,
} from "@/components/admin/AdminUi";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_layout/admin/subcategorias")({
  component: SubAdmin,
});

interface Sub {
  id?: string;
  name: string;
  slug: string;
  categoryId: string;
}

function SubAdmin() {
  const { data: subcategories = [] } = useSubcategories();
  const { data: categories = [] } = useCategories();
  const { data: products = [] } = useProducts();
  const save = useSaveSubcategory();
  const del = useDeleteSubcategory();
  const [editing, setEditing] = useState<Sub | null>(null);

  const onSave = () => {
    if (!editing || !editing.name || !editing.categoryId)
      return toast.error("Nome e categoria obrigatórios");
    const data = { ...editing, slug: editing.slug || slugify(editing.name) };
    save.mutate(data, {
      onSuccess: () => {
        toast.success(editing.id ? "Subcategoria atualizada" : "Subcategoria criada");
        setEditing(null);
      },
      onError: (error: unknown) => toast.error(errorMessage(error, "Erro ao salvar")),
    });
  };

  const remove = (id: string) => {
    if (products.some((p) => p.subcategoryId === id)) return toast.error("Subcategoria em uso");
    if (!confirm("Excluir subcategoria?")) return;
    del.mutate(id, {
      onSuccess: () => toast.success("Subcategoria removida"),
      onError: (error: unknown) => toast.error(errorMessage(error, "Erro ao excluir")),
    });
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <AdminPageHeader
        eyebrow="Catálogo"
        title="Subcategorias"
        description="Detalhe melhor os agrupamentos do catálogo sem tornar a navegação pesada."
        action={
          <button
            onClick={() => setEditing({ name: "", slug: "", categoryId: categories[0]?.id ?? "" })}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm transition hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" />
            Nova subcategoria
          </button>
        }
      />

      <AdminPanel
        title="Subcategorias cadastradas"
        description={`${subcategories.length} item(ns) cadastrados`}
      >
        {subcategories.length === 0 ? (
          <AdminEmptyState
            icon={Layers}
            title="Nenhuma subcategoria cadastrada"
            description="Use subcategorias para refinar listas maiores sem criar menus confusos."
          />
        ) : (
          <div className="max-w-full overflow-x-auto">
            <table className="w-full min-w-[680px] text-sm">
              <thead className={adminTableHeaderClass}>
                <tr>
                  <th className={adminTableCellClass}>Nome</th>
                  <th className={adminTableCellClass}>Categoria</th>
                  <th className={adminTableCellClass}>Slug</th>
                  <th className={cn(adminTableCellClass, "text-right")}>Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {subcategories.map((s) => (
                  <tr key={s.id} className="transition hover:bg-accent/30">
                    <td className={cn(adminTableCellClass, "font-medium text-foreground")}>
                      {s.name}
                    </td>
                    <td className={cn(adminTableCellClass, "text-muted-foreground")}>
                      {categories.find((c) => c.id === s.categoryId)?.name || "Sem categoria"}
                    </td>
                    <td className={cn(adminTableCellClass, "text-muted-foreground")}>{s.slug}</td>
                    <td className={cn(adminTableCellClass, "text-right")}>
                      <AdminIconButton
                        onClick={() =>
                          setEditing({
                            id: s.id,
                            name: s.name,
                            slug: s.slug,
                            categoryId: s.categoryId,
                          })
                        }
                        aria-label={`Editar ${s.name}`}
                      >
                        <Pencil className="h-4 w-4" />
                      </AdminIconButton>
                      <AdminIconButton
                        onClick={() => remove(s.id)}
                        aria-label={`Excluir ${s.name}`}
                        className="hover:bg-destructive/10 hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </AdminIconButton>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </AdminPanel>

      {editing && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4">
          <div className="w-full max-w-md rounded-t-xl border border-border bg-card shadow-xl sm:rounded-xl">
            <div className="flex items-start justify-between gap-3 border-b border-border p-4 sm:p-5">
              <div className="min-w-0">
                <h2 className="font-display text-xl text-primary">
                  {editing.id ? "Editar subcategoria" : "Nova subcategoria"}
                </h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  Associe a uma categoria principal.
                </p>
              </div>
              <AdminIconButton onClick={() => setEditing(null)} aria-label="Fechar modal">
                <X className="h-5 w-5" />
              </AdminIconButton>
            </div>
            <div className="grid gap-4 p-4 sm:p-5">
              <L label="Nome">
                <input
                  className={adminInputClass}
                  value={editing.name}
                  onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                />
              </L>
              <L label="Slug (opcional)">
                <input
                  className={adminInputClass}
                  value={editing.slug}
                  onChange={(e) => setEditing({ ...editing, slug: e.target.value })}
                />
              </L>
              <L label="Categoria">
                <select
                  className={adminInputClass}
                  value={editing.categoryId}
                  onChange={(e) => setEditing({ ...editing, categoryId: e.target.value })}
                >
                  <option value="">Selecione</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </L>
            </div>
            <div className="flex flex-col-reverse gap-2 border-t border-border p-4 sm:flex-row sm:justify-end sm:p-5">
              <button
                onClick={() => setEditing(null)}
                className="w-full rounded-lg border border-border px-5 py-2 text-sm font-medium transition hover:bg-accent sm:w-auto"
              >
                Cancelar
              </button>
              <button
                onClick={onSave}
                className="w-full rounded-lg bg-primary px-5 py-2 text-sm font-medium text-primary-foreground transition hover:bg-primary/90 sm:w-auto"
              >
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function L({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.18em] text-primary">
        {label}
      </span>
      {children}
    </label>
  );
}

function errorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}
