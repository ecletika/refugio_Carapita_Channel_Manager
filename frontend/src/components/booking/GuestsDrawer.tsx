import React from 'react';
import { X, AlertCircle } from 'lucide-react';

interface GuestsDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    adultos: number;
    criancas: number;
    setGuests: (adultos: number, criancas: number) => void;
}

export default function GuestsDrawer({
    isOpen,
    onClose,
    adultos,
    criancas,
    setGuests,
}: GuestsDrawerProps) {
    if (!isOpen) return null;

    return (
        <>
            <div 
                className="fixed inset-0 z-[250] bg-black/50 backdrop-blur-sm animate-fade-overlay" 
                onClick={() => onClose()} 
            />
            <div className="fixed inset-y-0 right-0 z-[260] w-full md:w-[380px] bg-[#1E3529] shadow-[-10px_0_30px_rgba(0,0,0,0.5)] transform translate-x-0 animate-slide-left flex flex-col p-8 border-l border-[#C9A84C]/20">
                <div className="flex justify-between items-center mb-10">
                    <h2 className="font-serif text-[28px] text-[#C9A84C] uppercase tracking-[0.05em] m-0 leading-none">Hóspedes</h2>
                    <button onClick={() => onClose()} className="text-[#C9A84C] hover:text-white transition-colors bg-transparent p-2 rounded-full border border-transparent">
                        <X size={24} strokeWidth={1.5} />
                    </button>
                </div>

                <div className="flex flex-col flex-1">
                    <div className="border-b border-[#C9A84C]/10 pb-8 mb-8">
                        <div className="flex justify-between items-center outline-none transition-all">
                            <div className="flex flex-col">
                                <span className="font-sans text-[14px] text-white uppercase tracking-[0.1em] mb-1">Adultos</span>
                            </div>
                            <div className="seletor-container flex items-center gap-3">
                                <button onClick={() => setGuests(Math.max(1, adultos - 1), criancas)} disabled={adultos <= 1} className="w-8 h-8 rounded-full border border-[#C9A84C] text-[#C9A84C] flex items-center justify-center disabled:opacity-30">−</button>
                                <span className="w-4 text-center text-white">{adultos}</span>
                                <button onClick={() => setGuests(adultos + criancas < 4 ? adultos + 1 : adultos, criancas)} disabled={adultos + criancas >= 4} className="w-8 h-8 rounded-full border border-[#C9A84C] text-[#C9A84C] flex items-center justify-center disabled:opacity-30">+</button>
                            </div>
                        </div>
                    </div>

                    <div className="border-b border-[#C9A84C]/10 pb-8 mb-8">
                        <div className="flex justify-between items-center outline-none transition-all">
                            <div className="flex flex-col">
                                <span className="font-sans text-[14px] text-white uppercase tracking-[0.1em] mb-1">Crianças</span>
                                <span className="font-sans text-[10px] text-[#8A9E96] uppercase tracking-widest">Maiores de 5 anos</span>
                            </div>
                            <div className="seletor-container flex items-center gap-3">
                                <button onClick={() => setGuests(adultos, Math.max(0, criancas - 1))} disabled={criancas <= 0} className="w-8 h-8 rounded-full border border-[#C9A84C] text-[#C9A84C] flex items-center justify-center disabled:opacity-30">−</button>
                                <span className="w-4 text-center text-white">{criancas}</span>
                                <button onClick={() => setGuests(adultos, adultos + criancas < 4 && criancas < 3 ? criancas + 1 : criancas)} disabled={adultos + criancas >= 4 || criancas >= 3} className="w-8 h-8 rounded-full border border-[#C9A84C] text-[#C9A84C] flex items-center justify-center disabled:opacity-30">+</button>
                            </div>
                        </div>
                    </div>

                    {adultos + criancas >= 4 && (
                        <div className="bg-transparent flex gap-3 mt-auto mb-6 opacity-70 justify-center">
                            <AlertCircle size={16} className="text-[#C9A84C] shrink-0 inline-block" />
                            <span className="text-[11px] text-[#C9A84C] font-sans uppercase tracking-[0.1em] leading-relaxed text-center block">
                                O total de hóspedes não pode exceder 4
                            </span>
                        </div>
                    )}

                    <button onClick={() => onClose()} className={`w-full ${adultos + criancas >= 4 ? '' : 'mt-auto'} p-[18px] bg-[#C9A84C] text-[#1A2E26] font-sans text-[13px] font-bold tracking-[0.2em] uppercase border-none cursor-pointer transition-all hover:bg-[#E8C96A]`}>
                        Confirmar
                    </button>
                </div>
            </div>
        </>
    );
}
