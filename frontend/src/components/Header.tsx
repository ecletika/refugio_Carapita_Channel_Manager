"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { dictionaries as dict } from "@/i18n/dictionaries";
import { Menu, X, User, LogIn, Plus } from "lucide-react";

interface HeaderProps {
    scrolled?: boolean;
    lang: "PT" | "EN";
    setLang: (lang: "PT" | "EN") => void;
    mounted: boolean;
    isLoggedIn: boolean;
    onReservar: () => void;
}

// Deve corresponder a ANIM_SCROLL do HeroBanner
// A navbar desaparece quando a imagem do hero está completamente fora do ecrã:
// wrapper = 100vh + 240px → sticky liberta aos 240px → imagem sai ao 240 + 100vh
// Usamos innerHeight + 240 como limiar dinâmico, calculado no scroll handler.
const HERO_EXTRA = 240;

export default function Header({
    scrolled: propScrolled,
    lang,
    setLang,
    mounted,
    isLoggedIn,
    onReservar,
}: HeaderProps) {
    const [scrolled, setScrolled]             = useState(propScrolled || false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [pastHero, setPastHero]             = useState(false);
    const router = useRouter();

    useEffect(() => {
        const handle = () => {
            const y  = window.scrollY;
            const vh = window.innerHeight;

            // Pill navbar: aparece após 80px
            if (propScrolled === undefined) {
                setScrolled(y > 80);
            }

            // A imagem do hero (sticky 100vh dentro de wrapper 100vh+240px):
            // - Sticky liberta-se aos 240px de scroll
            // - A partir daí, rola naturalmente para cima
            // - Sai completamente do viewport aos ≈ 240 + vh px
            // Navbar some quando a imagem está COMPLETAMENTE fora do ecrã.
            setPastHero(y >= HERO_EXTRA + vh);
        };

        if (propScrolled !== undefined) setScrolled(propScrolled);

        window.addEventListener("scroll", handle, { passive: true });
        handle();
        return () => window.removeEventListener("scroll", handle);
    }, [propScrolled]);

    const t = (key: string) => dict[lang][key as keyof typeof dict["PT"]] || key;

    const navItems = [
        { label: t("menu_casa"),       id: "a-essencia", type: "scroll" },
        { label: t("menu_alojamento"), id: "alojamento",  type: "scroll" },
        { label: t("menu_passeios"),   path: "/passeios",  type: "link"   },
        { label: t("menu_contactos"),  path: "/contactos", type: "link"   },
    ];

    const scrollToOrNavigate = (id: string) => {
        setMobileMenuOpen(false);
        if (window.location.pathname === "/") {
            document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
        } else {
            router.push(`/#${id}`);
        }
    };

    const handleNavigate = (path: string) => {
        setMobileMenuOpen(false);
        router.push(path);
    };

    // Navbar some quando passou do hero (exceto se menu mobile aberto)
    const isHidden = pastHero && !mobileMenuOpen;

    return (
        <>
            <header
                className="fixed z-50 transition-all duration-500 ease-in-out"
                style={{
                    opacity: isHidden ? 0 : 1,
                    pointerEvents: isHidden ? 'none' : 'auto',
                    transform: isHidden ? 'translateY(-20px)' : 'translateY(0)',

                    ...(scrolled || mobileMenuOpen
                        ? {
                              // ── ESTADO PILL ──────────────────────────────────
                              top: '12px',
                              left: '15%',
                              right: '15%',
                              borderRadius: '9999px',
                              background: 'rgba(30, 57, 50, 0.92)',
                              backdropFilter: 'blur(14px)',
                              WebkitBackdropFilter: 'blur(14px)',
                              border: '1px solid rgba(255,255,255,0.12)',
                              boxShadow: '0 8px 32px rgba(0,0,0,0.35)',
                              padding: '10px 20px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '6px',   // ← 6px entre todos os grupos
                          }
                        : {
                              // ── ESTADO NORMAL (transparente) ──────────────
                              top: 0,
                              left: 0,
                              right: 0,
                              borderRadius: 0,
                              background: 'transparent',
                              backdropFilter: 'none',
                              WebkitBackdropFilter: 'none',
                              border: 'none',
                              borderBottom: '1px solid rgba(255,255,255,0.2)',
                              boxShadow: 'none',
                              padding: '20px 48px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                          }),
                }}
            >

                {/* ══════════════════════════════════════════════════════════
                    ESTADO NORMAL — layout spread (transparente)
                ═════════════════════════════════════════════════════════ */}
                {!scrolled && !mobileMenuOpen && (
                    <>
                        {/* Esquerda: Nav desktop */}
                        <nav className="flex-1 hidden lg:block">
                            <ul className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest font-medium text-white">
                                {navItems.map((item, idx) => (
                                    <li
                                        key={idx}
                                        className="hover:text-[#C4A484] transition-colors duration-300 cursor-pointer whitespace-nowrap px-3 py-1"
                                        onClick={() =>
                                            item.type === "scroll"
                                                ? scrollToOrNavigate(item.id!)
                                                : handleNavigate(item.path!)
                                        }
                                    >
                                        {item.label}
                                    </li>
                                ))}
                            </ul>
                        </nav>

                        {/* Hamburguer mobile */}
                        <div className="flex-1 lg:hidden">
                            <button
                                onClick={() => setMobileMenuOpen(true)}
                                className="text-white hover:text-[#C4A484] transition-colors cursor-pointer"
                            >
                                <Menu size={24} />
                            </button>
                        </div>

                        {/* Centro: Logo */}
                        <div
                            className="flex-shrink-0 mx-6 relative group cursor-pointer"
                            onClick={() => router.push("/")}
                        >
                            <div className="relative w-20 h-20 md:w-28 md:h-28 rounded-full overflow-hidden border-2 border-white/40 bg-white/10 backdrop-blur-sm p-0.5 shadow-2xl">
                                <img
                                    src="/logo.jpg"
                                    alt="Refúgio Carapita"
                                    className="w-full h-full object-cover scale-110 group-hover:scale-125 transition-transform duration-1000"
                                />
                            </div>
                        </div>

                        {/* Direita: Idioma | Login | Reservar */}
                        <div className="flex-1 flex justify-end items-center">
                            {/* Grupo: idioma + login — 6px entre si */}
                            <div className="flex items-center gap-1.5">
                                <button
                                    onClick={() => setLang(lang === "PT" ? "EN" : "PT")}
                                    className="text-[10px] font-bold uppercase tracking-widest text-white hover:text-[#C4A484] transition-colors cursor-pointer px-2 py-1"
                                >
                                    {lang === "PT" ? "EN" : "PT"}
                                </button>

                                <button
                                    onClick={() => {
                                        const token = localStorage.getItem("token");
                                        router.push(token ? "/perfil" : "/login");
                                    }}
                                    className="hidden md:flex items-center gap-2 px-5 py-2 rounded-full border border-white text-white hover:bg-white hover:text-[#1E3932] transition-all duration-500 cursor-pointer text-[10px] uppercase tracking-widest"
                                >
                                    {isLoggedIn ? <User size={13} /> : <LogIn size={13} />}
                                    {mounted && (isLoggedIn ? t("btn_conta") : t("btn_login"))}
                                </button>
                            </div>

                            {/* Reservar — separado 6px do grupo anterior, empurrado para a direita */}
                            <button
                                onClick={onReservar}
                                className="ml-1.5 flex items-center gap-2 rounded-full px-4 md:px-7 py-2 md:py-3 bg-[#1E3932] text-white hover:bg-[#C4A484] shadow-lg border border-white/10 transition-all duration-500 cursor-pointer text-[9px] md:text-[10px] uppercase tracking-widest font-bold"
                            >
                                <Plus size={14} className="flex-shrink-0" />
                                <span className="hidden sm:inline">{t("btn_reservar_now")}</span>
                                <span className="sm:hidden">{t("btn_reservar")}</span>
                            </button>
                        </div>
                    </>
                )}

                {/* ══════════════════════════════════════════════════════════
                    ESTADO PILL (scrolled) — layout centrado compacto
                ═════════════════════════════════════════════════════════ */}
                {(scrolled || mobileMenuOpen) && (
                    <>
                        {/* Nav items — desktop */}
                        <nav className="hidden lg:flex items-center gap-1.5">
                            {navItems.map((item, idx) => (
                                <span
                                    key={idx}
                                    className="text-[10px] uppercase tracking-widest font-medium text-white/80 hover:text-[#C4A484] transition-colors duration-300 cursor-pointer whitespace-nowrap px-2 py-1"
                                    onClick={() =>
                                        item.type === "scroll"
                                            ? scrollToOrNavigate(item.id!)
                                            : handleNavigate(item.path!)
                                    }
                                >
                                    {item.label}
                                </span>
                            ))}
                        </nav>

                        {/* Hamburguer mobile */}
                        <button
                            className="lg:hidden text-white hover:text-[#C4A484] transition-colors cursor-pointer"
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        >
                            <Menu size={20} />
                        </button>

                        {/* Logo */}
                        <div
                            className="relative group cursor-pointer flex-shrink-0 mx-1.5"
                            onClick={() => router.push("/")}
                        >
                            <div className="relative w-12 h-12 rounded-full overflow-hidden border-2 border-[#C4A484] bg-[#1E3932] p-0.5 shadow-lg">
                                <img
                                    src="/logo.jpg"
                                    alt="Refúgio Carapita"
                                    className="w-full h-full object-cover scale-110 group-hover:scale-125 transition-transform duration-700"
                                />
                            </div>
                        </div>

                        {/* Acções: idioma | login | reservar — 6px entre cada */}
                        <div className="flex items-center gap-1.5">
                            <button
                                onClick={() => setLang(lang === "PT" ? "EN" : "PT")}
                                className="text-[10px] font-bold uppercase tracking-widest text-white/70 hover:text-[#C4A484] transition-colors cursor-pointer px-2 py-1"
                            >
                                {lang === "PT" ? "EN" : "PT"}
                            </button>

                            <button
                                onClick={() => {
                                    const token = localStorage.getItem("token");
                                    router.push(token ? "/perfil" : "/login");
                                }}
                                className="hidden md:flex items-center justify-center w-9 h-9 rounded-full border border-white/25 text-white hover:bg-white hover:text-[#1E3932] transition-all duration-300 cursor-pointer"
                                title={mounted && isLoggedIn ? t("btn_conta") : t("btn_login")}
                            >
                                {isLoggedIn ? <User size={14} /> : <LogIn size={14} />}
                            </button>

                            <button
                                onClick={onReservar}
                                className="flex items-center gap-1.5 rounded-full px-4 py-2 bg-[#C4A484] text-[#1E3932] font-bold shadow-lg border border-[#C4A484]/50 hover:bg-white transition-all duration-300 cursor-pointer text-[10px] uppercase tracking-widest"
                            >
                                <Plus size={12} />
                                <span className="hidden sm:inline">{t("btn_reservar_now")}</span>
                            </button>
                        </div>
                    </>
                )}
            </header>

            {/* ── Menu mobile drawer ────────────────────────────────────────── */}
            <div
                className={`fixed inset-0 z-40 bg-[#1E3932] transition-transform duration-500 lg:hidden ${
                    mobileMenuOpen ? "translate-y-0" : "-translate-y-full"
                }`}
            >
                <div className="flex flex-col items-center justify-center h-full gap-8 px-6 pt-20">
                    <button
                        className="absolute top-6 right-6 text-white/60 hover:text-white cursor-pointer"
                        onClick={() => setMobileMenuOpen(false)}
                    >
                        <X size={24} />
                    </button>

                    <ul className="flex flex-col items-center gap-8 text-sm uppercase tracking-[0.3em] font-medium text-white w-full">
                        {navItems.map((item, idx) => (
                            <li
                                key={idx}
                                className="hover:text-[#C4A484] transition-colors duration-300 cursor-pointer border-b border-white/5 w-full text-center pb-4"
                                onClick={() =>
                                    item.type === "scroll"
                                        ? scrollToOrNavigate(item.id!)
                                        : handleNavigate(item.path!)
                                }
                            >
                                {item.label}
                            </li>
                        ))}
                    </ul>

                    <div className="flex flex-col gap-4 w-full max-w-xs mt-4">
                        <button
                            onClick={() => {
                                setMobileMenuOpen(false);
                                const token = localStorage.getItem("token");
                                router.push(token ? "/perfil" : "/login");
                            }}
                            className="w-full py-4 border border-white/20 rounded-full text-[10px] uppercase tracking-widest text-white hover:bg-white hover:text-[#1E3932] transition-all cursor-pointer"
                        >
                            {isLoggedIn ? t("btn_conta") : t("btn_login")}
                        </button>
                        <button
                            onClick={() => { setMobileMenuOpen(false); onReservar(); }}
                            className="w-full py-4 bg-[#C4A484] text-[#1E3932] rounded-full text-[10px] uppercase tracking-widest font-bold shadow-xl cursor-pointer"
                        >
                            {t("btn_reservar_now")}
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
}
