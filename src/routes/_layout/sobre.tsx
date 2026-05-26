import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/_layout/sobre")({
  component: AboutPage,
  head: () => ({
    meta: [
      { title: "Sobre as japamalas — AuraLeve" },
      { name: "description", content: "Conheça a história e o significado das japamalas, e a filosofia da AuraLeve." },
    ],
  }),
});

function AboutPage() {
  return (
    <div className="aura-container py-16 max-w-3xl">
      <span className="aura-eyebrow">Nossa essência</span>
      <h1 className="font-display text-4xl text-primary mt-3 mb-6">
        A jornada das 108 contas
      </h1>
      <div className="prose prose-lg max-w-none text-muted-foreground space-y-5">
        <p>
          A japamala é um colar de oração com 108 contas, usado há milênios em
          tradições orientais para repetir mantras e sintonizar a mente com uma
          intenção. O número 108 tem múltiplas leituras sagradas — dos 108
          nomes do divino aos 108 pontos sutis do corpo.
        </p>
        <p>
          Na AuraLeve, cada peça nasce em silêncio. Escolhemos pedras naturais,
          fios consagrados e amarramos uma a uma, lentamente. É um trabalho de
          presença — pequeno ritual de quem faz para quem recebe.
        </p>
        <p>
          Mais do que um adorno, a japamala é uma âncora. Quando você sente as
          contas entre os dedos, lembra-se da intenção que escolheu. E aos poucos,
          a vibração se torna parte de quem você é.
        </p>
      </div>
      <div className="mt-10">
        <Link
          to="/catalogo"
          className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground"
        >
          Ver coleção
        </Link>
      </div>
    </div>
  );
}
