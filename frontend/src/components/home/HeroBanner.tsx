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

// Total de scroll que o wrapper "consome" para a animação
const ANIM_SCROLL = 240; // px — quanto de scroll existe além dos 100vh

export default function HeroBanner({ t, onReservar }: HeroBannerProps) {
    const [slide, setSlide]     = useState(0);
    const [scrollY, setScrollY] = useState(0);
    const wrapperRef            = useRef<HTMLDivElement>(null);

    // Slideshow
    useEffect(() => {
        const id = setInterval(() => setSlide(p => (p + 1) % HERO_IMAGES.length), 5000);
        return () => clearInterval(id);
    }, []);

    // Scroll tracker — RAF 60fps
    useEffect(() => {
        let ticking = false;
        const handle = () => {
            if (!ticking) {
                requestAnimationFrame(() => {
                    setScrollY(window.scrollY);
                    ticking = false;
                });
                ticking = true;
            }
        };
        window.addEventListener('scroll', handle, { passive: true });
        return () => window.removeEventListener('scroll', handle);
    }, []);

    // ── Animação suave ─────────────────────────────────────────────────────
    // progresso (0→1) ao longo de ANIM_SCROLL px de scroll
    const progress = Math.min(1, Math.max(0, scrollY / ANIM_SCROLL));

    // Escala muito subtil: de 1.0 → 0.93
    const SCALE_FINAL = 0.93;
    const scale = 1 - progress * (1 - SCALE_FINAL);

    // Margens laterais: 0 → 5% da largura
    const vw = typeof window !== 'undefined' ? window.innerWidth : 1440;
    const marginH = progress * vw * 0.05;

    // Topo/fundo calculados a partir da escala (centrado verticalmente)
    const vh = typeof window !== 'undefined' ? window.innerHeight : 800;
    const shrunkH = vh * scale;
    const topVal    = (vh - shrunkH) / 2;
    const bottomVal = topVal;

    // Border-radius e sombra crescem suavemente
    const radius    = progress * 16;   // 0 → 16px
    const shadowOpa = progress * 0.45;

    const imgStyle: React.CSSProperties = {
        position: 'absolute',
        top:    `${topVal}px`,
        bottom: `${bottomVal}px`,
        left:   `${marginH}px`,
        right:  `${marginH}px`,
        borderRadius: `${radius}px`,
        boxShadow: progress > 0.02
            ? `0 20px 60px rgba(0,0,0,${shadowOpa})`
            : 'none',
        overflow: 'hidden',
        willChange: 'top, bottom, left, right',
        transition: scrollY < 4
            ? 'all 0.6s cubic-bezier(0.16,1,0.3,1)'
            : 'none',
    };

    const textOpacity = Math.max(0, 1 - progress * 3);

    return (
        <div ref={wrapperRef} className="hero" style={{ height: `calc(100vh + ${ANIM_SCROLL}px)` }}>
            <section
                className="sticky top-0 w-full h-screen flex items-center justify-center"
                style={{ zIndex: 1, background: '#1E3932' }}
            >
                {/* Imagem */}
                <div style={imgStyle}>
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

                {/* Texto hero */}
                <div
                    className="relative z-10 text-center px-4 max-w-5xl mt-24"
                    style={{
                        opacity: textOpacity,
                        pointerEvents: progress > 0.1 ? 'none' : 'auto',
                        transition: 'opacity 0.2s ease',
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
                        opacity: Math.max(0, (1 - progress * 4) * 0.8),
                        pointerEvents: progress > 0.1 ? 'none' : 'auto',
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
