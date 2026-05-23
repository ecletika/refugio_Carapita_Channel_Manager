"use client";
import React, { useEffect, useRef, useState } from 'react';

interface ImmersiveEditorialSectionProps {
    t: (key: string) => string;
    onReservar: () => void;
}

/* ─── Marquee photos ──────────────────────────────────────────────────────── */
const MARQUEE_PHOTOS = [
    {
        src: 'https://templarportugal.com/media/images/TZC03808-min.original.jpg',
        alt: 'Vista panorâmica da região de Ourém',
    },
    {
        src: '/essencia_carapita.jpg',
        alt: 'Refúgio Carapita — exterior',
    },
    {
        src: 'https://templarportugal.com/media/images/TZC03798-min.original.jpg',
        alt: 'Natureza intacta de Portugal Central',
    },
    {
        src: 'https://cf.bstatic.com/xdata/images/hotel/max1024x768/826730877.jpg?k=fc9b835d1bdb1169df946909e38c19b06b9131b7c3fa72703b8d7e064e45849d&o=',
        alt: 'Alojamento de charme',
    },
    {
        src: 'https://templarportugal.com/media/images/Castelo_e_Paao_dos_Condes_de_OurCm_iluminado.original.jpg',
        alt: 'Castelo de Ourém iluminado ao anoitecer',
    },
    {
        src: 'https://cf.bstatic.com/xdata/images/hotel/max1024x768/808586033.jpg?k=e38ec43a7b82ffd6a24db7470dc5cbd76365352b4ef7330b4ba3db04608921dd&o=',
        alt: 'Interior exclusivo do alojamento',
    },
];

/* ─── Stats ─────────────────────────────────────────────────────────────── */
const STATS = [
    { num: 'XXIV', ptLabel: 'séculos\nde história', enLabel: 'centuries\nof history' },
    { num: '360°', ptLabel: 'vistas\npanorâmicas', enLabel: 'panoramic\nviews' },
    { num: '4',    ptLabel: 'alojamentos\nexclusivos',  enLabel: 'exclusive\naccommodations' },
];

/* ─── Reveal hook (IntersectionObserver) ────────────────────────────────── */
function useReveal(threshold = 0.15) {
    const ref = useRef<HTMLDivElement>(null);
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const obs = new IntersectionObserver(
            ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect(); } },
            { threshold }
        );
        obs.observe(el);
        return () => obs.disconnect();
    }, [threshold]);

    return { ref, visible };
}

