"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar, Euro, Info, ArrowLeft } from 'lucide-react';

export default function TarifasPublicas() {
    const router = useRouter();
    const [tarifas, setTarifas] = useState<any[]>([]);
    const [quartos, setQuartos] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchTarifas = async () => {
            try {
                const [tResp, qResp] = await Promise.all([
                    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/tarifas`),
                    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/quartos`)
                ]);
                const tData = await tResp.json();
                const qData = await qResp.json();
                if (tData.status === 'success') setTarifas(tData.data);
                if (qData.status === 'success') setQuartos(qData.data);
            } catch (e) {
                console.error("Erro ao carregar tarifas", e);
            } finally {
                setLoading(false);
            }
        };
        fetchTarifas();
    }, []);

    if (loading) return (
        <div className="min-h-screen bg-[#F9F8F6] flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-carapita-gold border-t-transparent rounded-full animate-spin" />
        </div>
    );

    return (
        <main className="min-h-screen bg-[#F9F8F6] font-sans">
            {/* Minimal Header */}
            <header className="bg-carapita-dark text-white p-6 flex items-center justify-between shadow-md">
                <button onClick={() => router.push('/')} className="flex items-center gap-2 text-[10px] uppercase tracking-widest hover:text-carapita-gold transition-colors">
                    <ArrowLeft size={14} />
                    <span>Voltar à Home</span>
                </button>
                <div className="text-center">
                    <h1 className="font-serif text-2xl tracking-widest uppercase font-light">
                        Refúgio <span className="text-carapita-gold font-sans">Carapita</span>
                    </h1>
                </div>
                <div className="w-24"></div> {/* Balance header */}
            </header>

            <section className="max-w-5xl mx-auto px-6 py-20">
                <div className="text-center mb-16">
                    <span className="text-carapita-gold uppercase tracking-mega text-[10px] font-semibold block mb-4">Planeie a sua Estadia</span>
                    <h2 className="text-4xl md:text-5xl font-serif text-carapita-dark font-light mb-6">Tabela de Tarifas</h2>
                    <p className="text-sm text-carapita-muted font-light max-w-2xl mx-auto leading-relaxed">
                        Conheça os nossos preços base por noite e as tarifas especiais aplicadas durante feriados e épocas festivas.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                    {quartos.map(q => (
                        <div key={q.id} className="bg-white border border-gray-100 shadow-xl overflow-hidden group">
                            <div className="bg-carapita-dark text-white p-8 text-center relative overflow-hidden">
                                <div className="absolute inset-0 bg-gradient-to-br from-carapita-dark to-black opacity-50"></div>
                                <div className="relative z-10">
                                    <h3 className="text-3xl font-serif mb-2">{q.nome}</h3>
                                    <p className="text-[10px] uppercase tracking-widest text-carapita-gold mb-6">{q.tipo}</p>

                                    <div className="inline-block border-t border-b border-carapita-gold/30 py-4 px-8 mt-4">
                                        <span className="text-[10px] uppercase tracking-widest block mb-2 opacity-80">Tarifa Base</span>
                                        <div className="flex items-center justify-center gap-1">
                                            <span className="text-xl font-serif text-carapita-gold">€</span>
                                            <span className="text-5xl font-serif">{q.preco_base}</span>
                                            <span className="text-[10px] font-light opacity-70">/noite</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="p-8">
                                <h4 className="text-[10px] uppercase tracking-widest font-bold text-carapita-muted mb-6 flex items-center gap-2 border-b border-gray-100 pb-3">
                                    <Calendar size={14} className="text-carapita-gold" /> Épocas Especiais Configuradas
                                </h4>

                                <div className="space-y-4">
                                    {tarifas.filter(t => t.quarto_id === q.id).length === 0 ? (
                                        <p className="text-sm text-gray-400 italic">Nenhuma tarifa especial para esta acomodação.</p>
                                    ) : (
                                        tarifas.filter(t => t.quarto_id === q.id).map(t => (
                                            <div key={t.id} className="flex items-center justify-between p-4 bg-gray-50 border border-gray-100 hover:border-carapita-gold/50 transition-colors">
                                                <div>
                                                    <p className="font-serif text-carapita-dark text-lg mb-1">{t.motivo}</p>
                                                    <p className="text-[10px] uppercase tracking-widest text-carapita-muted">
                                                        {new Date(t.data_inicio).toLocaleDateString('pt-PT')} a {new Date(t.data_fim).toLocaleDateString('pt-PT')}
                                                    </p>
                                                </div>
                                                <div className="text-right">
                                                    <div className="flex items-center gap-1 mb-1">
                                                        <span className="text-lg font-serif text-carapita-gold">€</span>
                                                        <span className="text-2xl font-serif text-carapita-dark">{t.preco_noite}</span>
                                                    </div>
                                                    <span className="text-[9px] uppercase tracking-widest text-carapita-muted">/noite</span>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="mt-16 bg-carapita-gold/5 border border-carapita-gold/20 p-8 text-center max-w-3xl mx-auto rounded-xl flex flex-col items-center">
                    <Info size={24} className="text-carapita-gold mb-4" />
                    <p className="text-sm text-carapita-dark font-light leading-relaxed">
                        Os preços listados são indicativos e não incluem taxas extraordinárias de limpeza ou comissões adicionais caso a reserva seja efetuada por terceiros (ex: Airbnb). Para o melhor preço garantido, utilize o nosso <strong className="font-semibold text-carapita-gold">Motor de Reservas Direto</strong>.
                    </p>
                    <button onClick={() => router.push('/')} className="mt-8 bg-carapita-dark text-white px-8 py-3 text-[10px] uppercase tracking-widest shadow-xl hover:bg-carapita-gold transition-colors">
                        Fazer uma Reserva Agora
                    </button>
                </div>
            </section>
        </main>
    );
}
