import { Link } from "@tanstack/react-router";
import { Instagram, MessageCircle, PackageCheck, ShieldCheck, Sparkles, Truck } from "lucide-react";
import { AuraLeveLogo, AuraLeveSymbol } from "@/components/AuraLeveLogo";
import { INSTAGRAM, WHATSAPP } from "@/lib/store";

const benefits = [
  { icon: Sparkles, title: "Energia e intenção", text: "Peças com propósito e significado." },
  {
    icon: ShieldCheck,
    title: "Pedras naturais",
    text: "Curadoria cuidadosa e acabamento premium.",
  },
  {
    icon: PackageCheck,
    title: "Feito com alma",
    text: "Produção artesanal em pequenas quantidades.",
  },
  { icon: Truck, title: "Frete com carinho", text: "Envio para todo o Brasil." },
];

export function Footer() {
  return (
    <footer className="mt-14 border-t border-border bg-card/78 md:mt-24">
      <div className="aura-container grid gap-3 py-6 md:grid-cols-4">
        {benefits.map((item) => (
          <div
            key={item.title}
            className="flex items-center gap-3 border-b border-border/70 pb-3 md:border-b-0 md:border-r md:pb-0 last:md:border-r-0"
          >
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-champagne text-primary">
              <item.icon className="h-5 w-5" />
            </span>
            <div>
              <p className="text-sm font-semibold text-foreground">{item.title}</p>
              <p className="text-xs text-muted-foreground">{item.text}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="border-t border-border/70">
        <div className="aura-container grid gap-10 py-10 md:grid-cols-[1.4fr_0.9fr_0.9fr] md:py-14">
          <div>
            <AuraLeveLogo />
            <p className="mt-4 max-w-sm text-sm text-muted-foreground">
              Acessórios autorais com alma para vestir intenção. Criamos colares, pulseiras, patuás,
              japamalas, fios de 7 nós e cristais para acompanhar presença, beleza e propósito.
            </p>
          </div>

          <div>
            <h4 className="mb-3 text-sm font-semibold text-foreground">Navegar</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/catalogo" className="text-muted-foreground hover:text-primary">
                  Catálogo
                </Link>
              </li>
              <li>
                <Link to="/sobre" className="text-muted-foreground hover:text-primary">
                  Sobre a AuraLeve
                </Link>
              </li>
              <li>
                <Link to="/carrinho" className="text-muted-foreground hover:text-primary">
                  Carrinho
                </Link>
              </li>
              <li>
                <Link to="/minha-conta" className="text-muted-foreground hover:text-primary">
                  Minha conta
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="mb-3 text-sm font-semibold text-foreground">Atendimento</h4>
            <p className="mb-4 text-sm text-muted-foreground">
              Quer escolher por intenção? Fale com a gente.
            </p>
            <div className="flex gap-3">
              <a
                href={`https://wa.me/${WHATSAPP}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-10 w-10 items-center justify-center rounded-md bg-champagne text-primary transition hover:bg-primary hover:text-primary-foreground"
                aria-label="WhatsApp"
              >
                <MessageCircle className="h-4 w-4" />
              </a>
              <a
                href={INSTAGRAM}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-10 w-10 items-center justify-center rounded-md bg-champagne text-primary transition hover:bg-primary hover:text-primary-foreground"
                aria-label="Instagram"
              >
                <Instagram className="h-4 w-4" />
              </a>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-border/70">
        <div className="aura-container flex flex-col items-center justify-between gap-3 py-5 text-xs text-muted-foreground md:flex-row">
          <span>© {new Date().getFullYear()} AuraLeve — Acessórios Autorais.</span>
          <span className="inline-flex items-center gap-2 text-primary">
            <AuraLeveSymbol className="h-6" />
            Feito com alma, entregue com amor.
          </span>
        </div>
      </div>
    </footer>
  );
}
