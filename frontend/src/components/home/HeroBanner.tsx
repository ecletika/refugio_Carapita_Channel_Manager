"use client";
import React, { useEffect, useRef, useState } from 'react';

interface HeroBannerProps {
    t: (key: string) => string;
    onReservar: () => void;
}

const HERO_IMAGES = [
    "https://templarportugal.com/media/images/TZC03808-min.original.jpg",
    "https://templarportugal.com/media/images/TZC03798-min.original.jpg",
    "https://templarportugal.com/media/images/Castelo_e_Paao_dos_Condes_de_OurCm_iluminado.original.jpg"
];

// Altura total do hero wrapper (180vh = scroll range)
// A secção sticky tem 100vh, o wrapper tem 180vh → 80vh de scroll range
const HERO_SCROLL_RANGE_VH = 80; // vh de scroll disponível dentro do hero

export default function HeroBanner({ t, onReservar }: HeroBannerProps) {
    const [slide, setSlide]           = useState(0);
    const [scrollY, setScrollY]       = useState(0);
    const [heroHeight, setHeroHeight] = useState(0);
    const wrapperRef                  = useRef<HTMLDivElement>(null);

    // Slideshow
    useEffect(() => {
        const id = setInterval(() => setSlide(p => (p + 1) % HERO_IMAGES.length), 5000);
        return () => clearInterval(id);
    }, []);

    // Scroll tracker
    useEffect(() => {
        const handle = () => setScrollY(window.scrollY);
        window.addEventListener('scroll', handle, { passive: true });
        handle();
        return () => window.removeEventListener('scroll', handle);
    }, []);

    // Medir altura do wrapper para saber quando o hero acaba
    useEffect(() => {
        const measure = () => {
            if (wrapperRef.current) {
                setHeroHeight(wrapperRef.current.offsetHeight);
            }
        };
        measure();
        window.addEventListener('resize', measure);
        return () => window.removeEventListener('resize', measure);
    }, []);

    // ── Lógica de scroll ──────────────────────────────────────────────────────
    // scrollY = 0..80 → fase 1: imagem encolhe (scale 1→0.70) e desce 90px
    // scrollY = 80..heroHeight-vh → fase 2: imagem desce progressivamente
    //   até sair do ecrã pelo fundo
    const vh = typeof window !== 'undefined' ? window.innerHeight : 800;

    // Fase 1: primeiros 80px de scroll → shrink
    const SHRINK_START = 0;
    const SHRINK_END   = 80;
    const shrinkProgress = Math.min(1, Math.max(0, (scrollY - SHRINK_START) / (SHRINK_END - SHRINK_START)));

    const scale       = 1 - shrinkProgress * 0.30;          // 1 → 0.70
    const SHIFT       = 90;                                   // px abaixo do topo após shrink
    const translateY  = shrinkProgress * SHIFT;              // 0 → 90px (fase 1)

    // Fase 2: após os 80px de shrink, a imagem desce até o final do hero
    // O hero wrapper tem 180vh, a secção sticky tem 100vh
    // Quando scrollY = heroHeight - vh, a secção sticky sai do viewport
    const SLIDE_START = SHRINK_END;
    const SLIDE_END   = heroHeight > 0 ? heroHeight - vh : vh * 0.8;
    const slideRange  = Math.max(1, SLIDE_END - SLIDE_START);
    const slideProgress = Math.min(1, Math.max(0, (scrollY - SLIDE_START) / slideRange));

    // Na fase 2, a imagem já está em scale(0.70) e translateY(90px)
    // Queremos que ela desça até sair pelo baixo: translateY máximo = vh (sai do ecrã)
    const extraTranslate = slideProgress * (vh * 0.85);

    const finalTranslateY = translateY + (shrinkProgress >= 1 ? extraTranslate : 0);
    const isShrunken      = shrinkProgress > 0.05;

    const imgStyle: React.CSSProperties = {
        transform: `translateY(${finalTranslateY}px) scale(${scale})`,
        transformOrigin: 'top center',
        transition: scrollY < 5 ? 'transform 0.5s ease-in-out, border-radius 0.5s ease-in-out, box-shadow 0.5s ease-in-out' : 'none',
        borderRadius: isShrunken ? '18px' : '0px',
        boxShadow: isShrunken ? '0 20px 60px rgba(0,0,0,0.55)' : 'none',
        willChange: 'transform',
    };

    const textOpacity = 1 - shrinkProgress * 2; // desaparece rápido

    return (
        <div ref={wrapperRef} className="hero" style={{ height: '180vh' }}>
            <section
                className="sticky top-0 w-full h-screen bg-black flex items-center justify-center"
                style={{ zIndex: 1 }}
            >
                {/* Wrapper de imagens */}
                <div className="absolute inset-0 overflow-hidden" style={imgStyle}>
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

                {/* Texto */}
                <div
                    className="relative z-10 text-center px-4 max-w-5xl mt-24"
                    style={{
                        opacity: Math.max(0, textOpacity),
                        pointerEvents: shrinkProgress > 0.1 ? 'none' : 'auto',
                        transition: 'opacity 0.3s ease',
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

                {/* Scroll indicator */}
                <div
                    className="absolute bottom-12 left-1/2 -translate-x-1/2 text-white flex flex-col items-center gap-4 cursor-pointer hover:text-[#C4A484] transition-all duration-500 z-20"
                    style={{
                        opacity: Math.max(0, (1 - shrinkProgress * 3) * 0.8),
                        pointerEvents: shrinkProgress > 0.1 ? 'none' : 'auto',
                    }}
                    onClick={onReservar}
                >
                    <div className="w-[1px] h-20 bg-gradient-to-b from-white to-transparent" />
                    <span className="text-[10px] tracking-widest uppercase font-bold">{t('hero_ver_dispo')}</span>
                </div>

                {/* Dots */}
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
