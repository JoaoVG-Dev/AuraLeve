import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Field, AuraInputStyle } from "./login";

export const Route = createFileRoute("/_layout/cadastro")({
  component: SignupPage,
});

const schema = z
  .object({
    fullName: z.string().trim().min(2, "Informe seu nome").max(100),
    email: z.string().trim().email("E-mail inválido").max(255),
    password: z.string().min(8, "Senha deve ter ao menos 8 caracteres").max(72),
    confirm: z.string(),
  })
  .refine((d) => d.password === d.confirm, { message: "Senhas não coincidem", path: ["confirm"] });

function SignupPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ fullName: "", email: "", password: "", confirm: "" });
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse(form);
    if (!parsed.success) return toast.error(parsed.error.issues[0].message);
    setSubmitting(true);
    const { error } = await supabase.auth.signUp({
      email: parsed.data.email,
      password: parsed.data.password,
      options: {
        data: { full_name: parsed.data.fullName },
        emailRedirectTo: `${window.location.origin}/`,
      },
    });
    setSubmitting(false);
    if (error) {
      if (error.message.toLowerCase().includes("rate limit")) {
        return toast.error(
          "Limite temporario de envio de e-mails atingido. Tente novamente em alguns minutos.",
        );
      }
      const msg = error.message.includes("already registered")
        ? "Este e-mail já está cadastrado"
        : error.message;
      return toast.error(msg);
    }
    toast.success("Conta criada! Bem-vinda à AuraLeve");
    navigate({ to: "/minha-conta" });
  };

  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <div className="aura-container py-16 max-w-md mx-auto">
      <h1 className="aura-section-title text-center mb-8">Criar conta</h1>
      <form onSubmit={submit} className="rounded-2xl border border-border bg-card p-6 space-y-4">
        <Field label="Nome completo">
          <input className="aura-input" value={form.fullName} onChange={(e) => set("fullName", e.target.value)} required maxLength={100} />
        </Field>
        <Field label="E-mail">
          <input className="aura-input" type="email" value={form.email} onChange={(e) => set("email", e.target.value)} required maxLength={255} />
        </Field>
        <Field label="Senha">
          <input className="aura-input" type="password" value={form.password} onChange={(e) => set("password", e.target.value)} required maxLength={72} />
        </Field>
        <Field label="Confirmar senha">
          <input className="aura-input" type="password" value={form.confirm} onChange={(e) => set("confirm", e.target.value)} required maxLength={72} />
        </Field>
        <button type="submit" disabled={submitting} className="w-full rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:opacity-95 disabled:opacity-50">
          {submitting ? "Criando..." : "Criar conta"}
        </button>
        <p className="text-xs text-center text-muted-foreground pt-2">
          Já tem conta? <Link to="/login" className="text-primary hover:underline">Entrar</Link>
        </p>
      </form>
      <AuraInputStyle />
    </div>
  );
}
