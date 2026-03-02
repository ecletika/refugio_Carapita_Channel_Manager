"use client";
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { LogOut, Calendar, Home } from 'lucide-react';

export default function PerfilHospede() {
    const [reservas, setReservas] = useState<any[]>([]);
    const [usuario, setUsuario] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const token = localStorage.getItem('token');
        const userStr = localStorage.getItem('usuario');

        if (!token || !userStr) {
            router.push('/login');
            return;
        }

        setUsuario(JSON.parse(userStr));

        const fetchReservas = async () => {
            try {
                const resp = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/reservas/minhas-reservas`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const dados = await resp.json();
                if (dados.status === 'success') {
                    setReservas(dados.data);
                }
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };

        fetchReservas();
    }, [router]);

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('usuario');
        router.push('/');
    };

    if (loading) return <div className="min-h-screen bg-white flex items-center justify-center font-sans tracking-mega uppercase text-xs">Carregando...</div>;

    return (
        <main className="min-h-screen bg-gray-50 flex flex-col font-sans">
            {/* Nav do Dashboard */}
            <header className="bg-carapita-dark text-white p-6 md:px-12 flex justify-between items-center shadow-lg">
                <h1 className="text-2xl font-serif tracking-widest uppercase">
                    Meu <span className="text-carapita-gold">Portal</span>
                </h1>
                <div className="flex items-center gap-6">
                    <span className="text-[10px] hidden md:block uppercase tracking-widest text-white/70">Bem-vindo, {usuario?.nome}</span>
                    <button onClick={handleLogout} className="text-white hover:text-carapita-gold transition-colors">
                        <LogOut size={18} />
                    </button>
                    <button onClick={() => router.push('/')} className="text-white hover:text-carapita-gold transition-colors">
                        <Home size={18} />
                    </button>
                </div>
            </header>

            <section className="flex-1 p-6 md:p-12 max-w-7xl mx-auto w-full">
                <div className="mb-12">
                    <h2 className="text-3xl font-serif text-carapita-dark mb-2">Suas Reservas</h2>
                    <p className="text-[10px] text-carapita-muted uppercase tracking-mega">Acompanhe seu histórico no Refúgio Carapita</p>
                </div>

                {reservas.length === 0 ? (
                    <div className="bg-white border border-dashed border-gray-300 p-16 text-center">
                        <p className="text-sm text-carapita-muted font-light uppercase tracking-widest mb-8">Nenhuma reserva encontrada.</p>
                        <button onClick={() => router.push('/#motor')} className="bg-carapita-gold text-white px-8 py-3 text-[10px] uppercase tracking-mega hover:bg-carapita-dark transition-colors">
                            Reservar Agora
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {reservas.map((res: any) => (
                            <div key={res.id} className="bg-white p-8 shadow-sm border border-gray-100 flex flex-col gap-6 hover:border-carapita-gold transition-colors">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <span className="text-[9px] uppercase tracking-widest text-carapita-gold font-bold block mb-1">Status: {res.status}</span>
                                        <h3 className="text-xl font-serif text-carapita-dark">{res.quarto?.nome}</h3>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-sm font-light text-carapita-dark block">Total</span>
                                        <span className="text-lg font-bold text-carapita-gold">€{Number(res.valor_total).toFixed(2)}</span>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4 border-t border-gray-50 pt-6">
                                    <div className="flex items-center gap-3">
                                        <Calendar size={14} className="text-carapita-gold" />
                                        <div className="flex flex-col">
                                            <span className="text-[9px] uppercase text-carapita-muted">Entrada</span>
                                            <span className="text-xs font-medium">{new Date(res.data_check_in).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <Calendar size={14} className="text-carapita-gold" />
                                        <div className="flex flex-col">
                                            <span className="text-[9px] uppercase text-carapita-muted">Saída</span>
                                            <span className="text-xs font-medium">{new Date(res.data_check_out).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                </div>
                                <button className="text-[9px] uppercase tracking-mega text-carapita-muted hover:text-carapita-dark transition-colors text-right">
                                    Ver Detalhes do Voucher &#8594;
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </section>
        </main>
    );
}
