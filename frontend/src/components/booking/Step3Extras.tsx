import React from 'react';
import { ChevronLeft } from 'lucide-react';

interface Extra {
    id: string;
    nome: string;
    descricao: string;
    preco: number | string;
    foto?: string;
    icone?: string;
}

interface Step3ExtrasProps {
    t: (key: string) => string;
    lang: string;
    disponiveisExtras: Extra[];
    selectedExtras: string[];
    setSelectedExtras: (ids: string[]) => void;
    setBookingStep: (step: string) => void;
}

export default function Step3Extras({
    t,
    lang,
    disponiveisExtras,
    selectedExtras,
    setSelectedExtras,
    setBookingStep
}: Step3ExtrasProps) {
    return (
        <div className="animate-fade-in max-w-4xl mx-auto">
            <div className="text-center mb-10">
                <span className="text-carapita-gold text-[10px] uppercase tracking-mega font-bold block mb-4">{t('booking_step_personalize')}</span>
                <h2 className="font-serif text-3xl text-white uppercase tracking-widest leading-tight">{t('booking_title_extras')}</h2>
                <p className="text-white/40 mt-4 text-[10px] uppercase tracking-widest font-medium">{lang === 'PT' ? 'Selecione os mimos e serviços exclusivos para o seu refúgio' : 'Select the exclusive treats and services for your retreat'}</p>
            </div>

            <div className="space-y-6 mb-20">
                {disponiveisExtras.map(e => (
                    <div key={e.id} className={`group flex flex-col md:flex-row bg-white/5 border transition-all duration-700 hover:shadow-2xl overflow-hidden ${selectedExtras.includes(e.id) ? 'border-carapita-gold ring-1 ring-carapita-gold/20' : 'border-white/5'}`}>
                        {/* Imagem do Extra */}
                        <div className="w-full md:w-44 h-44 shrink-0 bg-white/5 overflow-hidden relative">
                            {e.foto ? (
                                <img src={e.foto} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" alt={e.nome} />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-4xl opacity-30 bg-white/5">{e.icone || '✨'}</div>
                            )}
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-500" />
                        </div>

                        {/* Detalhes do Extra */}
                        <div className="flex-1 p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
                            <div className="max-w-md">
                                <h4 className="font-serif text-xl text-white mb-2 group-hover:text-carapita-gold transition-colors">{e.nome}</h4>
                                <p className="text-[10px] text-white/40 font-light uppercase tracking-widest leading-relaxed line-clamp-2">{e.descricao}</p>
                            </div>

                            <div className="flex items-center md:flex-col md:items-end justify-between gap-4 border-t md:border-t-0 pt-4 md:pt-0 border-white/10 min-w-[140px]">
                                <div className="text-right">
                                    <span className="text-lg font-serif text-carapita-gold">€{Number(e.preco).toFixed(2)}</span>
                                    <p className="text-[8px] text-white/40 uppercase tracking-widest mt-0.5">Preço por serviço</p>
                                </div>
                                <button
                                    onClick={() => {
                                        if (selectedExtras.includes(e.id)) setSelectedExtras(selectedExtras.filter(id => id !== e.id));
                                        else setSelectedExtras([...selectedExtras, e.id]);
                                    }}
                                    className={`text-[9px] uppercase tracking-mega font-bold px-8 py-3.5 transition-all duration-500 rounded-sm shadow-sm ${selectedExtras.includes(e.id)
                                        ? 'bg-carapita-gold text-white'
                                        : 'bg-transparent text-carapita-gold border border-carapita-gold hover:bg-carapita-gold hover:text-white'}`}
                                >
                                    {selectedExtras.includes(e.id) ? 'Remover' : 'Adicionar'}
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="flex justify-between items-center border-t border-white/10 pt-12">
                <button onClick={() => setBookingStep('selection')} className="text-[10px] uppercase tracking-widest text-white/40 hover:text-white transition-all flex items-center gap-2 group">
                    <ChevronLeft size={14} className="group-hover:-translate-x-1 transition-transform" /> {t('form_voltar')}
                </button>
                <button onClick={() => setBookingStep('details')} className="bg-carapita-dark text-white px-12 py-5 text-[11px] uppercase tracking-mega font-bold hover:bg-carapita-gold shadow-xl transform hover:-translate-y-1 transition-all">
                    {t('form_prosseguir')}
                </button>
            </div>
        </div>
    );
}
