"use client";
import React, { useRef, useEffect, useState } from 'react';

interface HeroBannerProps {
    t: (key: string) => string;
    onReservar: () => void;
}

// ─── Scroll-shrink config (matches provided Setronix script) ──────────────────
const EFFECT = {
    scaleStart:    1.0,    // scale at top
    scaleEnd:      0.82,   // scale when effect completes
    translateYEnd: 80,     // px the image drifts downward
    fadeContent:   true,   // text fades out
    // scrollDistance is derived from sticky offset (80% of viewport height)
    // so the effect completes exactly as the next section appears
};

const HERO_IMAGES = [
    "https://templarportugal.com/media/images/TZC03808-min.original.jpg",
    "https://templarportugal.com/media/images/TZC03798-min.original.jpg",
    "https://templarportugal.com/media/images/Castelo_e_Paao_dos_Condes_de_OurCm_iluminado.original.jpg"
];

function lerp(a: number, b: number, t: number) {
    return a + (b - a) * Math.min(Math.max(t, 0), 1);
}

export default function HeroBanner({ t, onReservar }: HeroBannerProps) {
    const [currentHeroIndex, setCurrentHeroIndex] = useState(0);
    const imageWrapRef   = useRef<HTMLDivElement>(null);
    const contentRef     = useRef<HTMLDivElement>(null);
    const rafRef         = useRef<number | null>(null);
    const ticking        = useRef(false);

    // ── Carousel ──────────────────────────────────────────────────────────────
    useEffect(() => {
        const id = setInterval(
            () => setCurrentHeroIndex(p => (p + 1) % HERO_IMAGES.length),
            5000
        );
        return () => clearInterval(id);
    }, []);

    // ── Scroll-shrink effect ───────────────────────────────────────────────────
    // Uses requestAnimationFrame + direct DOM style writes → zero React re-renders
    // Respects prefers-reduced-motion per ui-ux-pro-max guidelines
    useEffect(() => {
        const isMobile   = window.matchMedia('(max-width: 768px)').matches;
        const noMotion   = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (isMobile || noMotion) return;

        const scrollDist = window.innerHeight * 0.8; // matches outer 180vh – 100vh

        function update() {
            const progress = Math.min(window.scrollY / scrollDist, 1);

            if (imageWrapRef.current) {
                const scale     = lerp(EFFECT.scaleStart, EFFECT.scaleEnd, progress);
                const translateY = lerp(0, EFFECT.translateYEnd, progress);
                imageWrapRef.current.style.transform =
                    `scale(${scale}) translateY(${translateY}px)`;
            }

            if (EFFECT.fadeContent && contentRef.current) {
                const opacity   = Math.max(0, lerp(1, 0, progress * 1.4));
                const shiftY    = lerp(0, EFFECT.translateYEnd * 0.5, progress);
                contentRef.current.style.opacity   = String(opacity);
                contentRef.current.style.transform = `translateY(${shiftY}px)`;
            }

            ticking.current = false;
        }

        function onScroll() {
            if (!ticking.current) {
                rafRef.current = requestAnimationFrame(update);
                ticking.current = true;
            }
        }

        window.addEventListener('scroll', onScroll, { passive: true });
        update(); // apply correct initial state

        return () => {
            window.removeEventListener('scroll', onScroll);
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
            // Reset styles on unmount
            if (imageWrapRef.current) imageWrapRef.current.style.transform = '';
            if (contentRef.current)   { contentRef.current.style.opacity = ''; contentRef.current.style.transform = ''; }
        };
    }, []);

    return (
        /*
         * Outer container is 180vh so the sticky hero "pins" for 80vh of scroll,
         * giving the shrink effect a natural timeline before the next section
         * scrolls into view. This is equivalent to GSAP ScrollTrigger pin+scrub.
         */
        <div className="hero relative" style={{ height: '180vh' }}>
            <section
                className="sticky top-0 w-full h-screen flex items-center justify-center overflow-hidden bg-black"
                style={{ zIndex: 1 }}
            >
                {/* ── Image wrapper — receives scale + translateY from scroll ── */}
                <div
                    ref={imageWrapRef}
                    className="absolute inset-0"
                    style={{
                        transformOrigin: 'center top',
                        willChange: 'transform',
                    }}
                >
                    {/* Carousel slides */}
                    {HERO_IMAGES.map((img, idx) => (
                        <div
                            key={idx}
                            className={`absolute inset-0 bg-cover bg-center transition-opacity duration-1000 ${
                                idx === currentHeroIndex ? 'opacity-100' : 'opacity-0'
                            }`}
                            style={{ backgroundImage: `url("${img}")` }}
                        />
                    ))}

                    {/* Gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/30 to-black/60" />
                </div>

                {/* ── Hero content — fades out on scroll ── */}
                <div
                    ref={contentRef}
                    className="relative z-10 text-center px-4 max-w-5xl mt-24"
                    style={{ willChange: 'transform, opacity' }}
                >
                    <p className="text-white text-xs md:text-sm tracking-widest uppercase mb-8 font-light drop-shadow-md">
                        {t('hero_subtitle')}
                    </p>
                    <h2 className="text-5xl md:text-7xl lg:text-8xl text-white mb-8 font-serif font-light leading-tight drop-shadow-lg">
                        {t('hero_title')} <br />
                        <i className="font-serif text-[#C4A484]">{t('hero_title_exclusividade')}</i>
                    </h2>
                </div>

                {/* ── Scroll indicator ── */}
                <div
                    className="absolute bottom-12 left-1/2 -translate-x-1/2 text-white flex flex-col items-center gap-4 opacity-80 cursor-pointer hover:text-[#C4A484] hover:opacity-100 transition-colors z-10"
                    onClick={onReservar}
                >
                    <div className="w-[1px] h-20 bg-gradient-to-b from-white to-transparent" />
                    <span className="text-[10px] tracking-widest uppercase font-bold">{t('hero_ver_dispo')}</span>
                </div>

                {/* ── Carousel dots ── */}
                <div className="absolute bottom-8 right-8 flex gap-2 z-10">
                    {HERO_IMAGES.map((_, idx) => (
                        <button
                            key={idx}
                            type="button"
                            aria-label={`Slide ${idx + 1}`}
                            onClick={() => setCurrentHeroIndex(idx)}
                            className={`w-1.5 h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                                idx === currentHeroIndex
                                    ? 'bg-[#C4A484] w-5'
                                    : 'bg-white/40 hover:bg-white/70'
                            }`}
                        />
                    ))}
                </div>
            </section>
        </div>
    );
}
