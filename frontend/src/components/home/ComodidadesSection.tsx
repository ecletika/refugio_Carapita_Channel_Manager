"use client";
import React from 'react';
import { Wifi, Coffee, Wind, Wine, Car, Eye, ShieldCheck, ThermometerSnowflake } from 'lucide-react';

interface Comodidade {
    icon: React.ReactNode;
    title: string;
    desc: string;
}

interface ComodidadesSectionProps {
    t: (key: string) => string;
}

export default function ComodidadesSection({ t }: ComodidadesSectionProps) {
    const comodidades: Comodidade[] = [
        {
            icon: <Wifi size={28} />,
            title: "Conectividade",
            desc: "Wi-Fi de alta velocidade em todas as áreas da propriedade."
        },
        {
            icon: <ThermometerSnowflake size={28} />,
            title: "Climatização",
            desc: "Ar condicionado topo de gama para o seu conforto térmico absoluto."
        },
        {
            icon: <Car size={28} />,
            title: "Estacionamento",
            desc: "Estacionamento Gratuito na rua"
        },
        {
            icon: <ShieldCheck size={28} />,
            title: "Privacidade",
            desc: "Acesso exclusivo e ambiente de total tranquilidade e segurança."
        }
    ];

    return (
        <section id="comodidades" className="py-24 px-4 md:px-12 max-w-[1400px] mx-auto w-full border-t border-white/5 bg-carapita-dark/5">
            <div className="text-center mb-16 px-4">
                <span className="text-carapita-gold uppercase tracking-mega text-[10px] font-semibold block mb-4">Experiência Refúgio</span>
                <h3 className="text-4xl md:text-5xl font-serif text-white font-light leading-tight">
                    Conforto & <i className="font-serif text-carapita-gold">Sofisticação</i>
                </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-12">
                {comodidades.map((item, idx) => (
                    <div key={idx} className="group p-10 bg-white/5 border border-white/5 hover:border-carapita-gold/30 transition-all duration-700 rounded-[2rem] flex flex-col items-center text-center">
                        <div className="mb-6 text-carapita-gold group-hover:scale-110 transition-transform duration-500">
                            {item.icon}
                        </div>
                        <h5 className="text-white font-serif text-xl mb-4 uppercase tracking-widest">{item.title}</h5>
                        <p className="text-white/40 text-[11px] leading-relaxed font-light max-w-[240px] uppercase tracking-widest">
                            {item.desc}
                        </p>
                    </div>
                ))}
            </div>
        </section>
    );
}
