import { Head } from '@inertiajs/react';
import { useState } from 'react';
import type { FormEvent } from 'react';

import { brand } from '@/data/auraleve';

const heroImage = '/images/auraleve/official/official-soft-blue-japamala.jpeg';

export default function ComingSoon() {
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');

    const subscribe = (event: FormEvent) => {
        event.preventDefault();

        if (!/^[^@\s]+@[^@\s]+\.[a-z]{2,}$/i.test(email.trim())) {
            setMessage('Confira o e-mail informado.');

            return;
        }

        setEmail('');
        setMessage('E-mail recebido. Avisaremos você.');
    };

    return (
        <>
            <Head title="Em construção">
                <meta
                    name="description"
                    content="A loja AuraLeve está sendo montada à mão."
                />
            </Head>

            <main className="aura-body relative min-h-screen overflow-hidden bg-[#1a130f] text-[#f8efe3]">
                <img
                    src={heroImage}
                    alt=""
                    className="absolute inset-0 h-full w-full object-cover object-[54%_45%]"
                />
                <div className="absolute inset-0 bg-[rgba(22,15,11,.68)]" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,244,220,.12),rgba(22,15,11,.42)_56%,rgba(22,15,11,.74))]" />

                <section className="relative z-10 mx-auto flex min-h-screen w-full max-w-5xl flex-col items-center justify-center px-8 py-9 text-center sm:px-12 lg:px-16">
                    <div className="flex flex-col items-center">
                        <img
                            src={brand.symbol}
                            alt=""
                            className="h-[112px] w-auto object-contain drop-shadow-[0_10px_30px_rgba(0,0,0,.45)] sm:h-[132px] lg:h-[150px]"
                        />
                        <div className="aura-display mt-6 text-[28px] leading-none tracking-[.34em] text-[#e6b653] sm:text-[36px] lg:text-[42px]">
                            AURALEVE
                        </div>
                        <div className="mt-5 text-[10px] tracking-[.38em] text-[#f1e4d1] uppercase sm:text-[12px]">
                            Acessórios Autorais
                        </div>
                        <div className="mt-7 h-px w-16 bg-[#c18a39]" />
                    </div>

                    <h1 className="aura-display mt-9 max-w-[780px] text-[31px] leading-[1.18] text-[#fff6e8] sm:text-[42px] lg:text-[52px]">
                        Nossa loja está sendo montada à mão
                    </h1>

                    <p className="mt-7 max-w-[560px] text-[15px] leading-8 text-[#eadfce] sm:text-base sm:leading-8">
                        Do mesmo jeito que fazemos cada peça: com calma e
                        atenção ao detalhe. Deixe seu e-mail e você é a
                        primeira a saber quando abrirmos.
                    </p>

                    <form
                        onSubmit={subscribe}
                        className="mt-9 flex w-full max-w-[640px] flex-col gap-4 lg:flex-row lg:items-center lg:gap-3"
                    >
                        <input
                            value={email}
                            onChange={(event) => {
                                setEmail(event.target.value);
                                setMessage('');
                            }}
                            type="email"
                            inputMode="email"
                            aria-label="E-mail"
                            placeholder="seu@email.com"
                            className="h-11 min-w-0 flex-1 rounded-full border border-[rgba(255,246,232,.38)] bg-[rgba(255,255,255,.08)] px-6 text-sm text-[#fff6e8] outline-none backdrop-blur-sm placeholder:text-[rgba(255,246,232,.58)] focus:border-[#e6b653] lg:h-[54px]"
                        />
                        <button
                            type="submit"
                            className="h-[54px] rounded-full bg-[#c18a39] px-11 text-xs tracking-[.16em] text-[#fff8ec] uppercase transition hover:bg-[#d49a40]"
                        >
                            Avise-me
                        </button>
                    </form>

                    {message && (
                        <div className="mt-4 text-sm text-[#e6b653]">
                            {message}
                        </div>
                    )}

                    <nav className="mt-12 flex flex-col items-center gap-5 text-[11px] tracking-[.18em] uppercase sm:flex-row sm:gap-7">
                        <a
                            href="https://www.instagram.com/auraleve.acessorios"
                            className="border-b border-[#c18a39] pb-1 text-[#e6b653] transition hover:text-[#fff6e8]"
                        >
                            Instagram
                        </a>
                        <span className="hidden h-4 w-px bg-[rgba(255,246,232,.24)] sm:block" />
                        <a
                            href="https://wa.me/5511999999999"
                            className="text-[#f1e4d1] transition hover:text-[#e6b653]"
                        >
                            WhatsApp
                        </a>
                    </nav>

                    <footer className="mt-12 text-[10px] tracking-[.34em] text-[rgba(255,246,232,.58)] uppercase">
                        Feito à mão em São Paulo · @auraleve
                    </footer>
                </section>
            </main>
        </>
    );
}
