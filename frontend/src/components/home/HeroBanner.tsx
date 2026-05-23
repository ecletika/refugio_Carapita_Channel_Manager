"use client";
import React, { useEffect, useState } from 'react';

interface HeroBannerProps {
    t: (key: string) => string;
    onReservar: () => void;
}

const HERO_IMAGES = [
    "https://templarportugal.com/media/images/TZC03808-min.original.jpg",
    "https://templarportugal.com/media/images/TZC03798-min.original.jpg",
    "https://templarportugal.com/media/images/Castelo_e_Paao_dos_Condes_de_OurCm_iluminado.original.jpg"
];

// Navbar pill height ≈ top-3(12px) + py-4(16px) + logo-h-12(48px) + py-4(16px) = 92px
// Gap: 6px → hero starts at 98px
const HERO_TOP_SCROLLED = 98;

export default function HeroBanner({ t, onReservar }: HeroBannerProps) {
    const [slide, setSlide]       = useState(0);
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const id = setInterval(() => setSlide(p => (p + 1) % HERO_IMAGES.length), 5000);
        return () => clearInterval(id);
    }, []);

    useEffect(() => {
        const handle = () => setScrolled(window.scrollY > 80);
        window.addEventListener('scroll', handle, { passive: true });
        handle();
        return () => window.removeEventListener('scroll', handle);
    }, []);

    return (
        <div className="hero" style={{ height: '180vh' }}>
            <section
                className="sticky top-0 w-full h-screen bg-black flex items-center justify-center"
                style={{ zIndex: 1 }}
            >
                {/*
                 * Wrapper de imagens:
                 * – NÃO usa inset-0 (shorthand) para o CSS transition funcionar em top
                 * – origin-top + scale() → escala a partir do topo, sem saltar
                 * – top passa de 0 → HERO_TOP_SCROLLED via transition-all
                 */}
                <div
                    className="absolute left-0 right-0 bottom-0 overflow-hidden origin-top transition-all duration-500 ease-in-out"
                    style={{
                        top: scrolled ? `${HERO_TOP_SCROLLED}px` : '0px',
                        transform: scrolled ? 'scale(0.70)' : 'scale(1)',
                        borderRadius: scrolled ? '16px' : '0px',
                        boxShadow: scrolled ? '0 25px 60px rgba(0,0,0,0.5)' : 'none',
                    }}
                >
                    {HERO_IMAGES.map((img, idx) => (
                        <div
                            key={idx}
                            className={`absolute inset-0 bg-cover bg-center transition-opacity duration-1000 ${
                                idx === slide ? 'opacity-100' : 'opacity-0'
                            }`}
                            style={{ backgroundImage: `url("${img}")` }}
                        />
                    ))}
                    <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/30 to-black/60" />
                </div>

                {/* Texto — some quando encolhe */}
                <div
                    className="relative z-10 text-center px-4 max-w-5xl transition-all duration-500"
                    style={{
                        opacity: scrolled ? 0 : 1,
                        transform: scrolled ? 'translateY(-20px)' : 'translateY(0)',
                        pointerEvents: scrolled ? 'none' : 'auto',
                        marginTop: '6rem',
                    }}
                >
                    <p className="text-white text-xs md:text-sm tracking-widest uppercase mb-8 font-light drop-shadow-md">
                        {t('hero_subtitle')}
                    </p>
                    <h2 className="text-5xl md:text-7xl lg:text-8xl text-white mb-8 font-serif font-light leading-tight drop-shadow-lg">
                        {t('hero_title')} <br />
                        <i className="font-serif text-[#C4A484]">{t('hero_title_exclusividade')}</i>
                    </h2>
                </div>

                {/* Indicador scroll */}
                <div
                    className="absolute bottom-12 left-1/2 -translate-x-1/2 text-white flex flex-col items-center gap-4 cursor-pointer hover:text-[#C4A484] transition-all duration-500 z-20"
                    style={{ opacity: scrolled ? 0 : 0.8, pointerEvents: scrolled ? 'none' : 'auto' }}
                    onClick={onReservar}
                >
                    <div className="w-[1px] h-20 bg-gradient-to-b from-white to-transparent" />
                    <span className="text-[10px] tracking-widest uppercase font-bold">{t('hero_ver_dispo')}</span>
                </div>

                {/* Dots do carrossel */}
                <div className="absolute bottom-8 right-8 flex gap-2 z-20">
                    {HERO_IMAGES.map((_, idx) => (
                        <button
                            key={idx}
                            type="button"
                            aria-label={`Slide ${idx + 1}`}
                            onClick={() => setSlide(idx)}
                            className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                                idx === slide ? 'bg-[#C4A484] w-5' : 'bg-white/40 w-1.5 hover:bg-white/70'
                            }`}
                        />
                    ))}
                </div>
            </section>
        </div>
    );
}