export default function ImmersiveEditorialSection({ t, onReservar }: ImmersiveEditorialSectionProps) {
    const { ref: textRef, visible: textVisible } = useReveal(0.1);
    const { ref: imgRef,  visible: imgVisible  } = useReveal(0.1);
    const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

    useEffect(() => {
        const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
        setPrefersReducedMotion(mq.matches);
        const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
        mq.addEventListener('change', handler);
        return () => mq.removeEventListener('change', handler);
    }, []);

    /* Detect language: EN tag is "The Refuge", PT is "O Refúgio" */
    const isEN = t('editorial_tag') === 'The Refuge';

    return (
        <section aria-label="Editorial — Sense of Place" className="w-full overflow-x-hidden">

            {/* ═══════════════════════════════════════════════════════════
                PARTE A — Editorial content (cream bg)
            ════════════════════════════════════════════════════════════ */}
            <div className="bg-[#FAF8F4] w-full py-20 lg:py-32 px-4 md:px-10 lg:px-20 xl:px-28">

                {/* Top divider */}
                <div className="flex items-center gap-4 mb-16 lg:mb-20 max-w-[1400px] mx-auto">
                    <div className="w-8 h-[1px] bg-[#C4A484]" />
                    <span className="text-[9px] uppercase tracking-[0.4em] text-[#C4A484] font-medium">
                        {t('editorial_coord')}
                    </span>
                    <div className="flex-1 h-[1px] bg-[#C4A484]/25" />
                </div>

                {/* Main editorial grid */}
                <div className="max-w-[1400px] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">

                    {/* ── Left column: Text + Stats + CTA ─────────────────── */}
                    <div
                        ref={textRef}
                        className="flex flex-col justify-center"
                        style={{
                            opacity: textVisible ? 1 : 0,
                            transform: textVisible ? 'translateY(0)' : 'translateY(32px)',
                            transition: prefersReducedMotion
                                ? 'none'
                                : 'opacity 0.8s cubic-bezier(0.16,1,0.3,1), transform 0.8s cubic-bezier(0.16,1,0.3,1)',
                        }}
                    >
                        {/* Tag */}
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-6 h-[1px] bg-[#C4A484]" />
                            <span className="text-[9px] uppercase tracking-[0.4em] text-[#C4A484] font-semibold">
                                {t('editorial_tag')}
                            </span>
                        </div>

                        {/* Heading — large italic serif */}
                        <h2 className="font-serif text-4xl md:text-5xl xl:text-6xl text-[#1E3932] leading-[1.1] font-light mb-6">
                            <i>{t('editorial_title_line1')}</i>
                            <br />
                            <span className="font-normal not-italic">{t('editorial_title_line2')}</span>
                        </h2>

                        {/* Body copy */}
                        <p className="text-[#555] text-sm leading-[2] tracking-wide max-w-[480px] mb-12 lg:mb-16 font-light">
                            {t('editorial_body')}
                        </p>

                        {/* Stats row */}
                        <div className="grid grid-cols-3 gap-4 mb-12 lg:mb-16 border-t border-[#1E3932]/12 pt-10">
                            {STATS.map((s, i) => (
                                <div key={i} className="flex flex-col gap-2">
                                    <span className="font-serif text-3xl md:text-4xl font-light text-[#1E3932] leading-none tracking-tight">
                                        {s.num}
                                    </span>
                                    <span className="text-[9px] uppercase tracking-[0.18em] text-[#888] leading-relaxed whitespace-pre-line">
                                        {isEN ? s.enLabel : s.ptLabel}
                                    </span>
                                </div>
                            ))}
                        </div>

                        {/* CTA */}
                        <button
                            onClick={onReservar}
                            className="
                                group self-start flex items-center gap-4
                                bg-[#1E3932] text-white
                                px-8 py-4 text-[10px] uppercase tracking-[0.3em] font-semibold
                                hover:bg-[#C4A484] transition-colors duration-500 cursor-pointer
                            "
                        >
                            {t('editorial_cta')}
                            <svg
                                viewBox="0 0 24 24" fill="none" stroke="currentColor"
                                strokeWidth={1.5} className="w-4 h-4 flex-shrink-0
                                translate-x-0 group-hover:translate-x-1 transition-transform duration-300"
                                aria-hidden="true"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 8.25L21 12m0 0l-3.75 3.75M21 12H3" />
                            </svg>
                        </button>
                    </div>

                    {/* ── Right column: Cinematic image composition ────────── */}
                    <div
                        ref={imgRef}
                        className="relative w-full"
                        style={{
                            opacity: imgVisible ? 1 : 0,
                            transform: imgVisible ? 'translateY(0)' : 'translateY(40px)',
                            transition: prefersReducedMotion
                                ? 'none'
                                : 'opacity 0.9s 0.15s cubic-bezier(0.16,1,0.3,1), transform 0.9s 0.15s cubic-bezier(0.16,1,0.3,1)',
                        }}
                    >
                        {/* Main large image */}
                        <div className="relative w-full h-[440px] md:h-[560px] lg:h-[640px] overflow-hidden">
                            <img
                                src="https://templarportugal.com/media/images/TZC03808-min.original.jpg"
                                alt="Vista panorâmica do Refúgio Carapita"
                                className="w-full h-full object-cover scale-105 hover:scale-100 transition-transform duration-[3000ms]"
                                loading="lazy"
                            />
                            {/* Gold inset frame */}
                            <div className="absolute inset-3 border border-[#C4A484]/40 pointer-events-none" />
                            {/* Subtle dark gradient at bottom */}
                            <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />
                        </div>

                        {/* Floating accent card — bottom left */}
                        <div className="
                            absolute -bottom-6 -left-4 md:-left-8
                            bg-[#1E3932] text-white
                            p-5 md:p-7 shadow-2xl
                            w-44 md:w-56
                        ">
                            <div className="w-5 h-[1px] bg-[#C4A484] mb-3" />
                            <p className="font-serif text-lg md:text-xl font-light text-[#C4A484] leading-tight italic mb-1">
                                Ourém
                            </p>
                            <p className="text-[9px] uppercase tracking-[0.25em] text-white/50">
                                Portugal Central
                            </p>
                        </div>

                        {/* Floating accent card — top right */}
                        <div className="
                            hidden md:flex
                            absolute -top-5 -right-5
                            w-28 h-28 md:w-36 md:h-36
                            border border-[#C4A484]/50
                            items-center justify-center
                            flex-col gap-1
                            bg-[#FAF8F4]/90 backdrop-blur-sm
                            shadow-lg
                        ">
                            <span className="font-serif text-2xl font-light text-[#1E3932] italic">est.</span>
                            <span className="font-serif text-3xl font-semibold text-[#1E3932]">XIV</span>
                            <div className="w-4 h-[1px] bg-[#C4A484]" />
                            <span className="text-[8px] uppercase tracking-[0.2em] text-[#888]">séc.</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* ═══════════════════════════════════════════════════════════
                PARTE B — Cinematic photo marquee (dark bg)
                Bridges visually from this section into EssenciaSection
            ════════════════════════════════════════════════════════════ */}
            <div className="bg-[#1E3932] w-full py-10 overflow-hidden">

                {/* Eyebrow label */}
                <div className="flex items-center justify-center gap-4 mb-7 px-4">
                    <div className="w-8 h-[1px] bg-[#C4A484]/40" />
                    <span className="text-[8px] uppercase tracking-[0.5em] text-[#C4A484]/70 font-medium">
                        {t('editorial_marquee_label')}
                    </span>
                    <div className="w-8 h-[1px] bg-[#C4A484]/40" />
                </div>

                {/* Marquee track */}
                <div
                    className="flex gap-4"
                    style={{
                        /* Duplicate items fill the track; CSS animates the whole strip */
                        width: 'max-content',
                        animation: prefersReducedMotion
                            ? 'none'
                            : 'marquee-scroll 32s linear infinite',
                    }}
                    onMouseEnter={e => {
                        if (!prefersReducedMotion)
                            (e.currentTarget as HTMLDivElement).style.animationPlayState = 'paused';
                    }}
                    onMouseLeave={e => {
                        (e.currentTarget as HTMLDivElement).style.animationPlayState = 'running';
                    }}
                >
                    {/* Original set + duplicate for seamless loop */}
                    {[...MARQUEE_PHOTOS, ...MARQUEE_PHOTOS].map((photo, i) => (
                        <div
                            key={i}
                            className="relative flex-shrink-0 overflow-hidden"
                            style={{
                                width: '240px',
                                height: '320px',
                                /* Alternate slight tilt for dynamic feel */
                                transform: i % 3 === 1 ? 'rotate(1deg)' : i % 3 === 2 ? 'rotate(-0.7deg)' : 'none',
                            }}
                        >
                            <img
                                src={photo.src}
                                alt={photo.alt}
                                className="w-full h-full object-cover"
                                loading="lazy"
                                onError={e => {
                                    (e.target as HTMLImageElement).src = '/essencia_carapita.jpg';
                                }}
                            />
                            {/* Subtle vignette */}
                            <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/30 pointer-events-none" />
                            {/* Thin gold border accent on every 3rd */}
                            {i % 3 === 0 && (
                                <div className="absolute inset-2 border border-[#C4A484]/30 pointer-events-none" />
                            )}
                        </div>
                    ))}
                </div>

                {/* CSS keyframe via style tag — avoids globals.css dependency */}
                <style>{`
                    @keyframes marquee-scroll {
                        from { transform: translateX(0); }
                        to   { transform: translateX(-50%); }
                    }
                `}</style>
            </div>
        </section>
    );
}
