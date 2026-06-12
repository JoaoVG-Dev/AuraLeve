import { createFileRoute, Outlet, useRouterState } from "@tanstack/react-router";
import { MessageCircle } from "lucide-react";
import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";
import { Toaster } from "@/components/ui/sonner";
import { WHATSAPP } from "@/lib/store";

export const Route = createFileRoute("/_layout")({
  component: LayoutRoute,
});

function LayoutRoute() {
  const path = useRouterState({ select: (r) => r.location.pathname });
  const inAdmin = path.startsWith("/admin");

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      {!inAdmin && <Footer />}
      <a
        href={`https://wa.me/${WHATSAPP}?text=Olá! Vim do site da AuraLeve e quero ajuda para escolher uma peça.`}
        target="_blank"
        rel="noreferrer"
        className="fixed bottom-5 right-5 z-50 inline-flex h-14 w-14 items-center justify-center rounded-md bg-primary text-primary-foreground shadow-[var(--shadow-aura)] transition hover:-translate-y-1"
        aria-label="Falar no WhatsApp"
      >
        <MessageCircle className="h-6 w-6" />
      </a>
      <Toaster />
    </div>
  );
}
