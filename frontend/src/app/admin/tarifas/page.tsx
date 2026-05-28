"use client";
import React, { useState, useEffect } from 'react';
import {
    TrendingUp, Plus, Trash2, Calendar, Euro, Lock, Moon,
    Edit2, CheckCircle2, AlertCircle, X, ShieldOff, Tag, Percent
} from 'lucide-react';
import AdminSidebar from '@/components/AdminSidebar';

const EDGE_URL = 'https://vuidkeygtxfbgxvmilya.supabase.co/functions/v1';

interface Quarto {
    id: string;
    nome: string;
    preco_base: number;
    tarifa_semana?: number;
    tarifa_fds?: number;
}
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

/* ── Helpers ──────────────────────────────────────────────────── */

/** Devolve true se o dia da semana é Sexta(5), Sábado(6) ou Domingo(0) */
function isFimDeSemana(dateStr: string): boolean {
    if (!dateStr) return false;
    const dow = new Date(dateStr + 'T12:00:00').getDay(); // noon evita DST edge-case
    return dow === 0 || dow === 5 || dow === 6;
}

/** Devolve a tarifa base a usar para o par (quartoId, dataInicio) */
function getBaseRate(quartos: Quarto[], quartoId: string, dataInicio: string): number {
    const q = quartos.find(x => x.id === quartoId);
    if (!q) return 0;
    const fds = isFimDeSemana(dataInicio);
    if (fds) return Number(q.tarifa_fds  ?? q.preco_base) || 0;
    return          Number(q.tarifa_semana ?? q.preco_base) || 0;
}

/** € → % (2 casas decimais, sem loop) */
function euroToPercent(euro: number, base: number): number {
    if (!base) return 0;
    return Math.round((euro / base) * 10000) / 100;
}

/** % → € (2 casas decimais, sem loop) */
function percentToEuro(pct: number, base: number): number {
    return Math.round((pct / 100) * base * 100) / 100;
}

/* ─────────────────────────────────────────────────────────────── */

