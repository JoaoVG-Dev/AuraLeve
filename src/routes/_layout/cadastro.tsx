import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Lock, Mail, User } from "lucide-react";
import { useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { Field, AuthShell } from "./login";
import { supabase } from "@/integrations/supabase/client";

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
          "Limite temporário de envio de e-mails atingido. Tente novamente em alguns minutos.",
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
    <AuthShell title="Crie sua conta" subtitle="Preencha seus dados para começar.">
      <form onSubmit={submit} className="space-y-4">
        <Field label="Nome completo" icon={<User className="h-4 w-4" />}>
          <input
            className="aura-input pl-10"
            value={form.fullName}
            onChange={(e) => set("fullName", e.target.value)}
            placeholder="Seu nome completo"
            required
            maxLength={100}
          />
        </Field>
        <Field label="E-mail" icon={<Mail className="h-4 w-4" />}>
          <input
            className="aura-input pl-10"
            type="email"
            value={form.email}
            onChange={(e) => set("email", e.target.value)}
            placeholder="seu@email.com"
            required
            maxLength={255}
          />
        </Field>
        <Field label="Senha" icon={<Lock className="h-4 w-4" />}>
          <input
            className="aura-input pl-10"
            type="password"
            value={form.password}
            onChange={(e) => set("password", e.target.value)}
            placeholder="Crie uma senha"
            required
            maxLength={72}
          />
        </Field>
        <Field label="Confirmar senha" icon={<Lock className="h-4 w-4" />}>
          <input
            className="aura-input pl-10"
            type="password"
            value={form.confirm}
            onChange={(e) => set("confirm", e.target.value)}
            placeholder="Confirme sua senha"
            required
            maxLength={72}
          />
        </Field>
        <label className="flex items-start gap-2 text-xs text-muted-foreground">
          <input type="checkbox" required className="mt-0.5 accent-[var(--color-primary)]" />
          Li e concordo com os Termos de Uso e Política de Privacidade.
        </label>
        <button type="submit" disabled={submitting} className="aura-button w-full">
          {submitting ? "Criando..." : "Criar conta"}
        </button>
        <p className="pt-2 text-center text-xs text-muted-foreground">
          Já tem uma conta?{" "}
          <Link to="/login" className="font-semibold text-primary hover:text-foreground">
            Entrar
          </Link>
        </p>
      </form>
    </AuthShell>
  );
}
