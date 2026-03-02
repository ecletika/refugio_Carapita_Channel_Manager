"use client";
import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
    TrendingUp, Calendar, Users, Home, Euro, ChevronLeft, ChevronRight,
    LogIn, LogOut, Clock, RefreshCw, BarChart2, Moon, ArrowRight, X
} from 'lucide-react';
import AdminSidebar from '@/components/AdminSidebar';

/* ─────────────────────────────────────────────
   Tipos
──────────────────────────────────────────────*/
interface Kpis {
    receitaMes: string;
    reservasMes: number;
    taxaOcupacao: number;
    quartosTotalAtivos: number;
    reservasHoje: number;
}
interface ReservaEvento {
    id: string;
    data_check_in: string;
    data_check_out: string;
    status: string;
    valor_total: number;
    quarto: { id: string; nome: string };
    hospede: { nome: string; email: string };
}
interface BloqueioEvento {
    id: string;
    data_inicio: string;
    data_fim: string;
    motivo: string;
    quarto: { id: string; nome: string };
}
interface DashData {
    kpis: Kpis;
    proximosCheckins: ReservaEvento[];
    proximosCheckouts: ReservaEvento[];
    reservasCalendario: ReservaEvento[];
    bloqueiosCalendario: BloqueioEvento[];
    porCanal: Record<string, number>;
    calendarioMes: { ano: number; mes: number };
}

/* ─────────────────────────────────────────────
   Helpers
──────────────────────────────────────────────*/
const MESES_PT = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

const STATUS_COLOR: Record<string, string> = {
    CONFIRMADA: '#2E7D32',
    PENDENTE: '#E65100',
    CHECK_IN: '#1565C0',
    CHECK_OUT: '#4A148C',
    CANCELADA: '#B71C1C',
};

function formatDate(d: string) {
    return new Date(d).toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit' });
}
function formatDateFull(d: string) {
    return new Date(d).toLocaleDateString('pt-PT', { day: '2-digit', month: 'short', year: 'numeric' });
}
function nightsBetween(a: string, b: string) {
    return Math.ceil((new Date(b).getTime() - new Date(a).getTime()) / 86400000);
}

/* ─────────────────────────────────────────────
   Componente KPI Card
──────────────────────────────────────────────*/
function KpiCard({ icon: Icon, label, value, sub, color }: {
    icon: React.ElementType; label: string; value: string | number; sub?: string; color: string;
}) {
    return (
        <div className="bg-white border border-gray-100 p-6 flex flex-col gap-3 hover:shadow-xl transition-all duration-500 group relative overflow-hidden">
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700"
                style={{ background: `linear-gradient(135deg, ${color}08 0%, transparent 70%)` }} />
            <div className="flex items-start justify-between z-10">
                <div className="flex flex-col">
                    <span className="text-[10px] uppercase tracking-widest text-gray-400 font-medium mb-1">{label}</span>
                    <span className="text-3xl font-serif font-light" style={{ color }}>{value}</span>
                    {sub && <span className="text-[10px] text-gray-400 mt-1 font-light">{sub}</span>}
                </div>
                <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: `${color}15` }}>
                    <Icon size={18} style={{ color }} />
                </div>
            </div>
        </div>
    );
}

