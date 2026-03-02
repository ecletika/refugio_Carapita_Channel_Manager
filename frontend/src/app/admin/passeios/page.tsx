"use client";
import React, { useState, useEffect } from 'react';
import AdminSidebar from '@/components/AdminSidebar';
import { Plus, Trash2, Edit2, MapPin, Image as ImageIcon, Eye, EyeOff } from 'lucide-react';

interface Passeio {
    id: string;
    nome: string;
    dist: string;
    img: string;
    desc: string;
    historia: string;
    ativo: boolean;
}

export default function AdminPasseios() {
    const [passeios, setPasseios] = useState<Passeio[]>([]);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState<Passeio | null>(null);

    const [formData, setFormData] = useState({
        nome: '',
        dist: '',
        img: '',
        desc: '',
        historia: '',
        ativo: true
    });

    const fetchPasseios = async () => {
        try {
            const resp = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/site/passeios`);
            const json = await resp.json();
            if (json.status === 'success') {
                setPasseios(json.data);
            }
        } catch (e) { console.error(e); } finally { setLoading(false); }
    };

    useEffect(() => { fetchPasseios(); }, []);

    const resetForm = () => {
        setEditing(null);
        setFormData({ nome: '', dist: '', img: '', desc: '', historia: '', ativo: true });
    };

    const handleEdit = (p: Passeio) => {
        setEditing(p);
        setFormData({ nome: p.nome, dist: p.dist, img: p.img, desc: p.desc, historia: p.historia, ativo: p.ativo });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleToggleAtivo = async (p: Passeio) => {
        const token = localStorage.getItem('token');
        try {
            const resp = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/site/passeios/${p.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ ...p, ativo: !p.ativo })
            });
            const json = await resp.json();
            if (json.status === 'success') fetchPasseios();
        } catch (e) { alert('Erro ao alterar status'); }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Tem a certeza que deseja remover este passeio?')) return;
        const token = localStorage.getItem('token');
        try {
            const resp = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/site/passeios/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const json = await resp.json();
            if (json.status === 'success') fetchPasseios();
        } catch (e) { alert('Erro ao remover'); }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const token = localStorage.getItem('token');

        try {
            const url = editing ? `${process.env.NEXT_PUBLIC_API_URL}/api/site/passeios/${editing.id}` : `${process.env.NEXT_PUBLIC_API_URL}/api/site/passeios`;
            const method = editing ? 'PUT' : 'POST';

            const resp = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });

            const json = await resp.json();
            if (json.status === 'success') {
                alert(editing ? 'Atualizado com sucesso!' : 'Passeio criado com sucesso!');
                resetForm();
                fetchPasseios();
            } else {
                alert('Erro ao salvar.');
            }
        } catch (e) { alert('Erro de conexão.'); }
    };

    if (loading) return (
        <div className="min-h-screen bg-[#F9F8F6] flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-carapita-gold border-t-transparent rounded-full animate-spin" />
        </div>
    );

    return (
        <div className="min-h-screen bg-[#F9F8F6]">
            <AdminSidebar />
            <div className="ml-20 p-8 md:p-12 max-w-6xl mx-auto">
                <div className="flex items-end justify-between mb-12">
                    <div>
                        <span className="text-carapita-gold text-[10px] uppercase tracking-mega font-bold block mb-1">
                            Apresentação
                        </span>
                        <h1 className="text-4xl font-serif text-carapita-dark font-light">
                            Gestão de Passeios
                        </h1>
                    </div>
                </div>

                {/* Formulario de Criacao / Edicao */}
                <div className="bg-white border border-gray-100 p-8 shadow-sm mb-12">
                    <h3 className="text-xl font-serif text-carapita-dark mb-6 border-b border-gray-50 pb-4">
                        {editing ? `A Editar: ${editing.nome}` : 'Adicionar Novo Passeio'}
                    </h3>
                    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="flex flex-col gap-2">
                                <label className="text-[10px] uppercase tracking-widest text-carapita-muted font-bold">Nome do Local</label>
                                <input required type="text" value={formData.nome} onChange={e => setFormData({ ...formData, nome: e.target.value })} className="border border-gray-200 p-3 outline-none focus:border-carapita-gold text-sm" placeholder="Ex: Castelo de Ourém" />
                            </div>
                            <div className="flex flex-col gap-2">
                                <label className="text-[10px] uppercase tracking-widest text-carapita-muted font-bold">Distância Curta</label>
                                <input required type="text" value={formData.dist} onChange={e => setFormData({ ...formData, dist: e.target.value })} className="border border-gray-200 p-3 outline-none focus:border-carapita-gold text-sm" placeholder="Ex: 5 min, 10 km..." />
                            </div>
                        </div>

                        <div className="flex flex-col gap-2">
                            <label className="text-[10px] uppercase tracking-widest text-carapita-muted flex items-center gap-2 font-bold"><ImageIcon size={14} /> URL da Imagem principal</label>
                            <input required type="url" value={formData.img} onChange={e => setFormData({ ...formData, img: e.target.value })} className="border border-gray-200 p-3 outline-none focus:border-carapita-gold text-sm bg-gray-50" placeholder="https://..." />
                        </div>

                        <div className="flex flex-col gap-2">
                            <label className="text-[10px] uppercase tracking-widest text-carapita-muted font-bold">Descrição Curta (Aparece no Card Principal)</label>
                            <textarea required rows={2} value={formData.desc} onChange={e => setFormData({ ...formData, desc: e.target.value })} className="border border-gray-200 p-3 outline-none focus:border-carapita-gold text-sm" placeholder="Breve resumo atraente..." />
                        </div>

                        <div className="flex flex-col gap-2">
                            <label className="text-[10px] uppercase tracking-widest text-carapita-muted font-bold">História Completa (Aparece ao clicar/Modal)</label>
                            <textarea required rows={5} value={formData.historia} onChange={e => setFormData({ ...formData, historia: e.target.value })} className="border border-gray-200 p-3 outline-none focus:border-carapita-gold text-sm leading-relaxed" placeholder="Toda a história do lugar..." />
                        </div>

                        <div className="flex justify-end gap-4 mt-4">
                            {editing && (
                                <button type="button" onClick={resetForm} className="px-6 py-3 border border-gray-200 text-gray-500 text-[10px] uppercase tracking-widest hover:bg-gray-50">Cancelar</button>
                            )}
                            <button type="submit" className="bg-carapita-dark text-white px-8 py-3 text-[10px] uppercase tracking-widest hover:bg-carapita-gold transition-colors flex items-center gap-2">
                                {editing ? 'Atualizar Dados' : <><Plus size={14} /> Adicionar Passeio</>}
                            </button>
                        </div>
                    </form>
                </div>

                {/* Lista de Passeios */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {passeios.map(p => (
                        <div key={p.id} className="bg-white border border-gray-100 flex flex-col hover:shadow-xl transition-shadow overflow-hidden group">
                            <div className="h-48 relative overflow-hidden bg-gray-100">
                                <img src={p.img} alt={p.nome} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                                <div className="absolute top-4 left-4 bg-white/90 px-3 py-1 flex items-center gap-1 text-[9px] uppercase font-bold text-carapita-dark shadow-sm">
                                    <MapPin size={10} className="text-carapita-gold" /> {p.dist}
                                </div>
                            </div>
                            <div className="p-6 flex-1 flex flex-col">
                                <h4 className="font-serif text-xl text-carapita-dark mb-2">{p.nome}</h4>
                                <p className="text-xs text-gray-500 font-light line-clamp-2 mb-6">{p.desc}</p>

                                <div className="mt-auto flex justify-between items-center border-t border-gray-50 pt-4">
                                    <button onClick={() => handleToggleAtivo(p)} className={`text-[10px] uppercase font-bold tracking-widest flex items-center gap-1 ${p.ativo ? 'text-green-500 hover:text-green-600' : 'text-gray-400 hover:text-gray-500'}`}>
                                        {p.ativo ? <><Eye size={12} /> Ativado</> : <><EyeOff size={12} /> Oculto</>}
                                    </button>
                                    <div className="flex gap-2 text-carapita-gold">
                                        <button onClick={() => handleEdit(p)} className="p-2 hover:bg-carapita-gold/10 rounded transition-colors" title="Editar">
                                            <Edit2 size={14} />
                                        </button>
                                        <button onClick={() => handleDelete(p.id)} className="text-red-400 hover:bg-red-50 p-2 rounded transition-colors" title="Remover">
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
                {passeios.length === 0 && <p className="text-center text-gray-400 uppercase tracking-widest text-[10px] py-12">Nenhum passeio cadastrado na base de dados.</p>}
            </div>
        </div>
    );
}
