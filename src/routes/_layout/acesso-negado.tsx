import { createFileRoute, Link } from "@tanstack/react-router";
import { ShieldAlert } from "lucide-react";

export const Route = createFileRoute("/_layout/acesso-negado")({
  component: () => (
    <div className="aura-container py-24 text-center max-w-md mx-auto">
      <ShieldAlert className="h-14 w-14 text-primary mx-auto mb-4" />
      <h1 className="aura-section-title">Acesso negado</h1>
      <p className="text-muted-foreground mb-6">
        Esta área é restrita a administradores da AuraLeve.
      </p>
      <Link
        to="/"
        className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground"
      >
        Voltar à home
      </Link>
    </div>
  ),
});
