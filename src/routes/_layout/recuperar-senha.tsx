import { createFileRoute, Link } from "@tanstack/react-router";
import { Mail } from "lucide-react";
import { useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { Field, AuthShell } from "./login";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_layout/recuperar-senha")({
  component: ForgotPage,
});

const schema = z.object({ email: z.string().trim().email("E-mail inválido").max(255) });

function ForgotPage() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse({ email });
    if (!parsed.success) return toast.error(parsed.error.issues[0].message);
    setSubmitting(true);
    const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setSubmitting(false);
    if (error) {
      if (error.message.toLowerCase().includes("rate limit")) {
        return toast.error(
          "Limite temporário de envio de e-mails atingido. Tente novamente em alguns minutos.",
        );
      }
      return toast.error(error.message);
    }
    setSent(true);
    toast.success("Enviamos um link de redefinição para seu e-mail");
  };

  return (
    <AuthShell
      title="Recuperar senha"
      subtitle="Informe seu e-mail para receber o link de recuperação."
    >
      <form onSubmit={submit} className="space-y-4">
        {sent ? (
          <p className="rounded-lg border border-border bg-champagne/45 p-4 text-center text-sm text-muted-foreground">
            Se este e-mail existir em nosso sistema, você receberá um link em instantes.
          </p>
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
