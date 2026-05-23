"use client";
import React, { useState, useEffect } from 'react';
import { RefreshCw, Link2, Save, Check, AlertCircle, Info, Instagram, Eye, EyeOff } from 'lucide-react';
import AdminSidebar from '@/components/AdminSidebar';

const EDGE_URL = 'https://vuidkeygtxfbgxvmilya.supabase.co/functions/v1';

interface Quarto {
    id: string;
    nome: string;
    ical_url: string | null;
    ical_airbnb: string | null;
    ical_booking: string | null;
}

interface RoomState {
    airbnb: string;
    booking: string;
    saving: boolean;
    saved: boolean;
    saveError: string | null;
    syncingAirbnb: boolean;
    syncingBooking: boolean;
    syncMsg: string | null;
}

// ── Button atoms ──────────────────────────────────────────────────────────────
const BtnPrimary = ({
    children, onClick, disabled, className = ''
}: { children: React.ReactNode; onClick?: () => void; disabled?: boolean; className?: string }) => (
    <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        className={`inline-flex items-center gap-2 bg-[#1E3932] text-white px-5 py-2.5 text-[11px] uppercase tracking-widest font-bold hover:bg-[#C4A484] transition-colors duration-300 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer ${className}`}
    >
        {children}
    </button>
);

const BtnOutline = ({
    children, onClick, disabled, className = ''
}: { children: React.ReactNode; onClick?: () => void; disabled?: boolean; className?: string }) => (
    <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        className={`inline-flex items-center gap-2 border border-[#1E3932] text-[#1E3932] px-4 py-2 text-[11px] uppercase tracking-widest font-bold hover:bg-[#1E3932] hover:text-white transition-colors duration-300 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer ${className}`}
    >
        {children}
    </button>
);

const BtnGold = ({
    children, onClick, disabled, className = ''
}: { children: React.ReactNode; onClick?: () => void; disabled?: boolean; className?: string }) => (
    <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        className={`inline-flex items-center gap-1.5 border border-[#C4A484] text-[#C4A484] px-3 py-1.5 text-[10px] uppercase tracking-widest font-bold hover:bg-[#C4A484] hover:text-white transition-colors duration-300 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer ${className}`}
    >
        {children}
    </button>
);

// ── iCal input field ──────────────────────────────────────────────────────────
const IcalInput = ({
    label, dot, value, placeholder, onChange
}: {
    label: string;
    dot: string;
    value: string;
    placeholder: string;
    onChange: (v: string) => void;
}) => (
    <div className="space-y-2">
        <label className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: dot }} />
            <span className="text-[10px] uppercase tracking-widest font-bold text-gray-600">{label}</span>
        </label>
        <div className="flex items-center gap-2 border-b border-gray-200 focus-within:border-[#C4A484] transition-colors">
            <Link2 size={13} className="text-gray-400 flex-shrink-0 mb-0.5" />
            <input
                type="url"
                value={value}
                onChange={e => onChange(e.target.value)}
                placeholder={placeholder}
                style={{ fontSize: '16px' }}
                className="flex-1 py-2 text-xs outline-none bg-transparent text-gray-800 placeholder-gray-400 min-w-0"
            />
        </div>
    </div>
);

