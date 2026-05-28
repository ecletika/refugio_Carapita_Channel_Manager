"use client";
import React, { useState, useEffect, useRef } from 'react';
import {
    Plus, Trash2, Edit2, CircleCheck, CircleX, RefreshCw,
    Upload, Euro, Users, Home, Camera, X, ChevronLeft, ChevronRight, Loader2
} from 'lucide-react';
import AdminSidebar from '@/components/AdminSidebar';
import { AdminExtrasContent } from './ExtrasContent';

const EDGE_URL = 'https://vuidkeygtxfbgxvmilya.supabase.co/functions/v1';

interface Quarto {
    id: string;
    nome: string;
    tipo: string;
    descricao: string;
    capacidade: number;
    preco_base: number;
    tarifa_semana?: number;
    tarifa_fds?: number;
    fotos: string;
    comodidades: string;
    video_url?: string;
    ical_url: string;
    ativo: boolean;
    minima_estadia_padrao: number;
}

export interface FotoObj { url: string; category: string; isMain: boolean; }

function parseFotos(fotos: string | undefined): FotoObj[] {
    if (!fotos) return [];
    try {
        const parsed = JSON.parse(fotos);
        if (Array.isArray(parsed)) {
            return parsed.map((item, i) =>
                typeof item === 'string'
                    ? { url: item, category: 'Quarto', isMain: i === 0 }
                    : { ...item, category: item.category || 'Quarto', isMain: item.isMain || false }
            );
        }
        return [{ url: fotos, category: 'Quarto', isMain: true }];
    } catch { return fotos ? [{ url: fotos, category: 'Quarto', isMain: true }] : []; }
}

function parseComodidades(c: string | undefined): string[] {
    if (!c) return [];
    try { return JSON.parse(c); } catch { return []; }
}

function serializeFotos(arr: FotoObj[]): string { return JSON.stringify(arr); }

// ── Consistent button atoms ─────────────────────────────────────────────────
const BtnPrimary = ({ onClick, children, type = 'button', disabled = false, className = '' }: any) => (
    <button type={type} onClick={onClick} disabled={disabled}
        className={`flex items-center gap-2 bg-[#1E3932] text-[#C4A484] px-5 py-2.5 text-[10px] uppercase tracking-widest font-bold hover:bg-[#C4A484] hover:text-white transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer min-h-[44px] ${className}`}>
        {children}
    </button>
);

const BtnSecondary = ({ onClick, children, type = 'button', className = '' }: any) => (
    <button type={type} onClick={onClick}
        className={`flex items-center gap-2 border border-[#1E3932] text-[#1E3932] px-5 py-2.5 text-[10px] uppercase tracking-widest font-bold hover:bg-[#1E3932] hover:text-white transition-all duration-300 cursor-pointer min-h-[44px] ${className}`}>
        {children}
    </button>
);

const BtnIcon = ({ onClick, title, children, variant = 'default' }: any) => {
    const cls = variant === 'danger'
        ? 'text-red-400 hover:bg-red-500 hover:text-white border-red-100'
        : variant === 'gold'
            ? 'text-[#C4A484] hover:bg-[#C4A484] hover:text-white border-[#C4A484]/20'
            : 'text-gray-500 hover:bg-[#1E3932] hover:text-white border-gray-100';
    return (
        <button type="button" onClick={onClick} title={title}
            className={`w-10 h-10 flex items-center justify-center border rounded transition-all duration-200 cursor-pointer ${cls}`}>
            {children}
        </button>
    );
};

// ── Category label (replaces emojis) ────────────────────────────────────────
const CAT_LABELS: Record<string, string> = {
    'Camas & Quartos': 'Camas & Quartos',
    'Sala de estar': 'Sala de Estar',
    'Espaço & Área': 'Espaço & Área',
    'Comodidades': 'Comodidades',
    'Casa de Banho': 'Casa de Banho',
    'Serviços': 'Serviços',
    'Políticas': 'Políticas',
};

