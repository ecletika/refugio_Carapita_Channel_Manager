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

    // ── Parâmetros ────────────────────────────────────────────────────────────
    // Navbar pill: top=12px, altura≈72px → fundo ≈ 84px + 6px gap = 90px
    const NAVBAR_BOTTOM = 90;    // px — topo da imagem encolhida
    const SCALE_FINAL   = 0.70;  // escala final
    const SHRINK_END    = 80;    // px de scroll para completar o shrink

    // t1: progresso do shrink (0→1)
    const t1    = Math.min(1, Math.max(0, scrollY / SHRINK_END));
    const scale = 1 - t1 * (1 - SCALE_FINAL); // 1 → 0.70

    // ── Posição da imagem ─────────────────────────────────────────────────────
    // Usamos position absolute com top/left/right/bottom calculados
    // em vez de transform, para evitar o problema do transformOrigin.
    //
    // Estado inicial (t1=0):
    //   top:0, left:0, right:0, bottom:0 → cobre 100% do ecrã
    //
    // Estado encolhido (t1=1):
    //   A imagem tem scale 0.70 → largura = 70vw, altura = 70vh
    //   Centramos horizontalmente: left = 15vw, right = 15vw
    //   Topo: NAVBAR_BOTTOM = 90px
    //   Fundo: NAVBAR_BOTTOM + 70vh
    //
    // Interpolamos entre os dois estados.

    const vh = typeof window !== 'undefined' ? window.innerHeight : 800;
    const vw = typeof window !== 'undefined' ? window.innerWidth  : 1440;

    // Margens horizontais: 0 → 15% da largura
    const marginH = t1 * vw * 0.15;
    // Topo: 0 → NAVBAR_BOTTOM
    const topVal  = t1 * NAVBAR_BOTTOM;
    // Fundo: 0 → NAVBAR_BOTTOM + vh*0.70
    // bottom = vh - (topVal + vh*scale) → distância do fundo do viewport
    const bottomVal = vh - (topVal + vh * scale);

    // Fase 2: após shrink completo, imagem desce até fundo do viewport
    // Quando t2=1: topVal = vh*(1-SCALE_FINAL) = vh*0.30, bottomVal = 0
    const SLIDE_END = 160;
    const t2 = Math.min(1, Math.max(0, (scrollY - SHRINK_END) / (SLIDE_END - SHRINK_END)));

    // Posição final fase 2: topo = vh - vh*SCALE_FINAL = vh*0.30, bottom = 0
    const topFinal    = vh * (1 - SCALE_FINAL);   // ≈ 240px
    const bottomFinal = 0;

    const finalTop    = t1 < 1 ? topVal    : NAVBAR_BOTTOM + t2 * (topFinal    - NAVBAR_BOTTOM);
    const finalBottom = t1 < 1 ? bottomVal : (vh - NAVBAR_BOTTOM - vh * SCALE_FINAL) + t2 * (bottomFinal - (vh - NAVBAR_BOTTOM - vh * SCALE_FINAL));
    const finalLeft   = marginH;
    const finalRight  = marginH;

    const isShrunken  = t1 > 0.05;
    const textOpacity = Math.max(0, 1 - t1 * 2.5);

    const imgStyle: React.CSSProperties = {
        position: 'absolute',
        top:    `${finalTop}px`,
        bottom: `${finalBottom}px`,
        left:   `${finalLeft}px`,
        right:  `${finalRight}px`,
        transition: scrollY < 3
            ? 'top 0.6s ease-in-out, bottom 0.6s ease-in-out, left 0.6s ease-in-out, right 0.6s ease-in-out, border-radius 0.5s, box-shadow 0.5s'
            : 'none',
        borderRadius: isShrunken ? '18px' : '0px',
        boxShadow:    isShrunken ? '0 20px 60px rgba(0,0,0,0.55)' : 'none',
        overflow: 'hidden',
        willChange: 'top, bottom, left, right',
    };

    return (
        <div ref={wrapperRef} className="hero" style={{ height: 'calc(100vh + 180px)' }}>
            {/* bg-[#1E3932] = cor verde do site, aparece quando a imagem encolhe */}
            <section
                className="sticky top-0 w-full h-screen flex items-center justify-center"
                style={{ zIndex: 1, background: '#1E3932' }}
            >
                {/* Imagem posicionada absolutamente */}
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
                        pointerEvents: t1 > 0.1 ? 'none' : 'auto',
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
                        opacity: Math.max(0, (1 - t1 * 4) * 0.8),
                        pointerEvents: t1 > 0.1 ? 'none' : 'auto',
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
