"use client";
import React from 'react';
import { Wifi, Car, ShieldCheck, ThermometerSnowflake } from 'lucide-react';

interface ComodidadesSectionProps {
    t: (key: string) => string;
}

export default function ComodidadesSection({ t }: ComodidadesSectionProps) {
    const comodidades = [
        { icon: <Wifi size={24} />,                key: '1' },
        { icon: <ThermometerSnowflake size={24} />, key: '2' },
        { icon: <Car size={24} />,                  key: '3' },
        { icon: <ShieldCheck size={24} />,          key: '4' },
    ];

    return (
        <section id="comodidades" className="py-24 px-4 md:px-12 max-w-[1400px] mx-auto w-full border-t border-white/5">
            <div className="text-center mb-16 px-4">
                <span className="text-carapita-gold uppercase tracking-mega text-[10px] font-semibold block mb-4">
                    {t('comodidades_tag')}
                </span>
                <h3 className="text-4xl md:text-5xl font-serif text-white font-light leading-tight">
                    {t('comodidades_heading')} <i className="font-serif text-carapita-gold">{t('comodidades_heading_italic')}</i>
                </h3>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-5 lg:gap-6">
                {comodidades.map((item) => (
                    <div key={item.key}
                        className="group p-4 md:p-6 lg:p-7 bg-white/5 border border-white/5 hover:border-carapita-gold/30 transition-all duration-700 rounded-[1.5rem] md:rounded-[2rem] flex flex-col items-center text-center overflow-hidden">
                        <div className="mb-4 md:mb-6 text-carapita-gold group-hover:scale-110 transition-transform duration-500 shrink-0">
                            {item.icon}
                        </div>
                        <h5 className="text-white font-serif text-[11px] md:text-sm lg:text-xl mb-2 md:mb-4 uppercase tracking-wide md:tracking-widest leading-tight w-full">
                            {t(`comodidades_${item.key}_title`)}
                        </h5>
                        <p className="text-white/40 text-[10px] md:text-[11px] leading-relaxed font-light uppercase tracking-wide">
                            {t(`comodidades_${item.key}_desc`)}
                        </p>
                    </div>
                ))}
            </div>
        </section>
    );
}
