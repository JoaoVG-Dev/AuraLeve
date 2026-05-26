import { createFileRoute, Link } from "@tanstack/react-router";
import { ProductCard } from "@/components/ProductCard";
import { useCategories, useProducts } from "@/lib/catalog";
import heroBg from "@/assets/hero-bg.jpg";
import { ArrowRight } from "lucide-react";

export const Route = createFileRoute("/_layout/")({
  component: HomePage,
  head: () => ({
    meta: [
      { title: "AuraLeve Japamalas — Joias espirituais artesanais" },
      {
        name: "description",
        content:
          "Descubra japamalas, pulseiras e colares feitos à mão com pedras naturais. Energia, intenção e elegância em cada conta.",
      },
    ],
  }),
});

function HomePage() {
  const { data: products = [] } = useProducts();
  const { data: categories = [] } = useCategories();
  const featured = products.filter((p) => p.featured).slice(0, 6);
  const promos = products.filter((p) => p.promo).slice(0, 3);

  return (
    <div>
      {/* HERO */}
      <section className="relative overflow-hidden">
        <img
          src={heroBg}
          alt=""
          aria-hidden
          className="absolute inset-0 h-full w-full object-cover opacity-60"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/50 via-background/40 to-background" />
        <div className="relative aura-container py-14 text-center sm:py-20 md:py-36">
          <span className="aura-eyebrow">Feito à mão · 108 contas</span>
          <h1 className="mt-3 font-display text-3xl text-primary text-balance sm:mt-4 sm:text-4xl md:text-6xl">
            Cada conta carrega
            <br />
            uma intenção sagrada
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-sm text-muted-foreground sm:mt-6 sm:text-base">
            Japamalas e joias espirituais criadas com pedras naturais, fios consagrados e o tempo
            lento do artesanato.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3 sm:mt-8">
            <Link
              to="/catalogo"
              className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground shadow-[var(--shadow-aura)] hover:opacity-95 transition"
            >
              Explorar catálogo <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/sobre"
              className="inline-flex items-center gap-2 rounded-full border border-border bg-card/80 backdrop-blur px-6 py-3 text-sm font-medium text-foreground hover:border-primary hover:text-primary transition"
            >
              O que é uma japamala?
            </Link>
          </div>
        </div>
      </section>

      {/* INSTITUTIONAL */}
      <section className="aura-container grid gap-6 py-10 sm:grid-cols-3 md:gap-8 md:py-16">
        {[
          { title: "Artesanal", desc: "Cada peça é feita à mão, conta a conta." },
          {
            title: "Pedras naturais",
            desc: "Selecionadas e consagradas com intenção.",
          },
          {
            title: "Feito com afeto",
            desc: "Embalagem ritual e dedicatória personalizada.",
          },
        ].map((v) => (
          <div key={v.title} className="border-t border-border/70 pt-4 text-center sm:text-left">
            <h3 className="text-base font-semibold mb-1">{v.title}</h3>
            <p className="text-sm text-muted-foreground sm:max-w-xs">{v.desc}</p>
          </div>
        ))}
      </section>

      {/* FEATURED */}
      <section className="aura-container py-8 md:py-12">
        <div className="mb-6 text-center md:mb-10">
          <span className="aura-eyebrow">Coleção</span>
          <h2 className="aura-section-title mt-2">Destaques da casa</h2>
          <p className="mx-auto max-w-md text-sm text-muted-foreground sm:text-base">
            Peças escolhidas para esta lua, cada uma com sua vibração única.
          </p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {featured.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>

      {/* PROMOS */}
      {promos.length > 0 && (
        <section className="aura-container py-8 md:py-12">
          <div className="mb-6 text-center md:mb-10">
            <span className="aura-eyebrow text-gold">Promoções</span>
            <h2 className="aura-section-title mt-2">Em oferta</h2>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3 md:gap-6">
            {promos.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}

      {/* CATEGORIES */}
      <section className="aura-container py-10 md:py-16">
        <div className="mb-6 text-center md:mb-10">
          <span className="aura-eyebrow">Por categoria</span>
          <h2 className="aura-section-title mt-2">Encontre seu caminho</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {categories.map((c) => (
            <Link
              key={c.id}
              to="/catalogo"
              search={{ categoria: c.slug }}
              className="group rounded-2xl border border-border bg-card p-5 text-center transition hover:border-primary hover:shadow-[var(--shadow-aura)] md:p-8"
            >
              <h3 className="font-display text-xl text-primary uppercase tracking-[0.12em]">
                {c.name}
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">{c.description}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* ABOUT */}
      <section className="relative my-10 overflow-hidden md:my-16">
        <div className="absolute inset-0 bg-[var(--gradient-aura)]" />
        <div className="relative aura-container py-12 text-center text-primary-foreground md:py-20">
          <span className="font-display text-xs uppercase tracking-[0.32em] opacity-80">
            Tradição milenar
          </span>
          <h2 className="mb-3 mt-3 font-display text-2xl md:mb-4 md:mt-4 md:text-4xl">
            Sobre as Japamalas
          </h2>
          <p className="mx-auto max-w-2xl text-sm opacity-90 sm:text-base">
            Uma japamala é um colar de oração com 108 contas, usado há milênios em meditação para
            repetir mantras e sintonizar a mente. Mais que um adorno, é uma ferramenta sagrada de
            presença.
          </p>
          <Link
            to="/sobre"
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-card px-6 py-3 text-sm font-medium text-primary transition hover:bg-card/90 md:mt-8"
          >
            Ler mais <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <FAQ />

      <section className="aura-container py-12 text-center md:py-20">
        <h2 className="aura-section-title">Quer ajuda para escolher?</h2>
        <p className="mx-auto mb-5 max-w-md text-sm text-muted-foreground sm:mb-6 sm:text-base">
          Conte-nos sua intenção e indicamos a peça que mais ressoa com você.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <a
            href={`https://wa.me/5511999990000?text=Olá! Quero ajuda para escolher minha japamala.`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:opacity-95"
          >
            Falar no WhatsApp
          </a>
          <a
            href="https://instagram.com/auraleve.japamalas"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-6 py-3 text-sm font-medium hover:border-primary hover:text-primary"
          >
            Seguir no Instagram
          </a>
        </div>
      </section>
    </div>
  );
}

const faqs = [
  {
    q: "Como escolho a pedra certa para mim?",
    a: "Comece pela intenção: proteção, amor, prosperidade, intuição. Cada pedra ressoa com uma frequência. No catálogo, você pode filtrar por energia.",
  },
  {
    q: "As japamalas são consagradas?",
    a: "Sim. Cada peça é montada em silêncio meditativo e passa por um ritual breve de limpeza energética antes do envio.",
  },
  {
    q: "Como cuidar da minha japamala?",
    a: "Evite contato com perfumes e água. Para limpar a energia, deixe a peça sob a luz da lua cheia ou em um leito de sal grosso por algumas horas.",
  },
  {
    q: "Vocês fazem peças sob encomenda?",
    a: "Fazemos. Fale com a gente no WhatsApp para criarmos uma japamala personalizada, alinhada à sua jornada.",
  },
];

function FAQ() {
  return (
    <section className="aura-container py-10 md:py-16">
      <div className="mb-6 text-center md:mb-10">
        <span className="aura-eyebrow">Perguntas frequentes</span>
        <h2 className="aura-section-title mt-2">Para acalmar a mente</h2>
      </div>
      <div className="max-w-2xl mx-auto space-y-3">
        {faqs.map((f, i) => (
          <details
            key={i}
            className="group rounded-xl border border-border bg-card p-4 transition open:shadow-[var(--shadow-card)] md:p-5"
          >
            <summary className="cursor-pointer list-none flex items-center justify-between text-sm font-semibold text-foreground">
              {f.q}
              <span className="ml-4 text-primary transition-transform group-open:rotate-45">+</span>
            </summary>
            <p className="mt-3 text-sm text-muted-foreground">{f.a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