export default function AdminTarifasBloqueios() {
    const [tab, setTab] = useState<Tab>('tarifas');
    const [quartos, setQuartos] = useState<Quarto[]>([]);
    const [tarifas, setTarifas] = useState<TarifaSazonal[]>([]);
    const [bloqueios, setBloqueios] = useState<Bloqueio[]>([]);
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState<{ tipo: 'ok' | 'err'; msg: string } | null>(null);

    /* form nova tarifa — inclui campo auxiliar `percentagem` (não vai para a BD) */
    const [novaTarifa, setNovaTarifa] = useState({
        quarto_id: '', data_inicio: '', data_fim: '',
        preco_noite: 0, percentagem: 0,
        motivo: '', politica_cancelamento: 'FLEXIVEL', minima_estadia: 2,
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

    /* ── Fetch ─────────────────────────────────────────────────── */
    const fetchData = async () => {
        const token = localStorage.getItem('token');
        const headers = { 'Authorization': `Bearer ${token}` };
        try {
            const [tRes, qRes, bRes] = await Promise.all([
                fetch(`${EDGE_URL}/admin-tarifas`,   { headers }),
                fetch(`${EDGE_URL}/admin-quartos`,   { headers }),
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

    /* ── Recalcular % quando muda quarto ou data_inicio ────────── */
    useEffect(() => {
        if (!novaTarifa.quarto_id || !novaTarifa.data_inicio) return;
        const base = getBaseRate(quartos, novaTarifa.quarto_id, novaTarifa.data_inicio);
        if (base > 0 && novaTarifa.preco_noite > 0) {
            const pct = euroToPercent(novaTarifa.preco_noite, base);
            setNovaTarifa(prev => ({ ...prev, percentagem: pct }));
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [novaTarifa.quarto_id, novaTarifa.data_inicio, quartos]);

    /* ── Handlers de preço ─────────────────────────────────────── */

    /** Utilizador alterou o campo € → recalcula % */
    const handlePrecoChange = (raw: string) => {
        const euro = Math.max(0, parseFloat(raw) || 0);
        const base = getBaseRate(quartos, novaTarifa.quarto_id, novaTarifa.data_inicio);
        const pct  = euroToPercent(euro, base);
        setNovaTarifa(prev => ({ ...prev, preco_noite: euro, percentagem: pct }));
    };

    /** Utilizador alterou o campo % → recalcula € */
    const handlePercentagemChange = (raw: string) => {
        const pct  = Math.max(0, parseFloat(raw) || 0);
        const base = getBaseRate(quartos, novaTarifa.quarto_id, novaTarifa.data_inicio);
        const euro = percentToEuro(pct, base);
        setNovaTarifa(prev => ({ ...prev, percentagem: pct, preco_noite: euro }));
    };

    /* ── Tarifa CRUD ───────────────────────────────────────────── */
    const handleSalvarTarifa = async (e: React.FormEvent) => {
        e.preventDefault();
        setSavingTarifa(true);
        const token = localStorage.getItem('token');
        try {
            // `percentagem` é apenas UI — não enviamos para a BD
            const { percentagem: _pct, ...payload } = novaTarifa;
            const finalPayload = editandoTarifaId ? { ...payload, id: editandoTarifaId } : payload;
            const resp = await fetch(`${EDGE_URL}/admin-tarifas`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(finalPayload),
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
        const dataInicio = t.data_inicio.split('T')[0];
        const base = getBaseRate(quartos, t.quarto_id, dataInicio);
        const pct  = euroToPercent(Number(t.preco_noite), base);
        setNovaTarifa({
            quarto_id: t.quarto_id,
            data_inicio: dataInicio,
            data_fim: t.data_fim.split('T')[0],
            preco_noite: Number(t.preco_noite),
            percentagem: pct,
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
        setNovaTarifa({
            quarto_id: '', data_inicio: '', data_fim: '',
            preco_noite: 0, percentagem: 0,
            motivo: '', politica_cancelamento: 'FLEXIVEL', minima_estadia: 2,
        });
    };

    /* ── Bloqueios CRUD ────────────────────────────────────────── */
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

    /* ── Helpers UI ────────────────────────────────────────────── */
    const nomeQuarto = (item: TarifaSazonal | Bloqueio) =>
        (item.quarto || (item as any).Quarto)?.nome || '—';

    const fmtDate = (d: string) =>
        new Date(d + 'T00:00:00').toLocaleDateString('pt-PT', { day: '2-digit', month: 'short', year: 'numeric' });

    const politicaLabel: Record<string, string> = {
        FLEXIVEL: 'Flexível', MODERADA: 'Moderada',
        LIMITADA: 'Limitada', RIGOROSA: 'Rigorosa',
    };

    /* Quarto seleccionado no form */
    const quartoSelecionado = quartos.find(q => q.id === novaTarifa.quarto_id);
    const baseSelecionada   = getBaseRate(quartos, novaTarifa.quarto_id, novaTarifa.data_inicio);
    const tipoBase          = (novaTarifa.quarto_id && novaTarifa.data_inicio)
        ? (isFimDeSemana(novaTarifa.data_inicio) ? 'Fim de Semana' : 'Semana')
        : null;

    /* % da tarifa na lista (calculada on-the-fly) */
    const pctDaTarifa = (t: TarifaSazonal) => {
        const base = getBaseRate(quartos, t.quarto_id, t.data_inicio.split('T')[0]);
        if (!base) return null;
        return euroToPercent(Number(t.preco_noite), base);
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

            <div className="ml-0 md:ml-20 p-4 md:p-8 xl:p-12 max-w-[1400px] mx-auto pb-24 md:pb-4">

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
                    <button onClick={() => setTab('tarifas')}
                        className={`flex items-center gap-2 px-8 py-3.5 text-[10px] uppercase tracking-widest font-bold transition-all duration-200 cursor-pointer
                            ${tab === 'tarifas' ? 'bg-[#1E3932] text-[#C4A484]' : 'bg-white text-gray-400 hover:text-[#1E3932]'}`}>
                        <TrendingUp size={13} /> Tarifas Sazonais
                        <span className={`ml-1 text-[9px] px-1.5 py-0.5 rounded-sm font-mono
                            ${tab === 'tarifas' ? 'bg-[#C4A484]/20 text-[#C4A484]' : 'bg-gray-100 text-gray-400'}`}>
                            {tarifas.length}
                        </span>
                    </button>
                    <button onClick={() => setTab('bloqueios')}
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
                    <div className="grid grid-cols-1 xl:grid-cols-[460px_1fr] gap-8 items-start">

                        {/* ── Formulário ── */}
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
                                    <select required
                                        value={novaTarifa.quarto_id}
                                        onChange={e => setNovaTarifa(prev => ({ ...prev, quarto_id: e.target.value }))}
                                        className="w-full border-b border-gray-200 py-3 outline-none text-sm focus:border-[#C4A484] transition-colors bg-transparent text-[#1E3932] cursor-pointer">
                                        <option value="">— Selecionar alojamento —</option>
                                        {quartos.map(q => (
                                            <option key={q.id} value={q.id}>
                                                {q.nome}
                                                {(q.tarifa_semana || q.tarifa_fds)
                                                    ? ` (Sem: €${Number(q.tarifa_semana ?? q.preco_base).toFixed(0)} · FDS: €${Number(q.tarifa_fds ?? q.preco_base).toFixed(0)})`
                                                    : ` (base: €${Number(q.preco_base).toFixed(0)}/noite)`}
                                            </option>
                                        ))}
                                    </select>
                                    {/* Info sobre base do alojamento selecionado */}
                                    {quartoSelecionado && (
                                        <div className="mt-2 flex gap-3 flex-wrap">
                                            <span className="text-[9px] bg-[#1E3932]/5 text-[#1E3932] px-2 py-1 font-bold uppercase tracking-widest">
                                                Semana: €{Number(quartoSelecionado.tarifa_semana ?? quartoSelecionado.preco_base).toFixed(2)}
                                            </span>
                                            <span className="text-[9px] bg-[#C4A484]/10 text-[#1E3932] px-2 py-1 font-bold uppercase tracking-widest">
                                                FDS: €{Number(quartoSelecionado.tarifa_fds ?? quartoSelecionado.preco_base).toFixed(2)}
                                            </span>
                                        </div>
                                    )}
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
                                            onChange={e => setNovaTarifa(prev => ({ ...prev, data_inicio: e.target.value }))}
                                            className="w-full border-b border-gray-200 py-3 outline-none text-sm focus:border-[#C4A484] transition-colors" />
                                        {novaTarifa.data_inicio && (
                                            <span className={`text-[9px] mt-1 block font-bold uppercase tracking-widest
                                                ${isFimDeSemana(novaTarifa.data_inicio) ? 'text-[#C4A484]' : 'text-[#1E3932]/60'}`}>
                                                {isFimDeSemana(novaTarifa.data_inicio) ? '★ Fim de Semana' : '● Semana'}
                                            </span>
                                        )}
                                    </div>
                                    <div>
                                        <label className="text-[10px] uppercase tracking-widest text-gray-400 font-bold block mb-2">Até *</label>
                                        <input type="date" required
                                            value={novaTarifa.data_fim}
                                            onChange={e => setNovaTarifa(prev => ({ ...prev, data_fim: e.target.value }))}
                                            className="w-full border-b border-gray-200 py-3 outline-none text-sm focus:border-[#C4A484] transition-colors" />
                                    </div>
                                </div>

                                {/* ── Preço + Percentagem (sincronizados) ── */}
                                <div className="border border-gray-100 bg-gray-50/50 p-4 space-y-4">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">
                                            Valor por Noite
                                        </span>
                                        {tipoBase && baseSelecionada > 0 && (
                                            <span className={`text-[9px] px-2 py-0.5 font-bold uppercase tracking-widest
                                                ${tipoBase === 'Fim de Semana'
                                                    ? 'bg-[#C4A484]/20 text-[#C4A484]'
                                                    : 'bg-[#1E3932]/10 text-[#1E3932]'}`}>
                                                Base {tipoBase}: €{baseSelecionada.toFixed(2)}
                                            </span>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        {/* € */}
                                        <div>
                                            <label className="text-[10px] uppercase tracking-widest text-gray-400 font-bold block mb-2">
                                                Valor (€) *
                                            </label>
                                            <div className="flex items-center gap-2 border-b border-gray-200 focus-within:border-[#C4A484] transition-colors pb-1">
                                                <Euro size={13} className="text-[#C4A484] shrink-0" />
                                                <input type="number" required min="0" step="0.01"
                                                    value={novaTarifa.preco_noite || ''}
                                                    onChange={e => handlePrecoChange(e.target.value)}
                                                    className="w-full py-2 outline-none text-sm bg-transparent text-[#1E3932]"
                                                    placeholder="0.00" />
                                            </div>
                                        </div>

                                        {/* % */}
                                        <div>
                                            <label className="text-[10px] uppercase tracking-widest text-gray-400 font-bold block mb-2">
                                                Percentagem (%)
                                            </label>
                                            <div className="flex items-center gap-2 border-b border-gray-200 focus-within:border-[#C4A484] transition-colors pb-1">
                                                <Percent size={13} className="text-[#C4A484] shrink-0" />
                                                <input type="number" min="0" step="0.01"
                                                    value={novaTarifa.percentagem || ''}
                                                    onChange={e => handlePercentagemChange(e.target.value)}
                                                    disabled={!baseSelecionada}
                                                    className="w-full py-2 outline-none text-sm bg-transparent text-[#1E3932] disabled:opacity-40 disabled:cursor-not-allowed"
                                                    placeholder="0.00" />
                                            </div>
                                            {!baseSelecionada && novaTarifa.quarto_id && (
                                                <p className="text-[9px] text-amber-500 mt-1">Configure tarifas base no alojamento.</p>
                                            )}
                                        </div>
                                    </div>

                                    {/* indicador visual */}
                                    {novaTarifa.preco_noite > 0 && baseSelecionada > 0 && (
                                        <div className={`text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5
                                            ${novaTarifa.percentagem > 100 ? 'text-green-600' :
                                              novaTarifa.percentagem < 100 ? 'text-amber-600' : 'text-gray-400'}`}>
                                            {novaTarifa.percentagem > 100
                                                ? `▲ +${(novaTarifa.percentagem - 100).toFixed(2)}% acima da base`
                                                : novaTarifa.percentagem < 100
                                                ? `▼ −${(100 - novaTarifa.percentagem).toFixed(2)}% abaixo da base`
                                                : '= Igual à tarifa base'}
                                        </div>
                                    )}
                                </div>

                                {/* Identificador */}
                                <div>
                                    <label className="text-[10px] uppercase tracking-widest text-gray-400 font-bold block mb-2">Identificador</label>
                                    <div className="flex items-center gap-3 border-b border-gray-200 focus-within:border-[#C4A484] transition-colors">
                                        <Tag size={13} className="text-gray-300 shrink-0" />
                                        <input
                                            value={novaTarifa.motivo}
                                            onChange={e => setNovaTarifa(prev => ({ ...prev, motivo: e.target.value }))}
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
                                            onChange={e => setNovaTarifa(prev => ({ ...prev, politica_cancelamento: e.target.value }))}
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
                                                onChange={e => setNovaTarifa(prev => ({ ...prev, minima_estadia: parseInt(e.target.value) || 1 }))}
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

                        {/* ── Lista Tarifas ── */}
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
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {tarifas.map(t => {
                                        const pct = pctDaTarifa(t);
                                        return (
                                            <div key={t.id}
                                                className="bg-white border border-gray-100 hover:border-[#C4A484]/30 transition-all duration-200 group">
                                                <div className="flex items-stretch">
                                                    <div className="w-1 bg-[#C4A484]/30 group-hover:bg-[#C4A484] transition-colors shrink-0" />

                                                    <div className="flex items-center gap-5 px-5 py-4 flex-1 min-w-0">
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

                                                        {/* Preço + % */}
                                                        <div className="shrink-0 text-right pr-2 space-y-1">
                                                            <div className="flex items-baseline gap-0.5 justify-end">
                                                                <span className="text-sm text-[#C4A484] font-serif">€</span>
                                                                <span className="text-2xl font-serif text-[#1E3932] leading-none">
                                                                    {Number(t.preco_noite).toFixed(0)}
                                                                </span>
                                                                <span className="text-[9px] text-gray-300 ml-0.5">/noite</span>
                                                            </div>
                                                            {pct !== null && (
                                                                <div className={`text-[9px] font-bold uppercase tracking-widest text-right
                                                                    ${pct > 100 ? 'text-green-500' : pct < 100 ? 'text-amber-500' : 'text-gray-400'}`}>
                                                                    {pct > 100 ? `+${(pct - 100).toFixed(1)}%` :
                                                                     pct < 100 ? `−${(100 - pct).toFixed(1)}%` : '= Base'}
                                                                </div>
                                                            )}
                                                        </div>

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
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* ═══ TAB BLOQUEIOS ═══ */}
                {tab === 'bloqueios' && (
                    <div className="grid grid-cols-1 xl:grid-cols-[440px_1fr] gap-8 items-start">

                        <div className="bg-white border border-gray-100 shadow-sm">
                            <div className="px-7 py-5 border-b border-gray-50 flex items-center gap-2.5">
                                <div className="w-7 h-7 bg-[#1E3932] flex items-center justify-center">
                                    <Lock size={13} className="text-[#C4A484]" />
                                </div>
                                <h2 className="font-serif text-lg text-[#1E3932]">Novo Bloqueio</h2>
                            </div>

                            <form onSubmit={handleSalvarBloqueio} className="p-7 space-y-6">
                                <div>
                                    <label className="text-[10px] uppercase tracking-widest text-gray-400 font-bold block mb-2">Alojamento *</label>
                                    <select required
                                        value={novoBloqueio.quarto_id}
                                        onChange={e => setNovoBloqueio({ ...novoBloqueio, quarto_id: e.target.value })}
                                        className="w-full border-b border-gray-200 py-3 outline-none text-sm focus:border-[#C4A484] transition-colors bg-transparent text-[#1E3932] cursor-pointer">
                                        <option value="">— Selecionar alojamento —</option>
                                        {quartos.map(q => (
                                            <option key={q.id} value={q.id}>{q.nome}</option>
                                        ))}
                                    </select>
                                </div>
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
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {bloqueios.map(b => (
                                        <div key={b.id}
                                            className="bg-white border border-gray-100 hover:border-red-100 transition-all duration-200 group">
                                            <div className="flex items-stretch">
                                                <div className="w-1 bg-gray-200 group-hover:bg-red-300 transition-colors shrink-0" />
                                                <div className="flex items-center gap-5 px-5 py-4 flex-1 min-w-0">
                                                    <div className="w-9 h-9 bg-gray-100 group-hover:bg-red-50 flex items-center justify-center transition-colors shrink-0">
                                                        <Moon size={15} className="text-gray-400 group-hover:text-red-400 transition-colors" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                                                            <span className="font-serif text-base text-[#1E3932] truncate">{nomeQuarto(b)}</span>
                                                            <span className="text-[9px] uppercase tracking-widest text-red-500 border border-red-100 bg-red-50 px-2 py-0.5 font-bold shrink-0">
                                                                Bloqueado
                                                            </span>
                                                        </div>
                                                        {b.motivo && <p className="text-[10px] text-gray-400 italic mb-1.5 truncate">"{b.motivo}"</p>}
                                                        <div className="flex items-center gap-2 text-gray-400">
                                                            <Calendar size={10} className="text-[#C4A484]" />
                                                            <span className="text-[10px]">{fmtDate(b.data_inicio)}</span>
                                                            <span className="text-gray-200 text-[10px]">→</span>
                                                            <span className="text-[10px]">{fmtDate(b.data_fim)}</span>
                                                        </div>
                                                    </div>
                                                    <button onClick={() => handleDeletarBloqueio(b.id)}
                                                        className="w-8 h-8 flex items-center justify-center border border-gray-100 text-gray-300 hover:text-red-500 hover:border-red-100 transition-all duration-200 shrink-0 cursor-pointer">
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