export default function IntegracoesOTA() {
    const [quartos, setQuartos] = useState<Quarto[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [syncingAll, setSyncingAll] = useState(false);
    const [syncAllMsg, setSyncAllMsg] = useState<string | null>(null);
    const [roomStates, setRoomStates] = useState<Record<string, RoomState>>({});

    // ── Instagram state ──────────────────────────────────────────────────────
    const [igToken, setIgToken]           = useState('');
    const [igTokenVisible, setIgTokenVisible] = useState(false);
    const [igSaving, setIgSaving]         = useState(false);
    const [igMsg, setIgMsg]               = useState<{ text: string; ok: boolean } | null>(null);
    const [igStatus, setIgStatus]         = useState<{ count: number; fetched_at: string } | null>(null);

    const fetchQuartos = async () => {
        setLoading(true);
        setLoadError(null);
        try {
            const token = localStorage.getItem('token');
            const resp = await fetch(`${EDGE_URL}/admin-quartos`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const json = await resp.json();
            if (json.status === 'success') {
                setQuartos(json.data);
                const init: Record<string, RoomState> = {};
                json.data.forEach((q: Quarto) => {
                    init[q.id] = {
                        airbnb: q.ical_airbnb || '',
                        booking: q.ical_booking || '',
                        saving: false,
                        saved: false,
                        saveError: null,
                        syncingAirbnb: false,
                        syncingBooking: false,
                        syncMsg: null,
                    };
                });
                setRoomStates(init);
            } else {
                setLoadError('Erro ao carregar alojamentos');
            }
        } catch {
            setLoadError('Erro de conexão');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchQuartos();
        // Check current Instagram cache status
        (async () => {
            try {
                const res = await fetch(`${EDGE_URL}/instagram-feed`);
                const json = await res.json();
                if (json.data?.length) {
                    setIgStatus({ count: json.data.length, fetched_at: json.data[0]?.timestamp || '' });
                }
            } catch { /* silently ignore */ }
        })();
    }, []);

    const updateRoom = (id: string, patch: Partial<RoomState>) => {
        setRoomStates(prev => ({ ...prev, [id]: { ...prev[id], ...patch } }));
    };

    const saveIcal = async (q: Quarto) => {
        const s = roomStates[q.id];
        if (!s) return;
        updateRoom(q.id, { saving: true, saved: false, saveError: null });
        try {
            const token = localStorage.getItem('token');
            const resp = await fetch(`${EDGE_URL}/admin-quartos/${q.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ icalAirbnb: s.airbnb, icalBooking: s.booking })
            });
            const json = await resp.json();
            if (json.status === 'success') {
                updateRoom(q.id, { saving: false, saved: true });
                setTimeout(() => updateRoom(q.id, { saved: false }), 3000);
                fetchQuartos();
            } else {
                updateRoom(q.id, { saving: false, saveError: json.error || 'Erro ao guardar' });
            }
        } catch {
            updateRoom(q.id, { saving: false, saveError: 'Erro de conexão' });
        }
    };

    const syncChannel = async (q: Quarto, channel: 'airbnb' | 'booking') => {
        const s = roomStates[q.id];
        const url = channel === 'airbnb' ? s?.airbnb : s?.booking;
        const label = channel === 'airbnb' ? 'AIRBNB' : 'BOOKING';
        if (!url) return;
        if (channel === 'airbnb') updateRoom(q.id, { syncingAirbnb: true, syncMsg: null });
        else updateRoom(q.id, { syncingBooking: true, syncMsg: null });
        try {
            const token = localStorage.getItem('token');
            const resp = await fetch(`${EDGE_URL}/sync-ical`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ quartoId: q.id, url, canalNome: label })
            });
            const json = await resp.json();
            const msg = json.status === 'success' ? `${label}: sincronizado!` : `Erro (${label}): ${json.error || 'falhou'}`;
            if (channel === 'airbnb') updateRoom(q.id, { syncingAirbnb: false, syncMsg: msg });
            else updateRoom(q.id, { syncingBooking: false, syncMsg: msg });
            setTimeout(() => updateRoom(q.id, { syncMsg: null }), 4000);
        } catch {
            const msg = `Erro de conexão (${label})`;
            if (channel === 'airbnb') updateRoom(q.id, { syncingAirbnb: false, syncMsg: msg });
            else updateRoom(q.id, { syncingBooking: false, syncMsg: msg });
        }
    };

    const saveInstagramToken = async () => {
        if (!igToken.trim()) return;
        setIgSaving(true);
        setIgMsg(null);
        try {
            const token = localStorage.getItem('token');
            const resp = await fetch(`${EDGE_URL}/instagram-feed/set-feed-id`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ feedId: igToken.trim() })
            });
            const json = await resp.json();
            if (json.status === 'success') {
                setIgMsg({ text: `✓ Feed ID guardado! ${json.posts_count} publicações carregadas.`, ok: true });
                setIgStatus({ count: json.posts_count, fetched_at: new Date().toISOString() });
                setIgToken('');
            } else {
                setIgMsg({ text: json.error || 'Erro ao guardar Feed ID', ok: false });
            }
        } catch {
            setIgMsg({ text: 'Erro de conexão', ok: false });
        } finally {
            setIgSaving(false);
            setTimeout(() => setIgMsg(null), 6000);
        }
    };

    const syncAll = async () => {
        setSyncingAll(true);
        setSyncAllMsg(null);
        try {
            const token = localStorage.getItem('token');
            const resp = await fetch(`${EDGE_URL}/sync-ical/all`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const json = await resp.json();
            setSyncAllMsg(json.status === 'success' ? 'Todos os canais sincronizados!' : (json.error || 'Erro na sincronização'));
        } catch {
            setSyncAllMsg('Erro de conexão');
        } finally {
            setSyncingAll(false);
            setTimeout(() => setSyncAllMsg(null), 5000);
        }
    };

    // ── Loading ──────────────────────────────────────────────────────────────
    if (loading) return (
        <div className="min-h-screen bg-[#F9F8F6] flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-[#C4A484] border-t-transparent rounded-full animate-spin" />
        </div>
    );

    return (
        <div className="min-h-screen bg-[#F9F8F6]">
            <AdminSidebar />
            <div className="ml-0 md:ml-20 p-4 md:p-8 lg:p-12 max-w-5xl mx-auto pb-24 md:pb-8">

                {/* ── Header ── */}
                <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-10">
                    <div>
                        <span className="text-[#C4A484] text-[10px] uppercase tracking-widest font-bold block mb-1">
                            Integrações Externas
                        </span>
                        <h1 className="text-3xl md:text-4xl font-serif text-[#1E3932] font-light leading-tight">
                            Canais OTA
                        </h1>
                        <p className="text-[12px] text-gray-500 mt-1">iCal · Airbnb · Booking.com</p>
                    </div>
                    <div className="flex flex-col items-start sm:items-end gap-2">
                        <BtnPrimary onClick={syncAll} disabled={syncingAll}>
                            <RefreshCw size={13} className={syncingAll ? 'animate-spin' : ''} />
                            {syncingAll ? 'A sincronizar…' : 'Sincronizar Todos'}
                        </BtnPrimary>
                        {syncAllMsg && (
                            <span className={`text-[11px] font-medium ${syncAllMsg.includes('Erro') ? 'text-red-500' : 'text-emerald-600'}`}>
                                {syncAllMsg}
                            </span>
                        )}
                    </div>
                </div>

                {/* ── Load error ── */}
                {loadError && (
                    <div className="bg-red-50 border border-red-200 p-4 mb-6 flex items-center gap-3">
                        <AlertCircle size={18} className="text-red-500 flex-shrink-0" />
                        <span className="text-sm text-red-700">{loadError}</span>
                        <button
                            type="button"
                            onClick={fetchQuartos}
                            className="ml-auto text-[11px] uppercase tracking-widest font-bold text-red-600 hover:underline cursor-pointer"
                        >
                            Tentar novamente
                        </button>
                    </div>
                )}

                {/* ── Info banner ── */}
                <div className="bg-white border border-gray-100 p-5 mb-8 flex gap-3 items-start">
                    <Info size={16} className="text-[#C4A484] flex-shrink-0 mt-0.5" />
                    <p className="text-[12px] text-gray-600 leading-relaxed">
                        Configure o link iCal de cada canal para cada alojamento. Após guardar, use o botão{' '}
                        <span className="font-bold text-[#1E3932]">Sync</span> para importar as reservas imediatamente,
                        ou clique em <span className="font-bold text-[#1E3932]">Sincronizar Todos</span> para atualizar todos de uma vez.
                    </p>
                </div>

                {/* ── Room cards ── */}
                <div className="space-y-6">
                    {quartos.map(q => {
                        const s = roomStates[q.id];
                        if (!s) return null;
                        const airbnbDirty = s.airbnb !== (q.ical_airbnb || '');
                        const bookingDirty = s.booking !== (q.ical_booking || '');
                        const isDirty = airbnbDirty || bookingDirty;

                        return (
                            <div key={q.id} className="bg-white border border-gray-100 hover:shadow-lg transition-shadow duration-300">
                                {/* Card header */}
                                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between gap-3">
                                    <h3 className="text-lg font-serif text-[#1E3932] font-medium truncate">{q.nome}</h3>
                                    {(q.ical_airbnb || q.ical_booking) && (
                                        <span className="flex-shrink-0 flex items-center gap-1 text-[10px] uppercase tracking-widest font-bold text-emerald-600">
                                            <Check size={12} /> Configurado
                                        </span>
                                    )}
                                </div>

                                {/* Card body */}
                                <div className="px-6 py-5 grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Airbnb */}
                                    <div className="space-y-3">
                                        <IcalInput
                                            label="Airbnb"
                                            dot="#FF5A5F"
                                            value={s.airbnb}
                                            placeholder="https://www.airbnb.com/calendar/ical/…"
                                            onChange={v => updateRoom(q.id, { airbnb: v })}
                                        />
                                        {s.airbnb && (
                                            <BtnGold
                                                onClick={() => syncChannel(q, 'airbnb')}
                                                disabled={s.syncingAirbnb}
                                            >
                                                <RefreshCw size={10} className={s.syncingAirbnb ? 'animate-spin' : ''} />
                                                {s.syncingAirbnb ? 'Sync…' : 'Sync Airbnb'}
                                            </BtnGold>
                                        )}
                                    </div>

                                    {/* Booking.com */}
                                    <div className="space-y-3">
                                        <IcalInput
                                            label="Booking.com"
                                            dot="#003580"
                                            value={s.booking}
                                            placeholder="https://ics.booking.com/…"
                                            onChange={v => updateRoom(q.id, { booking: v })}
                                        />
                                        {s.booking && (
                                            <BtnGold
                                                onClick={() => syncChannel(q, 'booking')}
                                                disabled={s.syncingBooking}
                                            >
                                                <RefreshCw size={10} className={s.syncingBooking ? 'animate-spin' : ''} />
                                                {s.syncingBooking ? 'Sync…' : 'Sync Booking'}
                                            </BtnGold>
                                        )}
                                    </div>
                                </div>

                                {/* Card footer */}
                                <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between gap-3 flex-wrap">
                                    <div className="flex items-center gap-2 min-w-0">
                                        {s.syncMsg && (
                                            <span className={`text-[11px] font-medium truncate ${s.syncMsg.includes('Erro') ? 'text-red-500' : 'text-emerald-600'}`}>
                                                {s.syncMsg}
                                            </span>
                                        )}
                                        {s.saveError && (
                                            <span className="text-[11px] text-red-500 truncate">{s.saveError}</span>
                                        )}
                                        {s.saved && (
                                            <span className="text-[11px] text-emerald-600 flex items-center gap-1">
                                                <Check size={12} /> Guardado
                                            </span>
                                        )}
                                    </div>
                                    <BtnOutline
                                        onClick={() => saveIcal(q)}
                                        disabled={s.saving || (!isDirty && !s.saveError)}
                                        className={isDirty ? 'border-[#1E3932]' : 'border-gray-300 text-gray-400'}
                                    >
                                        {s.saving ? (
                                            <><RefreshCw size={12} className="animate-spin" /> A guardar…</>
                                        ) : (
                                            <><Save size={12} /> Guardar Links</>
                                        )}
                                    </BtnOutline>
                                </div>
                            </div>
                        );
                    })}

                    {quartos.length === 0 && !loading && !loadError && (
                        <div className="bg-white border border-gray-100 p-12 text-center">
                            <p className="text-gray-500 text-sm">Nenhum alojamento encontrado.</p>
                        </div>
                    )}
                </div>

                {/* ═══════════════════════════════════════════════════════════
                    ── Instagram Feed ──
                ════════════════════════════════════════════════════════ */}
                <div className="mt-12 pt-8 border-t border-gray-200">
                    <div className="flex items-center gap-3 mb-6">
                        <Instagram size={18} className="text-[#C4A484]" />
                        <p className="text-[10px] uppercase tracking-widest font-bold text-gray-500">
                            Instagram Feed — Últimas publicações no site
                        </p>
                        {igStatus && (
                            <span className="ml-auto flex items-center gap-1 text-[10px] text-emerald-600 font-bold">
                                <Check size={11} /> {igStatus.count} posts em cache
                            </span>
                        )}
                    </div>

                    <div className="bg-white border border-gray-100 p-6 space-y-5">
                        {/* Status */}
                        {igStatus ? (
                            <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 px-4 py-3">
                                <Check size={14} className="text-emerald-600 flex-shrink-0" />
                                <span className="text-[12px] text-emerald-700">
                                    Feed activo — {igStatus.count} publicações carregadas. O token renova automaticamente a cada 50 dias.
                                </span>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 px-4 py-3">
                                <AlertCircle size={14} className="text-amber-600 flex-shrink-0" />
                                <span className="text-[12px] text-amber-700">
                                    Ainda não configurado. Cole o Access Token do Instagram abaixo para ativar o feed.
                                </span>
                            </div>
                        )}

                        {/* Feed ID input */}
                        <div className="space-y-2">
                            <label className="text-[10px] uppercase tracking-widest font-bold text-gray-600 flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-[#E1306C] flex-shrink-0" />
                                Behold.us — Feed ID
                            </label>
                            <div className="flex items-center gap-2 border-b border-gray-200 focus-within:border-[#C4A484] transition-colors">
                                <input
                                    type={igTokenVisible ? 'text' : 'password'}
                                    value={igToken}
                                    onChange={e => setIgToken(e.target.value)}
                                    placeholder="USRxxxxxxxxxxxxxxxx"
                                    style={{ fontSize: '16px' }}
                                    className="flex-1 py-2 text-xs outline-none bg-transparent text-gray-800 placeholder-gray-400 font-mono min-w-0"
                                />
                                <button
                                    type="button"
                                    onClick={() => setIgTokenVisible(v => !v)}
                                    className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer p-1"
                                    aria-label={igTokenVisible ? 'Ocultar' : 'Mostrar'}
                                >
                                    {igTokenVisible ? <EyeOff size={14} /> : <Eye size={14} />}
                                </button>
                            </div>
                            <p className="text-[11px] text-gray-400">
                                Cole aqui o Feed ID obtido em <strong>behold.us</strong>. Sem Facebook. Sem tokens. Funciona diretamente com o Instagram.
                            </p>
                        </div>

                        {igMsg && (
                            <p className={`text-[12px] font-medium ${igMsg.ok ? 'text-emerald-600' : 'text-red-500'}`}>
                                {igMsg.text}
                            </p>
                        )}

                        <BtnPrimary onClick={saveInstagramToken} disabled={igSaving || !igToken.trim()}>
                            {igSaving ? <><RefreshCw size={12} className="animate-spin" /> A validar…</> : <><Instagram size={12} /> Guardar e Activar Feed</>}
                        </BtnPrimary>

                        {/* Step-by-step guide — Behold.us (sem Facebook) */}
                        <details className="group mt-2">
                            <summary className="text-[11px] text-[#C4A484] font-bold uppercase tracking-widest cursor-pointer hover:text-[#1E3932] transition-colors list-none flex items-center gap-2">
                                <svg className="w-3 h-3 transition-transform group-open:rotate-90" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                                </svg>
                                Como obter o Feed ID no Behold.us (passo a passo — sem Facebook)
                            </summary>
                            <div className="mt-4 space-y-3 border-l-2 border-[#C4A484]/30 pl-4">
                                {[
                                    {
                                        n: '1', t: 'Criar conta gratuita',
                                        d: 'Aceda a behold.us e clique em "Sign Up Free". O plano gratuito inclui 50 posts e 1 feed — mais do que suficiente.'
                                    },
                                    {
                                        n: '2', t: 'Ligar o Instagram',
                                        d: 'No dashboard, clique "Connect Instagram" → autorize com a conta @refugiocarapita. Não precisa de Facebook nem de conta Business.'
                                    },
                                    {
                                        n: '3', t: 'Criar um Feed',
                                        d: 'Clique "New Feed" → escolha a conta Instagram ligada → selecione "Posts" → guarde. O Behold cria o feed automaticamente.'
                                    },
                                    {
                                        n: '4', t: 'Copiar o Feed ID',
                                        d: 'Na lista de feeds, clique no feed criado → vá ao separador "Developer" ou "API". O Feed ID aparece no formato USRxxxxxxxxxxxxxxxxxx. Copie-o.'
                                    },
                                    {
                                        n: '5', t: 'Colar aqui',
                                        d: 'Cole o Feed ID no campo acima e clique "Guardar e Activar Feed". O carousel aparece de imediato no site com as últimas 10 publicações.'
                                    },
                                ].map(step => (
                                    <div key={step.n} className="flex gap-3">
                                        <span className="flex-shrink-0 w-5 h-5 rounded-full bg-[#1E3932] text-white text-[9px] font-bold flex items-center justify-center mt-0.5">
                                            {step.n}
                                        </span>
                                        <div>
                                            <p className="text-[11px] font-bold text-[#1E3932] mb-0.5">{step.t}</p>
                                            <p className="text-[11px] text-gray-500 leading-relaxed">{step.d}</p>
                                        </div>
                                    </div>
                                ))}
                                <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 px-3 py-2 mt-2">
                                    <Info size={12} className="text-blue-500 flex-shrink-0" />
                                    <p className="text-[11px] text-blue-700">
                                        <strong>behold.us</strong> — acesso direto em{' '}
                                        <a href="https://behold.so" target="_blank" rel="noopener noreferrer" className="underline hover:text-blue-900">behold.so</a>
                                    </p>
                                </div>
                            </div>
                        </details>
                    </div>
                </div>

                {/* ── How-to section ── */}
                <div className="mt-12 pt-8 border-t border-gray-200">
                    <p className="text-[10px] uppercase tracking-widest font-bold text-gray-500 mb-6">
                        Como obter os links iCal
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {[
                            {
                                color: '#FF5A5F',
                                label: 'Airbnb',
                                desc: 'Calendário → Disponibilidade → Exportar Calendário → Copiar link .ics'
                            },
                            {
                                color: '#003580',
                                label: 'Booking.com',
                                desc: 'Extranet → Tarifas e Disponibilidade → Sincronizar Calendários → Exportar'
                            },
                            {
                                color: '#1E3932',
                                label: 'Outros (VRBO…)',
                                desc: 'Qualquer plataforma que forneça link iCalendar (.ics) é suportada.'
                            }
                        ].map(item => (
                            <div key={item.label} className="bg-white border border-gray-100 p-5">
                                <div className="flex items-center gap-2 mb-3">
                                    <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
                                    <span className="text-[11px] uppercase tracking-widest font-bold text-[#1E3932]">
                                        {item.label}
                                    </span>
                                </div>
                                <p className="text-[12px] text-gray-600 leading-relaxed">{item.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
