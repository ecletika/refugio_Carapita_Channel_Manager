"use client";
import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, X, ToggleLeft, ToggleRight, Loader2 } from 'lucide-react';

const EDGE_URL = 'https://vuidkeygtxfbgxvmilya.supabase.co/functions/v1';

interface Extra {
    id: string;
    nome: string;
    descricao: string | null;
    preco: number;
    ativo: boolean;
    icone: string | null;
    foto?: string | null;
}

export function AdminExtrasContent() {
    const [extras, setExtras] = useState<Extra[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingExtra, setEditingExtra] = useState<Extra | null>(null);
    const [showAddModal, setShowAddModal] = useState(false);
    const [newExtra, setNewExtra] = useState({ nome: '', descricao: '', preco: 0, icone: '✦', foto: '' });
    const [uploading, setUploading] = useState(false);
    const [telaExtrasAtiva, setTelaExtrasAtiva] = useState(false);
    const [savingToggle, setSavingToggle] = useState(false);

    useEffect(() => { fetchExtras(); fetchTelaConfig(); }, []);

    const fetchTelaConfig = async () => {
        try {
            const token = localStorage.getItem('token');
            const resp = await fetch(`${EDGE_URL}/admin-site/configuracoes`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const json = await resp.json();
            if (json.status === 'success' && json.data) setTelaExtrasAtiva(!!json.data.tela_extras_ativa);
        } catch (e) { console.error(e); }
    };

    const handleToggleTela = async () => {
        setSavingToggle(true);
        const token = localStorage.getItem('token');
        const novo = !telaExtrasAtiva;
        try {
            const resp = await fetch(`${EDGE_URL}/admin-site/configuracoes`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ tela_extras_ativa: novo })
            });
            const json = await resp.json();
            if (json.status === 'success') setTelaExtrasAtiva(novo);
        } catch { /* silent */ }
        finally { setSavingToggle(false); }
    };

    const uploadPhoto = async (file: File): Promise<string | null> => {
        const token = localStorage.getItem('token');
        const formData = new FormData();
        formData.append('foto', file);
        try {
            const resp = await fetch(`${EDGE_URL}/upload`, { method: 'POST', headers: { 'Authorization': `Bearer ${token}` }, body: formData });
            const data = await resp.json();
            return data.url || null;
        } catch { return null; }
    };

    const fetchExtras = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const resp = await fetch(`${EDGE_URL}/admin-extras`, { headers: { Authorization: `Bearer ${token}` } });
            const data = await resp.json();
            if (data.status === 'success') setExtras(data.data);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const handleCreate = async () => {
        try {
            const token = localStorage.getItem('token');
            const resp = await fetch(`${EDGE_URL}/admin-extras`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify(newExtra)
            });
            const data = await resp.json();
            if (data.status === 'success') {
                setShowAddModal(false);
                setNewExtra({ nome: '', descricao: '', preco: 0, icone: '✦', foto: '' });
                fetchExtras();
            }
        } catch (e) { console.error(e); }
    };

    const handleUpdate = async (id: string, updates: Partial<Extra>) => {
        try {
            const token = localStorage.getItem('token');
            const resp = await fetch(`${EDGE_URL}/admin-extras/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify(updates)
            });
            const data = await resp.json();
            if (data.status === 'success') { setEditingExtra(null); fetchExtras(); }
        } catch (e) { console.error(e); }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Eliminar este extra?')) return;
        try {
            const token = localStorage.getItem('token');
            await fetch(`${EDGE_URL}/admin-extras/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
            fetchExtras();
        } catch (e) { console.error(e); }
    };

    return (
        <div className="w-full">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
                <div>
                    <span className="text-[#C4A484] text-[10px] uppercase tracking-widest font-bold block mb-0.5">Configurações</span>
                    <h2 className="text-2xl md:text-3xl font-serif text-[#1E3932] font-light">Gestão de Extras</h2>
                </div>
                <button
                    type="button"
                    onClick={() => setShowAddModal(true)}
                    className="flex items-center gap-2 bg-[#1E3932] text-[#C4A484] px-5 py-2.5 text-[10px] uppercase tracking-widest font-bold hover:bg-[#C4A484] hover:text-white transition-all duration-300 cursor-pointer min-h-[44px] self-start sm:self-auto">
                    <Plus size={14} /> Adicionar Extra
                </button>
            </div>

            {/* Tela toggle */}
            <div className={`flex items-center justify-between p-5 mb-8 border rounded-lg transition-all duration-300 ${telaExtrasAtiva ? 'border-green-200 bg-green-50' : 'border-gray-100 bg-white'}`}>
                <div className="min-w-0 mr-4">
                    <p className={`text-sm font-bold uppercase tracking-widest mb-1 ${telaExtrasAtiva ? 'text-green-700' : 'text-gray-400'}`}>
                        Tela "Personalize a Sua Estadia"
                    </p>
                    <p className="text-[11px] text-gray-400 leading-relaxed">
                        {telaExtrasAtiva
                            ? 'Visível no fluxo de reserva — os hóspedes podem adicionar extras antes de confirmar.'
                            : 'Oculto — o passo de extras não aparece durante a reserva.'}
                    </p>
                </div>
                <button
                    type="button"
                    onClick={handleToggleTela}
                    disabled={savingToggle}
                    className="flex items-center gap-2 transition-all disabled:opacity-50 cursor-pointer shrink-0"
                    title={telaExtrasAtiva ? 'Desativar' : 'Ativar'}>
                    {savingToggle
                        ? <Loader2 size={24} className="text-[#C4A484] animate-spin" />
                        : telaExtrasAtiva
                            ? <ToggleRight size={40} className="text-green-500" />
                            : <ToggleLeft size={40} className="text-gray-300" />}
                    <span className={`text-[10px] uppercase tracking-widest font-bold hidden sm:block ${telaExtrasAtiva ? 'text-green-600' : 'text-gray-400'}`}>
                        {telaExtrasAtiva ? 'Ativado' : 'Desativado'}
                    </span>
                </button>
            </div>

            {/* Extras list */}
            {loading ? (
                <div className="flex justify-center py-12">
                    <Loader2 size={20} className="text-[#C4A484] animate-spin" />
                </div>
            ) : extras.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-14 bg-white border border-dashed border-gray-200 rounded-lg gap-3">
                    <p className="text-sm text-gray-300">Nenhum extra registado.</p>
                </div>
            ) : (
                <>
                    {/* Desktop table */}
                    <div className="hidden sm:block bg-white border border-gray-100 rounded-lg overflow-hidden">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 border-b border-gray-100">
                                <tr className="text-[10px] uppercase tracking-widest text-gray-400">
                                    <th className="px-5 py-4 font-normal">Extra</th>
                                    <th className="px-5 py-4 font-normal">Preço</th>
                                    <th className="px-5 py-4 font-normal">Estado</th>
                                    <th className="px-5 py-4 font-normal text-right">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {extras.map(e => (
                                    <tr key={e.id} className="hover:bg-gray-50/50 transition-colors group">
                                        <td className="px-5 py-4">
                                            <div className="flex items-center gap-3">
                                                {e.foto
                                                    ? <img src={e.foto} className="w-10 h-10 rounded object-cover border border-gray-100" alt={e.nome} />
                                                    : <span className="w-10 h-10 flex items-center justify-center bg-gray-50 rounded border border-gray-100 text-lg">{e.icone || '✦'}</span>}
                                                <div>
                                                    <p className="text-sm font-medium text-[#1E3932]">{e.nome}</p>
                                                    <p className="text-[10px] text-gray-400 max-w-xs truncate">{e.descricao}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-5 py-4">
                                            <span className="text-sm font-bold text-[#C4A484]">€{Number(e.preco).toFixed(2)}</span>
                                        </td>
                                        <td className="px-5 py-4">
                                            <button type="button" onClick={() => handleUpdate(e.id, { ativo: !e.ativo })}
                                                className={`text-[9px] uppercase tracking-widest px-3 py-1 rounded-full border cursor-pointer transition-all ${e.ativo ? 'bg-green-50 text-green-600 border-green-100 hover:bg-red-50 hover:text-red-500 hover:border-red-100' : 'bg-red-50 text-red-500 border-red-100 hover:bg-green-50 hover:text-green-600 hover:border-green-100'}`}>
                                                {e.ativo ? 'Ativo' : 'Inativo'}
                                            </button>
                                        </td>
                                        <td className="px-5 py-4 text-right">
                                            <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button type="button" onClick={() => setEditingExtra(e)}
                                                    className="w-9 h-9 flex items-center justify-center text-gray-400 hover:text-[#C4A484] hover:bg-gray-50 rounded border border-gray-100 transition-all cursor-pointer">
                                                    <Edit2 size={13} />
                                                </button>
                                                <button type="button" onClick={() => handleDelete(e.id)}
                                                    className="w-9 h-9 flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 rounded border border-gray-100 transition-all cursor-pointer">
                                                    <Trash2 size={13} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Mobile cards */}
                    <div className="sm:hidden space-y-3">
                        {extras.map(e => (
                            <div key={e.id} className="bg-white border border-gray-100 rounded-lg p-4">
                                <div className="flex items-start gap-3 mb-3">
                                    {e.foto
                                        ? <img src={e.foto} className="w-12 h-12 rounded object-cover border border-gray-100 shrink-0" alt={e.nome} />
                                        : <span className="w-12 h-12 flex items-center justify-center bg-gray-50 rounded border border-gray-100 text-xl shrink-0">{e.icone || '✦'}</span>}
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-[#1E3932]">{e.nome}</p>
                                        <p className="text-[11px] text-gray-400 mt-0.5 leading-relaxed">{e.descricao}</p>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between border-t border-gray-50 pt-3">
                                    <div className="flex items-center gap-3">
                                        <span className="text-sm font-bold text-[#C4A484]">€{Number(e.preco).toFixed(2)}</span>
                                        <button type="button" onClick={() => handleUpdate(e.id, { ativo: !e.ativo })}
                                            className={`text-[9px] uppercase tracking-widest px-2.5 py-1 rounded-full border cursor-pointer transition-all ${e.ativo ? 'bg-green-50 text-green-600 border-green-100' : 'bg-red-50 text-red-500 border-red-100'}`}>
                                            {e.ativo ? 'Ativo' : 'Inativo'}
                                        </button>
                                    </div>
                                    <div className="flex gap-2">
                                        <button type="button" onClick={() => setEditingExtra(e)}
                                            className="w-9 h-9 flex items-center justify-center text-gray-400 hover:text-[#C4A484] rounded border border-gray-100 transition-colors cursor-pointer">
                                            <Edit2 size={13} />
                                        </button>
                                        <button type="button" onClick={() => handleDelete(e.id)}
                                            className="w-9 h-9 flex items-center justify-center text-gray-400 hover:text-red-500 rounded border border-gray-100 transition-colors cursor-pointer">
                                            <Trash2 size={13} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            )}

            {/* ── Modal Adicionar / Editar ────────────────────────────────────── */}
            {(showAddModal || editingExtra) && (
                <ExtraModal
                    title={editingExtra ? 'Editar Extra' : 'Novo Extra'}
                    data={editingExtra || newExtra}
                    onClose={() => { setShowAddModal(false); setEditingExtra(null); }}
                    onSave={editingExtra ? (d) => handleUpdate(editingExtra.id, d) : (d) => { setNewExtra(d as any); handleCreate(); }}
                    onChange={editingExtra ? (d) => setEditingExtra({ ...editingExtra, ...d }) : (d) => setNewExtra({ ...newExtra, ...d })}
                    uploadPhoto={uploadPhoto}
                    uploading={uploading}
                    setUploading={setUploading}
                />
            )}
        </div>
    );
}

// ── Extra Modal ──────────────────────────────────────────────────────────────
function ExtraModal({ title, data, onClose, onSave, onChange, uploadPhoto, uploading, setUploading }: {
    title: string;
    data: any;
    onClose: () => void;
    onSave: (d: any) => void;
    onChange: (d: any) => void;
    uploadPhoto: (f: File) => Promise<string | null>;
    uploading: boolean;
    setUploading: (v: boolean) => void;
}) {
    const handlePhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploading(true);
        const url = await uploadPhoto(file);
        if (url) onChange({ foto: url });
        setUploading(false);
    };

    return (
        <div className="fixed inset-0 z-[500] flex items-end sm:items-center justify-center p-0 sm:p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white w-full sm:max-w-md shadow-2xl border-t-4 border-[#C4A484] flex flex-col max-h-[90vh] rounded-t-2xl sm:rounded-lg">
                {/* Header */}
                <div className="flex justify-between items-center px-6 py-5 border-b border-gray-100 shrink-0">
                    <h3 className="text-xl font-serif text-[#1E3932]">{title}</h3>
                    <button type="button" onClick={onClose}
                        className="text-gray-400 hover:text-[#1E3932] transition-colors cursor-pointer p-2 min-h-[44px] min-w-[44px] flex items-center justify-center">
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">
                    <div>
                        <label className="text-[10px] uppercase text-gray-400 tracking-widest block mb-1.5">Ícone / Emoji</label>
                        <input type="text" className="w-full border border-gray-100 p-3 text-2xl rounded-lg outline-none focus:border-[#C4A484] transition-colors"
                            value={data.icone || ''} onChange={e => onChange({ icone: e.target.value })} />
                    </div>
                    <div>
                        <label className="text-[10px] uppercase text-gray-400 tracking-widest block mb-1.5">Nome do Item</label>
                        <input type="text" className="w-full border border-gray-100 p-3 text-sm rounded-lg outline-none focus:border-[#C4A484] transition-colors"
                            value={data.nome || ''} onChange={e => onChange({ nome: e.target.value })} placeholder="Ex: Cesto VIP Romântico" />
                    </div>
                    <div>
                        <label className="text-[10px] uppercase text-gray-400 tracking-widest block mb-1.5">Descrição</label>
                        <textarea className="w-full border border-gray-100 p-3 text-sm h-20 rounded-lg outline-none focus:border-[#C4A484] transition-colors resize-none"
                            value={data.descricao || ''} onChange={e => onChange({ descricao: e.target.value })} placeholder="Descreva o que está incluído..." />
                    </div>
                    <div>
                        <label className="text-[10px] uppercase text-gray-400 tracking-widest block mb-1.5">Preço (€)</label>
                        <input type="number" className="w-full border border-gray-100 p-3 text-sm rounded-lg outline-none focus:border-[#C4A484] transition-colors"
                            value={data.preco || 0} onChange={e => onChange({ preco: Number(e.target.value) })} placeholder="0.00" />
                    </div>
                    <div>
                        <label className="text-[10px] uppercase text-gray-400 tracking-widest block mb-1.5">Foto do Produto</label>
                        <input type="file" accept="image/*" className="text-[10px] w-full" onChange={handlePhoto} />
                        {data.foto && <img src={data.foto} className="w-16 h-16 mt-2 rounded object-cover shadow-sm" alt="" />}
                        {uploading && (
                            <div className="flex items-center gap-2 mt-2">
                                <Loader2 size={12} className="text-[#C4A484] animate-spin" />
                                <span className="text-[9px] text-[#C4A484] uppercase tracking-widest">A enviar imagem...</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-5 border-t border-gray-100 shrink-0">
                    <button type="button" onClick={() => onSave(data)} disabled={uploading}
                        className="w-full py-3.5 bg-[#1E3932] text-[#C4A484] text-[10px] uppercase tracking-widest font-bold hover:bg-[#C4A484] hover:text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer rounded">
                        {uploading ? 'A enviar...' : 'Guardar'}
                    </button>
                </div>
            </div>
        </div>
    );
}
