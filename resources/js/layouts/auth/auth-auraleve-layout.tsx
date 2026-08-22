import { Link } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';

import { brand } from '@/data/auraleve';
import type { AuthLayoutProps } from '@/types';

export default function AuthAuraleveLayout({
    children,
    title,
    description,
}: AuthLayoutProps) {
    return (
        <div className="aura-body grid min-h-svh bg-[#fdfaf4] text-[#26221e] lg:grid-cols-[1.05fr_1fr]">
            <aside className="relative hidden overflow-hidden bg-[#26221e] lg:block">
                <img
                    src={brand.homeHero}
                    alt=""
                    className="absolute inset-0 h-full w-full object-cover opacity-70"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-[rgba(20,16,12,.42)] via-[rgba(20,16,12,.28)] to-[rgba(20,16,12,.78)]" />
                <div className="relative flex h-full flex-col justify-between p-12 text-[#f6ecdb]">
                    <Link href="/" className="flex items-center gap-3">
                        <img src={brand.symbol} alt="" className="h-9 w-auto" />
                        <span className="aura-display text-[17px] tracking-[.18em]">
                            AURALEVE
                        </span>
                    </Link>

                    <div className="max-w-md">
                        <div className="text-[11px] tracking-[.22em] text-[#e0b866]">
                            FEITO À MÃO, PEÇA A PEÇA
                        </div>
                        <p className="aura-display mt-6 text-[34px] leading-[1.25]">
                            Cada japamala nasce de uma intenção — e passa a
                            carregar a sua.
                        </p>
                        <p className="mt-5 text-sm leading-7 text-[rgba(246,236,219,.72)]">
                            Sua conta guarda pedidos, endereços e as peças que
                            você separou para depois.
                        </p>
                    </div>
                </div>
            </aside>

            <main className="flex flex-col px-6 py-8 md:px-12 lg:px-16">
                <div className="flex items-center justify-between gap-4">
                    <Link
                        href="/"
                        className="inline-flex items-center gap-2 text-[11px] tracking-[.16em] text-[#8a8178] transition hover:text-[#26221e]"
                    >
                        <ArrowLeft size={14} />
                        VOLTAR PARA A LOJA
                    </Link>
                    <Link href="/" className="lg:hidden">
                        <img src={brand.symbol} alt="" className="h-8 w-auto" />
                    </Link>
                </div>

                <div className="flex flex-1 items-center justify-center py-10">
                    <div className="w-full max-w-md">
                        <div className="text-[11px] tracking-[.22em] text-[#a97b34]">
                            AURALEVE
                        </div>
                        <h1 className="aura-display mt-4 text-[32px] leading-tight">
                            {title}
                        </h1>
                        {description && (
                            <p className="mt-3 text-[15px] leading-7 text-[#8a8178]">
                                {description}
                            </p>
                        )}
                        <div className="mt-8">{children}</div>
                    </div>
                </div>

                <footer className="text-[11px] tracking-[.14em] text-[#b3a897]">
                    AURALEVE · ATELIÊ DE JAPAMALAS
                </footer>
            </main>
        </div>
    );
}
