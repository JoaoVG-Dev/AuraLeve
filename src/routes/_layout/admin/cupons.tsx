import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Pencil, Plus, TicketPercent, Trash2, X } from "lucide-react";
import { useCoupons, useSaveCoupon, useDeleteCoupon } from "@/lib/catalog";
import type { Coupon } from "@/lib/types";
import { COUPON_STATUS_LABEL, formatBRL, getCouponStatus } from "@/lib/types";
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

export const Route = createFileRoute("/_layout/admin/cupons")({
  component: CouponsAdmin,
});

type Editable = Partial<Coupon> & { code: string; type: "percent" | "fixed"; value: number };

const empty = (): Editable => ({
  code: "",
  type: "percent",
  value: 10,
  minOrderTotal: 0,
  startsAt: null,
  expiresAt: null,
  maxUses: null,
  onePerCustomer: false,
  active: true,
});

const toLocal = (iso: string | null | undefined) =>
  iso ? new Date(iso).toISOString().slice(0, 16) : "";

const couponTone = {
  active: "primary",
  inactive: "neutral",
  expired: "danger",
  depleted: "danger",
  scheduled: "gold",
} as const;

const couponDescription = (coupon: Coupon) => {
  const status = getCouponStatus(coupon);
  if (status === "inactive") return "Desativado manualmente";
  if (status === "expired") return "Fora da janela de validade";
  if (status === "depleted") return "Limite de uso atingido";
  if (status === "scheduled") return "Ainda não disponível";
  return "Disponível para o checkout";
};

