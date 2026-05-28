"use client";
import { useState, useEffect } from 'react';
import type { Quarto, TarifaSazonal, Bloqueio, Tab, NovaTarifaState } from '@/components/admin/tarifas/types';
import { getSemanaBase, getFdsBase, euroToPercent, percentToEuro } from '@/components/admin/tarifas/helpers';

const EDGE_URL = 'https://vuidkeygtxfbgxvmilya.supabase.co/functions/v1';

const INITIAL_TARIFA: NovaTarifaState = {
    quarto_id: '', data_inicio: '', data_fim: '',
    preco_noite: 0, percentagem: 0,
    preco_noite_fds: 0, percentagem_fds: 0,
    motivo: '', politica_cancelamento: 'FLEXIVEL', minima_estadia: 2,
};

export function useTarifas() {
    const [tab, setTab]           = useState<Tab>('tarifas');
    const [quartos, setQuartos]   = useState<Quarto[]>([]);
    const [tarifas, setTarifas]   = useState<TarifaSazonal[]>([]);
    const [bloqueios, setBloqueios] = useState<Bloqueio[]>([]);
    const [loading, setLoading]   = useState(true);
    const [toast, setToast]       = useState<{ tipo: 'ok' | 'err'; msg: string } | null>(null);

    const [novaTarifa, setNovaTarifa]         = useState<NovaTarifaState>(INITIAL_TARIFA);
    const [editandoTarifaId, setEditandoTarifaId] = useState<string | null>(null);
    const [savingTarifa, setSavingTarifa]     = useState(false);

    const [novoBloqueio, setNovoBloqueio]     = useState({ quarto_id: '', data_inicio: '', data_fim: '', motivo: '' });
    const [savingBloqueio, setSavingBloqueio] = useState(false);

    const showToast = (tipo: 'ok' | 'err', msg: string) => {
        setToast({ tipo, msg });
        setTimeout(() => setToast(null), 3500);
    };

    const fetchData = async () => {
        const token = localStorage.getItem('token');
        const h = { 'Authorization': `Bearer ${token}` };
        try {
            const [tRes, qRes, bRes] = await Promise.all([
                fetch(`${EDGE_URL}/admin-tarifas`,   { headers: h }),
                fetch(`${EDGE_URL}/admin-quartos`,   { headers: h }),
                fetch(`${EDGE_URL}/admin-bloqueios`, { headers: h }),
            ]);
            const [tD, qD, bD] = await Promise.all([tRes.json(), qRes.json(), bRes.json()]);
            if (tD.status === 'success') setTarifas(tD.data || []);
            if (qD.status === 'success') setQuartos(qD.data || []);
            if (bD.status === 'success') setBloqueios(bD.data || []);
        } catch (e) { console.error('useTarifas fetchData', e); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchData(); }, []);

    // Recalcula % quando muda o quarto selecionado
    useEffect(() => {
        if (!novaTarifa.quarto_id) return;
        const bSem = getSemanaBase(quartos, novaTarifa.quarto_id);
        const bFds = getFdsBase(quartos, novaTarifa.quarto_id);
        setNovaTarifa(prev => ({
            ...prev,
            percentagem:     bSem > 0 && prev.preco_noite     > 0 ? euroToPercent(prev.preco_noite,     bSem) : prev.percentagem,
            percentagem_fds: bFds > 0 && prev.preco_noite_fds > 0 ? euroToPercent(prev.preco_noite_fds, bFds) : prev.percentagem_fds,
        }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [novaTarifa.quarto_id, quartos]);

    /* ── Price handlers ── */
    const handlePrecoChange = (raw: string) => {
        const euro = Math.max(0, parseFloat(raw) || 0);
        const base = getSemanaBase(quartos, novaTarifa.quarto_id);
        setNovaTarifa(p => ({ ...p, preco_noite: euro, percentagem: euroToPercent(euro, base) }));
    };
    const handlePercentagemChange = (raw: string) => {
        const pct = Math.max(0, parseFloat(raw) || 0);
        const base = getSemanaBase(quartos, novaTarifa.quarto_id);
        setNovaTarifa(p => ({ ...p, percentagem: pct, preco_noite: percentToEuro(pct, base) }));
    };
    const handlePrecoFdsChange = (raw: string) => {
        const euro = Math.max(0, parseFloat(raw) || 0);
        const base = getFdsBase(quartos, novaTarifa.quarto_id);
        setNovaTarifa(p => ({ ...p, preco_noite_fds: euro, percentagem_fds: euroToPercent(euro, base) }));
    };
    const handlePercentagemFdsChange = (raw: string) => {
        const pct = Math.max(0, parseFloat(raw) || 0);
        const base = getFdsBase(quartos, novaTarifa.quarto_id);
        setNovaTarifa(p => ({ ...p, percentagem_fds: pct, preco_noite_fds: percentToEuro(pct, base) }));
    };

    /* ── Tarifa CRUD ── */
    const handleSalvarTarifa = async (e: React.FormEvent) => {
        e.preventDefault();
        setSavingTarifa(true);
        const token = localStorage.getItem('token');
        try {
            const { percentagem: _p, percentagem_fds: _pf, ...payload } = novaTarifa;
            const clean = { ...payload, preco_noite_fds: payload.preco_noite_fds > 0 ? payload.preco_noite_fds : null };
            const body  = editandoTarifaId ? { ...clean, id: editandoTarifaId } : clean;
            const resp  = await fetch(`${EDGE_URL}/admin-tarifas`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(body),
            });
            if (resp.ok) {
                resetTarifaForm();
                await fetchData();
                showToast('ok', editandoTarifaId ? 'Tarifa atualizada.' : 'Tarifa criada.');
            } else {
                const err = await resp.json();
                showToast('err', err.error || 'Erro ao guardar tarifa.');
            }
        } catch { showToast('err', 'Erro de comunicação.'); }
        finally { setSavingTarifa(false); }
    };

    const handleEditarTarifa = (t: TarifaSazonal) => {
        setEditandoTarifaId(t.id);
        const bSem = getSemanaBase(quartos, t.quarto_id);
        const bFds = getFdsBase(quartos, t.quarto_id);
        const fdVal = Number(t.preco_noite_fds ?? 0);
        setNovaTarifa({
            quarto_id:  t.quarto_id,
            data_inicio: t.data_inicio.split('T')[0],
            data_fim:    t.data_fim.split('T')[0],
            preco_noite:     Number(t.preco_noite),
            percentagem:     euroToPercent(Number(t.preco_noite), bSem),
            preco_noite_fds:  fdVal,
            percentagem_fds:  fdVal > 0 ? euroToPercent(fdVal, bFds) : 0,
            motivo:              t.motivo || '',
            politica_cancelamento: t.politica_cancelamento || 'FLEXIVEL',
            minima_estadia:  t.minima_estadia || 2,
        });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDeletarTarifa = async (id: string) => {
        const token = localStorage.getItem('token');
        try {
            const resp = await fetch(`${EDGE_URL}/admin-tarifas/${id}`, {
                method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` },
            });
            if (resp.ok) { await fetchData(); showToast('ok', 'Tarifa removida.'); }
            else showToast('err', 'Erro ao remover tarifa.');
        } catch { showToast('err', 'Erro de comunicação.'); }
    };

    const resetTarifaForm = () => {
        setEditandoTarifaId(null);
        setNovaTarifa(INITIAL_TARIFA);
    };

    /* ── Bloqueio CRUD ── */
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
                showToast('ok', 'Bloqueio gravado.');
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
                method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` },
            });
            if (resp.ok) { await fetchData(); showToast('ok', 'Bloqueio removido.'); }
            else showToast('err', 'Erro ao remover bloqueio.');
        } catch { showToast('err', 'Erro de comunicação.'); }
    };

    return {
        tab, setTab,
        quartos, tarifas, bloqueios, loading, toast,
        novaTarifa, setNovaTarifa, editandoTarifaId, savingTarifa,
        novoBloqueio, setNovoBloqueio, savingBloqueio,
        handlePrecoChange, handlePercentagemChange,
        handlePrecoFdsChange, handlePercentagemFdsChange,
        handleSalvarTarifa, handleEditarTarifa, handleDeletarTarifa, resetTarifaForm,
        handleSalvarBloqueio, handleDeletarBloqueio,
    };
}
