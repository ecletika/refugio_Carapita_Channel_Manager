"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { dictionaries as dict } from "@/i18n/dictionaries";

interface HeaderProps {
    scrolled?: boolean;
    lang: "PT" | "EN";
    setLang: (lang: "PT" | "EN") => void;
    mounted: boolean;
    isLoggedIn: boolean;
    onReservar: () => void;
}

export default function Header({ scrolled: propScrolled, lang, setLang, mounted, isLoggedIn, onReservar }: HeaderProps) {
    const [scrolled, setScrolled] = useState(propScrolled || false);
    const router = useRouter();

    useEffect(() => {
        if (propScrolled === undefined) {
            const handleScroll = () => {
                if (window.scrollY > 50) setScrolled(true);
                else setScrolled(false);
            };
            window.addEventListener("scroll", handleScroll);
            return () => window.removeEventListener("scroll", handleScroll);
        } else {
            setScrolled(propScrolled);
        }
    }, [propScrolled]);

    const t = (key: string) => dict[lang][key as keyof typeof dict["PT"]] || key;

    const scrollToOrNavigate = (id: string) => {
        if (window.location.pathname === "/") {
            document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
        } else {
            router.push(`/#${id}`);
        }
    };

    return (
        <header className={`fixed top-0 w-full z-50 px-4 md:px-12 py-4 md:py-6 flex items-center justify-between transition-all duration-700 ${scrolled ? 'bg-carapita-green shadow-lg py-3 md:py-4 border-b border-white/5 text-white' : 'bg-transparent text-white border-b border-white/20'}`}>
            {/* Left: Navigation Menu */}
            <nav className="flex-1 hidden lg:block">
                <ul className="flex gap-10 text-[10px] uppercase tracking-mega font-medium">
                    <li className="hover:text-carapita-gold transition-colors duration-300 cursor-pointer" onClick={() => scrollToOrNavigate('a-essencia')}>{t('menu_casa')}</li>
                    <li className="hover:text-carapita-gold transition-colors duration-300 cursor-pointer" onClick={() => scrollToOrNavigate('alojamento')}>{t('menu_alojamento')}</li>
                    <li className="hover:text-carapita-gold transition-colors duration-300 cursor-pointer" onClick={() => router.push('/passeios')}>{t('menu_passeios')}</li>
                    <li className="hover:text-carapita-gold transition-colors duration-300 cursor-pointer" onClick={() => router.push('/contatos')}>{t('menu_contatos')}</li>
                </ul>
            </nav>

            {/* Center: Logo */}
            <div className="flex-shrink-0 text-center mx-2 md:mx-4 relative group cursor-pointer" onClick={() => router.push('/')}>
                <div className={`relative w-16 h-16 md:w-28 md:h-28 rounded-full overflow-hidden border-2 transition-all duration-700 p-0.5 shadow-2xl ${scrolled ? 'border-carapita-gold bg-carapita-green' : 'border-white/40 bg-white/10 backdrop-blur-sm'}`}>
                    <img
                        src="/logo.jpg"
                        alt="Refúgio Carapita Logo"
                        className="w-full h-full object-cover scale-110 group-hover:scale-125 transition-transform duration-1000"
                    />
                </div>
            </div>

            {/* Right: Admin & Auth */}
            <div className="flex-1 flex justify-end items-center gap-3 md:gap-6">
                <button onClick={() => setLang(lang === 'PT' ? 'EN' : 'PT')} className="text-[10px] md:text-sm font-bold uppercase tracking-widest text-white hover:text-carapita-gold transition-colors">
                    {lang === 'PT' ? 'EN' : 'PT'}
                </button>

                <button
                    onClick={() => {
                        const token = localStorage.getItem('token');
                        if (token) router.push('/perfil');
                        else router.push('/login');
                    }}
                    className={`hidden md:block px-6 py-2 rounded-full text-[10px] uppercase tracking-widest transition-all duration-300 border ${scrolled
                        ? 'border-white/20 text-white hover:bg-white hover:text-carapita-green'
                        : 'border-white text-white hover:bg-white hover:text-carapita-dark'
                        }`}
                >
                    {mounted && isLoggedIn ? t('btn_conta') : t('btn_login')}
                </button>

                <button onClick={onReservar} className={`text-[8px] md:text-[10px] uppercase tracking-mega font-bold rounded-full px-4 md:px-8 py-2 md:py-3 transition-all duration-500 bg-carapita-dark text-white hover:bg-carapita-gold text-center`}>
                    <span className="hidden md:inline">{t('btn_reservar_now')}</span>
                    <span className="md:hidden">{t('btn_reservar')}</span>
                </button>
            </div>
        </header>
    );
}
