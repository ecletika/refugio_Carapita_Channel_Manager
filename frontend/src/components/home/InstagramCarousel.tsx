"use client";
import React, { useEffect, useState } from 'react';

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
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
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
    const [posts, setPosts]             = useState<IGPost[]>([]);
    const [loading, setLoading]         = useState(true);
    const [notConfigured, setNotConfigured] = useState(false);
    const [paused, setPaused]           = useState(false);

    /* ── Fetch ───────────────────────────────────────────────────── */
    useEffect(() => {
        (async () => {
            try {
                const res  = await fetch(`${EDGE_URL}/instagram-feed`);
                const json = await res.json();
                if (json.status === 'not_configured') { setNotConfigured(true); return; }
                if (json.data?.length) setPosts(json.data.slice(0, 10));
            } catch { /* silently ignore */ }
            finally { setLoading(false); }
        })();
    }, []);

    /* ── Helpers ────────────────────────────────────────────────── */
    const imgSrc       = (p: IGPost) => p.media_type === 'VIDEO' ? (p.thumbnail_url || p.media_url) : p.media_url;
    const truncCaption = (c?: string) => !c ? '' : c.length > 100 ? c.slice(0, 100).trim() + '…' : c;

    /* ── Empty / not configured ─────────────────────────────────── */
    if (notConfigured || (!loading && !posts.length)) return null;

    /* Duplicate posts for seamless infinite loop */
    const displayPosts = [...posts, ...posts];

    return (
        <section
            className="w-full bg-[#FAF8F4] overflow-hidden"
            aria-label="Programação"
        >
            {/* ── Header ── flush against hero, minimal padding ─── */}
            <div className="max-w-[1400px] mx-auto px-4 md:px-10 lg:px-20 pt-8 pb-5 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-5 h-[1px] bg-[#C4A484]" />
                        <span className="text-[9px] uppercase tracking-[0.4em] text-[#C4A484] font-semibold">
                            {t('instagram_tag')}
                        </span>
                    </div>
                    <h2 className="font-serif text-2xl md:text-3xl text-[#1E3932] font-light leading-tight">
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
                    aria-label="Ver no Instagram"
                >
                    <InstagramIcon size={14} />
                    {t('instagram_seguir')}
                </a>
            </div>

            {/* ── Loading skeleton ──────────────────────────────── */}
            {loading && (
                <div className="flex gap-4 overflow-hidden pb-10 px-4">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <div
                            key={i}
                            className="flex-shrink-0 w-64 h-64 bg-gray-200 animate-pulse"
                            style={{ animationDelay: `${i * 0.1}s` }}
                        />
                    ))}
                </div>
            )}

            {/* ── Marquee auto-scroll ───────────────────────────── */}
            {!loading && posts.length > 0 && (
                <div
                    className="overflow-hidden pb-10"
                    onMouseEnter={() => setPaused(true)}
                    onMouseLeave={() => setPaused(false)}
                >
                    <div
                        className={`flex gap-3 instagram-marquee${paused ? ' instagram-marquee-paused' : ''}`}
                    >
                        {displayPosts.map((post, idx) => (
                            <a
                                key={`${post.id}-${idx}`}
                                href={post.permalink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="group flex-shrink-0 relative overflow-hidden block cursor-pointer"
                                style={{ width: '260px', height: '260px' }}
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

                                {/* Caption overlay */}
                                <div className="
                                    absolute inset-0
                                    bg-gradient-to-t from-[#1E3932]/90 via-[#1E3932]/40 to-transparent
                                    translate-y-full group-hover:translate-y-0
                                    transition-transform duration-500 ease-in-out
                                    flex flex-col justify-end p-4
                                ">
                                    <div className="text-[#C4A484] mb-2">
                                        <InstagramIcon size={14} />
                                    </div>
                                    {post.caption && (
                                        <p className="text-white text-xs leading-relaxed line-clamp-3 font-light">
                                            {truncCaption(post.caption)}
                                        </p>
                                    )}
                                    <div className="mt-2 flex items-center gap-1 text-[#C4A484]">
                                        <span className="text-[9px] uppercase tracking-[0.2em] font-semibold">Ver no Instagram</span>
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} width={10} height={10} aria-hidden="true">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                                        </svg>
                                    </div>
                                </div>

                                {/* Gold border on hover */}
                                <div className="absolute inset-0 border-2 border-[#C4A484]/0 group-hover:border-[#C4A484]/60 transition-all duration-500 pointer-events-none" />
                            </a>
                        ))}
                    </div>
                </div>
            )}
        </section>
    );
}
