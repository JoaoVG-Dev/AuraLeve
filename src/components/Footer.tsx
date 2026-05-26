import { Link } from "@tanstack/react-router";
import { Instagram, MessageCircle } from "lucide-react";
import { INSTAGRAM, WHATSAPP } from "@/lib/store";

export function Footer() {
  return (
    <footer className="mt-12 border-t border-border bg-card md:mt-24">
      <div className="aura-container grid gap-8 py-10 md:grid-cols-3 md:gap-10 md:py-14">
        <div>
          <div className="mb-3">
            <span className="font-display text-lg uppercase tracking-[0.18em] text-primary">
              AuraLeve
            </span>
          </div>
          <p className="text-sm text-muted-foreground max-w-xs">
            Japamalas e joias espirituais feitas à mão, com pedras naturais e intenção amorosa em
            cada conta.
          </p>
        </div>

        <div>
          <h4 className="text-sm font-semibold text-foreground mb-3">Navegar</h4>
          <ul className="space-y-2 text-sm">
            <li>
              <Link to="/catalogo" className="text-muted-foreground hover:text-primary">
                Catálogo
              </Link>
            </li>
            <li>
              <Link to="/sobre" className="text-muted-foreground hover:text-primary">
                Sobre as japamalas
              </Link>
            </li>
            <li>
              <Link to="/carrinho" className="text-muted-foreground hover:text-primary">
                Carrinho
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="text-sm font-semibold text-foreground mb-3">Conecte-se</h4>
          <div className="flex gap-3">
            <a
              href={`https://wa.me/${WHATSAPP}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-accent text-primary hover:bg-primary hover:text-primary-foreground transition"
              aria-label="WhatsApp"
            >
              <MessageCircle className="h-4 w-4" />
            </a>
            <a
              href={INSTAGRAM}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-accent text-primary hover:bg-primary hover:text-primary-foreground transition"
              aria-label="Instagram"
            >
              <Instagram className="h-4 w-4" />
            </a>
          </div>
        </div>
      </div>
      <div className="border-t border-border">
        <div className="aura-container py-5 text-xs text-muted-foreground text-center">
          © {new Date().getFullYear()} AuraLeve Japamalas — feito com intenção.
        </div>
      </div>
    </footer>
  );
}
