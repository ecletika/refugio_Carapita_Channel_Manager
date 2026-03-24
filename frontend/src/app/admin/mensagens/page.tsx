"use client";
import React, { useState, useEffect } from 'react';
import AdminSidebar from '@/components/AdminSidebar';
import { Mail, Calendar, Search, Trash2 } from 'lucide-react';

export default function AdminMensagensPage() {
    const [mensagens, setMensagens] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    useEffect(() => {
        fetchMensagens();
    }, []);

    const fetchMensagens = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/site/mensagens`, {
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
        // Backend delete route not yet implemented, this is just a placeholder action visually
        if (!confirm('Deseja realmente remover esta mensagem da lista?')) return;
        setMensagens(mensagens.filter(m => m.id !== id));
        // You could add a DELETE endpoint later if needed
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
        <div className="min-h-screen bg-carapita-green flex font-sans selection:bg-carapita-gold selection:text-carapita-dark text-white">
            <AdminSidebar />
            
            <main className="flex-1 ml-20 p-8 md:p-12 lg:p-16 h-screen overflow-y-auto">
                <div className="max-w-7xl mx-auto space-y-12 animate-fade-in">
                    
                    <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                        <div>
                            <span className="text-carapita-gold uppercase tracking-mega text-[10px] font-bold mb-2 block">Caixa de Entrada</span>
                            <h1 className="text-4xl md:text-5xl font-serif text-white mb-2">Mensagens</h1>
                            <p className="text-white/50 text-sm font-light">Contatos recebidos através do site.</p>
                        </div>
                        
                        <div className="relative w-full md:w-80">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" size={18} />
                            <input 
                                type="text"
                                placeholder="Pesquisar por nome, email ou assunto..."
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-12 pr-4 text-sm text-white focus:border-carapita-gold focus:outline-none transition-all"
                            />
                        </div>
                    </header>

                    {loading ? (
                        <div className="text-center py-20 text-white/50 uppercase tracking-widest text-xs flex justify-center items-center gap-3">
                            <div className="w-4 h-4 border-2 border-carapita-gold border-t-transparent rounded-full animate-spin"></div>
                            A carregar mensagens...
                        </div>
                    ) : filtradas.length === 0 ? (
                        <div className="text-center py-20 bg-white/5 border border-white/10 rounded-[2rem]">
                            <Mail size={48} className="mx-auto text-white/20 mb-4" />
                            <h3 className="text-xl font-serif text-white mb-2">Caixa Vazia</h3>
                            <p className="text-white/50">Nenhuma mensagem encontrada{search ? ' para esta pesquisa' : ''}.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {filtradas.map(msg => (
                                <div key={msg.id} className="bg-carapita-dark border border-white/10 rounded-2xl p-6 transition-all hover:border-carapita-gold/50 group">
                                    <div className="flex flex-col md:flex-row justify-between gap-4 mb-4">
                                        <div>
                                            <h3 className="text-lg font-bold text-white flex items-center gap-3">
                                                {msg.nome}
                                                <a href={`mailto:${msg.email}`} className="text-xs font-normal text-carapita-gold hover:underline">
                                                    {msg.email}
                                                </a>
                                            </h3>
                                            <p className="text-sm font-medium text-white/80 mt-1 uppercase tracking-widest text-[10px]">{msg.assunto}</p>
                                        </div>
                                        <div className="flex flex-row md:flex-col items-center md:items-end justify-between md:justify-start gap-2">
                                            <span className="text-xs text-white/40 flex items-center gap-2">
                                                <Calendar size={12} /> {formatData(msg.criado_em)}
                                            </span>
                                            <button 
                                                onClick={() => deletarMensagem(msg.id)}
                                                className="text-white/20 hover:text-red-400 transition-colors md:opacity-0 group-hover:opacity-100"
                                                title="Remover (Visto)"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                    
                                    <div className="bg-white/5 p-4 rounded-xl text-white/70 text-sm whitespace-pre-wrap leading-relaxed">
                                        {msg.mensagem}
                                    </div>
                                    
                                    <div className="mt-4 pt-4 border-t border-white/5">
                                        <a 
                                            href={`mailto:${msg.email}?subject=RE: ${encodeURIComponent(msg.assunto || 'Refúgio Carapita')}`} 
                                            className="inline-flex items-center gap-2 text-[10px] uppercase tracking-mega font-bold text-carapita-dark bg-carapita-gold px-4 py-2 rounded-lg hover:bg-white transition-all"
                                        >
                                            <Mail size={12} /> Responder por Email
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
