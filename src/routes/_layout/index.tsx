import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Gem,
  HandHeart,
  Heart,
  HelpCircle,
  PackageCheck,
  Shield,
  Sparkles,
  Wand2,
} from "lucide-react";
import { AuraLeveSymbol } from "@/components/AuraLeveLogo";
import { ProductCard } from "@/components/ProductCard";
import { useEnergies, useProducts } from "@/lib/catalog";
import citrineImg from "@/assets/product-citrine.jpg";
import onyxImg from "@/assets/product-onyx.jpg";
import roseImg from "@/assets/product-rosequartz.jpg";

export const Route = createFileRoute("/_layout/")({
  component: HomePage,
  head: () => ({
    meta: [
      { title: "AuraLeve — Acessórios Autorais" },
      {
        name: "description",
        content:
          "Acessórios com alma para vestir intenção. Colares, pulseiras, patuás, japamalas, cristais e peças autorais com significado.",
      },
    ],
  }),
});

const universe = [
  { label: "Colares", icon: Heart, q: "colar" },
  { label: "Pulseiras", icon: Sparkles, q: "pulseira" },
  { label: "Patuás", icon: Shield, q: "patuá" },
  { label: "Japamalas", icon: Wand2, q: "japamala" },
  { label: "Fio de 7 nós", icon: HandHeart, q: "fio de 7 nós" },
  { label: "Cristais", icon: Gem, q: "cristal" },
];

const collectionCards = [
  {
    title: "Essência",
    subtitle: "Conecte-se",
    image: roseImg,
    q: "amor",
  },
  {
    title: "Proteção",
    subtitle: "Amuletos",
    image: onyxImg,
    q: "proteção",
  },
  {
    title: "Equilíbrio",
    subtitle: "Harmonize",
    image: citrineImg,
    q: "equilíbrio",
  },
];

