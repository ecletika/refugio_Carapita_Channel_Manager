import React from 'react';
import { ChevronRight } from 'lucide-react';
import SeletorCalendario from '@/components/SeletorCalendario';

interface Step1SelectionProps {
    checkIn: string | null;
    checkOut: string | null;
    setDates: (start: string, end: string) => void;
    quartosEncontrados: any[] | null;
    fetchCalendario: (id: string, start?: string, end?: string) => void;
    adultos: number;
    criancas: number;
    setIsGuestsDrawerOpen: (v: boolean) => void;
    cupomAplicado: any;
    setIsPromoDrawerOpen: (v: boolean) => void;
    setBookingStep: (step: string) => void;
    idQuartoParaReserva: string | null;
}

export default function Step1Selection({
    checkIn,
    checkOut,
    setDates,
    quartosEncontrados,
    fetchCalendario,
    adultos,
    criancas,
    setIsGuestsDrawerOpen,
    cupomAplicado,
    setIsPromoDrawerOpen,
    setBookingStep,
    idQuartoParaReserva
}: Step1SelectionProps) {
    return (
        <div className="flex flex-col lg:flex-row gap-8 w-full max-w-[1400px] mx-auto animate-fade-in items-start h-full pb-20">
            {/* Esquerda: Calendário Maior (~60%) */}
            <div className="w-full lg:w-[60%] bg-[#1E3529] border border-[#C9A84C]/20 p-6 md:p-8 rounded-[24px] shadow-2xl">
                <div className="w-full">
                    <SeletorCalendario
                        quartoId={idQuartoParaReserva || quartosEncontrados?.[0]?.id || ''}
                        initialSelection={checkIn ? { start: checkIn, end: checkOut || null } : undefined}
                        onSelect={(start, end) => {
                            setDates(start, end);
                            if (quartosEncontrados?.[0]?.id) {
                                fetchCalendario(quartosEncontrados[0].id, start, end);
                            }
                        }}
                    />
                </div>
            </div>

            {/* Direita: Painel Interativo (~40%) */}
            <div className="w-full lg:w-[40%] flex flex-col gap-6">
                {/* Cards Data */}
                <div className="flex gap-4 w-full">
                    <div className="flex-1 bg-[#1A2E26] border border-[#C9A84C]/40 rounded-[20px] p-6 text-center shadow-lg transition-transform duration-500 hover:scale-[1.02]">
                        <span className="block font-sans text-[10px] text-[#C9A84C] uppercase tracking-[0.2em] mb-4">Check-in</span>
                        {checkIn ? (
                            <>
                                <div className="font-serif text-6xl text-[#F5F0E8] leading-none mb-2">{new Date(checkIn).getUTCDate()}</div>
                                <div className="font-sans text-[10px] text-[#8A9E96] uppercase tracking-[0.2em]">{new Date(checkIn).toLocaleDateString('pt-PT', { month: 'short', year: 'numeric' }).replace(' de ', ' ')}</div>
                            </>
                        ) : (
                            <div className="font-serif text-3xl text-white/20 mt-4 h-14">--</div>
                        )}
                    </div>

                    <div className="flex-1 bg-[#1A2E26] border border-[#C9A84C]/40 rounded-[20px] p-6 text-center shadow-lg transition-transform duration-500 hover:scale-[1.02]">
                        <span className="block font-sans text-[10px] text-[#C9A84C] uppercase tracking-[0.2em] mb-4">Check-out</span>
                        {checkOut ? (
                            <>
                                <div className="font-serif text-6xl text-[#F5F0E8] leading-none mb-2">{new Date(checkOut).getUTCDate()}</div>
                                <div className="font-sans text-[10px] text-[#8A9E96] uppercase tracking-[0.2em]">{new Date(checkOut).toLocaleDateString('pt-PT', { month: 'short', year: 'numeric' }).replace(' de ', ' ')}</div>
                            </>
                        ) : (
                            <div className="font-serif text-3xl text-white/20 mt-4 h-14">--</div>
                        )}
                    </div>
                </div>

                {/* Botão Drawer Hóspedes */}
                <button onClick={() => setIsGuestsDrawerOpen(true)} className="w-full bg-[#1A2E26] border border-[#C9A84C]/20 rounded-[20px] p-6 py-7 flex items-center justify-between hover:border-[#C9A84C]/60 transition-all font-sans text-left group shadow-lg mt-2">
                    <div className="flex flex-col">
                        <span className="text-[10px] text-[#8A9E96] uppercase tracking-[0.2em] mb-2 group-hover:text-[#C9A84C] transition-colors">Hóspedes</span>
                        <span className="text-[#F5F0E8] text-[15px] font-medium tracking-wide">{adultos} Adulto{adultos !== 1 && 's'}{criancas > 0 ? ` • ${criancas} Criança${criancas !== 1 && 's'}` : ''}</span>
                    </div>
                    <ChevronRight size={20} className="text-[#8A9E96] group-hover:text-[#C9A84C] transition-colors" />
                </button>

                {/* Botão Drawer Códigos */}
                <button onClick={() => setIsPromoDrawerOpen(true)} className="w-full bg-[#1A2E26] border border-[#C9A84C]/20 rounded-[20px] p-6 py-7 flex items-center justify-between hover:border-[#C9A84C]/60 transition-all font-sans text-left group shadow-lg">
                    <div className="flex flex-col">
                        <span className="text-[10px] text-[#8A9E96] uppercase tracking-[0.2em] mb-2 group-hover:text-[#C9A84C] transition-colors">Códigos Promocionais</span>
                        <span className="text-[#8A9E96] text-[15px] font-medium tracking-wide">{cupomAplicado ? `Código: ${cupomAplicado.codigo}` : 'Adicionar código'}</span>
                    </div>
                    <ChevronRight size={20} className="text-[#8A9E96] group-hover:text-[#C9A84C] transition-colors" />
                </button>

                {/* CTA Principal */}
                <button 
                    disabled={!checkIn || !checkOut || adultos < 1}
                    onClick={() => setBookingStep('rates')} 
                    className="btn-ver-tarifas"
                >
                    Ver Tarifas
                </button>
            </div>
        </div>
    );
}
