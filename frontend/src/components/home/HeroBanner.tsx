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

    // Scroll tracker — RAF para 60fps
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

    // ── Lógica ────────────────────────────────────────────────────────────────
    //
    // Estado inicial (scrollY=0):
    //   - imagem cobre 100% do ecrã, sem preto visível
    //   - navbar transparente por cima
    //
    // Fase 1 (0 → 80px scroll): shrink
    //   - imagem encolhe de scale(1) → scale(0.70)
    //   - transformOrigin: 'top center' → ancora pelo topo
    //   - o topo da imagem fica no topo do viewport (0px)
    //   - depois deslocamos para baixo com translateY para ficar abaixo da navbar
    //
    // Fase 2 (80px → 160px scroll): slide down
    //   - imagem desce até o fundo tocar o fundo do viewport (= fundo do preto)
    //
    // Para não ter faixa preta em cima no estado inicial:
    //   - a section NÃO tem overflow:hidden
    //   - a imagem começa com scale(1) e translateY(0) → cobre tudo
    //   - o preto só aparece quando a imagem encolhe (é o bg da section)

    const SCALE_FINAL   = 0.70;
    const NAVBAR_GAP    = 90;   // px — topo da imagem encolhida (abaixo da navbar pill)

    // Fase 1
    const SHRINK_END = 80;
    const t1 = Math.min(1, Math.max(0, scrollY / SHRINK_END));
    const scale = 1 - t1 * (1 - SCALE_FINAL); // 1 → 0.70

    // Com transformOrigin 'top center', scale reduz a imagem pelo topo.
    // O topo visual fica em translateY (não muda com scale quando origin=top).
    // Queremos topo visual = NAVBAR_GAP quando t1=1.
    const translateY_fase1 = t1 * NAVBAR_GAP; // 0 → 90px

    // Fase 2: deslizar para baixo
    // Fundo visual da imagem = translateY + scale * vh
    // Queremos fundo visual = vh (toca o fundo do viewport)
    // → translateY_max = vh - scale * vh = vh * (1 - SCALE_FINAL)
    const SLIDE_END = 160;
    const t2 = Math.min(1, Math.max(0, (scrollY - SHRINK_END) / (SLIDE_END - SHRINK_END)));

    const vh = typeof window !== 'undefined' ? window.innerHeight : 800;
    const translateY_max = vh * (1 - SCALE_FINAL); // ≈ 240px para vh=800

    const translateY = t1 < 1
        ? translateY_fase1
        : NAVBAR_GAP + t2 * (translateY_max - NAVBAR_GAP);

    const isShrunken    = t1 > 0.05;
    const textOpacity   = Math.max(0, 1 - t1 * 2.5);

    const imgStyle: React.CSSProperties = {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        transform: `translateY(${translateY}px) scale(${scale})`,
        transformOrigin: 'top center',
        // Só anima suavemente quando volta ao topo (scroll=0)
        transition: scrollY < 3 ? 'transform 0.6s ease-in-out, border-radius 0.5s, box-shadow 0.5s' : 'none',
        borderRadius: isShrunken ? '18px' : '0px',
        boxShadow: isShrunken ? '0 20px 60px rgba(0,0,0,0.6)' : 'none',
        overflow: 'hidden',
        willChange: 'transform',
    };

    return (
        <div ref={wrapperRef} className="hero" style={{ height: '180vh' }}>
            {/*
              * bg-black: fundo preto que aparece quando a imagem encolhe
              * SEM overflow:hidden → imagem cobre tudo no estado inicial
              */}
            <section
                className="sticky top-0 w-full h-screen bg-black flex items-center justify-center"
                style={{ zIndex: 1 }}
            >
                {/* Imagem com transform */}
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
