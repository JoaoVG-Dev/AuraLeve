import { Head, usePage } from '@inertiajs/react';
import {
    BestSellers,
    ChooseIntention,
    Footer,
    Hero,
    HomeHero,
    Nav,
    Pillars,
} from '@/components/marketing/sections';

export default function Welcome() {
    const { auth } = usePage().props;

    return (
        <>
            <Head title="Acessórios Artesanais em Cristais">
                <meta
                    name="description"
                    content="AuraLeve — japamalas, pulseiras e colares artesanais em cristais naturais, montados à mão pedra a pedra."
                />
            </Head>

            <div className="bg-aura-cream [font-family:var(--font-brand-sans)] text-aura-plum">
                <Nav auth={auth} />
                <main>
                    <Hero />
                    <HomeHero />
                    <Pillars />
                    <ChooseIntention />
                    <BestSellers />
                </main>
                <Footer />
            </div>
        </>
    );
}
