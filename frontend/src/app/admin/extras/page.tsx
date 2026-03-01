"use client";
import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, Check, X, Sparkles } from 'lucide-react';
import AdminSidebar from '../../../components/AdminSidebar';

interface Extra {
    id: string;
    nome: string;
    descricao: string | null;
    preco: number;
    ativo: boolean;
    icone: string | null;
}

export default function AdminExtras() {
    const [extras, setExtras] = useState<Extra[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingExtra, setEditingExtra] = useState<Extra | null>(null);
    const [showAddModal, setShowAddModal] = useState(false);
    const [newExtra, setNewExtra] = useState({ nome: '', descricao: '', preco: 0, icone: '🍷' });

    useEffect(() => {
        fetchExtras();
    }, []);

    const fetchExtras = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const resp = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/extras/admin`, {
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
            const resp = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/extras`, {
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
                setNewExtra({ nome: '', descricao: '', preco: 0, icone: '🍷' });
                fetchExtras();
            }
        } catch (e) {
            console.error(e);
        }
    };

    const handleUpdate = async (id: string, updates: Partial<Extra>) => {
        try {
            const token = localStorage.getItem('token');
            const resp = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/extras/${id}`, {
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
            await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/extras/${id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchExtras();
        } catch (e) {
            console.error(e);
        }
    };

    return (
        <div className="min-h-screen bg-[#F9F8F6]">
            <AdminSidebar />
            <div className="ml-20 p-8 md:p-12 max-w-6xl">
                <div className="flex justify-between items-end mb-10">
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
                                            <span className="text-2xl">{e.icone || '✨'}</span>
                                            <div>
                                                <p className="text-sm font-medium text-carapita-dark">{e.nome}</p>
                                                <p className="text-[10px] text-gray-400 font-light">{e.descricao}</p>
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
            </div>

            {/* Modal de Adicionar */}
            {showAddModal && (
                <div className="fixed inset-0 z-[500] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowAddModal(false)} />
                    <div className="relative bg-white w-full max-w-md p-10 shadow-2xl animate-fade-in border-t-4 border-carapita-gold">
                        <h3 className="text-2xl font-serif text-carapita-dark mb-6 tracking-widest uppercase">Novo Extra</h3>
                        <div className="space-y-4 font-sans">
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
                                <input type="number" className="w-full border border-gray-100 p-3 text-sm" value={newExtra.preco} onChange={e => setNewExtra({ ...newExtra, preco: Number(e.target.value) })} />
                            </div>
                            <button onClick={handleCreate} className="w-full py-4 bg-carapita-dark text-white text-[10px] uppercase tracking-mega font-bold hover:bg-carapita-gold transition-all mt-4">Gravar Extra</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
