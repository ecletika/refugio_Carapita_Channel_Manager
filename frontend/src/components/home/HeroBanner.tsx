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

// ── Parâmetros da animação ─────────────────────────────────────────────────
// Fase 1 (0 → P1_END px de scroll):
//   Imagem "assenta" 6px abaixo do navbar pill (top: 0 → NAVBAR_BOTTOM)
// Fase 2 (P1_END → P1_END + P2_SCROLL px de scroll):
//   Imagem sobe com translateY até sair completamente pelo topo
const NAVBAR_BOTTOM = 90;   // px — bottom do navbar pill (~12 + 66 + 12) + 6px gap
const P1_END        = 90;   // px de scroll para completar Fase 1
const P2_SCROLL     = 380;  // px de scroll para a imagem sair completamente
const ANIM_TOTAL    = P1_END + P2_SCROLL; // 470px total

export { ANIM_TOTAL };

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

    const vh = typeof window !== 'undefined' ? window.innerHeight : 800;

    // ── Progressos ─────────────────────────────────────────────────────────
    // Fase 1: imagem desce para ficar 6px abaixo do navbar
    const p1 = Math.min(1, Math.max(0, scrollY / P1_END));

    // Fase 2: imagem sobe e sai pelo topo (via translateY)
    const p2 = Math.min(1, Math.max(0, (scrollY - P1_END) / P2_SCROLL));

    // ── Estilos da imagem ──────────────────────────────────────────────────
    // Fase 1: top cresce de 0 → NAVBAR_BOTTOM (imagem "descola" para baixo do navbar)
    const topInset = p1 * NAVBAR_BOTTOM;

    // Fase 2: translateY sobe a imagem de 0 → -(vh + NAVBAR_BOTTOM)
    // Assim a imagem sobe, passa pelo navbar e sai pelo topo
    const slideUp = p2 * (vh + NAVBAR_BOTTOM);

    // Border-radius suave enquanto assenta
    const radius = p1 * 12;

    const imgStyle: React.CSSProperties = {
        position:     'absolute',
        top:          `${topInset}px`,
        left:         0,
        right:        0,
        bottom:       0,
        borderRadius: `${radius}px`,
        overflow:     'hidden',
        transform:    `translateY(-${slideUp}px)`,
        willChange:   'transform, top',
        // Transição suave apenas quando em repouso (scroll=0)
        transition: scrollY < 3
            ? 'top 0.5s cubic-bezier(0.16,1,0.3,1), border-radius 0.5s'
            : 'none',
    };

    // Texto desaparece rapidamente durante a Fase 1
    const textOpacity = Math.max(0, 1 - p1 * 2.5);

    return (
        <div ref={wrapperRef} className="hero" style={{ height: `calc(100vh + ${ANIM_TOTAL + 60}px)` }}>
            {/* Verde do site aparece quando a imagem se afasta */}
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

                {/* Texto hero — desaparece na Fase 1 */}
                <div
                    className="relative z-10 text-center px-4 max-w-5xl mt-24"
                    style={{
                        opacity:        textOpacity,
                        pointerEvents:  p1 > 0.1 ? 'none' : 'auto',
                        transition:     'opacity 0.15s ease',
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

                {/* Scroll indicator — desaparece rapidamente */}
                <div
                    className="absolute bottom-12 left-1/2 -translate-x-1/2 text-white flex flex-col items-center gap-4 cursor-pointer hover:text-[#C4A484] transition-all duration-500 z-20"
                    style={{
                        opacity:       Math.max(0, (1 - p1 * 5) * 0.8),
                        pointerEvents: p1 > 0.05 ? 'none' : 'auto',
                    }}
                    onClick={onReservar}
                >
                    <div className="w-[1px] h-20 bg-gradient-to-b from-white to-transparent" />
                    <span className="text-[10px] tracking-widest uppercase font-bold">{t('hero_ver_dispo')}</span>
                </div>

                {/* Dots */}
                <div
                    className="absolute bottom-8 right-8 flex gap-2 z-20"
                    style={{ opacity: Math.max(0, 1 - p1 * 3) }}
                >
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