/* ─────────────────────────────────────────────
   Componente: Calendário Visual de Ocupação
──────────────────────────────────────────────*/
function CalendarioOcupacao({ reservas, bloqueios, ano, mes, quartos }: {
    reservas: ReservaEvento[];
    bloqueios: BloqueioEvento[];
    ano: number;
    mes: number;
    quartos: string[];
}) {
    const diasNoMes = new Date(ano, mes, 0).getDate();
    const dias = Array.from({ length: diasNoMes }, (_, i) => i + 1);
    const [tooltip, setTooltip] = useState<{ text: string; x: number; y: number } | null>(null);

    function getDayEvents(quarto: string, dia: number) {
        const date = new Date(ano, mes - 1, dia);
        const isoDate = date.toISOString().split('T')[0];

        const reserva = reservas.find(r => {
            if (r.quarto.nome !== quarto) return false;
            const ci = r.data_check_in.split('T')[0];
            const co = r.data_check_out.split('T')[0];
            return isoDate >= ci && isoDate < co;
        });

        const bloqueio = bloqueios.find(b => {
            if (b.quarto.nome !== quarto) return false;
            const di = b.data_inicio.split('T')[0];
            const df = b.data_fim.split('T')[0];
            return isoDate >= di && isoDate < df;
        });

        return { reserva, bloqueio };
    }

    function getCellStyle(reserva?: ReservaEvento, bloqueio?: BloqueioEvento) {
        if (bloqueio) return { backgroundColor: '#78909C22', borderRadius: '3px' };
        if (!reserva) return {};
        const color = STATUS_COLOR[reserva.status] || '#B8A97A';
        return { backgroundColor: `${color}25`, borderRadius: '3px' };
    }

    function getCellContent(reserva?: ReservaEvento, bloqueio?: BloqueioEvento, quarto?: string, dia?: number) {
        if (bloqueio) {
            const fdi = new Date(bloqueio.data_inicio);
            if (fdi.getDate() === dia && (fdi.getMonth() + 1) === mes) {
                return <Moon size={10} className="text-gray-400 mx-auto" />;
            }
            return <div className="w-full h-full bg-gray-200/40" />;
        }
        if (!reserva) return null;
        const color = STATUS_COLOR[reserva.status] || '#B8A97A';
        const fci = new Date(reserva.data_check_in);
        if (fci.getDate() === dia && (fci.getMonth() + 1) === mes) {
            return (
                <div className="w-2 h-2 rounded-full mx-auto mt-[2px]" style={{ backgroundColor: color }} />
            );
        }
        return <div className="w-full h-[2px] mt-2 mx-1" style={{ backgroundColor: `${color}60` }} />;
    }

    return (
        <div className="overflow-x-auto">
            <div className="min-w-[900px]">
                <div className="grid mb-1" style={{ gridTemplateColumns: `140px repeat(${diasNoMes}, 1fr)` }}>
                    <div className="text-[9px] uppercase tracking-widest text-gray-400 py-2 pl-2">Alojamento</div>
                    {dias.map(d => {
                        const today = new Date();
                        const isToday = d === today.getDate() && mes === today.getMonth() + 1 && ano === today.getFullYear();
                        const dow = new Date(ano, mes - 1, d).getDay();
                        const isWeekend = dow === 0 || dow === 6;
                        return (
                            <div key={d} className={`text-center py-2 text-[9px] font-medium ${isToday ? 'text-carapita-gold font-bold' : isWeekend ? 'text-carapita-dark' : 'text-gray-400'}`}>
                                {d}
                            </div>
                        );
                    })}
                </div>

                {quartos.map((quarto, qi) => (
                    <div key={qi} className="grid border-t border-gray-50 hover:bg-gray-50/50 transition-colors"
                        style={{ gridTemplateColumns: `140px repeat(${diasNoMes}, 1fr)` }}>
                        <div className="text-[10px] font-medium text-carapita-dark py-3 pl-2 pr-1 truncate flex items-center">
                            {quarto}
                        </div>
                        {dias.map(d => {
                            const today = new Date();
                            const isToday = d === today.getDate() && mes === today.getMonth() + 1 && ano === today.getFullYear();
                            const { reserva, bloqueio } = getDayEvents(quarto, d);
                            return (
                                <div
                                    key={d}
                                    className={`h-10 flex items-center justify-center cursor-default border-l border-gray-50 ${isToday ? 'border-l-carapita-gold border-l-2' : ''}`}
                                    style={getCellStyle(reserva, bloqueio)}
                                    onMouseEnter={(e) => {
                                        if (reserva) {
                                            const noites = nightsBetween(reserva.data_check_in, reserva.data_check_out);
                                            setTooltip({
                                                text: `${reserva.hospede.nome} | ${formatDate(reserva.data_check_in)} → ${formatDate(reserva.data_check_out)} (${noites}n) | ${reserva.status}`,
                                                x: e.clientX, y: e.clientY
                                            });
                                        } else if (bloqueio) {
                                            setTooltip({ text: `Bloqueio: ${bloqueio.motivo || 'Sem motivo'}`, x: e.clientX, y: e.clientY });
                                        }
                                    }}
                                    onMouseLeave={() => setTooltip(null)}
                                >
                                    {getCellContent(reserva, bloqueio, quarto, d)}
                                </div>
                            );
                        })}
                    </div>
                ))}
            </div>

            {tooltip && (
                <div className="fixed z-[999] bg-carapita-dark text-white text-[10px] px-3 py-2 rounded shadow-xl pointer-events-none max-w-xs leading-relaxed"
                    style={{ top: tooltip.y - 50, left: tooltip.x + 10 }}>
                    {tooltip.text}
                </div>
            )}
        </div>
    );
}

