"use client";
import React from 'react';
import { MapPin, Navigation } from 'lucide-react';

interface LocalizacaoSectionProps {
    t: (key: string) => string;
    siteConfigs: any;
}

export default function LocalizacaoSection({ t, siteConfigs }: LocalizacaoSectionProps) {
    const endereco = siteConfigs.endereco || 'R. Dom Afonso Quarto Conde de Ourém IV 450, 2490-480 Ourém';

    return (
        <section id="localizacao" className="py-24 px-4 md:px-12 max-w-[1400px] mx-auto w-full">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                <div className="order-2 lg:order-1">
                    <div className="h-[450px] md:h-[600px] rounded-[3rem] overflow-hidden border border-white/10 relative shadow-2xl group">
                        <iframe
                            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3072.1530442925973!2d-8.586519699999998!3d39.64627009999999!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0xd1883a0fd387c21%3A0xdb482ac876e7244b!2sRef%C3%BAgio%20Carapita!5e0!3m2!1spt-PT!2spt!4v1773225814137!5m2!1spt-PT!2spt"
                            width="100%"
                            height="100%"
                            style={{ border: 0 }}
                            allowFullScreen
                            loading="lazy"
                            referrerPolicy="no-referrer-when-downgrade"
                            className="grayscale contrast-125 group-hover:grayscale-0 transition-all duration-1000"
                        ></iframe>
                        <div className="absolute inset-0 pointer-events-none border-[20px] border-carapita-green opacity-20" />
                    </div>
                </div>

                <div className="order-1 lg:order-2 space-y-8">
                    <span className="text-carapita-gold uppercase tracking-mega text-[10px] font-semibold block">{t('contact_tag')}</span>
                    <h2 className="text-4xl md:text-6xl font-serif text-white leading-tight font-light">
                        No Coração de <i className="font-serif text-carapita-gold">Ourém</i>
                    </h2>
                    
                    <p className="text-white/50 text-base font-light leading-relaxed max-w-lg">
                        Situado estrategicamente para quem procura tranquilidade, o Refúgio Carapita oferece o equilíbrio perfeito entre a calma da natureza e a proximidade aos principais marcos históricos de Portugal.
                    </p>

                    <div className="pt-8 space-y-8">
                        <div className="flex items-start gap-6 group">
                            <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-carapita-gold transition-all duration-500 group-hover:bg-carapita-gold group-hover:text-carapita-dark">
                                <MapPin size={20} />
                            </div>
                            <div>
                                <h4 className="text-white font-medium mb-1 uppercase tracking-widest text-[10px]">Endereço</h4>
                                <p className="text-white/40 text-[11px] uppercase tracking-widest leading-relaxed">
                                    {endereco}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-start gap-6 group">
                            <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-carapita-gold transition-all duration-500 group-hover:bg-carapita-gold group-hover:text-carapita-dark">
                                <Navigation size={20} />
                            </div>
                            <div>
                                <h4 className="text-white font-medium mb-1 uppercase tracking-widest text-[10px]">Instalações</h4>
                                <p className="text-white/40 text-[11px] uppercase tracking-widest leading-relaxed">
                                    A 5 minutos do Castelo e a 15 minutos de Fátima.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="pt-8">
                        <a 
                            href="https://maps.app.goo.gl/vfbginGV6Fjjp7YH9" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-4 px-10 py-5 bg-carapita-dark text-white border border-carapita-gold/20 text-[10px] uppercase tracking-mega font-bold rounded-2xl hover:bg-carapita-gold transition-all duration-500 shadow-xl"
                        >
                            <Navigation size={14} />
                            Como Chegar
                        </a>
                    </div>
                </div>
            </div>
        </section>
    );
}