export default function AdminQuartos() {
    const [quartos, setQuartos] = useState<Quarto[]>([]);
    const [loading, setLoading] = useState(true);
    const [editQuarto, setEditQuarto] = useState<Partial<Quarto> | null>(null);
    const [fotosEdit, setFotosEdit] = useState<FotoObj[]>([]);
    const [comodidadesEdit, setComodidadesEdit] = useState<string[]>([]);
    const [customComodidade, setCustomComodidade] = useState('');
    const [urlInput, setUrlInput] = useState('');
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [lightbox, setLightbox] = useState<{ fotos: string[]; index: number } | null>(null);
    const [savingId, setSavingId] = useState<string | null>(null);

    const [allComodidades, setAllComodidades] = useState<{ id: string; nome: string; categoria: string; icone: string }[]>([]);
    const [newComodidadeCat, setNewComodidadeCat] = useState('Comodidades');
    const [loadingGlobal, setLoadingGlobal] = useState(true);

    const normalize = (s: string) => s.trim().toLowerCase();
    const isGlobalMatch = (s: string) => allComodidades.some(c => normalize(c.nome) === normalize(s));

    const fetchComodidades = async () => {
        setLoadingGlobal(true);
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
        try {
            const resp = await fetch(`${EDGE_URL}/admin-comodidades`, { headers: { 'Authorization': `Bearer ${token}` } });
            const data = await resp.json();
            if (data.status === 'success') setAllComodidades(data.data);
        } catch (e) { console.error(e); }
        finally { setLoadingGlobal(false); }
    };

    const fetchQuartos = async () => {
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
        try {
            const resp = await fetch(`${EDGE_URL}/admin-quartos`, { headers: { 'Authorization': `Bearer ${token}` } });
            const data = await resp.json();
            if (data.status === 'success') setQuartos(data.data);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchQuartos(); fetchComodidades(); }, []);

    const openEdit = (q?: Partial<Quarto>) => {
        const quarto = q || { nome: '', tipo: 'Quarto', descricao: '', capacidade: 2, preco_base: 100, tarifa_semana: 100, tarifa_fds: 120, ativo: true, minima_estadia_padrao: 2 };
        setEditQuarto(quarto);
        setFotosEdit(parseFotos(quarto.fotos));
        setComodidadesEdit(parseComodidades(quarto.comodidades));
        setCustomComodidade('');
        setUrlInput('');
    };

    const addUrlFoto = () => {
        const trimmed = urlInput.trim();
        if (!trimmed) return;
        setFotosEdit(prev => [...prev, { url: trimmed, category: 'Quarto', isMain: prev.length === 0 }]);
        setUrlInput('');
    };

    const toggleComodidade = (item: string) =>
        setComodidadesEdit(prev => {
            const n = normalize(item);
            return prev.some(c => normalize(c) === n) ? prev.filter(c => normalize(c) !== n) : [...prev, item];
        });

    const addCustomComodidade = async () => {
        const trimmed = customComodidade.trim();
        if (!trimmed) return;
        let cat = newComodidadeCat;
        if (cat === 'NOVA') {
            const nc = prompt("Nova categoria (ex: Sala de jantar):");
            if (!nc) return;
            cat = nc;
            setNewComodidadeCat(nc);
        }
        if (comodidadesEdit.some(c => normalize(c) === normalize(trimmed))) { setCustomComodidade(''); return; }
        if (!allComodidades.find(c => normalize(c.nome) === normalize(trimmed))) {
            const token = localStorage.getItem('token');
            try {
                const resp = await fetch(`${EDGE_URL}/admin-comodidades`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                    body: JSON.stringify({ nome: trimmed, categoria: cat })
                });
                if (resp.ok) await fetchComodidades();
            } catch (e) { console.error(e); }
        }
        setComodidadesEdit(prev => [...prev, trimmed]);
        setCustomComodidade('');
    };

    const registerGlobally = async (nome: string) => {
        const cat = prompt(`Categoria para "${nome}":`, "Comodidades");
        if (!cat) return;
        const token = localStorage.getItem('token');
        try {
            await fetch(`${EDGE_URL}/admin-comodidades`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ nome, categoria: cat })
            });
            await fetchComodidades();
        } catch { alert("Erro de conexão."); }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (!files.length) return;
        setUploading(true);
        const token = localStorage.getItem('token');
        const newUrls: string[] = [];
        for (const file of files) {
            const formData = new FormData();
            formData.append('foto', file);
            try {
                const resp = await fetch(`${EDGE_URL}/upload`, { method: 'POST', headers: { 'Authorization': `Bearer ${token}` }, body: formData });
                const data = await resp.json();
                if (data.url) newUrls.push(data.url);
            } catch { alert(`Erro ao fazer upload de ${file.name}`); }
        }
        setFotosEdit(prev => [...prev, ...newUrls.map((url, i) => ({ url, category: 'Quarto', isMain: prev.length === 0 && i === 0 }))]);
        setUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const removeFoto = (idx: number) => setFotosEdit(prev => prev.filter((_, i) => i !== idx));

    const handleToggleAtivo = async (q: Quarto) => {
        setSavingId(q.id);
        const token = localStorage.getItem('token');
        try {
            await fetch(`${EDGE_URL}/admin-quartos/${q.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ nome: q.nome, tipo: q.tipo, descricao: q.descricao, capacidade: q.capacidade, precoBase: q.preco_base, fotos: q.fotos, comodidades: q.comodidades, ativo: !q.ativo, videoUrl: q.video_url, icalUrl: q.ical_url })
            });
            fetchQuartos();
        } catch { console.error("Erro ao alternar status"); }
        finally { setSavingId(null); }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        const token = localStorage.getItem('token');
        const method = editQuarto?.id ? 'PUT' : 'POST';
        const url = editQuarto?.id ? `${EDGE_URL}/admin-quartos/${editQuarto.id}` : `${EDGE_URL}/admin-quartos`;
        try {
            const resp = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({
                    nome: editQuarto?.nome, tipo: editQuarto?.tipo, descricao: editQuarto?.descricao,
                    capacidade: editQuarto?.capacidade, precoBase: editQuarto?.preco_base,
                    tarifaSemana: editQuarto?.tarifa_semana, tarifaFds: editQuarto?.tarifa_fds,
                    fotos: serializeFotos(fotosEdit), comodidades: JSON.stringify(comodidadesEdit),
                    ativo: editQuarto?.ativo, videoUrl: editQuarto?.video_url,
                    icalUrl: editQuarto?.ical_url, minimaEstadiaPadrao: editQuarto?.minima_estadia_padrao
                })
            });
            if (resp.ok) { setEditQuarto(null); fetchQuartos(); }
            else alert('Erro ao gravar. Verifique se está autenticado.');
        } catch { alert("Erro ao salvar alojamento"); }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Apagar este alojamento? Todos os dados associados serão perdidos.")) return;
        const token = localStorage.getItem('token');
        try {
            await fetch(`${EDGE_URL}/admin-quartos/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
            fetchQuartos();
        } catch { alert("Erro ao apagar"); }
    };

    const handleSync = async (id: string) => {
        const token = localStorage.getItem('token');
        const quarto = quartos.find(q => q.id === id);
        try {
            const resp = await fetch(`${EDGE_URL}/sync-ical`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ quartoId: id, url: quarto?.ical_url })
            });
            const data = await resp.json();
            alert(data.message || "Sincronização concluída");
        } catch { alert("Erro ao sincronizar"); }
    };

    if (loading) return (
        <div className="min-h-screen bg-[#F9F8F6] flex items-center justify-center">
            <div className="text-center">
                <div className="w-8 h-8 border-2 border-[#C4A484] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="text-[10px] uppercase tracking-widest text-gray-600">A carregar o inventário...</p>
            </div>
        </div>
    );

    // ── Unique categories list ────────────────────────────────────────────────
    const defaultCats = ['Camas & Quartos', 'Sala de estar', 'Espaço & Área', 'Comodidades', 'Casa de Banho', 'Serviços', 'Políticas'];
    const allCats = Array.from(new Set([...defaultCats, ...allComodidades.map(c => c.categoria)]));

    return (
        <div className="min-h-screen bg-[#F9F8F6]">
            <AdminSidebar />

            <div className="ml-0 md:ml-20 p-4 md:p-8 lg:p-12 max-w-6xl mx-auto pb-24 md:pb-8">

                {/* Page Header */}
                <div className="mb-8 md:mb-12">
                    <span className="text-[#C4A484] text-[10px] uppercase tracking-widest font-bold block mb-1">Inventário Global</span>
                    <h1 className="text-3xl md:text-4xl font-serif text-[#1E3932]">Alojamento & Extras</h1>
                    <p className="text-sm text-gray-600 mt-2 font-light">Gerencie os alojamentos e os serviços adicionais disponíveis.</p>
                </div>

                {/* ── ALOJAMENTOS ── */}
                <section className="mb-16">
                    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
                        <div>
                            <span className="text-[#C4A484] text-[10px] uppercase tracking-widest font-bold block mb-0.5">Configurações</span>
                            <h2 className="text-2xl md:text-3xl font-serif text-[#1E3932] font-light">Gestão de Alojamento</h2>
                        </div>
                        <BtnPrimary onClick={() => openEdit()}>
                            <Plus size={14} /> Novo Alojamento
                        </BtnPrimary>
                    </div>

                    <div className="flex flex-col gap-3">
                        {quartos.map(q => {
                            const fotos = parseFotos(q.fotos);
                            const mainFoto = fotos.find(f => f.isMain)?.url || fotos[0]?.url || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=80';
                            return (
                                <div key={q.id} className="bg-white border border-gray-100 rounded-lg overflow-hidden hover:shadow-md transition-shadow duration-300">

                                    {/* Card content: stacks on mobile, row on sm+ */}
                                    <div className="flex flex-col sm:flex-row sm:items-center">

                                        {/* Thumbnail */}
                                        <div
                                            className="w-full sm:w-28 h-44 sm:h-24 shrink-0 bg-gray-100 relative overflow-hidden cursor-pointer group"
                                            onClick={() => { if (fotos.length > 0) setLightbox({ fotos: fotos.map(f => f.url), index: 0 }); }}
                                        >
                                            <img src={mainFoto} alt={q.nome} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                                                <Camera size={18} className="text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-md" />
                                            </div>
                                            {fotos.length > 1 && (
                                                <div className="absolute bottom-2 right-2 bg-black/70 text-white text-[9px] px-2 py-0.5 rounded font-bold">
                                                    +{fotos.length - 1}
                                                </div>
                                            )}
                                        </div>

                                        {/* Info */}
                                        <div className="flex-1 p-4 sm:px-5 sm:py-3 min-w-0">
                                            {/* Title row */}
                                            <div className="flex flex-wrap items-center gap-2 mb-1.5">
                                                <h3 className="font-serif text-lg text-[#1E3932] leading-tight">{q.nome}</h3>
                                                <span className="text-[9px] uppercase tracking-widest bg-gray-50 border border-gray-200 text-gray-500 px-2 py-0.5 rounded">{q.tipo}</span>
                                                <button
                                                    type="button"
                                                    onClick={() => handleToggleAtivo(q)}
                                                    disabled={savingId === q.id}
                                                    title={q.ativo ? "Clique para desativar" : "Clique para ativar"}
                                                    className={`text-[9px] uppercase tracking-widest font-bold flex items-center gap-1 transition-all cursor-pointer rounded px-2 py-0.5 border
                                                        ${q.ativo
                                                            ? 'bg-green-50 text-green-600 border-green-100 hover:bg-red-50 hover:text-red-500 hover:border-red-100'
                                                            : 'bg-red-50 text-red-500 border-red-100 hover:bg-green-50 hover:text-green-600 hover:border-green-100'}`}
                                                >
                                                    {savingId === q.id ? <Loader2 size={10} className="animate-spin" /> : q.ativo ? <CircleCheck size={10} /> : <CircleX size={10} />}
                                                    {q.ativo ? 'Ativo' : 'Inativo'}
                                                </button>
                                            </div>

                                            {/* Description */}
                                            <p className="text-xs text-gray-600 line-clamp-1 mb-2 leading-relaxed">{q.descricao}</p>

                                            {/* Stats - wraps naturally on mobile */}
                                            <div className="flex flex-wrap gap-3">
                                                <StatChip icon={<Users size={11} className="text-[#C4A484]" />} label={`${q.capacidade} hóspedes`} />
                                                <StatChip icon={<Euro size={11} className="text-[#C4A484]" />} label={`€${q.preco_base} / noite`} />
                                                <StatChip icon={<Home size={11} className="text-[#C4A484]" />} label={`Min ${q.minima_estadia_padrao || 2} noites`} />
                                                {q.ical_url && <StatChip icon={<RefreshCw size={11} className="text-blue-400" />} label="iCal Sync" className="text-blue-500" />}
                                            </div>
                                        </div>

                                        {/* Actions: horizontal bar on mobile, vertical on sm+ */}
                                        <div className="border-t sm:border-t-0 sm:border-l border-gray-100 flex sm:flex-col items-center justify-around sm:justify-center gap-1 p-3 sm:px-4 sm:py-3 shrink-0">
                                            <BtnIcon onClick={() => handleSync(q.id)} title="Sincronizar iCal" variant="gold">
                                                <RefreshCw size={14} />
                                            </BtnIcon>
                                            <BtnIcon onClick={() => openEdit(q)} title="Editar alojamento">
                                                <Edit2 size={14} />
                                            </BtnIcon>
                                            <BtnIcon onClick={() => handleDelete(q.id)} title="Remover alojamento" variant="danger">
                                                <Trash2 size={14} />
                                            </BtnIcon>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}

                        {quartos.length === 0 && (
                            <div className="flex flex-col items-center justify-center py-16 bg-white border border-dashed border-gray-200 rounded-lg gap-3">
                                <Home size={32} className="text-gray-200" />
                                <p className="text-sm text-gray-600">Nenhum alojamento registado.</p>
                                <BtnPrimary onClick={() => openEdit()}>
                                    <Plus size={12} /> Adicionar Alojamento
                                </BtnPrimary>
                            </div>
                        )}
                    </div>
                </section>

                {/* ── EXTRAS ── */}
                <section>
                    <AdminExtrasContent />
                </section>
            </div>

            {/* ── Modal de Edição ──────────────────────────────────────────────────── */}
            {editQuarto && (
                <div className="fixed inset-0 z-[100] flex justify-end">
                    <div className="absolute inset-0 bg-[#1E3932]/60 backdrop-blur-sm" onClick={() => setEditQuarto(null)} />
                    <div className="relative bg-white w-full max-w-[560px] h-full z-10 shadow-2xl flex flex-col">

                        {/* Modal Header */}
                        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between shrink-0">
                            <div>
                                <span className="text-[#C4A484] text-[9px] uppercase tracking-widest font-bold block mb-0.5">Inventário</span>
                                <h2 className="text-xl font-serif text-[#1E3932]">
                                    {editQuarto.id ? 'Editar Alojamento' : 'Novo Alojamento'}
                                </h2>
                            </div>
                            <button type="button" onClick={() => setEditQuarto(null)}
                                className="p-2 text-gray-600 hover:text-[#1E3932] hover:bg-gray-50 rounded-full transition-colors cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center">
                                <X size={20} />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-6 pb-28">

                            {/* Basic Info */}
                            <fieldset className="space-y-5">
                                <ModalField label="Nome do Alojamento *">
                                    <input required value={editQuarto.nome || ''} onChange={e => setEditQuarto({ ...editQuarto, nome: e.target.value })}
                                        className="w-full border-b border-gray-200 focus:border-[#C4A484] pb-2 outline-none text-sm transition-colors text-[#1E3932] bg-transparent"
                                        placeholder="Ex: Suite Deluxe" />
                                </ModalField>

                                <div className="grid grid-cols-2 gap-5">
                                    <ModalField label="Tipo">
                                        <select value={editQuarto.tipo || 'Quarto'} onChange={e => setEditQuarto({ ...editQuarto, tipo: e.target.value })}
                                            className="w-full border-b border-gray-200 focus:border-[#C4A484] pb-2 outline-none text-sm bg-transparent text-[#1E3932] cursor-pointer">
                                            <option>Quarto</option><option>Suite</option><option>Casa</option><option>Cabana</option>
                                        </select>
                                    </ModalField>
                                    <ModalField label="Capacidade (hóspedes)">
                                        <input type="number" required min="1" value={editQuarto.capacidade || 2}
                                            onChange={e => setEditQuarto({ ...editQuarto, capacidade: parseInt(e.target.value) })}
                                            className="w-full border-b border-gray-200 focus:border-[#C4A484] pb-2 outline-none text-sm bg-transparent text-[#1E3932]" />
                                    </ModalField>
                                    <ModalField label="Preço Base (€)">
                                        <input type="number" required min="0" step="0.01" value={editQuarto.preco_base || 0}
                                            onChange={e => setEditQuarto({ ...editQuarto, preco_base: parseFloat(e.target.value) })}
                                            className="w-full border-b border-gray-200 focus:border-[#C4A484] pb-2 outline-none text-sm bg-transparent text-[#1E3932]" />
                                    </ModalField>
                                    <ModalField label="Mínimo Estadia (noites)">
                                        <input type="number" required min="1" value={editQuarto.minima_estadia_padrao || 2}
                                            onChange={e => setEditQuarto({ ...editQuarto, minima_estadia_padrao: parseInt(e.target.value) })}
                                            className="w-full border-b border-gray-200 focus:border-[#C4A484] pb-2 outline-none text-sm bg-transparent text-[#1E3932]" />
                                    </ModalField>
                                </div>

                                {/* ── Tarifas base diferenciadas ── */}
                                <div className="p-4 bg-[#1E3932]/5 border border-[#1E3932]/10 rounded-sm space-y-3">
                                    <p className="text-[9px] uppercase tracking-widest text-[#1E3932] font-bold flex items-center gap-2">
                                        <Euro size={11} className="text-[#C4A484]" />
                                        Tarifas Base por Dia da Semana
                                    </p>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <label className="text-[9px] uppercase tracking-widest text-gray-600 font-bold block">Semana (€/noite) *</label>
                                            <input type="number" required min="0" step="0.01"
                                                value={editQuarto.tarifa_semana ?? editQuarto.preco_base ?? 0}
                                                onChange={e => setEditQuarto({ ...editQuarto, tarifa_semana: parseFloat(e.target.value) || 0 })}
                                                className="w-full border-b border-gray-200 focus:border-[#C4A484] pb-2 outline-none text-sm bg-transparent text-[#1E3932]" />
                                            <span className="text-[9px] text-gray-400 block">Seg · Ter · Qua · Qui</span>
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[9px] uppercase tracking-widest text-gray-600 font-bold block">Fim de Semana (€/noite) *</label>
                                            <input type="number" required min="0" step="0.01"
                                                value={editQuarto.tarifa_fds ?? editQuarto.preco_base ?? 0}
                                                onChange={e => setEditQuarto({ ...editQuarto, tarifa_fds: parseFloat(e.target.value) || 0 })}
                                                className="w-full border-b border-gray-200 focus:border-[#C4A484] pb-2 outline-none text-sm bg-transparent text-[#1E3932]" />
                                            <span className="text-[9px] text-gray-400 block">Sex · Sáb · Dom</span>
                                        </div>
                                    </div>
                                    <p className="text-[9px] text-gray-400 italic">Usadas como referência nos preços por época (% automática).</p>
                                </div>

                                {/* Ativo toggle */}
                                <div className="flex items-center justify-between py-3 border-b border-gray-100">
                                    <span className="text-[10px] uppercase tracking-widest text-gray-600 font-bold">Visível no Site</span>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input type="checkbox" checked={!!editQuarto.ativo}
                                            onChange={e => setEditQuarto({ ...editQuarto, ativo: e.target.checked })}
                                            className="sr-only peer" />
                                        <div className="w-10 h-5 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#C4A484]"></div>
                                        <span className="ml-2 text-[10px] uppercase font-bold text-[#1E3932]">{editQuarto.ativo ? 'Sim' : 'Não'}</span>
                                    </label>
                                </div>

                                <ModalField label="URL iCal (Sincronização)">
                                    <input value={editQuarto.ical_url || ''} onChange={e => setEditQuarto({ ...editQuarto, ical_url: e.target.value })}
                                        className="w-full border-b border-gray-200 focus:border-[#C4A484] pb-2 outline-none text-sm text-[#1E3932] bg-transparent"
                                        placeholder="https://..." />
                                </ModalField>

                                <ModalField label="Link Vídeo Promocional">
                                    <input type="url" value={editQuarto.video_url || ''} onChange={e => setEditQuarto({ ...editQuarto, video_url: e.target.value })}
                                        className="w-full border-b border-gray-200 focus:border-[#C4A484] pb-2 outline-none text-sm text-[#1E3932] bg-transparent"
                                        placeholder="YouTube, Vimeo..." />
                                </ModalField>

                                <ModalField label="Descrição">
                                    <textarea rows={3} value={editQuarto.descricao || ''}
                                        onChange={e => setEditQuarto({ ...editQuarto, descricao: e.target.value })}
                                        className="w-full border border-gray-200 focus:border-[#C4A484] p-3 outline-none text-sm text-[#1E3932] bg-gray-50/50 rounded-lg resize-none transition-colors"
                                        placeholder="Detalhes do alojamento..." />
                                </ModalField>
                            </fieldset>

                            {/* Galeria de Fotos */}
                            <fieldset className="space-y-4 pt-5 border-t border-gray-100">
                                <legend className="text-[10px] uppercase tracking-widest text-gray-600 font-bold">
                                    Fotos ({fotosEdit.length})
                                </legend>

                                {fotosEdit.length > 0 && (
                                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                                        {fotosEdit.map((foto, idx) => (
                                            <div key={idx} className={`relative aspect-square group/foto rounded-lg overflow-hidden border-2 ${foto.isMain ? 'border-[#C4A484]' : 'border-gray-100'}`}>
                                                <img src={foto.url} className="w-full h-full object-cover" alt="" />
                                                {foto.isMain && (
                                                    <div className="absolute top-1 left-1 bg-[#C4A484] text-white text-[8px] px-1.5 py-0.5 rounded font-bold uppercase">
                                                        Capa
                                                    </div>
                                                )}
                                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover/foto:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1.5 p-2">
                                                    {!foto.isMain && (
                                                        <button type="button"
                                                            onClick={() => setFotosEdit(prev => prev.map((f, i) => ({ ...f, isMain: i === idx })))}
                                                            className="w-full py-1 bg-[#C4A484] text-white rounded text-[8px] uppercase tracking-widest font-bold">
                                                            Capa
                                                        </button>
                                                    )}
                                                    <select value={foto.category}
                                                        onChange={e => setFotosEdit(prev => prev.map((f, i) => i === idx ? { ...f, category: e.target.value } : f))}
                                                        className="w-full text-[9px] bg-white text-black p-1 rounded outline-none">
                                                        {['Quarto', 'Cozinha', 'Sala', 'Casa de Banho', 'Exterior', 'Outros'].map(c =>
                                                            <option key={c} value={c}>{c}</option>
                                                        )}
                                                    </select>
                                                    <button type="button" onClick={() => removeFoto(idx)}
                                                        className="p-1.5 bg-red-500 text-white rounded hover:bg-red-600 transition-colors">
                                                        <Trash2 size={11} />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                <div className="space-y-2">
                                    <div className="flex gap-2">
                                        <input type="url" value={urlInput}
                                            onChange={e => setUrlInput(e.target.value)}
                                            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addUrlFoto(); } }}
                                            placeholder="Colar link de imagem..."
                                            className="flex-1 border-b border-gray-200 focus:border-[#C4A484] pb-2 outline-none text-xs transition-colors text-[#1E3932] bg-transparent" />
                                        <button type="button" onClick={addUrlFoto}
                                            className="text-[#1E3932] font-bold text-[9px] uppercase tracking-widest hover:text-[#C4A484] transition-colors cursor-pointer">
                                            Adicionar
                                        </button>
                                    </div>

                                    <div onClick={() => fileInputRef.current?.click()}
                                        className="border border-dashed border-gray-200 hover:border-[#C4A484] p-4 text-center cursor-pointer rounded-lg flex justify-center items-center gap-2 transition-colors">
                                        <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleFileUpload} />
                                        {uploading
                                            ? <Loader2 size={14} className="text-[#C4A484] animate-spin" />
                                            : <Upload size={14} className="text-gray-500" />}
                                        <span className="text-[9px] uppercase tracking-widest text-gray-600">
                                            {uploading ? 'A enviar...' : 'Upload do dispositivo'}
                                        </span>
                                    </div>
                                </div>
                            </fieldset>

                            {/* Comodidades */}
                            <fieldset className="space-y-4 pt-5 border-t border-gray-100">
                                <div className="flex items-center justify-between flex-wrap gap-2">
                                    <legend className="text-[10px] uppercase tracking-widest text-gray-600 font-bold">
                                        Comodidades
                                    </legend>
                                    <span className="text-[8px] text-[#C4A484] uppercase font-bold px-2 py-0.5 bg-[#C4A484]/10 rounded-full">Base de Dados Supabase</span>
                                </div>

                                {/* Add to global */}
                                <div className="p-4 bg-gray-50/50 border border-gray-100 rounded-lg space-y-3">
                                    <p className="text-[9px] uppercase tracking-widest text-[#1E3932] font-bold">Adicionar ao Dicionário Global</p>
                                    <div className="flex gap-2 flex-wrap">
                                        <select value={newComodidadeCat} onChange={e => setNewComodidadeCat(e.target.value)}
                                            className="border-b border-gray-200 outline-none bg-transparent text-[10px] py-1.5 font-bold text-[#1E3932] min-w-[110px] cursor-pointer">
                                            {allCats.map(c => <option key={c} value={c}>{CAT_LABELS[c] || c}</option>)}
                                            <option value="NOVA">+ Nova Categoria...</option>
                                        </select>
                                        <input type="text" value={customComodidade}
                                            onChange={e => setCustomComodidade(e.target.value)}
                                            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addCustomComodidade(); } }}
                                            placeholder="Nome do item (ex: Lareira)"
                                            className="flex-1 border-b border-gray-200 focus:border-[#C4A484] pb-1.5 outline-none text-xs text-[#1E3932] bg-transparent min-w-[120px]" />
                                        <button type="button" onClick={addCustomComodidade}
                                            className="bg-[#1E3932] text-white px-4 py-1.5 text-[9px] uppercase tracking-widest font-bold hover:bg-[#C4A484] transition-colors cursor-pointer rounded">
                                            Registar
                                        </button>
                                    </div>
                                </div>

                                {/* Category list */}
                                <div className="max-h-72 overflow-y-auto space-y-4 pr-1">
                                    {loadingGlobal ? (
                                        <div className="flex justify-center py-6">
                                            <Loader2 size={16} className="text-[#C4A484] animate-spin" />
                                        </div>
                                    ) : (
                                        <>
                                            {allCats.map(catName => {
                                                const items = allComodidades.filter(c => c.categoria === catName);
                                                if (items.length === 0 && !defaultCats.includes(catName)) return null;
                                                return (
                                                    <div key={catName} className="border-l-2 border-gray-100 pl-3">
                                                        <p className="text-[9px] uppercase tracking-widest text-[#1E3932] font-bold mb-2 flex items-center justify-between">
                                                            <span>{CAT_LABELS[catName] || catName}</span>
                                                            <span className="text-[8px] font-normal text-gray-600">{items.length} itens</span>
                                                        </p>
                                                        <div className="flex flex-wrap gap-1.5">
                                                            {items.map(c => {
                                                                const sel = comodidadesEdit.some(item => normalize(item) === normalize(c.nome));
                                                                return (
                                                                    <button key={c.id} type="button" onClick={() => toggleComodidade(c.nome)}
                                                                        className={`text-[9px] px-2.5 py-1.5 rounded border transition-all min-h-[32px] cursor-pointer
                                                                            ${sel
                                                                                ? 'bg-[#C4A484] text-white border-[#C4A484]'
                                                                                : 'bg-white text-gray-500 border-gray-200 hover:border-[#C4A484] hover:text-[#C4A484]'}`}>
                                                                        {c.nome}
                                                                    </button>
                                                                );
                                                            })}
                                                            {items.length === 0 && (
                                                                <p className="text-[8px] italic text-gray-500">Vazio — adicione itens acima.</p>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })}

                                            {/* Orphan items */}
                                            {comodidadesEdit.filter(item => !isGlobalMatch(item)).length > 0 && (
                                                <div className="p-4 bg-red-50/50 border border-red-100 rounded-lg">
                                                    <p className="text-[9px] uppercase tracking-widest text-red-600 font-bold mb-2">
                                                        Itens fora do Dicionário Global
                                                    </p>
                                                    <div className="flex flex-wrap gap-2">
                                                        {comodidadesEdit.filter(item => !isGlobalMatch(item)).map(item => (
                                                            <div key={item} className="flex items-center gap-1 bg-white border border-red-200 rounded px-2 py-1">
                                                                <span className="text-[9px] text-red-500">{item}</span>
                                                                <button type="button" onClick={() => registerGlobally(item)} title="Registar Globalmente"
                                                                    className="p-1 text-blue-500 hover:bg-blue-50 rounded transition-colors cursor-pointer">
                                                                    <Upload size={10} />
                                                                </button>
                                                                <button type="button" onClick={() => toggleComodidade(item)} title="Remover"
                                                                    className="p-1 text-red-300 hover:text-red-500 rounded transition-colors cursor-pointer">
                                                                    <Trash2 size={10} />
                                                                </button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                    <p className="text-[8px] text-red-400 mt-2 italic leading-relaxed">
                                                        Estes itens estão selecionados mas não estão no dicionário global. Use o ícone azul para os registar.
                                                    </p>
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>
                            </fieldset>
                        </form>

                        {/* Modal Footer */}
                        <div className="absolute bottom-0 left-0 right-0 p-5 bg-white border-t border-gray-100 flex justify-end gap-3">
                            <BtnSecondary onClick={() => setEditQuarto(null)}>Cancelar</BtnSecondary>
                            <BtnPrimary type="submit" onClick={handleSave}>
                                <CircleCheck size={14} /> Guardar
                            </BtnPrimary>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Lightbox ────────────────────────────────────────────────────────── */}
            {lightbox && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 backdrop-blur-md"
                    onClick={() => setLightbox(null)}>
                    <button onClick={() => setLightbox(null)}
                        className="absolute top-4 right-4 text-white/50 hover:text-white z-[210] p-2 bg-black/30 rounded-full hover:bg-black/50 transition-colors cursor-pointer">
                        <X size={24} />
                    </button>

                    <div className="relative w-full max-w-5xl h-[85vh] flex items-center justify-center px-4"
                        onClick={e => e.stopPropagation()}>
                        <img src={lightbox.fotos[lightbox.index]} alt="Galeria"
                            className="max-w-full max-h-full object-contain shadow-2xl"
                            key={`foto-${lightbox.index}`} />

                        {lightbox.fotos.length > 1 && (
                            <>
                                <button onClick={() => setLightbox(prev => prev ? { ...prev, index: prev.index === 0 ? prev.fotos.length - 1 : prev.index - 1 } : null)}
                                    className="absolute left-6 bg-black/50 hover:bg-[#C4A484] text-white p-3 rounded-full transition-all duration-300 cursor-pointer">
                                    <ChevronLeft size={22} />
                                </button>
                                <button onClick={() => setLightbox(prev => prev ? { ...prev, index: (prev.index + 1) % prev.fotos.length } : null)}
                                    className="absolute right-6 bg-black/50 hover:bg-[#C4A484] text-white p-3 rounded-full transition-all duration-300 cursor-pointer">
                                    <ChevronRight size={22} />
                                </button>
                                <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2 z-[210]">
                                    {lightbox.fotos.map((url, i) => (
                                        <button key={i} onClick={() => setLightbox(prev => prev ? { ...prev, index: i } : null)}
                                            className={`w-10 h-10 rounded overflow-hidden border-2 transition-all cursor-pointer ${i === lightbox.index ? 'border-[#C4A484] scale-110' : 'border-transparent opacity-40 hover:opacity-80'}`}>
                                            <img src={url} className="w-full h-full object-cover" alt="" />
                                        </button>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

// ── Helpers ──────────────────────────────────────────────────────────────────
function StatChip({ icon, label, className = '' }: { icon: React.ReactNode; label: string; className?: string }) {
    return (
        <span className={`flex items-center gap-1.5 text-[10px] uppercase tracking-widest font-bold text-gray-500 ${className}`}>
            {icon} {label}
        </span>
    );
}

function ModalField({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div className="space-y-1.5">
            <label className="text-[9px] uppercase tracking-widest text-gray-600 font-bold block">{label}</label>
            {children}
        </div>
    );
}
