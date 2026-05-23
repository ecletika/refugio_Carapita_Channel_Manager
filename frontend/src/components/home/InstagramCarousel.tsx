"use client";
import React, { useEffect, useRef, useState, useCallback } from 'react';

const EDGE_URL = 'https://vuidkeygtxfbgxvmilya.supabase.co/functions/v1';

interface IGPost {
    id: string;
    caption?: string;
    media_type: 'IMAGE' | 'VIDEO' | 'CAROUSEL_ALBUM';
    media_url: string;
    thumbnail_url?: string;
    permalink: string;
    timestamp: string;
}

interface InstagramCarouselProps {
    t: (key: string) => string;
}

/* ─── Instagram SVG icon ─────────────────────────────────────────── */
const InstagramIcon = ({ size = 20 }: { size?: number }) => (
    <svg
        width={size} height={size} viewBox="0 0 24 24" fill="currentColor"
        aria-hidden="true"
    >
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
    </svg>
);

/* ─── Video badge ────────────────────────────────────────────────── */
const VideoBadge = () => (
    <div className="absolute top-3 right-3 z-10 w-7 h-7 rounded-full bg-black/60 flex items-center justify-center backdrop-blur-sm">
        <svg viewBox="0 0 24 24" fill="white" width={12} height={12} aria-hidden="true">
            <path d="M8 5v14l11-7z" />
        </svg>
    </div>
);

/* ─── Carousel badge ─────────────────────────────────────────────── */
const CarouselBadge = () => (
    <div className="absolute top-3 right-3 z-10 w-7 h-7 rounded-full bg-black/60 flex items-center justify-center backdrop-blur-sm">
        <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2} width={12} height={12} aria-hidden="true">
            <rect x="2" y="7" width="14" height="10" rx="1" />
            <path d="M16 9l4-2v10l-4-2" />
        </svg>
    </div>
);

