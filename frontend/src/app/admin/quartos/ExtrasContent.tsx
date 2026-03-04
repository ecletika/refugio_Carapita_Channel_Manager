"use client";
import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, X, ToggleLeft, ToggleRight } from 'lucide-react';

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
    const [newExtra, setNewExtra] = useState({ nome: '', descricao: '', preco: 0, icone: '🍷', foto: '' });
    const [uploading, setUploading] = useState(false);
    const [telaExtrasAtiva, setTelaExtrasAtiva] = useState(false);
    const [savingToggle, setSavingToggle] = useState(false);

    useEffect(() => {
        fetchExtras();
        fetchTelaConfig();
    }, []);

    const fetchTelaConfig = async () => {
        try {
            const resp = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/site/configuracoes`);
            const json = await resp.json();
            if (json.status === 'success' && json.data) {
                setTelaExtrasAtiva(!!json.data.tela_extras_ativa);
            }
        } catch (e) { console.error(e); }
    };

    const handleToggleTela = async () => {
        setSavingToggle(true);
        const token = localStorage.getItem('token');
        const novoValor = !telaExtrasAtiva;
        try {
            const resp = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/site/configuracoes`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ tela_extras_ativa: novoValor })
            });
            const json = await resp.json();
            if (json.status === 'success') setTelaExtrasAtiva(novoValor);
            else alert('Erro ao atualizar configuração.');
        } catch (e) { alert('Erro de ligação.'); }
        finally { setSavingToggle(false); }
    };

    const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploading(true);
        const token = localStorage.getItem('token');
        const formData = new FormData();
        formData.append('foto', file);
        try {
            const resp = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/upload/`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData
            });
            const data = await resp.json();
            if (data.url) setNewExtra({ ...newExtra, foto: data.url });
        } catch (e) {
            console.error(e);
            alert('Erro no upload');
        } finally {
            setUploading(false);
        }
    };

    const fetchExtras = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const resp = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/extras/admin`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await resp.json();
            if (data.status === 'success') setExtras(data.data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async () => {
        try {
            const token = localStorage.getItem('token');
            const resp = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/extras`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(newExtra)
            });
            const data = await resp.json();
            if (data.status === 'success') {
                setShowAddModal(false);
                setNewExtra({ nome: '', descricao: '', preco: 0, icone: '🍷', foto: '' });
                fetchExtras();
            } else {
                alert('Erro ao criar: ' + (data.error || 'Desconhecido'));
            }
        } catch (e) {
            console.error(e);
        }
    };

    const handleUpdate = async (id: string, updates: Partial<Extra>) => {
        try {
            const token = localStorage.getItem('token');
            const resp = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/extras/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(updates)
            });
            const data = await resp.json();
            if (data.status === 'success') {
                setEditingExtra(null);
                fetchExtras();
            }
        } catch (e) {
            console.error(e);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Eliminar este extra?')) return;
        try {
            const token = localStorage.getItem('token');
            await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/extras/${id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchExtras();
        } catch (e) {
            console.error(e);
        }
    };

    return (
        <div className="w-full">
            <div className="flex justify-between items-end mb-6">
                <div>
                    <span className="text-carapita-gold text-[10px] uppercase tracking-mega font-bold block mb-1">Configurações</span>
                    <h1 className="text-4xl font-serif text-carapita-dark font-light">Gestão de Extras</h1>
                </div>
                <button
                    onClick={() => setShowAddModal(true)}
                    className="bg-carapita-dark text-white px-6 py-3 text-[10px] uppercase tracking-widest font-bold hover:bg-carapita-gold transition-all flex items-center gap-2"
                >
                    <Plus size={14} /> Adicionar Extra
                </button>
            </div>

            {/* Toggle Tela de Personalização */}
            <div className={`flex items-center justify-between p-6 mb-8 border-2 rounded-sm transition-all duration-300 ${telaExtrasAtiva ? 'border-green-200 bg-green-50' : 'border-gray-100 bg-white'}`}>
                <div>
                    <p className={`text-sm font-bold uppercase tracking-widest mb-1 ${telaExtrasAtiva ? 'text-green-700' : 'text-gray-400'}`}>
                        Tela "Personalize a Sua Estadia"
                    </p>
                    <p className="text-[11px] text-gray-400">
                        {telaExtrasAtiva
                            ? '✅ Visível no fluxo de reserva — os hóspedes podem adicionar extras antes de confirmar.'
                            : '⛔ Oculto — o passo de extras não aparece durante a reserva.'}
                    </p>
                </div>
                <button
                    onClick={handleToggleTela}
                    disabled={savingToggle}
                    className="flex items-center gap-3 transition-all disabled:opacity-50"
                    title={telaExtrasAtiva ? 'Desativar tela de extras' : 'Ativar tela de extras'}
                >
                    {telaExtrasAtiva
                        ? <ToggleRight size={48} className="text-green-500" />
                        : <ToggleLeft size={48} className="text-gray-300" />}
                    <span className={`text-[10px] uppercase tracking-widest font-bold ${telaExtrasAtiva ? 'text-green-600' : 'text-gray-400'}`}>
                        {savingToggle ? 'A guardar...' : telaExtrasAtiva ? 'Ativado' : 'Desativado'}
                    </span>
                </button>
            </div>

            <div className="bg-white border border-gray-100 shadow-sm overflow-hidden">
                <table className="w-full text-left font-sans">
                    <thead className="bg-gray-50 border-b border-gray-100 italic">
                        <tr className="text-[10px] uppercase tracking-widest text-gray-400">
                            <th className="px-6 py-4 font-normal">Extra</th>
                            <th className="px-6 py-4 font-normal">Preço</th>
                            <th className="px-6 py-4 font-normal">Estado</th>
                            <th className="px-6 py-4 font-normal text-right">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {extras.map(e => (
                            <tr key={e.id} className="hover:bg-gray-50/50 transition-colors group">
                                <td className="px-6 py-5">
                                    <div className="flex items-center gap-4">
                                        {e.foto ? (
                                            <img src={e.foto} className="w-12 h-12 rounded object-cover border border-gray-100 shadow-sm" alt={e.nome} />
                                        ) : (
                                            <span className="text-2xl w-12 h-12 flex items-center justify-center bg-gray-50 rounded border border-gray-100">{e.icone || '✨'}</span>
                                        )}
                                        <div>
                                            <p className="text-sm font-medium text-carapita-dark">{e.nome}</p>
                                            <p className="text-[10px] text-gray-400 font-light max-w-xs">{e.descricao}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-5">
                                    <span className="text-sm font-medium text-carapita-gold">€{Number(e.preco).toFixed(2)}</span>
                                </td>
                                <td className="px-6 py-5">
                                    <button
                                        onClick={() => handleUpdate(e.id, { ativo: !e.ativo })}
                                        className={`text-[9px] uppercase tracking-widest px-3 py-1 rounded-full border ${e.ativo ? 'bg-green-50 text-green-600 border-green-100' : 'bg-red-50 text-red-600 border-red-100'}`}
                                    >
                                        {e.ativo ? 'Ativo' : 'Inativo'}
                                    </button>
                                </td>
                                <td className="px-6 py-5 text-right">
                                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => setEditingExtra(e)} className="p-2 hover:bg-white border border-transparent hover:border-gray-100 text-gray-400 hover:text-carapita-gold transition-all"><Edit2 size={14} /></button>
                                        <button onClick={() => handleDelete(e.id)} className="p-2 hover:bg-white border border-transparent hover:border-gray-100 text-gray-400 hover:text-red-500 transition-all"><Trash2 size={14} /></button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Modal de Adicionar */}
            {showAddModal && (
                <div className="fixed inset-0 z-[500] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowAddModal(false)} />
                    <div className="relative bg-white w-full max-w-md p-10 shadow-2xl animate-fade-in border-t-4 border-carapita-gold flex flex-col max-h-[90vh]">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-2xl font-serif text-carapita-dark tracking-widest uppercase mb-0">Novo Extra</h3>
                            <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-carapita-dark"><X size={20} /></button>
                        </div>
                        <div className="space-y-4 font-sans overflow-y-auto pr-2 pb-4 flex-1 hide-scrollbars">
                            <div>
                                <label className="text-[10px] uppercase text-gray-400 tracking-widest block mb-1">Ícone (Emoji)</label>
                                <input type="text" className="w-full border border-gray-100 p-3 text-2xl" value={newExtra.icone} onChange={e => setNewExtra({ ...newExtra, icone: e.target.value })} />
                            </div>
                            <div>
                                <label className="text-[10px] uppercase text-gray-400 tracking-widest block mb-1">Nome do Item</label>
                                <input type="text" className="w-full border border-gray-100 p-3 text-sm" value={newExtra.nome} onChange={e => setNewExtra({ ...newExtra, nome: e.target.value })} placeholder="Ex: Cesto VIP Romântico" />
                            </div>
                            <div>
                                <label className="text-[10px] uppercase text-gray-400 tracking-widest block mb-1">Descrição</label>
                                <textarea className="w-full border border-gray-100 p-3 text-sm h-24" value={newExtra.descricao} onChange={e => setNewExtra({ ...newExtra, descricao: e.target.value })} placeholder="Descreva o que está incluído..." />
                            </div>
                            <div>
                                <label className="text-[10px] uppercase text-gray-400 tracking-widest block mb-1">Preço (€)</label>
                                <input type="number" className="w-full border border-gray-100 p-3 text-sm" value={newExtra.preco} onChange={e => setNewExtra({ ...newExtra, preco: Number(e.target.value) })} placeholder="0.00" />
                            </div>
                            <div>
                                <label className="text-[10px] uppercase text-gray-400 tracking-widest block mb-1">Foto do Produto (Bucket)</label>
                                <input type="file" className="text-[10px] w-full" onChange={handlePhotoUpload} />
                                {newExtra.foto && <img src={newExtra.foto} className="w-20 h-20 mt-2 rounded object-cover shadow-sm" />}
                                {uploading && <p className="text-[8px] text-carapita-gold font-bold">A enviar imagem...</p>}
                            </div>
                            <button onClick={handleCreate} disabled={uploading} className="w-full py-4 bg-carapita-dark text-white text-[10px] uppercase tracking-mega font-bold hover:bg-carapita-gold transition-all mt-4 disabled:opacity-50">Gravar Extra</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de Editar */}
            {editingExtra && (
                <div className="fixed inset-0 z-[500] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setEditingExtra(null)} />
                    <div className="relative bg-white w-full max-w-md p-10 shadow-2xl animate-fade-in border-t-4 border-carapita-gold flex flex-col max-h-[90vh]">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-2xl font-serif text-carapita-dark tracking-widest uppercase mb-0">Editar Extra</h3>
                            <button onClick={() => setEditingExtra(null)} className="text-gray-400 hover:text-carapita-dark"><X size={20} /></button>
                        </div>
                        <div className="space-y-4 font-sans overflow-y-auto pr-2 pb-4 flex-1 hide-scrollbars">
                            <div>
                                <label className="text-[10px] uppercase text-gray-400 tracking-widest block mb-1">Ícone</label>
                                <input type="text" className="w-full border border-gray-100 p-3 text-2xl" value={editingExtra.icone || ''} onChange={e => setEditingExtra({ ...editingExtra, icone: e.target.value })} />
                            </div>
                            <div>
                                <label className="text-[10px] uppercase text-gray-400 tracking-widest block mb-1">Nome</label>
                                <input type="text" className="w-full border border-gray-100 p-3 text-sm" value={editingExtra.nome || ''} onChange={e => setEditingExtra({ ...editingExtra, nome: e.target.value })} />
                            </div>
                            <div>
                                <label className="text-[10px] uppercase text-gray-400 tracking-widest block mb-1">Descrição</label>
                                <textarea className="w-full border border-gray-100 p-3 text-sm h-24" value={editingExtra.descricao || ''} onChange={e => setEditingExtra({ ...editingExtra, descricao: e.target.value })} />
                            </div>
                            <div>
                                <label className="text-[10px] uppercase text-gray-400 tracking-widest block mb-1">Preço (€)</label>
                                <input type="number" className="w-full border border-gray-100 p-3 text-sm" value={editingExtra.preco || 0} onChange={e => setEditingExtra({ ...editingExtra, preco: Number(e.target.value) })} />
                            </div>
                            <div>
                                <label className="text-[10px] uppercase text-gray-400 tracking-widest block mb-1">Foto (Nova)</label>
                                <input type="file" className="text-[10px] w-full" onChange={async (e) => {
                                    const file = e.target.files?.[0];
                                    if (!file) return;
                                    setUploading(true);
                                    const token = localStorage.getItem('token');
                                    const formData = new FormData();
                                    formData.append('foto', file);
                                    try {
                                        const resp = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/upload/`, {
                                            method: 'POST',
                                            headers: { 'Authorization': `Bearer ${token}` },
                                            body: formData
                                        });
                                        const data = await resp.json();
                                        if (data.url) setEditingExtra({ ...editingExtra, foto: data.url });
                                    } catch (e) {
                                        alert('Erro no upload');
                                    } finally {
                                        setUploading(false);
                                    }
                                }} />
                                {editingExtra.foto && <img src={editingExtra.foto} className="w-20 h-20 mt-2 rounded object-cover shadow-sm" />}
                            </div>
                            <button onClick={() => handleUpdate(editingExtra.id, editingExtra)} disabled={uploading} className="w-full py-4 bg-carapita-dark text-white text-[10px] uppercase tracking-mega font-bold hover:bg-carapita-gold transition-all mt-4 disabled:opacity-50">Gravar Alterações</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

