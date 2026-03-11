"use client";

import React, { useState, useEffect } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Mail, Phone, MapPin, Send, MessageSquare, Clock, Instagram, Facebook } from "lucide-react";
import { dictionaries as dict } from "@/i18n/dictionaries";

export default function ContactosPage() {
    const [lang, setLangState] = useState<'PT' | 'EN'>('PT');
    const [mounted, setMounted] = useState(false);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [siteConfigs, setSiteConfigs] = useState<any>({});
    const [formStatus, setFormStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

    const setLang = (newLang: 'PT' | 'EN') => {
        setLangState(newLang);
        if (typeof window !== 'undefined') {
            localStorage.setItem('preferencia_idioma', newLang);
        }
    };

    const t = (key: string) => dict[lang][key as keyof typeof dict['PT']] || key;

    useEffect(() => {
        setMounted(true);
        setIsLoggedIn(!!localStorage.getItem('token'));
        const savedLang = localStorage.getItem('preferencia_idioma') as 'PT' | 'EN';
        if (savedLang && (savedLang === 'PT' || savedLang === 'EN')) {
            setLangState(savedLang);
        }

        const fetchConfigs = async () => {
            try {
                const resp = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/site/configuracoes?t=${Date.now()}`);
                const json = await resp.json();
                if (json.status === 'success') {
                    setSiteConfigs(json.data);
                }
            } catch (e) { }
        };
        fetchConfigs();
    }, []);

    const [formData, setFormData] = useState({
        nome: '',
        email: '',
        assunto: '',
        mensagem: ''
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormStatus('loading');
        
        try {
            const resp = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/site/contato`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            const json = await resp.json();
            
            if (json.status === 'success') {
                setFormStatus('success');
                setFormData({ nome: '', email: '', assunto: '', mensagem: '' });
            } else {
                setFormStatus('error');
            }
        } catch (error) {
            console.error('Erro ao enviar:', error);
            setFormStatus('error');
        }
    };

    if (!mounted) return null;

    return (
        <main className="min-h-screen bg-carapita-green flex flex-col font-sans selection:bg-carapita-gold selection:text-white">
            <Header
                lang={lang}
                setLang={setLang}
                mounted={mounted}
                isLoggedIn={isLoggedIn}
                onReservar={() => window.location.href = '/?book=true'}
                scrolled={true}
            />

            {/* Hero Section */}
            <section className="relative pt-44 pb-24 px-6 md:px-12 text-center bg-carapita-dark/20">
                <div className="max-w-4xl mx-auto">
                    <span className="text-carapita-gold uppercase tracking-mega text-[10px] font-semibold block mb-4 animate-fade-in">
                        {t('contact_tag')}
                    </span>
                    <h1 className="text-5xl md:text-7xl font-serif text-white font-light leading-tight mb-8 animate-fade-in delay-100">
                        {t('contact_title')} <i className="font-serif text-carapita-gold">{t('contact_title_casa')}</i>
                    </h1>
                    <p className="text-white/60 text-lg font-light max-w-2xl mx-auto leading-relaxed animate-fade-in delay-200">
                        {t('contact_subtitle')}
                    </p>
                </div>
            </section>

            <section className="py-24 px-6 md:px-12 max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-20">
                {/* Contact Information */}
                <div className="animate-fade-in delay-300">
                    <h2 className="text-3xl font-serif text-white mb-6">{t('contact_info_title')}</h2>
                    <p className="text-white/50 font-light mb-12 max-w-md">{t('contact_info_desc')}</p>

                    <div className="space-y-10">
                        <div className="flex gap-6 group">
                            <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-carapita-gold group-hover:bg-carapita-gold group-hover:text-carapita-dark transition-all duration-500">
                                <MapPin size={24} />
                            </div>
                            <div>
                                <h4 className="text-white font-medium mb-1 uppercase tracking-widest text-xs">Endereço</h4>
                                <p className="text-white/60 font-light leading-relaxed">
                                    {siteConfigs.endereco || 'R. Dom Afonso Quarto Conde de Ourém IV 450, 2490-480 Ourém'}
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-6 group">
                            <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-carapita-gold group-hover:bg-carapita-gold group-hover:text-carapita-dark transition-all duration-500">
                                <Phone size={24} />
                            </div>
                            <div>
                                <h4 className="text-white font-medium mb-1 uppercase tracking-widest text-xs">Telefone</h4>
                                <p className="text-white/60 font-light leading-relaxed">
                                    {siteConfigs.telefoneReservas || '+351 967 244 938'}
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-6 group">
                            <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-carapita-gold group-hover:bg-carapita-gold group-hover:text-carapita-dark transition-all duration-500">
                                <Mail size={24} />
                            </div>
                            <div>
                                <h4 className="text-white font-medium mb-1 uppercase tracking-widest text-xs">E-mail</h4>
                                <p className="text-white/60 font-light leading-relaxed">
                                    {siteConfigs.emailContato || 'contacto@refugiocarapita.com'}
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-6 group">
                            <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-carapita-gold group-hover:bg-carapita-gold group-hover:text-carapita-dark transition-all duration-500">
                                <Clock size={24} />
                            </div>
                            <div>
                                <h4 className="text-white font-medium mb-1 uppercase tracking-widest text-xs">Horário de Atendimento</h4>
                                <p className="text-white/60 font-light leading-relaxed">
                                    Todos os dias, das 09:00 às 20:00
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Social Media */}
                    <div className="mt-16 pt-16 border-t border-white/10">
                        <h4 className="text-white font-medium mb-6 uppercase tracking-widest text-[10px]">Siga-nos</h4>
                        <div className="flex gap-4">
                            {siteConfigs.linkInstagram && (
                                <a href={siteConfigs.linkInstagram} className="w-12 h-12 rounded-full border border-white/20 flex items-center justify-center text-white hover:bg-carapita-gold hover:border-carapita-gold transition-all">
                                    <Instagram size={20} />
                                </a>
                            )}
                            {siteConfigs.linkFacebook && (
                                <a href={siteConfigs.linkFacebook} className="w-12 h-12 rounded-full border border-white/20 flex items-center justify-center text-white hover:bg-carapita-gold hover:border-carapita-gold transition-all">
                                    <Facebook size={20} />
                                </a>
                            )}
                        </div>
                    </div>
                </div>

                {/* Contact Form */}
                <div className="bg-white/5 border border-white/10 p-10 md:p-16 rounded-[3rem] backdrop-blur-md animate-fade-in delay-400">
                    <div className="mb-12">
                        <MessageSquare className="text-carapita-gold mb-6" size={32} />
                        <h2 className="text-3xl font-serif text-white">{t('contact_form_title')}</h2>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-[10px] uppercase tracking-widest font-bold text-white/50 ml-1">{t('contact_name')}</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.nome}
                                    onChange={e => setFormData({ ...formData, nome: e.target.value })}
                                    className="w-full bg-carapita-dark/50 border border-white/10 rounded-2xl px-6 py-4 text-white font-light focus:outline-none focus:border-carapita-gold transition-all"
                                    placeholder="Ex: João Silva"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] uppercase tracking-widest font-bold text-white/50 ml-1">{t('form_email')}</label>
                                <input
                                    type="email"
                                    required
                                    value={formData.email}
                                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                                    className="w-full bg-carapita-dark/50 border border-white/10 rounded-2xl px-6 py-4 text-white font-light focus:outline-none focus:border-carapita-gold transition-all"
                                    placeholder="email@exemplo.com"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] uppercase tracking-widest font-bold text-white/50 ml-1">{t('contact_subject')}</label>
                            <input
                                type="text"
                                required
                                    value={formData.assunto}
                                    onChange={e => setFormData({ ...formData, assunto: e.target.value })}
                                    className="w-full bg-carapita-dark/50 border border-white/10 rounded-2xl px-6 py-4 text-white font-light focus:outline-none focus:border-carapita-gold transition-all"
                                    placeholder="Reserva, Dúvida, Evento..."
                                />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] uppercase tracking-widest font-bold text-white/50 ml-1">{t('contact_message')}</label>
                            <textarea
                                required
                                rows={5}
                                value={formData.mensagem}
                                onChange={e => setFormData({ ...formData, mensagem: e.target.value })}
                                className="w-full bg-carapita-dark/50 border border-white/10 rounded-2xl px-6 py-4 text-white font-light focus:outline-none focus:border-carapita-gold transition-all resize-none"
                                placeholder="Como podemos ajudar?"
                            ></textarea>
                        </div>

                        <button
                            type="submit"
                            disabled={formStatus === 'loading'}
                            className="w-full bg-carapita-gold text-carapita-dark font-bold uppercase tracking-mega py-5 rounded-2xl hover:bg-white transition-all transform hover:scale-[1.02] flex items-center justify-center gap-3 disabled:opacity-50"
                        >
                            {formStatus === 'loading' ? (
                                <div className="w-5 h-5 border-2 border-carapita-dark border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                                <>
                                    <span>{t('contact_send')}</span>
                                    <Send size={16} />
                                </>
                            )}
                        </button>

                        {formStatus === 'success' && (
                            <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-center text-sm animate-fade-in">
                                {t('contact_success')}
                            </div>
                        )}
                        {formStatus === 'error' && (
                            <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-center text-sm animate-fade-in">
                                {t('contact_error')}
                            </div>
                        )}
                    </form>
                </div>
            </section>

            {/* Map Placeholder or Iframe */}
            <section className="px-6 md:px-12 py-24 bg-carapita-dark/10">
                <div className="max-w-7xl mx-auto h-[500px] rounded-[3rem] overflow-hidden border border-white/10 relative shadow-2xl">
                    <iframe
                        src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3072.1530442925973!2d-8.586519699999998!3d39.64627009999999!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0xd1883a0fd387c21%3A0xdb482ac876e7244b!2sRef%C3%BAgio%20Carapita!5e0!3m2!1spt-PT!2spt!4v1773225814137!5m2!1spt-PT!2spt"
                        width="100%"
                        height="100%"
                        style={{ border: 0 }}
                        allowFullScreen
                        loading="lazy"
                        referrerPolicy="no-referrer-when-downgrade"
                    ></iframe>
                </div>
            </section>

            <Footer lang={lang} siteConfigs={siteConfigs} />

            <style jsx global>{`
                .animate-fade-in {
                    animation: fadeIn 0.8s ease-out forwards;
                }
                .delay-100 { animation-delay: 0.1s; }
                .delay-200 { animation-delay: 0.2s; }
                .delay-300 { animation-delay: 0.3s; }
                .delay-400 { animation-delay: 0.4s; }
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </main>
    );
}
