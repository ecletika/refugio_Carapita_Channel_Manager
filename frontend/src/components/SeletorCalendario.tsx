"use client";
import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PrecoDia {
    data: string;
    preco: number;
    disponivel: boolean;
    minimaEstadia: number;
    eCheckOut?: boolean;
}

export default function SeletorCalendario({ onSelect, quartoId }: { onSelect: (start: string, end: string) => void, quartoId: string }) {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selection, setSelection] = useState<{ start: string | null, end: string | null }>({ start: null, end: null });
    const [precos, setPrecos] = useState<Record<string, { preco: number, disponivel: boolean, minimaEstadia: number, eCheckOut?: boolean }>>({});

    useEffect(() => {
        if (!quartoId) return;
        const fetchPrecos = async () => {
            const year = currentDate.getFullYear();
            const month = currentDate.getMonth() + 1;
            const start = `${year}-${String(month).padStart(2, '0')}-01`;
            // Calcular o fim (2 meses depois)
            const endDate = new Date(year, month + 1, 0); // Último dia do próximo mês
            const end = `${endDate.getFullYear()}-${String(endDate.getMonth() + 1).padStart(2, '0')}-${String(endDate.getDate()).padStart(2, '0')}`;
            try {
                const resp = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/tarifas/calendario?quartoId=${quartoId}&inicio=${start}&fim=${end}&t=${Date.now()}`, {
                    cache: 'no-store'
                });
                const dados = await resp.json();
                if (dados.status === 'success') {
                    const map: Record<string, { preco: number, disponivel: boolean, minimaEstadia: number, eCheckOut?: boolean }> = {};
                    dados.data.forEach((p: PrecoDia) => map[p.data] = { preco: p.preco, disponivel: p.disponivel, minimaEstadia: p.minimaEstadia, eCheckOut: p.eCheckOut });
                    setPrecos(map);
                }
            } catch (e) {
                console.error("Erro ao buscar preços", e);
            }
        };
        fetchPrecos();
    }, [currentDate, quartoId]);

    const handleDateClick = (dateStr: string) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const selectedDate = new Date(dateStr);
        if (selectedDate < today) return; // Não permitir datas passadas

        const info = precos[dateStr];
        // Se for dia de check-out, só pode ser usado como check-out de uma reserva anterior, 
        // mas o backend já marcou disponivel=false para impedir check-in.
        if (info && !info.disponivel) {
            return;
        }

        if (!selection.start || (selection.start && selection.end)) {
            setSelection({ start: dateStr, end: null });
        } else {
            const startDate = new Date(selection.start);
            const endDate = new Date(dateStr);

            if (endDate <= startDate) {
                setSelection({ start: dateStr, end: null });
                return;
            }

            // Validar Mínimo de Noites
            const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            const minStayRequired = precos[selection.start]?.minimaEstadia || 2;

            if (diffDays < minStayRequired) {
                alert(`Esta tarifa exige um mínimo de ${minStayRequired} noites.`);
                return;
            }

            // Validar se existe algum bloqueio no meio do intervalo
            let hasBlock = false;
            let current = new Date(startDate);

            // Verificamos todos os dias do check-in até o dia do check-out (INCLUSIVE)
            while (current <= endDate) {
                const currentStr = current.toISOString().split('T')[0];
                if (precos[currentStr] && !precos[currentStr].disponivel) {
                    hasBlock = true;
                    break;
                }
                current.setDate(current.getDate() + 1);
            }

            if (hasBlock) {
                alert("O intervalo selecionado contém datas indisponíveis.");
                setSelection({ start: dateStr, end: null });
            } else {
                setSelection({ ...selection, end: dateStr });
                onSelect(selection.start, dateStr);
            }
        }
    };

    const renderMonth = (date: Date) => {
        const month = date.getMonth();
        const year = date.getFullYear();
        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const monthName = date.toLocaleString('pt-PT', { month: 'long' });

        const days = [];
        for (let i = 0; i < firstDay; i++) days.push(<div key={`empty-${i}`} className="p-1"></div>);
        for (let d = 1; d <= daysInMonth; d++) {
            const dStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
            const info = precos[dStr];
            const isDisponivel = info ? info.disponivel : true;
            const isSelected = selection.start === dStr || selection.end === dStr;
            const isInRange = selection.start && selection.end && dStr > selection.start && dStr < selection.end;

            days.push(
                <div
                    key={dStr}
                    onClick={() => isDisponivel && handleDateClick(dStr)}
                    className={`p-2 border border-[#C9A84C]/20 flex flex-col items-center justify-center relative aspect-square transition-all duration-300 min-h-[50px] md:min-h-[80px]
                        ${isSelected ? 'bg-[#C9A84C] text-[#1A2E26] shadow-lg transform scale-[1.05] z-20 border-[#C9A84C]' : ''}
                        ${isInRange ? 'bg-[#C9A84C]/20 text-white' : ''}
                        ${!isSelected && !isInRange && isDisponivel ? 'hover:bg-[#C9A84C]/10 cursor-pointer' : ''}
                        ${!isDisponivel ? 'opacity-30 cursor-not-allowed bg-black/20' : ''}
                        ${-1 === days.length % 7 ? 'border-r-0' : ''}
                    `}
                >
                    {!isDisponivel && (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <span className="text-[#8A9E96] text-xl md:text-2xl font-light opacity-30 select-none">
                                {info?.eCheckOut ? 'OUT' : 'X'}
                            </span>
                        </div>
                    )}
                    <span className={`font-serif text-[16px] md:text-[22px] leading-none z-10 ${isSelected ? 'text-[#1A2E26] font-bold' : isDisponivel ? 'text-[#F5F0E8]' : 'text-[#8A9E96]'}`}>{d}</span>
                    {info && isDisponivel && (
                        <span className={`text-[9px] md:text-[10px] mt-1 z-10 font-sans tracking-widest ${isSelected ? 'text-[#1A2E26] font-bold' : 'text-[#C9A84C]'}`}>
                            €{(info.preco || 0).toFixed(0)}
                        </span>
                    )}
                </div>
            );
        }

        return (
            <div className="flex-1 min-w-0 font-sans">
                <div className="flex justify-between items-center mb-6">
                    <h4 className="text-center font-serif text-[#C9A84C] text-[18px] md:text-[24px] uppercase tracking-[0.15em] mx-auto">
                        {monthName} <span className="font-light text-[#8A9E96] text-[14px] md:text-[18px] ml-1">{year}</span>
                    </h4>
                </div>
                <div className="grid grid-cols-7 text-[9px] md:text-[10px] text-center text-[#8A9E96] mb-3 uppercase tracking-[0.2em] font-medium border-b border-[#C9A84C]/10 pb-3">
                    <span>Dom</span><span>Seg</span><span>Ter</span><span>Qua</span><span>Qui</span><span>Sex</span><span>Sáb</span>
                </div>
                <div className="grid grid-cols-7 -mt-[1px] -ml-[1px]">
                    {days}
                </div>
            </div>
        );
    };

    return (
        <div className="bg-transparent animate-fade-in w-full">
            <div className="flex justify-between items-center mb-8 relative">
                <button onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() - 1)))} className="absolute left-0 z-10 p-3 bg-[#1A2E26] hover:bg-[#C9A84C] text-[#C9A84C] hover:text-[#1A2E26] rounded-full transition-all border border-[#C9A84C]/30 shadow-lg"><ChevronLeft size={20} /></button>
                <div className="text-center w-full">
                    <span className="font-sans text-[10px] uppercase tracking-[0.3em] text-[#8A9E96]">Selecione suas datas</span>
                </div>
                <button onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() + 1)))} className="absolute right-0 z-10 p-3 bg-[#1A2E26] hover:bg-[#C9A84C] text-[#C9A84C] hover:text-[#1A2E26] rounded-full transition-all border border-[#C9A84C]/30 shadow-lg"><ChevronRight size={20} /></button>
            </div>

            <div className="flex flex-col md:flex-row gap-8 w-full">
                <div className="flex-1">
                    {renderMonth(new Date(currentDate))}
                </div>
                <div className="flex-1 hidden md:block">
                    {renderMonth(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))}
                </div>
            </div>

            <div className="mt-8 pt-8 border-t border-white/10 flex justify-between items-center">
                <div className="flex gap-4 text-[10px] uppercase tracking-widest text-white/40">
                    <div className="flex items-center gap-2"><div className="w-3 h-3 bg-carapita-gold"></div> Check-in/out</div>
                    <div className="flex items-center gap-2"><div className="w-3 h-3 bg-carapita-gold/20"></div> Estadia</div>
                    <div className="flex items-center gap-2"><div className="w-3 h-3 flex items-center justify-center border border-white/20 text-[8px] font-bold">X</div> Ocupado</div>
                </div>
                {selection.start && selection.end && (
                    <div className="text-right">
                        <p className="text-[10px] uppercase text-white/40 mb-1">Período selecionado</p>
                        <p className="text-sm font-serif text-white">{new Date(selection.start).toLocaleDateString()} — {new Date(selection.end).toLocaleDateString()}</p>
                    </div>
                )}
            </div>
        </div>
    );
}
