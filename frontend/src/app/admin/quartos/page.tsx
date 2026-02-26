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
    ical_url: string;
    ativo: boolean;
}

// Amenity categories
const AMENITY_CATEGORIES = [
    {
        label: 'Camas & Quartos',
        icon: '🛏️',
        items: ['1 Cama King Size', '1 Cama Queen Size', '2 Camas Twin', '1 Cama Casal', 'Sofá-cama', 'Berço disponível']
    },
    {
        label: 'Espaço & Área',
        icon: '📐',
        items: ['Área: 20 m²', 'Área: 25 m²', 'Área: 30 m²', 'Área: 40 m²', 'Área: 50 m²', 'Terraço Privativo', 'Jardim Privativo', 'Vista para o Vale']
    },
    {
        label: 'Comodidades',
        icon: '✨',
        items: ['Ar Condicionado', 'Aquecimento Central', 'Wi-Fi Grátis', 'TV por Cabo', 'Frigobar', 'Cofre', 'Secretária', 'Roupeiro', 'Lareira']
    },
    {
        label: 'Casa de Banho',
        icon: '🚿',
        items: ['Chuveiro Privativo', 'Banheira', 'Banheira de Imersão', 'Secador de Cabelo', 'Roupão Incluído', 'Amenities de Banho Premium']
    },
    {
        label: 'Serviços',
        icon: '🍽️',
        items: ['Pequeno-Almoço Incluído', 'Meia Pensão', 'Pensão Completa', 'Serviço de Quarto', 'Limpeza Diária', 'Lavandaria']
    },
    {
        label: 'Políticas',
        icon: '📋',
        items: ['Depósito Requerido', 'Acessível para Mobilidade Reduzida', 'Aceita Animais de Estimação', 'Não Fumador', 'Check-in 24h']
    }
];

function parseComodidades(c: string | undefined): string[] {
    if (!c) return [];
    try { return JSON.parse(c); } catch { return []; }
}


// Helper: parse fotos field into array
function parseFotos(fotos: string | undefined): string[] {
    if (!fotos) return [];
    try {
        const parsed = JSON.parse(fotos);
        if (Array.isArray(parsed)) return parsed.filter(Boolean);
        return [fotos]; // legacy single url
    } catch {
        return fotos ? [fotos] : []; // legacy plain url
    }
}

// Helper: serialize array to JSON string for storage
function serializeFotos(arr: string[]): string {
    return JSON.stringify(arr.filter(Boolean));
}

