"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    BarChart2, TrendingUp, Users, Euro, Filter, ChevronDown, Download,
    Calendar, ArrowUpRight, ArrowDownRight, Printer, PieChart, Activity
} from 'lucide-react';
import AdminSidebar from '@/components/AdminSidebar';

interface Stats {
    receitaTotal: number;
    totalReservas: number;
    ocupacaoPorQuarto: { nome: string; totalReservas: number }[];
    porCanal: { canal: string; count: number }[];
}

export default function AdminRelatorios() {
    const router = useRouter();
    const [stats, setStats] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(true);
    const [periodo, setPeriodo] = useState('Ultimos 30 dias');

    const fetchStats = async () => {
        const token = localStorage.getItem('token');
        if (!token) { router.push('/login'); return; }
        try {
            const resp = await fetch('http://localhost:5000/api/relatorios/geral', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const json = await resp.json();
            if (json.status === 'success') setStats(json.data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchStats(); }, []);

    if (loading) return (
        <div className="min-h-screen bg-[#F9F8F6] flex items-center justify-center">
            <div className="text-center">
                <div className="w-8 h-8 border-2 border-carapita-gold border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="text-[10px] uppercase tracking-widest text-gray-400">Gerando relatórios...</p>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#F9F8F6]">
            <AdminSidebar />

            <div className="ml-20 p-8 md:p-12 max-w-7xl mx-auto">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-16">
                    <div>
                        <span className="text-carapita-gold text-[10px] uppercase tracking-mega font-bold block mb-1">Inteligência de Negócio</span>
                        <h1 className="text-4xl font-serif text-carapita-dark">Análise & Performance</h1>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="relative group">
                            <button className="bg-white border border-gray-100 px-4 py-3 flex items-center gap-3 text-[10px] uppercase tracking-widest text-carapita-dark hover:border-carapita-gold transition-colors shadow-sm">
                                <Calendar size={14} className="text-carapita-gold" />
                                {periodo}
                                <ChevronDown size={14} />
                            </button>
                        </div>
                        <button className="bg-carapita-dark text-white px-6 py-3 flex items-center gap-3 text-[10px] uppercase tracking-mega hover:bg-carapita-gold transition-all duration-500 shadow-xl shadow-carapita-dark/10">
                            <Download size={14} />
                            Exportar PDF
                        </button>
                    </div>
                </div>

                {/* KPIs Principais */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                    <div className="bg-white border border-gray-100 p-8 hover:shadow-xl transition-all duration-500 group">
                        <span className="text-[9px] uppercase tracking-widest text-gray-400 font-bold block mb-2">Receita Acumulada</span>
                        <div className="flex items-baseline gap-2">
                            <span className="text-4xl font-serif text-carapita-dark">€{stats?.receitaTotal.toLocaleString('pt-PT')}</span>
                            <div className="flex items-center text-green-500 text-[10px] font-bold">
                                <ArrowUpRight size={10} /> 12%
                            </div>
                        </div>
                    </div>
                    <div className="bg-white border border-gray-100 p-8 hover:shadow-xl transition-all duration-500 group">
                        <span className="text-[9px] uppercase tracking-widest text-gray-400 font-bold block mb-2">Total de Reservas</span>
                        <div className="flex items-baseline gap-2">
                            <span className="text-4xl font-serif text-carapita-dark">{stats?.totalReservas}</span>
                            <div className="flex items-center text-green-500 text-[10px] font-bold">
                                <ArrowUpRight size={10} /> 5%
                            </div>
                        </div>
                    </div>
                    <div className="bg-white border border-gray-100 p-8 hover:shadow-xl transition-all duration-500 group">
                        <span className="text-[9px] uppercase tracking-widest text-gray-400 font-bold block mb-2">Ocupação Média</span>
                        <div className="flex items-baseline gap-2">
                            <span className="text-4xl font-serif text-carapita-dark">68%</span>
                            <div className="flex items-center text-red-500 text-[10px] font-bold">
                                <ArrowDownRight size={10} /> 2%
                            </div>
                        </div>
                    </div>
                    <div className="bg-white border border-gray-100 p-8 hover:shadow-xl transition-all duration-500 group">
                        <span className="text-[9px] uppercase tracking-widest text-gray-400 font-bold block mb-2">ADR (Tarifa Média)</span>
                        <div className="flex items-baseline gap-2">
                            <span className="text-4xl font-serif text-carapita-dark">€124</span>
                            <div className="flex items-center text-green-500 text-[10px] font-bold">
                                <ArrowUpRight size={10} /> €8
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                    {/* Performance por Alojamento */}
                    <div className="bg-white border border-gray-100 p-10 hover:shadow-2xl transition-all duration-700">
                        <div className="flex items-center justify-between mb-10">
                            <div>
                                <h3 className="font-serif text-2xl text-carapita-dark">Performance por Unidade</h3>
                                <p className="text-[10px] uppercase tracking-widest text-gray-400 mt-1">Total de reservas geradas</p>
                            </div>
                            <Activity className="text-carapita-gold" size={20} />
                        </div>
                        <div className="space-y-8">
                            {stats?.ocupacaoPorQuarto.map((q, i) => {
                                const max = Math.max(...stats.ocupacaoPorQuarto.map(x => x.totalReservas), 1);
                                const pct = (q.totalReservas / max) * 100;
                                return (
                                    <div key={i} className="group">
                                        <div className="flex justify-between items-end mb-2">
                                            <span className="text-xs font-bold uppercase tracking-widest text-carapita-dark">{q.nome}</span>
                                            <span className="text-sm font-serif text-carapita-gold">{q.totalReservas} reservas</span>
                                        </div>
                                        <div className="bg-gray-50 h-2 rounded-full overflow-hidden">
                                            <div className="bg-carapita-dark h-full transition-all duration-1000 group-hover:bg-carapita-gold" style={{ width: `${pct}%` }} />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Distribuição por Canal */}
                    <div className="bg-white border border-gray-100 p-10 hover:shadow-2xl transition-all duration-700">
                        <div className="flex items-center justify-between mb-10">
                            <div>
                                <h3 className="font-serif text-2xl text-carapita-dark">Origem das Reservas</h3>
                                <p className="text-[10px] uppercase tracking-widest text-gray-400 mt-1">Comparação de canais de venda</p>
                            </div>
                            <PieChart className="text-carapita-gold" size={20} />
                        </div>
                        <div className="flex flex-col gap-6">
                            {stats?.porCanal.map((c, i) => {
                                const total = stats.totalReservas || 1;
                                const pct = Math.round((c.count / total) * 100);
                                const colors: Record<string, string> = { SITE: 'bg-carapita-gold', AIRBNB: 'bg-[#FF5A5F]', BOOKING: 'bg-[#003580]' };
                                return (
                                    <div key={i} className="flex items-center gap-6">
                                        <div className={`w-4 h-4 rounded-full ${colors[c.canal] || 'bg-gray-400'}`} />
                                        <div className="flex-1">
                                            <div className="flex justify-between text-[10px] uppercase tracking-widest mb-1">
                                                <span className="font-bold text-carapita-dark">{c.canal}</span>
                                                <span className="text-gray-400">{c.count} ({pct}%)</span>
                                            </div>
                                            <div className="bg-gray-50 h-1.5 rounded-full overflow-hidden">
                                                <div className={`h-full ${colors[c.canal] || 'bg-gray-400'}`} style={{ width: `${pct}%` }} />
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        <div className="mt-12 bg-carapita-gold/5 p-6 border-l-4 border-carapita-gold">
                            <p className="text-[11px] text-carapita-dark/70 italic leading-relaxed">
                                "O Site Oficial continua a ser o seu canal mais rentável, representando {Math.round((stats?.porCanal.find(x => x.canal === 'SITE')?.count || 0) / (stats?.totalReservas || 1) * 100)}% das reservas sem comissões externas."
                            </p>
                        </div>
                    </div>
                </div>

                {/* Tabela de Top Clientes ou Outro Insight */}
                <div className="mt-10 bg-carapita-dark text-white p-12 overflow-hidden relative">
                    <div className="absolute top-[-20%] right-[-10%] w-96 h-96 bg-carapita-gold/10 rounded-full blur-3xl" />
                    <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-10">
                        <div>
                            <h4 className="font-serif text-3xl mb-2">Pronto para aumentar a receita?</h4>
                            <p className="text-white/60 text-sm font-light">As suas tarifas de fim-de-semana estão 15% abaixo da média da região. Considere um ajuste sazonal.</p>
                        </div>
                        <button onClick={() => router.push('/admin/tarifas')} className="bg-carapita-gold text-carapita-dark px-10 py-4 text-[11px] uppercase tracking-mega font-bold hover:bg-white transition-all whitespace-nowrap">
                            Ajustar Tarifário
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
