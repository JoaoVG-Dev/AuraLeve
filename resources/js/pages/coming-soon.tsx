import { Head } from '@inertiajs/react';
import { useState } from 'react';

import {
    BeadsIcon,
    HeartIcon,
    InstagramIcon,
    LeafIcon,
    MailIcon,
    WhatsappIcon,
} from '@/components/auraleve-icons';
import { brand } from '@/data/auraleve';

const featureItems = [
    [BeadsIcon, 'Feito à mão', 'com intenção'],
    [LeafIcon, 'Materiais', 'naturais'],
    [HeartIcon, 'Conexão que', 'transforma'],
] as const;

const cx = (...classes: Array<string | false | null | undefined>) =>
    classes.filter(Boolean).join(' ');

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

            <main className="aura-body min-h-screen overflow-x-hidden bg-[#fbf6ee] text-[#241f1a]">
                <header className="border-b border-[#e8ddcc] bg-[#fbf6ee]/95">
                    <div className="mx-auto flex h-[86px] max-w-7xl items-center justify-center px-6 md:h-[94px] md:justify-between md:px-10">
                        <BrandMark />
                        <nav className="hidden items-center gap-10 text-xs tracking-[.12em] text-[#2f2923] md:flex">
                            <a href="#top">INÍCIO</a>
                            <a href="#sobre">SOBRE</a>
                            <a href="#colecao">COLEÇÃO</a>
                            <a href="#contato">CONTATO</a>
                        </nav>
                        <div className="hidden items-center gap-4 text-[#3b342d] md:flex">
                            <a
                                href="https://www.instagram.com/auraleve.acessorios"
                                aria-label="Instagram AuraLeve"
                            >
                                <InstagramIcon size={20} />
                            </a>
                            <a
                                href="https://wa.me/5511999999999"
                                aria-label="WhatsApp AuraLeve"
                            >
                                <WhatsappIcon size={20} />
                            </a>
                        </div>
                    </div>
                </header>

                <section
                    id="top"
                    className="relative overflow-hidden border-b border-[#e7dccb] bg-[#f5eddf]"
                >
                    <div className="mx-auto grid max-w-7xl md:grid-cols-[.9fr_1.1fr] md:items-stretch">
                        <div className="relative z-10 px-7 pt-10 pb-8 text-left md:px-10 md:pt-24 md:pb-20 lg:px-20">
                            <h1 className="aura-display max-w-[12ch] text-[42px] leading-[1.02] tracking-normal text-[#241f1a] md:text-[58px] lg:text-[64px]">
                                EM CONSTRUÇÃO
                            </h1>
                            <div className="mt-7 h-px w-12 bg-[#9d6634]" />
                            <p className="mt-7 max-w-[340px] text-[17px] leading-8 text-[#2f2923]">
                                Estamos preparando algo especial para você.
                            </p>
                            <p className="mt-5 max-w-[380px] text-sm leading-7 text-[#4f463d] md:text-[15px]">
                                Em breve, você poderá explorar nossa coleção de
                                acessórios autorais feitos com pedras naturais,
                                madeira e intenções que conectam.
                            </p>
                        </div>

                        <div
                            id="sobre"
                            className="relative h-[380px] overflow-hidden md:h-[520px] lg:h-[560px]"
                        >
                            <img
                                src={brand.homeHero}
                                alt="Japamala AuraLeve em mãos"
                                className="h-full w-full object-cover object-[55%_38%]"
                            />
                            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(245,237,223,.14),rgba(245,237,223,.26)),linear-gradient(90deg,rgba(245,237,223,.42),rgba(245,237,223,0)_35%)]" />
                        </div>
                    </div>
                </section>

                <section
                    id="colecao"
                    className="bg-[#eadfce] px-5 py-7 md:px-10 md:py-9"
                >
                    <div className="mx-auto grid max-w-4xl grid-cols-3 text-center">
                        {featureItems.map(([Icon, first, second], index) => (
                            <div
                                key={first}
                                className={cx(
                                    'flex flex-col items-center gap-2 px-2 text-[#382f27]',
                                    index > 0 && 'border-l border-[#d9c8b0]',
                                )}
                            >
                                <Icon
                                    size={34}
                                    className="text-[#9d6634] md:size-10"
                                />
                                <div className="text-[11px] leading-4 md:text-sm md:leading-5">
                                    {first}
                                    <br />
                                    {second}
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                <section
                    id="contato"
                    className="px-6 py-12 text-center md:px-10 md:py-16"
                >
                    <MailIcon
                        size={30}
                        className="mx-auto text-[#9d6634] md:size-9"
                    />
                    <h2 className="aura-display mx-auto mt-5 max-w-3xl text-[18px] leading-7 tracking-[.08em] text-[#241f1a] uppercase md:text-2xl">
                        Cadastre-se e seja a primeira a saber das novidades
                    </h2>
                    <div className="mx-auto mt-6 flex max-w-xl border border-[#cdbda8] bg-[#fffdf9]">
                        <input
                            value={email}
                            onChange={(event) => {
                                setEmail(event.target.value);
                                setMessage('');
                            }}
                            placeholder="Seu e-mail"
                            className="h-12 min-w-0 flex-1 bg-transparent px-4 text-sm outline-none md:h-14 md:px-5"
                        />
                        <button
                            type="button"
                            onClick={subscribe}
                            className="h-12 w-24 bg-[#3b2b1f] text-sm text-[#fff9ef] md:h-14 md:w-32"
                        >
                            Enviar
                        </button>
                    </div>
                    {message && (
                        <div className="mt-3 text-sm text-[#7b5b31]">
                            {message}
                        </div>
                    )}
                </section>

                <footer className="border-t border-[#dfd1bf] px-6 py-6 md:px-10">
                    <div className="mx-auto flex max-w-5xl flex-col items-center justify-center gap-5 text-sm text-[#2f2923] md:flex-row md:justify-around">
                        <a
                            href="https://www.instagram.com/auraleve.acessorios"
                            className="inline-flex items-center gap-3"
                        >
                            <InstagramIcon size={20} />
                            @auraleve.acessorios
                        </a>
                        <a
                            href="https://wa.me/5511999999999"
                            className="inline-flex items-center gap-3"
                        >
                            <WhatsappIcon size={20} />
                            (11) 99999-9999
                        </a>
                    </div>
                    <div className="mt-6 text-center text-[11px] text-[#776c5e]">
                        © 2026 AuraLeve Acessórios Autorais. Todos os direitos
                        reservados.
                    </div>
                </footer>
            </main>
        </>
    );
}

function BrandMark() {
    return (
        <a
            href="#top"
            className="flex flex-col items-center gap-1 text-[#241f1a] md:flex-row md:gap-3"
        >
            <img
                src={brand.symbol}
                alt=""
                className="h-10 w-auto object-contain md:h-12"
            />
            <span className="text-center md:text-left">
                <span className="aura-display block text-[18px] leading-none tracking-[.22em] md:text-2xl">
                    AURALEVE
                </span>
                <span className="mt-1 block text-[7px] tracking-[.22em] text-[#4f463d] md:text-[9px]">
                    ACESSÓRIOS AUTORAIS
                </span>
            </span>
        </a>
    );
}
