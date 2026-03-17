"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

// External Components
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import HeroBanner from '@/components/home/HeroBanner';
import EssenciaSection from '@/components/home/EssenciaSection';
import AlojamentoGallery from '@/components/home/AlojamentoGallery';
import PasseiosSection from '@/components/home/PasseiosSection';
import ComodidadesSection from '@/components/home/ComodidadesSection';
import LocalizacaoSection from '@/components/home/LocalizacaoSection';
import BookingImmersive from '@/components/booking/BookingImmersive';
import { X } from 'lucide-react';

// Utils & State
import { useBookingStore } from '@/store/bookingStore';
import { dictionaries as dict } from '@/i18n/dictionaries';
import { countries } from '@/i18n/countries';

export default function Home() {
    // --- Global State (Zustand) ---
    const { 
        checkIn, checkOut, setDates,
        adultos, criancas, setGuests,
        codigoPromocional, setPromoCode
    } = useBookingStore();

    // --- Local Page State ---
    const [lang, setLangState] = useState<'PT' | 'EN'>('PT');
    const [mounted, setMounted] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    
    // UI Visibility
    const [showBookingScreen, setShowBookingScreen] = useState(false);
    const [showGuestLoginModal, setShowGuestLoginModal] = useState(false);
    const [isGuestLoggedIn, setIsGuestLoggedIn] = useState(false);
    const [lightboxFotos, setLightboxFotos] = useState<string[]>([]);
    const [lightboxIdx, setLightboxIdx] = useState(0);

    // Data
    const [galleryRooms, setGalleryRooms] = useState<any[]>([]);
    const [disponiveisExtras, setDisponiveisExtras] = useState<any[]>([]);
    const [passeios, setPasseios] = useState<any[]>([]);
    const [quartosEncontrados, setQuartosEncontrados] = useState<any[] | null>(null);
    const [calendarioPrecos, setCalendarioPrecos] = useState<any[]>([]);
    const [siteConfigs, setSiteConfigs] = useState<any>({});
    const [extrasTelaAtiva, setExtrasTelaAtiva] = useState(false);

    const router = useRouter();

    // --- Helpers ---
    const t = (key: string) => dict[lang][key as keyof typeof dict['PT']] || key;

    const setLang = (newLang: 'PT' | 'EN') => {
        setLangState(newLang);
        if (typeof window !== 'undefined') {
            localStorage.setItem('preferencia_idioma', newLang);
        }
    };

    const parseFotos = (fotos: string | undefined): any[] => {
        if (!fotos) return [];
        try {
            const parsed = JSON.parse(fotos);
            if (Array.isArray(parsed)) {
                return parsed.map((item, index) => {
                    if (typeof item === 'string') return { url: item, category: 'Quarto', isMain: index === 0 };
                    return { ...item, category: item.category || 'Quarto', isMain: item.isMain || false };
                });
            }
            return [{ url: fotos, category: 'Quarto', isMain: true }];
        } catch {
            return fotos ? [{ url: fotos, category: 'Quarto', isMain: true }] : [];
        }
    };

    // --- Side Effects (Data Fetching) ---
    useEffect(() => {
        setMounted(true);
        if (typeof window !== 'undefined') {
            const savedLang = localStorage.getItem('preferencia_idioma') as 'PT' | 'EN';
            if (savedLang) setLangState(savedLang);
            setIsLoggedIn(!!localStorage.getItem('token'));
            setIsGuestLoggedIn(!!localStorage.getItem('guestToken'));
        }

        const handleScroll = () => {
            if (window.scrollY > 50) setScrolled(true);
            else setScrolled(false);
        };
        window.addEventListener('scroll', handleScroll);

        // Fetch Initial Data
        const fetchData = async () => {
            try {
                // Configs
                const configResp = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/site/configuracoes`, { cache: 'no-store' });
                const configJson = await configResp.json();
                if (configJson.status === 'success') {
                    setSiteConfigs(configJson.data);
                    setExtrasTelaAtiva(!!configJson.data.tela_extras_ativa);
                }

                // Rooms for Gallery
                const roomsResp = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/quartos?ativo=true`, { cache: 'no-store' });
                const roomsJson = await roomsResp.json();
                if (roomsJson.status === 'success') setGalleryRooms(roomsJson.data.filter((q: any) => q.ativo));

                // Extras
                const extrasResp = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/extras`, { cache: 'no-store' });
                const extrasJson = await extrasResp.json();
                if (extrasJson.status === 'success') setDisponiveisExtras(extrasJson.data);

                // Passeios
                const passeiosResp = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/site/passeios`, { cache: 'no-store' });
                const passeiosJson = await passeiosResp.json();
                if (passeiosJson.status === 'success') setPasseios(passeiosJson.data.filter((p: any) => p.ativo !== false));

            } catch (e) { console.error("Error fetching initial data", e); }
        };

        fetchData();
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const fetchCalendario = async (quartoId: string, startDate?: string, endDate?: string) => {
        if (!quartoId) return;
        try {
            const start = startDate || checkIn || new Date().toISOString().split('T')[0];
            const dateFim = new Date(start);
            dateFim.setMonth(dateFim.getMonth() + 4);
            const end = endDate || dateFim.toISOString().split('T')[0];
            const resp = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/tarifas/calendario?quartoId=${quartoId}&inicio=${start}&fim=${end}`, { cache: 'no-store' });
            const data = await resp.json();
            if (data.status === 'success') setCalendarioPrecos(data.data);
        } catch (e) { console.error("Error fetching calendar", e); }
    };

    const handleGuestLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        const email = (e.target as any).email.value;
        const senha = (e.target as any).password.value;
        try {
            const resp = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/hospede/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, senha })
            });
            const data = await resp.json();
            if (data.status === 'success') {
                localStorage.setItem('guestToken', data.token);
                setIsGuestLoggedIn(true);
                setShowGuestLoginModal(false);
            } else { alert(data.error || "Erro ao fazer login"); }
        } catch (e) { alert("Erro de conexão"); }
    };

    if (!mounted) return null;

    return (
        <main className="bg-carapita-green min-h-screen font-sans text-white overflow-x-hidden selection:bg-carapita-gold selection:text-carapita-dark">
            <Header 
                scrolled={scrolled} lang={lang} setLang={setLang} 
                mounted={mounted} isLoggedIn={isLoggedIn} 
                onReservar={() => setShowBookingScreen(true)} 
            />

            <HeroBanner t={t} onReservar={() => setShowBookingScreen(true)} />
            
            <EssenciaSection t={t} />

            <AlojamentoGallery 
                t={t} galleryRooms={galleryRooms} parseFotos={parseFotos}
                onInicarReserva={(id) => { setShowBookingScreen(true); }}
            />

            <PasseiosSection t={t} passeios={passeios} />

            <ComodidadesSection t={t} />

            <LocalizacaoSection t={t} siteConfigs={siteConfigs} />

            <Footer t={t} lang={lang} siteConfigs={siteConfigs} />

            {/* Immersive Booking Flow */}
            {showBookingScreen && (
                <BookingImmersive 
                    t={t} lang={lang} setShowBookingScreen={setShowBookingScreen}
                    quartosEncontrados={quartosEncontrados || galleryRooms}
                    fetchCalendario={fetchCalendario} calendarioPrecos={calendarioPrecos}
                    extrasTelaAtiva={extrasTelaAtiva} disponiveisExtras={disponiveisExtras}
                    countries={countries} isGuestLoggedIn={isGuestLoggedIn}
                    setShowGuestLoginModal={setShowGuestLoginModal}
                    setLightboxFotos={setLightboxFotos} setLightboxIdx={setLightboxIdx}
                    parseFotos={parseFotos}
                />
            )}

            {/* Shared Overlays/Modals */}
            {showGuestLoginModal && (
                <div className="fixed inset-0 z-[500] flex items-center justify-center p-6 backdrop-blur-sm bg-carapita-dark/20">
                    <div className="absolute inset-0" onClick={() => setShowGuestLoginModal(false)} />
                    <div className="relative bg-carapita-green w-full max-w-md p-10 animate-fade-in shadow-3xl border border-white/5">
                        <button onClick={() => setShowGuestLoginModal(false)} className="absolute top-4 right-4 text-white/40 hover:text-white"><X size={20} /></button>
                        <h4 className="text-[10px] uppercase tracking-mega text-carapita-gold font-bold mb-2">Acesso Rápido</h4>
                        <h2 className="font-serif text-2xl text-white mb-6">Inicie sessão para reservar</h2>
                        <form onSubmit={handleGuestLogin} className="space-y-6">
                            <div>
                                <label className="text-[10px] uppercase text-white/40 block mb-2">E-mail</label>
                                <input name="email" type="email" required className="w-full border-b border-carapita-gold/30 bg-transparent py-3 text-sm focus:border-carapita-gold outline-none text-white" placeholder="joao@exemplo.com" />
                            </div>
                            <div>
                                <label className="text-[10px] uppercase text-white/40 block mb-2">Senha</label>
                                <input name="password" type="password" required className="w-full border-b border-carapita-gold/30 bg-transparent py-3 text-sm focus:border-carapita-gold outline-none text-white" />
                            </div>
                            <button type="submit" className="w-full bg-carapita-dark text-white py-4 text-[10px] uppercase tracking-mega font-bold hover:bg-carapita-gold transition-all duration-500 shadow-xl">
                                Entrar e Preencher Dados
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* === LIGHTBOX DE FOTOS === */}
            {lightboxFotos.length > 0 && (
                <div
                    className="fixed inset-0 z-[1000] bg-black/95 backdrop-blur-md flex items-center justify-center animate-fade-in"
                    onClick={() => setLightboxFotos([])}
                >
                    <button
                        className="absolute top-8 right-8 text-white/50 hover:text-white z-[1100] p-3 bg-black/20 rounded-full hover:bg-black/40 transition-all"
                        onClick={() => setLightboxFotos([])}
                    ><X size={24} /></button>

                    <div className="relative w-full max-w-6xl h-[85vh] flex items-center justify-center overflow-hidden" onClick={e => e.stopPropagation()}>
                        <div className="absolute inset-0 flex items-center justify-center p-4">
                            <img
                                key={`foto-${lightboxIdx}`}
                                src={lightboxFotos[lightboxIdx]}
                                alt="Galeria do Quarto"
                                className="max-w-full max-h-full object-contain shadow-2xl transition-opacity animate-fade-in"
                            />
                        </div>
                        {lightboxFotos.length > 1 && (
                            <>
                                <button
                                    className="absolute left-6 bg-black/50 hover:bg-carapita-gold text-white p-4 rounded-full transition-all duration-300 flex items-center justify-center backdrop-blur-sm z-[1100]"
                                    onClick={e => { e.stopPropagation(); setLightboxIdx(i => (i - 1 + lightboxFotos.length) % lightboxFotos.length); }}
                                ><div className="w-6 h-6 flex items-center justify-center">←</div></button>
                                <button
                                    className="absolute right-6 bg-black/50 hover:bg-carapita-gold text-white p-4 rounded-full transition-all duration-300 flex items-center justify-center backdrop-blur-sm z-[1100]"
                                    onClick={e => { e.stopPropagation(); setLightboxIdx(i => (i + 1) % lightboxFotos.length); }}
                                ><div className="w-6 h-6 flex items-center justify-center">→</div></button>

                                <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-3 z-[1100] bg-black/20 py-3 mx-auto max-w-min rounded-full backdrop-blur-sm px-6 hide-scrollbars overflow-x-auto max-w-[80vw]">
                                    {lightboxFotos.map((url, i) => (
                                        <button
                                            key={i}
                                            onClick={(e) => { e.stopPropagation(); setLightboxIdx(i); }}
                                            className={`flex-shrink-0 relative w-12 h-12 rounded overflow-hidden border-2 transition-all duration-300 ${i === lightboxIdx ? 'border-carapita-gold scale-110 shadow-lg' : 'border-transparent opacity-50 hover:opacity-100'}`}
                                        >
                                            <img src={url} className="w-full h-full object-cover" />
                                        </button>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}
        </main>
    );
}
