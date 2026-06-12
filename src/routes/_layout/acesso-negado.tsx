import { createFileRoute, Link } from "@tanstack/react-router";
import { LockKeyhole, MessageCircle } from "lucide-react";
import { AuraLeveSymbol } from "@/components/AuraLeveLogo";

export const Route = createFileRoute("/_layout/acesso-negado")({
  component: AccessDeniedPage,
});

function AccessDeniedPage() {
  return (
    <div className="aura-container py-16 md:py-24">
      <div className="aura-card relative mx-auto max-w-3xl overflow-hidden p-8 text-center md:p-12">
        <AuraLeveSymbol className="aura-symbol-watermark absolute left-8 top-8 h-40" />
        <div className="relative">
          <span className="mx-auto mb-6 grid h-24 w-24 place-items-center rounded-full border border-primary/40 bg-champagne text-primary">
            <LockKeyhole className="h-10 w-10" />
          </span>
          <h1 className="font-display text-4xl text-foreground md:text-6xl">Acesso negado</h1>
          <p className="mx-auto mt-4 max-w-md text-muted-foreground">
            Você não tem permissão para acessar esta área. Verifique suas credenciais ou entre em
            contato com nosso atendimento.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link to="/minha-conta" className="aura-button">
              Voltar para minha conta
            </Link>
            <Link to="/sobre" className="aura-button-outline">
              <MessageCircle className="h-4 w-4" />
              Fale conosco
            </Link>
          </div>
          <div className="mx-auto mt-10 max-w-md rounded-lg bg-champagne/55 p-5 text-sm text-muted-foreground">
            Aqui, cada detalhe é protegido com o mesmo carinho que colocamos em nossas criações.
          </div>
        </div>
      </div>
    </div>
  );
}
