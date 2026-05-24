"use client";
import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import AdminSidebar from '@/components/AdminSidebar';
import {
    Search, X, ChevronLeft, ChevronRight, Eye,
    Trash2, User, Phone, Mail, MapPin, FileText,
    Calendar, CreditCard, AlertTriangle, Image as ImageIcon,
    Globe, Home, Clock, Building
} from 'lucide-react';

const EDGE_URL = 'https://vuidkeygtxfbgxvmilya.supabase.co/functions/v1';

/* ─── Types ─────────────────────────────────────────────────────────────── */
interface HospedeRow {
    id: string;
    nome: string;
    sobrenome?: string;
    email?: string;
    telefone?: string;
    pais?: string;
    cidade?: string;
    criado_em?: string;
}

interface HospedeDetalhe extends HospedeRow {
    endereco1?: string;
    endereco2?: string;
    cep?: string;
    nif?: string;
    passaporte?: string;
    estrangeiro?: boolean;
    data_nascimento?: string;
    local_nascimento?: string;
    nacionalidade?: string;
    tipo_documento?: string;
    numero_documento?: string;
    pais_emissor_documento?: string;
    dependentes?: unknown;
    foto_perfil?: string;
    documento_imagem_url?: string;
    atualizado_em?: string;
}

interface Reserva {
    id: string;
    numero_reserva?: string;
    data_check_in?: string;
    data_check_out?: string;
    status?: string;
    valor_total?: number;
    criado_em?: string;
    quarto?: { nome: string };
    canal?: { nome_canal: string };
}

interface AimaHospede {
    id: string;
    reserva_id?: string;
    ordem?: number;
    nome?: string;
    sobrenome?: string;
    email?: string;
    telefone?: string;
    data_nascimento?: string;
    nacionalidade?: string;
    tipo_documento?: string;
    numero_documento?: string;
    documento_imagem_url?: string;
    criado_em?: string;
}

interface ModalData {
    hospede: HospedeDetalhe;
    reservas: Reserva[];
    aimaHospedes: AimaHospede[];
}

/* ─── Helpers ────────────────────────────────────────────────────────────── */
const fmt = (d?: string) =>
    d ? new Date(d).toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—';

const fmtMoney = (v?: number) =>
    v != null ? `€${v.toFixed(2)}` : '—';

const statusColor: Record<string, string> = {
    confirmada: 'bg-emerald-500/15 text-emerald-400',
    pendente:   'bg-yellow-500/15 text-yellow-400',
    cancelada:  'bg-red-500/15 text-red-400',
    concluida:  'bg-blue-500/15 text-blue-400',
};

