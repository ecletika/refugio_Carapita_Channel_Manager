"use client";
import React, { useState, useEffect } from 'react';
import { TrendingUp, Plus, Trash2, Calendar, Home, Euro, Info, Lock, Moon, ShieldAlert } from 'lucide-react';
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
    politica_cancelamento: string;
    minima_estadia: number;
}

interface Bloqueio {
    id: string;
    quarto_id: string;
    quarto: { nome: string };
    data_inicio: string;
    data_fim: string;
    motivo: string;
}

export default function AdminTarifasBloqueios() {
    const [quartos, setQuartos] = useState<Quarto[]>([]);
    
    // Tarifas
    const [tarifas, setTarifas] = useState<TarifaSazonal[]>([]);
    const [novaTarifa, setNovaTarifa] = useState({ quarto_id: '', data_inicio: '', data_fim: '', preco_noite: 0, motivo: '', politica_cancelamento: 'FLEXIVEL', minima_estadia: 2 });
    
    // Bloqueios
    const [bloqueios, setBloqueios] = useState<Bloqueio[]>([]);
    const [novoBloqueio, setNovoBloqueio] = useState({ quarto_id: '', data_inicio: '', data_fim: '', motivo: '' });
    
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        const token = localStorage.getItem('token');
        try {
            const [tResp, qResp, bResp] = await Promise.all([
                fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/tarifas`, { headers: { 'Authorization': `Bearer ${token}` } }),
                fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/quartos`),
                fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/bloqueios`, { headers: { 'Authorization': `Bearer ${token}` } })
            ]);
            const tData = await tResp.json();
            const qData = await qResp.json();
            const bData = await bResp.json();
            
            if (tData.status === 'success') setTarifas(tData.data);
            if (qData.status === 'success') setQuartos(qData.data);
            if (bData.status === 'success') setBloqueios(bData.data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    // HANDLERS TARIFAS
    const handleSalvarTarifa = async (e: React.FormEvent) => {
        e.preventDefault();
        const token = localStorage.getItem('token');
        try {
            const resp = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/tarifas`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(novaTarifa)
            });
            if (resp.ok) {
                setNovaTarifa({ quarto_id: '', data_inicio: '', data_fim: '', preco_noite: 0, motivo: '', politica_cancelamento: 'FLEXIVEL', minima_estadia: 2 });
                fetchData();
            }
        } catch (e) { alert("Erro ao salvar tarifa"); }
    };

    const handleDeletarTarifa = async (id: string) => {
        const token = localStorage.getItem('token');
        try {
            await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/tarifas/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            fetchData();
        } catch (e) { alert("Erro ao apagar tarifa"); }
    };

    // HANDLERS BLOQUEIOS
    const handleSalvarBloqueio = async (e: React.FormEvent) => {
        e.preventDefault();
        const token = localStorage.getItem('token');
        try {
            const resp = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/bloqueios`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(novoBloqueio)
            });
            if (resp.ok) {
                setNovoBloqueio({ quarto_id: '', data_inicio: '', data_fim: '', motivo: '' });
                fetchData();
            } else {
                const err = await resp.json();
                alert(err.error || "Erro ao bloquear");
            }
        } catch (e) { alert("Erro de comunicação"); }
    };

    const handleDeletarBloqueio = async (id: string) => {
        if (!confirm("Remover este bloqueio de agenda? As datas ficarão disponíveis para reserva novamente.")) return;
        const token = localStorage.getItem('token');
        try {
            await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/bloqueios/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            fetchData();
        } catch (e) { alert("Erro ao apagar bloqueio"); }
    };

    if (loading) return (
        <div className="min-h-screen bg-[#F9F8F6] flex items-center justify-center">
            <div className="text-center">
                <div className="w-8 h-8 border-2 border-carapita-gold border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="text-[10px] uppercase tracking-widest text-gray-400">A carregar tarifário e agenda...</p>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#F9F8F6]">
            <AdminSidebar />

            <div className="ml-20 p-8 md:p-12 max-w-[1400px] mx-auto">
                <div className="mb-16">
                    <span className="text-carapita-gold text-[10px] uppercase tracking-mega font-bold block mb-1">Estratégia & Manutenção</span>
                    <h1 className="text-4xl font-serif text-carapita-dark">Tarifas e Bloqueios</h1>
                    <p className="text-xs text-carapita-muted mt-2 font-light">Gerencie preços dinâmicos e disponibilidades da agenda lado a lado.</p>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-2 gap-12 items-start">
                    
                    {/* COLUNA ESQUERDA: TARIFAS */}
                    <div className="space-y-12">
                        {/* Formulário Tarifas */}
                        <div className="bg-white border border-gray-100 p-8 shadow-xl hover:shadow-2xl transition-all duration-500">
                            <div className="flex items-center gap-3 mb-8">
                                <Plus size={18} className="text-carapita-gold" />
                                <h2 className="font-serif text-xl text-carapita-dark">Nova Época Especial</h2>
                            </div>
                            <form onSubmit={handleSalvarTarifa} className="space-y-6">
                                <div className="space-y-1">
                                    <label className="text-[9px] uppercase tracking-widest text-carapita-muted font-bold">Alojamento</label>
                                    <select required className="w-full border-b border-gray-100 py-3 outline-none text-sm focus:border-carapita-gold transition-colors bg-transparent capitalize" value={novaTarifa.quarto_id} onChange={e => setNovaTarifa({ ...novaTarifa, quarto_id: e.target.value })}>
                                        <option value="">Selecione um Quarto</option>
                                        {quartos.map(q => <option key={q.id} value={q.id}>{q.nome}</option>)}
                                    </select>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-[9px] uppercase tracking-widest text-carapita-muted font-bold">Desde</label>
                                        <input type="date" required className="w-full border-b border-gray-100 py-3 outline-none text-sm focus:border-carapita-gold transition-colors" value={novaTarifa.data_inicio} onChange={e => setNovaTarifa({ ...novaTarifa, data_inicio: e.target.value })} />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[9px] uppercase tracking-widest text-carapita-muted font-bold">Até</label>
                                        <input type="date" required className="w-full border-b border-gray-100 py-3 outline-none text-sm focus:border-carapita-gold transition-colors" value={novaTarifa.data_fim} onChange={e => setNovaTarifa({ ...novaTarifa, data_fim: e.target.value })} />
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[9px] uppercase tracking-widest text-carapita-muted font-bold">Novo Preço / Noite (€)</label>
                                    <div className="flex items-center gap-2 border-b border-gray-100 focus-within:border-carapita-gold transition-colors">
                                        <span className="text-carapita-gold text-lg font-serif">€</span>
                                        <input type="number" required className="w-full py-3 outline-none text-sm bg-transparent" value={novaTarifa.preco_noite} onChange={e => setNovaTarifa({ ...novaTarifa, preco_noite: parseFloat(e.target.value) })} />
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[9px] uppercase tracking-widest text-carapita-muted font-bold">Identificador</label>
                                    <input className="w-full border-b border-gray-100 py-3 outline-none text-sm focus:border-carapita-gold transition-colors" value={novaTarifa.motivo} onChange={e => setNovaTarifa({ ...novaTarifa, motivo: e.target.value })} placeholder="Ex: Verão 2024" />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-[9px] uppercase tracking-widest text-carapita-muted font-bold">Política Can.</label>
                                        <select required className="w-full border-b border-gray-100 py-3 outline-none text-sm focus:border-carapita-gold transition-colors bg-transparent" value={novaTarifa.politica_cancelamento} onChange={e => setNovaTarifa({ ...novaTarifa, politica_cancelamento: e.target.value })}>
                                            <option value="FLEXIVEL">Flexível</option>
                                            <option value="MODERADA">Moderada</option>
                                            <option value="LIMITADA">Limitada</option>
                                            <option value="RIGOROSA">Rigorosa</option>
                                        </select>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[9px] uppercase tracking-widest text-carapita-muted font-bold">Mín. Noites</label>
                                        <input type="number" min="1" className="w-full border-b border-gray-100 py-3 outline-none text-sm focus:border-carapita-gold transition-colors" value={novaTarifa.minima_estadia} onChange={e => setNovaTarifa({ ...novaTarifa, minima_estadia: parseInt(e.target.value) })} />
                                    </div>
                                </div>
                                <button className="w-full bg-carapita-dark text-white py-4 text-[10px] uppercase tracking-mega hover:bg-carapita-gold transition-all duration-500 shadow-xl shadow-carapita-dark/10">
                                    Aplicar Tarifa Especial
                                </button>
                            </form>
                        </div>

                        {/* Lista Tarifas */}
                        <div className="space-y-6">
                            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                                <h2 className="font-serif text-xl text-carapita-dark">Tarifas Ativas</h2>
                                <span className="text-[10px] uppercase tracking-widest text-carapita-muted">{tarifas.length} Regras</span>
                            </div>
                            {tarifas.length === 0 ? (
                                <div className="bg-white p-12 text-center border border-gray-100 shadow-sm opacity-60">
                                    <p className="text-carapita-muted uppercase tracking-widest text-[10px]">Sem variações de preço configuradas.</p>
                                </div>
                            ) : (
                                tarifas.map((t) => (
                                    <div key={t.id} className="bg-white border border-gray-100 p-6 flex items-center gap-6 hover:shadow-xl transition-all duration-500 group">
                                        <div className="w-10 h-10 rounded-full bg-carapita-gold/10 flex items-center justify-center text-carapita-gold group-hover:bg-carapita-gold group-hover:text-white transition-all duration-500 shrink-0 shadow-sm">
                                            <TrendingUp size={16} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <h3 className="font-serif text-lg text-carapita-dark truncate">{(t.quarto || (t as any).Quarto)?.nome || 'Todos os Quartos'}</h3>
                                                <span className="text-[8px] uppercase tracking-widest font-bold bg-carapita-gold/10 text-carapita-gold px-1.5 py-0.5 rounded shadow-sm">{t.motivo}</span>
                                            </div>
                                            <div className="flex items-center gap-1.5 text-carapita-muted flex-wrap">
                                                <Calendar size={10} className="text-carapita-gold/60" />
                                                <span className="text-[10px] font-medium">{new Date(t.data_inicio).toLocaleDateString('pt-PT')}</span>
                                                <span className="text-[8px] text-gray-300">até</span>
                                                <span className="text-[10px] font-medium">{new Date(t.data_fim).toLocaleDateString('pt-PT')}</span>
                                                <span className="text-[8px] text-gray-300">|</span>
                                                <span className="text-[9px] font-bold text-carapita-gold">{t.politica_cancelamento || 'FLEXÍVEL'}</span>
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-end shrink-0">
                                            <span className="text-[8px] uppercase tracking-widest text-carapita-muted font-bold mb-1">Valor</span>
                                            <div className="flex items-baseline gap-1">
                                                <span className="text-xs font-serif text-carapita-gold">€</span>
                                                <span className="text-2xl font-serif text-carapita-dark">{Number(t.preco_noite).toFixed(0)}</span>
                                            </div>
                                        </div>
                                        <button onClick={() => handleDeletarTarifa(t.id)} className="w-8 h-8 border border-gray-50 flex items-center justify-center text-gray-300 hover:text-red-500 hover:bg-red-50 transition-all duration-300 ml-2 shrink-0">
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* COLUNA DIREITA: BLOQUEIOS */}
                    <div className="space-y-12">
                        {/* Formulário Bloqueios */}
                        <div className="bg-white border border-gray-100 p-8 shadow-xl hover:shadow-2xl transition-all duration-500 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-24 h-24 -mr-12 -mt-12 bg-gray-50 rounded-full flex items-end justify-start pl-6 pb-6">
                                <ShieldAlert size={24} className="text-gray-200" />
                            </div>
                            <div className="flex items-center gap-3 mb-8 relative">
                                <Lock size={18} className="text-carapita-gold" />
                                <h2 className="font-serif text-xl text-carapita-dark">Novo Bloqueio</h2>
                            </div>
                            <form onSubmit={handleSalvarBloqueio} className="space-y-6 relative">
                                <div className="space-y-1">
                                    <label className="text-[9px] uppercase tracking-widest text-carapita-muted font-bold">Alojamento</label>
                                    <select required className="w-full border-b border-gray-100 py-3 outline-none text-sm focus:border-carapita-gold transition-colors bg-transparent capitalize" value={novoBloqueio.quarto_id} onChange={e => setNovoBloqueio({ ...novoBloqueio, quarto_id: e.target.value })}>
                                        <option value="">Selecione um Quarto</option>
                                        {quartos.map(q => <option key={q.id} value={q.id}>{q.nome}</option>)}
                                    </select>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-[9px] uppercase tracking-widest text-carapita-muted font-bold">Desde (Inclusive)</label>
                                        <input type="date" required className="w-full border-b border-gray-100 py-3 outline-none text-sm focus:border-carapita-gold transition-colors" value={novoBloqueio.data_inicio} onChange={e => setNovoBloqueio({ ...novoBloqueio, data_inicio: e.target.value })} />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[9px] uppercase tracking-widest text-carapita-muted font-bold">Até (Inclusive)</label>
                                        <input type="date" required className="w-full border-b border-gray-100 py-3 outline-none text-sm focus:border-carapita-gold transition-colors" value={novoBloqueio.data_fim} onChange={e => setNovoBloqueio({ ...novoBloqueio, data_fim: e.target.value })} />
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[9px] uppercase tracking-widest text-carapita-muted font-bold">Motivo do Bloqueio</label>
                                    <textarea className="w-full border border-gray-100 p-4 outline-none text-sm focus:border-carapita-gold transition-colors bg-gray-50/30" rows={2} value={novoBloqueio.motivo} onChange={e => setNovoBloqueio({ ...novoBloqueio, motivo: e.target.value })} placeholder="Ex: Manutenção..." />
                                </div>
                                <button className="w-full bg-carapita-dark text-white py-4 text-[10px] uppercase tracking-mega hover:bg-carapita-gold transition-all duration-500 shadow-xl shadow-carapita-dark/10">
                                    Gravar Bloqueio
                                </button>
                            </form>
                        </div>

                        {/* Lista Bloqueios */}
                        <div className="space-y-6">
                            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                                <h2 className="font-serif text-xl text-carapita-dark">Agenda Bloqueada</h2>
                                <span className="text-[10px] uppercase tracking-widest text-carapita-muted">{bloqueios.length} Interrupções</span>
                            </div>
                            {bloqueios.length === 0 ? (
                                <div className="bg-white p-12 text-center border border-gray-100 shadow-sm opacity-60">
                                    <p className="text-carapita-muted uppercase tracking-widest text-[10px]">Toda a agenda está disponível.</p>
                                </div>
                            ) : (
                                bloqueios.map((b) => (
                                    <div key={b.id} className="bg-white border border-gray-100 p-6 flex items-center gap-6 hover:shadow-xl transition-all duration-500 group">
                                        <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 group-hover:bg-carapita-dark group-hover:text-white transition-all duration-500 shrink-0 shadow-sm">
                                            <Moon size={16} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <h3 className="font-serif text-lg text-carapita-dark truncate capitalize">{b.quarto?.nome || 'Quarto não encontrado'}</h3>
                                                <span className="text-[8px] text-red-500 font-medium border border-red-100 px-1.5 py-0.5 rounded uppercase tracking-widest">BLOQUEADO</span>
                                            </div>
                                            <p className="text-[10px] text-carapita-muted mb-2 font-light italic truncate">"{b.motivo || 'Sem motivo'}"</p>
                                            <div className="flex items-center gap-1.5 text-carapita-muted flex-wrap">
                                                <Calendar size={10} className="text-carapita-gold/60" />
                                                <span className="text-[10px] font-medium">{new Date(b.data_inicio).toLocaleDateString('pt-PT')}</span>
                                                <span className="text-[8px] text-gray-300">até</span>
                                                <span className="text-[10px] font-medium">{new Date(b.data_fim).toLocaleDateString('pt-PT')}</span>
                                            </div>
                                        </div>
                                        <button onClick={() => handleDeletarBloqueio(b.id)} className="w-8 h-8 border border-gray-50 flex items-center justify-center text-gray-300 hover:text-red-500 hover:bg-red-50 transition-all duration-300 shrink-0 ml-2">
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}

