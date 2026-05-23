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

// Navbar pill: top 12px + height ~66px + 12px = 90px, + 4px gap = 94px
const NAVBAR_BOTTOM = 94;
// Scroll range over which the shrink animation completes
const SHRINK_SCROLL = 200;

// Exported so Header.tsx can reference it (navbar stays visible — no hide threshold needed)
export const ANIM_TOTAL = SHRINK_SCROLL;

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

    // Progress 0 → 1 as scroll goes 0 → SHRINK_SCROLL
    const p = Math.min(1, Math.max(0, scrollY / SHRINK_SCROLL));

    // Image scales from 1.0 → 0.70 (shrinks 30%)
    const scale     = 1 - p * 0.30;
    // Image top moves from 0 → NAVBAR_BOTTOM (docks 4px below navbar pill)
    const topOffset = p * NAVBAR_BOTTOM;
    // Border-radius grows as image shrinks (pill-like card)
    const radius    = p * 16;

    const imgStyle: React.CSSProperties = {
        position:        'absolute',
        top:             `${topOffset}px`,
        left:            0,
        right:           0,
        bottom:          0,
        borderRadius:    `${radius}px`,
        overflow:        'hidden',
        transform:       `scale(${scale})`,
        transformOrigin: 'top center',
        willChange:      'transform, top',
        // Smooth snap-back when scroll returns to 0
        transition: scrollY < 3
            ? 'transform 0.5s cubic-bezier(0.16,1,0.3,1), top 0.5s cubic-bezier(0.16,1,0.3,1), border-radius 0.5s'
            : 'none',
    };

    // Text fades out quickly as animation starts
    const textOpacity = Math.max(0, 1 - p * 2.5);

    return (
        <div ref={wrapperRef} className="hero" style={{ height: `calc(100vh + ${SHRINK_SCROLL + 40}px)` }}>
            {/* Green background visible as image shrinks */}
            <section
                className="sticky top-0 w-full h-screen flex items-center justify-center"
                style={{ zIndex: 1, background: '#1E3932' }}
            >
                {/* ── Image container ─────────────────────────────────────── */}
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

                {/* ── Hero text ── fades on scroll ─────────────────────────── */}
                <div
                    className="relative z-10 text-center px-4 max-w-5xl mt-24"
                    style={{
                        opacity:       textOpacity,
                        pointerEvents: p > 0.1 ? 'none' : 'auto',
                        transition:    'opacity 0.15s ease',
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

                {/* ── Scroll indicator ────────────────────────────────────── */}
                <div
                    className="absolute bottom-12 left-1/2 -translate-x-1/2 text-white flex flex-col items-center gap-4 cursor-pointer hover:text-[#C4A484] transition-all duration-500 z-20"
                    style={{
                        opacity:       Math.max(0, (1 - p * 5) * 0.8),
                        pointerEvents: p > 0.05 ? 'none' : 'auto',
                    }}
                    onClick={onReservar}
                >
                    <div className="w-[1px] h-20 bg-gradient-to-b from-white to-transparent" />
                    <span className="text-[10px] tracking-widest uppercase font-bold">{t('hero_ver_dispo')}</span>
                </div>

                {/* ── Slideshow dots ──────────────────────────────────────── */}
                <div
                    className="absolute bottom-8 right-8 flex gap-2 z-20"
                    style={{ opacity: Math.max(0, 1 - p * 3) }}
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