function HomePage() {
  const { data: products = [] } = useProducts();
  const { data: energies = [] } = useEnergies();
  const featured = products.filter((p) => p.featured).slice(0, 8);
  const promo = products.filter((p) => p.promo).slice(0, 4);
  const energyList = energies.slice(0, 6);

  return (
    <div>
      <section className="relative min-h-[620px] overflow-hidden border-b border-border md:min-h-[660px]">
        <img
          src={citrineImg}
          alt="Acessórios AuraLeve com cristais, pedras naturais e acabamento dourado"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/78 to-background/18" />
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-background to-transparent" />
        <div className="relative aura-container flex min-h-[620px] items-center py-16 md:min-h-[660px]">
          <div className="max-w-xl">
            <AuraLeveSymbol className="mb-6 h-24 text-primary" />
            <span className="aura-eyebrow">AuraLeve Acessórios Autorais</span>
            <h1 className="mt-4 font-display text-5xl text-foreground md:text-7xl">
              Acessórios com alma e significado
            </h1>
            <p className="mt-5 max-w-md text-base text-muted-foreground md:text-lg">
              Peças autorais que conectam beleza, intenção e energia no seu dia a dia.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/catalogo" className="aura-button">
                Conheça as coleções <ArrowRight className="h-4 w-4" />
              </Link>
              <Link to="/catalogo" search={{ q: "proteção" }} className="aura-button-outline">
                Escolha sua intenção
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-border bg-card/58">
        <div className="aura-container grid grid-cols-2 gap-0 md:grid-cols-6">
          {universe.map((item) => (
            <Link
              key={item.label}
              to="/catalogo"
              search={{ q: item.q }}
              className="group flex min-h-28 flex-col items-center justify-center border-r border-border/70 px-3 py-5 text-center last:border-r-0 hover:bg-champagne/40"
            >
              <item.icon className="mb-3 h-7 w-7 text-primary transition group-hover:-translate-y-1" />
              <span className="text-xs font-semibold uppercase text-foreground">{item.label}</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="aura-container py-14 md:py-20">
        <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <span className="aura-eyebrow">Coleções em destaque</span>
            <h2 className="aura-section-title mt-2">Escolha pelo que deseja sentir</h2>
          </div>
          <Link to="/catalogo" className="text-sm font-semibold text-primary hover:text-foreground">
            Ver todas
          </Link>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {collectionCards.map((card) => (
            <Link
              key={card.title}
              to="/catalogo"
              search={{ q: card.q }}
              className="group relative min-h-64 overflow-hidden rounded-lg border border-border bg-card shadow-[var(--shadow-card)]"
            >
              <img
                src={card.image}
                alt=""
                className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-foreground/58 via-foreground/14 to-transparent" />
              <div className="absolute bottom-0 left-0 p-6 text-card">
                <h3 className="font-display text-3xl">{card.title}</h3>
                <p className="text-xs font-semibold uppercase">{card.subtitle}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {featured.length > 0 && (
        <section className="aura-container py-8 md:py-14">
          <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <span className="aura-eyebrow">Produtos em destaque</span>
              <h2 className="aura-section-title mt-2">Peças para acompanhar sua presença</h2>
            </div>
            <Link
              to="/catalogo"
              className="text-sm font-semibold text-primary hover:text-foreground"
            >
              Ver catálogo
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {featured.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}

      <section className="my-10 bg-card/62 py-14 md:my-16 md:py-20">
        <div className="aura-container grid gap-10 md:grid-cols-[0.9fr_1.1fr] md:items-center">
          <div>
            <span className="aura-eyebrow">Sobre a AuraLeve</span>
            <h2 className="aura-section-title mt-2">
              Beleza que ganha significado quando carrega intenção
            </h2>
            <p className="text-muted-foreground">
              Unimos design autoral, pedras naturais e símbolos sutis para criar acessórios que
              acompanham sua jornada com presença. Cada peça é pensada para ser bonita, comercial,
              delicada e cheia de propósito.
            </p>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {[
                "Escolha consciente de materiais",
                "Montagem manual",
                "Acabamento premium",
                "Embalagem especial",
              ].map((item) => (
                <div key={item} className="flex items-center gap-2 text-sm text-foreground">
                  <Sparkles className="h-4 w-4 text-primary" />
                  {item}
                </div>
              ))}
            </div>
            <Link to="/sobre" className="aura-button mt-8">
              Conheça a essência
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <img
              src={roseImg}
              alt="Colar artesanal AuraLeve"
              className="h-72 w-full rounded-lg border border-border object-cover shadow-[var(--shadow-card)]"
            />
            <img
              src={citrineImg}
              alt="Cristal natural AuraLeve"
              className="mt-10 h-72 w-full rounded-lg border border-border object-cover shadow-[var(--shadow-card)]"
            />
          </div>
        </div>
      </section>

      {energyList.length > 0 && (
        <section className="aura-container py-10 md:py-16">
          <div className="mb-8 text-center">
            <span className="aura-eyebrow">Energia / intenção</span>
            <h2 className="aura-section-title mt-2">Filtre pelo seu momento</h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {energyList.map((energy) => (
              <Link
                key={energy.id}
                to="/catalogo"
                search={{ energia: energy.slug }}
                className="aura-card flex items-start gap-4 p-5 transition hover:-translate-y-1 hover:border-primary"
              >
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-md bg-champagne text-primary">
                  <Sparkles className="h-5 w-5" />
                </span>
                <span>
                  <strong className="block text-sm text-foreground">{energy.name}</strong>
                  <span className="text-sm text-muted-foreground">
                    {energy.description || "Uma curadoria para vestir propósito no cotidiano."}
                  </span>
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {promo.length > 0 && (
        <section className="aura-container py-10 md:py-16">
          <div className="mb-8 text-center">
            <span className="aura-eyebrow">Oferta com propósito</span>
            <h2 className="aura-section-title mt-2">Escolhas especiais</h2>
          </div>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {promo.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}

      <section className="aura-container py-10 md:py-16">
        <div className="grid gap-4 md:grid-cols-3">
          {[
            {
              icon: Sparkles,
              title: "Energia e intenção",
              text: "Cada peça nasce para harmonizar e transformar.",
            },
            {
              icon: Gem,
              title: "Pedras naturais",
              text: "Selecionadas com cuidado, respeitando origem e presença.",
            },
            {
              icon: PackageCheck,
              title: "Presente com alma",
              text: "Embalagem especial, pronta para encantar.",
            },
          ].map((item) => (
            <div key={item.title} className="aura-card p-6">
              <item.icon className="mb-4 h-8 w-8 text-primary" />
              <h3 className="font-display text-2xl text-foreground">{item.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{item.text}</p>
            </div>
          ))}
        </div>
      </section>

      <FAQ />

      <section className="aura-container pb-16 pt-8 text-center md:pb-24">
        <h2 className="aura-section-title">Quer ajuda para escolher?</h2>
        <p className="mx-auto mb-6 max-w-md text-sm text-muted-foreground md:text-base">
          Conte sua intenção e indicamos uma peça alinhada ao seu momento.
        </p>
        <Link to="/catalogo" className="aura-button">
          Começar pelo catálogo
        </Link>
      </section>
    </div>
  );
}

const faqs = [
  {
    q: "Como escolho a peça certa para mim?",
    a: "Comece pela intenção: proteção, amor, equilíbrio, coragem ou presença. No catálogo, você pode filtrar por energia e encontrar uma peça que converse com seu momento.",
  },
  {
    q: "A AuraLeve vende apenas japamalas?",
    a: "Não. As japamalas continuam no nosso universo, mas a AuraLeve reúne acessórios autorais, colares, pulseiras, patuás, fios de 7 nós, cristais e presentes com significado.",
  },
  {
    q: "As pedras são naturais?",
    a: "Trabalhamos com pedras naturais selecionadas e componentes de acabamento premium. As informações de cada peça aparecem na página do produto sempre que disponíveis.",
  },
  {
    q: "Posso presentear alguém?",
    a: "Sim. As peças são enviadas em embalagem especial e você pode escolher acessórios que representem proteção, afeto, gratidão ou novos ciclos.",
  },
];

function FAQ() {
  return (
    <section className="aura-container py-10 md:py-16">
      <div className="mb-8 text-center">
        <span className="aura-eyebrow">Perguntas frequentes</span>
        <h2 className="aura-section-title mt-2">Detalhes que importam</h2>
      </div>
      <div className="mx-auto max-w-3xl space-y-3">
        {faqs.map((f) => (
          <details key={f.q} className="group aura-card p-5">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-left text-sm font-semibold text-foreground">
              <span className="inline-flex items-center gap-3">
                <HelpCircle className="h-4 w-4 text-primary" />
                {f.q}
              </span>
              <span className="text-primary transition-transform group-open:rotate-45">+</span>
            </summary>
            <p className="mt-4 text-sm text-muted-foreground">{f.a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
