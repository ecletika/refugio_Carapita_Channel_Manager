"use client";
import React, { useState, useEffect, useRef } from 'react';
import { Plus, Trash2, Edit2, CheckCircle, XCircle, RefreshCw, Upload, Euro, Users, Home, Camera, Info, Link, X, ChevronLeft, ChevronRight } from 'lucide-react';
import AdminSidebar from '@/components/AdminSidebar';

interface Quarto {
    id: string;
    nome: string;
    tipo: string;
    descricao: string;
    capacidade: number;
    preco_base: number;
    fotos: string;
    comodidades: string; // JSON array of strings
    video_url?: string;
    ical_url: string;
    ativo: boolean;
    minima_estadia_padrao: number;
}


function parseComodidades(c: string | undefined): string[] {
    if (!c) return [];
    try { return JSON.parse(c); } catch { return []; }
}


// Helper: parse fotos field into array of objects
export interface FotoObj {
    url: string;
    category: string;
    isMain: boolean;
}

function parseFotos(fotos: string | undefined): FotoObj[] {
    if (!fotos) return [];
    try {
        const parsed = JSON.parse(fotos);
        if (Array.isArray(parsed)) {
            return parsed.map((item, index) => {
                if (typeof item === 'string') {
                    return { url: item, category: 'Quarto', isMain: index === 0 };
                }
                return { ...item, category: item.category || 'Quarto', isMain: item.isMain || false };
            });
        }
        return [{ url: fotos, category: 'Quarto', isMain: true }];
    } catch {
        return fotos ? [{ url: fotos, category: 'Quarto', isMain: true }] : [];
    }
}

