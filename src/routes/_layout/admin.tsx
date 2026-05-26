import { createFileRoute, Link, Outlet, useRouterState, redirect } from "@tanstack/react-router";
import {
  Package,
  Tag,
  Layers,
  Sparkles,
  LayoutDashboard,
  Ticket,
  ShoppingBag,
  ShieldCheck,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_layout/admin")({
  beforeLoad: async ({ location }) => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
      throw redirect({ to: "/login", search: { redirect: location.href } as never });
    }
    const { data: role, error } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", session.user.id)
      .eq("role", "admin")
      .maybeSingle();
    if (error || role?.role !== "admin") {
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
    <div className="min-h-[calc(100vh-160px)] bg-gradient-to-b from-muted/40 to-background">
      <div className="aura-container max-w-full py-4 sm:py-6 md:py-10">
        <div className="mb-4 rounded-xl border border-border bg-card p-4 shadow-sm sm:mb-6 sm:p-5">
          <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <span className="text-[11px] font-semibold uppercase tracking-[0.24em] text-primary">
                Backoffice
              </span>
              <h1 className="mt-1 break-words font-display text-xl text-primary sm:text-2xl md:text-3xl">
                Painel AuraLeve
              </h1>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                Gerencie pedidos, catálogo, cupons e organização da loja.
              </p>
            </div>
            <div className="inline-flex w-fit items-center gap-2 rounded-lg bg-primary/10 px-3 py-2 text-xs font-semibold text-primary ring-1 ring-primary/15">
              <ShieldCheck className="h-4 w-4" />
              Acesso administrativo
            </div>
          </div>
        </div>

        <div className="grid min-w-0 gap-4 lg:grid-cols-[244px_1fr] lg:gap-6">
          <aside className="min-w-0 lg:sticky lg:top-6 lg:self-start">
            <nav className="flex max-w-full gap-2 overflow-x-auto rounded-xl border border-border bg-card p-2 shadow-sm [-ms-overflow-style:none] [scrollbar-width:none] lg:flex-col lg:overflow-visible [&::-webkit-scrollbar]:hidden">
              {navItems.map((n) => {
                const active = n.exact ? path === n.to : path.startsWith(n.to);
                return (
                  <Link
                    key={n.to}
                    to={n.to}
                    className={cn(
                      "flex min-w-fit items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-medium whitespace-nowrap transition sm:px-3 sm:py-2.5 sm:text-sm",
                      active
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "text-muted-foreground hover:bg-accent hover:text-primary",
                    )}
                  >
                    <n.icon className="h-4 w-4" />
                    {n.label}
                  </Link>
                );
              })}
            </nav>
          </aside>
          <section className="min-w-0 max-w-full overflow-hidden">
            <Outlet />
          </section>
        </div>
      </div>
    </div>
  );
}
