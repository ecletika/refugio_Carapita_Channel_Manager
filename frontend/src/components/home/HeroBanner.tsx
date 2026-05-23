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

    // Scroll tracker — RAF para 60fps sem jank
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
    // Navbar pill: top=12px, altura≈72px → fundo da navbar ≈ 84px
    // Gap abaixo da navbar: 6px
    // Topo da imagem encolhida: 90px
    const NAVBAR_BOTTOM = 90;   // px — onde a imagem encolhida deve começar
    const SCALE_FINAL   = 0.70; // escala final da imagem

    // Fase 1: 0→80px scroll → shrink
    const SHRINK_END = 80;
    const t1 = Math.min(1, Math.max(0, scrollY / SHRINK_END));

    // Escala actual: 1 → 0.70
    const scale = 1 - t1 * (1 - SCALE_FINAL);

    // Fase 2: 80px→160px scroll → imagem desce do topo da navbar até ao fundo do viewport
    // Quando t2=0: imagem está em top=NAVBAR_BOTTOM
    // Quando t2=1: imagem está em top=100vh (saiu pelo fundo)
    const SLIDE_START = SHRINK_END;
    const SLIDE_END   = 160;
    const t2 = Math.min(1, Math.max(0, (scrollY - SLIDE_START) / (SLIDE_END - SLIDE_START)));

    // A imagem encolhida tem altura = 100vh * 0.70
    // Para sair pelo fundo: translateY final = 100vh - NAVBAR_BOTTOM
    // Mas queremos que desça apenas até ao fundo do preto (= fundo do viewport)
    // → translateY máximo = viewport height - (NAVBAR_BOTTOM + scaled height)
    //   = vh - (90 + vh*0.70) = vh*0.30 - 90
    // Simplificando: a imagem desce até o seu fundo tocar o fundo do viewport
    // fundo da imagem = NAVBAR_BOTTOM + vh*scale + extraY
    // queremos fundo = vh → extraY = vh - NAVBAR_BOTTOM - vh*scale = vh*(1-scale) - NAVBAR_BOTTOM

    // translateY total:
    // Fase 1: a imagem está centrada (scale a partir do centro) → precisamos de mover para NAVBAR_BOTTOM
    //   Com scale(s) a partir do centro, o topo visual fica em: (1-s)/2 * vh
    //   Queremos topo visual em NAVBAR_BOTTOM → translateY = NAVBAR_BOTTOM - (1-s)/2 * vh
    // Fase 2: desce progressivamente até fundo do viewport

    // Cálculo correcto com transformOrigin: 'center center' (default)
    // topo visual = translateY + (1 - scale) / 2 * vh
    // queremos topo visual = NAVBAR_BOTTOM
    // → translateY = NAVBAR_BOTTOM - (1 - scale) / 2 * vh

    // Para fase 2, queremos fundo visual = vh
    // fundo visual = translateY + (1 + scale) / 2 * vh  (com origin center)
    // → translateY_max = vh - (1 + SCALE_FINAL) / 2 * vh = vh * (1 - (1 + SCALE_FINAL) / 2)
    //                  = vh * (1 - SCALE_FINAL) / 2

    // Interpolamos entre translateY_fase1 e translateY_max
    const vh = typeof window !== 'undefined' ? window.innerHeight : 800;

    const translateY_fase1 = NAVBAR_BOTTOM - (1 - scale) / 2 * vh;
    const translateY_max   = vh * (1 - SCALE_FINAL) / 2; // fundo toca o fundo do viewport

    const translateY = t1 < 1
        ? translateY_fase1
        : translateY_fase1 + t2 * (translateY_max - translateY_fase1);

    const isShrunken = t1 > 0.05;
    const textOpacity = Math.max(0, 1 - t1 * 2.5);

    const imgStyle: React.CSSProperties = {
        position: 'absolute',
        inset: 0,
        transform: `translateY(${translateY}px) scale(${scale})`,
        transformOrigin: 'center center',
        transition: scrollY < 3 ? 'transform 0.6s ease-in-out, border-radius 0.5s, box-shadow 0.5s' : 'none',
        borderRadius: isShrunken ? '18px' : '0px',
        boxShadow: isShrunken ? '0 20px 60px rgba(0,0,0,0.6)' : 'none',
        overflow: 'hidden',
        willChange: 'transform',
    };

    return (
        <div ref={wrapperRef} className="hero" style={{ height: '180vh' }}>
            <section
                className="sticky top-0 w-full h-screen bg-black flex items-center justify-center"
                style={{ zIndex: 1 }}
            >
                {/* Wrapper de imagens com transform */}
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
