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

export default function Header({
    scrolled: propScrolled,
    lang,
    setLang,
    mounted,
    isLoggedIn,
    onReservar,
}: HeaderProps) {
    const [scrolled, setScrolled]         = useState(propScrolled || false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const router = useRouter();

    useEffect(() => {
        if (propScrolled === undefined) {
            const handleScroll = () => setScrolled(window.scrollY > 80);
            window.addEventListener("scroll", handleScroll, { passive: true });
            handleScroll();
            return () => window.removeEventListener("scroll", handleScroll);
        } else {
            setScrolled(propScrolled);
        }
    }, [propScrolled]);

    const t = (key: string) => dict[lang][key as keyof typeof dict["PT"]] || key;

    const navItems = [
        { label: t("menu_casa"),        id: "a-essencia", type: "scroll" },
        { label: t("menu_alojamento"),  id: "alojamento", type: "scroll" },
        { label: t("menu_passeios"),    path: "/passeios",  type: "link" },
        { label: t("menu_contactos"),   path: "/contactos", type: "link" },
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

    return (
        <>
            {/*
             * ── Header principal ─────────────────────────────────────────────
             * Normal  : full-width, transparente, px-4/12, py-4/6
             * Scrolled: pill flutuante — top-3 left-4 right-4, rounded-full,
             *           fundo #1E3932 a 88% + backdrop-blur, sombra suave
             *           Logo encolhe de w-14/24 para w-10, py reduz para py-2
             * transition-all duration-500 faz tudo suavemente
             * ────────────────────────────────────────────────────────────────
             */}
            <header
                className={`fixed z-50 flex items-center justify-between transition-all duration-500 ease-in-out ${
                    scrolled || mobileMenuOpen
                        ? "top-3 left-4 right-4 rounded-full bg-[#1E3932]/88 backdrop-blur-md border border-white/10 shadow-xl py-2 px-5"
                        : "top-0 left-0 right-0 w-full bg-transparent border-b border-white/20 py-4 md:py-6 px-4 md:px-12"
                }`}
            >
                {/* ── Esquerda: Navegação (desktop) ──────────────────────── */}
                <nav className="flex-1 hidden lg:block">
                    <ul className="flex gap-4 xl:gap-6 text-[10px] uppercase tracking-widest font-medium text-white">
                        {navItems.map((item, idx) => (
                            <li
                                key={idx}
                                className="hover:text-[#C4A484] transition-colors duration-300 cursor-pointer whitespace-nowrap"
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

                {/* ── Esquerda mobile: Hamburguer ─────────────────────────── */}
                <div className="flex-1 lg:hidden">
                    <button
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        className="text-white hover:text-[#C4A484] transition-colors cursor-pointer"
                    >
                        {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
                    </button>
                </div>

                {/* ── Centro: Logo ─────────────────────────────────────────── */}
                <div
                    className="flex-shrink-0 text-center mx-2 relative group cursor-pointer"
                    onClick={() => router.push("/")}
                >
                    <div
                        className={`relative rounded-full overflow-hidden border-2 transition-all duration-500 ease-in-out p-0.5 shadow-xl ${
                            scrolled
                                ? "w-10 h-10 border-[#C4A484] bg-[#1E3932]"
                                : "w-14 h-14 md:w-24 md:h-24 border-white/40 bg-white/10 backdrop-blur-sm"
                        }`}
                    >
                        <img
                            src="/logo.jpg"
                            alt="Refúgio Carapita"
                            className="w-full h-full object-cover scale-110 group-hover:scale-125 transition-transform duration-1000"
                        />
                    </div>
                </div>

                {/* ── Direita: Idioma + Conta + Reservar ───────────────────── */}
                <div className="flex-1 flex justify-end items-center gap-2 md:gap-4">
                    {/* Idioma */}
                    <button
                        onClick={() => setLang(lang === "PT" ? "EN" : "PT")}
                        className="text-[10px] font-bold uppercase tracking-widest text-white hover:text-[#C4A484] transition-colors cursor-pointer"
                    >
                        {lang === "PT" ? "EN" : "PT"}
                    </button>

                    {/* Conta / Login */}
                    <button
                        onClick={() => {
                            const token = localStorage.getItem("token");
                            if (token) router.push("/perfil");
                            else router.push("/login");
                        }}
                        className={`hidden md:flex items-center justify-center gap-2 transition-all duration-500 border overflow-hidden cursor-pointer ${
                            scrolled
                                ? "w-9 h-9 p-0 rounded-full border-white/20 text-white hover:bg-white hover:text-[#1E3932]"
                                : "px-5 py-2 rounded-full border-white text-white hover:bg-white hover:text-[#1E3932]"
                        }`}
                        title={mounted && isLoggedIn ? t("btn_conta") : t("btn_login")}
                    >
                        {isLoggedIn ? <User size={13} /> : <LogIn size={13} />}
                        <span
                            className={`transition-all duration-500 whitespace-nowrap text-[10px] uppercase tracking-widest ${
                                scrolled ? "w-0 opacity-0 overflow-hidden" : "w-auto opacity-100"
                            }`}
                        >
                            {mounted && isLoggedIn ? t("btn_conta") : t("btn_login")}
                        </span>
                    </button>

                    {/* Reservar */}
                    <button
                        onClick={onReservar}
                        className={`flex items-center justify-center transition-all duration-500 bg-[#1E3932] text-white hover:bg-[#C4A484] shadow-lg border border-white/10 overflow-hidden cursor-pointer ${
                            scrolled
                                ? "w-9 h-9 p-0 rounded-full"
                                : "rounded-full px-4 md:px-7 py-2 md:py-3"
                        }`}
                        title={t("btn_reservar_now")}
                    >
                        <Plus
                            size={15}
                            className={`flex-shrink-0 transition-all duration-500 ${
                                scrolled ? "animate-spin-slow" : ""
                            }`}
                        />
                        <span
                            className={`transition-all duration-500 whitespace-nowrap text-[9px] md:text-[10px] uppercase tracking-widest font-bold ${
                                scrolled
                                    ? "w-0 opacity-0 overflow-hidden"
                                    : "w-auto opacity-100 ml-2"
                            }`}
                        >
                            <span className="hidden sm:inline">{t("btn_reservar_now")}</span>
                            <span className="sm:hidden">{t("btn_reservar")}</span>
                        </span>
                    </button>
                </div>
            </header>

            {/* ── Menu mobile (drawer) ──────────────────────────────────────── */}
            <div
                className={`fixed inset-0 z-40 bg-[#1E3932] transition-transform duration-500 lg:hidden ${
                    mobileMenuOpen ? "translate-y-0" : "-translate-y-full"
                }`}
            >
                <div className="flex flex-col items-center justify-center h-full gap-8 px-6 pt-20">
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
                                if (token) router.push("/perfil");
                                else router.push("/login");
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
