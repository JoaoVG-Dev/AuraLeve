import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Eye, Lock, Mail } from "lucide-react";
import { useEffect, useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { AuraLeveLogo, AuraLeveSymbol } from "@/components/AuraLeveLogo";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import heroBg from "@/assets/product-rosequartz.jpg";

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
    <AuthShell title="Bem-vinda de volta" subtitle="Entre na sua conta para continuar.">
      <form onSubmit={submit} className="space-y-4">
        <Field label="E-mail" icon={<Mail className="h-4 w-4" />}>
          <input
            className="aura-input pl-10"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="seu@email.com"
            required
            maxLength={255}
          />
        </Field>
        <Field label="Senha" icon={<Lock className="h-4 w-4" />}>
          <input
            className="aura-input pl-10 pr-10"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
            maxLength={72}
          />
          <Eye className="pointer-events-none absolute right-3 top-[2.55rem] h-4 w-4 text-muted-foreground" />
        </Field>
        <Link
          to="/recuperar-senha"
          className="block text-xs font-semibold text-primary hover:text-foreground"
        >
          Esqueci minha senha
        </Link>
        <button type="submit" disabled={submitting} className="aura-button w-full">
          {submitting ? "Entrando..." : "Entrar"}
        </button>
        <div className="flex items-center gap-3 py-1 text-xs text-muted-foreground">
          <span className="h-px flex-1 bg-border" />
          ou continue com
          <span className="h-px flex-1 bg-border" />
        </div>
        <div className="grid grid-cols-3 gap-2">
          {["WhatsApp", "Google", "Apple"].map((item) => (
            <button key={item} type="button" className="aura-button-outline min-h-10 px-3 py-2">
              {item[0]}
            </button>
          ))}
        </div>
        <p className="pt-2 text-center text-xs text-muted-foreground">
          Ainda não tem uma conta?{" "}
          <Link to="/cadastro" className="font-semibold text-primary hover:text-foreground">
            Criar conta
          </Link>
        </p>
      </form>
    </AuthShell>
  );
}

export function AuthShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="aura-container py-10 md:py-16">
      <div className="mx-auto grid max-w-5xl overflow-hidden rounded-lg border border-border bg-card shadow-[var(--shadow-card)] md:grid-cols-[1fr_1.05fr]">
        <div className="relative min-h-72 md:min-h-[560px]">
          <img
            src={heroBg}
            alt="Embalagem e acessórios AuraLeve"
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-foreground/26 to-transparent" />
          <div className="absolute left-6 top-6 rounded-lg bg-card/84 p-3 backdrop-blur">
            <AuraLeveLogo />
          </div>
        </div>
        <div className="relative flex items-center p-6 md:p-12">
          <AuraLeveSymbol className="aura-symbol-watermark absolute right-7 top-20 h-72" />
          <div className="relative w-full max-w-md">
            <h1 className="font-display text-4xl text-foreground md:text-5xl">{title}</h1>
            <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>
            <div className="mt-7">{children}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function Field({
  label,
  icon,
  children,
}: {
  label: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <label className="relative block">
      <span className="aura-label">{label}</span>
      {icon ? (
        <span className="pointer-events-none absolute left-3 top-[2.55rem] text-muted-foreground">
          {icon}
        </span>
      ) : null}
      {children}
    </label>
  );
}

export function AuraInputStyle() {
  return null;
}
