import { createFileRoute, Link, Outlet, redirect, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Layers,
  LogOut,
  Package,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Tag,
  Ticket,
} from "lucide-react";
import { AuraLeveLogo } from "@/components/AuraLeveLogo";
import { getCurrentAuthUser } from "@/lib/auth.functions";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_layout/admin")({
  ssr: false,
  beforeLoad: async ({ location }) => {
    const user = await getCurrentAuthUser();
    if (!user) {
      throw redirect({ to: "/login", search: { redirect: location.href } as never });
    }
    if (user.role !== "admin") {
      throw redirect({ to: "/acesso-negado" });
    }
  },
  component: AdminLayout,
});

const navItems = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/admin/pedidos", label: "Pedidos", icon: ShoppingBag },
  { to: "/admin/produtos", label: "Produtos", icon: Package },
  { to: "/admin/categorias", label: "Categorias", icon: Tag },
  { to: "/admin/subcategorias", label: "Subcategorias", icon: Layers },
  { to: "/admin/energias", label: "Energias", icon: Sparkles },
  { to: "/admin/cupons", label: "Cupons", icon: Ticket },
];

function AdminLayout() {
  const path = useRouterState({ select: (r) => r.location.pathname });

  return (
    <div className="min-h-[calc(100vh-160px)] bg-background">
      <div className="grid min-h-[calc(100vh-160px)] lg:grid-cols-[248px_1fr]">
        <aside className="border-b border-border bg-card/82 lg:border-b-0 lg:border-r">
          <div className="flex h-full flex-col">
            <div className="border-b border-border p-5">
              <AuraLeveLogo admin />
            </div>
            <nav className="flex gap-2 overflow-x-auto p-3 lg:flex-1 lg:flex-col lg:overflow-visible">
              {navItems.map((n) => {
                const active = n.exact ? path === n.to : path.startsWith(n.to);
                return (
                  <Link
                    key={n.to}
                    to={n.to}
                    className={cn(
                      "flex min-w-fit items-center gap-3 rounded-md px-3 py-2.5 text-sm font-semibold whitespace-nowrap transition",
                      active
                        ? "bg-champagne text-primary"
                        : "text-muted-foreground hover:bg-champagne/55 hover:text-primary",
                    )}
                  >
                    <n.icon className="h-4 w-4" />
                    {n.label}
                  </Link>
                );
              })}
            </nav>
            <div className="hidden border-t border-border p-3 lg:block">
              <Link
                to="/"
                className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-semibold text-muted-foreground hover:bg-champagne hover:text-primary"
              >
                <LogOut className="h-4 w-4" />
                Voltar para loja
              </Link>
            </div>
          </div>
        </aside>

        <section className="min-w-0 px-4 py-5 sm:px-6 md:py-8 xl:px-8">
          <div className="mb-5 rounded-lg border border-border bg-card/78 p-4 shadow-[var(--shadow-card)]">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <span className="aura-eyebrow">Backoffice AuraLeve</span>
                <h1 className="mt-1 font-display text-3xl text-foreground md:text-4xl">
                  Gestão completa da loja
                </h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  Catálogo, pedidos, cupons e configurações com a identidade premium da marca.
                </p>
              </div>
              <div className="inline-flex w-fit items-center gap-2 rounded-md bg-champagne px-3 py-2 text-xs font-bold text-primary ring-1 ring-border">
                <ShieldCheck className="h-4 w-4" />
                Acesso administrativo
              </div>
            </div>
          </div>
          <Outlet />
        </section>
      </div>
    </div>
  );
}
