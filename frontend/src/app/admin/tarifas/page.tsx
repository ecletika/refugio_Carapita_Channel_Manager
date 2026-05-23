"use client";
import React, { useState, useEffect } from 'react';
import {
    TrendingUp, Plus, Trash2, Calendar, Euro, Lock, Moon,
    Edit2, CheckCircle2, AlertCircle, X, ShieldOff, Tag
} from 'lucide-react';
import AdminSidebar from '@/components/AdminSidebar';

const EDGE_URL = 'https://vuidkeygtxfbgxvmilya.supabase.co/functions/v1';

interface Quarto { id: string; nome: string; preco_base: number; }
interface TarifaSazonal {
    id: string; quarto_id: string;
    quarto?: { nome: string }; Quarto?: { nome: string };
    data_inicio: string; data_fim: string;
    preco_noite: number; motivo: string;
    politica_cancelamento: string; minima_estadia: number;
}
interface Bloqueio {
    id: string; quarto_id: string;
    quarto?: { nome: string }; Quarto?: { nome: string };
    data_inicio: string; data_fim: string; motivo: string;
}

type Tab = 'tarifas' | 'bloqueios';

export default function AdminTarifasBloqueios() {
    const [tab, setTab] = useState<Tab>('tarifas');
    const [quartos, setQuartos] = useState<Quarto[]>([]);
    const [tarifas, setTarifas] = useState<TarifaSazonal[]>([]);
    const [bloqueios, setBloqueios] = useState<Bloqueio[]>([]);
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState<{ tipo: 'ok' | 'err'; msg: string } | null>(null);

    const [novaTarifa, setNovaTarifa] = useState({
        quarto_id: '', data_inicio: '', data_fim: '',
        preco_noite: 0, motivo: '', politica_cancelamento: 'FLEXIVEL', minima_estadia: 2
    });
    const [editandoTarifaId, setEditandoTarifaId] = useState<string | null>(null);
    const [savingTarifa, setSavingTarifa] = useState(false);

    const [novoBloqueio, setNovoBloqueio] = useState({
        quarto_id: '', data_inicio: '', data_fim: '', motivo: ''
    });
    const [savingBloqueio, setSavingBloqueio] = useState(false);

    const showToast = (tipo: 'ok' | 'err', msg: string) => {
        setToast({ tipo, msg });
        setTimeout(() => setToast(null), 3500);
    };

    const fetchData = async () => {
        const token = localStorage.getItem('token');
        const headers = { 'Authorization': `Bearer ${token}` };
        try {
            const [tRes, qRes, bRes] = await Promise.all([
                fetch(`${EDGE_URL}/admin-tarifas`,  { headers }),
                fetch(`${EDGE_URL}/admin-quartos`,  { headers }),   // ← FIX: auth adicionado
                fetch(`${EDGE_URL}/admin-bloqueios`, { headers }),
            ]);
            const [tData, qData, bData] = await Promise.all([tRes.json(), qRes.json(), bRes.json()]);
            if (tData.status === 'success') setTarifas(tData.data || []);
            if (qData.status === 'success') setQuartos(qData.data || []);
            if (bData.status === 'success') setBloqueios(bData.data || []);
        } catch (e) {
            console.error('fetchData error', e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    // ── Tarifas ─────────────────────────────────────────────────────────────
    const handleSalvarTarifa = async (e: React.FormEvent) => {
        e.preventDefault();
        setSavingTarifa(true);
        const token = localStorage.getItem('token');
        try {
            const payload = editandoTarifaId ? { ...novaTarifa, id: editandoTarifaId } : novaTarifa;
            const resp = await fetch(`${EDGE_URL}/admin-tarifas`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(payload),
            });
            if (resp.ok) {
                resetTarifaForm();
                await fetchData();
                showToast('ok', editandoTarifaId ? 'Tarifa atualizada com sucesso.' : 'Tarifa criada com sucesso.');
            } else {
                const err = await resp.json();
                showToast('err', err.error || 'Erro ao guardar tarifa.');
            }
        } catch {
            showToast('err', 'Erro de comunicação.');
        } finally {
            setSavingTarifa(false);
        }
    };

    const handleEditarTarifa = (t: TarifaSazonal) => {
        setEditandoTarifaId(t.id);
        setNovaTarifa({
            quarto_id: t.quarto_id,
            data_inicio: t.data_inicio.split('T')[0],
            data_fim: t.data_fim.split('T')[0],
            preco_noite: t.preco_noite,
            motivo: t.motivo || '',
            politica_cancelamento: t.politica_cancelamento || 'FLEXIVEL',
            minima_estadia: t.minima_estadia || 2,
        });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDeletarTarifa = async (id: string) => {
        const token = localStorage.getItem('token');
        try {
            const resp = await fetch(`${EDGE_URL}/admin-tarifas/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` },
            });
            if (resp.ok) { await fetchData(); showToast('ok', 'Tarifa removida.'); }
            else showToast('err', 'Erro ao remover tarifa.');
        } catch { showToast('err', 'Erro de comunicação.'); }
    };

    const resetTarifaForm = () => {
        setEditandoTarifaId(null);
        setNovaTarifa({ quarto_id: '', data_inicio: '', data_fim: '', preco_noite: 0, motivo: '', politica_cancelamento: 'FLEXIVEL', minima_estadia: 2 });
    };

    // ── Bloqueios ────────────────────────────────────────────────────────────
    const handleSalvarBloqueio = async (e: React.FormEvent) => {
        e.preventDefault();
        setSavingBloqueio(true);
        const token = localStorage.getItem('token');
        try {
            const resp = await fetch(`${EDGE_URL}/admin-bloqueios`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(novoBloqueio),
            });
            if (resp.ok) {
                setNovoBloqueio({ quarto_id: '', data_inicio: '', data_fim: '', motivo: '' });
                await fetchData();
                showToast('ok', 'Bloqueio gravado com sucesso.');
            } else {
                const err = await resp.json();
                showToast('err', err.error || 'Erro ao gravar bloqueio.');
            }
        } catch { showToast('err', 'Erro de comunicação.'); }
        finally { setSavingBloqueio(false); }
    };

    const handleDeletarBloqueio = async (id: string) => {
        const token = localStorage.getItem('token');
        try {
            const resp = await fetch(`${EDGE_URL}/admin-bloqueios/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` },
            });
            if (resp.ok) { await fetchData(); showToast('ok', 'Bloqueio removido.'); }
            else showToast('err', 'Erro ao remover bloqueio.');
        } catch { showToast('err', 'Erro de comunicação.'); }
    };

    const nomeQuarto = (item: TarifaSazonal | Bloqueio) =>
        (item.quarto || (item as any).Quarto)?.nome || '—';

    const fmtDate = (d: string) =>
        new Date(d + 'T00:00:00').toLocaleDateString('pt-PT', { day: '2-digit', month: 'short', year: 'numeric' });

    const politicaLabel: Record<string, string> = {
        FLEXIVEL: 'Flexível', MODERADA: 'Moderada',
        LIMITADA: 'Limitada', RIGOROSA: 'Rigorosa',
    };

    if (loading) return (
        <div className="min-h-screen bg-[#F9F8F6] flex items-center justify-center">
            <div className="text-center">
                <div className="w-8 h-8 border-2 border-[#C4A484] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="text-[10px] uppercase tracking-widest text-gray-400">A carregar...</p>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#F9F8F6]">
            <AdminSidebar />

            {/* Toast */}
            {toast && (
                <div className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-4 shadow-lg text-sm max-w-sm
                    ${toast.tipo === 'ok' ? 'bg-[#1E3932] text-white' : 'bg-red-600 text-white'}`}>
                    {toast.tipo === 'ok'
                        ? <CheckCircle2 size={15} className="text-[#C4A484] shrink-0" />
                        : <AlertCircle size={15} className="shrink-0" />}
                    <span className="text-[12px]">{toast.msg}</span>
                </div>
            )}

            <div className="ml-20 p-8 xl:p-12 max-w-[1400px] mx-auto">

                {/* Header */}
                <div className="mb-10">
                    <span className="text-[#C4A484] text-[10px] uppercase tracking-widest font-bold block mb-1">
                        Estratégia &amp; Disponibilidade
                    </span>
                    <h1 className="text-4xl font-serif text-[#1E3932]">Tarifas e Bloqueios</h1>
                    <p className="text-xs text-gray-400 mt-1.5 font-light">
                        Defina preços sazonais e bloqueie datas na agenda de cada alojamento.
                    </p>
                </div>

                {/* Tabs */}
                <div className="flex gap-0 mb-10 border border-gray-200 w-fit">
                    <button
                        onClick={() => setTab('tarifas')}
                        className={`flex items-center gap-2 px-8 py-3.5 text-[10px] uppercase tracking-widest font-bold transition-all duration-200 cursor-pointer
                            ${tab === 'tarifas' ? 'bg-[#1E3932] text-[#C4A484]' : 'bg-white text-gray-400 hover:text-[#1E3932]'}`}>
                        <TrendingUp size={13} /> Tarifas Sazonais
                        <span className={`ml-1 text-[9px] px-1.5 py-0.5 rounded-sm font-mono
                            ${tab === 'tarifas' ? 'bg-[#C4A484]/20 text-[#C4A484]' : 'bg-gray-100 text-gray-400'}`}>
                            {tarifas.length}
                        </span>
                    </button>
                    <button
                        onClick={() => setTab('bloqueios')}
                        className={`flex items-center gap-2 px-8 py-3.5 text-[10px] uppercase tracking-widest font-bold transition-all duration-200 border-l border-gray-200 cursor-pointer
                            ${tab === 'bloqueios' ? 'bg-[#1E3932] text-[#C4A484]' : 'bg-white text-gray-400 hover:text-[#1E3932]'}`}>
                        <Lock size={13} /> Bloqueios
                        <span className={`ml-1 text-[9px] px-1.5 py-0.5 rounded-sm font-mono
                            ${tab === 'bloqueios' ? 'bg-[#C4A484]/20 text-[#C4A484]' : 'bg-gray-100 text-gray-400'}`}>
                            {bloqueios.length}
                        </span>
                    </button>
                </div>

                {/* ═══ TAB TARIFAS ═══ */}
                {tab === 'tarifas' && (
                    <div className="grid grid-cols-1 xl:grid-cols-[440px_1fr] gap-8 items-start">

                        {/* Formulário */}
                        <div className="bg-white border border-gray-100 shadow-sm">
                            <div className={`px-7 py-5 border-b flex items-center justify-between
                                ${editandoTarifaId ? 'bg-amber-50 border-amber-100' : 'border-gray-50'}`}>
                                <div className="flex items-center gap-2.5">
                                    <div className={`w-7 h-7 flex items-center justify-center
                                        ${editandoTarifaId ? 'bg-amber-100' : 'bg-[#1E3932]'}`}>
                                        {editandoTarifaId
                                            ? <Edit2 size={13} className="text-amber-600" />
                                            : <Plus size={13} className="text-[#C4A484]" />}
                                    </div>
                                    <h2 className="font-serif text-lg text-[#1E3932]">
                                        {editandoTarifaId ? 'Editar Época Especial' : 'Nova Época Especial'}
                                    </h2>
                                </div>
                                {editandoTarifaId && (
                                    <button onClick={resetTarifaForm}
                                        className="text-[9px] uppercase tracking-widest text-gray-400 hover:text-red-500 transition-colors flex items-center gap-1 cursor-pointer">
                                        <X size={11} /> Cancelar
                                    </button>
                                )}
                            </div>

                            <form onSubmit={handleSalvarTarifa} className="p-7 space-y-6">
                                {/* Alojamento */}
                                <div>
                                    <label className="text-[10px] uppercase tracking-widest text-gray-400 font-bold block mb-2">
                                        Alojamento *
                                    </label>
                                    <select
                                        required
                                        value={novaTarifa.quarto_id}
                                        onChange={e => setNovaTarifa({ ...novaTarifa, quarto_id: e.target.value })}
                                        className="w-full border-b border-gray-200 py-3 outline-none text-sm focus:border-[#C4A484] transition-colors bg-transparent text-[#1E3932] cursor-pointer">
                                        <option value="">— Selecionar alojamento —</option>
                                        {quartos.map(q => (
                                            <option key={q.id} value={q.id}>
                                                {q.nome} (base: €{Number(q.preco_base).toFixed(0)}/noite)
                                            </option>
                                        ))}
                                    </select>
                                    {quartos.length === 0 && (
                                        <p className="text-[10px] text-amber-500 mt-1 flex items-center gap-1">
                                            <AlertCircle size={10} /> A carregar alojamentos...
                                        </p>
                                    )}
                                </div>

                                {/* Datas */}
                                <div className="grid grid-cols-2 gap-5">
                                    <div>
                                        <label className="text-[10px] uppercase tracking-widest text-gray-400 font-bold block mb-2">Desde *</label>
                                        <input type="date" required
                                            value={novaTarifa.data_inicio}
                                            onChange={e => setNovaTarifa({ ...novaTarifa, data_inicio: e.target.value })}
                                            className="w-full border-b border-gray-200 py-3 outline-none text-sm focus:border-[#C4A484] transition-colors" />
                                    </div>
                                    <div>
                                        <label className="text-[10px] uppercase tracking-widest text-gray-400 font-bold block mb-2">Até *</label>
                                        <input type="date" required
                                            value={novaTarifa.data_fim}
                                            onChange={e => setNovaTarifa({ ...novaTarifa, data_fim: e.target.value })}
                                            className="w-full border-b border-gray-200 py-3 outline-none text-sm focus:border-[#C4A484] transition-colors" />
                                    </div>
                                </div>

                                {/* Preço */}
                                <div>
                                    <label className="text-[10px] uppercase tracking-widest text-gray-400 font-bold block mb-2">Preço / Noite (€) *</label>
                                    <div className="flex items-center gap-3 border-b border-gray-200 focus-within:border-[#C4A484] transition-colors">
                                        <Euro size={14} className="text-[#C4A484] shrink-0" />
                                        <input type="number" required min="0" step="0.01"
                                            value={novaTarifa.preco_noite || ''}
                                            onChange={e => setNovaTarifa({ ...novaTarifa, preco_noite: parseFloat(e.target.value) || 0 })}
                                            className="w-full py-3 outline-none text-sm bg-transparent text-[#1E3932]"
                                            placeholder="0.00" />
                                    </div>
                                </div>

                                {/* Identificador */}
                                <div>
                                    <label className="text-[10px] uppercase tracking-widest text-gray-400 font-bold block mb-2">Identificador</label>
                                    <div className="flex items-center gap-3 border-b border-gray-200 focus-within:border-[#C4A484] transition-colors">
                                        <Tag size={13} className="text-gray-300 shrink-0" />
                                        <input
                                            value={novaTarifa.motivo}
                                            onChange={e => setNovaTarifa({ ...novaTarifa, motivo: e.target.value })}
                                            className="w-full py-3 outline-none text-sm bg-transparent text-[#1E3932] placeholder-gray-300"
                                            placeholder="Ex: Verão 2025, Semana Santa..." />
                                    </div>
                                </div>

                                {/* Política + Mín noites */}
                                <div className="grid grid-cols-2 gap-5">
                                    <div>
                                        <label className="text-[10px] uppercase tracking-widest text-gray-400 font-bold block mb-2">Política Cancel.</label>
                                        <select
                                            value={novaTarifa.politica_cancelamento}
                                            onChange={e => setNovaTarifa({ ...novaTarifa, politica_cancelamento: e.target.value })}
                                            className="w-full border-b border-gray-200 py-3 outline-none text-sm focus:border-[#C4A484] transition-colors bg-transparent text-[#1E3932] cursor-pointer">
                                            <option value="FLEXIVEL">Flexível</option>
                                            <option value="MODERADA">Moderada</option>
                                            <option value="LIMITADA">Limitada</option>
                                            <option value="RIGOROSA">Rigorosa</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-[10px] uppercase tracking-widest text-gray-400 font-bold block mb-2">Mín. Noites</label>
                                        <div className="flex items-center gap-3 border-b border-gray-200 focus-within:border-[#C4A484] transition-colors">
                                            <Moon size={13} className="text-gray-300 shrink-0" />
                                            <input type="number" min="1"
                                                value={novaTarifa.minima_estadia}
                                                onChange={e => setNovaTarifa({ ...novaTarifa, minima_estadia: parseInt(e.target.value) || 1 })}
                                                className="w-full py-3 outline-none text-sm bg-transparent text-[#1E3932]" />
                                        </div>
                                    </div>
                                </div>

                                <button disabled={savingTarifa}
                                    className={`w-full py-4 text-[10px] uppercase tracking-widest font-bold transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer
                                        ${editandoTarifaId
                                            ? 'bg-amber-600 text-white hover:bg-amber-700'
                                            : 'bg-[#1E3932] text-[#C4A484] hover:bg-[#C4A484] hover:text-white'}
                                        disabled:opacity-50 disabled:cursor-not-allowed`}>
                                    {savingTarifa
                                        ? <><span className="w-3 h-3 border-2 border-current/30 border-t-current rounded-full animate-spin" /> A guardar...</>
                                        : editandoTarifaId
                                            ? <><Edit2 size={13} /> Guardar Alterações</>
                                            : <><Plus size={13} /> Aplicar Tarifa Especial</>}
                                </button>
                            </form>
                        </div>

                        {/* Lista Tarifas */}
                        <div>
                            <div className="flex items-center justify-between mb-5 pb-4 border-b border-gray-100">
                                <h2 className="font-serif text-xl text-[#1E3932]">Tarifas Ativas</h2>
                                <span className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">
                                    {tarifas.length} {tarifas.length === 1 ? 'regra' : 'regras'}
                                </span>
                            </div>

                            {tarifas.length === 0 ? (
                                <div className="bg-white border border-dashed border-gray-200 py-14 text-center">
                                    <TrendingUp size={28} className="text-gray-200 mx-auto mb-3" />
                                    <p className="text-[10px] uppercase tracking-widest text-gray-300">
                                        Sem variações de preço configuradas.
                                    </p>
                                    <p className="text-[10px] text-gray-300 mt-1">
                                        Use o formulário ao lado para criar a primeira época especial.
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {tarifas.map(t => (
                                        <div key={t.id}
                                            className="bg-white border border-gray-100 hover:border-[#C4A484]/30 transition-all duration-200 group">
                                            <div className="flex items-stretch">
                                                {/* Preço barra lateral */}
                                                <div className="w-1 bg-[#C4A484]/30 group-hover:bg-[#C4A484] transition-colors shrink-0" />

                                                <div className="flex items-center gap-5 px-5 py-4 flex-1 min-w-0">
                                                    {/* Info */}
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                                                            <span className="font-serif text-base text-[#1E3932] truncate">
                                                                {nomeQuarto(t)}
                                                            </span>
                                                            {t.motivo && (
                                                                <span className="text-[9px] uppercase tracking-widest bg-[#1E3932]/5 text-[#1E3932] px-2 py-0.5 font-bold shrink-0">
                                                                    {t.motivo}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="flex items-center gap-2 text-gray-400 flex-wrap">
                                                            <Calendar size={10} className="text-[#C4A484]" />
                                                            <span className="text-[10px]">{fmtDate(t.data_inicio)}</span>
                                                            <span className="text-gray-200 text-[10px]">→</span>
                                                            <span className="text-[10px]">{fmtDate(t.data_fim)}</span>
                                                            <span className="text-gray-200">·</span>
                                                            <span className="text-[10px] text-[#C4A484] font-bold">
                                                                {politicaLabel[t.politica_cancelamento] || t.politica_cancelamento}
                                                            </span>
                                                            <span className="text-gray-200">·</span>
                                                            <Moon size={9} className="text-gray-300" />
                                                            <span className="text-[10px] text-gray-400">mín {t.minima_estadia}n</span>
                                                        </div>
                                                    </div>

                                                    {/* Preço */}
                                                    <div className="shrink-0 text-right pr-2">
                                                        <span className="text-[9px] uppercase tracking-widest text-gray-300 block mb-0.5">/ noite</span>
                                                        <div className="flex items-baseline gap-0.5">
                                                            <span className="text-sm text-[#C4A484] font-serif">€</span>
                                                            <span className="text-2xl font-serif text-[#1E3932] leading-none">
                                                                {Number(t.preco_noite).toFixed(0)}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    {/* Ações */}
                                                    <div className="flex gap-1.5 shrink-0">
                                                        <button onClick={() => handleEditarTarifa(t)}
                                                            className="w-8 h-8 flex items-center justify-center border border-gray-100 text-gray-300 hover:text-amber-500 hover:border-amber-200 transition-all duration-200 cursor-pointer">
                                                            <Edit2 size={13} />
                                                        </button>
                                                        <button onClick={() => handleDeletarTarifa(t.id)}
                                                            className="w-8 h-8 flex items-center justify-center border border-gray-100 text-gray-300 hover:text-red-500 hover:border-red-100 transition-all duration-200 cursor-pointer">
                                                            <Trash2 size={13} />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* ═══ TAB BLOQUEIOS ═══ */}
                {tab === 'bloqueios' && (
                    <div className="grid grid-cols-1 xl:grid-cols-[440px_1fr] gap-8 items-start">

                        {/* Formulário Bloqueio */}
                        <div className="bg-white border border-gray-100 shadow-sm">
                            <div className="px-7 py-5 border-b border-gray-50 flex items-center gap-2.5">
                                <div className="w-7 h-7 bg-[#1E3932] flex items-center justify-center">
                                    <Lock size={13} className="text-[#C4A484]" />
                                </div>
                                <h2 className="font-serif text-lg text-[#1E3932]">Novo Bloqueio</h2>
                            </div>

                            <form onSubmit={handleSalvarBloqueio} className="p-7 space-y-6">
                                {/* Alojamento */}
                                <div>
                                    <label className="text-[10px] uppercase tracking-widest text-gray-400 font-bold block mb-2">
                                        Alojamento *
                                    </label>
                                    <select
                                        required
                                        value={novoBloqueio.quarto_id}
                                        onChange={e => setNovoBloqueio({ ...novoBloqueio, quarto_id: e.target.value })}
                                        className="w-full border-b border-gray-200 py-3 outline-none text-sm focus:border-[#C4A484] transition-colors bg-transparent text-[#1E3932] cursor-pointer">
                                        <option value="">— Selecionar alojamento —</option>
                                        {quartos.map(q => (
                                            <option key={q.id} value={q.id}>{q.nome}</option>
                                        ))}
                                    </select>
                                    {quartos.length === 0 && (
                                        <p className="text-[10px] text-amber-500 mt-1 flex items-center gap-1">
                                            <AlertCircle size={10} /> A carregar alojamentos...
                                        </p>
                                    )}
                                </div>

                                {/* Datas */}
                                <div className="grid grid-cols-2 gap-5">
                                    <div>
                                        <label className="text-[10px] uppercase tracking-widest text-gray-400 font-bold block mb-2">Desde *</label>
                                        <input type="date" required
                                            value={novoBloqueio.data_inicio}
                                            onChange={e => setNovoBloqueio({ ...novoBloqueio, data_inicio: e.target.value })}
                                            className="w-full border-b border-gray-200 py-3 outline-none text-sm focus:border-[#C4A484] transition-colors" />
                                    </div>
                                    <div>
                                        <label className="text-[10px] uppercase tracking-widest text-gray-400 font-bold block mb-2">Até *</label>
                                        <input type="date" required
                                            value={novoBloqueio.data_fim}
                                            onChange={e => setNovoBloqueio({ ...novoBloqueio, data_fim: e.target.value })}
                                            className="w-full border-b border-gray-200 py-3 outline-none text-sm focus:border-[#C4A484] transition-colors" />
                                    </div>
                                </div>

                                {/* Motivo */}
                                <div>
                                    <label className="text-[10px] uppercase tracking-widest text-gray-400 font-bold block mb-2">Motivo</label>
                                    <textarea rows={2}
                                        value={novoBloqueio.motivo}
                                        onChange={e => setNovoBloqueio({ ...novoBloqueio, motivo: e.target.value })}
                                        className="w-full border border-gray-100 bg-[#FAF8F4] p-4 text-sm outline-none focus:border-[#C4A484] transition-colors resize-none text-[#1E3932] placeholder-gray-300"
                                        placeholder="Ex: Manutenção, uso pessoal, obras..." />
                                </div>

                                <button disabled={savingBloqueio}
                                    className="w-full bg-[#1E3932] text-[#C4A484] py-4 text-[10px] uppercase tracking-widest font-bold hover:bg-[#C4A484] hover:text-white transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer">
                                    {savingBloqueio
                                        ? <><span className="w-3 h-3 border-2 border-current/30 border-t-current rounded-full animate-spin" /> A guardar...</>
                                        : <><Lock size={13} /> Gravar Bloqueio</>}
                                </button>
                            </form>
                        </div>

                        {/* Lista Bloqueios */}
                        <div>
                            <div className="flex items-center justify-between mb-5 pb-4 border-b border-gray-100">
                                <h2 className="font-serif text-xl text-[#1E3932]">Agenda Bloqueada</h2>
                                <span className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">
                                    {bloqueios.length} {bloqueios.length === 1 ? 'período' : 'períodos'}
                                </span>
                            </div>

                            {bloqueios.length === 0 ? (
                                <div className="bg-white border border-dashed border-gray-200 py-14 text-center">
                                    <ShieldOff size={28} className="text-gray-200 mx-auto mb-3" />
                                    <p className="text-[10px] uppercase tracking-widest text-gray-300">Toda a agenda está disponível.</p>
                                    <p className="text-[10px] text-gray-300 mt-1">
                                        Use o formulário ao lado para bloquear datas.
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {bloqueios.map(b => (
                                        <div key={b.id}
                                            className="bg-white border border-gray-100 hover:border-red-100 transition-all duration-200 group">
                                            <div className="flex items-stretch">
                                                {/* Barra lateral */}
                                                <div className="w-1 bg-gray-200 group-hover:bg-red-300 transition-colors shrink-0" />

                                                <div className="flex items-center gap-5 px-5 py-4 flex-1 min-w-0">
                                                    {/* Ícone */}
                                                    <div className="w-9 h-9 bg-gray-100 group-hover:bg-red-50 flex items-center justify-center transition-colors shrink-0">
                                                        <Moon size={15} className="text-gray-400 group-hover:text-red-400 transition-colors" />
                                                    </div>

                                                    {/* Info */}
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                                                            <span className="font-serif text-base text-[#1E3932] truncate">
                                                                {nomeQuarto(b)}
                                                            </span>
                                                            <span className="text-[9px] uppercase tracking-widest text-red-500 border border-red-100 bg-red-50 px-2 py-0.5 font-bold shrink-0">
                                                                Bloqueado
                                                            </span>
                                                        </div>
                                                        {b.motivo && (
                                                            <p className="text-[10px] text-gray-400 italic mb-1.5 truncate">"{b.motivo}"</p>
                                                        )}
                                                        <div className="flex items-center gap-2 text-gray-400">
                                                            <Calendar size={10} className="text-[#C4A484]" />
                                                            <span className="text-[10px]">{fmtDate(b.data_inicio)}</span>
                                                            <span className="text-gray-200 text-[10px]">→</span>
                                                            <span className="text-[10px]">{fmtDate(b.data_fim)}</span>
                                                        </div>
                                                    </div>

                                                    {/* Remover */}
                                                    <button onClick={() => handleDeletarBloqueio(b.id)}
                                                        className="w-8 h-8 flex items-center justify-center border border-gray-100 text-gray-300 hover:text-red-500 hover:border-red-100 transition-all duration-200 shrink-0 cursor-pointer"
                                                        title="Remover bloqueio">
                                                        <Trash2 size={13} />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
}
