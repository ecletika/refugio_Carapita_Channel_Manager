"use client";
import React, { useState, useEffect } from 'react';
import { Calendar, User, Home, Euro, Info, Tag } from 'lucide-react';
import AdminSidebar from '@/components/AdminSidebar';

interface Reserva {
    id: string;
    data_check_in: string;
    data_check_out: string;
    status: string;
    valor_total: number;
    quarto: { nome: string };
    hospede: { nome: string, email: string, telefone: string };
    canal: { nome_canal: string };
    criado_em: string;
    extras_ids?: string[] | null;
}

export default function AdminReservas() {
    const [reservas, setReservas] = useState<Reserva[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchReservas = async () => {
        const token = localStorage.getItem('token');
        try {
            const resp = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/reservas`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await resp.json();
            if (data.status === 'success') setReservas(data.data);
        } catch (e) {
            console.error("Erro ao buscar reservas", e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchReservas(); }, []);

    const updateStatus = async (id: string, endpoint: string) => {
        const token = localStorage.getItem('token');
        try {
            const resp = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/reservas/${id}/${endpoint}`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await resp.json();
            if (data.status === 'success') {
                fetchReservas();
            } else {
                alert(data.error || 'Erro ao atualizar status');
            }
        } catch (e) {
            alert('Erro de comunicação com o servidor');
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'CONFIRMADA': return 'bg-green-100 text-green-800';
            case 'PENDENTE': return 'bg-yellow-100 text-yellow-800';
            case 'CANCELADA': return 'bg-red-100 text-red-800';
            case 'CHECK_IN': return 'bg-blue-100 text-blue-800';
            case 'CHECK_OUT': return 'bg-purple-100 text-purple-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    if (loading) return (
        <div className="min-h-screen bg-[#F9F8F6] flex items-center justify-center">
            <div className="text-center">
                <div className="w-8 h-8 border-2 border-carapita-gold border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="text-[10px] uppercase tracking-widest text-gray-400">A carregar o livro de reservas...</p>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#F9F8F6]">
            <AdminSidebar />

            <div className="ml-20 p-8 md:p-12 max-w-7xl mx-auto">
                <div className="flex justify-between items-end mb-12">
                    <div>
                        <span className="text-carapita-gold text-[10px] uppercase tracking-mega font-bold">Gestão</span>
                        <h1 className="text-4xl font-serif text-carapita-dark">Livro de Reservas</h1>
                    </div>
                    <button
                        onClick={() => window.location.href = '/admin/reservas/nova'}
                        className="bg-carapita-dark text-white px-8 py-4 text-[10px] uppercase tracking-mega hover:bg-carapita-gold transition-all duration-500 shadow-xl shadow-carapita-dark/10"
                    >
                        + Reserva Manual
                    </button>
                </div>

                <div className="grid grid-cols-1 gap-6">
                    {reservas.length === 0 ? (
                        <div className="bg-white p-20 text-center border border-gray-100 shadow-sm">
                            <p className="text-carapita-muted uppercase tracking-widest text-[10px]">Nenhuma reserva encontrada no sistema.</p>
                        </div>
                    ) : (
                        reservas.map((res) => (
                            <div key={res.id} className="bg-white border border-gray-100 flex flex-col xl:flex-row divide-y xl:divide-y-0 xl:divide-x divide-gray-100 hover:shadow-2xl transition-all duration-500 overflow-hidden group">
                                {/* Col 1: Datas e Status */}
                                <div className="p-8 lg:w-64 flex flex-col justify-center bg-gray-50/20 group-hover:bg-white transition-colors">
                                    <div className={`text-[9px] uppercase tracking-widest font-bold px-3 py-1 rounded-full w-fit mb-6 shadow-sm ${getStatusColor(res.status)}`}>
                                        {res.status}
                                    </div>
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2 text-carapita-dark">
                                            <Calendar size={14} className="text-carapita-gold" />
                                            <span className="text-sm font-medium">{new Date(res.data_check_in).toLocaleDateString('pt-PT')}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-carapita-muted ml-5">
                                            <span className="text-[10px] text-gray-300">até</span>
                                            <span className="text-sm font-light">{new Date(res.data_check_out).toLocaleDateString('pt-PT')}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Col 2: Hóspede e Quarto */}
                                <div className="p-8 flex-1 grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="flex flex-col justify-center">
                                        <div className="flex items-center gap-2 mb-3">
                                            <div className="w-8 h-8 rounded-full bg-carapita-gold/10 flex items-center justify-center text-carapita-gold font-serif">
                                                {res.hospede.nome.charAt(0)}
                                            </div>
                                            <h3 className="font-serif text-xl text-carapita-dark group-hover:text-carapita-gold transition-colors">{res.hospede.nome}</h3>
                                        </div>
                                        <p className="text-[10px] text-carapita-muted uppercase tracking-widest mb-1 flex items-center gap-2">
                                            <span className="w-1 h-1 rounded-full bg-carapita-gold" />
                                            {res.hospede.email}
                                        </p>
                                        <p className="text-[10px] text-carapita-muted uppercase tracking-widest flex items-center gap-2">
                                            <span className="w-1 h-1 rounded-full bg-carapita-gold" />
                                            {res.hospede.telefone || 'Sem telefone'}
                                        </p>
                                    </div>
                                    <div className="flex flex-col justify-center">
                                        <div className="flex items-center gap-2 mb-3">
                                            <Home size={16} className="text-carapita-gold" />
                                            <h3 className="font-serif text-xl text-carapita-dark">{res.quarto.nome}</h3>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Tag size={12} className="text-carapita-gold/40" />
                                            <span className="text-[10px] text-carapita-muted uppercase tracking-widest font-medium">Origem Canal: {res.canal.nome_canal}</span>
                                        </div>
                                        {res.extras_ids && res.extras_ids.length > 0 && (
                                            <div className="mt-2 text-[10px] text-carapita-gold font-bold uppercase tracking-widest bg-carapita-gold/10 px-2 py-1 rounded w-fit">
                                                +{res.extras_ids.length} Extra(s) Selecionados
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Col 3: Financeiro e Info */}
                                <div className="p-8 lg:w-72 flex flex-col justify-center bg-gray-50/50 group-hover:bg-carapita-gold/5 transition-colors">
                                    <div className="flex flex-col mb-4">
                                        <span className="text-[9px] uppercase tracking-widest text-carapita-muted mb-1">Total da Reserva</span>
                                        <div className="flex items-baseline gap-1">
                                            <span className="text-sm font-serif text-carapita-gold">€</span>
                                            <span className="text-3xl font-serif text-carapita-dark">{Number(res.valor_total).toLocaleString('pt-PT', { minimumFractionDigits: 2 })}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 text-carapita-muted border-t border-gray-200/50 pt-4">
                                        <Info size={12} />
                                        <span className="text-[9px] uppercase tracking-widest leading-tight">Registada em:<br /> {new Date(res.criado_em).toLocaleString('pt-PT')}</span>
                                    </div>
                                </div>

                                {/* Col 4: Ações Administrativas */}
                                <div className="p-8 lg:w-48 flex flex-col gap-2 justify-center bg-white">
                                    {res.status === 'PENDENTE' && (
                                        <button onClick={() => updateStatus(res.id, 'confirmar')} className="w-full py-2 bg-green-600 text-white text-[9px] uppercase tracking-widest font-bold hover:bg-green-700 transition-colors">Confirmar</button>
                                    )}
                                    {res.status === 'CONFIRMADA' && (
                                        <button onClick={() => updateStatus(res.id, 'checkin')} className="w-full py-2 bg-blue-600 text-white text-[9px] uppercase tracking-widest font-bold hover:bg-blue-700 transition-colors">Check-in</button>
                                    )}
                                    {res.status === 'CHECK_IN' && (
                                        <button onClick={() => updateStatus(res.id, 'checkout')} className="w-full py-2 bg-purple-600 text-white text-[9px] uppercase tracking-widest font-bold hover:bg-purple-700 transition-colors">Check-out</button>
                                    )}
                                    {res.status !== 'CANCELADA' && res.status !== 'CHECK_OUT' && (
                                        <button onClick={() => updateStatus(res.id, 'cancelar')} className="w-full py-2 border border-red-200 text-red-500 text-[9px] uppercase tracking-widest hover:bg-red-50 transition-colors">Cancelar</button>
                                    )}
                                    {(res.status === 'CANCELADA' || res.status === 'CHECK_OUT') && (
                                        <span className="text-[8px] uppercase tracking-widest text-gray-400 text-center italic">Sem ações</span>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
