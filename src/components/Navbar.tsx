import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  Heart,
  LayoutDashboard,
  LogOut,
  Menu,
  Search,
  ShoppingBag,
  User as UserIcon,
  X,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { AuraLeveLogo } from "@/components/AuraLeveLogo";
import { useAuth, signOut } from "@/hooks/use-auth";
import { useShop } from "@/lib/store";
import { cn } from "@/lib/utils";

export function Navbar() {
  const [open, setOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const cart = useShop((s) => s.cart);
  const count = cart.reduce((a, c) => a + c.quantity, 0);
  const path = useRouterState({ select: (r) => r.location.pathname });
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();

  const links = [
    { to: "/", label: "Início" },
    { to: "/catalogo", label: "Catálogo" },
    { to: "/sobre", label: "Sobre" },
    ...(isAdmin ? [{ to: "/admin", label: "Admin" }] : []),
  ];

  const handleLogout = async () => {
    await signOut();
    setMenuOpen(false);
    toast.success("Você saiu da conta");
    navigate({ to: "/" });
  };

  return (
    <header className="sticky top-0 z-50 border-b border-border/80 bg-card/88 shadow-[0_10px_30px_-28px_rgb(59_42_30_/_0.65)] backdrop-blur-xl">
      <div className="border-b border-border/60 bg-champagne/42">
        <div className="aura-container flex h-7 items-center justify-center text-[0.68rem] font-semibold uppercase text-primary">
          Frete grátis acima de R$199 <span className="mx-3 text-border">|</span> 10% off na
          primeira compra
        </div>
      </div>

      <div className="aura-container flex h-[4.5rem] items-center justify-between gap-4 py-3">
        <Link to="/" className="group flex shrink-0 items-center" aria-label="AuraLeve início">
          <AuraLeveLogo className="transition-opacity group-hover:opacity-90" />
        </Link>

        <nav className="hidden items-center gap-1 lg:flex">
          {links.map((l, index) => {
            const active =
              l.to === "/"
                ? path === "/"
                : l.label === "Admin"
                  ? path.startsWith("/admin")
                  : path === l.to;
            return (
              <Link
                key={`${l.label}-${index}`}
                to={l.to}
                className={cn(
                  "rounded-md px-3 py-2 text-[0.72rem] font-semibold uppercase text-muted-foreground transition",
                  active ? "bg-champagne text-primary" : "hover:bg-champagne/60 hover:text-primary",
                )}
              >
                {l.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-1.5">
          <Link
            to="/catalogo"
            className="hidden h-10 w-10 items-center justify-center rounded-md text-foreground transition hover:bg-champagne hover:text-primary sm:inline-flex"
            aria-label="Buscar"
          >
            <Search className="h-4 w-4" />
          </Link>
          <button
            type="button"
            className="hidden h-10 w-10 items-center justify-center rounded-md text-foreground transition hover:bg-champagne hover:text-primary sm:inline-flex"
            aria-label="Favoritos"
          >
            <Heart className="h-4 w-4" />
          </button>
          <Link
            to="/carrinho"
            className="relative inline-flex h-10 w-10 items-center justify-center rounded-md text-foreground transition hover:bg-champagne hover:text-primary"
            aria-label="Carrinho"
          >
            <ShoppingBag className="h-4 w-4" />
            {count > 0 && (
              <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-primary px-1 text-[0.62rem] font-bold text-primary-foreground">
                {count}
              </span>
            )}
          </Link>

          {user ? (
            <div className="relative">
              <button
                onClick={() => setMenuOpen((v) => !v)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-md bg-champagne text-primary transition hover:bg-accent"
                aria-label="Minha conta"
              >
                <UserIcon className="h-4 w-4" />
              </button>
              {menuOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
                  <div className="aura-panel absolute right-0 z-50 mt-2 w-64 overflow-hidden">
                    <div className="border-b border-border px-4 py-3">
                      <div className="text-xs text-muted-foreground">Conectada como</div>
                      <div className="line-clamp-1 text-sm font-semibold text-foreground">
                        {user.email}
                      </div>
                    </div>
                    <Link
                      to="/minha-conta"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-2 px-4 py-3 text-sm text-foreground transition hover:bg-champagne"
                    >
                      <UserIcon className="h-4 w-4" /> Minha conta
                    </Link>
                    {isAdmin && (
                      <Link
                        to="/admin"
                        onClick={() => setMenuOpen(false)}
                        className="flex items-center gap-2 px-4 py-3 text-sm font-semibold text-primary transition hover:bg-champagne"
                      >
                        <LayoutDashboard className="h-4 w-4" /> Painel admin
                      </Link>
                    )}
                    <button
                      onClick={handleLogout}
                      className="flex w-full items-center gap-2 border-t border-border px-4 py-3 text-sm text-muted-foreground transition hover:bg-champagne hover:text-primary"
                    >
                      <LogOut className="h-4 w-4" /> Sair
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <Link to="/login" className="aura-button hidden min-h-10 px-4 py-2 sm:inline-flex">
              Entrar
            </Link>
          )}

          <button
            className="inline-flex h-10 w-10 items-center justify-center rounded-md text-foreground transition hover:bg-champagne lg:hidden"
            onClick={() => setOpen((v) => !v)}
            aria-label="Menu"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-border bg-card lg:hidden">
          <nav className="aura-container flex flex-col py-2">
            {links.map((l, index) => (
              <Link
                key={`${l.label}-mobile-${index}`}
                to={l.to}
                onClick={() => setOpen(false)}
                className="rounded-md px-3 py-3 text-sm font-semibold uppercase text-muted-foreground hover:bg-champagne hover:text-primary"
              >
                {l.label}
              </Link>
            ))}
            {!user && (
              <Link
                to="/login"
                onClick={() => setOpen(false)}
                className="rounded-md px-3 py-3 text-sm font-semibold uppercase text-primary hover:bg-champagne"
              >
                Entrar / Criar conta
              </Link>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
