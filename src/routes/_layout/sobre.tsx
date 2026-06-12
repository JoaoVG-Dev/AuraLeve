import { createFileRoute, Link } from "@tanstack/react-router";
import { Gem, HandHeart, PackageCheck, Sparkles } from "lucide-react";
import { AuraLeveSymbol } from "@/components/AuraLeveLogo";
import heroBg from "@/assets/product-aventurine.jpg";
import roseImg from "@/assets/product-rosequartz.jpg";
import citrineImg from "@/assets/product-citrine.jpg";

export const Route = createFileRoute("/_layout/sobre")({
  component: AboutPage,
  head: () => ({
    meta: [
      { title: "Sobre — AuraLeve" },
      {
        name: "description",
        content:
          "Conheça a essência da AuraLeve: acessórios autorais com alma, pedras naturais, intenção e processo artesanal premium.",
      },
    ],
  }),
});

const pillars = [
  {
    icon: HandHeart,
    title: "Nossa essência",
    text: "Unimos design autoral, pedras naturais e símbolos sutis para criar acessórios que acompanham sua jornada.",
  },
  {
    icon: Sparkles,
    title: "Processo artesanal",
    text: "Cada peça passa por escolha consciente de materiais, montagem manual e acabamento cuidadoso.",
  },
  {
    icon: Gem,
    title: "Cristais e intenção",
    text: "Trabalhamos com pedras selecionadas, respeitando sua presença, origem e beleza natural.",
  },
];

function AboutPage() {
  return (
    <div>
      <section className="aura-container py-10 md:py-16">
        <div className="grid overflow-hidden rounded-lg border border-border bg-card shadow-[var(--shadow-card)] md:grid-cols-[0.9fr_1.1fr]">
          <div className="flex min-h-[380px] flex-col justify-center p-8 md:p-12">
            <span className="aura-eyebrow">Sobre a AuraLeve</span>
            <h1 className="mt-4 font-display text-4xl text-foreground md:text-6xl">
              Beleza com intenção para vestir todos os dias
            </h1>
            <div className="my-6 flex items-center gap-3 text-primary">
              <span className="h-px w-12 bg-border" />
              <Sparkles className="h-5 w-5" />
              <span className="h-px w-12 bg-border" />
            </div>
            <p className="max-w-xl text-muted-foreground">
              Acreditamos que a beleza ganha significado quando carrega presença. Por isso, criamos
              acessórios autorais que conectam estética, afeto, energia e propósito com sutileza.
            </p>
          </div>
          <div className="relative min-h-[360px]">
            <img
              src={heroBg}
              alt="Peças AuraLeve com cristais e acabamento artesanal"
              className="absolute inset-0 h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-card/40 to-transparent" />
          </div>
        </div>
      </section>

      <section className="aura-container pb-10 md:pb-16">
        <div className="grid gap-6 md:grid-cols-3">
          {pillars.map((pillar) => (
            <div key={pillar.title} className="aura-card p-6">
              <span className="mb-4 grid h-12 w-12 place-items-center rounded-md bg-champagne text-primary">
                <pillar.icon className="h-6 w-6" />
              </span>
              <h2 className="font-display text-2xl text-foreground">{pillar.title}</h2>
              <p className="mt-3 text-sm text-muted-foreground">{pillar.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-card/62 py-14 md:py-20">
        <div className="aura-container grid gap-10 md:grid-cols-[1.05fr_0.95fr] md:items-center">
          <div>
            <span className="aura-eyebrow">Feito com alma</span>
            <h2 className="aura-section-title mt-2">
              Criamos conexões com o que há de mais verdadeiro em você
            </h2>
            <p className="text-muted-foreground">
              A AuraLeve nasceu do desejo de transformar acessórios em lembretes diários de
              intenção. Uma pulseira pode lembrar proteção. Um colar pode marcar um novo ciclo. Um
              cristal pode trazer presença para a rotina. O significado não precisa ser exagerado:
              ele pode morar no detalhe.
            </p>
            <blockquote className="mt-8 border-l-2 border-primary pl-5 font-display text-2xl text-foreground">
              “Mais do que acessórios, criamos pequenas âncoras de presença.”
            </blockquote>
          </div>
          <div className="relative">
            <AuraLeveSymbol className="aura-symbol-watermark absolute -right-4 -top-8 h-40" />
            <img
              src={roseImg}
              alt="Colar delicado AuraLeve"
              className="relative h-[440px] w-full rounded-lg border border-border object-cover shadow-[var(--shadow-card)]"
            />
          </div>
        </div>
      </section>

      <section className="aura-container py-14 md:py-20">
        <div className="grid gap-8 md:grid-cols-[0.8fr_1.2fr] md:items-center">
          <img
            src={citrineImg}
            alt="Cristal natural em composição AuraLeve"
            className="h-80 w-full rounded-lg border border-border object-cover shadow-[var(--shadow-card)] md:h-[420px]"
          />
          <div>
            <span className="aura-eyebrow">Da escolha ao envio</span>
            <h2 className="aura-section-title mt-2">Detalhes pensados para chegar com cuidado</h2>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {[
                "Curadoria de pedras e componentes",
                "Produção artesanal em pequenas quantidades",
                "Conferência de acabamento e resistência",
                "Embalagem especial com intenção",
              ].map((item) => (
                <div key={item} className="flex gap-3 rounded-lg border border-border bg-card p-4">
                  <PackageCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                  <span className="text-sm text-muted-foreground">{item}</span>
                </div>
              ))}
            </div>
            <Link to="/catalogo" className="aura-button mt-8">
              Conheça as coleções
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
