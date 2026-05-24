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
    const handleSearch = () => {
        setPage(1);
        setQuery(inputVal.trim());
    };

    const handleSearchKey = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') handleSearch();
    };

    const clearSearch = () => {
        setInputVal('');
        setPage(1);
        setQuery('');
    };

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
        } catch (e) { alert('Erro de conexão'); }
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
            <main className="flex-1 md:ml-20 pb-24 md:pb-0">
                {/* Header */}
                <div className="sticky top-0 z-30 bg-[#0f1a17]/95 backdrop-blur border-b border-white/5 px-6 py-4 flex items-center justify-between">
                    <div>
                        <h1 className="text-lg font-semibold text-white">Hóspedes</h1>
                        <p className="text-[11px] text-white/40 mt-0.5">{total} registos encontrados</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="relative">
                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
                            <input
                                type="text"
                                value={inputVal}
                                onChange={e => setInputVal(e.target.value)}
                                onKeyDown={handleSearchKey}
                                placeholder="Nome, telefone, e-mail..."
                                className="bg-white/5 border border-white/10 rounded-xl pl-9 pr-9 py-2 text-sm text-white placeholder-white/20 focus:outline-none focus:border-[#C4A484]/50 w-56 md:w-72"
                            />
                            {inputVal && (
                                <button onClick={clearSearch} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white cursor-pointer">
                                    <X size={12} />
                                </button>
                            )}
                        </div>
                        <button
                            onClick={handleSearch}
                            className="bg-[#C4A484] text-[#1E3932] px-4 py-2 rounded-xl text-[11px] font-bold uppercase tracking-widest hover:bg-white transition-colors cursor-pointer"
                        >
                            Buscar
                        </button>
                    </div>
                </div>

                {/* Table */}
                <div className="px-4 md:px-6 py-6">
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
                                            <tr key={h.id} className="hover:bg-white/2 transition-colors group">
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

                            {/* Mobile cards */}
                            <div className="md:hidden flex flex-col gap-3">
                                {hospedes.map(h => (
                                    <div key={h.id} className="bg-white/3 border border-white/5 rounded-2xl p-4">
                                        <div className="flex items-start justify-between gap-3 mb-3">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-full bg-[#C4A484]/10 flex items-center justify-center flex-shrink-0">
                                                    <span className="text-[#C4A484] text-sm font-serif font-semibold">
                                                        {(h.nome || '?')[0].toUpperCase()}
                                                    </span>
                                                </div>
                                                <div>
                                                    <p className="font-medium text-white text-sm">{h.nome} {h.sobrenome || ''}</p>
                                                    <p className="text-[11px] text-white/30">{fmt(h.criado_em)}</p>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => openModal(h)}
                                                className="flex-shrink-0 inline-flex items-center gap-1 text-[10px] uppercase tracking-widest text-[#C4A484] border border-[#C4A484]/30 px-2.5 py-1.5 rounded-lg cursor-pointer"
                                            >
                                                <Eye size={11} /> Ver
                                            </button>
                                        </div>
                                        <div className="flex flex-col gap-1 text-[11px] text-white/40">
                                            {h.telefone && <span className="flex items-center gap-1.5"><Phone size={10} /> {h.telefone}</span>}
                                            {h.email    && <span className="flex items-center gap-1.5"><Mail size={10} /> {h.email}</span>}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Pagination */}
                            {pages > 1 && (
                                <div className="mt-6 flex items-center justify-center gap-2">
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
                    className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
                    onClick={() => { if (!modalLoading) setModalData(null); }}
                >
                    <div
                        className="relative bg-[#1a2e27] border border-white/8 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl"
                        onClick={e => e.stopPropagation()}
                    >
                        {modalLoading ? (
                            <div className="flex items-center justify-center py-24">
                                <div className="w-8 h-8 border-2 border-[#C4A484]/30 border-t-[#C4A484] rounded-full animate-spin" />
                            </div>
                        ) : modalData ? (
                            <>
                                {/* Modal header */}
                                <div className="flex items-start justify-between px-6 py-5 border-b border-white/5 flex-shrink-0">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-full bg-[#C4A484]/10 flex items-center justify-center flex-shrink-0">
                                            {modalData.hospede.foto_perfil ? (
                                                <img src={modalData.hospede.foto_perfil} alt="" className="w-full h-full object-cover rounded-full" />
                                            ) : (
                                                <span className="text-[#C4A484] text-xl font-serif font-semibold">
                                                    {(modalData.hospede.nome || '?')[0].toUpperCase()}
                                                </span>
                                            )}
                                        </div>
                                        <div>
                                            <h2 className="font-semibold text-white text-lg">
                                                {modalData.hospede.nome} {modalData.hospede.sobrenome || ''}
                                            </h2>
                                            <p className="text-[11px] text-white/40 mt-0.5">
                                                Registado em {fmt(modalData.hospede.criado_em)}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => setDeleteTarget(modalData.hospede)}
                                            className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-red-400 border border-red-400/30 hover:bg-red-400/10 px-3 py-1.5 rounded-lg transition-all cursor-pointer"
                                            title="Eliminar dados (RGPD)"
                                        >
                                            <Trash2 size={12} /> Eliminar (RGPD)
                                        </button>
                                        <button
                                            onClick={() => setModalData(null)}
                                            className="w-8 h-8 flex items-center justify-center text-white/30 hover:text-white hover:bg-white/5 rounded-lg transition-all cursor-pointer"
                                        >
                                            <X size={16} />
                                        </button>
                                    </div>
                                </div>

                                {/* Tabs */}
                                <div className="flex gap-1 px-6 py-3 border-b border-white/5 flex-shrink-0">
                                    {(['perfil', 'documentos', 'reservas'] as const).map(tab => (
                                        <button
                                            key={tab}
                                            onClick={() => setActiveTab(tab)}
                                            className={`px-4 py-1.5 rounded-lg text-[11px] uppercase tracking-widest font-medium transition-all cursor-pointer ${
                                                activeTab === tab
                                                    ? 'bg-[#C4A484] text-[#1E3932]'
                                                    : 'text-white/40 hover:text-white hover:bg-white/5'
                                            }`}
                                        >
                                            {tab === 'perfil' ? 'Perfil' : tab === 'documentos' ? `Documentos (${modalData.aimaHospedes.length})` : `Reservas (${modalData.reservas.length})`}
                                        </button>
                                    ))}
                                </div>

                                {/* Tab content */}
                                <div className="flex-1 overflow-y-auto p-6">

                                    {/* ── PERFIL ─────────────────────────────────── */}
                                    {activeTab === 'perfil' && (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <InfoField icon={<Mail size={13} />}    label="E-mail"       value={modalData.hospede.email} />
                                            <InfoField icon={<Phone size={13} />}   label="Telefone"     value={modalData.hospede.telefone} />
                                            <InfoField icon={<Globe size={13} />}   label="País"         value={modalData.hospede.pais} />
                                            <InfoField icon={<Building size={13} />} label="Cidade"      value={modalData.hospede.cidade} />
                                            <InfoField icon={<Home size={13} />}    label="Endereço"     value={modalData.hospede.endereco1} />
                                            <InfoField icon={<Home size={13} />}    label="Endereço 2"   value={modalData.hospede.endereco2} />
                                            <InfoField icon={<MapPin size={13} />}  label="Código Postal" value={modalData.hospede.cep} />
                                            <InfoField icon={<Calendar size={13} />} label="Nascimento"  value={modalData.hospede.data_nascimento} />
                                            <InfoField icon={<MapPin size={13} />}  label="Local Nasc."  value={modalData.hospede.local_nascimento} />
                                            <InfoField icon={<Globe size={13} />}   label="Nacionalidade" value={modalData.hospede.nacionalidade} />
                                            <InfoField icon={<FileText size={13} />} label="Tipo Doc."   value={modalData.hospede.tipo_documento} />
                                            <InfoField icon={<FileText size={13} />} label="Nº Documento" value={modalData.hospede.numero_documento} />
                                            <InfoField icon={<Globe size={13} />}   label="País Emissor" value={modalData.hospede.pais_emissor_documento} />
                                            <InfoField icon={<CreditCard size={13} />} label="NIF"       value={modalData.hospede.nif} />
                                            <InfoField icon={<FileText size={13} />} label="Passaporte"  value={modalData.hospede.passaporte} />
                                            <InfoField icon={<Clock size={13} />}   label="Atualizado"   value={fmt(modalData.hospede.atualizado_em)} />
                                            {modalData.hospede.estrangeiro !== undefined && (
                                                <InfoField icon={<Globe size={13} />} label="Estrangeiro" value={modalData.hospede.estrangeiro ? 'Sim' : 'Não'} />
                                            )}
                                            {/* Doc image */}
                                            {modalData.hospede.documento_imagem_url && (
                                                <div className="sm:col-span-2 mt-2">
                                                    <p className="text-[10px] uppercase tracking-widest text-white/30 mb-2">Documento (Perfil)</p>
                                                    <a href={modalData.hospede.documento_imagem_url} target="_blank" rel="noreferrer">
                                                        <img
                                                            src={modalData.hospede.documento_imagem_url}
                                                            alt="Documento"
                                                            className="max-h-48 rounded-xl border border-white/10 object-contain cursor-pointer hover:opacity-80 transition-opacity"
                                                        />
                                                    </a>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* ── DOCUMENTOS ─────────────────────────────── */}
                                    {activeTab === 'documentos' && (
                                        modalData.aimaHospedes.length === 0 ? (
                                            <div className="text-center py-16 text-white/30">
                                                <ImageIcon size={36} className="mx-auto mb-3 opacity-30" />
                                                <p className="text-sm">Sem documentos AIMA registados</p>
                                            </div>
                                        ) : (
                                            <div className="flex flex-col gap-6">
                                                {modalData.aimaHospedes.map((aima, i) => (
                                                    <div key={aima.id} className="bg-white/3 border border-white/5 rounded-xl p-4">
                                                        <div className="flex items-center gap-2 mb-3">
                                                            <span className="text-[10px] uppercase tracking-widest text-[#C4A484] font-semibold">
                                                                Hóspede #{(aima.ordem ?? i) + 1}
                                                            </span>
                                                            {aima.reserva_id && (
                                                                <span className="text-[10px] text-white/25">
                                                                    · Reserva {aima.reserva_id.slice(0, 8)}…
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
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
                                                                    className="max-h-48 rounded-xl border border-white/10 object-contain cursor-pointer hover:opacity-80 transition-opacity"
                                                                />
                                                            </a>
                                                        ) : (
                                                            <div className="flex items-center gap-2 text-[11px] text-white/25 mt-1">
                                                                <ImageIcon size={12} /> Sem imagem de documento
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        )
                                    )}

                                    {/* ── RESERVAS ──────────────────────────────── */}
                                    {activeTab === 'reservas' && (
                                        modalData.reservas.length === 0 ? (
                                            <div className="text-center py-16 text-white/30">
                                                <Calendar size={36} className="mx-auto mb-3 opacity-30" />
                                                <p className="text-sm">Sem reservas registadas</p>
                                            </div>
                                        ) : (
                                            <div className="flex flex-col gap-3">
                                                {modalData.reservas.map(r => (
                                                    <div key={r.id} className="bg-white/3 border border-white/5 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                                        <div>
                                                            <div className="flex items-center gap-2 mb-1">
                                                                {r.numero_reserva && (
                                                                    <span className="text-[10px] font-mono text-[#C4A484]">#{r.numero_reserva}</span>
                                                                )}
                                                                {r.status && (
                                                                    <span className={`text-[9px] uppercase tracking-widest font-semibold px-2 py-0.5 rounded-full ${statusColor[r.status] || 'bg-white/10 text-white/40'}`}>
                                                                        {r.status}
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <p className="text-white text-sm font-medium">{r.quarto?.nome || '—'}</p>
                                                            <p className="text-[11px] text-white/40 mt-0.5">
                                                                {fmt(r.data_check_in)} → {fmt(r.data_check_out)}
                                                            </p>
                                                            {r.canal?.nome_canal && (
                                                                <p className="text-[10px] text-white/25 mt-0.5">{r.canal.nome_canal}</p>
                                                            )}
                                                        </div>
                                                        <div className="text-right flex-shrink-0">
                                                            <p className="text-[#C4A484] font-semibold">{fmtMoney(r.valor_total)}</p>
                                                            <p className="text-[10px] text-white/25">{fmt(r.criado_em)}</p>
                                                        </div>
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
                    className="fixed inset-0 z-[300] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm"
                    onClick={() => { if (!deleting) setDeleteTarget(null); }}
                >
                    <div
                        className="bg-[#1a1a1a] border border-red-500/20 rounded-2xl p-8 max-w-md w-full shadow-2xl"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="flex items-start gap-4 mb-6">
                            <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center flex-shrink-0">
                                <AlertTriangle size={20} className="text-red-400" />
                            </div>
                            <div>
                                <h3 className="text-white font-semibold mb-1">Eliminar dados do hóspede</h3>
                                <p className="text-sm text-white/50 leading-relaxed">
                                    Esta ação irá eliminar <strong className="text-white">permanentemente</strong> todos os dados de{' '}
                                    <strong className="text-red-400">{deleteTarget.nome} {deleteTarget.sobrenome || ''}</strong>,
                                    incluindo reservas e documentos AIMA. Esta operação <strong className="text-white">não pode ser revertida</strong>.
                                </p>
                            </div>
                        </div>

                        <div className="bg-red-500/5 border border-red-500/15 rounded-xl px-4 py-3 mb-6">
                            <p className="text-[11px] text-red-400 uppercase tracking-widest font-semibold mb-1">Regulamento RGPD</p>
                            <p className="text-[12px] text-white/40">Ao eliminar, o hóspede não poderá recuperar os seus dados. Certifique-se de que tem documentação do pedido de eliminação.</p>
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
                                {deleting ? (
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <><Trash2 size={13} /> Eliminar definitivamente</>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

/* ─── Small helper component ─────────────────────────────────────────────── */
function InfoField({
    icon, label, value
}: { icon: React.ReactNode; label: string; value?: string | null }) {
    if (!value) return null;
    return (
        <div className="flex flex-col gap-1">
            <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-white/25">
                {icon} {label}
            </div>
            <p className="text-sm text-white/80 break-words">{value}</p>
        </div>
    );
}
