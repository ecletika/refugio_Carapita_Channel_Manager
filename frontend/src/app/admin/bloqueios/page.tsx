"use client";
import React, { useState, useEffect } from 'react';
import { Lock, Plus, Trash2, Calendar, Home, Info, Moon, ShieldAlert } from 'lucide-react';
import AdminSidebar from '@/components/AdminSidebar';

interface Quarto {
    id: string;
    nome: string;
}

interface Bloqueio {
    id: string;
    quarto_id: string;
    quarto: { nome: string };
    data_inicio: string;
    data_fim: string;
    motivo: string;
}

export default function AdminBloqueios() {
    const [bloqueios, setBloqueios] = useState<Bloqueio[]>([]);
    const [quartos, setQuartos] = useState<Quarto[]>([]);
    const [loading, setLoading] = useState(true);
    const [novo, setNovo] = useState({ quarto_id: '', data_inicio: '', data_fim: '', motivo: '' });

    const fetchData = async () => {
        const token = localStorage.getItem('token');
        try {
            const [bResp, qResp] = await Promise.all([
                fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/bloqueios`, { headers: { 'Authorization': `Bearer ${token}` } }),
                fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/quartos`)
            ]);
            const bData = await bResp.json();
            const qData = await qResp.json();
            if (bData.status === 'success') setBloqueios(bData.data);
            if (qData.status === 'success') setQuartos(qData.data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    const handleSalvar = async (e: React.FormEvent) => {
        e.preventDefault();
        const token = localStorage.getItem('token');
        try {
            const resp = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/bloqueios`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(novo)
            });
            if (resp.ok) {
                setNovo({ quarto_id: '', data_inicio: '', data_fim: '', motivo: '' });
                fetchData();
            } else {
                const err = await resp.json();
                alert(err.error || "Erro ao bloquear");
            }
        } catch (e) { alert("Erro de comunicação"); }
    };

    const handleDeletar = async (id: string) => {
        if (!confirm("Remover este bloqueio de agenda? As datas ficarão disponíveis para reserva novamente.")) return;
        const token = localStorage.getItem('token');
        try {
            await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/bloqueios/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            fetchData();
        } catch (e) { alert("Erro ao apagar"); }
    };

    if (loading) return (
        <div className="min-h-screen bg-[#F9F8F6] flex items-center justify-center">
            <div className="text-center">
                <div className="w-8 h-8 border-2 border-carapita-gold border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="text-[10px] uppercase tracking-widest text-gray-400">A carregar agenda...</p>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#F9F8F6]">
            <AdminSidebar />

            <div className="ml-20 p-8 md:p-12 max-w-6xl mx-auto">
                <div className="mb-16">
                    <span className="text-carapita-gold text-[10px] uppercase tracking-mega font-bold block mb-1">Manutenção</span>
                    <h1 className="text-4xl font-serif text-carapita-dark">Bloquear Agenda</h1>
                    <p className="text-xs text-carapita-muted mt-2 font-light">Impeça reservas em alojamentos para manutenção, obras ou uso próprio.</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-start">
                    {/* Formulário */}
                    <div className="bg-white border border-gray-100 p-8 shadow-xl hover:shadow-2xl transition-all duration-500 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-24 h-24 -mr-12 -mt-12 bg-gray-50 rounded-full flex items-end justify-start pl-6 pb-6">
                            <ShieldAlert size={24} className="text-gray-200" />
                        </div>
                        <div className="flex items-center gap-3 mb-8 relative">
                            <Lock size={18} className="text-carapita-gold" />
                            <h2 className="font-serif text-xl text-carapita-dark">Novo Bloqueio</h2>
                        </div>
                        <form onSubmit={handleSalvar} className="space-y-6 relative">
                            <div className="space-y-1">
                                <label className="text-[9px] uppercase tracking-widest text-carapita-muted font-bold">Alojamento</label>
                                <select required className="w-full border-b border-gray-100 py-3 outline-none text-sm focus:border-carapita-gold transition-colors bg-transparent capitalize" value={novo.quarto_id} onChange={e => setNovo({ ...novo, quarto_id: e.target.value })}>
                                    <option value="">Selecione um Quarto</option>
                                    {quartos.map(q => <option key={q.id} value={q.id}>{q.nome}</option>)}
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-[9px] uppercase tracking-widest text-carapita-muted font-bold">Desde (Inclusive)</label>
                                    <input type="date" required className="w-full border-b border-gray-100 py-3 outline-none text-sm focus:border-carapita-gold transition-colors" value={novo.data_inicio} onChange={e => setNovo({ ...novo, data_inicio: e.target.value })} />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[9px] uppercase tracking-widest text-carapita-muted font-bold">Até (Inclusive)</label>
                                    <input type="date" required className="w-full border-b border-gray-100 py-3 outline-none text-sm focus:border-carapita-gold transition-colors" value={novo.data_fim} onChange={e => setNovo({ ...novo, data_fim: e.target.value })} />
                                </div>
                            </div>
                            <div className="space-y-1">
                                <label className="text-[9px] uppercase tracking-widest text-carapita-muted font-bold">Motivo do Bloqueio</label>
                                <textarea className="w-full border border-gray-100 p-4 outline-none text-sm focus:border-carapita-gold transition-colors bg-gray-50/30" rows={3} value={novo.motivo} onChange={e => setNovo({ ...novo, motivo: e.target.value })} placeholder="Ex: Manutenção canalização, Pintura, Férias do proprietário..." />
                            </div>
                            <button className="w-full bg-carapita-dark text-white py-4 text-[10px] uppercase tracking-mega hover:bg-carapita-gold transition-all duration-500 shadow-xl shadow-carapita-dark/10">
                                Gravar Bloqueio
                            </button>
                        </form>
                    </div>

                    {/* Lista */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                            <h2 className="font-serif text-xl text-carapita-dark">Agenda Bloqueada</h2>
                            <span className="text-[10px] uppercase tracking-widest text-carapita-muted">{bloqueios.length} Interrupções</span>
                        </div>
                        {bloqueios.length === 0 ? (
                            <div className="bg-white p-20 text-center border border-gray-100 shadow-sm opacity-60">
                                <p className="text-carapita-muted uppercase tracking-widest text-[10px]">Toda a agenda está disponível para venda.</p>
                            </div>
                        ) : (
                            bloqueios.map((b) => (
                                <div key={b.id} className="bg-white border border-gray-100 p-8 flex items-center gap-8 hover:shadow-xl transition-all duration-500 group">
                                    <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 group-hover:bg-carapita-dark group-hover:text-white transition-all duration-500 shrink-0 shadow-sm">
                                        <Moon size={18} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-3 mb-1">
                                            <h3 className="font-serif text-xl text-carapita-dark truncate capitalize">{b.quarto?.nome || 'Quarto não encontrado'}</h3>
                                            <span className="text-[10px] text-red-500 font-medium border border-red-100 px-2 py-0.5 rounded uppercase tracking-widest">BLOQUEADO</span>
                                        </div>
                                        <p className="text-xs text-carapita-muted mb-3 font-light italic">" {b.motivo || 'Nenhum motivo indicado'} "</p>
                                        <div className="flex items-center gap-1.5 text-carapita-muted">
                                            <Calendar size={12} className="text-carapita-gold/60" />
                                            <span className="text-[11px] font-medium">{new Date(b.data_inicio).toLocaleDateString('pt-PT')}</span>
                                            <span className="text-[9px] text-gray-300 mx-1">até</span>
                                            <span className="text-[11px] font-medium">{new Date(b.data_fim).toLocaleDateString('pt-PT')}</span>
                                        </div>
                                    </div>
                                    <button onClick={() => handleDeletar(b.id)} className="w-10 h-10 border border-gray-50 flex items-center justify-center text-gray-300 hover:text-red-500 hover:bg-red-50 transition-all duration-300 ml-4 shrink-0">
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            ))
                        )}
                        <div className="bg-blue-50/50 p-6 border-l-2 border-blue-400 flex gap-4 items-start">
                            <Info size={16} className="text-blue-400 shrink-0 mt-0.5" />
                            <p className="text-[11px] text-carapita-dark/60 leading-relaxed font-light">
                                <strong className="font-bold">Aviso:</strong> Bloqueios de agenda impedem novas reservas no site para o período selecionado. Se já existir uma reserva confirmada sobrepondo estas datas, o bloqueio não a cancelará automaticamente.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
