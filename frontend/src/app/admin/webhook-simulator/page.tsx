"use client";
import React, { useState } from 'react';
import { Send, Terminal, AlertCircle, CheckCircle } from 'lucide-react';
import AdminSidebar from '@/components/AdminSidebar';

export default function WebhookSimulator() {
    const [canal, setCanal] = useState<'booking' | 'airbnb'>('booking');
    const [payload, setPayload] = useState('{\n  "action": "RESERVATION_CANCELLED",\n  "reservationId": "EXT-12345"\n}');
    const [response, setResponse] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    const sendWebhook = async () => {
        setLoading(true);
        try {
            const endpoint = canal === 'booking' ? 'booking' : 'airbnb';
            const resp = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/reservas/webhooks/${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: payload
            });
            const text = await resp.text();
            setResponse({ status: resp.status, body: text });
        } catch (e) {
            setResponse({ error: 'Erro de conexão' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#F9F8F6]">
            <AdminSidebar />
            <div className="ml-20 p-8 md:p-12 max-w-4xl mx-auto">
                <div className="mb-12">
                    <span className="text-carapita-gold text-[10px] uppercase tracking-mega font-bold block mb-1">Developer Tools</span>
                    <h1 className="text-4xl font-serif text-carapita-dark font-light">Simulador de Webhooks</h1>
                    <p className="text-xs text-gray-400 mt-2">Teste a integração com OTAs enviando payloads manuais.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-6">
                        <div className="bg-white border border-gray-100 p-8 shadow-sm">
                            <label className="text-[10px] uppercase tracking-widest text-gray-400 font-bold block mb-4">Canal de Origem</label>
                            <div className="flex gap-4">
                                <button
                                    onClick={() => { setCanal('booking'); setPayload('{\n  "action": "RESERVATION_CANCELLED",\n  "reservationId": "EXT-12345"\n}'); }}
                                    className={`flex-1 py-3 text-[10px] uppercase tracking-widest font-bold border transition-all ${canal === 'booking' ? 'bg-carapita-dark text-white border-carapita-dark' : 'border-gray-100 text-gray-400'}`}
                                >
                                    Booking.com
                                </button>
                                <button
                                    onClick={() => { setCanal('airbnb'); setPayload('{\n  "listingId": "1234567"\n}'); }}
                                    className={`flex-1 py-3 text-[10px] uppercase tracking-widest font-bold border transition-all ${canal === 'airbnb' ? 'bg-carapita-dark text-white border-carapita-dark' : 'border-gray-100 text-gray-400'}`}
                                >
                                    Airbnb
                                </button>
                            </div>
                        </div>

                        <div className="bg-white border border-gray-100 p-8 shadow-sm">
                            <label className="text-[10px] uppercase tracking-widest text-gray-400 font-bold block mb-4">JSON Payload</label>
                            <textarea
                                value={payload}
                                onChange={(e) => setPayload(e.target.value)}
                                className="w-full h-48 bg-gray-50 p-4 font-mono text-xs border border-gray-100 outline-none focus:border-carapita-gold"
                            />
                            <button
                                onClick={sendWebhook}
                                disabled={loading}
                                className="w-full mt-6 bg-carapita-gold text-white py-4 text-[10px] uppercase tracking-mega flex items-center justify-center gap-2 hover:bg-carapita-dark transition-all disabled:opacity-50"
                            >
                                <Send size={14} /> {loading ? 'Enviando...' : 'Disparar Webhook'}
                            </button>
                        </div>
                    </div>

                    <div className="bg-carapita-dark text-gray-300 p-8 font-mono text-[11px] shadow-2xl relative overflow-hidden">
                        <div className="flex items-center gap-2 mb-6 border-b border-white/10 pb-4">
                            <Terminal size={14} className="text-carapita-gold" />
                            <span className="uppercase tracking-widest text-[9px] text-white/50">Console Output</span>
                        </div>

                        {response ? (
                            <div className="space-y-4 animate-fade-in">
                                <div>
                                    <span className="text-carapita-gold">HTTP STATUS:</span> {response.status || 'ERROR'}
                                </div>
                                <div>
                                    <span className="text-carapita-gold">RESPONSE BODY:</span>
                                    <pre className="mt-2 bg-black/30 p-4 overflow-x-auto whitespace-pre-wrap">
                                        {response.body || response.error}
                                    </pre>
                                </div>
                                <div className="flex items-center gap-2 text-[9px]">
                                    {response.status === 200 ? (
                                        <><CheckCircle size={10} className="text-green-500" /> Webhook processado com sucesso</>
                                    ) : (
                                        <><AlertCircle size={10} className="text-red-500" /> Falha no servidor</>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="italic text-white/20">Aguardando disparo...</div>
                        )}

                        <div className="absolute bottom-0 right-0 p-4 opacity-5">
                            <Send size={100} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
