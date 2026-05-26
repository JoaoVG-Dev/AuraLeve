import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/_layout/login")({
  component: LoginPage,
});

const schema = z.object({
  email: z.string().trim().email("E-mail inválido").max(255),
  password: z.string().min(6, "Senha deve ter ao menos 6 caracteres").max(72),
});

function LoginPage() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && user) navigate({ to: "/minha-conta" });
  }, [user, loading, navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse({ email, password });
    if (!parsed.success) return toast.error(parsed.error.issues[0].message);
    setSubmitting(true);
    const { error } = await supabase.auth.signInWithPassword(parsed.data);
    setSubmitting(false);
    if (error) {
      const msg = error.message.includes("Invalid login")
        ? "E-mail ou senha incorretos"
        : error.message;
      return toast.error(msg);
    }
    toast.success("Bem-vinda de volta à AuraLeve");
    navigate({ to: "/minha-conta" });
  };

  return (
    <div className="aura-container py-16 max-w-md mx-auto">
      <h1 className="aura-section-title text-center mb-8">Entrar</h1>
      <form onSubmit={submit} className="rounded-2xl border border-border bg-card p-6 space-y-4">
        <Field label="E-mail">
          <input className="aura-input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required maxLength={255} />
        </Field>
        <Field label="Senha">
          <input className="aura-input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required maxLength={72} />
        </Field>
        <button type="submit" disabled={submitting} className="w-full rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:opacity-95 disabled:opacity-50">
          {submitting ? "Entrando..." : "Entrar"}
        </button>
        <div className="flex justify-between text-xs text-muted-foreground pt-2">
          <Link to="/recuperar-senha" className="hover:text-primary">Esqueci minha senha</Link>
          <Link to="/cadastro" className="hover:text-primary">Criar conta</Link>
        </div>
      </form>
      <AuraInputStyle />
    </div>
  );
}

export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-xs uppercase tracking-[0.18em] text-primary font-semibold mb-1.5">{label}</span>
      {children}
    </label>
  );
}

export function AuraInputStyle() {
  return (
    <style>{`
      .aura-input {
        width: 100%; border-radius: 0.75rem; border: 1px solid var(--color-border);
        background: var(--color-card); padding: 0.65rem 0.9rem; font-size: 0.875rem;
        color: var(--color-foreground); outline: none;
        transition: border-color .15s, box-shadow .15s;
      }
      .aura-input:focus {
        border-color: var(--color-primary);
        box-shadow: 0 0 0 3px color-mix(in oklab, var(--color-primary) 18%, transparent);
      }
    `}</style>
  );
}
