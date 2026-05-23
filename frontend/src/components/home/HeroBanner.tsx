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

export default function HeroBanner({ t, onReservar }: HeroBannerProps) {
    const [currentHeroIndex, setCurrentHeroIndex] = useState(0);

    // ── Carousel automático ───────────────────────────────────────────────────
    useEffect(() => {
        const id = setInterval(
            () => setCurrentHeroIndex(p => (p + 1) % HERO_IMAGES.length),
            5000
        );
        return () => clearInterval(id);
    }, []);

    // ── Scroll shrink — script exacto testado e confirmado ────────────────────
    // Usa document.querySelector com os mesmos seletores do script vanilla:
    //   .hero .absolute.inset-0  →  wrapper das imagens
    //   .hero .relative.z-10     →  conteúdo do hero (texto)
    useEffect(() => {
        const slidesWrapper = document.querySelector('.hero .absolute.inset-0') as HTMLElement | null;
        const heroContent   = document.querySelector('.hero .relative.z-10')   as HTMLElement | null;

        if (!slidesWrapper) return;

        const SCALE_START   = 1.0;
        const SCALE_END     = 0.80;
        const TRANSLATE_END = 60;
        const SCROLL_RANGE  = 500;

        slidesWrapper.style.transformOrigin = 'center top';
        slidesWrapper.style.willChange      = 'transform';
        if (heroContent) heroContent.style.willChange = 'transform, opacity';

        let ticking = false;

        function clamp(v: number, a: number, b: number) {
            return Math.min(Math.max(v, a), b);
        }
        function lerp(s: number, e: number, t: number) {
            return s + (e - s) * clamp(t, 0, 1);
        }

        function update() {
            const p  = clamp(window.scrollY / SCROLL_RANGE, 0, 1);
            const sc = lerp(SCALE_START, SCALE_END, p);
            const ty = lerp(0, TRANSLATE_END, p);

            slidesWrapper.style.transform =
                'scale(' + sc + ') translateY(' + ty + 'px)';

            if (heroContent) {
                heroContent.style.opacity   = String(clamp(1 - p * 1.8, 0, 1));
                heroContent.style.transform = 'translateY(' + (ty * 0.4) + 'px)';
            }

            ticking = false;
        }

        function onScroll() {
            if (!ticking) {
                requestAnimationFrame(update);
                ticking = true;
            }
        }

        window.addEventListener('scroll', onScroll, { passive: true });
        update(); // estado inicial correto

        return () => {
            window.removeEventListener('scroll', onScroll);
            slidesWrapper.style.transform      = '';
            slidesWrapper.style.transformOrigin = '';
            slidesWrapper.style.willChange      = '';
            if (heroContent) {
                heroContent.style.opacity   = '';
                heroContent.style.transform = '';
                heroContent.style.willChange = '';
            }
        };
    }, []);

    return (
        /*
         * ESTRUTURA OBRIGATÓRIA — os seletores do script dependem disto:
         *   div.hero                          ← âncora dos seletores
         *     section.sticky.top-0.h-screen   ← container fixo
         *       div.absolute.inset-0          ← ← ← ANIMADO (slides + overlay)
         *       div.relative.z-10             ← ← ← ANIMADO (texto)
         *
         * O section NÃO tem overflow-hidden para o scale não ser cortado.
         * A altura de 180vh cria o "espaço de scroll" enquanto o section fica sticky.
         */
        <div className="hero" style={{ height: '180vh' }}>
            <section
                className="sticky top-0 w-full h-screen flex items-center justify-center bg-black"
                style={{ zIndex: 1 }}
            >

                {/* ── Wrapper das imagens (ANIMADO pelo script) ── */}
                <div className="absolute inset-0">
                    {HERO_IMAGES.map((img, idx) => (
                        <div
                            key={idx}
                            className={`absolute inset-0 bg-cover bg-center transition-opacity duration-1000 ${
                                idx === currentHeroIndex ? 'opacity-100' : 'opacity-0'
                            }`}
                            style={{ backgroundImage: `url("${img}")` }}
                        />
                    ))}
                    {/* Overlay escuro */}
                    <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/30 to-black/55" />
                </div>

                {/* ── Conteúdo / Texto (ANIMADO pelo script) ── */}
                <div className="relative z-10 text-center px-4 max-w-5xl mt-24 pointer-events-none">
                    <p className="text-white text-xs md:text-sm tracking-widest uppercase mb-8 font-light drop-shadow-md">
                        {t('hero_subtitle')}
                    </p>
                    <h2 className="text-5xl md:text-7xl lg:text-8xl text-white mb-8 font-serif font-light leading-tight drop-shadow-lg">
                        {t('hero_title')} <br />
                        <i className="font-serif text-[#C4A484]">{t('hero_title_exclusividade')}</i>
                    </h2>
                </div>

                {/* ── Indicador de scroll (não é animado) ── */}
                <div
                    className="absolute bottom-12 left-1/2 -translate-x-1/2 text-white flex flex-col items-center gap-4 opacity-80 cursor-pointer hover:text-[#C4A484] hover:opacity-100 transition-colors z-20 pointer-events-auto"
                    onClick={onReservar}
                >
                    <div className="w-[1px] h-20 bg-gradient-to-b from-white to-transparent" />
                    <span className="text-[10px] tracking-widest uppercase font-bold">{t('hero_ver_dispo')}</span>
                </div>

                {/* ── Dots do carrossel ── */}
                <div className="absolute bottom-8 right-8 flex gap-2 z-20">
                    {HERO_IMAGES.map((_, idx) => (
                        <button
                            key={idx}
                            type="button"
                            aria-label={`Slide ${idx + 1}`}
                            onClick={() => setCurrentHeroIndex(idx)}
                            className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                                idx === currentHeroIndex
                                    ? 'bg-[#C4A484] w-5'
                                    : 'bg-white/40 w-1.5 hover:bg-white/70'
                            }`}
                        />
                    ))}
                </div>

            </section>
        </div>
    );
}
