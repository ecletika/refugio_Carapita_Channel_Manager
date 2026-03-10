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
            // Se já temos um check-in, o check-out PODE ser em um dia ocupado (se for o dia exato que alguém entra, mas aqui a regra é BLOQUEAR o dia que alguém sai)
            // Na verdade, a regra do usuário é: BLOQUEAR o dia de check-out sempre (ninguém entra no dia que alguém sai).
            // Então se disponivel=false, não pode clicar.
            if (!selection.start) return;
            // Se for check-out, permitimos clicar se for o dia FINAL de uma seleção, mas o backend disse que esse dia está indisponível para ENTRAR.
            // No entanto, para SAIR, o dia de check-out de uma reserva costuma ser o dia de check-in da próxima.
            // A Regra 1 diz: Bloquear o dia de check-out sempre. Isso significa que se alguém sai dia 10, ninguém entra dia 10.
            // Então dia 10 está indisponível para check-in.
            if (!selection.start) return;
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

            // Verificamos todos os dias do check-in até o dia ANTERIOR ao check-out
            while (current < endDate) {
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
                    onClick={() => handleDateClick(dStr)}
                    className={`p-1 border border-white/5 flex flex-col items-center justify-center cursor-pointer transition-all h-10 relative
                        ${isSelected ? 'bg-carapita-gold text-white border-carapita-gold' : ''}
                        ${isInRange ? 'bg-carapita-gold/20' : 'hover:bg-white/5'}
                        ${!isDisponivel ? 'opacity-50 cursor-not-allowed bg-black/20' : ''}
                    `}
                >
                    {!isDisponivel && (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <span className="text-carapita-muted text-2xl font-light opacity-30 select-none">
                                {info?.eCheckOut ? 'OUT' : 'X'}
                            </span>
                        </div>
                    )}
                    <span className={`text-xs font-bold z-10 ${isSelected ? 'text-white' : 'text-white/90'}`}>{d}</span>
                    {info && (
                        <span className={`text-[8px] mt-0.5 z-10 font-bold ${isSelected ? 'text-white' : 'text-carapita-gold'} ${!isDisponivel ? 'line-through opacity-40' : ''}`}>
                            €{info.preco}
                        </span>
                    )}
                </div>
            );
        }

        return (
            <div className="flex-1 min-w-0">
                <h4 className="text-center font-serif uppercase tracking-widest mb-2 text-white text-xs md:text-sm">{monthName} {year}</h4>
                <div className="grid grid-cols-7 text-[10px] text-center text-white/40 mb-2 uppercase tracking-tighter">
                    <span>Dom</span><span>Seg</span><span>Ter</span><span>Qua</span><span>Qui</span><span>Sex</span><span>Sáb</span>
                </div>
                <div className="grid grid-cols-7 border-t border-l border-white/10">
                    {days}
                </div>
            </div>
        );
    };

    return (
        <div className="bg-transparent animate-fade-in w-full">
            <div className="flex justify-between items-center mb-4">
                <button onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() - 1)))} className="p-1 hover:bg-white/5 text-white rounded-full transition-colors"><ChevronLeft size={16} /></button>
                <div className="text-center">
                    <span className="text-[9px] uppercase tracking-widest text-carapita-gold font-bold">Calendário</span>
                </div>
                <button onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() + 1)))} className="p-1 hover:bg-white/5 text-white rounded-full transition-colors"><ChevronRight size={16} /></button>
            </div>

            <div className="flex flex-col md:flex-row lg:flex-col gap-6 w-full">
                {renderMonth(new Date(currentDate))}
                <div className="hidden md:block">
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
