import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Field, AuraInputStyle } from "./login";

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
          "Limite temporario de envio de e-mails atingido. Tente novamente em alguns minutos.",
        );
      }
      return toast.error(error.message);
    }
    setSent(true);
    toast.success("Enviamos um link de redefinição para seu e-mail");
  };

  return (
    <div className="aura-container py-16 max-w-md mx-auto">
      <h1 className="aura-section-title text-center mb-8">Recuperar senha</h1>
      <form onSubmit={submit} className="rounded-2xl border border-border bg-card p-6 space-y-4">
        {sent ? (
          <p className="text-sm text-muted-foreground text-center">
            Se este e-mail existir em nosso sistema, você receberá um link em instantes.
          </p>
        ) : (
          <>
            <Field label="E-mail">
              <input
                className="aura-input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                maxLength={255}
              />
            </Field>
            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:opacity-95 disabled:opacity-50"
            >
              {submitting ? "Enviando..." : "Enviar link"}
            </button>
          </>
        )}
        <p className="text-xs text-center text-muted-foreground pt-2">
          <Link to="/login" className="text-primary hover:underline">
            Voltar ao login
          </Link>
        </p>
      </form>
      <AuraInputStyle />
    </div>
  );
}