/* ─── Component ─────────────────────────────────────────────────────────── */
export default function HospedesPage() {
    const router = useRouter();
    const [token, setToken] = useState('');
    const [hospedes, setHospedes] = useState<HospedeRow[]>([]);
    const [total, setTotal] = useState(0);
    const [pages, setPages] = useState(1);
    const [page, setPage] = useState(1);
    const [query, setQuery] = useState('');
    const [inputVal, setInputVal] = useState('');
    const [loading, setLoading] = useState(false);

    // Modal
    const [modalData, setModalData] = useState<ModalData | null>(null);
    const [modalLoading, setModalLoading] = useState(false);
    const [activeTab, setActiveTab] = useState<'perfil' | 'documentos' | 'reservas'>('perfil');

    // Delete
    const [deleteTarget, setDeleteTarget] = useState<HospedeRow | null>(null);
    const [deleting, setDeleting] = useState(false);

    /* ── Auth ─────────────────────────────────────────────────────────── */
    useEffect(() => {
        const t = localStorage.getItem('token');
        if (!t) { router.push('/login'); return; }
        setToken(t);
    }, [router]);

    /* ── Fetch list ───────────────────────────────────────────────────── */
    const fetchList = useCallback(async (pg: number, q: string, tk: string) => {
        if (!tk) return;
        setLoading(true);
        try {
            const params = new URLSearchParams({ page: String(pg), limit: '10' });
            if (q) params.set('q', q);
            const res = await fetch(`${EDGE_URL}/admin-site/hospedes?${params}`, {
                headers: { Authorization: `Bearer ${tk}` }
            });
            const json = await res.json();
            if (json.status === 'success') {
                setHospedes(json.data || []);
                setTotal(json.total || 0);
                setPages(json.pages || 1);
            }
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    }, []);

    useEffect(() => {
        if (token) fetchList(page, query, token);
    }, [token, page, query, fetchList]);

    /* ── Search ───────────────────────────────────────────────────────── */
    const handleSearch = () => { setPage(1); setQuery(inputVal.trim()); };
    const handleSearchKey = (e: React.KeyboardEvent) => { if (e.key === 'Enter') handleSearch(); };
    const clearSearch = () => { setInputVal(''); setPage(1); setQuery(''); };

    /* ── Open modal ───────────────────────────────────────────────────── */
    const openModal = async (h: HospedeRow) => {
        setModalData(null);
        setActiveTab('perfil');
        setModalLoading(true);
        try {
            const res = await fetch(`${EDGE_URL}/admin-site/hospedes/${h.id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const json = await res.json();
            if (json.status === 'success') setModalData(json.data);
        } catch (e) { console.error(e); }
        finally { setModalLoading(false); }
    };

    /* ── GDPR Delete ──────────────────────────────────────────────────── */
    const confirmDelete = async () => {
        if (!deleteTarget) return;
        setDeleting(true);
        try {
            const res = await fetch(`${EDGE_URL}/admin-site/hospedes/${deleteTarget.id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            });
            const json = await res.json();
            if (json.status === 'success') {
                setDeleteTarget(null);
                setModalData(null);
                fetchList(page, query, token);
            } else {
                alert('Erro ao eliminar: ' + (json.error || 'erro desconhecido'));
            }
        } catch { alert('Erro de conexão'); }
        finally { setDeleting(false); }
    };

    /* ── Pagination ───────────────────────────────────────────────────── */
    const pageNumbers = () => {
        const nums: number[] = [];
        const start = Math.max(1, page - 2);
        const end   = Math.min(pages, page + 2);
        for (let i = start; i <= end; i++) nums.push(i);
        return nums;
    };

    /* ── Render ───────────────────────────────────────────────────────── */
    return (
        <div className="min-h-screen bg-[#0f1a17] text-white flex">
            <AdminSidebar />

            {/* ── Main content ───────────────────────────────────────── */}
            <main className="flex-1 md:ml-20 pb-24 md:pb-0 min-w-0">

                {/* ── Header ─────────────────────────────────────────── */}
                <div className="sticky top-0 z-30 bg-[#0f1a17]/95 backdrop-blur border-b border-white/5 px-4 md:px-6 py-3">
                    {/* Row 1: title */}
                    <div className="flex items-center justify-between mb-2.5">
                        <div>
                            <h1 className="text-base md:text-lg font-semibold text-white leading-none">Hóspedes</h1>
                            <p className="text-[10px] text-white/35 mt-1">{total} registos</p>
                        </div>
                    </div>
                    {/* Row 2: search — full width on mobile */}
                    <div className="flex items-center gap-2">
                        <div className="relative flex-1">
                            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none" />
                            <input
                                type="text"
                                value={inputVal}
                                onChange={e => setInputVal(e.target.value)}
                                onKeyDown={handleSearchKey}
                                placeholder="Nome, telefone, e-mail…"
                                className="w-full bg-white/5 border border-white/10 rounded-xl pl-8 pr-8 py-2 text-sm text-white placeholder-white/20 focus:outline-none focus:border-[#C4A484]/50"
                            />
                            {inputVal && (
                                <button onClick={clearSearch} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white cursor-pointer">
                                    <X size={12} />
                                </button>
                            )}
                        </div>
                        <button
                            onClick={handleSearch}
                            className="flex-shrink-0 bg-[#C4A484] text-[#1E3932] px-4 py-2 rounded-xl text-[11px] font-bold uppercase tracking-widest hover:bg-white transition-colors cursor-pointer whitespace-nowrap"
                        >
                            Buscar
                        </button>
                    </div>
                </div>

                {/* ── Table / Cards ──────────────────────────────────── */}
                <div className="px-3 md:px-6 py-4">
                    {loading ? (
                        <div className="flex items-center justify-center py-24">
                            <div className="w-8 h-8 border-2 border-[#C4A484]/30 border-t-[#C4A484] rounded-full animate-spin" />
                        </div>
                    ) : hospedes.length === 0 ? (
                        <div className="text-center py-24 text-white/30">
                            <User size={40} className="mx-auto mb-4 opacity-30" />
                            <p className="text-sm">Nenhum hóspede encontrado</p>
                        </div>
                    ) : (
                        <>
                            {/* Desktop table */}
                            <div className="hidden md:block overflow-hidden rounded-2xl border border-white/5">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="bg-white/3 border-b border-white/5">
                                            <th className="text-left px-5 py-3.5 text-[10px] uppercase tracking-widest text-white/30 font-medium">Nome</th>
                                            <th className="text-left px-5 py-3.5 text-[10px] uppercase tracking-widest text-white/30 font-medium">Telefone</th>
                                            <th className="text-left px-5 py-3.5 text-[10px] uppercase tracking-widest text-white/30 font-medium">E-mail</th>
                                            <th className="text-left px-5 py-3.5 text-[10px] uppercase tracking-widest text-white/30 font-medium">Registo</th>
                                            <th className="px-5 py-3.5" />
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {hospedes.map(h => (
                                            <tr key={h.id} className="hover:bg-white/2 transition-colors">
                                                <td className="px-5 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-full bg-[#C4A484]/10 flex items-center justify-center flex-shrink-0">
                                                            <span className="text-[#C4A484] text-xs font-serif font-semibold">
                                                                {(h.nome || '?')[0].toUpperCase()}
                                                            </span>
                                                        </div>
                                                        <div>
                                                            <p className="font-medium text-white">{h.nome} {h.sobrenome || ''}</p>
                                                            {h.cidade && <p className="text-[11px] text-white/30">{h.cidade}{h.pais ? `, ${h.pais}` : ''}</p>}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-5 py-4 text-white/60">{h.telefone || '—'}</td>
                                                <td className="px-5 py-4 text-white/60">{h.email || '—'}</td>
                                                <td className="px-5 py-4 text-white/40 text-[11px]">{fmt(h.criado_em)}</td>
                                                <td className="px-5 py-4 text-right">
                                                    <button
                                                        onClick={() => openModal(h)}
                                                        className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-widest text-[#C4A484] hover:text-white border border-[#C4A484]/30 hover:border-white/30 px-3 py-1.5 rounded-lg transition-all cursor-pointer"
                                                    >
                                                        <Eye size={12} /> Ver tudo
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* ── Mobile cards ───────────────────────── */}
                            <div className="md:hidden flex flex-col gap-2.5">
                                {hospedes.map(h => (
                                    <div key={h.id} className="bg-white/4 border border-white/6 rounded-2xl p-4">
                                        <div className="flex items-center gap-3 mb-3">
                                            {/* Avatar */}
                                            <div className="w-10 h-10 rounded-full bg-[#C4A484]/10 flex items-center justify-center flex-shrink-0">
                                                <span className="text-[#C4A484] font-serif font-semibold">
                                                    {(h.nome || '?')[0].toUpperCase()}
                                                </span>
                                            </div>
                                            {/* Name block */}
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium text-white text-sm leading-snug truncate">
                                                    {h.nome} {h.sobrenome || ''}
                                                </p>
                                                <p className="text-[10px] text-white/30 mt-0.5">{fmt(h.criado_em)}</p>
                                            </div>
                                            {/* Ver tudo button */}
                                            <button
                                                onClick={() => openModal(h)}
                                                className="flex-shrink-0 flex items-center gap-1 text-[10px] uppercase tracking-widest text-[#C4A484] border border-[#C4A484]/30 px-2.5 py-1.5 rounded-lg cursor-pointer active:bg-[#C4A484]/10"
                                            >
                                                <Eye size={11} /> Ver
                                            </button>
                                        </div>

                                        {/* Contact info */}
                                        <div className="space-y-1.5 pl-[52px]">
                                            {h.telefone && (
                                                <div className="flex items-center gap-2 text-[12px] text-white/50">
                                                    <Phone size={11} className="text-white/25 flex-shrink-0" />
                                                    <span className="truncate">{h.telefone}</span>
                                                </div>
                                            )}
                                            {h.email && (
                                                <div className="flex items-center gap-2 text-[12px] text-white/50">
                                                    <Mail size={11} className="text-white/25 flex-shrink-0" />
                                                    <span className="truncate">{h.email}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* ── Pagination ─────────────────────────── */}
                            {pages > 1 && (
                                <div className="mt-5 flex items-center justify-center gap-1.5">
                                    <button
                                        onClick={() => setPage(p => Math.max(1, p - 1))}
                                        disabled={page === 1}
                                        className="w-8 h-8 rounded-lg border border-white/10 flex items-center justify-center text-white/40 hover:text-white hover:border-white/30 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
                                    >
                                        <ChevronLeft size={14} />
                                    </button>

                                    {pageNumbers().map(n => (
                                        <button
                                            key={n}
                                            onClick={() => setPage(n)}
                                            className={`w-8 h-8 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                                                n === page
                                                    ? 'bg-[#C4A484] text-[#1E3932]'
                                                    : 'border border-white/10 text-white/40 hover:text-white hover:border-white/30'
                                            }`}
                                        >
                                            {n}
                                        </button>
                                    ))}

                                    <button
                                        onClick={() => setPage(p => Math.min(pages, p + 1))}
                                        disabled={page === pages}
                                        className="w-8 h-8 rounded-lg border border-white/10 flex items-center justify-center text-white/40 hover:text-white hover:border-white/30 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
                                    >
                                        <ChevronRight size={14} />
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </main>

            {/* ══════════════════════════════════════════════════════════
                MODAL — Full Profile
            ═══════════════════════════════════════════════════════════ */}
            {(modalData || modalLoading) && (
                <div
                    className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm"
                    onClick={() => { if (!modalLoading) setModalData(null); }}
                >
                    {/* Sheet rises from bottom on mobile, centered on sm+ */}
                    <div
                        className="relative bg-[#1a2e27] border border-white/8 w-full sm:max-w-2xl sm:mx-4 sm:rounded-2xl rounded-t-2xl flex flex-col shadow-2xl"
                        style={{ maxHeight: '92dvh' }}
                        onClick={e => e.stopPropagation()}
                    >
                        {modalLoading ? (
                            <div className="flex items-center justify-center py-20">
                                <div className="w-8 h-8 border-2 border-[#C4A484]/30 border-t-[#C4A484] rounded-full animate-spin" />
                            </div>
                        ) : modalData ? (
                            <>
                                {/* Drag handle (mobile) */}
                                <div className="sm:hidden flex justify-center pt-3 pb-1 flex-shrink-0">
                                    <div className="w-10 h-1 rounded-full bg-white/20" />
                                </div>

                                {/* Modal header */}
                                <div className="px-4 md:px-6 py-3 border-b border-white/5 flex-shrink-0">
                                    {/* Top row: avatar + name + close */}
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-[#C4A484]/10 flex items-center justify-center flex-shrink-0">
                                            {modalData.hospede.foto_perfil ? (
                                                <img src={modalData.hospede.foto_perfil} alt="" className="w-full h-full object-cover rounded-full" />
                                            ) : (
                                                <span className="text-[#C4A484] text-lg font-serif font-semibold">
                                                    {(modalData.hospede.nome || '?')[0].toUpperCase()}
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h2 className="font-semibold text-white text-base leading-snug truncate">
                                                {modalData.hospede.nome} {modalData.hospede.sobrenome || ''}
                                            </h2>
                                            <p className="text-[10px] text-white/35 mt-0.5">
                                                Registado em {fmt(modalData.hospede.criado_em)}
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => setModalData(null)}
                                            className="flex-shrink-0 w-8 h-8 flex items-center justify-center text-white/30 hover:text-white hover:bg-white/5 rounded-lg transition-all cursor-pointer"
                                        >
                                            <X size={16} />
                                        </button>
                                    </div>
                                    {/* RGPD delete button — full width below on mobile */}
                                    <button
                                        onClick={() => setDeleteTarget(modalData.hospede)}
                                        className="mt-3 w-full flex items-center justify-center gap-1.5 text-[10px] uppercase tracking-widest text-red-400 border border-red-400/25 hover:bg-red-400/8 py-2 rounded-xl transition-all cursor-pointer"
                                    >
                                        <Trash2 size={12} /> Eliminar dados (RGPD)
                                    </button>
                                </div>

                                {/* Tabs — scrollable on mobile */}
                                <div className="flex-shrink-0 border-b border-white/5 overflow-x-auto scrollbar-hide">
                                    <div className="flex gap-1 px-4 md:px-6 py-2.5 w-max min-w-full">
                                        {([ 'perfil', 'documentos', 'reservas'] as const).map(tab => (
                                            <button
                                                key={tab}
                                                onClick={() => setActiveTab(tab)}
                                                className={`flex-shrink-0 px-3.5 py-1.5 rounded-lg text-[10px] uppercase tracking-widest font-semibold transition-all cursor-pointer whitespace-nowrap ${
                                                    activeTab === tab
                                                        ? 'bg-[#C4A484] text-[#1E3932]'
                                                        : 'text-white/40 hover:text-white hover:bg-white/5'
                                                }`}
                                            >
                                                {tab === 'perfil'
                                                    ? 'Perfil'
                                                    : tab === 'documentos'
                                                    ? `Docs (${modalData.aimaHospedes.length})`
                                                    : `Reservas (${modalData.reservas.length})`}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Tab content — scrollable */}
                                <div className="flex-1 overflow-y-auto p-4 md:p-6">

                                    {/* ── PERFIL ─────────────────────────── */}
                                    {activeTab === 'perfil' && (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                                            <InfoField icon={<Mail size={13} />}     label="E-mail"        value={modalData.hospede.email} />
                                            <InfoField icon={<Phone size={13} />}    label="Telefone"      value={modalData.hospede.telefone} />
                                            <InfoField icon={<Globe size={13} />}    label="País"          value={modalData.hospede.pais} />
                                            <InfoField icon={<Building size={13} />} label="Cidade"        value={modalData.hospede.cidade} />
                                            <InfoField icon={<Home size={13} />}     label="Endereço"      value={modalData.hospede.endereco1} />
                                            <InfoField icon={<Home size={13} />}     label="Endereço 2"    value={modalData.hospede.endereco2} />
                                            <InfoField icon={<MapPin size={13} />}   label="Código Postal" value={modalData.hospede.cep} />
                                            <InfoField icon={<Calendar size={13} />} label="Nascimento"    value={modalData.hospede.data_nascimento} />
                                            <InfoField icon={<MapPin size={13} />}   label="Local Nasc."   value={modalData.hospede.local_nascimento} />
                                            <InfoField icon={<Globe size={13} />}    label="Nacionalidade" value={modalData.hospede.nacionalidade} />
                                            <InfoField icon={<FileText size={13} />} label="Tipo Doc."     value={modalData.hospede.tipo_documento} />
                                            <InfoField icon={<FileText size={13} />} label="Nº Documento"  value={modalData.hospede.numero_documento} />
                                            <InfoField icon={<Globe size={13} />}    label="País Emissor"  value={modalData.hospede.pais_emissor_documento} />
                                            <InfoField icon={<CreditCard size={13} />} label="NIF"         value={modalData.hospede.nif} />
                                            <InfoField icon={<FileText size={13} />} label="Passaporte"    value={modalData.hospede.passaporte} />
                                            <InfoField icon={<Clock size={13} />}    label="Atualizado"    value={fmt(modalData.hospede.atualizado_em)} />
                                            {modalData.hospede.estrangeiro !== undefined && (
                                                <InfoField icon={<Globe size={13} />} label="Estrangeiro"  value={modalData.hospede.estrangeiro ? 'Sim' : 'Não'} />
                                            )}
                                            {modalData.hospede.documento_imagem_url && (
                                                <div className="col-span-full mt-1">
                                                    <p className="text-[10px] uppercase tracking-widest text-white/25 mb-2">Documento</p>
                                                    <a href={modalData.hospede.documento_imagem_url} target="_blank" rel="noreferrer">
                                                        <img
                                                            src={modalData.hospede.documento_imagem_url}
                                                            alt="Documento"
                                                            className="max-h-44 w-full object-contain rounded-xl border border-white/10 cursor-pointer hover:opacity-80 transition-opacity"
                                                        />
                                                    </a>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* ── DOCUMENTOS ─────────────────────── */}
                                    {activeTab === 'documentos' && (
                                        modalData.aimaHospedes.length === 0 ? (
                                            <div className="text-center py-14 text-white/30">
                                                <ImageIcon size={36} className="mx-auto mb-3 opacity-30" />
                                                <p className="text-sm">Sem documentos AIMA registados</p>
                                            </div>
                                        ) : (
                                            <div className="flex flex-col gap-5">
                                                {modalData.aimaHospedes.map((aima, i) => (
                                                    <div key={aima.id} className="bg-white/3 border border-white/5 rounded-xl p-4">
                                                        <div className="flex items-center gap-2 mb-3">
                                                            <span className="text-[10px] uppercase tracking-widest text-[#C4A484] font-semibold">
                                                                Hóspede #{(aima.ordem ?? i) + 1}
                                                            </span>
                                                            {aima.reserva_id && (
                                                                <span className="text-[10px] text-white/25 truncate">
                                                                    · {aima.reserva_id.slice(0, 8)}…
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-4">
                                                            <InfoField icon={<User size={13} />}     label="Nome"         value={`${aima.nome || ''} ${aima.sobrenome || ''}`.trim() || undefined} />
                                                            <InfoField icon={<Mail size={13} />}     label="E-mail"       value={aima.email} />
                                                            <InfoField icon={<Phone size={13} />}    label="Telefone"     value={aima.telefone} />
                                                            <InfoField icon={<Calendar size={13} />} label="Nascimento"   value={aima.data_nascimento} />
                                                            <InfoField icon={<Globe size={13} />}    label="Nacionalidade" value={aima.nacionalidade} />
                                                            <InfoField icon={<FileText size={13} />} label="Tipo Doc."    value={aima.tipo_documento} />
                                                            <InfoField icon={<FileText size={13} />} label="Nº Documento" value={aima.numero_documento} />
                                                        </div>
                                                        {aima.documento_imagem_url ? (
                                                            <a href={aima.documento_imagem_url} target="_blank" rel="noreferrer">
                                                                <img
                                                                    src={aima.documento_imagem_url}
                                                                    alt="Documento AIMA"
                                                                    className="max-h-44 w-full object-contain rounded-xl border border-white/10 cursor-pointer hover:opacity-80 transition-opacity"
                                                                />
                                                            </a>
                                                        ) : (
                                                            <div className="flex items-center gap-2 text-[11px] text-white/25">
                                                                <ImageIcon size={12} /> Sem imagem de documento
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        )
                                    )}

                                    {/* ── RESERVAS ───────────────────────── */}
                                    {activeTab === 'reservas' && (
                                        modalData.reservas.length === 0 ? (
                                            <div className="text-center py-14 text-white/30">
                                                <Calendar size={36} className="mx-auto mb-3 opacity-30" />
                                                <p className="text-sm">Sem reservas registadas</p>
                                            </div>
                                        ) : (
                                            <div className="flex flex-col gap-3">
                                                {modalData.reservas.map(r => (
                                                    <div key={r.id} className="bg-white/3 border border-white/5 rounded-xl p-4">
                                                        <div className="flex items-start justify-between gap-2 mb-2">
                                                            <div className="flex items-center gap-2 flex-wrap">
                                                                {r.numero_reserva && (
                                                                    <span className="text-[10px] font-mono text-[#C4A484]">#{r.numero_reserva}</span>
                                                                )}
                                                                {r.status && (
                                                                    <span className={`text-[9px] uppercase tracking-widest font-semibold px-2 py-0.5 rounded-full ${statusColor[r.status] || 'bg-white/10 text-white/40'}`}>
                                                                        {r.status}
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <p className="text-[#C4A484] font-semibold text-sm flex-shrink-0">{fmtMoney(r.valor_total)}</p>
                                                        </div>
                                                        <p className="text-white text-sm font-medium mb-1">{r.quarto?.nome || '—'}</p>
                                                        <p className="text-[11px] text-white/40">
                                                            {fmt(r.data_check_in)} → {fmt(r.data_check_out)}
                                                        </p>
                                                        {r.canal?.nome_canal && (
                                                            <p className="text-[10px] text-white/25 mt-1">{r.canal.nome_canal}</p>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        )
                                    )}
                                </div>
                            </>
                        ) : null}
                    </div>
                </div>
            )}

            {/* ══════════════════════════════════════════════════════════
                DELETE CONFIRMATION (RGPD)
            ═══════════════════════════════════════════════════════════ */}
            {deleteTarget && (
                <div
                    className="fixed inset-0 z-[300] flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm"
                    onClick={() => { if (!deleting) setDeleteTarget(null); }}
                >
                    <div
                        className="bg-[#1a1a1a] border border-red-500/20 w-full sm:max-w-md sm:mx-4 sm:rounded-2xl rounded-t-2xl p-6 shadow-2xl"
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Drag handle */}
                        <div className="sm:hidden flex justify-center mb-4">
                            <div className="w-10 h-1 rounded-full bg-white/20" />
                        </div>

                        <div className="flex items-start gap-4 mb-5">
                            <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center flex-shrink-0">
                                <AlertTriangle size={20} className="text-red-400" />
                            </div>
                            <div>
                                <h3 className="text-white font-semibold mb-1 text-base">Eliminar dados do hóspede</h3>
                                <p className="text-sm text-white/50 leading-relaxed">
                                    Vai eliminar <strong className="text-white">permanentemente</strong> todos os dados de{' '}
                                    <strong className="text-red-400">{deleteTarget.nome} {deleteTarget.sobrenome || ''}</strong>,
                                    incluindo reservas e documentos AIMA.
                                </p>
                            </div>
                        </div>

                        <div className="bg-red-500/5 border border-red-500/15 rounded-xl px-4 py-3 mb-5">
                            <p className="text-[10px] text-red-400 uppercase tracking-widest font-semibold mb-1">RGPD</p>
                            <p className="text-[11px] text-white/40 leading-relaxed">Esta operação não pode ser revertida. Guarde o comprovativo do pedido de eliminação.</p>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setDeleteTarget(null)}
                                disabled={deleting}
                                className="flex-1 py-3 border border-white/10 rounded-xl text-[11px] uppercase tracking-widest text-white/60 hover:text-white hover:border-white/30 transition-all disabled:opacity-40 cursor-pointer"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={confirmDelete}
                                disabled={deleting}
                                className="flex-1 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl text-[11px] uppercase tracking-widest font-bold transition-all disabled:opacity-60 cursor-pointer flex items-center justify-center gap-2"
                            >
                                {deleting
                                    ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    : <><Trash2 size={13} /> Eliminar</>}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

/* ─── InfoField ──────────────────────────────────────────────────────────── */
function InfoField({ icon, label, value }: { icon: React.ReactNode; label: string; value?: string | null }) {
    if (!value) return null;
    return (
        <div className="flex flex-col gap-1">
            <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-white/25">
                {icon} {label}
            </div>
            <p className="text-sm text-white/80 break-all">{value}</p>
        </div>
    );
}
