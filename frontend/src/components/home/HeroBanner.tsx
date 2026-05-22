import React from 'react';

interface HeroBannerProps {
    t: (key: string) => string;
    onReservar: () => void;
}

export default function HeroBanner({ t, onReservar }: HeroBannerProps) {
    const [currentHeroIndex, setCurrentHeroIndex] = React.useState(0);
    /* ScrollTrigger: hero encolhe no scroll e volta ao tamanho original no topo */
    const [heroScale, setHeroScale] = React.useState(1);

    const heroImages = [
        "https://templarportugal.com/media/images/TZC03808-min.original.jpg",
        "https://templarportugal.com/media/images/TZC03798-min.original.jpg",
        "https://templarportugal.com/media/images/Castelo_e_Paao_dos_Condes_de_OurCm_iluminado.original.jpg"
    ];

    // Carrossel automático de 5s
    React.useEffect(() => {
        const interval = setInterval(() => {
            setCurrentHeroIndex((prev) => (prev + 1) % heroImages.length);
        }, 5000);
        return () => clearInterval(interval);
    }, []);

    /* ScrollTrigger: hero encolhe no scroll e volta ao tamanho original no topo
     * Replica o comportamento do GSAP ScrollTrigger pin + scrub sem dependências.
     * - Desktop: escala de 1 → 0.65 durante os primeiros 80vh de scroll
     * - Mobile (≤768px): sem efeito (preserva performance em ecrãs pequenos)
     */
    React.useEffect(() => {
        const isMobile = window.matchMedia('(max-width: 768px)').matches;
        if (isMobile) return;

        const handleScroll = () => {
            const scrollY = window.scrollY;
            const maxScroll = window.innerHeight * 0.8; // 80vh
            const progress = Math.min(scrollY / maxScroll, 1);
            const scale = 1 - progress * 0.35; // 1 → 0.65
            setHeroScale(scale);
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        handleScroll(); // estado inicial

        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        /*
         * Contentor exterior tem 180vh: os primeiros 100vh são o hero visível,
         * os 80vh restantes criam o "espaço de scroll" para o pin+shrink.
         * O section interno fica sticky (top:0) e permanece visível enquanto
         * o utilizador percorre esse espaço — exatamente como o pin do GSAP.
         */
        <div className="hero relative" style={{ height: '180vh' }}>
            <section
                className="sticky top-0 w-full h-screen flex items-center justify-center overflow-hidden bg-black"
                style={{ zIndex: 1 }}
            >
                {/* hero-scale-wrap: recebe o transform de escala via scroll */}
                <div
                    className="hero-scale-wrap absolute inset-0"
                    style={{
                        transform: `scale(${heroScale})`,
                        transformOrigin: 'center center',
                        transition: heroScale === 1 ? 'transform 0.4s ease-out' : 'none',
                        willChange: 'transform',
                    }}
                >
                    {/* Carrossel de Imagens */}
                    {heroImages.map((img, idx) => (
                        <div
                            key={idx}
                            className={`absolute inset-0 bg-cover bg-center transition-opacity duration-1000 ${
                                idx === currentHeroIndex ? 'opacity-100' : 'opacity-0'
                            }`}
                            style={{ backgroundImage: `url("${img}")` }}
                        />
                    ))}

                    <div className="absolute inset-0 bg-black/30" />
                </div>

                {/* Texto — não encolhe, fica sobre o wrap */}
                <div className="relative z-10 text-center px-4 max-w-5xl mt-24">
                    <p className="text-white text-xs md:text-sm tracking-mega uppercase mb-8 font-light drop-shadow-md">
                        {t('hero_subtitle')}
                    </p>
                    <h2 className="text-5xl md:text-7xl lg:text-8xl text-white mb-8 font-serif font-light leading-tight drop-shadow-lg">
                        {t('hero_title')} <br />
                        <i className="font-serif text-carapita-goldLight">{t('hero_title_exclusividade')}</i>
                    </h2>
                </div>

                {/* Scroll Indicator */}
                <div
                    className="absolute bottom-12 left-1/2 -translate-x-1/2 text-white flex flex-col items-center gap-4 opacity-80 cursor-pointer hover:text-carapita-gold hover:opacity-100 transition-colors z-10"
                    onClick={onReservar}
                >
                    <div className="w-[1px] h-20 bg-gradient-to-b from-white to-transparent" />
                    <span className="text-[10px] tracking-mega uppercase font-bold">{t('hero_ver_dispo')}</span>
                </div>
            </section>
        </div>
    );
}
