"use client";
import React from 'react';
import { useRouter, usePathname } from 'next/navigation';
import {
    BarChart2, Calendar, Home, TrendingUp, Lock, ArrowRight, Sparkles, RefreshCw, Terminal, MapPin, Settings
} from 'lucide-react';

export default function AdminSidebar() {
    const router = useRouter();
    const pathname = usePathname();

    const menuItems = [
        { icon: BarChart2, label: 'Dashboard', path: '/admin' },
        { icon: Calendar, label: 'Reservas', path: '/admin/reservas' },
        { icon: Home, label: 'Alojamento & Extras', path: '/admin/quartos' },
        { icon: RefreshCw, label: 'Integrações', path: '/admin/integracoes' },
        { icon: TrendingUp, label: 'Tarifas & Bloqueios', path: '/admin/tarifas' },
        { icon: Sparkles, label: 'Cupons', path: '/admin/cupons' },
        { icon: BarChart2, label: 'Relatórios', path: '/admin/relatorios' },
        { icon: MapPin, label: 'Passeios', path: '/admin/passeios' },
        { icon: Settings, label: 'Contactos & Redes', path: '/admin/configuracoes' },
    ];

    return (
        <aside className="fixed left-0 top-0 h-full w-20 bg-carapita-dark flex flex-col items-center py-8 gap-8 z-50 border-r border-white/5 shadow-2xl">
            <div className="mb-4 cursor-pointer group" onClick={() => router.push('/')}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-carapita-gold/10 group-hover:bg-carapita-gold transition-all duration-500">
                    <span className="text-carapita-gold group-hover:text-carapita-dark text-2xl font-serif">R</span>
                </div>
            </div>

            <div className="flex flex-col gap-4 flex-1">
                {menuItems.map(({ icon: Icon, label, path }) => {
                    const isActive = pathname === path;
                    return (
                        <button
                            key={path}
                            title={label}
                            onClick={() => router.push(path)}
                            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-500 relative group ${isActive
                                ? 'bg-carapita-gold text-carapita-dark shadow-lg shadow-carapita-gold/20'
                                : 'text-white/40 hover:text-white hover:bg-white/5'
                                }`}
                        >
                            <Icon size={18} />
                            {!isActive && (
                                <div className="absolute left-16 bg-carapita-dark text-white text-[10px] uppercase tracking-widest px-3 py-2 rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap shadow-xl border border-white/5">
                                    {label}
                                </div>
                            )}
                            {isActive && (
                                <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-1.5 h-1.5 rounded-full bg-carapita-gold" />
                            )}
                        </button>
                    );
                })}
            </div>

            <div className="mt-auto">
                <button
                    title="Voltar ao Site"
                    onClick={() => router.push('/')}
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-white/30 hover:text-white hover:bg-white/5 transition-all duration-500"
                >
                    <ArrowRight size={16} />
                </button>
            </div>
        </aside>
    );
}
