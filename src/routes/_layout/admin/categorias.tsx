import { createFileRoute } from "@tanstack/react-router";
import { useCategories, useDeleteCategory, useSaveCategory, useProducts } from "@/lib/catalog";
import type { Category } from "@/lib/types";
import { slugify } from "@/lib/types";
import { useState } from "react";
import { toast } from "sonner";
import { FolderOpen, Pencil, Plus, Tags, Trash2, X } from "lucide-react";
import type { LucideIcon } from "lucide-react";
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

export const Route = createFileRoute("/_layout/admin/categorias")({
  component: CategoriesAdmin,
});

interface Item {
  id?: string;
  name: string;
  slug: string;
  description?: string | null;
}

function CategoriesAdmin() {
  const { data: categories = [] } = useCategories();
  const { data: products = [] } = useProducts();
  const save = useSaveCategory();
  const del = useDeleteCategory();
  const [editing, setEditing] = useState<Item | null>(null);

  const onSave = () => {
    if (!editing || !editing.name) return toast.error("Nome obrigatório");
    const data = { ...editing, slug: editing.slug || slugify(editing.name) };
    save.mutate(data, {
      onSuccess: () => {
        toast.success(editing.id ? "Categoria atualizada" : "Categoria criada");
        setEditing(null);
      },
      onError: (error: unknown) => toast.error(errorMessage(error, "Erro ao salvar")),
    });
  };

  const remove = (c: Category) => {
    if (products.some((p) => p.categoryId === c.id))
      return toast.error("Categoria em uso por produtos");
    if (!confirm("Excluir categoria?")) return;
    del.mutate(c.id, {
      onSuccess: () => toast.success("Categoria removida"),
      onError: (error: unknown) => toast.error(errorMessage(error, "Erro ao excluir")),
    });
  };

  return (
    <CrudShell
      title="Categorias"
      description="Organize as linhas principais do catálogo e mantenha os filtros da loja claros."
      newLabel="Nova categoria"
      emptyTitle="Nenhuma categoria cadastrada"
      emptyDescription="Crie categorias para agrupar colares, pulseiras, patuás, japamalas, cristais e outras peças."
      icon={Tags}
      onNew={() => setEditing({ name: "", slug: "" })}
      items={categories}
      onEdit={(c) => setEditing({ ...c })}
      onDelete={(id) => {
        const c = categories.find((x) => x.id === id);
        if (c) remove(c);
      }}
      editing={editing}
      onClose={() => setEditing(null)}
      onSave={onSave}
      setEditing={setEditing}
    />
  );
}

export function CrudShell({
  title,
  description,
  newLabel = "Novo item",
  emptyTitle = "Nenhum item cadastrado",
  emptyDescription = "Crie o primeiro registro para começar a organizar esta seção.",
  icon: Icon = FolderOpen,
  items,
  editing,
  setEditing,
  onNew,
  onEdit,
  onDelete,
  onSave,
  onClose,
}: {
  title: string;
  description?: string;
  newLabel?: string;
  emptyTitle?: string;
  emptyDescription?: string;
  icon?: LucideIcon;
  items: Array<{ id: string; name: string; slug: string; description?: string | null }>;
  editing: Item | null;
  setEditing: (i: Item | null) => void;
  onNew: () => void;
  onEdit: (i: Item) => void;
  onDelete: (id: string) => void;
  onSave: () => void;
  onClose: () => void;
}) {
  return (
    <div className="space-y-4 sm:space-y-6">
      <AdminPageHeader
        eyebrow="Catálogo"
        title={title}
        description={description}
        action={
          <button
            onClick={onNew}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm transition hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" />
            {newLabel}
          </button>
        }
      />
      <AdminPanel title="Registros" description={`${items.length} item(ns) cadastrados`}>
        {items.length === 0 ? (
          <AdminEmptyState
            icon={Icon}
            title={emptyTitle}
            description={emptyDescription}
            action={
              <button
                onClick={onNew}
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
              >
                <Plus className="h-4 w-4" />
                {newLabel}
              </button>
            }
          />
        ) : (
          <div className="max-w-full overflow-x-auto">
            <table className="w-full min-w-[620px] text-sm">
              <thead className={adminTableHeaderClass}>
                <tr>
                  <th className={adminTableCellClass}>Nome</th>
                  <th className={adminTableCellClass}>Slug</th>
                  <th className={adminTableCellClass}>Descrição</th>
                  <th className={cn(adminTableCellClass, "text-right")}>Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {items.map((i) => (
                  <tr key={i.id} className="transition hover:bg-accent/30">
                    <td className={cn(adminTableCellClass, "font-medium text-foreground")}>
                      {i.name}
                    </td>
                    <td className={cn(adminTableCellClass, "text-muted-foreground")}>{i.slug}</td>
                    <td
                      className={cn(adminTableCellClass, "max-w-md truncate text-muted-foreground")}
                    >
                      {i.description || "Sem descrição"}
                    </td>
                    <td className={cn(adminTableCellClass, "text-right")}>
                      <AdminIconButton onClick={() => onEdit(i)} aria-label={`Editar ${i.name}`}>
                        <Pencil className="h-4 w-4" />
                      </AdminIconButton>
                      <AdminIconButton
                        onClick={() => onDelete(i.id)}
                        aria-label={`Excluir ${i.name}`}
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
                  {editing.id ? "Editar registro" : newLabel}
                </h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  Slugs vazios são gerados automaticamente a partir do nome.
                </p>
              </div>
              <AdminIconButton onClick={onClose} aria-label="Fechar modal">
                <X className="h-5 w-5" />
              </AdminIconButton>
            </div>
            <div className="grid gap-4 p-4 sm:p-5">
              <Field label="Nome">
                <input
                  className={adminInputClass}
                  value={editing.name}
                  onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                />
              </Field>
              <Field label="Slug (opcional)">
                <input
                  className={adminInputClass}
                  value={editing.slug}
                  onChange={(e) => setEditing({ ...editing, slug: e.target.value })}
                />
              </Field>
              <Field label="Descrição">
                <input
                  className={adminInputClass}
                  value={editing.description ?? ""}
                  onChange={(e) => setEditing({ ...editing, description: e.target.value })}
                />
              </Field>
            </div>
            <div className="flex flex-col-reverse gap-2 border-t border-border p-4 sm:flex-row sm:justify-end sm:p-5">
              <button
                onClick={onClose}
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

function Field({ label, children }: { label: string; children: React.ReactNode }) {
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
