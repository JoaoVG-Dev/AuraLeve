import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Mail } from "lucide-react";
import { useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { Field, AuthShell } from "./login";
import { requestPasswordReset } from "@/lib/auth.functions";

export const Route = createFileRoute("/_layout/recuperar-senha")({
  component: ForgotPage,
});

const schema = z.object({ email: z.string().trim().email("E-mail inválido").max(255) });

function ForgotPage() {
  const requestReset = useServerFn(requestPasswordReset);
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [localResetLink, setLocalResetLink] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse({ email });
    if (!parsed.success) return toast.error(parsed.error.issues[0].message);
    setSubmitting(true);
    try {
      const result = await requestReset({ data: parsed.data });
      if (result.resetToken && typeof window !== "undefined") {
        setLocalResetLink(`${window.location.origin}/reset-password?token=${result.resetToken}`);
      }
      setSent(true);
      toast.success("Se este e-mail existir, um link de redefinição será gerado");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Não foi possível iniciar a recuperação",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthShell
      title="Recuperar senha"
      subtitle="Informe seu e-mail para receber o link de recuperação."
    >
      <form onSubmit={submit} className="space-y-4">
        {sent ? (
          <div className="space-y-3">
            <p className="rounded-lg border border-border bg-champagne/45 p-4 text-center text-sm text-muted-foreground">
              Se este e-mail existir em nosso sistema, você receberá um link em instantes.
            </p>
            {localResetLink ? (
              <a
                href={localResetLink}
                className="block break-all rounded-lg border border-border bg-card p-4 text-xs font-semibold text-primary hover:text-foreground"
              >
                Link local de redefinição: {localResetLink}
              </a>
            ) : null}
          </div>
        ) : (
          <>
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
            <button type="submit" disabled={submitting} className="aura-button w-full">
              {submitting ? "Enviando..." : "Enviar link de recuperação"}
            </button>
          </>
        )}
        <p className="pt-2 text-center text-xs text-muted-foreground">
          <Link to="/login" className="font-semibold text-primary hover:text-foreground">
            Voltar para o login
          </Link>
        </p>
      </form>
    </AuthShell>
  );
}
