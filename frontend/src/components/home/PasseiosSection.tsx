"use client";
import React from 'react';
import { X, MapPin, Calendar, Clock, Star, Trophy } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface Passeio {
    id: string;
    nome: string;
    desc: string;
    historia?: string;
    duracao?: string;
    distancia?: string;
    dist?: string;
    preco?: string;
    img: string;
    fotos?: string;
    dificuldade?: string;
}

interface PasseiosSectionProps {
    t: (key: string) => string;
    passeios: Passeio[];
}

export default function PasseiosSection({ t, passeios }: PasseiosSectionProps) {
    const router = useRouter();
    const [passeioSelecionado, setPasseioSelecionado] = React.useState<Passeio | null>(null);

    return (
        <section id="passeios" className="py-24 px-4 md:px-12 max-w-[1400px] mx-auto w-full bg-carapita-green border-b border-white/5">
            <div className="text-center mb-16">
                <span className="text-carapita-gold uppercase tracking-mega text-[10px] font-semibold block mb-4">{t('passeios_tag')}</span>
                <h3 className="text-4xl md:text-5xl font-serif text-white font-light max-w-2xl mx-auto leading-tight">
                    {t('passeios_title')} <i className="font-serif text-carapita-gold">{t('passeios_title_refugio')}</i>
                </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {passeios.slice(0, 4).map((passeio, idx) => (
                    <div key={idx} className="group flex flex-col items-center text-center cursor-pointer" onClick={() => setPasseioSelecionado(passeio)}>
                        <div className="w-full h-64 md:h-72 overflow-hidden mb-6 relative border border-white/10">
                            <img src={passeio.img} alt={passeio.nome} className="w-full h-full object-cover transform duration-700 group-hover:scale-105 filter group-hover:brightness-110" />
                            <div className="absolute top-4 left-4 bg-carapita-green/90 backdrop-blur-sm px-3 py-1 flex items-center gap-1 shadow-sm border border-white/5">
                                <MapPin size={10} className="text-carapita-gold" />
                                <span className="text-[9px] uppercase tracking-widest font-semibold text-white">{passeio.dist || passeio.distancia}</span>
                            </div>
                        </div>
                        <h5 className="text-sm font-serif text-white font-medium mb-2 group-hover:text-carapita-gold transition-colors">{passeio.nome}</h5>
                        <p className="text-[11px] text-white/50 font-light leading-relaxed max-w-[220px] line-clamp-2">{passeio.desc}</p>
                    </div>
                ))}
            </div>

            <div className="mt-16 text-center">
                <button
                    onClick={() => router.push('/passeios')}
                    className="px-10 py-4 bg-transparent border border-carapita-gold text-carapita-gold text-[10px] uppercase tracking-mega font-bold rounded-full hover:bg-carapita-gold hover:text-white transition-all duration-500"
                >
                    Ver Todos os Passeios e Roteiros
                </button>
            </div>

            {/* PASSEIO DETALHES MODAL */}
            {passeioSelecionado && (
                <div className="fixed inset-0 z-[600] flex items-center justify-center p-4 md:p-6 backdrop-blur-md bg-carapita-dark/40 animate-fade-in">
                    <div className="absolute inset-0" onClick={() => setPasseioSelecionado(null)} />
                    <div className="relative bg-carapita-green w-full max-w-5xl h-fit max-h-[90vh] overflow-y-auto scrollbar-hide shadow-3xl border border-white/5 flex flex-col md:flex-row">
                        <button onClick={() => setPasseioSelecionado(null)} className="absolute top-6 right-6 z-20 text-white/40 hover:text-white p-2 bg-black/20 rounded-full transition-all">
                            <X size={24} />
                        </button>

                        <div className="w-full md:w-1/2 h-[300px] md:h-auto sticky top-0 md:relative">
                            <img src={passeioSelecionado.img} className="w-full h-full object-cover" alt={passeioSelecionado.nome} />
                            <div className="absolute inset-0 bg-gradient-to-t from-carapita-green via-transparent to-transparent opacity-60 md:hidden" />
                        </div>

                        <div className="w-full md:w-1/2 p-10 md:p-14 lg:p-20 overflow-y-auto">
                            <span className="text-carapita-gold text-[10px] uppercase tracking-mega font-bold mb-4 block">Experiência Única</span>
                            <h2 className="text-4xl md:text-5xl font-serif text-white mb-8 leading-tight">{passeioSelecionado.nome}</h2>
                            
                            <div className="grid grid-cols-2 gap-8 mb-12 py-8 border-y border-white/10">
                                <div className="flex flex-col gap-1">
                                    <span className="text-[9px] uppercase tracking-widest text-white/30 font-bold flex items-center gap-2 mb-2"><Clock size={12} className="text-carapita-gold"/> Duração</span>
                                    <span className="text-xs text-white font-medium uppercase tracking-widest">{passeioSelecionado.duracao || '2 - 4 Horas'}</span>
                                </div>
                                <div className="flex flex-col gap-1">
                                    <span className="text-[9px] uppercase tracking-widest text-white/30 font-bold flex items-center gap-2 mb-2"><Trophy size={12} className="text-carapita-gold"/> Dificuldade</span>
                                    <span className="text-xs text-white font-medium uppercase tracking-widest">{passeioSelecionado.dificuldade || 'Baixa'}</span>
                                </div>
                                <div className="flex flex-col gap-1">
                                    <span className="text-[9px] uppercase tracking-widest text-white/30 font-bold flex items-center gap-2 mb-2"><MapPin size={12} className="text-carapita-gold"/> Distância</span>
                                    <span className="text-xs text-white font-medium uppercase tracking-widest">{passeioSelecionado.dist || passeioSelecionado.distancia}</span>
                                </div>
                                <div className="flex flex-col gap-1">
                                    <span className="text-[9px] uppercase tracking-widest text-white/30 font-bold flex items-center gap-2 mb-2"><Star size={12} className="text-carapita-gold"/> Sugestão</span>
                                    <span className="text-xs text-white font-medium uppercase tracking-widest">Ideal para Famílias</span>
                                </div>
                            </div>

                            <p className="text-sm text-white/70 font-light leading-relaxed mb-10 italic">"{passeioSelecionado.desc}"</p>
                            
                            {passeioSelecionado.historia && (
                                <div className="space-y-6 mb-12">
                                    <h4 className="text-[10px] uppercase tracking-mega text-carapita-gold font-bold">Unidade e História</h4>
                                    <p className="text-sm text-white/60 font-light leading-relaxed">{passeioSelecionado.historia}</p>
                                </div>
                            )}

                            <button onClick={() => setPasseioSelecionado(null)} className="w-full py-5 bg-carapita-dark text-white border border-carapita-gold/20 text-[10px] uppercase tracking-mega font-bold hover:bg-carapita-gold transition-all duration-500 shadow-xl">
                                Voltar a Explorar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
}
