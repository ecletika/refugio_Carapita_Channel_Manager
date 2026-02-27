"use client";
import React, { useState, useEffect } from 'react';
import {
    RefreshCw, Link, CheckCircle, AlertCircle, Trash2,
    Save, Plus, Database, Globe, Info, ExternalLink
} from 'lucide-react';
import AdminSidebar from '@/components/AdminSidebar';

interface Quarto {
    id: string;
    nome: string;
    ical_url: string | null;
    ical_airbnb: string | null;
    ical_booking: string | null;
}

export default function IntegracoesOTA() {
    const [quartos, setQuartos] = useState<Quarto[]>([]);
    const [loading, setLoading] = useState(true);
    const [syncing, setSyncing] = useState<string | null>(null);
    const [editId, setEditId] = useState<string | null>(null);
    const [tempAirbnb, setTempAirbnb] = useState("");
    const [tempBooking, setTempBooking] = useState("");

    const fetchQuartos = async () => {
        try {
            const resp = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/quartos`);
            const json = await resp.json();
            if (json.status === 'success') {
                setQuartos(json.data);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchQuartos(); }, []);

    const updateIcal = async (quartoId: string) => {
        const token = localStorage.getItem('token');
        try {
            const resp = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/quartos/${quartoId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    icalAirbnb: tempAirbnb,
                    icalBooking: tempBooking
                })
            });
            const json = await resp.json();
            if (json.status === 'success') {
                setEditId(null);
                fetchQuartos();
            } else {
                alert('Erro ao atualizar URLs');
            }
        } catch (e) {
            alert('Erro de comunicação');
        }
    };

    const syncOne = async (quartoId: string, url: string, label: string) => {
        if (!url) return;
        setSyncing(`${quartoId}-${label}`);
        const token = localStorage.getItem('token');
        try {
            const resp = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/reservas/sync`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ quartoId, url, canalNome: label })
            });
            const json = await resp.json();
            if (json.status === 'success') {
                alert(`${label}: Sincronização concluída!`);
            } else {
                alert(`Erro (${label}): ` + (json.error || 'Erro desconhecido'));
            }
        } catch (e) {
            alert('Erro de conexão');
        } finally {
            setSyncing(null);
        }
    };

    const syncAll = async () => {
        setSyncing('ALL');
        const token = localStorage.getItem('token');
        try {
            const resp = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/reservas/sync/all`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const json = await resp.json();
            if (json.status === 'success') {
                alert('Sincronização global concluída!');
            }
        } catch (e) {
            alert('Erro no sync global');
        } finally {
            setSyncing(null);
        }
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
                            Integrações Externas
                        </span>
                        <h1 className="text-4xl font-serif text-carapita-dark font-light">
                            Canais OTA (Link iCal)
                        </h1>
                    </div>
                    <button
                        onClick={syncAll}
                        disabled={syncing === 'ALL'}
                        className="flex items-center gap-3 bg-carapita-dark text-white px-8 py-4 text-[10px] uppercase tracking-mega hover:bg-carapita-gold transition-all duration-500 shadow-xl disabled:opacity-50"
                    >
                        <RefreshCw size={14} className={syncing === 'ALL' ? 'animate-spin' : ''} />
                        Sincronizar Todos
                    </button>
                </div>

                <div className="bg-yellow-50 border border-yellow-100 p-6 mb-10 flex gap-4 items-start">
                    <Info size={20} className="text-yellow-600 flex-shrink-0 mt-1" />
                    <div>
                        <h4 className="text-sm font-serif text-yellow-800 mb-1">Sobre a sincronização iCal</h4>
                        <p className="text-xs text-yellow-700 leading-relaxed">
                            O iCal permite importar reservas do Airbnb, Booking e outros canais sem necessidade de APIs oficiais complexas.
                            Configure os links individuais para cada canal abaixo.
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-6">
                    {quartos.map(q => (
                        <div key={q.id} className="bg-white border border-gray-100 p-8 hover:shadow-xl transition-all duration-500">
                            <div className="flex items-center justify-between mb-6 border-b border-gray-50 pb-4">
                                <h3 className="text-xl font-serif text-carapita-dark">{q.nome}</h3>
                                {editId !== q.id ? (
                                    <button
                                        onClick={() => { setEditId(q.id); setTempAirbnb(q.ical_airbnb || ""); setTempBooking(q.ical_booking || ""); }}
                                        className="text-[10px] uppercase tracking-widest font-bold text-carapita-gold hover:underline"
                                    >
                                        Configurar Links
                                    </button>
                                ) : (
                                    <div className="flex gap-2">
                                        <button onClick={() => updateIcal(q.id)} className="text-green-600 hover:bg-green-50 p-2 rounded">
                                            <Save size={18} />
                                        </button>
                                        <button onClick={() => setEditId(null)} className="text-red-400 hover:bg-red-50 p-2 rounded">
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                )}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {/* Airbnb Section */}
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[10px] uppercase tracking-widest font-bold text-gray-400 flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full bg-[#FF5A5F]" /> Airbnb
                                        </span>
                                        {q.ical_airbnb && editId !== q.id && (
                                            <button
                                                onClick={() => syncOne(q.id, q.ical_airbnb!, 'AIRBNB')}
                                                disabled={syncing === `${q.id}-AIRBNB`}
                                                className="text-[9px] uppercase font-bold text-carapita-dark hover:text-carapita-gold transition-colors flex items-center gap-1"
                                            >
                                                <RefreshCw size={10} className={syncing === `${q.id}-AIRBNB` ? 'animate-spin' : ''} /> Sync
                                            </button>
                                        )}
                                    </div>
                                    {editId === q.id ? (
                                        <input
                                            type="text"
                                            value={tempAirbnb}
                                            onChange={(e) => setTempAirbnb(e.target.value)}
                                            placeholder="Link iCal Airbnb (.ics)"
                                            className="w-full border-b border-gray-100 py-2 text-xs outline-none focus:border-carapita-gold bg-transparent"
                                        />
                                    ) : (
                                        <p className="text-[11px] text-gray-500 break-all font-light flex items-center gap-2">
                                            <Link size={12} className="text-gray-300 flex-shrink-0" />
                                            {q.ical_airbnb || "Não configurado"}
                                        </p>
                                    )}
                                </div>

                                {/* Booking Section */}
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[10px] uppercase tracking-widest font-bold text-gray-400 flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full bg-[#003580]" /> Booking.com
                                        </span>
                                        {q.ical_booking && editId !== q.id && (
                                            <button
                                                onClick={() => syncOne(q.id, q.ical_booking!, 'BOOKING')}
                                                disabled={syncing === `${q.id}-BOOKING`}
                                                className="text-[9px] uppercase font-bold text-carapita-dark hover:text-carapita-gold transition-colors flex items-center gap-1"
                                            >
                                                <RefreshCw size={10} className={syncing === `${q.id}-BOOKING` ? 'animate-spin' : ''} /> Sync
                                            </button>
                                        )}
                                    </div>
                                    {editId === q.id ? (
                                        <input
                                            type="text"
                                            value={tempBooking}
                                            onChange={(e) => setTempBooking(e.target.value)}
                                            placeholder="Link iCal Booking (.ics)"
                                            className="w-full border-b border-gray-100 py-2 text-xs outline-none focus:border-carapita-gold bg-transparent"
                                        />
                                    ) : (
                                        <p className="text-[11px] text-gray-500 break-all font-light flex items-center gap-2">
                                            <Link size={12} className="text-gray-300 flex-shrink-0" />
                                            {q.ical_booking || "Não configurado"}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="p-8 border border-gray-100 bg-white">
                        <div className="w-10 h-10 bg-blue-50 flex items-center justify-center rounded-lg mb-4">
                            <Database size={20} className="text-blue-600" />
                        </div>
                        <h5 className="text-sm font-serif mb-2 text-carapita-dark">Airbnb</h5>
                        <p className="text-[11px] text-gray-400 leading-relaxed italic">
                            No painel do Airbnb: Calendário &gt; Exportar &gt; Copie o Link .ics e cole aqui.
                        </p>
                    </div>
                    <div className="p-8 border border-gray-100 bg-white">
                        <div className="w-10 h-10 bg-indigo-50 flex items-center justify-center rounded-lg mb-4">
                            <Globe size={20} className="text-indigo-600" />
                        </div>
                        <h5 className="text-sm font-serif mb-2 text-carapita-dark">Booking.com</h5>
                        <p className="text-[11px] text-gray-400 leading-relaxed italic">
                            Na Extranet: Tarifas e Disponibilidade &gt; Sincronizar Calendários &gt; Exportar.
                        </p>
                    </div>
                    <div className="p-8 border border-gray-100 bg-white">
                        <div className="w-10 h-10 bg-emerald-50 flex items-center justify-center rounded-lg mb-4">
                            <ExternalLink size={20} className="text-emerald-600" />
                        </div>
                        <h5 className="text-sm font-serif mb-2 text-carapita-dark">VRBO / Otros</h5>
                        <p className="text-[11px] text-gray-400 leading-relaxed italic">
                            Qualquer plataforma que forneça link do tipo iCalendar (ICS) é suportada.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
