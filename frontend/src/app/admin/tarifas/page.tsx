"use client";
import React, { useState, useEffect } from 'react';
import { TrendingUp, Plus, Trash2, Calendar, Home, Euro, Info } from 'lucide-react';
import AdminSidebar from '@/components/AdminSidebar';

interface Quarto {
    id: string;
    nome: string;
    preco_base: number;
}

interface TarifaSazonal {
    id: string;
    quarto_id: string;
    quarto: { nome: string };
    data_inicio: string;
    data_fim: string;
    preco_noite: number;
    motivo: string;
}

export default function AdminTarifas() {
    const [tarifas, setTarifas] = useState<TarifaSazonal[]>([]);
    const [quartos, setQuartos] = useState<Quarto[]>([]);
    const [loading, setLoading] = useState(true);
    const [nova, setNova] = useState({ quarto_id: '', data_inicio: '', data_fim: '', preco_noite: 0, motivo: '' });

    const fetchData = async () => {
        const token = localStorage.getItem('token');
        try {
            const [tResp, qResp] = await Promise.all([
                fetch('http://localhost:5000/api/tarifas', { headers: { 'Authorization': `Bearer ${token}` } }),
                fetch('http://localhost:5000/api/quartos')
            ]);
            const tData = await tResp.json();
            const qData = await qResp.json();
            if (tData.status === 'success') setTarifas(tData.data);
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
            const resp = await fetch('http://localhost:5000/api/tarifas', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(nova)
            });
            if (resp.ok) {
                setNova({ quarto_id: '', data_inicio: '', data_fim: '', preco_noite: 0, motivo: '' });
                fetchData();
            }
        } catch (e) { alert("Erro ao salvar"); }
    };

    const handleDeletar = async (id: string) => {
        if (!confirm("Remover esta tarifa sazonal?")) return;
        const token = localStorage.getItem('token');
        try {
            await fetch(`http://localhost:5000/api/tarifas/${id}`, {
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
                <p className="text-[10px] uppercase tracking-widest text-gray-400">A carregar tarifário...</p>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#F9F8F6]">
            <AdminSidebar />

            <div className="ml-20 p-8 md:p-12 max-w-6xl mx-auto">
                <div className="mb-16">
                    <span className="text-carapita-gold text-[10px] uppercase tracking-mega font-bold block mb-1">Estratégia</span>
                    <h1 className="text-4xl font-serif text-carapita-dark">Tarifas e Épocas</h1>
                    <p className="text-xs text-carapita-muted mt-2 font-light">Gerencie preços dinâmicos para feriados, eventos e épocas altas.</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-start">
                    {/* Formulário */}
                    <div className="bg-white border border-gray-100 p-8 shadow-xl hover:shadow-2xl transition-all duration-500">
                        <div className="flex items-center gap-3 mb-8">
                            <Plus size={18} className="text-carapita-gold" />
                            <h2 className="font-serif text-xl text-carapita-dark">Nova Época Especial</h2>
                        </div>
                        <form onSubmit={handleSalvar} className="space-y-6">
                            <div className="space-y-1">
                                <label className="text-[9px] uppercase tracking-widest text-carapita-muted font-bold">Alojamento</label>
                                <select required className="w-full border-b border-gray-100 py-3 outline-none text-sm focus:border-carapita-gold transition-colors bg-transparent" value={nova.quarto_id} onChange={e => setNova({ ...nova, quarto_id: e.target.value })}>
                                    <option value="">Selecione um Quarto</option>
                                    {quartos.map(q => <option key={q.id} value={q.id}>{q.nome}</option>)}
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-[9px] uppercase tracking-widest text-carapita-muted font-bold">Desde</label>
                                    <input type="date" required className="w-full border-b border-gray-100 py-3 outline-none text-sm focus:border-carapita-gold transition-colors" value={nova.data_inicio} onChange={e => setNova({ ...nova, data_inicio: e.target.value })} />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[9px] uppercase tracking-widest text-carapita-muted font-bold">Até</label>
                                    <input type="date" required className="w-full border-b border-gray-100 py-3 outline-none text-sm focus:border-carapita-gold transition-colors" value={nova.data_fim} onChange={e => setNova({ ...nova, data_fim: e.target.value })} />
                                </div>
                            </div>
                            <div className="space-y-1">
                                <label className="text-[9px] uppercase tracking-widest text-carapita-muted font-bold">Novo Preço / Noite (€)</label>
                                <div className="flex items-center gap-2 border-b border-gray-100 focus-within:border-carapita-gold transition-colors">
                                    <span className="text-carapita-gold text-lg font-serif">€</span>
                                    <input type="number" required className="w-full py-3 outline-none text-sm bg-transparent" value={nova.preco_noite} onChange={e => setNova({ ...nova, preco_noite: parseFloat(e.target.value) })} />
                                </div>
                            </div>
                            <div className="space-y-1">
                                <label className="text-[9px] uppercase tracking-widest text-carapita-muted font-bold">Identificador (Ex: Verão 2024)</label>
                                <input className="w-full border-b border-gray-100 py-3 outline-none text-sm focus:border-carapita-gold transition-colors" value={nova.motivo} onChange={e => setNova({ ...nova, motivo: e.target.value })} placeholder="Nome do evento ou época" />
                            </div>
                            <button className="w-full bg-carapita-dark text-white py-4 text-[10px] uppercase tracking-mega hover:bg-carapita-gold transition-all duration-500 shadow-xl shadow-carapita-dark/10">
                                Aplicar Tarifa Especial
                            </button>
                        </form>
                    </div>

                    {/* Lista */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                            <h2 className="font-serif text-xl text-carapita-dark">Tarifas Ativas</h2>
                            <span className="text-[10px] uppercase tracking-widest text-carapita-muted">{tarifas.length} Regras</span>
                        </div>
                        {tarifas.length === 0 ? (
                            <div className="bg-white p-20 text-center border border-gray-100 shadow-sm opacity-60">
                                <p className="text-carapita-muted uppercase tracking-widest text-[10px]">Sem variações de preço configuradas.</p>
                            </div>
                        ) : (
                            tarifas.map((t) => (
                                <div key={t.id} className="bg-white border border-gray-100 p-8 flex items-center gap-8 hover:shadow-xl transition-all duration-500 group">
                                    <div className="w-12 h-12 rounded-full bg-carapita-gold/10 flex items-center justify-center text-carapita-gold group-hover:bg-carapita-gold group-hover:text-white transition-all duration-500 shrink-0 shadow-sm">
                                        <TrendingUp size={20} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-3 mb-1">
                                            <h3 className="font-serif text-xl text-carapita-dark truncate">{t.quarto.nome}</h3>
                                            <span className="text-[9px] uppercase tracking-widest font-bold bg-carapita-gold/10 text-carapita-gold px-2 py-0.5 rounded shadow-sm">{t.motivo}</span>
                                        </div>
                                        <div className="flex items-center gap-1.5 text-carapita-muted">
                                            <Calendar size={12} className="text-carapita-gold/60" />
                                            <span className="text-[11px] font-medium">{new Date(t.data_inicio).toLocaleDateString('pt-PT')}</span>
                                            <span className="text-[9px] text-gray-300 mx-1">até</span>
                                            <span className="text-[11px] font-medium">{new Date(t.data_fim).toLocaleDateString('pt-PT')}</span>
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end shrink-0">
                                        <span className="text-[9px] uppercase tracking-widest text-carapita-muted font-bold mb-1">Novo Valor</span>
                                        <div className="flex items-baseline gap-1">
                                            <span className="text-sm font-serif text-carapita-gold">€</span>
                                            <span className="text-3xl font-serif text-carapita-dark">{Number(t.preco_noite).toFixed(0)}</span>
                                        </div>
                                    </div>
                                    <button onClick={() => handleDeletar(t.id)} className="w-10 h-10 border border-gray-50 flex items-center justify-center text-gray-300 hover:text-red-500 hover:bg-red-50 transition-all duration-300 ml-4 shrink-0">
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            ))
                        )}
                        <div className="bg-carapita-gold/5 p-6 border-l-2 border-carapita-gold flex gap-4 items-start">
                            <Info size={16} className="text-carapita-gold shrink-0 mt-0.5" />
                            <p className="text-[11px] text-carapita-dark/60 leading-relaxed font-light">
                                <strong className="font-bold">Dica:</strong> Se houver mais de uma tarifa para o mesmo dia, o sistema prioriza a última criada. Se nenhuma tarifa sazonal existir, o preço base definido no inventário do quarto será aplicado.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
