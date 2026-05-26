import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Field, AuraInputStyle } from "./login";

export const Route = createFileRoute("/_layout/reset-password")({
  component: ResetPage,
});

const schema = z
  .object({
    password: z.string().min(8, "Senha deve ter ao menos 8 caracteres").max(72),
    confirm: z.string(),
  })
  .refine((d) => d.password === d.confirm, { message: "Senhas não coincidem", path: ["confirm"] });

function ResetPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse({ password, confirm });
    if (!parsed.success) return toast.error(parsed.error.issues[0].message);
    setSubmitting(true);
    const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
    setSubmitting(false);
    if (error) return toast.error(error.message);
    toast.success("Senha alterada com sucesso");
    navigate({ to: "/minha-conta" });
  };

  return (
    <div className="aura-container py-16 max-w-md mx-auto">
      <h1 className="aura-section-title text-center mb-8">Nova senha</h1>
      <form onSubmit={submit} className="rounded-2xl border border-border bg-card p-6 space-y-4">
        <Field label="Nova senha">
          <input className="aura-input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required maxLength={72} />
        </Field>
        <Field label="Confirmar nova senha">
          <input className="aura-input" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required maxLength={72} />
        </Field>
        <button type="submit" disabled={submitting} className="w-full rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:opacity-95 disabled:opacity-50">
          {submitting ? "Salvando..." : "Salvar nova senha"}
        </button>
      </form>
      <AuraInputStyle />
    </div>
  );
}
