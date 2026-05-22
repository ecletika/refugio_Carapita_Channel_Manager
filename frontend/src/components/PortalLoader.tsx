"use client";
import React from 'react';

interface PortalLoaderProps {
    label?: string;
}

/**
 * Loader do Portal do Hóspede com o logo da Carapita.
 * Usa o mesmo fundo verde e estética do SplashLoader inicial do site,
 * para que as transições entre /perfil, /perfil/pagamentos e páginas
 * institucionais sejam fluidas — sem "saltos" de cor entre ecrãs.
 */
export default function PortalLoader({ label = 'A carregar...' }: PortalLoaderProps) {
    return (
        <div className="fixed inset-0 z-[9000] flex flex-col items-center justify-center bg-carapita-green animate-fade-in">
            <div className="relative w-24 h-24 md:w-28 md:h-28 mb-7 flex items-center justify-center">
                {/* Anel dourado a girar */}
                <svg className="absolute inset-0 w-full h-full -rotate-90 animate-spin" style={{ animationDuration: '2.2s' }}>
                    <circle
                        cx="50%"
                        cy="50%"
                        r="47%"
                        stroke="#C4A484"
                        strokeWidth="2"
                        fill="none"
                        strokeLinecap="round"
                        strokeDasharray="150"
                        strokeDashoffset="55"
                    />
                </svg>

                {/* Logo oficial com leve pulsar */}
                <div className="w-[80%] h-[80%] rounded-full overflow-hidden border border-white/10 shadow-2xl animate-pulse" style={{ animationDuration: '2.2s' }}>
                    <img
                        src="/logo.jpg"
                        alt="Refúgio Carapita"
                        className="w-full h-full object-cover"
                    />
                </div>
            </div>

            <h2 className="text-white/80 font-serif text-[10px] md:text-[11px] uppercase tracking-[0.4em] font-light">
                {label}
            </h2>
        </div>
    );
}
