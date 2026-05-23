"use client";
import React from 'react';
import { useRouter, usePathname } from 'next/navigation';
import {
    BarChart2, Calendar, Home, TrendingUp, ArrowRight, Sparkles,
    RefreshCw, MapPin, Settings, MessageSquare
} from 'lucide-react';

export default function AdminSidebar() {
    const router = useRouter();
    const pathname = usePathname();

    const menuItems = [
        { icon: BarChart2,      label: 'Dashboard',    short: 'Dash',    path: '/admin' },
        { icon: Calendar,       label: 'Reservas',     short: 'Reservas',path: '/admin/reservas' },
        { icon: Home,           label: 'Alojamento',   short: 'Aloj.',   path: '/admin/quartos' },
        { icon: RefreshCw,      label: 'Integrações',  short: 'OTAs',    path: '/admin/integracoes' },
        { icon: TrendingUp,     label: 'Tarifas',      short: 'Tarifas', path: '/admin/tarifas' },
        { icon: Sparkles,       label: 'Cupons',       short: 'Cupons',  path: '/admin/cupons' },
        { icon: BarChart2,      label: 'Relatórios',   short: 'Relat.',  path: '/admin/relatorios' },
        { icon: MapPin,         label: 'Passeios',     short: 'Passeis', path: '/admin/passeios' },
        { icon: MessageSquare,  label: 'Mensagens',    short: 'Msg',     path: '/admin/mensagens' },
        { icon: Settings,       label: 'Contactos',    short: 'Config',  path: '/admin/configuracoes' },
    ];

    const isActive = (path: string) =>
        path === '/admin' ? pathname === '/admin' : pathname.startsWith(path);

    return (
        <>
            {/* ── Desktop Sidebar (≥md) ──────────────────────────────────── */}
            <aside
                className="hidden md:flex fixed left-0 top-0 h-full w-20 bg-[#1E3932] flex-col items-center py-8 gap-8 z-50 border-r border-white/5 shadow-2xl overflow-y-auto overflow-x-hidden"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' } as React.CSSProperties}
            >
                <div className="mb-4 cursor-pointer group" onClick={() => router.push('/')}>
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-[#C4A484]/10 group-hover:bg-[#C4A484] transition-all duration-500">
                        <span className="text-[#C4A484] group-hover:text-[#1E3932] text-2xl font-serif">R</span>
                    </div>
                </div>

                <div className="flex flex-col gap-4 flex-1">
                    {menuItems.map(({ icon: Icon, label, path }) => {
                        const active = isActive(path);
                        return (
                            <button
                                key={path}
                                title={label}
                                onClick={() => router.push(path)}
                                className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-500 relative group cursor-pointer ${
                                    active
                                        ? 'bg-[#C4A484] text-[#1E3932] shadow-lg shadow-[#C4A484]/20'
                                        : 'text-white/40 hover:text-white hover:bg-white/5'
                                }`}
                            >
                                <Icon size={18} />
                                {!active && (
                                    <div className="absolute left-16 bg-[#1E3932] text-white text-[10px] uppercase tracking-widest px-3 py-2 rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap shadow-xl border border-white/5 z-[60]">
                                        {label}
                                    </div>
                                )}
                                {active && (
                                    <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-1.5 h-1.5 rounded-full bg-[#C4A484]" />
                                )}
                            </button>
                        );
                    })}
                </div>

                <div className="mt-auto">
                    <button
                        title="Voltar ao Site"
                        onClick={() => router.push('/')}
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-white/30 hover:text-white hover:bg-white/5 transition-all duration-500 cursor-pointer"
                    >
                        <ArrowRight size={16} />
                    </button>
                </div>
            </aside>

            {/* ── Mobile Bottom Nav (<md) ────────────────────────────────── */}
            <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#1E3932] border-t border-white/10">
                <div className="flex overflow-x-auto scrollbar-hide px-1 py-1 gap-0.5">
                    {menuItems.map(({ icon: Icon, label, short, path }) => {
                        const active = isActive(path);
                        return (
                            <button
                                key={path}
                                onClick={() => router.push(path)}
                                className={`flex flex-col items-center justify-center gap-0.5 px-2 py-2 flex-shrink-0 min-w-[58px] rounded-xl transition-all cursor-pointer ${
                                    active
                                        ? 'bg-[#C4A484]/20 text-[#C4A484]'
                                        : 'text-white/40 active:bg-white/5 active:text-white/80'
                                }`}
                            >
                                <Icon size={20} />
                                <span className={`text-[8px] uppercase tracking-wide leading-none font-semibold mt-0.5 ${
                                    active ? 'text-[#C4A484]' : 'text-white/40'
                                }`}>
                                    {short}
                                </span>
                            </button>
                        );
                    })}
                    <button
                        onClick={() => router.push('/')}
                        className="flex flex-col items-center justify-center gap-0.5 px-2 py-2 flex-shrink-0 min-w-[50px] rounded-xl text-white/30 active:text-white/60 transition-all cursor-pointer"
                    >
                        <ArrowRight size={20} />
                        <span className="text-[8px] uppercase tracking-wide leading-none font-semibold mt-0.5 text-white/30">Site</span>
                    </button>
                </div>
            </nav>
        </>
    );
}
