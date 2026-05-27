import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import {
  ShoppingBag,
  Search,
  Menu,
  X,
  User as UserIcon,
  LogOut,
  LayoutDashboard,
} from "lucide-react";
import { useState } from "react";
import { useShop } from "@/lib/store";
import { useAuth, signOut } from "@/hooks/use-auth";
import { toast } from "sonner";

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
    <header className="sticky top-0 z-50 border-b border-border bg-background/90 backdrop-blur">
      <div className="aura-container flex h-16 items-center justify-between gap-4">
        <Link to="/" className="group flex items-center">
          <span className="font-display text-lg uppercase tracking-[0.18em] text-primary">
            AuraLeve
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          {links.map((l) => {
            const active = l.to === "/" ? path === "/" : path.startsWith(l.to);
            return (
              <Link
                key={l.to}
                to={l.to}
                className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  active
                    ? "bg-accent text-primary"
                    : "text-muted-foreground hover:text-primary hover:bg-accent/60"
                }`}
              >
                {l.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          <Link
            to="/catalogo"
            className="hidden sm:inline-flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground hover:text-primary hover:bg-accent transition"
            aria-label="Buscar"
          >
            <Search className="h-4 w-4" />
          </Link>
          <Link
            to="/carrinho"
            className="relative inline-flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground hover:text-primary hover:bg-accent transition"
            aria-label="Carrinho"
          >
            <ShoppingBag className="h-4 w-4" />
            {count > 0 && (
              <span className="absolute -top-1 -right-1 h-4 min-w-4 px-1 rounded-full bg-primary text-[10px] font-semibold text-primary-foreground flex items-center justify-center">
                {count}
              </span>
            )}
          </Link>

          {user ? (
            <div className="relative">
              <button
                onClick={() => setMenuOpen((v) => !v)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-accent text-primary hover:opacity-90 transition"
                aria-label="Minha conta"
              >
                <UserIcon className="h-4 w-4" />
              </button>
              {menuOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
                  <div className="absolute right-0 mt-2 w-56 rounded-xl border border-border bg-card shadow-lg z-50 overflow-hidden">
                    <div className="px-4 py-3 border-b border-border">
                      <div className="text-xs text-muted-foreground">Conectada como</div>
                      <div className="text-sm font-medium text-foreground line-clamp-1">
                        {user.email}
                      </div>
                    </div>
                    <Link
                      to="/minha-conta"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-accent text-foreground"
                    >
                      <UserIcon className="h-4 w-4" /> Minha conta
                    </Link>
                    {isAdmin && (
                      <Link
                        to="/admin"
                        onClick={() => setMenuOpen(false)}
                        className="flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-accent text-primary font-medium"
                      >
                        <LayoutDashboard className="h-4 w-4" /> Painel admin
                      </Link>
                    )}
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-accent text-muted-foreground border-t border-border"
                    >
                      <LogOut className="h-4 w-4" /> Sair
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <Link
              to="/login"
              className="hidden sm:inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-xs font-medium text-primary-foreground hover:opacity-90 transition"
            >
              Entrar
            </Link>
          )}

          <button
            className="md:hidden inline-flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground hover:bg-accent"
            onClick={() => setOpen((v) => !v)}
            aria-label="Menu"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="md:hidden border-t border-border bg-background">
          <nav className="aura-container flex flex-col py-2">
            {links.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-3 text-sm font-medium text-muted-foreground hover:text-primary hover:bg-accent"
              >
                {l.label}
              </Link>
            ))}
            {!user && (
              <Link
                to="/login"
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-3 text-sm font-medium text-primary hover:bg-accent"
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
