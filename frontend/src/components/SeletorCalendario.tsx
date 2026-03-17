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

export default function SeletorCalendario({ onSelect, quartoId, initialSelection, monthsToShow = 2 }: { onSelect: (start: string, end: string) => void, quartoId: string, initialSelection?: { start: string | null, end: string | null }, monthsToShow?: number }) {
    const [currentDate, setCurrentDate] = useState(initialSelection?.start ? new Date(initialSelection.start) : new Date());
    const [selection, setSelection] = useState<{ start: string | null, end: string | null }>({ start: initialSelection?.start || null, end: initialSelection?.end || null });
    const [precos, setPrecos] = useState<Record<string, { preco: number, disponivel: boolean, minimaEstadia: number, eCheckOut?: boolean }>>({});

    // Sincronizar estado interno com as datas que venham da tela pai
    useEffect(() => {
        if (initialSelection?.start) {
            setSelection({ start: initialSelection.start, end: initialSelection.end || null });
            // Se tiver check-in definido e estiver a vir de outra etapa, viaja para esse mês:
            setCurrentDate(new Date(initialSelection.start));
        }
    }, [initialSelection?.start, initialSelection?.end]);

    useEffect(() => {
        if (!quartoId) return;
        const fetchPrecos = async () => {
            const year = currentDate.getFullYear();
            const month = currentDate.getMonth() + 1;
            const startStr = `${year}-${String(month).padStart(2, '0')}-01`;
            const endDate = new Date(year, month + 2, 0); 
            const endStr = `${endDate.getFullYear()}-${String(endDate.getMonth() + 1).padStart(2, '0')}-${String(endDate.getDate()).padStart(2, '0')}`;
            try {
                const resp = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/tarifas/calendario?quartoId=${quartoId}&inicio=${startStr}&fim=${endStr}&t=${Date.now()}`, {
                    cache: 'no-store'
                });
                const dados = await resp.json();
                if (dados.status === 'success') {
                    const map: Record<string, { preco: number, disponivel: boolean, minimaEstadia: number, eCheckOut?: boolean }> = {};
                    dados.data.forEach((p: PrecoDia) => map[p.data] = { preco: p.preco, disponivel: p.disponivel, minimaEstadia: p.minimaEstadia, eCheckOut: p.eCheckOut });
                    setPrecos(prev => ({...prev, ...map}));
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
        if (selectedDate < today) return; 

        const info = precos[dateStr];
        if (info && !info.disponivel) return;

        if (!selection.start || (selection.start && selection.end)) {
            setSelection({ start: dateStr, end: null });
        } else {
            const startDate = new Date(selection.start);
            const endDate = new Date(dateStr);

            if (endDate <= startDate) {
                setSelection({ start: dateStr, end: null });
                return;
            }

            const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            const minStayRequired = precos[selection.start]?.minimaEstadia || 2;

            if (diffDays < minStayRequired) {
                alert(`Esta tarifa exige um mínimo de ${minStayRequired} noites.`);
                return;
            }

            let hasBlock = false;
            let current = new Date(startDate);
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
        // Espaços vazios no início
        for (let i = 0; i < firstDay; i++) {
            days.push(<div key={`empty-${i}`} className="w-[42px] h-[40px] md:w-[52px] md:h-[52px]"></div>);
        }

        // Dias do mês
        for (let d = 1; d <= daysInMonth; d++) {
            const currentTargetDate = new Date(year, month, d);
            const dStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
            const info = precos[dStr];
            const isDisponivel = info ? info.disponivel : true;
            
            const isCheckIn = selection.start === dStr;
            const isCheckOut = selection.end === dStr;
            const isInRange = selection.start && selection.end && dStr > selection.start && dStr < selection.end;
            const dayOfWeek = currentTargetDate.getDay();

            let baseClass = "w-[42px] h-[40px] md:w-[52px] md:h-[52px] flex flex-col items-center justify-center relative ";
            let stateClass = "";
            let textClass = "text-[#F5F0E8]";
            let priceClass = "text-[#C9A84C]";

            if (!isDisponivel) {
                stateClass = "opacity-30 cursor-not-allowed bg-transparent rounded-[10px]";
            } else {
                baseClass += "cursor-pointer transition-all duration-200 ";
                if (isCheckIn || isCheckOut) {
                    stateClass = "bg-[#C9A84C] rounded-[12px] font-bold";
                    textClass = "text-[#1A2E26]";
                    priceClass = "text-[#1A2E26]";
                } else if (isInRange) {
                    stateClass = "bg-[rgba(201,168,76,0.25)] rounded-none";
                    if (dayOfWeek === 0) stateClass += " rounded-l-[10px]";
                    if (dayOfWeek === 6) stateClass += " rounded-r-[10px]";
                } else {
                    stateClass = "bg-transparent rounded-[10px] hover:bg-[rgba(201,168,76,0.15)]";
                }
            }

            days.push(
                <div
                    key={dStr}
                    onClick={() => isDisponivel && handleDateClick(dStr)}
                    className={`${baseClass} ${stateClass}`}
                >
                    {!isDisponivel && (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <span className="text-[#8A9E96] text-[18px] md:text-[22px] font-light opacity-30 select-none">
                                {info?.eCheckOut ? 'OUT' : 'X'}
                            </span>
                        </div>
                    )}
                    <span className={`font-serif text-[18px] md:text-[22px] leading-[1] z-10 ${textClass}`}>
                        {d}
                    </span>
                    {info && isDisponivel && (
                        <span className={`font-sans text-[8px] md:text-[10px] font-medium tracking-[0.5px] mt-[2px] z-10 ${priceClass}`}>
                            €{(info.preco || 0).toFixed(0)}
                        </span>
                    )}
                </div>
            );
        }

        return (
            <div className="flex-1 min-w-[300px] md:min-w-[392px] px-4">
                <div className="calendario-header flex justify-center items-center w-full mb-6 relative">
                    <span className="font-serif text-[#C9A84C] text-[20px] md:text-[24px] uppercase tracking-[0.1em]">
                        {monthName} <span className="font-light text-[#8A9E96] text-[16px] md:text-[18px] ml-1">{year}</span>
                    </span>
                </div>

                <div className="calendario-grid-header grid grid-cols-7 gap-[2px] md:gap-[4px] mb-2">
                    {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(d => (
                        <div key={d} className="text-center font-sans text-[9px] md:text-[10px] uppercase tracking-[0.2em] text-[#8A9E96] font-medium">
                            {d}
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-7 gap-[2px] md:gap-[4px]">
                    {days}
                </div>
            </div>
        );
    };

    const prevMonth = () => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() - 1)));
    const nextMonth = () => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() + 1)));

    const secondDate = new Date(currentDate);
    secondDate.setMonth(secondDate.getMonth() + 1);

    return (
        <div className="w-full flex flex-col items-center animate-fade-in py-4">
            <div className="flex justify-between items-center w-full max-w-[800px] mb-8 px-4">
                <button onClick={prevMonth} className="text-[#C9A84C] hover:text-[#E8C96A] transition-colors p-2 bg-white/5 rounded-full hover:bg-white/10 flex items-center justify-center">
                    <ChevronLeft size={24} strokeWidth={1.5} />
                </button>
                <div className="hidden md:block h-px flex-1 mx-8 bg-gradient-to-r from-transparent via-[#C9A84C]/20 to-transparent"></div>
                <button onClick={nextMonth} className="text-[#C9A84C] hover:text-[#E8C96A] transition-colors p-2 bg-white/5 rounded-full hover:bg-white/10 flex items-center justify-center">
                    <ChevronRight size={24} strokeWidth={1.5} />
                </button>
            </div>

            <div className="w-full flex flex-col md:flex-row gap-8 justify-center">
                {renderMonth(currentDate)}
                {monthsToShow > 1 && renderMonth(secondDate)}
            </div>

            <div className="mt-8 flex flex-wrap gap-x-8 gap-y-4 text-[9px] md:text-[10px] uppercase tracking-widest text-[#8A9E96] justify-center w-full max-w-[800px] border-t border-[#C9A84C]/10 pt-8">
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-[#C9A84C] rounded-[3px]"></div> Check-in/out
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-[rgba(201,168,76,0.25)] rounded-[3px]"></div> Estadia
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 flex items-center justify-center text-[#8A9E96] font-sans opacity-40">X</div> Indisponível
                </div>
            </div>
        </div>
    );
}