/* ─────────────────────────────────────────────
   Componente: Barra de Canal
──────────────────────────────────────────────*/
function CanalBar({ canal, count, total }: { canal: string; count: number; total: number }) {
    const pct = total > 0 ? Math.round((count / total) * 100) : 0;
    const colors: Record<string, string> = { SITE: '#B8A97A', AIRBNB: '#FF5A5F', BOOKING: '#003580' };
    const color = colors[canal] || '#888';
    return (
        <div className="flex items-center gap-4">
            <span className="text-[10px] uppercase tracking-widest w-20 text-gray-500 flex-shrink-0">{canal}</span>
            <div className="flex-1 bg-gray-100 h-2 rounded-full overflow-hidden">
                <div className="h-2 rounded-full transition-all duration-1000" style={{ width: `${pct}%`, backgroundColor: color }} />
            </div>
            <span className="text-xs font-medium w-12 text-right text-carapita-dark">{count} ({pct}%)</span>
        </div>
    );
}

/* ─────────────────────────────────────────────
   PÁGINA PRINCIPAL
──────────────────────────────────────────────*/
export default function AdminDashboard() {
    const router = useRouter();
    const [data, setData] = useState<DashData | null>(null);
    const [loading, setLoading] = useState(true);
    const [calAno, setCalAno] = useState(new Date().getFullYear());
    const [calMes, setCalMes] = useState(new Date().getMonth() + 1);
    const [calLoading, setCalLoading] = useState(false);
    const [selectedReserva, setSelectedReserva] = useState<ReservaEvento | null>(null);

    const fetchDash = useCallback(async (ano: number, mes: number) => {
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
        if (!token) { router.push('/login'); return; }
        setCalLoading(true);
        try {
            const resp = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/reservas/dashboard?ano=${ano}&mes=${mes}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (resp.status === 401 || resp.status === 403) {
                localStorage.removeItem('token');
                router.push('/login');
                return;
            }

            const json = await resp.json();
            if (json.status === 'success') {
                setData(json.data);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
            setCalLoading(false);
        }
    }, [router]);

    useEffect(() => { fetchDash(calAno, calMes); }, [fetchDash, calAno, calMes]);

    const mudaMes = (delta: number) => {
        let nm = calMes + delta;
        let na = calAno;
        if (nm > 12) { nm = 1; na++; }
        if (nm < 1) { nm = 12; na--; }
        setCalMes(nm);
        setCalAno(na);
    };

    const updateStatusDash = async (id: string, endpoint: string) => {
        const token = localStorage.getItem('token');
        try {
            const resp = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/reservas/${id}/${endpoint}`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` }
            });
            const json = await resp.json();
            if (json.status === 'success') {
                setSelectedReserva(null);
                fetchDash(calAno, calMes);
            } else {
                alert(json.error || 'Erro ao atualizar');
            }
        } catch { alert('Erro de comunicação'); }
    };

    const quartosUnicos = data ? Array.from(new Set([
        ...data.reservasCalendario.map(r => r.quarto.nome),
        ...data.bloqueiosCalendario.map(b => b.quarto.nome)
    ])).sort() : [];

    const totalCanal = data ? Object.values(data.porCanal).reduce((a, b: any) => a + b, 0) : 0;

    if (loading) return (
        <div className="min-h-screen bg-[#F9F8F6] flex items-center justify-center">
            <div className="text-center">
                <div className="w-8 h-8 border-2 border-carapita-gold border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="text-[10px] uppercase tracking-widest text-gray-400">A carregar o painel...</p>
            </div>
        </div>
    );

    if (!data) return (
        <div className="min-h-screen bg-[#F9F8F6] flex items-center justify-center">
            <p className="text-sm text-gray-500">Erro ao carregar dados. Verifique o servidor.</p>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#F9F8F6] font-sans">
            <AdminSidebar />

            <div className="ml-20 p-8 md:p-12 max-w-[1600px]">
                <div className="flex items-end justify-between mb-10">
                    <div>
                        <span className="text-carapita-gold text-[10px] uppercase tracking-mega font-bold block mb-1">
                            Refúgio Carapita · Channel Manager
                        </span>
                        <h1 className="text-4xl font-serif text-carapita-dark font-light">
                            Painel de Controlo
                        </h1>
                        <p className="text-xs text-gray-400 mt-1 font-light">
                            {new Date().toLocaleDateString('pt-PT', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                        </p>
                    </div>
                    <button
                        onClick={() => fetchDash(calAno, calMes)}
                        className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-gray-400 hover:text-carapita-gold transition-colors"
                    >
                        <RefreshCw size={12} className={calLoading ? 'animate-spin' : ''} />
                        Atualizar
                    </button>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-10">
                    <KpiCard icon={Euro} label="Receita do Mês" value={`€ ${Number(data.kpis.receitaMes).toLocaleString('pt-PT', { minimumFractionDigits: 2 })}`} sub={MESES_PT[new Date().getMonth()]} color="#B8A97A" />
                    <KpiCard icon={Calendar} label="Reservas Este Mês" value={data.kpis.reservasMes} sub="confirmadas + check" color="#2E7D32" />
                    <KpiCard icon={TrendingUp} label="Taxa de Ocupação" value={`${data.kpis.taxaOcupacao}%`} sub="mês corrente" color="#1565C0" />
                    <KpiCard icon={Home} label="Alojamentos Ativos" value={data.kpis.quartosTotalAtivos} sub="disponíveis" color="#4A148C" />
                    <KpiCard icon={Users} label="Hóspedes Hoje" value={data.kpis.reservasHoje} sub="check-in ativo" color="#E65100" />
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 mb-8">
                    <div className="xl:col-span-2 bg-white border border-gray-100 p-8 hover:shadow-xl transition-shadow duration-500">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <span className="text-[10px] uppercase tracking-mega text-carapita-gold font-bold block mb-1">Calendário de Ocupação</span>
                                <h2 className="text-xl font-serif text-carapita-dark font-light">
                                    {MESES_PT[calMes - 1]} {calAno}
                                </h2>
                            </div>
                            <div className="flex items-center gap-2">
                                <button onClick={() => mudaMes(-1)} className="w-8 h-8 border border-gray-100 flex items-center justify-center hover:border-carapita-gold hover:text-carapita-gold transition-colors">
                                    <ChevronLeft size={14} />
                                </button>
                                <button
                                    onClick={() => { setCalMes(new Date().getMonth() + 1); setCalAno(new Date().getFullYear()); }}
                                    className="text-[9px] uppercase tracking-widest px-3 py-1 border border-gray-100 hover:border-carapita-gold transition-colors text-gray-400 hover:text-carapita-gold"
                                >
                                    Hoje
                                </button>
                                <button onClick={() => mudaMes(1)} className="w-8 h-8 border border-gray-100 flex items-center justify-center hover:border-carapita-gold hover:text-carapita-gold transition-colors">
                                    <ChevronRight size={14} />
                                </button>
                            </div>
                        </div>

                        {calLoading ? (
                            <div className="h-40 flex items-center justify-center">
                                <div className="w-6 h-6 border-2 border-carapita-gold border-t-transparent rounded-full animate-spin" />
                            </div>
                        ) : quartosUnicos.length === 0 ? (
                            <div className="h-40 flex flex-col items-center justify-center gap-3 text-gray-300">
                                <Calendar size={32} />
                                <p className="text-[11px] uppercase tracking-widest">Sem eventos neste mês</p>
                            </div>
                        ) : (
                            <CalendarioOcupacao
                                reservas={data.reservasCalendario}
                                bloqueios={data.bloqueiosCalendario}
                                ano={calAno}
                                mes={calMes}
                                quartos={quartosUnicos}
                            />
                        )}

                        <div className="flex flex-wrap gap-6 mt-6 pt-6 border-t border-gray-50">
                            {Object.entries(STATUS_COLOR).map(([s, c]) => (
                                <div key={s} className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: c }} />
                                    <span className="text-[9px] uppercase tracking-widest text-gray-400">{s}</span>
                                </div>
                            ))}
                            <div className="flex items-center gap-2">
                                <Moon size={10} className="text-gray-400" />
                                <span className="text-[9px] uppercase tracking-widest text-gray-400">Bloqueio</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col gap-6">
                        <div className="bg-white border border-gray-100 p-8 hover:shadow-xl transition-shadow duration-500">
                            <span className="text-[10px] uppercase tracking-mega text-carapita-gold font-bold block mb-1">Distribuição</span>
                            <h3 className="text-lg font-serif text-carapita-dark font-light mb-6">Canais de Origem</h3>
                            {Object.entries(data.porCanal).length === 0 ? (
                                <p className="text-xs text-gray-300 italic">Sem dados este mês</p>
                            ) : (
                                <div className="flex flex-col gap-4">
                                    {Object.entries(data.porCanal).map(([canal, count]) => (
                                        <CanalBar key={canal} canal={canal} count={count} total={totalCanal} />
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="bg-white border border-gray-100 p-8 hover:shadow-xl transition-shadow duration-500 flex-1">
                            <span className="text-[10px] uppercase tracking-mega text-carapita-gold font-bold block mb-1">Esta Semana</span>
                            <h3 className="text-lg font-serif text-carapita-dark font-light mb-6">Check-outs Próximos</h3>
                            {data.proximosCheckouts.length === 0 ? (
                                <p className="text-xs text-gray-300 italic">Nenhum check-out nos próximos 7 dias</p>
                            ) : (
                                <div className="flex flex-col divide-y divide-gray-50">
                                    {data.proximosCheckouts.map(r => (
                                        <div key={r.id} className="py-3 flex items-center justify-between gap-2">
                                            <div className="flex items-start gap-3">
                                                <LogOut size={14} className="text-purple-400 flex-shrink-0 mt-[2px]" />
                                                <div>
                                                    <p className="text-xs font-medium text-carapita-dark leading-none mb-1">{r.hospede.nome}</p>
                                                    <p className="text-[10px] text-gray-400">{r.quarto.nome}</p>
                                                </div>
                                            </div>
                                            <span className="text-[10px] text-purple-500 font-medium flex-shrink-0">
                                                {formatDate(r.data_check_out)}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="bg-white border border-gray-100 p-8 hover:shadow-xl transition-shadow duration-500">
                    <div className="flex items-end justify-between mb-6">
                        <div>
                            <span className="text-carapita-gold text-[10px] uppercase tracking-mega font-bold block mb-1">Agenda 7 Dias</span>
                            <h2 className="text-xl font-serif text-carapita-dark font-light">Check-ins Próximos</h2>
                        </div>
                        <button onClick={() => router.push('/admin/reservas')} className="text-[10px] uppercase tracking-widest text-gray-400 hover:text-carapita-gold transition-colors flex items-center gap-1">
                            Ver Todas <ArrowRight size={10} />
                        </button>
                    </div>

                    {data.proximosCheckins.length === 0 ? (
                        <div className="py-12 text-center text-gray-300">
                            <Clock size={32} className="mx-auto mb-3" />
                            <p className="text-[11px] uppercase tracking-widest">Sem chegadas nos próximos 7 dias</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            {data.proximosCheckins.map(r => {
                                const color = STATUS_COLOR[r.status] || '#B8A97A';
                                const noites = nightsBetween(r.data_check_in, r.data_check_out);
                                return (
                                    <div
                                        key={r.id}
                                        className="border border-gray-100 p-5 cursor-pointer hover:border-carapita-gold hover:shadow-lg transition-all duration-300 group relative overflow-hidden"
                                        onClick={() => setSelectedReserva(r)}
                                    >
                                        <div className="absolute top-0 left-0 w-1 h-full" style={{ backgroundColor: color }} />
                                        <div className="pl-3">
                                            <div className="flex items-center justify-between mb-3">
                                                <span className="text-[9px] uppercase tracking-widest font-bold px-2 py-1 rounded-full" style={{ backgroundColor: `${color}20`, color }}>
                                                    {r.status}
                                                </span>
                                                <LogIn size={12} className="text-gray-300 group-hover:text-carapita-gold transition-colors" />
                                            </div>
                                            <p className="font-serif text-sm text-carapita-dark mb-1 font-medium">{r.hospede.nome}</p>
                                            <p className="text-[10px] text-gray-400 mb-3">{r.quarto.nome}</p>
                                            <div className="flex items-center justify-between text-[10px]">
                                                <span className="text-carapita-gold font-medium">{formatDateFull(r.data_check_in)}</span>
                                                <span className="text-gray-400">{noites}n</span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {selectedReserva && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setSelectedReserva(null)} />
                    <div className="relative bg-white w-full max-w-md p-10 z-10 shadow-2xl animate-fade-in">
                        <button onClick={() => setSelectedReserva(null)} className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center border border-gray-100 hover:border-carapita-gold hover:text-carapita-gold transition-colors">
                            <X size={14} />
                        </button>
                        <span className="text-carapita-gold text-[10px] uppercase tracking-mega font-bold block mb-1">Detalhe</span>
                        <h3 className="text-2xl font-serif text-carapita-dark font-light mb-6">{selectedReserva.hospede.nome}</h3>
                        <div className="space-y-3 mb-8">
                            {[
                                { label: 'Alojamento', value: selectedReserva.quarto.nome },
                                { label: 'Check-in', value: formatDateFull(selectedReserva.data_check_in) },
                                { label: 'Check-out', value: formatDateFull(selectedReserva.data_check_out) },
                                { label: 'Noites', value: `${nightsBetween(selectedReserva.data_check_in, selectedReserva.data_check_out)} noites` },
                                { label: 'Valor Total', value: `€ ${Number(selectedReserva.valor_total).toFixed(2)}` },
                                { label: 'Estado Atual', value: selectedReserva.status },
                            ].map(({ label, value }) => (
                                <div key={label} className="flex justify-between items-center text-sm border-b border-gray-50 pb-2">
                                    <span className="text-[10px] uppercase tracking-widest text-gray-400">{label}</span>
                                    <span className="font-medium text-carapita-dark text-xs">{value}</span>
                                </div>
                            ))}
                        </div>

                        <div className="grid grid-cols-1 gap-2">
                            {selectedReserva.status === 'PENDENTE' && (
                                <button onClick={() => updateStatusDash(selectedReserva.id, 'confirmar')} className="w-full py-3 bg-green-600 text-white text-[10px] uppercase tracking-widest font-bold hover:bg-green-700 transition-all">Confirmar Reserva</button>
                            )}
                            {selectedReserva.status === 'CONFIRMADA' && (
                                <button onClick={() => updateStatusDash(selectedReserva.id, 'checkin')} className="w-full py-3 bg-blue-600 text-white text-[10px] uppercase tracking-widest font-bold hover:bg-blue-700 transition-all">Realizar Check-in</button>
                            )}
                            {selectedReserva.status === 'CHECK_IN' && (
                                <button onClick={() => updateStatusDash(selectedReserva.id, 'checkout')} className="w-full py-3 bg-purple-600 text-white text-[10px] uppercase tracking-widest font-bold hover:bg-purple-700 transition-all">Realizar Check-out</button>
                            )}
                            {selectedReserva.status !== 'CANCELADA' && selectedReserva.status !== 'CHECK_OUT' && (
                                <button
                                    onClick={() => updateStatusDash(selectedReserva.id, 'cancelar')}
                                    className="w-full py-3 bg-red-50 hover:bg-red-600 text-red-600 hover:text-white text-[10px] uppercase tracking-widest transition-all duration-300 border border-red-200 hover:border-red-600"
                                >
                                    Cancelar Reserva
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
