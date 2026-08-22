import { Head, Link } from '@inertiajs/react';
import { useState } from 'react';

import {
    InstagramIcon,
    MailIcon,
    WhatsappIcon,
} from '@/components/auraleve-icons';
import { brand } from '@/data/auraleve';

const links = [
    { label: 'Entrar', href: '/login' },
    { label: 'Prévia da loja', href: '/loja-preview' },
    {
        label: 'Instagram',
        href: 'https://www.instagram.com/auraleve.acessorios',
    },
] as const;

export default function ComingSoon() {
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');

    const subscribe = () => {
        if (!/^[^@\s]+@[^@\s]+\.[a-z]{2,}$/i.test(email.trim())) {
            setMessage('Confira o e-mail informado.');

            return;
        }

        setEmail('');
        setMessage('Cadastro recebido.');
    };

    return (
        <>
            <Head title="Em construção">
                <meta
                    name="description"
                    content="A AuraLeve está preparando uma experiência especial para você."
                />
            </Head>

            <main className="aura-body relative min-h-screen overflow-hidden bg-[#e8e0d2] text-[#26221e]">
                <img
                    src={brand.homeHero}
                    alt=""
                    className="absolute inset-0 h-full w-full object-cover object-[58%_42%]"
                />
                <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(253,250,244,.88),rgba(253,250,244,.52)_44%,rgba(38,34,30,.22)),linear-gradient(90deg,rgba(253,250,244,.74),rgba(253,250,244,.18)_48%,rgba(253,250,244,.56))]" />

                <section className="relative z-10 mx-auto flex min-h-screen w-full max-w-6xl flex-col items-center justify-center px-6 py-10 text-center sm:px-10">
                    <div className="flex flex-col items-center">
                        <img
                            src={brand.symbol}
                            alt=""
                            className="h-14 w-auto object-contain drop-shadow-[0_8px_22px_rgba(38,34,30,.12)] md:h-[72px]"
                        />
                        <div className="aura-display mt-5 text-[22px] leading-none tracking-[.26em] md:text-[31px]">
                            AURALEVE
                        </div>
                        <div className="mt-2 text-[8px] tracking-[.28em] text-[#4f463d] uppercase md:text-[10px]">
                            Acessórios Autorais
                        </div>
                    </div>

                    <h1 className="aura-display mt-12 text-[40px] leading-[1.05] tracking-normal text-[#26221e] uppercase sm:text-[52px] md:mt-14 md:text-[70px]">
                        Em construção
                    </h1>
                    <div className="mt-6 h-px w-12 bg-[#a97b34]" />

                    <p className="mt-6 max-w-[360px] text-[15px] leading-7 text-[#3b332b] md:max-w-[460px] md:text-[17px] md:leading-8">
                        Estamos preparando algo especial para você.
                    </p>
                    <p className="mt-4 max-w-[430px] text-sm leading-7 text-[#5c554d] md:text-[15px]">
                        Em breve, você poderá explorar nossa coleção de
                        acessórios autorais feitos com pedras naturais, madeira
                        e intenções que conectam.
                    </p>

                    <div className="mt-10 w-full max-w-[520px]">
                        <div className="mb-4 flex items-center justify-center gap-3 text-[11px] tracking-[.16em] text-[#6f675d] uppercase">
                            <MailIcon size={19} className="text-[#9d6634]" />
                            Receba as novidades
                        </div>
                        <div className="flex flex-col border border-[#cdbda8] bg-[#fffdf9]/88 shadow-[0_18px_60px_rgba(59,43,31,.12)] backdrop-blur-sm sm:flex-row">
                            <input
                                value={email}
                                onChange={(event) => {
                                    setEmail(event.target.value);
                                    setMessage('');
                                }}
                                type="email"
                                inputMode="email"
                                placeholder="Seu e-mail"
                                className="h-12 min-w-0 flex-1 bg-transparent px-4 text-sm outline-none placeholder:text-[#8a8178] sm:h-14 sm:px-5"
                            />
                            <button
                                type="button"
                                onClick={subscribe}
                                className="h-12 bg-[#3b2b1f] px-8 text-sm text-[#fff9ef] transition hover:bg-[#2d2018] sm:h-14"
                            >
                                Enviar
                            </button>
                        </div>
                        {message && (
                            <div className="mt-3 text-sm text-[#7b5b31]">
                                {message}
                            </div>
                        )}
                    </div>

                    <nav className="mt-10 flex flex-col items-center gap-4 text-xs tracking-[.16em] text-[#4f463d] uppercase sm:flex-row sm:gap-8">
                        {links.map((link) =>
                            link.href.startsWith('/') ? (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    className="border-b border-[#c9b48c] pb-1 transition hover:text-[#a97b34]"
                                >
                                    {link.label}
                                </Link>
                            ) : (
                                <a
                                    key={link.href}
                                    href={link.href}
                                    className="border-b border-[#c9b48c] pb-1 transition hover:text-[#a97b34]"
                                >
                                    {link.label}
                                </a>
                            ),
                        )}
                    </nav>

                    <div className="mt-11 flex items-center gap-5 text-[#3b342d]">
                        <a
                            href="https://www.instagram.com/auraleve.acessorios"
                            aria-label="Instagram AuraLeve"
                            className="transition hover:text-[#a97b34]"
                        >
                            <InstagramIcon size={20} />
                        </a>
                        <a
                            href="https://wa.me/5511999999999"
                            aria-label="WhatsApp AuraLeve"
                            className="transition hover:text-[#a97b34]"
                        >
                            <WhatsappIcon size={20} />
                        </a>
                    </div>
                </section>
            </main>
        </>
    );
}
