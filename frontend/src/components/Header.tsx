"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { dictionaries as dict } from "@/i18n/dictionaries";
import { Menu, X, User, LogIn } from "lucide-react";

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
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
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

    const navItems = [
        { label: t('menu_casa'), id: 'a-essencia', type: 'scroll' },
        { label: t('menu_alojamento'), id: 'alojamento', type: 'scroll' },
        { label: t('menu_passeios'), path: '/passeios', type: 'link' },
        { label: t('menu_contatos'), path: '/contatos', type: 'link' },
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
            <header className={`fixed top-0 w-full z-50 px-4 md:px-12 py-4 md:py-6 flex items-center justify-between transition-all duration-700 ${scrolled || mobileMenuOpen ? 'bg-carapita-green shadow-lg py-3 md:py-4 border-b border-white/5 text-white' : 'bg-transparent text-white border-b border-white/20'}`}>
                {/* Left: Navigation Menu */}
                <nav className="flex-1 hidden lg:block">
                    <ul className="flex gap-4 xl:gap-8 text-[10px] uppercase tracking-mega font-medium">
                        {navItems.map((item, idx) => (
                            <li
                                key={idx}
                                className="hover:text-carapita-gold transition-colors duration-300 cursor-pointer whitespace-nowrap"
                                onClick={() => item.type === 'scroll' ? scrollToOrNavigate(item.id!) : handleNavigate(item.path!)}
                            >
                                {item.label}
                            </li>
                        ))}
                    </ul>
                </nav>

                {/* Mobile Menu Button */}
                <div className="flex-1 lg:hidden">
                    <button
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        className="text-white hover:text-carapita-gold transition-colors"
                    >
                        {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                    </button>
                </div>

                {/* Center: Logo */}
                <div className="flex-shrink-0 text-center mx-2 md:mx-4 relative group cursor-pointer" onClick={() => router.push('/')}>
                    <div className={`relative w-14 h-14 md:w-24 md:h-24 lg:w-28 lg:h-28 rounded-full overflow-hidden border-2 transition-all duration-700 p-0.5 shadow-2xl ${scrolled ? 'border-carapita-gold bg-carapita-green' : 'border-white/40 bg-white/10 backdrop-blur-sm'}`}>
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
                        className={`hidden md:flex items-center gap-2 px-6 py-2 rounded-full text-[10px] uppercase tracking-widest transition-all duration-300 border ${scrolled
                            ? 'border-white/20 text-white hover:bg-white hover:text-carapita-green'
                            : 'border-white text-white hover:bg-white hover:text-carapita-dark'
                            }`}
                    >
                        {isLoggedIn ? <User size={14} /> : <LogIn size={14} />}
                        <span>{mounted && isLoggedIn ? t('btn_conta') : t('btn_login')}</span>
                    </button>

                    <button onClick={onReservar} className={`text-[8px] md:text-[10px] uppercase tracking-mega font-bold rounded-full px-4 md:px-8 py-2 md:py-3 transition-all duration-500 bg-carapita-dark text-white hover:bg-carapita-gold text-center shadow-lg border border-white/5`}>
                        <span className="hidden sm:inline">{t('btn_reservar_now')}</span>
                        <span className="sm:hidden">{t('btn_reservar')}</span>
                    </button>
                </div>
            </header>

            {/* Mobile Navigation Drawer */}
            <div className={`fixed inset-0 z-40 bg-carapita-green transition-transform duration-500 lg:hidden ${mobileMenuOpen ? 'translate-y-0' : '-translate-y-full'}`}>
                <div className="flex flex-col items-center justify-center h-full gap-8 px-6 pt-20">
                    <ul className="flex flex-col items-center gap-8 text-sm uppercase tracking-[0.3em] font-medium text-white w-full">
                        {navItems.map((item, idx) => (
                            <li
                                key={idx}
                                className="hover:text-carapita-gold transition-colors duration-300 cursor-pointer border-b border-white/5 w-full text-center pb-4"
                                onClick={() => item.type === 'scroll' ? scrollToOrNavigate(item.id!) : handleNavigate(item.path!)}
                            >
                                {item.label}
                            </li>
                        ))}
                    </ul>

                    <div className="flex flex-col gap-4 w-full max-w-xs mt-4">
                        <button
                            onClick={() => {
                                setMobileMenuOpen(false);
                                const token = localStorage.getItem('token');
                                if (token) router.push('/perfil');
                                else router.push('/login');
                            }}
                            className="w-full py-4 border border-white/20 rounded-full text-[10px] uppercase tracking-widest text-white hover:bg-white hover:text-carapita-green transition-all"
                        >
                            {isLoggedIn ? t('btn_conta') : t('btn_login')}
                        </button>
                        <button
                            onClick={() => { setMobileMenuOpen(false); onReservar(); }}
                            className="w-full py-4 bg-carapita-gold text-carapita-dark rounded-full text-[10px] uppercase tracking-widest font-bold shadow-xl"
                        >
                            {t('btn_reservar_now')}
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
}
