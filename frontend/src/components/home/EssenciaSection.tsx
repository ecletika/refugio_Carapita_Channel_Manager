"use client";
import React, { useEffect, useRef } from 'react';

interface EssenciaSectionProps {
    t: (key: string) => string;
    scrollTo?: (id: string) => void;
}

/* ─── ease helper ───────────────────────────────────────────── */
function easeInOutCubic(t: number) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

export default function EssenciaSection({ t, scrollTo }: EssenciaSectionProps) {
    /* ── refs ──────────────────────────────────────────────────── */
    const wrapperRef   = useRef<HTMLDivElement>(null);
    const sceneRef     = useRef<HTMLDivElement>(null);
    const borderRef    = useRef<HTMLDivElement>(null);
    const ringRef      = useRef<HTMLDivElement>(null);
    const textRef      = useRef<HTMLDivElement>(null);
    const hintRef      = useRef<HTMLDivElement>(null);
    const storyItemsRef = useRef<(HTMLDivElement | null)[]>([]);
    const rafRef       = useRef<number | null>(null);

    /* ── scroll-driven portal animation ───────────────────────── */
    useEffect(() => {
        const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        /* ── reduced-motion static fallback ── */
        if (reduced) {
            if (sceneRef.current)  sceneRef.current.style.clipPath  = 'circle(150% at 50% 50%)';
            if (textRef.current)  { textRef.current.style.opacity   = '1'; textRef.current.style.transform = 'none'; }
            if (hintRef.current)    hintRef.current.style.opacity   = '0';
            return;
        }

        const update = () => {
            if (!wrapperRef.current) return;
            const rect       = wrapperRef.current.getBoundingClientRect();
            const totalScroll = wrapperRef.current.offsetHeight - window.innerHeight;
            const progress   = Math.max(0, Math.min(1, -rect.top / totalScroll));

            /* ── phase 1 (0→0.65): circle expands 10% → 150% ── */
            const clipProgress = Math.min(1, progress / 0.65);
            const eased        = easeInOutCubic(clipProgress);
            const radius       = (10 + eased * 140).toFixed(2);

            if (sceneRef.current) {
                sceneRef.current.style.clipPath  = `circle(${radius}% at 50% 50%)`;
                sceneRef.current.style.transform = `translateY(-${(progress * 70).toFixed(1)}px)`;
            }

            /* ring contracts as circle grows */
            if (ringRef.current) {
                ringRef.current.style.opacity = Math.max(0, 1 - progress * 14).toFixed(3);
                const ringDim = `${(10 + eased * 140) * 1.95}vmin`;
                ringRef.current.style.width  = ringDim;
                ringRef.current.style.height = ringDim;
            }

            /* border vignette melts away */
            if (borderRef.current) {
                const bw = Math.max(0, 80 * (1 - clipProgress * 1.6));
                borderRef.current.style.boxShadow = `inset 0 0 0 ${bw.toFixed(1)}px #0D1F1B`;
            }

            /* ── phase 2 (0.42→1.0): text materialises ── */
            const textP = Math.min(1, Math.max(0, (progress - 0.42) / 0.58) * 2);
            if (textRef.current) {
                textRef.current.style.opacity   = textP.toFixed(3);
                textRef.current.style.transform = `translateY(${((1 - textP) * 32).toFixed(1)}px)`;
            }

            /* scroll hint fades fast */
            if (hintRef.current) {
                hintRef.current.style.opacity = Math.max(0, 1 - progress * 10).toFixed(3);
            }
        };

        const onScroll = () => {
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
            rafRef.current = requestAnimationFrame(update);
        };

        window.addEventListener('scroll', onScroll, { passive: true });
        update();
        return () => {
            window.removeEventListener('scroll', onScroll);
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
        };
    }, []);

    /* ── IntersectionObserver — story section fade-ins ─────────── */
    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        const el = entry.target as HTMLElement;
                        el.style.opacity   = '1';
                        el.style.transform = 'translateY(0)';
                        observer.unobserve(el);
                    }
                });
            },
            { threshold: 0.12 }
        );

        storyItemsRef.current.forEach((el, i) => {
            if (!el) return;
            el.style.opacity    = '0';
            el.style.transform  = 'translateY(36px)';
            el.style.transition = `opacity 0.85s cubic-bezier(.4,0,.2,1) ${i * 90}ms,
                                   transform 0.85s cubic-bezier(.4,0,.2,1) ${i * 90}ms`;
            observer.observe(el);
        });

        return () => observer.disconnect();
    }, []);

    const sr = (i: number) => (el: HTMLDivElement | null) => { storyItemsRef.current[i] = el; };

    /* ─────────────────────────────────────────────────────────── */
    return (
        <>
            {/* ══════════════════════════════════════════════════
                PART 1 — "A Chegada" — Portal scroll animation
            ══════════════════════════════════════════════════ */}
            <div
                id="a-essencia"
                ref={wrapperRef}
                style={{ height: '280vh' }}
                className="relative"
            >
                <div className="sticky top-0 h-screen bg-[#0D1F1B] overflow-hidden">

                    {/* Scene — hotel image, clipped to expanding circle */}
                    <div
                        ref={sceneRef}
                        className="absolute will-change-transform"
                        style={{
                            inset: '-8%',
                            backgroundImage: "url('/essencia_carapita.jpg')",
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                            clipPath: 'circle(10% at 50% 50%)',
                        }}
                    />

                    {/* Radial darkening gradient over scene */}
                    <div
                        className="absolute inset-0 pointer-events-none z-[5]"
                        style={{
                            background:
                                'radial-gradient(ellipse at center, transparent 20%, rgba(10,22,18,.45) 65%, rgba(10,22,18,.82) 100%)',
                        }}
                    />

                    {/* Box-shadow vignette — collapses as circle grows */}
                    <div
                        ref={borderRef}
                        className="absolute inset-0 pointer-events-none z-[10]"
                        style={{ boxShadow: 'inset 0 0 0 80px #0D1F1B' }}
                    />

                    {/* Gold ring — keyhole hint */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-[15]">
                        <div
                            ref={ringRef}
                            className="rounded-full border border-[#C4A484]/50"
                            style={{ width: '19vmin', height: '19vmin' }}
                        />
                    </div>

                    {/* Overlay text — materialises inside the scene */}
                    <div
                        ref={textRef}
                        className="absolute inset-0 flex flex-col items-center justify-end z-[20] pb-[9vh] px-6 text-center"
                        style={{ opacity: 0, transform: 'translateY(32px)' }}
                    >
                        <span className="block text-[#C4A484] text-[9px] md:text-[10px] uppercase tracking-[0.42em] font-medium mb-5">
                            {t('essencia_tag')}
                        </span>

                        <h2
                            className="font-serif text-[#FAF8F2] font-light leading-[1.1] mb-5"
                            style={{ fontSize: 'clamp(36px, 6vw, 82px)', letterSpacing: '0.02em' }}
                        >
                            {t('essencia_title')}
                        </h2>

                        <div className="w-10 h-px bg-[#C4A484]/50 mb-6" />

                        <p
                            className="text-[#FAF8F2]/55 font-light italic leading-relaxed max-w-[440px]"
                            style={{ fontSize: 'clamp(12px, 1.3vw, 15px)' }}
                        >
                            {t('essencia_p1')}
                        </p>
                    </div>

                    {/* Scroll hint */}
                    <div
                        ref={hintRef}
                        className="absolute bottom-7 left-1/2 -translate-x-1/2 flex flex-col items-center gap-[6px] z-[25] pointer-events-none"
                    >
                        <span className="text-[#C4A484]/45 text-[8px] uppercase tracking-[0.38em]">scroll</span>
                        <span className="block w-px h-7 bg-gradient-to-b from-[#C4A484]/60 to-transparent" />
                    </div>
                </div>
            </div>

            {/* ══════════════════════════════════════════════════
                PART 2 — "Raízes" — Story section
            ══════════════════════════════════════════════════ */}
            <div className="bg-[#0D1F1B] px-5 md:px-12 lg:px-20 py-20 lg:py-32">
                <div className="max-w-[1280px] mx-auto">

                    {/* Section eyebrow */}
                    <div
                        ref={sr(0)}
                        className="flex items-center gap-5 mb-16 lg:mb-24"
                    >
                        <div className="w-7 h-px bg-[#C4A484]/40" />
                        <span className="text-[#C4A484] text-[8px] md:text-[9px] uppercase tracking-[0.42em] font-medium">
                            A Nossa História
                        </span>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr] gap-14 lg:gap-24 items-start">

                        {/* ── Left: portrait image ── */}
                        <div ref={sr(1)} className="relative">
                            {/* Gold corner accents */}
                            <div className="absolute -top-3 -left-3 w-12 h-12 border-t border-l border-[#C4A484]/35 z-10 pointer-events-none" />
                            <div className="absolute -bottom-3 -right-3 w-12 h-12 border-b border-r border-[#C4A484]/35 z-10 pointer-events-none" />

                            <div className="overflow-hidden aspect-[3/4]">
                                <img
                                    src="/essencia_carapita.jpg"
                                    alt="Refúgio Carapita — a essência"
                                    className="w-full h-full object-cover scale-[1.04] hover:scale-100 transition-transform duration-[3000ms] ease-out"
                                />
                            </div>

                            {/* Floating era badge */}
                            <div
                                className="absolute bottom-7 -right-4 md:-right-7 bg-[#1E3932]/90 border border-[#C4A484]/20
                                           px-5 py-4 shadow-2xl backdrop-blur-sm"
                            >
                                <span className="text-[#C4A484] text-[7px] uppercase tracking-[0.32em] block mb-1">Fundado</span>
                                <span className="text-[#FAF8F2] font-serif text-[28px] font-light leading-none">XVIII</span>
                            </div>
                        </div>

                        {/* ── Right: prose story ── */}
                        <div className="flex flex-col justify-center lg:pt-10">

                            <div ref={sr(2)} className="mb-9">
                                <h3
                                    className="font-serif text-[#FAF8F2] font-light leading-[1.2]"
                                    style={{ fontSize: 'clamp(30px, 3.8vw, 54px)' }}
                                >
                                    Uma casa com alma,
                                    <br />
                                    <em className="text-[#C4A484] not-italic">no coração de Portugal.</em>
                                </h3>
                            </div>

                            <div
                                ref={sr(3)}
                                className="border-l border-[#C4A484]/25 pl-6 space-y-5 mb-11"
                            >
                                <p className="text-[#FAF8F2]/55 font-light leading-[1.95] text-[13px] md:text-[14px]">
                                    {t('essencia_p1')}
                                </p>
                                <p className="text-[#FAF8F2]/55 font-light leading-[1.95] text-[13px] md:text-[14px]">
                                    {t('essencia_p2')}
                                </p>
                            </div>

                            {/* CTA — gold line expands on hover */}
                            <div ref={sr(4)}>
                                <button
                                    onClick={() => scrollTo?.('alojamento')}
                                    className="group inline-flex items-center gap-4 text-[#C4A484]
                                               text-[9px] uppercase tracking-[0.35em] cursor-pointer
                                               hover:gap-7 transition-all duration-500"
                                >
                                    <span>Descobrir o Refúgio</span>
                                    <span className="block w-8 h-px bg-[#C4A484]/60 group-hover:w-12
                                                    transition-all duration-500" />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* ── Bottom triptyque stats ── */}
                    <div
                        ref={sr(5)}
                        className="grid grid-cols-1 sm:grid-cols-3 mt-20 lg:mt-28
                                   border border-[#C4A484]/10 divide-y sm:divide-y-0 sm:divide-x divide-[#C4A484]/10"
                    >
                        {[
                            { label: 'Localização',  value: 'Ourém · Portugal' },
                            { label: 'Natureza',     value: "Serra d'Aire" },
                            { label: 'Experiência',  value: 'Charme & Requinte' },
                        ].map(({ label, value }) => (
                            <div key={label} className="px-8 py-8">
                                <span className="text-[#C4A484] text-[7px] md:text-[8px] uppercase tracking-[0.36em] block mb-2">
                                    {label}
                                </span>
                                <span className="text-[#FAF8F2]/75 font-serif text-[17px] md:text-lg font-light">
                                    {value}
                                </span>
                            </div>
                        ))}
                    </div>

                </div>
            </div>
        </>
    );
}