export default function InstagramCarousel({ t }: InstagramCarouselProps) {
    const [posts, setPosts]     = useState<IGPost[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError]     = useState<string | null>(null);
    const [notConfigured, setNotConfigured] = useState(false);

    const trackRef   = useRef<HTMLDivElement>(null);
    const [canLeft,  setCanLeft]  = useState(false);
    const [canRight, setCanRight] = useState(false);

    /* ── Drag-to-scroll state ─────────────────────────────────────── */
    const isDragging   = useRef(false);
    const startX       = useRef(0);
    const scrollStart  = useRef(0);

    /* ── Fetch ───────────────────────────────────────────────────── */
    useEffect(() => {
        (async () => {
            try {
                const res  = await fetch(`${EDGE_URL}/instagram-feed`);
                const json = await res.json();
                if (json.status === 'not_configured') { setNotConfigured(true); return; }
                if (json.data?.length) setPosts(json.data.slice(0, 10));
                else if (json.error) setError(json.error);
            } catch {
                setError('Erro ao carregar feed do Instagram');
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    /* ── Arrow visibility ────────────────────────────────────────── */
    const updateArrows = useCallback(() => {
        const el = trackRef.current;
        if (!el) return;
        setCanLeft(el.scrollLeft > 4);
        setCanRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 4);
    }, []);

    useEffect(() => {
        const el = trackRef.current;
        if (!el) return;
        updateArrows();
        el.addEventListener('scroll', updateArrows, { passive: true });
        window.addEventListener('resize', updateArrows);
        return () => {
            el.removeEventListener('scroll', updateArrows);
            window.removeEventListener('resize', updateArrows);
        };
    }, [posts, updateArrows]);

    const scroll = (dir: 'left' | 'right') => {
        const el = trackRef.current;
        if (!el) return;
        el.scrollBy({ left: dir === 'right' ? 320 : -320, behavior: 'smooth' });
    };

    /* ── Drag handlers ───────────────────────────────────────────── */
    const onMouseDown = (e: React.MouseEvent) => {
        isDragging.current = true;
        startX.current     = e.pageX;
        scrollStart.current = trackRef.current?.scrollLeft ?? 0;
        if (trackRef.current) trackRef.current.style.cursor = 'grabbing';
    };
    const onMouseMove = (e: React.MouseEvent) => {
        if (!isDragging.current || !trackRef.current) return;
        trackRef.current.scrollLeft = scrollStart.current - (e.pageX - startX.current);
    };
    const onMouseUp = () => {
        isDragging.current = false;
        if (trackRef.current) trackRef.current.style.cursor = 'grab';
    };

    /* ── Helpers ────────────────────────────────────────────────── */
    const imgSrc = (p: IGPost) => p.media_type === 'VIDEO' ? (p.thumbnail_url || p.media_url) : p.media_url;
    const truncCaption = (c?: string) => !c ? '' : c.length > 120 ? c.slice(0, 120).trim() + '…' : c;

    /* ── Empty / not configured states ─────────────────────────── */
    if (notConfigured || (!loading && !posts.length && !error)) return null;

    return (
        <section
            className="w-full bg-[#FAF8F4] overflow-hidden"
            aria-label="Feed do Instagram"
        >
            {/* ── Header ────────────────────────────────────────── */}
            <div className="max-w-[1400px] mx-auto px-4 md:px-10 lg:px-20 pt-16 pb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div>
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-5 h-[1px] bg-[#C4A484]" />
                        <span className="text-[9px] uppercase tracking-[0.4em] text-[#C4A484] font-semibold">
                            {t('instagram_tag')}
                        </span>
                    </div>
                    <h2 className="font-serif text-3xl md:text-4xl text-[#1E3932] font-light leading-tight">
                        {t('instagram_title')}
                    </h2>
                </div>

                <a
                    href="https://www.instagram.com/refugiocarapita"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="
                        flex items-center gap-2.5 self-start sm:self-auto
                        border border-[#1E3932] text-[#1E3932]
                        px-5 py-2.5 text-[10px] uppercase tracking-[0.25em] font-semibold
                        hover:bg-[#1E3932] hover:text-white transition-colors duration-300
                        cursor-pointer flex-shrink-0
                    "
                    aria-label="Seguir no Instagram"
                >
                    <InstagramIcon size={14} />
                    {t('instagram_seguir')}
                </a>
            </div>

            {/* ── Loading skeleton ──────────────────────────────── */}
            {loading && (
                <div className="max-w-[1400px] mx-auto px-4 md:px-10 lg:px-20 pb-16">
                    <div className="flex gap-4 overflow-hidden">
                        {Array.from({ length: 5 }).map((_, i) => (
                            <div
                                key={i}
                                className="flex-shrink-0 w-64 h-64 bg-gray-200 animate-pulse rounded-none"
                                style={{ animationDelay: `${i * 0.1}s` }}
                            />
                        ))}
                    </div>
                </div>
            )}

            {/* ── Error state ───────────────────────────────────── */}
            {error && !loading && (
                <div className="max-w-[1400px] mx-auto px-4 md:px-10 lg:px-20 pb-16">
                    <p className="text-sm text-gray-400 font-light">{error}</p>
                </div>
            )}

            {/* ── Carousel ──────────────────────────────────────── */}
            {!loading && posts.length > 0 && (
                <div className="relative pb-16">
                    {/* Left arrow */}
                    <button
                        onClick={() => scroll('left')}
                        aria-label="Anterior"
                        className={`
                            hidden md:flex absolute left-4 lg:left-12 top-1/2 -translate-y-1/2 z-10
                            w-11 h-11 items-center justify-center
                            bg-white border border-gray-200 shadow-lg
                            hover:bg-[#1E3932] hover:border-[#1E3932] hover:text-white text-[#1E3932]
                            transition-all duration-300 cursor-pointer
                            ${canLeft ? 'opacity-100' : 'opacity-0 pointer-events-none'}
                        `}
                    >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} width={18} height={18} aria-hidden="true">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                        </svg>
                    </button>

                    {/* Right arrow */}
                    <button
                        onClick={() => scroll('right')}
                        aria-label="Próximo"
                        className={`
                            hidden md:flex absolute right-4 lg:right-12 top-1/2 -translate-y-1/2 z-10
                            w-11 h-11 items-center justify-center
                            bg-white border border-gray-200 shadow-lg
                            hover:bg-[#1E3932] hover:border-[#1E3932] hover:text-white text-[#1E3932]
                            transition-all duration-300 cursor-pointer
                            ${canRight ? 'opacity-100' : 'opacity-0 pointer-events-none'}
                        `}
                    >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} width={18} height={18} aria-hidden="true">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                        </svg>
                    </button>

                    {/* Track */}
                    <div
                        ref={trackRef}
                        className="
                            flex gap-3 md:gap-4
                            overflow-x-auto scroll-smooth
                            px-4 md:px-20 lg:px-28
                            select-none
                        "
                        style={{
                            scrollbarWidth: 'none',
                            msOverflowStyle: 'none',
                            cursor: 'grab',
                            WebkitOverflowScrolling: 'touch',
                        }}
                        onMouseDown={onMouseDown}
                        onMouseMove={onMouseMove}
                        onMouseUp={onMouseUp}
                        onMouseLeave={onMouseUp}
                    >
                        {posts.map((post) => (
                            <a
                                key={post.id}
                                href={post.permalink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="group flex-shrink-0 relative overflow-hidden block cursor-pointer"
                                style={{ width: '280px', height: '280px' }}
                                draggable={false}
                                aria-label={post.caption ? truncCaption(post.caption) : 'Post do Instagram'}
                            >
                                {/* Image */}
                                <img
                                    src={imgSrc(post)}
                                    alt={post.caption ? truncCaption(post.caption) : 'Instagram'}
                                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                    loading="lazy"
                                    draggable={false}
                                />

                                {/* Media type badge */}
                                {post.media_type === 'VIDEO'          && <VideoBadge />}
                                {post.media_type === 'CAROUSEL_ALBUM' && <CarouselBadge />}

                                {/* Caption overlay — slides up on hover */}
                                <div className="
                                    absolute inset-0
                                    bg-gradient-to-t from-[#1E3932]/90 via-[#1E3932]/40 to-transparent
                                    translate-y-full group-hover:translate-y-0
                                    transition-transform duration-500 ease-in-out
                                    flex flex-col justify-end p-4
                                ">
                                    {/* Instagram icon */}
                                    <div className="text-[#C4A484] mb-2">
                                        <InstagramIcon size={16} />
                                    </div>
                                    {post.caption && (
                                        <p className="text-white text-xs leading-relaxed line-clamp-4 font-light">
                                            {truncCaption(post.caption)}
                                        </p>
                                    )}
                                    <div className="mt-2 flex items-center gap-1 text-[#C4A484]">
                                        <span className="text-[9px] uppercase tracking-[0.2em] font-semibold">
                                            Ver no Instagram
                                        </span>
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} width={10} height={10} aria-hidden="true">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                                        </svg>
                                    </div>
                                </div>

                                {/* Thin gold border on hover */}
                                <div className="absolute inset-0 border-2 border-[#C4A484]/0 group-hover:border-[#C4A484]/60 transition-all duration-500 pointer-events-none" />
                            </a>
                        ))}

                        {/* End card — CTA to Instagram profile */}
                        <a
                            href="https://www.instagram.com/refugiocarapita"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="
                                flex-shrink-0 flex flex-col items-center justify-center gap-4
                                bg-[#1E3932] text-white
                                hover:bg-[#C4A484] transition-colors duration-500 cursor-pointer
                                group
                            "
                            style={{ width: '200px', height: '280px' }}
                            aria-label="Ver perfil no Instagram"
                        >
                            <div className="text-white/60 group-hover:text-white transition-colors duration-300">
                                <InstagramIcon size={32} />
                            </div>
                            <div className="text-center px-4">
                                <p className="text-[9px] uppercase tracking-[0.3em] text-white/50 group-hover:text-white/80 mb-1 transition-colors duration-300">
                                    Seguir
                                </p>
                                <p className="font-serif text-lg font-light text-white">
                                    @refugiocarapita
                                </p>
                            </div>
                            <div className="w-5 h-[1px] bg-[#C4A484]/60 group-hover:bg-white transition-colors duration-300" />
                        </a>
                    </div>

                    {/* Scroll indicator dots (mobile) */}
                    <div className="flex justify-center gap-1.5 mt-5 md:hidden px-4">
                        <div className="h-[2px] w-8 bg-[#1E3932]/20 rounded-full" />
                        <div className="h-[2px] w-8 bg-[#C4A484] rounded-full" />
                        <div className="h-[2px] w-8 bg-[#1E3932]/20 rounded-full" />
                    </div>
                </div>
            )}
        </section>
    );
}
