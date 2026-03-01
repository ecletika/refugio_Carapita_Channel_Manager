"use client";
import React, { useEffect, useState } from 'react';

export default function SplashLoader() {
    const [visible, setVisible] = useState(true);

    useEffect(() => {
        // O loader fica visível por 3 segundos (2s de desenho + fade-out)
        const timer = setTimeout(() => {
            setVisible(false);
        }, 3000);

        return () => clearTimeout(timer);
    }, []);

    if (!visible) return null;

    return (
        <div className="fixed inset-0 z-[10000] flex flex-col items-center justify-center bg-[#1E3932] splash-fade-out pointer-events-none">
            <div className="relative flex flex-col items-center">
                {/* Frame do Logo com Animação de Desenho */}
                <div className="relative w-32 h-32 md:w-40 md:h-40 mb-8 flex items-center justify-center">
                    {/* Círculo que "desenha" o contorno */}
                    <svg className="absolute inset-0 w-full h-full -rotate-90">
                        <circle
                            cx="50%"
                            cy="50%"
                            r="48%"
                            stroke="white"
                            strokeWidth="2"
                            fill="none"
                            strokeLinecap="round"
                            className="animate-draw-circle"
                        />
                    </svg>

                    {/* O Logo Oficial */}
                    <div className="w-[85%] h-[85%] rounded-full overflow-hidden border border-white/10 shadow-2xl animate-logo-reveal">
                        <img
                            src="/logo.jpg"
                            alt="Refúgio Carapita"
                            className="w-full h-full object-cover"
                        />
                    </div>
                </div>

                {/* Texto do Logo */}
                <div className="overflow-hidden">
                    <h2 className="text-white font-serif text-[10px] md:text-[12px] uppercase tracking-[0.5em] font-light animate-text-reveal">
                        Refúgio Carapita
                    </h2>
                </div>
            </div>
        </div>
    );
}
