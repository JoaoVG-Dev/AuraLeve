import { createFileRoute } from "@tanstack/react-router";
import { useEnergies, useSaveEnergy, useDeleteEnergy, useProducts } from "@/lib/catalog";
import { slugify } from "@/lib/types";
import { useState } from "react";
import { toast } from "sonner";
import { Sparkles } from "lucide-react";
import { CrudShell } from "./categorias";

export const Route = createFileRoute("/_layout/admin/energias")({
  component: EnergiesAdmin,
});

type EnergyItem = {
  id?: string;
  name: string;
  slug: string;
  description?: string | null;
};

function EnergiesAdmin() {
  const { data: energies = [] } = useEnergies();
  const { data: products = [] } = useProducts();
  const save = useSaveEnergy();
  const del = useDeleteEnergy();
  const [editing, setEditing] = useState<EnergyItem | null>(null);

  const onSave = () => {
    if (!editing || !editing.name) return toast.error("Nome obrigatório");
    const data = { ...editing, slug: editing.slug || slugify(editing.name) };
    save.mutate(data, {
      onSuccess: () => {
        toast.success(editing.id ? "Energia atualizada" : "Energia criada");
        setEditing(null);
      },
      onError: (error: unknown) => toast.error(errorMessage(error, "Erro ao salvar")),
    });
  };

  const remove = (id: string) => {
    if (products.some((p) => p.energyIds.includes(id))) return toast.error("Energia em uso");
    if (!confirm("Excluir energia?")) return;
    del.mutate(id, {
      onSuccess: () => toast.success("Energia removida"),
      onError: (error: unknown) => toast.error(errorMessage(error, "Erro ao excluir")),
    });
  };

  return (
    <CrudShell
      title="Energias / Intenções"
      description="Mantenha as intenções usadas nos filtros e na curadoria energética das peças."
      newLabel="Nova energia"
      emptyTitle="Nenhuma energia cadastrada"
      emptyDescription="Crie energias para orientar a busca por proteção, amor, prosperidade e outros propósitos."
      icon={Sparkles}
      items={energies}
      editing={editing}
      setEditing={setEditing}
      onNew={() => setEditing({ name: "", slug: "" })}
      onEdit={(e) => setEditing({ ...e })}
      onDelete={remove}
      onSave={onSave}
      onClose={() => setEditing(null)}
    />
  );
}

function errorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}
