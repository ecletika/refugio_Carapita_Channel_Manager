"use client";
import React, { useState, useEffect } from 'react';
import AdminSidebar from '@/components/AdminSidebar';
import { Mail, Calendar, Search, Trash2, Loader2 } from 'lucide-react';

const EDGE_URL = 'https://vuidkeygtxfbgxvmilya.supabase.co/functions/v1';

export default function AdminMensagensPage() {
    const [mensagens, setMensagens] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [deletandoId, setDeletandoId] = useState<string | null>(null);

    useEffect(() => {
        fetchMensagens();
    }, []);

    const fetchMensagens = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${EDGE_URL}/admin-site/mensagens`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const json = await res.json();
            if (json.status === 'success') {
                setMensagens(json.data || []);
            }
        } catch (error) {
            console.error('Erro ao buscar mensagens', error);
        } finally {
            setLoading(false);
        }
    };

    const deletarMensagem = async (id: string) => {
        if (!confirm('Deseja realmente remover esta mensagem?')) return;
        setDeletandoId(id);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${EDGE_URL}/admin-site/mensagens/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const json = await res.json();
            if (json.status === 'success') {
                setMensagens(prev => prev.filter(m => m.id !== id));
            }
        } catch (error) {
            console.error('Erro ao deletar mensagem', error);
        } finally {
            setDeletandoId(null);
        }
    };

    const formatData = (iso: string) => {
        if (!iso) return '';
        const d = new Date(iso);
        return d.toLocaleDateString('pt-PT', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    };

    const filtradas = mensagens.filter(m =>
        (m.nome?.toLowerCase() || '').includes(search.toLowerCase()) ||
        (m.email?.toLowerCase() || '').includes(search.toLowerCase()) ||
        (m.assunto?.toLowerCase() || '').includes(search.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-[#1E3932] flex font-sans text-white">
            <AdminSidebar />

            <main className="flex-1 ml-0 md:ml-20 p-4 md:p-8 lg:p-12 h-screen overflow-y-auto pb-24 md:pb-4">
                <div className="max-w-4xl mx-auto space-y-8">

                    <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div>
                            <span className="text-[#C4A484] uppercase tracking-widest text-[10px] font-bold mb-2 block">Caixa de Entrada</span>
                            <h1 className="text-3xl md:text-4xl font-serif text-white">Mensagens</h1>
                            <p className="text-white/50 text-sm mt-1">Contactos recebidos pelo site.</p>
                        </div>

                        <div className="relative w-full md:w-72">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" size={16} />
                            <input
                                type="text"
                                placeholder="Pesquisar..."
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 py-2.5 pl-10 pr-4 text-sm text-white focus:border-[#C4A484] focus:outline-none transition-all rounded-lg"
                            />
                        </div>
                    </header>

                    {loading ? (
                        <div className="flex justify-center items-center py-20 gap-3 text-white/50 text-xs uppercase tracking-widest">
                            <Loader2 size={16} className="animate-spin text-[#C4A484]" />
                            A carregar...
                        </div>
                    ) : filtradas.length === 0 ? (
                        <div className="text-center py-20 bg-white/5 border border-white/10 rounded-2xl">
                            <Mail size={40} className="mx-auto text-white/20 mb-4" />
                            <h3 className="text-lg font-serif text-white mb-2">Caixa Vazia</h3>
                            <p className="text-white/50 text-sm">Nenhuma mensagem{search ? ' para esta pesquisa' : ''}.</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {filtradas.map(msg => (
                                <div key={msg.id} className="bg-white/5 border border-white/10 rounded-xl p-5 transition-all hover:border-[#C4A484]/40 group">
                                    <div className="flex flex-col sm:flex-row justify-between gap-3 mb-3">
                                        <div className="min-w-0">
                                            <h3 className="text-base font-semibold text-white truncate">{msg.nome}</h3>
                                            <a href={`mailto:${msg.email}`} className="text-xs text-[#C4A484] hover:underline break-all">
                                                {msg.email}
                                            </a>
                                            {msg.assunto && (
                                                <p className="text-[10px] text-white/60 mt-1 uppercase tracking-widest truncate">{msg.assunto}</p>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-3 flex-shrink-0">
                                            <span className="text-[10px] text-white/40 flex items-center gap-1 whitespace-nowrap">
                                                <Calendar size={10} /> {formatData(msg.criado_em)}
                                            </span>
                                            <button
                                                onClick={() => deletarMensagem(msg.id)}
                                                disabled={deletandoId === msg.id}
                                                className="text-white/20 hover:text-red-400 transition-colors disabled:opacity-50 cursor-pointer"
                                                title="Remover mensagem"
                                            >
                                                {deletandoId === msg.id
                                                    ? <Loader2 size={14} className="animate-spin" />
                                                    : <Trash2 size={14} />
                                                }
                                            </button>
                                        </div>
                                    </div>

                                    <div className="bg-white/5 p-3 rounded-lg text-white/70 text-sm whitespace-pre-wrap leading-relaxed border border-white/5">
                                        {msg.mensagem}
                                    </div>

                                    <div className="mt-3 pt-3 border-t border-white/5">
                                        <a
                                            href={`mailto:${msg.email}?subject=RE: ${encodeURIComponent(msg.assunto || 'Refúgio Carapita')}`}
                                            className="inline-flex items-center gap-2 text-[10px] uppercase tracking-widest font-bold text-[#1E3932] bg-[#C4A484] px-4 py-2 rounded hover:bg-white transition-all cursor-pointer"
                                        >
                                            <Mail size={11} /> Responder
                                        </a>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
