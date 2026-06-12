import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Lock } from "lucide-react";
import { useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { Field, AuthShell } from "./login";
import { resetPassword } from "@/lib/auth.functions";

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
  const resetPasswordServer = useServerFn(resetPassword);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse({ password, confirm });
    if (!parsed.success) return toast.error(parsed.error.issues[0].message);
    const token =
      typeof window === "undefined" ? "" : new URLSearchParams(window.location.search).get("token");
    if (!token) return toast.error("Link de redefinição inválido ou expirado");
    setSubmitting(true);
    try {
      await resetPasswordServer({ data: { token, password: parsed.data.password } });
      toast.success("Senha alterada com sucesso");
      navigate({ to: "/login" });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível alterar a senha");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthShell title="Defina sua nova senha" subtitle="Escolha uma nova senha para sua conta.">
      <form onSubmit={submit} className="space-y-4">
        <Field label="Nova senha" icon={<Lock className="h-4 w-4" />}>
          <input
            className="aura-input pl-10"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            maxLength={72}
          />
        </Field>
        <ul className="space-y-1 text-xs text-muted-foreground">
          <li>Mínimo de 8 caracteres</li>
          <li>Inclua letras e números</li>
          <li>Não utilize dados pessoais</li>
        </ul>
        <Field label="Confirmar nova senha" icon={<Lock className="h-4 w-4" />}>
          <input
            className="aura-input pl-10"
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
            maxLength={72}
          />
        </Field>
        <button type="submit" disabled={submitting} className="aura-button w-full">
          {submitting ? "Salvando..." : "Alterar senha"}
        </button>
        <p className="pt-2 text-center text-xs text-muted-foreground">
          <Link to="/login" className="font-semibold text-primary hover:text-foreground">
            Voltar para o login
          </Link>
        </p>
      </form>
    </AuthShell>
  );
}