function CouponsAdmin() {
  const { data: coupons = [], isLoading } = useCoupons();
  const save = useSaveCoupon();
  const del = useDeleteCoupon();
  const [editing, setEditing] = useState<Editable | null>(null);
  const statusTotals = coupons.reduce(
    (acc, coupon) => {
      acc[getCouponStatus(coupon)] += 1;
      return acc;
    },
    { active: 0, inactive: 0, expired: 0, depleted: 0, scheduled: 0 },
  );

  const onSave = () => {
    if (!editing) return;
    if (!editing.code.trim()) return toast.error("Código obrigatório");
    if (editing.value <= 0) return toast.error("Valor deve ser maior que zero");
    if (editing.type === "percent" && editing.value > 100)
      return toast.error("Porcentagem não pode passar de 100");
    if ((editing.minOrderTotal ?? 0) < 0) return toast.error("Pedido mínimo não pode ser negativo");
    if (editing.maxUses !== null && editing.maxUses !== undefined && editing.maxUses <= 0)
      return toast.error("Limite de usos deve ser maior que zero");
    if (
      editing.startsAt &&
      editing.expiresAt &&
      new Date(editing.expiresAt).getTime() <= new Date(editing.startsAt).getTime()
    ) {
      return toast.error("A validade deve ser posterior ao início do cupom");
    }

    save.mutate(editing, {
      onSuccess: () => {
        toast.success(editing.id ? "Cupom atualizado" : "Cupom criado");
        setEditing(null);
      },
      onError: (error: unknown) => toast.error(errorMessage(error, "Erro ao salvar cupom")),
    });
  };

  const remove = (id: string) => {
    if (!confirm("Excluir cupom?")) return;
    del.mutate(id, {
      onSuccess: () => toast.success("Cupom removido"),
      onError: (error: unknown) => toast.error(errorMessage(error, "Erro ao excluir")),
    });
  };

  const toggleActive = (c: Coupon) => {
    save.mutate(
      { ...c, active: !c.active },
      {
        onSuccess: () => toast.success(c.active ? "Cupom desativado" : "Cupom ativado"),
      },
    );
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <AdminPageHeader
        eyebrow="Vendas"
        title="Cupons"
        description="Crie campanhas, acompanhe uso e controle validade sem alterar o checkout."
        action={
          <button
            onClick={() => setEditing(empty())}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm transition hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" />
            Novo cupom
          </button>
        }
      />

      <AdminPanel
        title="Cupons cadastrados"
        description={`${coupons.length} campanha(s) no total · ${statusTotals.active} realmente ativo(s)`}
      >
        {isLoading ? (
          <p className="px-4 py-8 text-center text-sm text-muted-foreground sm:px-5 sm:py-10">
            Carregando cupons...
          </p>
        ) : coupons.length === 0 ? (
          <AdminEmptyState
            icon={TicketPercent}
            title="Nenhum cupom cadastrado"
            description="Crie cupons para campanhas pontuais, recompra ou atendimento personalizado."
          />
        ) : (
          <div className="max-w-full overflow-x-auto">
            <div className="flex flex-wrap gap-2 border-b border-border/70 px-4 py-3 sm:px-5">
              {(["active", "scheduled", "expired", "depleted", "inactive"] as const).map(
                (status) => (
                  <AdminBadge key={status} tone={couponTone[status]}>
                    {COUPON_STATUS_LABEL[status]}: {statusTotals[status]}
                  </AdminBadge>
                ),
              )}
            </div>
            <table className="w-full min-w-[820px] text-sm">
              <thead className={adminTableHeaderClass}>
                <tr>
                  <th className={adminTableCellClass}>Código</th>
                  <th className={adminTableCellClass}>Desconto</th>
                  <th className={adminTableCellClass}>Pedido mínimo</th>
                  <th className={adminTableCellClass}>Validade</th>
                  <th className={adminTableCellClass}>Usos</th>
                  <th className={adminTableCellClass}>Status</th>
                  <th className={cn(adminTableCellClass, "text-right")}>Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {coupons.map((c) => {
                  const status = getCouponStatus(c);

                  return (
                    <tr key={c.id} className="transition hover:bg-accent/30">
                      <td
                        className={cn(
                          adminTableCellClass,
                          "font-semibold uppercase tracking-wider text-foreground",
                        )}
                      >
                        {c.code}
                      </td>
                      <td className={adminTableCellClass}>
                        {c.type === "percent" ? `${c.value}%` : formatBRL(c.value)}
                      </td>
                      <td className={cn(adminTableCellClass, "text-muted-foreground")}>
                        {c.minOrderTotal > 0 ? formatBRL(c.minOrderTotal) : "Sem mínimo"}
                      </td>
                      <td className={cn(adminTableCellClass, "text-muted-foreground")}>
                        <div>
                          {c.expiresAt
                            ? new Date(c.expiresAt).toLocaleDateString("pt-BR")
                            : "Sem validade"}
                        </div>
                        {c.startsAt ? (
                          <div className="mt-0.5 text-[11px]">
                            Início: {new Date(c.startsAt).toLocaleDateString("pt-BR")}
                          </div>
                        ) : null}
                      </td>
                      <td className={cn(adminTableCellClass, "text-muted-foreground")}>
                        {c.usesCount}
                        {c.maxUses !== null ? ` / ${c.maxUses}` : ""}
                      </td>
                      <td className={adminTableCellClass}>
                        <button
                          onClick={() => toggleActive(c)}
                          className="text-left"
                          title="Alternar ativação manual do cupom"
                        >
                          <AdminBadge tone={couponTone[status]}>
                            {COUPON_STATUS_LABEL[status]}
                          </AdminBadge>
                          <span className="mt-1 block text-[11px] text-muted-foreground">
                            {couponDescription(c)}
                          </span>
                        </button>
                      </td>
                      <td className={cn(adminTableCellClass, "text-right")}>
                        <AdminIconButton
                          onClick={() => setEditing({ ...c })}
                          aria-label={`Editar cupom ${c.code}`}
                        >
                          <Pencil className="h-4 w-4" />
                        </AdminIconButton>
                        <AdminIconButton
                          onClick={() => remove(c.id)}
                          aria-label={`Excluir cupom ${c.code}`}
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
          <div className="max-h-[92dvh] w-full max-w-xl overflow-y-auto rounded-t-xl border border-border bg-card shadow-xl sm:rounded-xl">
            <div className="flex items-start justify-between gap-3 border-b border-border p-4 sm:p-5">
              <div className="min-w-0">
                <h2 className="font-display text-xl text-primary">
                  {editing.id ? "Editar cupom" : "Novo cupom"}
                </h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  Configure regras comerciais sem alterar o fluxo de pagamento.
                </p>
              </div>
              <AdminIconButton onClick={() => setEditing(null)} aria-label="Fechar modal">
                <X className="h-5 w-5" />
              </AdminIconButton>
            </div>
            <div className="grid gap-4 p-4 sm:p-5">
              <F label="Código">
                <input
                  className={cn(adminInputClass, "uppercase")}
                  value={editing.code}
                  onChange={(e) => setEditing({ ...editing, code: e.target.value.toUpperCase() })}
                  maxLength={40}
                  placeholder="EX: AURA10"
                />
              </F>

              <div className="grid gap-4 sm:grid-cols-2">
                <F label="Tipo de desconto">
                  <select
                    className={adminInputClass}
                    value={editing.type}
                    onChange={(e) =>
                      setEditing({ ...editing, type: e.target.value as Editable["type"] })
                    }
                  >
                    <option value="percent">Porcentagem (%)</option>
                    <option value="fixed">Valor fixo (R$)</option>
                  </select>
                </F>
                <F label={editing.type === "percent" ? "Valor (%)" : "Valor (R$)"}>
                  <input
                    type="number"
                    className={adminInputClass}
                    value={editing.value}
                    onChange={(e) =>
                      setEditing({ ...editing, value: parseFloat(e.target.value) || 0 })
                    }
                  />
                </F>
              </div>

              <F label="Valor mínimo do pedido (R$)">
                <input
                  type="number"
                  className={adminInputClass}
                  value={editing.minOrderTotal ?? 0}
                  onChange={(e) =>
                    setEditing({ ...editing, minOrderTotal: parseFloat(e.target.value) || 0 })
                  }
                />
              </F>

              <div className="grid gap-4 sm:grid-cols-2">
                <F label="Início (opcional)">
                  <input
                    type="datetime-local"
                    className={adminInputClass}
                    value={toLocal(editing.startsAt)}
                    onChange={(e) =>
                      setEditing({
                        ...editing,
                        startsAt: e.target.value ? new Date(e.target.value).toISOString() : null,
                      })
                    }
                  />
                </F>
                <F label="Validade (opcional)">
                  <input
                    type="datetime-local"
                    className={adminInputClass}
                    value={toLocal(editing.expiresAt)}
                    onChange={(e) =>
                      setEditing({
                        ...editing,
                        expiresAt: e.target.value ? new Date(e.target.value).toISOString() : null,
                      })
                    }
                  />
                </F>
              </div>

              <F label="Limite de usos (vazio = sem limite)">
                <input
                  type="number"
                  className={adminInputClass}
                  value={editing.maxUses ?? ""}
                  onChange={(e) =>
                    setEditing({
                      ...editing,
                      maxUses: e.target.value ? parseInt(e.target.value) : null,
                    })
                  }
                />
              </F>

              <div className="grid gap-3 rounded-lg border border-border bg-background p-3 sm:grid-cols-2 sm:gap-4">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={!!editing.onePerCustomer}
                    onChange={(e) => setEditing({ ...editing, onePerCustomer: e.target.checked })}
                  />
                  Uso único por cliente
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={editing.active ?? true}
                    onChange={(e) => setEditing({ ...editing, active: e.target.checked })}
                  />
                  Ativo
                </label>
              </div>
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

function F({ label, children }: { label: string; children: React.ReactNode }) {
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
