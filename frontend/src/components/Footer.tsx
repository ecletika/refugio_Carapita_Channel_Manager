"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Instagram, Facebook, BookOpen, ShieldCheck, FileText } from "lucide-react";
import { dictionaries as dict } from "@/i18n/dictionaries";

interface FooterProps {
    lang: "PT" | "EN";
    siteConfigs: any;
}

export default function Footer({ lang, siteConfigs }: FooterProps) {
    const router = useRouter();
    const t = (key: string) => dict[lang][key as keyof typeof dict["PT"]] || key;

    const scrollToOrNavigate = (id: string) => {
        if (window.location.pathname === "/") {
            document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
        } else {
            router.push(`/#${id}`);
        }
    };

    return (
        <footer id="contatos" className="bg-carapita-dark text-white py-24 px-6 md:px-16 border-t-[12px] border-carapita-gold mt-auto">
            <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start gap-16">
                <div className="w-full lg:w-1/4 md:w-1/3 text-center md:text-left flex flex-col justify-between">
                    <div className="flex flex-col items-center md:items-start group cursor-pointer" onClick={() => router.push('/')}>
                        <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-carapita-gold/50 mb-6 p-0.5 bg-carapita-dark group-hover:border-carapita-gold transition-all duration-500 shadow-xl">
                            <img src="/logo.jpg" alt="Refúgio Carapita Logo" className="w-full h-full object-cover" />
                        </div>
                        <h2 className="text-xl md:text-2xl font-serif font-light uppercase tracking-widest whitespace-nowrap">
                            Refúgio <span className="text-carapita-gold text-lg md:text-xl tracking-mega">Carapita</span>
                        </h2>
                    </div>
                    <div className="flex gap-4 justify-center md:justify-start mt-8">
                        {siteConfigs.linkInstagram && (
                            <a href={siteConfigs.linkInstagram} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center hover:bg-carapita-gold hover:border-carapita-gold transition-all duration-300">
                                <Instagram size={16} />
                            </a>
                        )}
                        {siteConfigs.linkFacebook && (
                            <a href={siteConfigs.linkFacebook} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center hover:bg-carapita-gold hover:border-carapita-gold transition-all duration-300">
                                <Facebook size={16} />
                            </a>
                        )}
                        {siteConfigs.linkAirbnb && (
                            <a href={siteConfigs.linkAirbnb} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center hover:bg-[#FF5A5F] hover:border-[#FF5A5F] transition-all duration-300 group">
                                <svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" role="presentation" focusable="false" className="w-5 h-5 fill-white"><path d="m16 1c2.008 0 3.463.963 4.751 3.269l.533 1.025c1.954 3.83 6.114 12.54 7.1 14.836l.145.353c.667 1.591.91 2.472.96 3.396l.011.415c0 3.447-2.541 6.27-5.688 6.651l-.312.022c-1.928 0-3.391-.853-4.75-2.827-1.359 1.974-2.822 2.827-4.75 2.827-3.132 0-5.688-2.583-5.978-5.836l-.022-.4c0-.924.243-1.805.91-3.396l.144-.351c.987-2.296 5.147-11.006 7.101-14.836l.533-1.025c1.288-2.306 2.743-3.269 4.751-3.269zm0 2c-1.282 0-2.12.63-3 2.193l-.533 1.026c-1.936 3.792-6.081 12.474-7.057 14.753-.567 1.354-.755 2.05-.79 2.76l-.01.329c0 2.21 1.7 4.1 3.91 4.385l.29.015c1.47 0 2.463-.67 3.513-2.193l.301-.453.307-.453c.48-.702 1.018-1.513 1.637-2.457l1.452-2.214 1.452 2.214c.619.944 1.157 1.755 1.637 2.457l.307.453.301.453c1.05 1.523 2.043 2.193 3.513 2.193 2.227 0 4.1-1.888 4.2-4.1l.01-.3c0-.71-.188-1.406-.755-2.76l-.035-.082c-.976-2.279-5.122-10.96-7.077-14.793l-.533-1.026c-.88-1.563-1.718-2.193-3-2.193zm0 13a3 3 0 1 0 0 6 3 3 0 0 0 0-6z"></path></svg>
                            </a>
                        )}
                        {siteConfigs.linkBooking && (
                            <a href={siteConfigs.linkBooking} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center hover:bg-[#003580] hover:border-[#003580] transition-all duration-300 text-white font-bold text-xs uppercase cursor-pointer">
                                B.
                            </a>
                        )}
                    </div>
                </div>
                <div className="w-full lg:w-3/4 md:w-2/3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-12 text-center md:text-left">
                    <div className="flex flex-col gap-4 text-xs font-light text-white/70">
                        <h5 className="text-white tracking-mega uppercase font-medium mb-4">{t('footer_acasa')}</h5>
                        <span className="hover:text-carapita-gold transition-colors duration-300 cursor-pointer" onClick={() => scrollToOrNavigate('a-essencia')}>{t('footer_a_essencia')}</span>
                        <span className="hover:text-carapita-gold transition-colors duration-300 cursor-pointer" onClick={() => scrollToOrNavigate('alojamento')}>{t('alojamento_tag')}</span>
                        <span className="hover:text-carapita-gold transition-colors duration-300 cursor-pointer" onClick={() => router.push('/passeios')}>{t('footer_atracoes')}</span>
                        <span className="hover:text-carapita-gold transition-colors duration-300 cursor-pointer" onClick={() => router.push('/contatos')}>{t('menu_contatos')}</span>
                    </div>

                    <div className="flex flex-col gap-4 text-xs font-light text-white/70">
                        <h5 className="text-white tracking-mega uppercase font-medium mb-4">Institucional</h5>
                        <a href="https://www.livroreclamacoes.pt/INICIO/" target="_blank" rel="noopener noreferrer" className="hover:text-carapita-gold transition-colors duration-300 flex items-center justify-center md:justify-start gap-2">
                            <BookOpen size={14} className="text-carapita-gold" />
                            {t('footer_livro_reclamacoes')}
                        </a>
                        <a href="/tratamento-dados" className="hover:text-carapita-gold transition-colors duration-300 flex items-center justify-center md:justify-start gap-2">
                            <ShieldCheck size={14} className="text-carapita-gold" />
                            {t('footer_politica_dados')}
                        </a>
                        <a 
                            href="https://rnt.turismodeportugal.pt/RNT/RNAL.aspx?nr=172760" 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="flex items-center justify-center md:justify-start gap-2 hover:text-carapita-gold transition-colors duration-300"
                        >
                            <FileText size={14} className="text-carapita-gold" />
                            <span>{t('footer_rnet')}</span>
                        </a>
                        <a href="/regras-hospedes" className="hover:text-carapita-gold transition-colors duration-300">{t('footer_regras')}</a>
                        <a href="/politica-cancelamento" className="hover:text-carapita-gold transition-colors duration-300">{t('footer_politica_cancelamento')}</a>
                    </div>

                    <div className="flex flex-col gap-4 text-xs font-light text-white/70">
                        <h5 className="text-white tracking-mega uppercase font-medium mb-4">{t('footer_regras_casa_tit')}</h5>
                        <p>{t('footer_checkin')}</p>
                        <p>{t('footer_checkout')}</p>
                        <p>{t('footer_max_pessoas')}</p>
                        <a href="/regras-da-casa" className="hover:text-carapita-gold transition-colors duration-300 font-bold underline mt-2 w-fit mx-auto md:mx-0 inline-block">{t('footer_saiba_mais')}</a>
                    </div>
                </div>
            </div>
        </footer>
    );
}
