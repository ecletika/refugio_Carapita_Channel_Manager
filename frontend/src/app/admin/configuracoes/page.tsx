"use client";
import React, { useState, useEffect } from 'react';
import AdminSidebar from '@/components/AdminSidebar';
import { Save, User, Mail, Phone, MapPin, Instagram, Facebook, CheckCircle2, AlertCircle } from 'lucide-react';

const EDGE_URL = 'https://vuidkeygtxfbgxvmilya.supabase.co/functions/v1';

export default function AdminConfiguracoes() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState<{ tipo: 'sucesso' | 'erro'; msg: string } | null>(null);
    const [erroCarregar, setErroCarregar] = useState('');

    const [configs, setConfigs] = useState({
        telefoneReservas: '',
        whatsapp: '',
        emailContato: '',
        endereco: '',
        nomeResponsavel: '',
        linkInstagram: '',
        linkFacebook: '',
        linkAirbnb: '',
        linkBooking: '',
        linkGoogleMaps: ''
    });

    const showToast = (tipo: 'sucesso' | 'erro', msg: string) => {
        setToast({ tipo, msg });
        setTimeout(() => setToast(null), 4000);
    };

    const fetchConfigs = async () => {
        try {
            const token = localStorage.getItem('token');
            const resp = await fetch(`${EDGE_URL}/admin-site/configuracoes?t=${Date.now()}`, {
                cache: 'no-store',
                headers: token ? { 'Authorization': `Bearer ${token}` } : {}
            });
            const json = await resp.json();
            if (json.status === 'success' && json.data) {
                setConfigs(prev => ({ ...prev, ...json.data }));
            } else {
                setErroCarregar(json.error || 'Erro ao carregar configurações.');
            }
        } catch (e) {
            console.error("Erro ao buscar configurações", e);
            setErroCarregar('Erro de comunicação ao carregar configurações.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchConfigs(); }, []);

    const handleSave = async () => {
        setSaving(true);
        const token = localStorage.getItem('token');
        try {
            const resp = await fetch(`${EDGE_URL}/admin-site/configuracoes`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(configs)
            });
            const json = await resp.json();
            if (json.status === 'success') {
                showToast('sucesso', 'Configurações guardadas com sucesso!');
            } else {
                showToast('erro', json.error || 'Erro ao guardar configurações.');
            }
        } catch {
            showToast('erro', 'Erro de comunicação. Tente novamente.');
        } finally {
            setSaving(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setConfigs({ ...configs, [e.target.name]: e.target.value });
    };

    if (loading) return (
        <div className="min-h-screen bg-[#F9F8F6] flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-[#C4A484] border-t-transparent rounded-full animate-spin" />
        </div>
    );

    return (
        <div className="min-h-screen bg-[#F9F8F6]">
            <AdminSidebar />

            {/* Toast de feedback */}
            {toast && (
                <div className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-4 shadow-lg text-sm max-w-sm transition-all duration-300
                    ${toast.tipo === 'sucesso' ? 'bg-[#1E3932] text-white' : 'bg-red-600 text-white'}`}>
                    {toast.tipo === 'sucesso'
                        ? <CheckCircle2 size={16} className="text-[#C4A484] shrink-0" />
                        : <AlertCircle size={16} className="shrink-0" />}
                    <span>{toast.msg}</span>
                </div>
            )}

            <div className="ml-0 md:ml-20 p-4 md:p-8 lg:p-12 max-w-5xl mx-auto pb-24 md:pb-4">
                <div className="flex items-end justify-between mb-12">
                    <div>
                        <span className="text-[#C4A484] text-[10px] uppercase tracking-widest font-bold block mb-1">
                            Definições do Site
                        </span>
                        <h1 className="text-4xl font-serif text-[#1E3932] font-light">
                            Contactos & Redes Sociais
                        </h1>
                    </div>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex items-center gap-3 bg-[#1E3932] text-white px-8 py-4 text-[10px] uppercase tracking-widest hover:bg-[#C4A484] transition-all duration-500 shadow-xl disabled:opacity-50 cursor-pointer"
                    >
                        <Save size={14} />
                        {saving ? 'A guardar...' : 'Guardar Alterações'}
                    </button>
                </div>

                {erroCarregar && (
                    <div className="mb-8 flex items-start gap-3 bg-red-50 border border-red-100 p-4 text-red-600 text-sm">
                        <AlertCircle size={16} className="mt-0.5 shrink-0" />
                        {erroCarregar}
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                    {/* Contactos Primários */}
                    <div className="bg-white p-8 border border-gray-100 shadow-sm space-y-6">
                        <h3 className="text-xl font-serif text-[#1E3932] mb-6 border-b border-gray-50 pb-4">Detalhes de Contacto</h3>

                        <div className="flex flex-col gap-2">
                            <label className="text-[10px] uppercase tracking-widest text-gray-400 font-bold flex items-center gap-2"><User size={12} /> Nome do Responsável</label>
                            <input name="nomeResponsavel" value={configs.nomeResponsavel} onChange={handleChange} className="border-b border-gray-200 py-2 outline-none focus:border-[#C4A484] text-sm" placeholder="Ex: Mauricio Junior" />
                        </div>

                        <div className="flex flex-col gap-2">
                            <label className="text-[10px] uppercase tracking-widest text-gray-400 font-bold flex items-center gap-2"><Phone size={12} /> Telefone (Reservas/Fixo)</label>
                            <input name="telefoneReservas" value={configs.telefoneReservas} onChange={handleChange} className="border-b border-gray-200 py-2 outline-none focus:border-[#C4A484] text-sm" placeholder="+351 000 000 000" />
                        </div>

                        <div className="flex flex-col gap-2">
                            <label className="text-[10px] uppercase tracking-widest text-gray-400 font-bold flex items-center gap-2"><Phone size={12} /> WhatsApp Móvel</label>
                            <input name="whatsapp" value={configs.whatsapp} onChange={handleChange} className="border-b border-gray-200 py-2 outline-none focus:border-[#C4A484] text-sm" placeholder="+351 900 000 000" />
                        </div>

                        <div className="flex flex-col gap-2">
                            <label className="text-[10px] uppercase tracking-widest text-gray-400 font-bold flex items-center gap-2"><Mail size={12} /> E-mail Público</label>
                            <input name="emailContato" value={configs.emailContato} onChange={handleChange} className="border-b border-gray-200 py-2 outline-none focus:border-[#C4A484] text-sm" placeholder="geral@refugiocarapita.pt" />
                        </div>

                        <div className="flex flex-col gap-2">
                            <label className="text-[10px] uppercase tracking-widest text-gray-400 font-bold flex items-center gap-2"><MapPin size={12} /> Endereço Completo</label>
                            <input name="endereco" value={configs.endereco} onChange={handleChange} className="border-b border-gray-200 py-2 outline-none focus:border-[#C4A484] text-sm" placeholder="Rua D. Afonso IV, 450, Ourém" />
                        </div>
                    </div>

                    {/* Redes e OTAs */}
                    <div className="bg-white p-8 border border-gray-100 shadow-sm space-y-6">
                        <h3 className="text-xl font-serif text-[#1E3932] mb-6 border-b border-gray-50 pb-4">Links Externos (URLs)</h3>

                        <div className="flex flex-col gap-2">
                            <label className="text-[10px] uppercase tracking-widest text-gray-400 font-bold flex items-center gap-2"><Instagram size={12} /> Instagram URL</label>
                            <input name="linkInstagram" value={configs.linkInstagram} onChange={handleChange} className="border-b border-gray-200 py-2 outline-none focus:border-[#C4A484] text-sm text-gray-400" placeholder="https://instagram.com/..." />
                        </div>

                        <div className="flex flex-col gap-2">
                            <label className="text-[10px] uppercase tracking-widest text-gray-400 font-bold flex items-center gap-2"><Facebook size={12} /> Facebook URL</label>
                            <input name="linkFacebook" value={configs.linkFacebook} onChange={handleChange} className="border-b border-gray-200 py-2 outline-none focus:border-[#C4A484] text-sm text-gray-400" placeholder="https://facebook.com/..." />
                        </div>

                        <div className="flex flex-col gap-2">
                            <label className="text-[10px] uppercase tracking-widest text-gray-400 font-bold text-[#FF5A5F]"> Link Airbnb (Perfil ou Anúncio)</label>
                            <input name="linkAirbnb" value={configs.linkAirbnb} onChange={handleChange} className="border-b border-gray-200 py-2 outline-none focus:border-[#FF5A5F] text-sm text-gray-400" placeholder="https://airbnb.com/..." />
                        </div>

                        <div className="flex flex-col gap-2">
                            <label className="text-[10px] uppercase tracking-widest text-gray-400 font-bold text-[#003580]"> Link Booking.com</label>
                            <input name="linkBooking" value={configs.linkBooking} onChange={handleChange} className="border-b border-gray-200 py-2 outline-none focus:border-[#003580] text-sm text-gray-400" placeholder="https://booking.com/..." />
                        </div>

                        <div className="flex flex-col gap-2">
                            <label className="text-[10px] uppercase tracking-widest text-gray-400 font-bold flex items-center gap-2"><MapPin size={12} /> Google Maps Link (Como chegar)</label>
                            <input name="linkGoogleMaps" value={configs.linkGoogleMaps} onChange={handleChange} className="border-b border-gray-200 py-2 outline-none focus:border-[#C4A484] text-sm text-gray-400" placeholder="https://goo.gl/maps/..." />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
