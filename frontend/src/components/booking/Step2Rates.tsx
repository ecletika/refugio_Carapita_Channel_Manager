import React from 'react';
import { ChevronLeft, Users, Square, CheckCircle2, Search } from 'lucide-react';
import SeletorCalendario from '@/components/SeletorCalendario';
import RoomImageGallery from '@/components/RoomImageGallery';

interface Step2RatesProps {
    t: (key: string) => string;
    lang: string;
    quartosEncontrados: any[] | null;
    checkIn: string;
    checkOut: string;
    setCheckIn: (d: string) => void;
    setCheckOut: (d: string) => void;
    fetchCalendario: (id: string, start?: string, end?: string) => void;
    adultos: number;
    criancas: number;
    setBookingStep: (step: string) => void;
    calculateRoomTotal: (q: any) => number;
    cupomAplicado: any;
    iniciarReserva: (quartoId: string) => void;
    setLightboxFotos: (fotos: string[]) => void;
    setLightboxIdx: (idx: number) => void;
    parseFotos: (fotos: string | undefined) => { url: string; category: string; isMain: boolean }[];
}

export default function Step2Rates({
    t,
    lang,
    quartosEncontrados,
    checkIn,
    checkOut,
    setCheckIn,
    setCheckOut,
    fetchCalendario,
    adultos,
    criancas,
    setBookingStep,
    calculateRoomTotal,
    cupomAplicado,
    iniciarReserva,
    setLightboxFotos,
    setLightboxIdx,
    parseFotos
}: Step2RatesProps) {
    return (
        <div className="flex flex-col xl:flex-row gap-8 w-full max-w-[1400px] mx-auto animate-fade-in items-start h-full pb-20">
            {/* ESQUERDA: Calendário Compacto (30%) */}
            <div className="w-full xl:w-[30%] shrink-0">
                <div className="bg-[#1E3529] border border-[#C9A84C]/20 p-6 md:p-8 rounded-[24px] shadow-2xl mb-6 hidden md:block overflow-hidden">
                    <SeletorCalendario
                        quartoId={quartosEncontrados?.[0]?.id || ''}
                        monthsToShow={1}
                        initialSelection={checkIn && checkOut ? { start: checkIn, end: checkOut } : undefined}
                        onSelect={(start, end) => {
                            setCheckIn(start);
                            setCheckOut(end);
                            if (quartosEncontrados?.[0]?.id) {
                                fetchCalendario(quartosEncontrados[0].id, start, end);
                            }
                        }}
                    />
                </div>
                <div className="bg-[#1A2E26] border border-[#C9A84C]/20 p-6 rounded-[20px] flex justify-between items-center shadow-lg hover:border-[#C9A84C]/50 transition-colors cursor-pointer group" onClick={() => setBookingStep('selection')}>
                    <div className="flex flex-col">
                        <span className="font-serif text-[#C9A84C] text-[20px] mb-1">Ocupação</span>
                        <span className="font-sans text-[12px] uppercase tracking-widest text-[#8A9E96]">{adultos} Adulto{adultos !== 1 && 's'}{criancas > 0 ? ` • ${criancas} Criança${criancas !== 1 && 's'}` : ''}</span>
                    </div>
                    <button className="text-[#8A9E96] group-hover:text-[#C9A84C] transition-colors font-sans text-[10px] uppercase tracking-widest border border-white/10 px-4 py-2 rounded-full">
                        Editar
                    </button>
                </div>
            </div>

            {/* DIREITA: Quartos (70%) */}
            <div className="w-full xl:w-[70%] space-y-8">
                <div className="flex items-center gap-4 pb-4 border-b border-[#C9A84C]/20 mb-8 mt-2">
                    <button 
                        onClick={() => setBookingStep('selection')} 
                        className="text-[#C9A84C] hover:text-[#E8C96A] bg-transparent border-none transition-colors flex items-center gap-2 font-sans text-[12px] uppercase tracking-[0.2em] font-medium shrink-0"
                    >
                        <ChevronLeft size={20} /> Voltar
                    </button>
                    <div className="w-[1px] h-6 bg-[#C9A84C]/20 mx-2"></div>
                    <h2 className="font-serif text-[24px] text-white uppercase tracking-[0.2em]">{t('booking_alojamentos_disp')}</h2>
                </div>

                {(quartosEncontrados || []).length > 0 ? (
                    quartosEncontrados?.map((q) => {
                        const fotos = parseFotos(q.fotos);
                        let comodidades: string[] = [];
                        try { comodidades = JSON.parse(q.comodidades || '[]'); } catch { }
                        const topBullets = comodidades;

                        const displayedPrice = calculateRoomTotal(q);

                        return (
                            <div key={q.id} className="bg-[#1E3529] rounded-[24px] overflow-hidden border border-[#C9A84C]/20 flex flex-col transition-all duration-300 shadow-2xl mb-8 group">
                                <div className="flex flex-col min-h-[320px]">
                                    <div className="w-full relative overflow-hidden bg-[#1A2E26] h-64 md:h-[380px]">
                                        <RoomImageGallery fotos={fotos} quartoNome={q.nome} onClick={() => { setLightboxFotos(fotos.map(f => f.url)); setLightboxIdx(0); }} />
                                    </div>
                                    
                                    <div className="flex-1 p-6 md:p-8 flex flex-col font-sans">
                                        <div className="flex justify-between items-start mb-6 border-b border-[#C9A84C]/10 pb-6">
                                            <div className="font-serif text-[32px] font-semibold text-[#F5F0E8] leading-tight">{q.nome}</div>
                                        </div>
                                        
                                        <div className="flex flex-wrap gap-3 mb-6">
                                            <div className="flex items-center gap-2 text-[10px] text-[#8A9E96] font-normal uppercase tracking-widest border border-[#8A9E96]/30 rounded-full px-4 py-2 bg-[#1A2E26]">
                                                <Users size={14} className="text-[#C9A84C]" /> Máx {(q as any).capacidade_maxima || (q as any).capacidade || 2}
                                            </div>
                                            {topBullets.map((c, i) => (
                                                <div key={i} className="flex items-center gap-2 text-[10px] text-[#8A9E96] font-normal uppercase tracking-widest border border-[#8A9E96]/30 rounded-full px-4 py-2 bg-[#1A2E26]">
                                                    {c.toLowerCase().includes('m²') ? <Square size={14} className="text-[#C9A84C]" /> : <CheckCircle2 size={14} className="text-[#C9A84C]" />}
                                                    {c}
                                                </div>
                                            ))}
                                        </div>
                                        
                                        <div className="text-[14px] text-[#D4C9B0] leading-relaxed line-clamp-3 mb-8">{q.descricao}</div>
                                        
                                        <div className="mt-auto pt-6 border-t border-[#C9A84C]/10 flex flex-col md:flex-row items-end justify-between gap-6 relative">
                                            {/* Total */}
                                            <div className="flex flex-col w-full md:w-auto">
                                                <span className="text-[#8A9E96] text-[10px] uppercase tracking-[0.2em] mb-2 block">Total da estadia</span>
                                                <div className="flex items-end gap-3 text-white font-serif text-[32px]">
                                                    <div>
                                                        {cupomAplicado ? (
                                                            <>
                                                                <span className="line-through text-white/30 text-[24px] mr-3">€ {displayedPrice.toFixed(0)}</span>
                                                                € {(displayedPrice - (cupomAplicado.tipo_desconto === 'PERCENTUAL' ? displayedPrice * (cupomAplicado.valor_desconto/100) : cupomAplicado.valor_desconto)).toFixed(0)}
                                                            </>
                                                        ) : (
                                                            `€ ${displayedPrice.toFixed(0)}`
                                                        )}
                                                        <span className="text-[16px] font-sans font-normal text-[#8A9E96]"> / estadia total</span>
                                                    </div>
                                                </div>
                                                <span className="text-[#8A9E96] text-[9px] uppercase font-sans tracking-[0.1em] mt-3 block bg-[#1A2E26] px-3 py-1.5 rounded w-fit">
                                                    Inclui pequeno-almoço & impostos
                                                </span>
                                            </div>

                                            <button onClick={() => iniciarReserva(q.id)} className="w-full md:w-auto mt-4 p-[22px] px-14 bg-[#C9A84C] text-[#1A2E26] font-sans text-[13px] font-bold tracking-[0.25em] uppercase border-none rounded-[16px] cursor-pointer transition-all hover:-translate-y-1 shadow-[0_8px_30px_rgba(201,168,76,0.3)] hover:bg-[#E8C96A]">
                                                Selecionar
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                ) : (
                    <div className="py-24 text-center border border-dashed border-[#C9A84C]/20 rounded-[2rem] bg-white/5">
                        <Search size={48} className="mx-auto text-[#C9A84C]/30 mb-6" />
                        <p className="text-[#F5F0E8] text-lg font-serif tracking-widest mb-2 leading-relaxed">Nenhum alojamento disponível</p>
                        <p className="text-[#8A9E96] text-[10px] uppercase tracking-widest mt-2">{t('booking_selecione_datas')}</p>
                    </div>
                )}
            </div>
        </div>
    );
}