export default function AdminQuartos() {
    const [quartos, setQuartos] = useState<Quarto[]>([]);
    const [loading, setLoading] = useState(true);
    const [editQuarto, setEditQuarto] = useState<Partial<Quarto> | null>(null);
    const [fotosEdit, setFotosEdit] = useState<string[]>([]);
    const [comodidadesEdit, setComodidadesEdit] = useState<string[]>([]);
    const [customComodidade, setCustomComodidade] = useState('');
    const [urlInput, setUrlInput] = useState('');
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);


    const fetchQuartos = async () => {
        try {
            const resp = await fetch('http://localhost:5000/api/quartos');
            const data = await resp.json();
            if (data.status === 'success') setQuartos(data.data);
        } catch (e) {
            console.error("Erro ao buscar quartos", e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchQuartos(); }, []);

    // Open modal — init gallery from existing fotos
    const openEdit = (q?: Partial<Quarto>) => {
        const quarto = q || { nome: '', tipo: 'Quarto', descricao: '', capacidade: 2, preco_base: 100, ativo: true };
        setEditQuarto(quarto);
        setFotosEdit(parseFotos(quarto.fotos));
        setComodidadesEdit(parseComodidades(quarto.comodidades));
        setCustomComodidade('');
        setUrlInput('');
    };


    // Add URL to gallery
    const addUrlFoto = () => {
        const trimmed = urlInput.trim();
        if (!trimmed) return;
        setFotosEdit(prev => [...prev, trimmed]);
        setUrlInput('');
    };

    const toggleComodidade = (item: string) => {
        setComodidadesEdit(prev =>
            prev.includes(item) ? prev.filter(c => c !== item) : [...prev, item]
        );
    };

    const addCustomComodidade = () => {
        const trimmed = customComodidade.trim();
        if (!trimmed || comodidadesEdit.includes(trimmed)) return;
        setComodidadesEdit(prev => [...prev, trimmed]);
        setCustomComodidade('');
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
                const resp = await fetch('http://localhost:5000/api/upload', {
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
        setFotosEdit(prev => [...prev, ...newUrls]);
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

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        const token = localStorage.getItem('token');
        const method = editQuarto?.id ? 'PUT' : 'POST';
        const url = editQuarto?.id
            ? `http://localhost:5000/api/quartos/${editQuarto.id}`
            : 'http://localhost:5000/api/quartos';

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
                    ativo: editQuarto?.ativo ?? true,
                    ical_url: editQuarto?.ical_url
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
            await fetch(`http://localhost:5000/api/quartos/${id}`, {
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
            const resp = await fetch(`http://localhost:5000/api/sync/${id}`, {
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

                <div className="grid grid-cols-1 gap-8">
                    {quartos.map((q) => {
                        const fotos = parseFotos(q.fotos);
                        const mainFoto = fotos[0] || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=80';
                        return (
                            <div key={q.id} className="bg-white border border-gray-100 flex flex-col md:flex-row items-stretch gap-0 hover:shadow-2xl transition-all duration-700 group overflow-hidden">
                                {/* Imagem Principal + Miniaturas */}
                                <div className="w-full md:w-80 shrink-0 flex flex-col">
                                    <div className="flex-1 bg-gray-100 relative overflow-hidden h-52 md:h-auto">
                                        <img
                                            src={mainFoto}
                                            alt={q.nome}
                                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000"
                                        />
                                        <div className="absolute top-4 left-4">
                                            {q.ativo ? (
                                                <div className="flex items-center gap-1.5 bg-green-500/90 backdrop-blur-md text-white px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest shadow-lg">
                                                    <CheckCircle size={10} /> Ativo
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-1.5 bg-red-500/90 backdrop-blur-md text-white px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest shadow-lg">
                                                    <XCircle size={10} /> Inativo
                                                </div>
                                            )}
                                        </div>
                                        {fotos.length > 1 && (
                                            <div className="absolute bottom-2 right-2 bg-black/50 text-white text-[9px] px-2 py-1 rounded-full">
                                                +{fotos.length - 1} fotos
                                            </div>
                                        )}
                                    </div>
                                    {/* Miniaturas */}
                                    {fotos.length > 1 && (
                                        <div className="flex gap-1 p-2 bg-gray-50 overflow-x-auto">
                                            {fotos.slice(1, 5).map((f, i) => (
                                                <img key={i} src={f} className="w-12 h-10 object-cover rounded flex-shrink-0 border border-white" />
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Detalhes */}
                                <div className="p-8 flex-1 flex flex-col justify-between">
                                    <div>
                                        <div className="flex justify-between items-start mb-4">
                                            <div>
                                                <h3 className="font-serif text-2xl text-carapita-dark group-hover:text-carapita-gold transition-colors mb-1">{q.nome}</h3>
                                                <p className="text-[10px] uppercase tracking-widest text-carapita-gold font-medium">{q.tipo}</p>
                                            </div>
                                            <div className="flex flex-col items-end">
                                                <span className="text-[9px] uppercase tracking-widest text-carapita-muted font-bold mb-1">Preço Base</span>
                                                <div className="flex items-baseline gap-1">
                                                    <span className="text-sm font-serif text-carapita-gold">€</span>
                                                    <span className="text-3xl font-serif text-carapita-dark">{Number(q.preco_base).toFixed(0)}</span>
                                                    <span className="text-[10px] text-carapita-muted lowercase">/noite</span>
                                                </div>
                                            </div>
                                        </div>
                                        <p className="text-xs text-carapita-muted font-light leading-relaxed mb-8 max-w-2xl line-clamp-2">{q.descricao}</p>

                                        <div className="flex flex-wrap gap-8">
                                            <div className="flex items-center gap-2">
                                                <Users size={14} className="text-carapita-gold/60" />
                                                <span className="text-[10px] uppercase tracking-widest font-medium text-carapita-dark">{q.capacidade} Hóspedes</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Camera size={14} className="text-carapita-gold/60" />
                                                <span className="text-[10px] uppercase tracking-widest font-medium text-carapita-dark">{fotos.length} {fotos.length === 1 ? 'Foto' : 'Fotos'}</span>
                                            </div>
                                            {q.ical_url && (
                                                <div className="flex items-center gap-2">
                                                    <RefreshCw size={14} className="text-carapita-gold/60" />
                                                    <span className="text-[10px] uppercase tracking-widest font-medium text-carapita-dark">Airbnb iCal Conectado</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-gray-50">
                                        <button onClick={() => handleSync(q.id)} title="Sincronizar Airbnb iCal" className="w-10 h-10 border border-gray-100 flex items-center justify-center text-carapita-gold hover:bg-carapita-gold hover:text-white transition-all duration-300">
                                            <RefreshCw size={16} />
                                        </button>
                                        <button onClick={() => openEdit(q)} title="Editar Configurações" className="w-10 h-10 border border-gray-100 flex items-center justify-center text-carapita-dark hover:bg-carapita-dark hover:text-white transition-all duration-300">
                                            <Edit2 size={16} />
                                        </button>
                                        <button onClick={() => handleDelete(q.id)} title="Remover Alojamento" className="w-10 h-10 border border-gray-100 flex items-center justify-center text-red-400 hover:bg-red-500 hover:text-white transition-all duration-300">
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Modal de Edição */}
            {editQuarto && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-carapita-dark/80 backdrop-blur-md" onClick={() => setEditQuarto(null)} />
                    <div className="relative bg-white w-full max-w-3xl p-12 z-10 shadow-3xl animate-fade-in overflow-y-auto max-h-[90vh]">
                        <button onClick={() => setEditQuarto(null)} className="absolute top-6 right-6 w-10 h-10 flex items-center justify-center text-gray-400 hover:text-carapita-dark transition-colors">
                            <XCircle size={24} strokeWidth={1} />
                        </button>

                        <div className="mb-10">
                            <span className="text-carapita-gold text-[10px] uppercase tracking-mega font-bold block mb-1">Inventário</span>
                            <h2 className="text-3xl font-serif text-carapita-dark">{editQuarto.id ? 'Editar Alojamento' : 'Criar Novo Registro'}</h2>
                        </div>

                        <form onSubmit={handleSave} className="space-y-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
                                <div className="space-y-1 group">
                                    <label className="text-[10px] uppercase tracking-widest text-carapita-muted group-focus-within:text-carapita-gold transition-colors block">Nome do Alojamento</label>
                                    <div className="flex items-center gap-3 border-b border-gray-200 focus-within:border-carapita-gold transition-colors pb-1">
                                        <Home size={14} className="text-carapita-muted" />
                                        <input required value={editQuarto.nome} onChange={e => setEditQuarto({ ...editQuarto, nome: e.target.value })} className="w-full py-2 outline-none font-medium text-sm bg-transparent" placeholder="Ex: Casa Refúgio" />
                                    </div>
                                </div>
                                <div className="space-y-1 group">
                                    <label className="text-[10px] uppercase tracking-widest text-carapita-muted group-focus-within:text-carapita-gold transition-colors block">Tipo de Unidade</label>
                                    <div className="flex items-center gap-3 border-b border-gray-200 focus-within:border-carapita-gold transition-colors pb-1">
                                        <Info size={14} className="text-carapita-muted" />
                                        <select value={editQuarto.tipo} onChange={e => setEditQuarto({ ...editQuarto, tipo: e.target.value })} className="w-full py-2 outline-none font-medium text-sm bg-transparent">
                                            <option value="Quarto">Quarto Luxo</option>
                                            <option value="Suite">Suite Júnior</option>
                                            <option value="Casa">Casa Inteira</option>
                                            <option value="Cabana">Cabana Moderna</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="space-y-1 group">
                                    <label className="text-[10px] uppercase tracking-widest text-carapita-muted group-focus-within:text-carapita-gold transition-colors block">Preço Base por Noite (€)</label>
                                    <div className="flex items-center gap-3 border-b border-gray-200 focus-within:border-carapita-gold transition-colors pb-1">
                                        <Euro size={14} className="text-carapita-muted" />
                                        <input type="number" required value={editQuarto.preco_base} onChange={e => setEditQuarto({ ...editQuarto, preco_base: parseFloat(e.target.value) })} className="w-full py-2 outline-none font-medium text-sm bg-transparent" />
                                    </div>
                                </div>
                                <div className="space-y-1 group">
                                    <label className="text-[10px] uppercase tracking-widest text-carapita-muted group-focus-within:text-carapita-gold transition-colors block">Capacidade Máxima</label>
                                    <div className="flex items-center gap-3 border-b border-gray-200 focus-within:border-carapita-gold transition-colors pb-1">
                                        <Users size={14} className="text-carapita-muted" />
                                        <input type="number" required value={editQuarto.capacidade} onChange={e => setEditQuarto({ ...editQuarto, capacidade: parseInt(e.target.value) })} className="w-full py-2 outline-none font-medium text-sm bg-transparent" />
                                    </div>
                                </div>
                                <div className="space-y-1 group md:col-span-2">
                                    <label className="text-[10px] uppercase tracking-widest text-carapita-muted group-focus-within:text-carapita-gold transition-colors block">Link iCal (Airbnb/Booking)</label>
                                    <div className="flex items-center gap-3 border-b border-gray-200 focus-within:border-carapita-gold transition-colors pb-1">
                                        <RefreshCw size={14} className="text-carapita-muted" />
                                        <input value={editQuarto.ical_url} onChange={e => setEditQuarto({ ...editQuarto, ical_url: e.target.value })} className="w-full py-2 outline-none font-medium text-sm bg-transparent" placeholder="https://..." />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] uppercase tracking-widest text-carapita-muted block">Descrição Detalhada</label>
                                <textarea rows={3} value={editQuarto.descricao} onChange={e => setEditQuarto({ ...editQuarto, descricao: e.target.value })} className="w-full border border-gray-100 p-5 outline-none focus:border-carapita-gold transition-colors font-light text-sm bg-gray-50/30" placeholder="Descreva os diferenciais deste alojamento..." />
                            </div>

                            {/* ===== GALERIA DE FOTOS ===== */}
                            <div className="space-y-4">
                                <label className="text-[10px] uppercase tracking-widest text-carapita-muted block font-bold">
                                    Galeria de Fotos ({fotosEdit.length} foto{fotosEdit.length !== 1 ? 's' : ''})
                                </label>

                                {/* Fotos actuais */}
                                {fotosEdit.length > 0 && (
                                    <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
                                        {fotosEdit.map((url, idx) => (
                                            <div key={idx} className="relative group/foto aspect-square rounded overflow-hidden border border-gray-100">
                                                <img src={url} className="w-full h-full object-cover" />
                                                {/* Overlay com acções */}
                                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover/foto:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                                                    <div className="flex gap-1">
                                                        <button type="button" onClick={() => moveFoto(idx, -1)} disabled={idx === 0} className="p-1.5 bg-white/20 text-white rounded hover:bg-white/40 disabled:opacity-30 transition-all">
                                                            <ChevronLeft size={14} />
                                                        </button>
                                                        <button type="button" onClick={() => moveFoto(idx, 1)} disabled={idx === fotosEdit.length - 1} className="p-1.5 bg-white/20 text-white rounded hover:bg-white/40 disabled:opacity-30 transition-all">
                                                            <ChevronRight size={14} />
                                                        </button>
                                                    </div>
                                                    <button type="button" onClick={() => removeFoto(idx)} className="p-1.5 bg-red-500/80 text-white rounded hover:bg-red-600 transition-all">
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                                {idx === 0 && (
                                                    <span className="absolute top-1 left-1 bg-carapita-gold text-white text-[8px] px-1.5 py-0.5 uppercase tracking-widest">Principal</span>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Adicionar via Upload do PC */}
                                <div className="border-2 border-dashed border-gray-200 hover:border-carapita-gold transition-colors rounded p-6 text-center cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/*"
                                        multiple
                                        className="hidden"
                                        onChange={handleFileUpload}
                                    />
                                    {uploading ? (
                                        <div className="flex items-center justify-center gap-2">
                                            <div className="w-4 h-4 border-2 border-carapita-gold border-t-transparent rounded-full animate-spin" />
                                            <span className="text-[10px] uppercase tracking-widest text-carapita-muted">A fazer upload...</span>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center gap-2">
                                            <Upload size={22} className="text-carapita-gold" />
                                            <p className="text-[10px] uppercase tracking-widest text-carapita-muted">
                                                Clique para selecionar fotos do PC<br />
                                                <span className="text-carapita-gold font-bold">Pode selecionar múltiplos ficheiros</span>
                                            </p>
                                        </div>
                                    )}
                                </div>

                                {/* Adicionar via URL */}
                                <div className="flex gap-3">
                                    <div className="flex items-center gap-2 flex-1 border-b border-gray-200 focus-within:border-carapita-gold transition-colors pb-1">
                                        <Link size={14} className="text-carapita-muted shrink-0" />
                                        <input
                                            type="url"
                                            value={urlInput}
                                            onChange={e => setUrlInput(e.target.value)}
                                            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addUrlFoto(); } }}
                                            placeholder="Cole um link de imagem (https://...)"
                                            className="w-full py-2 outline-none text-sm bg-transparent"
                                        />
                                    </div>
                                    <button type="button" onClick={addUrlFoto} className="bg-carapita-dark text-white px-6 py-2 text-[10px] uppercase tracking-widest hover:bg-carapita-gold transition-all">
                                        Adicionar
                                    </button>
                                </div>
                            </div>

                            {/* ===== COMODIDADES DO ALOJAMENTO ===== */}
                            <div className="space-y-5">
                                <div className="flex items-center justify-between">
                                    <label className="text-[10px] uppercase tracking-widest text-carapita-muted block font-bold">
                                        Comodidades & Características
                                    </label>
                                    {comodidadesEdit.length > 0 && (
                                        <span className="text-[9px] bg-carapita-gold/10 text-carapita-gold px-2 py-1 rounded-full font-bold">
                                            {comodidadesEdit.length} selecionadas
                                        </span>
                                    )}
                                </div>

                                {AMENITY_CATEGORIES.map((cat) => (
                                    <div key={cat.label}>
                                        <p className="text-[9px] uppercase tracking-widest text-carapita-muted font-bold mb-2 flex items-center gap-1.5">
                                            <span>{cat.icon}</span> {cat.label}
                                        </p>
                                        <div className="flex flex-wrap gap-2">
                                            {cat.items.map(item => {
                                                const selected = comodidadesEdit.includes(item);
                                                return (
                                                    <button
                                                        key={item}
                                                        type="button"
                                                        onClick={() => toggleComodidade(item)}
                                                        className={`text-[10px] px-3 py-1.5 border transition-all duration-200 rounded-sm ${selected
                                                                ? 'bg-carapita-dark text-white border-carapita-dark'
                                                                : 'bg-white text-carapita-muted border-gray-200 hover:border-carapita-gold hover:text-carapita-gold'
                                                            }`}
                                                    >
                                                        {selected && <span className="mr-1">✓</span>}
                                                        {item}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}

                                {/* Campo personalizado */}
                                <div>
                                    <p className="text-[9px] uppercase tracking-widest text-carapita-muted font-bold mb-2">➕ Adicionar item personalizado</p>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={customComodidade}
                                            onChange={e => setCustomComodidade(e.target.value)}
                                            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addCustomComodidade(); } }}
                                            placeholder="Ex: Piscina Privativa, Piano..."
                                            className="flex-1 border-b border-gray-200 focus:border-carapita-gold outline-none py-2 text-sm bg-transparent transition-colors"
                                        />
                                        <button type="button" onClick={addCustomComodidade} className="bg-carapita-dark text-white px-4 py-2 text-[10px] uppercase tracking-widest hover:bg-carapita-gold transition-all">
                                            +
                                        </button>
                                    </div>
                                </div>

                                {/* Resumo dos selecionados */}
                                {comodidadesEdit.length > 0 && (
                                    <div className="bg-gray-50 p-4 rounded border border-gray-100">
                                        <p className="text-[9px] uppercase tracking-widest text-carapita-muted mb-2 font-bold">Selecionadas:</p>
                                        <div className="flex flex-wrap gap-1.5">
                                            {comodidadesEdit.map(c => (
                                                <span
                                                    key={c}
                                                    onClick={() => toggleComodidade(c)}
                                                    className="text-[9px] bg-carapita-dark text-white px-2 py-1 rounded-sm cursor-pointer hover:bg-red-500 transition-colors flex items-center gap-1"
                                                    title="Clique para remover"
                                                >
                                                    {c} <X size={9} />
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="flex items-center gap-4 bg-gray-50/50 p-4 rounded-lg">
                                <div className="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" checked={editQuarto.ativo} onChange={e => setEditQuarto({ ...editQuarto, ativo: e.target.checked })} className="sr-only peer" id="toggle-ativo" />
                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-carapita-gold"></div>
                                    <label htmlFor="toggle-ativo" className="ml-3 text-[10px] uppercase tracking-widest font-bold text-carapita-dark cursor-pointer">Alojamento Disponível no Site</label>
                                </div>
                            </div>

                            <div className="flex justify-end gap-6 pt-10 border-t border-gray-50">
                                <button type="button" onClick={() => setEditQuarto(null)} className="text-[10px] uppercase tracking-mega px-6 py-4 text-carapita-muted hover:text-red-500 transition-colors">Descartar</button>
                                <button type="submit" className="bg-carapita-dark text-white px-12 py-4 text-[10px] uppercase tracking-mega hover:bg-carapita-gold transition-all duration-500 shadow-2xl">
                                    Gravar Inventário
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
