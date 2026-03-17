"use client";

import React, { useState, useEffect } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { MapPin, X, Clock, Calendar, ChevronRight, Info } from "lucide-react";
import { dictionaries as dict } from "@/i18n/dictionaries";

export default function PasseiosPage() {
    const [lang, setLangState] = useState<'PT' | 'EN'>('PT');
    const [mounted, setMounted] = useState(false);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [siteConfigs, setSiteConfigs] = useState<any>({});
    const [passeios, setPasseios] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [passeioSelecionado, setPasseioSelecionado] = useState<any | null>(null);

    const setLang = (newLang: 'PT' | 'EN') => {
        setLangState(newLang);
        if (typeof window !== 'undefined') {
            localStorage.setItem('preferencia_idioma', newLang);
        }
    };

    const t = (key: string) => dict[lang][key as keyof typeof dict['PT']] || key;

    useEffect(() => {
        setMounted(true);
        setIsLoggedIn(!!localStorage.getItem('token'));
        const savedLang = localStorage.getItem('preferencia_idioma') as 'PT' | 'EN';
        if (savedLang && (savedLang === 'PT' || savedLang === 'EN')) {
            setLangState(savedLang);
        }

        const fetchData = async () => {
            try {
                const [passeiosResp, configsResp] = await Promise.all([
                    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/site/passeios?t=${Date.now()}`),
                    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/site/configuracoes?t=${Date.now()}`)
                ]);

                const passeiosJson = await passeiosResp.json();
                const configsJson = await configsResp.json();

                if (passeiosJson.status === 'success') {
                    setPasseios(passeiosJson.data.filter((p: any) => p.ativo !== false));
                }
                if (configsJson.status === 'success') {
                    setSiteConfigs(configsJson.data);
                }
            } catch (error) {
                console.error("Erro ao carregar dados", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    if (!mounted) return null;

    return (
        <main className="min-h-screen bg-carapita-green flex flex-col font-sans selection:bg-carapita-gold selection:text-white">
            <Header
                lang={lang}
                setLang={setLang}
                mounted={mounted}
                isLoggedIn={isLoggedIn}
                onReservar={() => window.location.href = '/?book=true'}
                scrolled={true}
            />

            {/* Hero Section */}
            <section className="relative pt-48 pb-20 px-6 md:px-12 text-center">
                <div className="max-w-4xl mx-auto">
                    <span className="text-carapita-gold uppercase tracking-mega text-xs font-semibold block mb-4 animate-fade-in">
                        {t('passeios_tag')}
                    </span>
                    <h1 className="text-4xl md:text-6xl lg:text-7xl font-serif text-white font-light leading-tight mb-8 animate-fade-in delay-100">
                        Passeios & <i className="font-serif text-carapita-gold">Roteiros</i>
                    </h1>
                    <p className="text-white/60 text-lg md:text-xl font-light max-w-2xl mx-auto leading-relaxed animate-fade-in delay-200">
                        Explore a herança templária, as paisagens naturais e os segredos de Ourém. Criamos sugestões para que a sua estadia seja inesquecível.
                    </p>
                </div>
            </section>

            {/* Roteiros Sugeridos Section */}
            <section className="py-20 px-6 md:px-12 max-w-7xl mx-auto">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-20">
                    <div className="bg-white/5 border border-white/10 p-8 rounded-3xl backdrop-blur-sm hover:border-carapita-gold/50 transition-all group">
                        <div className="w-12 h-12 bg-carapita-gold/10 rounded-2xl flex items-center justify-center text-carapita-gold mb-6 group-hover:bg-carapita-gold group-hover:text-white transition-all">
                            <Clock size={24} />
                        </div>
                        <h3 className="text-xl font-serif text-white mb-4">Roteiro Express (1 Dia)</h3>
                        <p className="text-white/50 text-sm leading-relaxed mb-6">Ideal para quem tem pouco tempo e quer ver o essencial de Ourém e Fátima.</p>
                        <ul className="space-y-3 text-xs text-white/70 uppercase tracking-widest">
                            <li className="flex items-center gap-2"><ChevronRight size={12} className="text-carapita-gold" /> Castelo de Ourém</li>
                            <li className="flex items-center gap-2"><ChevronRight size={12} className="text-carapita-gold" /> Santuário de Fátima</li>
                            <li className="flex items-center gap-2"><ChevronRight size={12} className="text-carapita-gold" /> Vila Medieval</li>
                        </ul>
                    </div>
                    <div className="bg-white/5 border border-white/10 p-8 rounded-3xl backdrop-blur-sm hover:border-carapita-gold/50 transition-all group">
                        <div className="w-12 h-12 bg-carapita-gold/10 rounded-2xl flex items-center justify-center text-carapita-gold mb-6 group-hover:bg-carapita-gold group-hover:text-white transition-all">
                            <Calendar size={24} />
                        </div>
                        <h3 className="text-xl font-serif text-white mb-4">Herança Templária (2 Dias)</h3>
                        <p className="text-white/50 text-sm leading-relaxed mb-6">Mergulhe na história dos cavaleiros que moldaram Portugal.</p>
                        <ul className="space-y-3 text-xs text-white/70 uppercase tracking-widest">
                            <li className="flex items-center gap-2"><ChevronRight size={12} className="text-carapita-gold" /> Convento de Cristo</li>
                            <li className="flex items-center gap-2"><ChevronRight size={12} className="text-carapita-gold" /> Castelo de Tomar</li>
                            <li className="flex items-center gap-2"><ChevronRight size={12} className="text-carapita-gold" /> Aqueduto dos Pegões</li>
                        </ul>
                    </div>
                    <div className="bg-white/5 border border-white/10 p-8 rounded-3xl backdrop-blur-sm hover:border-carapita-gold/50 transition-all group">
                        <div className="w-12 h-12 bg-carapita-gold/10 rounded-2xl flex items-center justify-center text-carapita-gold mb-6 group-hover:bg-carapita-gold group-hover:text-white transition-all">
                            <MapPin size={24} />
                        </div>
                        <h3 className="text-xl font-serif text-white mb-4">Natureza & Grutas</h3>
                        <p className="text-white/50 text-sm leading-relaxed mb-6">Para os amantes de trilhos e maravilhas geológicas.</p>
                        <ul className="space-y-3 text-xs text-white/70 uppercase tracking-widest">
                            <li className="flex items-center gap-2"><ChevronRight size={12} className="text-carapita-gold" /> Grutas de Mira de Aire</li>
                            <li className="flex items-center gap-2"><ChevronRight size={12} className="text-carapita-gold" /> Pegadas Dinossauros</li>
                            <li className="flex items-center gap-2"><ChevronRight size={12} className="text-carapita-gold" /> Agroal</li>
                        </ul>
                    </div>
                </div>

                {/* Grid de Passeios */}
                <div className="text-center mb-16">
                    <h2 className="text-3xl font-serif text-white mb-4">Todos os Pontos de Interesse</h2>
                    <div className="w-20 h-1 bg-carapita-gold mx-auto opacity-50 rounded-full"></div>
                </div>

                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 animate-pulse">
                        {[1, 2, 3, 4, 5, 6].map(i => (
                            <div key={i} className="bg-white/5 h-96 rounded-3xl"></div>
                        ))}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                        {passeios.map((passeio, idx) => (
                            <div
                                key={idx}
                                className="group bg-white/5 border border-white/5 rounded-[2.5rem] overflow-hidden hover:border-carapita-gold/30 transition-all duration-700 cursor-pointer flex flex-col"
                                onClick={() => setPasseioSelecionado(passeio)}
                            >
                                <div className="h-72 overflow-hidden relative">
                                    <img
                                        src={passeio.img}
                                        alt={passeio.nome}
                                        className="w-full h-full object-cover transform duration-1000 group-hover:scale-110"
                                    />
                                    <div className="absolute top-6 left-6 bg-carapita-dark/80 backdrop-blur-md px-4 py-1.5 rounded-full flex items-center gap-2 border border-white/10">
                                        <MapPin size={12} className="text-carapita-gold" />
                                        <span className="text-[10px] uppercase tracking-widest font-bold text-white">{passeio.dist}</span>
                                    </div>
                                    <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-carapita-green to-transparent opacity-80"></div>
                                </div>
                                <div className="p-8 flex-1 flex flex-col">
                                    <h3 className="text-2xl font-serif text-white mb-4 group-hover:text-carapita-gold transition-colors">{passeio.nome}</h3>
                                    <p className="text-white/50 text-sm font-light leading-relaxed line-clamp-3 mb-6">{passeio.desc}</p>
                                    <div className="mt-auto flex items-center gap-2 text-carapita-gold text-[10px] uppercase tracking-mega font-bold">
                                        {t('essencia_btn')}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </section>

            {/* CTA Section */}
            <section className="py-32 px-6 text-center bg-carapita-dark/30 border-t border-white/5 relative overflow-hidden">
                <div className="absolute inset-0 pattern-dots opacity-5"></div>
                <div className="max-w-2xl mx-auto relative z-10">
                    <h2 className="text-4xl font-serif text-white mb-8">Pronto para a sua jornada?</h2>
                    <p className="text-white/60 mb-12">Garanta a sua estadia no Refúgio Carapita e comece a planear as suas memórias.</p>
                    <button
                        onClick={() => window.location.href = '/?book=true'}
                        className="bg-carapita-gold text-carapita-dark px-12 py-4 rounded-full text-xs font-bold uppercase tracking-mega hover:bg-white transition-all transform hover:scale-105"
                    >
                        {t('btn_reservar_now')}
                    </button>
                </div>
            </section>

            <Footer t={t} lang={lang} siteConfigs={siteConfigs} />

            {/* Modal de Detalhes (Reusing from Home) */}
            {passeioSelecionado && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/90 backdrop-blur-md transition-opacity animate-fade-in" onClick={() => setPasseioSelecionado(null)}></div>
                    <div className="relative bg-carapita-green w-full max-w-5xl max-h-[90vh] overflow-y-auto z-[101] shadow-2xl flex flex-col md:flex-row animate-scale-up border border-white/10 rounded-[2rem]">
                        <button
                            className="absolute top-6 right-6 z-[102] w-12 h-12 bg-white/10 hover:bg-carapita-gold text-white rounded-full flex items-center justify-center transition-all backdrop-blur-md"
                            onClick={() => setPasseioSelecionado(null)}
                        >
                            <X size={24} />
                        </button>

                        <div className="w-full md:w-1/2 min-h-[400px] relative">
                            <img src={passeioSelecionado.img} className="absolute inset-0 w-full h-full object-cover" alt={passeioSelecionado.nome} />
                            <div className="absolute bottom-8 left-8 bg-carapita-dark/80 backdrop-blur-md px-6 py-3 rounded-xl flex items-center gap-3 shadow-2xl border border-white/10">
                                <MapPin size={16} className="text-carapita-gold" />
                                <span className="text-xs uppercase tracking-widest font-bold text-white">{passeioSelecionado.dist} {t('passeios_da_casa')}</span>
                            </div>
                        </div>

                        <div className="w-full md:w-1/2 p-12 md:p-20 flex flex-col justify-center bg-carapita-green">
                            <span className="text-carapita-gold uppercase tracking-widest text-xs font-medium block mb-6 border-b border-carapita-gold/30 pb-4 inline-block">{t('passeios_descobrir')}</span>
                            <h3 className="text-4xl md:text-5xl font-serif text-white leading-tight font-light mb-8">
                                {passeioSelecionado.nome}
                            </h3>
                            <div className="prose prose-invert max-w-none">
                                <p className="text-white/70 font-light leading-[1.8] text-base mb-12 text-justify">
                                    {passeioSelecionado.historia}
                                </p>
                            </div>

                            <div className="flex flex-col sm:flex-row gap-4">
                                <a
                                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(passeioSelecionado.nome + " Portugal")}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="flex-1 text-center bg-carapita-dark hover:bg-carapita-gold border border-white/10 text-white text-[10px] uppercase tracking-mega py-5 rounded-xl transition-all duration-500 font-bold"
                                >
                                    {t('passeios_btn_mapa')}
                                </a>
                                <button
                                    onClick={() => setPasseioSelecionado(null)}
                                    className="px-10 py-5 bg-white/5 hover:bg-white/10 border border-white/10 text-white text-[10px] uppercase tracking-mega rounded-xl transition-all font-bold"
                                >
                                    Fechar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <style jsx global>{`
                .animate-fade-in {
                    animation: fadeIn 0.8s ease-out forwards;
                }
                .animate-scale-up {
                    animation: scaleUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                }
                .delay-100 { animation-delay: 0.1s; }
                .delay-200 { animation-delay: 0.2s; }
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                @keyframes scaleUp {
                    from { opacity: 0; transform: scale(0.95) translateY(10px); }
                    to { opacity: 1; transform: scale(1) translateY(0); }
                }
                .pattern-dots {
                    background-image: radial-gradient(circle, #fff 1px, transparent 1px);
                    background-size: 30px 30px;
                }
            `}</style>
        </main>
    );
}