// Helper: serialize array to JSON string for storage
function serializeFotos(arr: FotoObj[]): string {
    return JSON.stringify(arr);
}

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
    const [lightbox, setLightbox] = useState<{ fotos: string[], index: number } | null>(null);

    // Dynamic Amenities from Supabase
    const [allComodidades, setAllComodidades] = useState<{ id: string, nome: string, categoria: string, icone: string }[]>([]);
    const [newComodidadeCat, setNewComodidadeCat] = useState('Comodidades');

    // Helpers
    const normalize = (s: string) => s.trim().toLowerCase();
    const isGlobalMatch = (s: string) => allComodidades.some(c => normalize(c.nome) === normalize(s));

    const [loadingGlobal, setLoadingGlobal] = useState(true);

    const fetchComodidades = async () => {
        setLoadingGlobal(true);
        try {
            const resp = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/comodidades`);
            const data = await resp.json();
            if (data.status === 'success') {
                setAllComodidades(data.data);
            }
        } catch (e) {
            console.error("Erro buscar comodidades", e);
        } finally {
            setLoadingGlobal(false);
        }
    };


    const fetchQuartos = async () => {
        try {
            const resp = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/quartos`);
            const data = await resp.json();
            if (data.status === 'success') setQuartos(data.data);
        } catch (e) {
            console.error("Erro ao buscar quartos", e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchQuartos();
        fetchComodidades();
    }, []);

    // Open modal — init gallery from existing fotos
    const openEdit = (q?: Partial<Quarto>) => {
        const quarto = q || { nome: '', tipo: 'Quarto', descricao: '', capacidade: 2, preco_base: 100, ativo: true, minima_estadia_padrao: 2 };
        setEditQuarto(quarto);
        setFotosEdit(parseFotos(quarto.fotos));

        // Normalize loaded amenities
        const loaded = parseComodidades(quarto.comodidades);
        setComodidadesEdit(loaded);

        setCustomComodidade('');
        setUrlInput('');
    };


    // Add URL to gallery
    const addUrlFoto = () => {
        const trimmed = urlInput.trim();
        if (!trimmed) return;
        setFotosEdit(prev => [...prev, { url: trimmed, category: 'Quarto', isMain: prev.length === 0 }]);
        setUrlInput('');
    };

    const toggleComodidade = (item: string) => {
        setComodidadesEdit(prev => {
            const normalizedItem = normalize(item);
            const exists = prev.some(c => normalize(c) === normalizedItem);
            if (exists) {
                return prev.filter(c => normalize(c) !== normalizedItem);
            } else {
                return [...prev, item];
            }
        });
    };

    const addCustomComodidade = async () => {
        const trimmed = customComodidade.trim();
        if (!trimmed) return;

        let categoryToUse = newComodidadeCat;
        if (categoryToUse === 'NOVA') {
            const newCat = prompt("Digite o nome da nova categoria (ex: Sala de jantar):");
            if (!newCat) return;
            categoryToUse = newCat;
            setNewComodidadeCat(newCat);
        }

        const normalizedTrimmed = normalize(trimmed);

        // Check if already in current room
        if (comodidadesEdit.some(c => normalize(c) === normalizedTrimmed)) {
            setCustomComodidade('');
            return;
        }

        // Check if it already exists in global list to avoid duplicates
        const existsGlobal = allComodidades.find(c => normalize(c.nome) === normalizedTrimmed);

        if (!existsGlobal) {
            // Save to Supabase first
            const token = localStorage.getItem('token');
            try {
                const resp = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/comodidades`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                    body: JSON.stringify({ nome: trimmed, categoria: categoryToUse })
                });

                if (resp.ok) {
                    await fetchComodidades();
                } else {
                    const err = await resp.json();
                    alert(`Erro ao guardar na base de dados global: ${err.details || err.error || 'Erro desconhecido'}`);
                    // We still add it locally so the person doesn't lose the typing, but it will stay in "Outros"
                }
            } catch (e) {
                console.error(e);
                alert("Erro de ligação ao servidor para guardar comodidade global.");
            }
        }

        setComodidadesEdit(prev => [...prev, trimmed]);
        setCustomComodidade('');
    };

    const registerGlobally = async (nome: string) => {
        const cat = prompt(`Em que categoria deseja registar "${nome}"?`, "Comodidades");
        if (!cat) return;

        const token = localStorage.getItem('token');
        try {
            const resp = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/comodidades`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ nome, categoria: cat })
            });
            if (resp.ok) {
                await fetchComodidades();
                alert(`"${nome}" registado com sucesso em ${cat}!`);
            } else {
                alert("Erro ao registar.");
            }
        } catch (e) { alert("Erro de conexão."); }
    };


    // Upload from PC
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
                const resp = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/upload`, {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${token}` },
                    body: formData
                });
                const data = await resp.json();
                if (data.url) newUrls.push(data.url);
            } catch {
                alert(`Erro ao fazer upload de ${file.name}`);
            }
        }
        setFotosEdit(prev => [
            ...prev,
            ...newUrls.map((url, i) => ({ url, category: 'Quarto', isMain: prev.length === 0 && i === 0 }))
        ]);
        setUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    // Remove from gallery
    const removeFoto = (idx: number) => {
        setFotosEdit(prev => prev.filter((_, i) => i !== idx));
    };

    // Move photo (reorder)
    const moveFoto = (idx: number, dir: -1 | 1) => {
        setFotosEdit(prev => {
            const arr = [...prev];
            const target = idx + dir;
            if (target < 0 || target >= arr.length) return arr;
            [arr[idx], arr[target]] = [arr[target], arr[idx]];
            return arr;
        });
    };

    const handleToggleAtivo = async (q: Quarto) => {
        const token = localStorage.getItem('token');
        try {
            const resp = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/quartos/${q.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    nome: q.nome,
                    tipo: q.tipo,
                    descricao: q.descricao,
                    capacidade: q.capacidade,
                    precoBase: q.preco_base,
                    fotos: q.fotos,
                    comodidades: q.comodidades,
                    ativo: !q.ativo,
                    videoUrl: q.video_url,
                    icalUrl: q.ical_url
                })
            });
            if (resp.ok) {
                fetchQuartos();
            }
        } catch (e) {
            console.error("Erro ao alternar status do quarto", e);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        const token = localStorage.getItem('token');
        const method = editQuarto?.id ? 'PUT' : 'POST';
        const url = editQuarto?.id
            ? `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/quartos/${editQuarto.id}`
            : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/quartos`;

        try {
            const resp = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    nome: editQuarto?.nome,
                    tipo: editQuarto?.tipo,
                    descricao: editQuarto?.descricao,
                    capacidade: editQuarto?.capacidade,
                    precoBase: editQuarto?.preco_base,
                    fotos: serializeFotos(fotosEdit),
                    comodidades: JSON.stringify(comodidadesEdit),
                    ativo: editQuarto?.ativo,
                    videoUrl: editQuarto?.video_url,
                    icalUrl: editQuarto?.ical_url,
                    minimaEstadiaPadrao: editQuarto?.minima_estadia_padrao
                })

            });
            if (resp.ok) {
                setEditQuarto(null);
                fetchQuartos();
            } else {
                alert('Erro ao gravar. Verifique se está autenticado.');
            }
        } catch (e) {
            alert("Erro ao salvar quarto");
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Tem certeza que deseja apagar este quarto? Todos os dados associados serão perdidos.")) return;
        const token = localStorage.getItem('token');
        try {
            await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/quartos/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            fetchQuartos();
        } catch (e) {
            alert("Erro ao apagar");
        }
    };

    const handleSync = async (id: string) => {
        const token = localStorage.getItem('token');
        try {
            const resp = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/sync/${id}`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await resp.json();
            alert(data.message || "Sincronização concluída");
        } catch (e) {
            alert("Erro ao sincronizar");
        }
    };

    if (loading) return (
        <div className="min-h-screen bg-[#F9F8F6] flex items-center justify-center">
            <div className="text-center">
                <div className="w-8 h-8 border-2 border-carapita-gold border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="text-[10px] uppercase tracking-widest text-gray-400">A carregar o inventário...</p>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#F9F8F6]">
            <AdminSidebar />

            <div className="ml-20 p-8 md:p-12 max-w-6xl mx-auto">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-16">
                    <div>
                        <span className="text-carapita-gold text-[10px] uppercase tracking-mega font-bold block mb-1">Alojamento</span>
                        <h1 className="text-4xl font-serif text-carapita-dark">Gestão do Inventário</h1>
                    </div>
                    <button
                        onClick={() => openEdit()}
                        className="bg-carapita-dark text-white px-8 py-4 text-[10px] uppercase tracking-mega flex items-center gap-3 hover:bg-carapita-gold transition-all duration-500 shadow-xl shadow-carapita-dark/10 group"
                    >
                        <Plus size={16} className="group-hover:rotate-90 transition-transform duration-500" />
                        <span>Novo Alojamento</span>
                    </button>
                </div>

                <div className="flex flex-col gap-3">
                    {quartos.map((q) => {
                        const fotos = parseFotos(q.fotos);
                        const mainFoto = fotos.find(f => f.isMain)?.url || fotos[0]?.url || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=80';
                        return (
                            <div key={q.id} className="bg-white border border-gray-100 flex items-center p-4 gap-6 hover:shadow-lg transition-all duration-300 rounded-sm">
                                {/* Thumbnail */}
                                <div
                                    className="w-24 h-24 shrink-0 bg-gray-100 relative rounded-sm overflow-hidden cursor-pointer group"
                                    onClick={() => { if (fotos.length > 0) setLightbox({ fotos: fotos.map(f => f.url), index: 0 }); }}
                                >
                                    <img src={mainFoto} alt={q.nome} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                                        <Camera size={16} className="text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-md" />
                                    </div>
                                    {fotos.length > 1 && (
                                        <div className="absolute bottom-1 right-1 bg-black/70 backdrop-blur-sm text-white text-[8px] px-1.5 py-0.5 rounded-sm font-bold">
                                            +{fotos.length - 1}
                                        </div>
                                    )}
                                </div>

                                {/* Info */}
                                <div className="flex-1 flex flex-col justify-center">
                                    <div className="flex items-center gap-3 mb-1">
                                        <h3 className="font-serif text-xl text-carapita-dark">{q.nome}</h3>
                                        <span className="text-[9px] uppercase tracking-widest bg-gray-50 border border-gray-200 text-gray-600 px-2 py-0.5 rounded-sm">{q.tipo}</span>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleToggleAtivo(q); }}
                                            title={q.ativo ? "Desativar quarto" : "Ativar quarto"}
                                            className={`text-[9px] uppercase tracking-widest font-bold flex items-center gap-1 transition-all hover:scale-105 active:scale-95 ${q.ativo ? 'text-green-600' : 'text-red-500 opacity-60 hover:opacity-100'}`}
                                        >
                                            {q.ativo ? (
                                                <><CheckCircle size={10} /> Ativo</>
                                            ) : (
                                                <><XCircle size={10} /> Inativo</>
                                            )}
                                        </button>
                                    </div>
                                    <p className="text-xs text-carapita-muted line-clamp-1 mb-3 max-w-3xl leading-relaxed">{q.descricao}</p>
                                    <div className="flex gap-6">
                                        <span className="text-[10px] uppercase tracking-widest font-bold text-gray-500 flex items-center gap-1.5"><Users size={12} className="text-carapita-gold" /> {q.capacidade} Hóspedes</span>
                                        <span className="text-[10px] uppercase tracking-widest font-bold text-gray-500 flex items-center gap-1.5"><Euro size={12} className="text-carapita-gold" /> {q.preco_base} / Noite</span>
                                        <span className="text-[10px] uppercase tracking-widest font-bold text-gray-500 flex items-center gap-1.5"><RefreshCw size={12} className="text-carapita-gold" /> Min: {q.minima_estadia_padrao || 2} noites</span>
                                        {q.ical_url && <span className="text-[10px] uppercase tracking-widest font-bold text-blue-500 flex items-center gap-1.5"><RefreshCw size={12} /> iCal Sync</span>}
                                    </div>
                                </div>

                                {/* Ações */}
                                <div className="flex items-center gap-2 border-l border-gray-100 pl-6 shrink-0">
                                    <button onClick={() => handleSync(q.id)} title="Sincronizar" className="w-10 h-10 flex items-center justify-center text-carapita-gold hover:bg-carapita-gold hover:text-white rounded-sm transition-all duration-300"><RefreshCw size={14} /></button>
                                    <button onClick={() => openEdit(q)} title="Editar" className="w-10 h-10 flex items-center justify-center text-carapita-dark hover:bg-carapita-dark hover:text-white rounded-sm transition-all duration-300"><Edit2 size={14} /></button>
                                    <button onClick={() => handleDelete(q.id)} title="Remover" className="w-10 h-10 flex items-center justify-center text-red-400 hover:bg-red-500 hover:text-white rounded-sm transition-all duration-300"><Trash2 size={14} /></button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Modal de Edição (Sidebar Limpa e Cirúrgica) */}
            {editQuarto && (
                <div className="fixed inset-0 z-[100] flex justify-end">
                    <div className="absolute inset-0 bg-carapita-dark/60 backdrop-blur-sm transition-opacity" onClick={() => setEditQuarto(null)} />
                    <div className="relative bg-white w-full max-w-[550px] h-full z-10 shadow-2xl animate-fade-in flex flex-col">

                        {/* Header Modal */}
                        <div className="p-6 border-b border-gray-100 flex items-center justify-between shrink-0 bg-white">
                            <div>
                                <span className="text-carapita-gold text-[9px] uppercase tracking-widest font-bold block mb-1">Inventário</span>
                                <h2 className="text-2xl font-serif text-carapita-dark">{editQuarto.id ? 'Editar Alojamento' : 'Novo Alojamento'}</h2>
                            </div>
                            <button onClick={() => setEditQuarto(null)} className="p-2 text-gray-400 hover:text-carapita-dark hover:bg-gray-50 rounded-full transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        {/* Corpo do Formulário */}
                        <form onSubmit={handleSave} className="p-6 overflow-y-auto flex-1 space-y-8 pb-32">

                            <div className="space-y-5">
                                <div className="space-y-1">
                                    <label className="text-[9px] uppercase tracking-widest text-carapita-muted font-bold">Nome do Alojamento</label>
                                    <input required value={editQuarto.nome} onChange={e => setEditQuarto({ ...editQuarto, nome: e.target.value })} className="w-full border-b border-gray-200 focus:border-carapita-gold pb-2 outline-none text-sm transition-colors text-carapita-dark" placeholder="Ex: Suite Deluxe" />
                                </div>

                                <div className="grid grid-cols-2 gap-5">
                                    <div className="space-y-1">
                                        <label className="text-[9px] uppercase tracking-widest text-carapita-muted font-bold">Tipo</label>
                                        <select value={editQuarto.tipo} onChange={e => setEditQuarto({ ...editQuarto, tipo: e.target.value })} className="w-full border-b border-gray-200 focus:border-carapita-gold pb-2 outline-none text-sm bg-transparent transition-colors text-carapita-dark">
                                            <option value="Quarto">Quarto</option>
                                            <option value="Suite">Suite</option>
                                            <option value="Casa">Casa</option>
                                            <option value="Cabana">Cabana</option>
                                        </select>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[9px] uppercase tracking-widest text-carapita-muted font-bold">Capacidade (Hóspedes)</label>
                                        <input type="number" required value={editQuarto.capacidade} onChange={e => setEditQuarto({ ...editQuarto, capacidade: parseInt(e.target.value) })} className="w-full border-b border-gray-200 focus:border-carapita-gold pb-2 outline-none text-sm bg-transparent transition-colors text-carapita-dark" min="1" />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[9px] uppercase tracking-widest text-carapita-muted font-bold">Mínimo Estadia Padrão</label>
                                        <input type="number" required value={editQuarto.minima_estadia_padrao || 2} onChange={e => setEditQuarto({ ...editQuarto, minima_estadia_padrao: parseInt(e.target.value) })} className="w-full border-b border-gray-200 focus:border-carapita-gold pb-2 outline-none text-sm bg-transparent transition-colors text-carapita-dark" min="1" />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-5">
                                    <div className="space-y-1">
                                        <label className="text-[9px] uppercase tracking-widest text-carapita-muted font-bold">Preço Base (€)</label>
                                        <input type="number" required value={editQuarto.preco_base} onChange={e => setEditQuarto({ ...editQuarto, preco_base: parseFloat(e.target.value) })} className="w-full border-b border-gray-200 focus:border-carapita-gold pb-2 outline-none text-sm bg-transparent transition-colors text-carapita-dark" min="0" step="0.01" />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[9px] uppercase tracking-widest text-carapita-muted font-bold">Ativo no Site</label>
                                        <div className="flex items-center pt-1 border-b border-transparent">
                                            <label className="relative inline-flex items-center cursor-pointer">
                                                <input type="checkbox" checked={editQuarto.ativo} onChange={e => setEditQuarto({ ...editQuarto, ativo: e.target.checked })} className="sr-only peer" />
                                                <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-carapita-gold"></div>
                                                <span className="ml-2 text-[10px] uppercase font-bold text-carapita-dark">{editQuarto.ativo ? 'Sim' : 'Não'}</span>
                                            </label>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-[9px] uppercase tracking-widest text-carapita-muted font-bold">URL iCal (Sincronização)</label>
                                    <input value={editQuarto.ical_url} onChange={e => setEditQuarto({ ...editQuarto, ical_url: e.target.value })} className="w-full border-b border-gray-200 focus:border-carapita-gold pb-2 outline-none text-sm transition-colors text-carapita-dark" placeholder="https://..." />
                                </div>

                                <div className="space-y-1">
                                    <label className="text-[9px] uppercase tracking-widest text-carapita-muted font-bold">Link Vídeo Promocional</label>
                                    <input type="url" value={editQuarto.video_url || ''} onChange={e => setEditQuarto({ ...editQuarto, video_url: e.target.value })} className="w-full border-b border-gray-200 focus:border-carapita-gold pb-2 outline-none text-sm transition-colors text-carapita-dark" placeholder="YouTube, Vimeo..." />
                                </div>

                                <div className="space-y-1">
                                    <label className="text-[9px] uppercase tracking-widest text-carapita-muted font-bold">Descrição</label>
                                    <textarea rows={3} value={editQuarto.descricao} onChange={e => setEditQuarto({ ...editQuarto, descricao: e.target.value })} className="w-full border border-gray-200 focus:border-carapita-gold p-3 outline-none text-sm transition-colors text-carapita-dark bg-gray-50/50 rounded-sm" placeholder="Detalhes do quarto..." />
                                </div>
                            </div>

                            {/* Galeria de Fotos */}
                            <div className="space-y-3 pt-6 border-t border-gray-100">
                                <label className="text-[10px] uppercase tracking-widest text-carapita-muted font-bold block">Fotos ({fotosEdit.length})</label>

                                {fotosEdit.length > 0 && (
                                    <div className="grid grid-cols-4 gap-2">
                                        {fotosEdit.map((foto, idx) => (
                                            <div key={idx} className={`relative aspect-square group/foto rounded-sm overflow-hidden border ${foto.isMain ? 'border-carapita-gold border-2' : 'border-gray-100'}`}>
                                                <img src={foto.url} className="w-full h-full object-cover" />
                                                <div className="absolute top-1 left-1 bg-black/60 backdrop-blur-sm text-[8px] text-white px-1.5 py-0.5 rounded uppercase tracking-widest font-bold z-10">
                                                    {foto.category} {foto.isMain ? '★ CAPA' : ''}
                                                </div>
                                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover/foto:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 z-20">
                                                    {!foto.isMain && (
                                                        <button type="button" onClick={() => setFotosEdit(prev => prev.map((f, i) => ({ ...f, isMain: i === idx })))} className="px-2 py-1 bg-carapita-gold text-white rounded text-[8px] uppercase tracking-widest font-bold border border-white/20 hover:bg-white hover:text-carapita-gold transition-colors">Capa principal</button>
                                                    )}
                                                    <select
                                                        value={foto.category}
                                                        onChange={e => setFotosEdit(prev => prev.map((f, i) => i === idx ? { ...f, category: e.target.value } : f))}
                                                        className="text-[9px] bg-white text-black p-1 rounded outline-none w-3/4 truncate"
                                                    >
                                                        {['Quarto', 'Cozinha', 'Sala', 'Casa de Banho', 'Exterior', 'Outros'].map(c => <option key={c} value={c}>{c}</option>)}
                                                    </select>
                                                    <button type="button" onClick={() => removeFoto(idx)} className="p-1.5 bg-red-500 text-white rounded border border-white/20 hover:bg-red-600 transition-colors"><Trash2 size={12} /></button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                <div className="flex flex-col gap-2">
                                    <div className="flex gap-2">
                                        <input type="url" value={urlInput} onChange={e => setUrlInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addUrlFoto(); } }} placeholder="Cole um link de imagem..." className="flex-1 border-b border-gray-200 focus:border-carapita-gold pb-2 outline-none text-xs transition-colors" />
                                        <button type="button" onClick={addUrlFoto} className="text-carapita-dark font-bold text-[9px] uppercase tracking-widest hover:text-carapita-gold">Adicionar URL</button>
                                    </div>

                                    <div className="mt-2" onClick={() => fileInputRef.current?.click()}>
                                        <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleFileUpload} />
                                        <div className="border border-dashed border-gray-300 hover:border-carapita-gold p-3 text-center cursor-pointer rounded-sm flex justify-center items-center gap-2">
                                            {uploading ? <div className="w-3 h-3 border-2 border-carapita-gold border-t-transparent rounded-full animate-spin" /> : <Upload size={14} className="text-carapita-muted" />}
                                            <span className="text-[9px] uppercase tracking-widest text-carapita-muted">Upload do PC</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Comodidades Minimalista */}
                            <div className="space-y-4 pt-6 border-t border-gray-100">
                                <div className="flex justify-between items-center">
                                    <label className="text-[10px] uppercase tracking-widest text-carapita-muted font-bold block">Gestão de Comodidades</label>
                                    <span className="text-[8px] text-carapita-gold uppercase font-bold px-2 py-0.5 bg-carapita-gold/10 rounded-full">Base de Dados Supabase</span>
                                </div>

                                <div className="flex flex-col gap-2 p-3 bg-gray-50/50 border border-gray-100 rounded-sm">
                                    <p className="text-[8px] uppercase tracking-widest text-carapita-dark font-bold">Adicionar Novo Item ao Dicionário Global</p>
                                    <div className="flex gap-2">
                                        <div className="flex flex-col gap-1">
                                            <span className="text-[7px] text-gray-400 uppercase">Categoria</span>
                                            <select
                                                value={newComodidadeCat}
                                                onChange={e => setNewComodidadeCat(e.target.value)}
                                                className="text-[9px] border-b border-gray-200 outline-none bg-transparent py-1 font-bold text-carapita-dark min-w-[120px]"
                                            >
                                                {Array.from(new Set([
                                                    'Camas & Quartos',
                                                    'Sala de estar',
                                                    'Espaço & Área',
                                                    'Comodidades',
                                                    'Casa de Banho',
                                                    'Serviços',
                                                    'Políticas',
                                                    ...allComodidades.map(c => c.categoria)
                                                ])).map(c => (
                                                    <option key={c} value={c}>{c}</option>
                                                ))}
                                                <option value="NOVA">+ Nova Categoria...</option>
                                            </select>
                                        </div>
                                        <div className="flex-1 flex flex-col gap-1">
                                            <span className="text-[7px] text-gray-400 uppercase">Nome do Item</span>
                                            <input
                                                type="text"
                                                value={customComodidade}
                                                onChange={e => setCustomComodidade(e.target.value)}
                                                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addCustomComodidade(); } }}
                                                placeholder="Ex: Sofá, Lareira, TV..."
                                                className="border-b border-gray-200 focus:border-carapita-gold pb-1 outline-none text-xs transition-colors bg-transparent placeholder:italic"
                                            />
                                        </div>
                                        <button type="button" onClick={addCustomComodidade} className="self-end bg-carapita-dark text-white px-4 py-1.5 text-[8px] uppercase tracking-widest font-bold hover:bg-carapita-gold transition-colors">Registar</button>
                                    </div>
                                </div>

                                <div className="max-h-80 overflow-y-auto pr-2 space-y-4 scrollbar-thin mt-2">
                                    {loadingGlobal ? (
                                        <div className="flex justify-center p-4">
                                            <div className="w-4 h-4 border-2 border-carapita-gold border-t-transparent rounded-full animate-spin" />
                                        </div>
                                    ) : (
                                        <>
                                            {/* Categorias Dinâmicas */}
                                            {Array.from(new Set([
                                                'Camas & Quartos',
                                                'Sala de estar',
                                                'Espaço & Área',
                                                'Comodidades',
                                                'Casa de Banho',
                                                'Serviços',
                                                'Políticas',
                                                ...allComodidades.map(c => c.categoria)
                                            ])).map(catName => {
                                                const globalItems = allComodidades.filter(c => c.categoria === catName);
                                                const icon =
                                                    catName === 'Camas & Quartos' ? '🛏️' :
                                                        catName === 'Sala de estar' ? '🛋️' :
                                                            catName === 'Espaço & Área' ? '📐' :
                                                                catName === 'Comodidades' ? '✨' :
                                                                    catName === 'Casa de Banho' ? '🚿' :
                                                                        catName === 'Serviços' ? '🍽️' : '📋';

                                                // Se não for uma categoria padrão e estiver vazia, não mostramos a não ser que o utilizador a queira
                                                if (globalItems.length === 0 && !['Camas & Quartos', 'Sala de estar', 'Espaço & Área', 'Comodidades', 'Casa de Banho', 'Serviços', 'Políticas'].includes(catName)) return null;

                                                return (
                                                    <div key={catName} className="p-3 border-l-2 border-gray-100 bg-gray-50/20">
                                                        <p className="text-[9px] uppercase tracking-widest text-carapita-dark font-bold mb-3 flex items-center justify-between">
                                                            <span>{icon} {catName}</span>
                                                            <span className="text-[8px] font-normal text-gray-400">({globalItems.length} itens)</span>
                                                        </p>
                                                        <div className="flex flex-wrap gap-1.5">
                                                            {globalItems.map(c => {
                                                                const sel = comodidadesEdit.some(item => normalize(item) === normalize(c.nome));
                                                                return (
                                                                    <div key={c.id} className="group relative">
                                                                        <button type="button" onClick={() => toggleComodidade(c.nome)} className={`text-[9px] px-2.5 py-1.5 transition-all rounded-[3px] border ${sel ? 'bg-carapita-gold text-white border-carapita-gold shadow-sm' : 'bg-white text-gray-500 border-gray-200 hover:border-carapita-gold hover:text-carapita-gold'}`}>
                                                                            {c.nome}
                                                                        </button>
                                                                    </div>
                                                                );
                                                            })}
                                                            {globalItems.length === 0 && <p className="text-[8px] italic text-gray-400">Vazio - adicione itens acima.</p>}
                                                        </div>
                                                    </div>
                                                );
                                            })}

                                            {/* Itens órfãos (que estão no quarto mas não no dicionário global) */}
                                            {comodidadesEdit.filter(item => !isGlobalMatch(item)).length > 0 && (
                                                <div className="bg-red-50/30 p-4 border border-red-100/50 rounded-sm">
                                                    <p className="text-[9px] uppercase tracking-widest text-red-600 font-bold mb-2 flex items-center gap-1">⚠️ Itens Fora do Dicionário Global</p>
                                                    <div className="flex flex-wrap gap-1.5">
                                                        {comodidadesEdit.filter(item => !isGlobalMatch(item)).map(item => (
                                                            <div key={item} className="flex items-center gap-1 bg-white border border-red-200 rounded-sm px-2 py-1">
                                                                <span className="text-[9px] text-red-500">{item}</span>
                                                                <button type="button" onClick={() => registerGlobally(item)} title="Registar Globalmente" className="p-1 text-blue-500 hover:bg-blue-50 rounded-full transition-colors"><Upload size={10} /></button>
                                                                <button type="button" onClick={() => toggleComodidade(item)} title="Remover" className="p-1 text-red-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"><Trash2 size={10} /></button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                    <p className="text-[8px] text-red-400 mt-2 leading-relaxed italic">Estes itens estão selecionados para este alojamento, mas não estão na base de dados global. Clique na seta azul para os registar e categorizar corretamente.</p>
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>
                            </div>
                        </form>

                        {/* Footer Ações Fixas */}
                        <div className="absolute bottom-0 left-0 right-0 p-6 bg-white border-t border-gray-100 flex justify-end gap-3 shadow-[0_-10px_30px_rgba(0,0,0,0.02)]">
                            <button type="button" onClick={() => setEditQuarto(null)} className="px-6 py-3 border border-gray-200 text-[9px] uppercase tracking-widest text-gray-500 hover:bg-gray-50 transition-colors">Cancelar</button>
                            <button onClick={handleSave} className="px-8 py-3 bg-carapita-dark text-white text-[9px] uppercase tracking-widest font-bold hover:bg-carapita-gold transition-colors flex items-center gap-2">
                                <CheckCircle size={14} /> Salvar
                            </button>
                        </div>

                    </div>
                </div>
            )}

            {/* Lightbox de Fotos */}
            {lightbox && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 backdrop-blur-md animate-fade-in" onClick={() => setLightbox(null)}>
                    <button onClick={() => setLightbox(null)} className="absolute top-6 right-6 text-white/50 hover:text-white transition-colors z-[210] p-2 bg-black/20 rounded-full hover:bg-black/40">
                        <X size={24} />
                    </button>

                    <div className="relative w-full max-w-6xl h-[85vh] flex items-center justify-center overflow-hidden" onClick={e => e.stopPropagation()}>
                        <div className="absolute inset-0 flex items-center justify-center p-4">
                            {/* Key react forces re-mount of DOM node for animation trigger */}
                            <img
                                src={lightbox.fotos[lightbox.index]}
                                alt="Galeria"
                                className="max-w-full max-h-full object-contain shadow-2xl transition-opacity animate-fade-in"
                                key={`foto-${lightbox.index}`}
                            />
                        </div>

                        {lightbox.fotos.length > 1 && (
                            <>
                                <button
                                    onClick={() => setLightbox(prev => prev ? { ...prev, index: prev.index === 0 ? prev.fotos.length - 1 : prev.index - 1 } : null)}
                                    className="absolute left-6 bg-black/50 hover:bg-carapita-gold text-white p-4 rounded-full transition-all duration-300 flex items-center justify-center backdrop-blur-sm z-[210]"
                                >
                                    <ChevronLeft size={24} />
                                </button>
                                <button
                                    onClick={() => setLightbox(prev => prev ? { ...prev, index: (prev.index + 1) % prev.fotos.length } : null)}
                                    className="absolute right-6 bg-black/50 hover:bg-carapita-gold text-white p-4 rounded-full transition-all duration-300 flex items-center justify-center backdrop-blur-sm z-[210]"
                                >
                                    <ChevronRight size={24} />
                                </button>

                                <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-3 z-[210] bg-black/20 py-3 mx-auto max-w-min rounded-full backdrop-blur-sm px-6 hide-scrollbars overflow-x-auto max-w-[80vw]">
                                    {lightbox.fotos.map((url, i) => (
                                        <button
                                            key={i}
                                            onClick={() => setLightbox(prev => prev ? { ...prev, index: i } : null)}
                                            className={`flex-shrink-0 relative w-12 h-12 rounded overflow-hidden border-2 transition-all duration-300 ${i === lightbox.index ? 'border-carapita-gold scale-110 shadow-lg' : 'border-transparent opacity-50 hover:opacity-100'}`}
                                        >
                                            <img src={url} className="w-full h-full object-cover" />
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
