"use client";
import React, { useState } from 'react';
import { ChevronRight, Calendar, Users, Menu, MapPin, X, Check, Camera, ChevronLeft, Instagram, Facebook, PlayCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import SeletorCalendario from '../components/SeletorCalendario';
import { useEffect } from 'react';

// Helper: parse fotos field (can be JSON array or plain URL)
export interface FotoObj {
    url: string;
    category: string;
    isMain: boolean;
}

function parseFotos(fotos: string | undefined): FotoObj[] {
    if (!fotos) return [];
    try {
        const parsed = JSON.parse(fotos);
        if (Array.isArray(parsed)) {
            return parsed.map((item, index) => {
                if (typeof item === 'string') {
                    return { url: item, category: 'Quarto', isMain: index === 0 };
                }
                return { ...item, category: item.category || 'Quarto', isMain: item.isMain || false };
            });
        }
        return [{ url: fotos, category: 'Quarto', isMain: true }];
    } catch {
        return fotos ? [{ url: fotos, category: 'Quarto', isMain: true }] : [];
    }
}


export default function Home() {
    const [checkIn, setCheckIn] = useState('');
    const [checkOut, setCheckOut] = useState('');
    const [hospedes, setHospedes] = useState(1);
    const [quartosEncontrados, setQuartosEncontrados] = useState<any[] | null>(null);
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('Todos');
    const [showGuestModal, setShowGuestModal] = useState(false);
    const [idQuartoParaReserva, setIdQuartoParaReserva] = useState<string | null>(null);
    const [formHospede, setFormHospede] = useState({ nome: '', email: '', telefone: '' });
    const [metodoPagamento, setMetodoPagamento] = useState('MBWAY');
    const [passeioSelecionado, setPasseioSelecionado] = useState<any | null>(null);
    const [passeios, setPasseios] = useState<any[]>([]);
    const [showCalendar, setShowCalendar] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [currentHeroIndex, setCurrentHeroIndex] = useState(0);
    const [showBookingScreen, setShowBookingScreen] = useState(false);
    const [bookingStep, setBookingStep] = useState<'selection' | 'extras' | 'details' | 'payment'>('selection');
    const [disponiveisExtras, setDisponiveisExtras] = useState<any[]>([]);
    const [selectedExtras, setSelectedExtras] = useState<string[]>([]);
    const [bookingForm, setBookingForm] = useState({
        prefixo: 'Mr.',
        nome: '',
        sobrenome: '',
        email: '',
        telefone: '',
        pais: 'Portugal',
        endereco1: '',
        endereco2: '',
        cidade: '',
        cep: '',
        criarConta: false,
        senha: '',
        confirmarSenha: '',
        requerimentosEspeciais: '',
        aceitouTermos: false
    });
    const [calendarioPrecos, setCalendarioPrecos] = useState<any[]>([]);
    const [galleryRooms, setGalleryRooms] = useState<any[]>([]);
    const [activeGalleryRoom, setActiveGalleryRoom] = useState<string>('');
    const [showGuestLoginModal, setShowGuestLoginModal] = useState(false);
    const [isGuestLoggedIn, setIsGuestLoggedIn] = useState(false);
    const [lightboxFotos, setLightboxFotos] = useState<string[]>([]);
    const [lightboxIdx, setLightboxIdx] = useState(0);
    const [siteConfigs, setSiteConfigs] = useState<any>({});
    const router = useRouter();


    useEffect(() => {
        const fetchExtras = async () => {
            try {
                const resp = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/extras?t=${Date.now()}`, {
                    cache: 'no-store'
                });
                const data = await resp.json();
                if (data.status === 'success') setDisponiveisExtras(data.data);
            } catch (e) {
                console.error("Erro ao procurar extras", e);
            }
        };

        const fetchConfiguracoes = async () => {
            try {
                const resp = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/site/configuracoes?t=${Date.now()}`, { cache: 'no-store' });
                const json = await resp.json();
                if (json.status === 'success' && json.data) {
                    setSiteConfigs(json.data);
                }
            } catch (e) { }
        };

        const fetchPasseiosData = async () => {
            try {
                const resp = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/site/passeios?t=${Date.now()}`, {
                    cache: 'no-store'
                });
                const data = await resp.json();
                if (data.status === 'success') {
                    // Filter to only show active ones
                    setPasseios(data.data.filter((p: any) => p.ativo !== false));
                }
            } catch (e) {
                console.error("Erro ao buscar passeios", e);
            }
        };

        const fetchQuartosParaGaleria = async () => {
            try {
                const resp = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/quartos?ativo=true`, { cache: 'no-store' });
                const data = await resp.json();
                if (data.status === 'success') {
                    const activeQs = data.data.filter((q: any) => q.ativo);
                    setGalleryRooms(activeQs);
                    if (activeQs.length > 0) {
                        setActiveGalleryRoom(activeQs[0].id);
                    }
                }
            } catch (e) {
                console.error("Erro ao buscar quartos para galeria", e);
            }
        };

        fetchQuartosParaGaleria();
        fetchExtras();
        fetchPasseiosData();
        fetchConfiguracoes();
    }, []);

    const heroImages = [
        "https://templarportugal.com/media/images/TZC03808-min.original.jpg",
        "https://templarportugal.com/media/images/TZC03798-min.original.jpg",
        "https://templarportugal.com/media/images/Castelo_e_Paao_dos_Condes_de_OurCm_iluminado.original.jpg",
        "https://templarportugal.com/media/images/TZC03591-min.original.jpg"
    ];

    useEffect(() => {
        setMounted(true);
        setIsLoggedIn(!!localStorage.getItem('token'));

        const heroInterval = setInterval(() => {
            setCurrentHeroIndex((prev) => (prev + 1) % heroImages.length);
        }, 3000);

        const handleScroll = () => {
            if (window.scrollY > 50) setScrolled(true);
            else setScrolled(false);
        };
        window.addEventListener('scroll', handleScroll);

        return () => {
            window.removeEventListener('scroll', handleScroll);
            clearInterval(heroInterval);
        };
    }, [heroImages.length]);

    useEffect(() => {
        const token = localStorage.getItem('guestToken');
        if (token) setIsGuestLoggedIn(true);
    }, []);

    const handleGuestLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        const email = (e.target as any).email.value;
        const senha = (e.target as any).password.value;

        try {
            const resp = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/hospede/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, senha })
            });
            const data = await resp.json();
            if (data.status === 'success') {
                localStorage.setItem('guestToken', data.token);
                setIsGuestLoggedIn(true);
                setShowGuestLoginModal(false);
                setBookingForm(prev => ({
                    ...prev,
                    nome: data.hospede.nome || prev.nome,
                    email: data.hospede.email || prev.email
                }));
            } else { alert(data.error || "Erro ao fazer login"); }
        } catch (e) { alert("Erro de conexão"); }
    };

    // Fotos reais extraídas do seu Airbnb
    const gallery = [
        { url: 'https://a0.muscache.com/im/pictures/hosting/Hosting-1580467683590335058/original/0af548b0-180a-4981-a16b-1783e7c8f1cc.jpeg', category: 'Quarto' },
        { url: 'https://a0.muscache.com/im/pictures/hosting/Hosting-1580467683590335058/original/08e435f1-2095-4b10-b413-0f5579bfadc2.jpeg', category: 'Cozinha' },
        { url: 'https://a0.muscache.com/im/pictures/hosting/Hosting-1580467683590335058/original/18436280-bcd5-4549-9e64-f932afa432de.jpeg', category: 'Quarto' },
        { url: 'https://a0.muscache.com/im/pictures/hosting/Hosting-1580467683590335058/original/3dfd5829-4b91-42d2-a047-113e0f1df9b4.jpeg', category: 'Sala' },
        { url: 'https://a0.muscache.com/im/pictures/hosting/Hosting-1580467683590335058/original/488f0a9b-f5b5-480b-a1c7-7a266e57fa0a.jpeg', category: 'Banheiro' },
        { url: 'https://a0.muscache.com/im/pictures/hosting/Hosting-1580467683590335058/original/011450eb-ef6f-48a6-926e-9777c505743f.jpeg', category: 'Exterior' },
        { url: 'https://a0.muscache.com/im/pictures/hosting/Hosting-1580467683590335058/original/209b0228-9643-451a-a611-0a72937c1b26.jpeg', category: 'Cozinha' },
        { url: 'https://a0.muscache.com/im/pictures/hosting/Hosting-1580467683590335058/original/246a531d-9fbe-44d5-9a0f-4998ec19cdad.jpeg', category: 'Sala' },
        { url: 'https://a0.muscache.com/im/pictures/hosting/Hosting-1580467683590335058/original/27b6ba16-ccb4-4998-bbc0-a5178d2f19ea.jpeg', category: 'Quarto' },
        { url: 'https://a0.muscache.com/im/pictures/hosting/Hosting-1580467683590335058/original/2867b8dc-490f-4c56-966c-f7ef808368db.jpeg', category: 'Exterior' },
        { url: 'https://a0.muscache.com/im/pictures/hosting/Hosting-1580467683590335058/original/28b90cdf-5522-413f-ac97-865938c37ae0.jpeg', category: 'Banheiro' },
        { url: 'https://a0.muscache.com/im/pictures/hosting/Hosting-1580467683590335058/original/3481d29e-8a09-499d-bb37-865ea62c68a9.jpeg', category: 'Quarto' },
    ];

    const categories = ['Todos', 'Quarto', 'Cozinha', 'Sala', 'Casa de Banho', 'Exterior', 'Outros'];

    const selectedRoom = galleryRooms.find(r => r.id === activeGalleryRoom);
    const roomPhotos = selectedRoom ? parseFotos(selectedRoom.fotos) : gallery;

    const filteredGallery = activeTab === 'Todos' ? roomPhotos : roomPhotos.filter(f => f.category === activeTab);

    // Os Passeios são carregados dinamicamente no useEffect

    const totalEstadia = () => {
        if (!checkIn || !checkOut || !idQuartoParaReserva) return 0;

        let subtotal = 0;
        const start = new Date(`${checkIn}T00:00:00.000Z`);
        const end = new Date(`${checkOut}T00:00:00.000Z`);

        const q = quartosEncontrados?.find(r => r.id === idQuartoParaReserva);
        if (!q) return 0;

        let current = new Date(start);
        while (current < end) {
            const dateStr = current.toISOString().split('T')[0];
            const diaPrice = calendarioPrecos.find(p => p.data === dateStr);

            if (diaPrice) {
                subtotal += Number(diaPrice.preco);
            } else {
                subtotal += Number(q.preco_base);
            }
            current.setUTCDate(current.getUTCDate() + 1);
        }

        const extras = selectedExtras.reduce((acc, id) => {
            const extra = disponiveisExtras.find(e => e.id === id);
            return acc + (extra ? Number(extra.preco) : 0);
        }, 0);

        return subtotal + extras;
    };

    const iniciarReserva = (quartoId: string) => {
        if (!checkIn || !checkOut) {
            alert("Por favor, escolha as datas da sua estadia no calendário antes de prosseguir com a reserva.");
            return;
        }
        setIdQuartoParaReserva(quartoId);
        fetchCalendario(quartoId); // Atualizar preços específicos para este quarto
        setBookingStep('extras');
        // Smooth scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleConfirmarReserva = async () => {
        if (!bookingForm.aceitouTermos) return;
        if (bookingForm.criarConta && bookingForm.senha !== bookingForm.confirmarSenha) {
            alert("As senhas não coincidem!");
            return;
        }

        try {
            const body = {
                quartoId: idQuartoParaReserva,
                checkIn,
                checkOut,
                hospede: {
                    prefixo: bookingForm.prefixo,
                    nome: bookingForm.nome,
                    sobrenome: bookingForm.sobrenome,
                    email: bookingForm.email,
                    telefone: bookingForm.telefone,
                    pais: bookingForm.pais,
                    cidade: bookingForm.cidade,
                    endereco1: bookingForm.endereco1,
                    endereco2: bookingForm.endereco2,
                    cep: bookingForm.cep,
                    senha: bookingForm.criarConta ? bookingForm.senha : undefined
                },
                extrasIds: selectedExtras,
                requerimentosEspeciais: bookingForm.requerimentosEspeciais,
                metodoPagamento: 'CARTAO' // Placeholder
            };

            const resp = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/reservas`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });

            const data = await resp.json();
            if (data.status === 'success') {
                alert("Reserva enviada com sucesso! Receberá um e-mail de confirmação em breve.");
                setShowBookingScreen(false);
                setBookingStep('selection');
                setSelectedExtras([]);
            } else {
                alert("Erro ao processar reserva: " + (data.error || 'Erro desconhecido'));
            }
        } catch (e) {
            console.error(e);
            alert("Erro de conexão com o servidor.");
        }
    };

    const confirmReservaSemLogin = () => {
        if (!formHospede.nome || !formHospede.email) {
            alert('Por favor, preencha nome e e-mail.');
            return;
        }
        efetuarReserva(idQuartoParaReserva!, formHospede);
        setShowGuestModal(false);
    };

    const buscarDisponibilidade = async () => {
        setLoading(true);
        try {
            const resp = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/reservas/disponibilidade?checkIn=${checkIn}&checkOut=${checkOut}&capacidade=${hospedes}`);
            const dados = await resp.json();
            if (dados.status === 'success') {
                setQuartosEncontrados(dados.data);
                setTimeout(() => {
                    document.getElementById('resultados-busca')?.scrollIntoView({ behavior: 'smooth' });
                }, 300);
            }
        } catch (e) {
            console.error(e);
            alert('Não foi possível comunicar com o servidor!');
        } finally {
            setLoading(false);
        }
    };

    const fetchCalendario = async (quartoId: string) => {
        try {
            const hoje = new Date();
            const fim = new Date();
            fim.setMonth(hoje.getMonth() + 2);
            const resp = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/tarifas/calendario?quartoId=${quartoId}&inicio=${hoje.toISOString()}&fim=${fim.toISOString()}&t=${Date.now()}`, {
                cache: 'no-store'
            });
            const data = await resp.json();
            if (data.status === 'success') setCalendarioPrecos(data.data);
        } catch (e) {
            console.error("Erro ao buscar calendário");
        }
    };

    useEffect(() => {
        if (showBookingScreen) {
            document.body.style.overflow = 'hidden';
            if (!quartosEncontrados) {
                // Carregar apenas os quartos ativos inicialmente
                fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/quartos?ativo=true`)
                    .then(r => r.json())
                    .then(d => {
                        if (d.status === 'success') {
                            setQuartosEncontrados(d.data);
                            if (d.data.length > 0) fetchCalendario(d.data[0].id);
                        }
                    });
            }
        } else {
            document.body.style.overflow = 'unset';
        }
    }, [showBookingScreen]);

    const efetuarReserva = async (quartoId: string, dadosHospedeManual?: any) => {
        setLoading(true);
        try {
            const resp = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/reservas`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    quartoId,
                    checkIn,
                    checkOut,
                    canalNome: 'SITE',
                    metodoPagamento,
                    hospede: dadosHospedeManual || (() => {
                        if (typeof window !== 'undefined') {
                            const userStr = localStorage.getItem('usuario');
                            if (userStr) {
                                const user = JSON.parse(userStr);
                                return { nome: user.nome, email: user.email };
                            }
                        }
                        return null; // Não deve cair aqui com o novo fluxo
                    })()
                })
            });
            const dados = await resp.json();
            if (dados.status === 'success') {
                alert('Reserva efetuada com sucesso! Verifique seu e-mail.');
                setQuartosEncontrados(null);
            } else {
                alert(dados.error || 'Erro ao efetuar reserva');
            }
        } catch (e) {
            console.error(e);
            alert('Erro de comunicação com o servidor');
        } finally {
            setLoading(false);
        }
    };

    const scrollTo = (id: string) => {

        document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    };

    return (
        <main className="min-h-screen bg-carapita-green flex flex-col font-sans selection:bg-carapita-gold selection:text-white">

            {/* Header / Navigation */}
            <header className={`fixed top-0 w-full z-50 px-4 md:px-12 py-4 md:py-6 flex items-center justify-between transition-all duration-700 ${scrolled ? 'bg-carapita-green shadow-lg py-3 md:py-4 border-b border-white/5 text-white' : 'bg-transparent text-white border-b border-white/20'}`}>
                {/* Left: Navigation Menu */}
                <nav className="flex-1 hidden lg:block">
                    <ul className="flex gap-10 text-[10px] uppercase tracking-mega font-medium">
                        <li className="hover:text-carapita-gold transition-colors duration-300 cursor-pointer" onClick={() => scrollTo('a-essencia')}>A Casa</li>
                        <li className="hover:text-carapita-gold transition-colors duration-300 cursor-pointer" onClick={() => scrollTo('alojamento')}>Alojamento</li>
                        <li className="hover:text-carapita-gold transition-colors duration-300 cursor-pointer" onClick={() => scrollTo('passeios')}>Passeios</li>
                        <li className="hover:text-carapita-gold transition-colors duration-300 cursor-pointer" onClick={() => scrollTo('contatos')}>Contatos</li>
                    </ul>
                </nav>

                {/* Center: Logo (Elegante e Imponente) - Incorporating the new luxury logo */}
                <div className="flex-shrink-0 text-center mx-2 md:mx-4 relative group cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
                    <div className={`relative w-16 h-16 md:w-28 md:h-28 rounded-full overflow-hidden border-2 transition-all duration-700 p-0.5 shadow-2xl ${scrolled ? 'border-carapita-gold bg-carapita-green' : 'border-white/40 bg-white/10 backdrop-blur-sm'}`}>
                        <img
                            src="/logo.jpg"
                            alt="Refúgio Carapita Logo"
                            className="w-full h-full object-cover scale-110 group-hover:scale-125 transition-transform duration-1000"
                        />
                    </div>
                </div>

                {/* Right: Admin & Auth */}
                <div className="flex-1 flex justify-end items-center gap-3 md:gap-6">


                    <button
                        onClick={() => {
                            const token = localStorage.getItem('token');
                            if (token) router.push('/perfil');
                            else router.push('/login');
                        }}
                        className={`hidden md:block px-6 py-2 rounded-full text-[10px] uppercase tracking-widest transition-all duration-300 border ${scrolled
                            ? 'border-white/20 text-white hover:bg-white hover:text-carapita-green'
                            : 'border-white text-white hover:bg-white hover:text-carapita-dark'
                            }`}
                    >
                        {mounted && isLoggedIn ? 'Minha Conta' : 'Login'}
                    </button>

                    <button onClick={() => setShowBookingScreen(true)} className={`text-[8px] md:text-[10px] uppercase tracking-mega font-bold rounded-full px-4 md:px-8 py-2 md:py-3 transition-all duration-500 bg-carapita-dark text-white hover:bg-carapita-gold text-center`}>
                        <span className="hidden md:inline">Reservar Agora</span>
                        <span className="md:hidden">Reservar</span>
                    </button>
                </div>
            </header>

            {/* Hero Banner */}
            <section className="relative w-full h-screen flex items-center justify-center overflow-hidden bg-black">
                {/* Carrossel de Imagens */}
                {heroImages.map((img, idx) => (
                    <div
                        key={idx}
                        className={`absolute inset-0 bg-cover bg-center transition-opacity duration-1000 ${idx === currentHeroIndex ? 'opacity-100 scale-105' : 'opacity-0'}`}
                        style={{
                            backgroundImage: `url("${img}")`,
                            transitionProperty: 'opacity, transform',
                            transitionDuration: '1000ms, 10s'
                        }}
                    ></div>
                ))}

                <div className="absolute inset-0 bg-black/30"></div>

                <div className="z-10 text-center px-4 max-w-5xl mt-24">
                    <p className="text-white text-xs md:text-sm tracking-mega uppercase mb-8 font-light drop-shadow-md">
                        Relais & Châteaux em Ourém
                    </p>
                    <h2 className="text-5xl md:text-7xl lg:text-8xl text-white mb-8 font-serif font-light leading-tight drop-shadow-lg">
                        Um Retiro de <br /><i className="font-serif text-carapita-goldLight">Exclusividade</i>
                    </h2>
                </div>

                {/* Scroll Indicator */}
                <div className="absolute bottom-12 left-1/2 -translate-x-1/2 text-white flex flex-col items-center gap-4 opacity-80 cursor-pointer hover:text-carapita-gold hover:opacity-100 transition-colors" onClick={() => setShowBookingScreen(true)}>
                    <div className="w-[1px] h-20 bg-gradient-to-b from-white to-transparent"></div>
                    <span className="text-[10px] tracking-mega uppercase font-bold">Ver Disponibilidade</span>
                </div>
            </section>



            {/* A Essência - "Um Lugar Mágico" (Estilo Casa da Calçada) */}
            <section id="a-essencia" className="w-full bg-carapita-green text-white py-20 lg:py-32 px-4 md:px-8 lg:px-24 overflow-hidden relative border-t border-white/5">
                <div className="max-w-[1400px] mx-auto flex flex-col items-center">

                    {/* Cabeçalho */}
                    <div className="text-center mb-16 lg:mb-32 z-10 relative px-4">
                        <div className="flex justify-center mb-6 lg:mb-8">
                            <span className="w-[1px] h-8 lg:h-12 bg-carapita-gold opacity-50 block"></span>
                        </div>
                        <span className="text-carapita-gold uppercase tracking-widest text-[9px] md:text-[10px] font-medium block mb-4 lg:mb-6"> Refúgio Carapita </span>
                        <h3 className="text-3xl md:text-6xl lg:text-7xl font-serif text-carapita-goldLight leading-tight font-light uppercase tracking-widest">
                            Um Lugar Mágico
                        </h3>
                    </div>

                    {/* Layout Sobreposto (Imagens + Texto) */}
                    <div className="w-full flex flex-col lg:flex-row items-center lg:items-start justify-between gap-12 lg:gap-16 relative">

                        {/* Box Decorativo Fino Atrás */}
                        <div className="hidden lg:block absolute left-4 xl:-left-8 top-12 w-[65%] h-[110%] border opacity-20 border-carapita-gold z-0 pointer-events-none"></div>

                        {/* Coluna das Imagens (Esquerda) */}
                        <div className="w-full lg:w-[82%] relative min-h-[400px] sm:min-h-[600px] md:min-h-[850px] flex items-center justify-center lg:justify-start">

                            {/* Imagem Maior (Fundo Direita) */}
                            <div className="absolute right-0 lg:-right-8 xl:-right-12 top-0 w-full md:w-[85%] lg:w-[75%] h-[320px] sm:h-[480px] md:h-[750px] z-10 overflow-hidden shadow-2xl">
                                <img
                                    src="https://a0.muscache.com/im/pictures/hosting/Hosting-1580467683590335058/original/f53992ea-c556-40bf-8ff8-07900f8f79a1.jpeg?im_w=1200"
                                    className="w-full h-full object-cover transform duration-[3s] hover:scale-105 filter brightness-100"
                                    alt="Vista Exterior Mágica"
                                />
                            </div>

                            {/* Imagem Menor Sobreposta (Frente Esquerda) */}
                            <div className="hidden md:block absolute left-0 lg:-left-12 xl:-left-20 bottom-[-20px] md:bottom-[-40px] w-[60%] md:w-[50%] lg:w-[40%] h-[320px] sm:h-[450px] md:h-[550px] z-20 overflow-hidden group shadow-[20px_20px_50px_rgba(0,0,0,0.5)] border-4 border-carapita-gold">
                                <img
                                    src="https://a0.muscache.com/im/pictures/hosting/Hosting-1580467683590335058/original/f0f4a673-77ef-4b5a-ba7a-2888f3e9eebf.jpeg?im_w=960"
                                    className="w-full h-full object-cover transform duration-[3s] group-hover:scale-105"
                                    alt="Detalhes do Alojamento"
                                />
                            </div>
                        </div>

                        {/* Coluna de Texto (Direita) */}
                        <div className="w-full lg:w-[15%] flex flex-col justify-start text-left z-30 mt-12 md:mt-28 lg:mt-0 lg:pt-12 xl:pl-4 px-4 md:px-0">
                            <p className="text-white/70 font-light leading-[2.2] text-sm tracking-wide text-justify md:text-left mb-12">
                                Uma propriedade com encanto secular. Um passado intemporal que se mescla com a história de Ourém e de Portugal. Um lugar visionário, recheado de natureza, onde se serviu a comunidade e celebraram vinhos e sonhos.
                                <br /><br />
                                Uma casa que ganha fama pelas suas maravilhosas vistas panorâmicas, e volta agora a abrir as portas como alojamento de charme e absoluto requinte.
                                Bem-vindos a esta casa mágica no coração lusitano, cujo espírito navega ao ritmo das paisagens verdes, com o qual aprendeu que tudo muda e tudo repousa!
                            </p>

                            {/* Botão Oval Elegante */}
                            <button onClick={() => scrollTo('alojamento')} className="flex items-center justify-center w-full md:w-48 h-12 border border-carapita-gold/60 rounded-[30px] text-[9px] uppercase tracking-[0.2em] text-carapita-gold hover:bg-carapita-gold hover:text-white transition-all duration-700 mx-auto md:mx-0">
                                Descobrir &#10141;
                            </button>
                        </div>
                    </div>

                </div>
            </section>

            {/* Galeria de Alojamento c/ Abas (Fotos Reais do Airbnb) */}
            <section id="alojamento" className="pb-20 lg:pb-32 px-4 md:px-8 max-w-[1400px] mx-auto w-full">
                <div className="text-center mb-12 lg:mb-16">
                    <span className="text-carapita-gold uppercase tracking-mega text-[10px] font-semibold block mb-4">Alojamento</span>
                    <h3 className="text-3xl md:text-5xl font-serif text-white font-light mb-8 lg:mb-12">As Suas Áreas</h3>

                    {/* Seletor de Alojamento */}
                    {galleryRooms.length > 1 && (
                        <div className="flex flex-wrap justify-center gap-2 md:gap-3 mb-8 lg:mb-10 px-2">
                            {galleryRooms.map((room) => (
                                <button
                                    key={room.id}
                                    onClick={() => setActiveGalleryRoom(room.id)}
                                    className={`px-4 md:px-6 py-2 md:py-2.5 rounded-full text-[9px] md:text-[10px] uppercase tracking-widest font-bold transition-all border ${activeGalleryRoom === room.id ? 'bg-carapita-gold text-white border-carapita-gold shadow-md' : 'bg-white/5 text-white/40 border-white/10 hover:border-carapita-gold hover:text-carapita-gold'}`}
                                >
                                    {room.nome}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Abas */}
                    <div className="flex overflow-x-auto hide-scrollbars md:flex-wrap justify-start md:justify-center gap-6 md:gap-12 border-b border-white/10 pb-4 max-w-3xl mx-auto px-4 snap-x">
                        {categories.map((cat) => (
                            <button
                                key={cat}
                                onClick={() => setActiveTab(cat)}
                                className={`snap-start text-[10px] md:text-xs uppercase tracking-widest font-medium pb-2 transition-all whitespace-nowrap ${activeTab === cat ? 'text-carapita-gold border-b border-carapita-gold' : 'text-white/40 hover:text-white'}`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Grid de Fotos */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 animate-fade-in">
                    {filteredGallery.map((img, idx) => (
                        <div key={`${img.category}-${idx}`} className="group overflow-hidden relative w-full h-80 md:h-96 bg-white/5 cursor-pointer border border-white/5 hover:border-carapita-gold/30 transition-all duration-700">
                            <img src={img.url} alt={`Refúgio Carapita - ${img.category}`} className="w-full h-full object-cover transform duration-[2s] ease-out group-hover:scale-105" />
                            <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-6">
                                <span className="text-white text-xs uppercase tracking-widest font-semibold drop-shadow-md">{img.category}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Passeios pela Região (10 Passeios) */}
            <section id="passeios" className="py-24 px-4 md:px-12 max-w-[1400px] mx-auto w-full bg-carapita-green border-b border-white/5">
                <div className="text-center mb-16">
                    <span className="text-carapita-gold uppercase tracking-mega text-[10px] font-semibold block mb-4">Descubra a Região</span>
                    <h3 className="text-4xl md:text-5xl font-serif text-white font-light max-w-2xl mx-auto leading-tight">
                        Explorar além do nosso <i className="font-serif text-carapita-gold">Refúgio</i>
                    </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                    {passeios.map((passeio, idx) => (
                        <div key={idx} className="group flex flex-col items-center text-center cursor-pointer" onClick={() => setPasseioSelecionado(passeio)}>
                            <div className="w-full h-64 md:h-72 overflow-hidden mb-6 relative border border-white/10">
                                <img src={passeio.img} alt={passeio.nome} className="w-full h-full object-cover transform duration-700 group-hover:scale-105 filter group-hover:brightness-110" />
                                <div className="absolute top-4 left-4 bg-carapita-green/90 backdrop-blur-sm px-3 py-1 flex items-center gap-1 shadow-sm border border-white/5">
                                    <MapPin size={10} className="text-carapita-gold" />
                                    <span className="text-[9px] uppercase tracking-widest font-semibold text-white">{passeio.dist}</span>
                                </div>
                            </div>
                            <h5 className="text-sm font-serif text-white font-medium mb-2 group-hover:text-carapita-gold transition-colors">{passeio.nome}</h5>
                            <p className="text-[11px] text-white/50 font-light leading-relaxed max-w-[220px]">{passeio.desc}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* Footer Padrão Relais & Châteaux */}
            <footer id="contatos" className="bg-carapita-dark text-white py-24 px-6 md:px-16 border-t-[12px] border-carapita-gold mt-auto">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start gap-16">
                    <div className="w-full md:w-1/3 text-center md:text-left flex flex-col justify-between">
                        <div className="flex flex-col items-center md:items-start group cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
                            <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-carapita-gold/50 mb-6 p-0.5 bg-carapita-dark group-hover:border-carapita-gold transition-all duration-500 shadow-xl">
                                <img src="/logo.jpg" alt="Refúgio Carapita Logo" className="w-full h-full object-cover" />
                            </div>
                            <h2 className="text-2xl font-serif font-light uppercase tracking-widest">
                                Refúgio<br /><span className="text-carapita-gold text-lg tracking-mega">Carapita</span>
                            </h2>
                        </div>
                        <div className="flex gap-4 justify-center md:justify-start mt-8">
                            {siteConfigs.linkInstagram && (
                                <a href={siteConfigs.linkInstagram} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center hover:bg-carapita-gold hover:border-carapita-gold transition-all duration-300">
                                    <Instagram size={16} />
                                </a>
                            )}
                            {siteConfigs.linkFacebook && (
                                <a href={siteConfigs.linkFacebook} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center hover:bg-carapita-gold hover:border-carapita-gold transition-all duration-300">
                                    <Facebook size={16} />
                                </a>
                            )}
                            {siteConfigs.linkAirbnb && (
                                <a href={siteConfigs.linkAirbnb} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center hover:bg-[#FF5A5F] hover:border-[#FF5A5F] transition-all duration-300 group">
                                    <svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" role="presentation" focusable="false" className="w-5 h-5 fill-white"><path d="m16 1c2.008 0 3.463.963 4.751 3.269l.533 1.025c1.954 3.83 6.114 12.54 7.1 14.836l.145.353c.667 1.591.91 2.472.96 3.396l.011.415c0 3.447-2.541 6.27-5.688 6.651l-.312.022c-1.928 0-3.391-.853-4.75-2.827-1.359 1.974-2.822 2.827-4.75 2.827-3.132 0-5.688-2.583-5.978-5.836l-.022-.4c0-.924.243-1.805.91-3.396l.144-.351c.987-2.296 5.147-11.006 7.101-14.836l.533-1.025c1.288-2.306 2.743-3.269 4.751-3.269zm0 2c-1.282 0-2.12.63-3 2.193l-.533 1.026c-1.936 3.792-6.081 12.474-7.057 14.753-.567 1.354-.755 2.05-.79 2.76l-.01.329c0 2.21 1.7 4.1 3.91 4.385l.29.015c1.47 0 2.463-.67 3.513-2.193l.301-.453.307-.453c.48-.702 1.018-1.513 1.637-2.457l1.452-2.214 1.452 2.214c.619.944 1.157 1.755 1.637 2.457l.307.453.301.453c1.05 1.523 2.043 2.193 3.513 2.193 2.227 0 4.1-1.888 4.2-4.1l.01-.3c0-.71-.188-1.406-.755-2.76l-.035-.082c-.976-2.279-5.122-10.96-7.077-14.793l-.533-1.026c-.88-1.563-1.718-2.193-3-2.193zm0 13a3 3 0 1 0 0 6 3 3 0 0 0 0-6z"></path></svg>
                                </a>
                            )}
                            {siteConfigs.linkBooking && (
                                <a href={siteConfigs.linkBooking} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center hover:bg-[#003580] hover:border-[#003580] transition-all duration-300 text-white font-bold text-xs uppercase cursor-pointer">
                                    B.
                                </a>
                            )}
                        </div>
                    </div>
                    <div className="w-full md:w-2/3 grid grid-cols-1 sm:grid-cols-3 gap-12 text-center md:text-left">
                        <div className="flex flex-col gap-4 text-xs font-light text-white/70">
                            <h5 className="text-white tracking-mega uppercase font-medium mb-4">A Casa</h5>
                            <span className="hover:text-carapita-gold transition-colors duration-300 cursor-pointer" onClick={() => scrollTo('a-essencia')}>A Essência</span>
                            <span className="hover:text-carapita-gold transition-colors duration-300 cursor-pointer" onClick={() => scrollTo('alojamento')}>Alojamento</span>
                            <span className="hover:text-carapita-gold transition-colors duration-300 cursor-pointer" onClick={() => scrollTo('passeios')}>Atrações e Passeios</span>
                        </div>
                        <div className="flex flex-col gap-4 text-xs font-light text-white/70">
                            <h5 className="text-white tracking-mega uppercase font-medium mb-4">Contatos</h5>
                            <p>{siteConfigs.endereco || 'Rua da Paz, S/N, Ourém, Portugal'}</p>
                            <p>{siteConfigs.telefoneReservas || '+351 967 244 938'}</p>
                            <p>{siteConfigs.emailContato || 'contato@refugiocarapita.com'}</p>
                        </div>
                        <div className="flex flex-col gap-4 text-xs font-light text-white/70">
                            <h5 className="text-white tracking-mega uppercase font-medium mb-4">Legal</h5>
                            <a href="#" className="hover:text-carapita-gold transition-colors duration-300">Políticas de Privacidade</a>
                            <a href="#" className="hover:text-carapita-gold transition-colors duration-300">Termos & Condições</a>
                        </div>
                    </div>
                </div>
            </footer>
            {/* Modal de Detalhes do Passeio */}
            {passeioSelecionado && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm shadow-2xl transition-opacity animate-fade-in" onClick={() => setPasseioSelecionado(null)}></div>
                    <div className="relative bg-carapita-green w-full max-w-4xl max-h-[90vh] overflow-y-auto z-[101] shadow-2xl flex flex-col md:flex-row animate-fade-in border border-white/5">
                        {/* Botão Fechar */}
                        <button
                            className="absolute top-4 right-4 z-[102] w-10 h-10 bg-black/50 hover:bg-carapita-gold text-white flex items-center justify-center transition-colors"
                            onClick={() => setPasseioSelecionado(null)}
                        >
                            <X size={20} />
                        </button>

                        {/* Imagem Lado Esquerdo Modal */}
                        <div className="w-full md:w-1/2 h-64 md:h-auto min-h-[300px] relative">
                            <img src={passeioSelecionado.img} className="absolute inset-0 w-full h-full object-cover" alt={passeioSelecionado.nome} />
                            <div className="absolute bottom-4 left-4 bg-carapita-green/90 backdrop-blur-sm px-4 py-2 flex items-center gap-2 shadow-lg border border-white/5">
                                <MapPin size={12} className="text-carapita-gold" />
                                <span className="text-[10px] uppercase tracking-widest font-semibold text-white">{passeioSelecionado.dist} da Casa</span>
                            </div>
                        </div>

                        {/* Conteúdo Lado Direito Modal */}
                        <div className="w-full md:w-1/2 p-10 md:p-14 flex flex-col justify-center bg-carapita-green text-left">
                            <span className="text-carapita-gold uppercase tracking-widest text-[10px] font-medium block mb-4 border-b border-carapita-gold/30 pb-4 inline-block w-max">Descobrir Ourém & Arredores</span>
                            <h3 className="text-3xl md:text-4xl font-serif text-white leading-tight font-light mb-6">
                                {passeioSelecionado.nome}
                            </h3>
                            <p className="text-white/60 font-light leading-[2.0] text-sm mb-12 text-justify">
                                {passeioSelecionado.historia}
                            </p>

                            <a
                                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(passeioSelecionado.nome + " Portugal")}`}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-block text-center w-full bg-carapita-dark hover:bg-carapita-gold text-white text-[10px] uppercase tracking-mega py-4 transition-colors duration-500"
                            >
                                Ver no Mapa Direções
                            </a>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de Finalização de Reserva (Cadastro Rápido) */}
            {showGuestModal && (
                <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">

                    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowGuestModal(false)}></div>
                    <div className="relative bg-carapita-green w-full max-w-lg p-10 shadow-2xl animate-fade-in border border-white/5">
                        <button className="absolute top-4 right-4 text-white/50" onClick={() => setShowGuestModal(false)}><X size={20} /></button>
                        <h3 className="text-2xl font-serif text-white mb-2">Finalize sua Reserva</h3>
                        <p className="text-xs text-white/40 uppercase tracking-widest mb-8">Precisamos de alguns dados para confirmar sua estadia.</p>

                        <div className="flex flex-col gap-6">
                            <div className="flex flex-col gap-2">
                                <label className="text-[10px] uppercase tracking-mega text-white/40">Nome Completo</label>
                                <input
                                    type="text"
                                    value={formHospede.nome}
                                    onChange={(e) => setFormHospede({ ...formHospede, nome: e.target.value })}
                                    className="border-b border-carapita-gold/30 bg-transparent pb-2 outline-none focus:border-carapita-gold text-sm font-light text-white"
                                    placeholder="Como devemos chamá-lo?"
                                />
                            </div>
                            <div className="flex flex-col gap-2">
                                <label className="text-[10px] uppercase tracking-mega text-white/40">E-mail</label>
                                <input
                                    type="email"
                                    value={formHospede.email}
                                    onChange={(e) => setFormHospede({ ...formHospede, email: e.target.value })}
                                    className="border-b border-carapita-gold/30 bg-transparent pb-2 outline-none focus:border-carapita-gold text-sm font-light text-white"
                                    placeholder="exemplo@email.com"
                                />
                            </div>
                            <div className="flex flex-col gap-2">
                                <label className="text-[10px] uppercase tracking-mega text-white/40">Telefone / WhatsApp</label>
                                <input
                                    type="text"
                                    value={formHospede.telefone}
                                    onChange={(e) => setFormHospede({ ...formHospede, telefone: e.target.value })}
                                    className="border-b border-carapita-gold/30 bg-transparent pb-2 outline-none focus:border-carapita-gold text-sm font-light text-white"
                                    placeholder="+351 000 000 000"
                                />
                            </div>

                            <div className="flex flex-col gap-2">
                                <label className="text-[10px] uppercase tracking-mega text-white/40">Método de Pagamento</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {['MBWAY', 'PAYPAL', 'TRANSFERENCIA'].map((metodo) => (
                                        <button
                                            key={metodo}
                                            onClick={() => setMetodoPagamento(metodo)}
                                            className={`py-3 text-[9px] uppercase tracking-widest border transition-all ${metodoPagamento === metodo
                                                ? 'bg-carapita-dark text-white border-carapita-dark'
                                                : 'bg-transparent text-carapita-muted border-carapita-border hover:border-carapita-gold'
                                                }`}
                                        >
                                            {metodo}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <button
                                onClick={confirmReservaSemLogin}
                                className="mt-4 bg-carapita-gold hover:bg-carapita-dark text-white uppercase text-[10px] tracking-mega py-4 transition-all duration-500"
                            >
                                Confirmar Reserva Direta
                            </button>

                            <p className="text-[9px] text-center text-carapita-muted uppercase tracking-widest leading-relaxed">
                                Ao confirmar, você concorda com nossos termos de estadia e política de cancelamento.
                            </p>
                        </div>
                    </div>
                </div>
            )}
            {/* --- NOVA TELA DE RESERVAS IMERSIVA --- */}
            {showBookingScreen && (
                <div className="fixed inset-0 z-[200] bg-carapita-green overflow-y-auto animate-fade-in font-serif">
                    {/* Header Banner Estilo Casa da Calçada */}
                    <div className="relative h-[60vh] w-full overflow-hidden">
                        {heroImages.map((img, idx) => (
                            <img
                                key={idx}
                                src={img}
                                className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${currentHeroIndex === idx ? 'opacity-100' : 'opacity-0'}`}
                            />
                        ))}
                        <div className="absolute inset-0 bg-black/20"></div>

                        {/* Info Box Flutuante */}
                        <div className="absolute bottom-10 left-6 md:left-20 bg-carapita-green/90 backdrop-blur p-8 shadow-2xl max-w-sm border-t-4 border-carapita-gold">
                            <h2 className="text-2xl text-white mb-4 tracking-widest uppercase">Refúgio Carapita</h2>
                            <div className="space-y-3 text-[11px] text-white/50 font-sans uppercase tracking-widest">
                                <p className="flex items-start gap-2">
                                    <MapPin size={14} className="text-carapita-gold shrink-0" />
                                    <span>{siteConfigs.endereco || 'R. Dom Afonso Quarto Conde de Ourém IV 450, 2490-480 Ourém'}</span>
                                </p>
                                <p className="flex items-center gap-2">
                                    <Users size={14} className="text-carapita-gold" />
                                    <span>{siteConfigs.telefoneReservas || '+351 967 244 938'}</span>
                                </p>
                                <p className="flex items-center gap-2">
                                    <ChevronRight size={14} className="text-carapita-gold" />
                                    <span>{siteConfigs.emailContato || 'refugiocarapita.com'}</span>
                                </p>
                            </div>
                        </div>

                        {/* Botão Fechar */}
                        <button
                            onClick={() => setShowBookingScreen(false)}
                            className="absolute top-8 right-8 bg-white/10 hover:bg-white/20 p-3 rounded-full text-white backdrop-blur transition-all"
                        >
                            <X size={24} />
                        </button>
                    </div>

                    <div className="max-w-6xl mx-auto py-20 px-6">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                            {/* Coluna do Calendário e Filtros */}
                            <div className="lg:col-span-2">
                                {bookingStep === 'selection' && (
                                    <>
                                        {/* Filtro de Hóspedes + Botão Buscar */}
                                        <div className="flex items-end gap-4 mb-8 pb-6 border-b border-white/10">
                                            <div>
                                                <label className="text-[9px] uppercase tracking-mega text-white/40 block mb-2">Nº de Hóspedes</label>
                                                <select
                                                    value={hospedes}
                                                    onChange={(e) => setHospedes(Number(e.target.value))}
                                                    className="bg-white/5 px-4 py-3 border border-white/10 outline-none font-sans text-sm focus:border-carapita-gold text-white"
                                                >
                                                    {[1, 2, 3, 4, 5, 6].map(n => <option key={n} value={n} className="bg-carapita-green">{n} {n === 1 ? 'Hóspede' : 'Hóspedes'}</option>)}
                                                </select>
                                            </div>
                                            {checkIn && checkOut && (
                                                <div className="flex items-center gap-3 bg-carapita-gold/10 border border-carapita-gold/30 px-4 py-3">
                                                    <Calendar size={14} className="text-carapita-gold" />
                                                    <span className="text-xs font-sans text-white font-bold">{checkIn} → {checkOut}</span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Calendário Interativo Real */}
                                        <div className="mb-12">
                                            <h4 className="font-serif text-xl mb-6 text-white border-b border-white/10 pb-4">
                                                Selecione as Datas da Estadia
                                            </h4>
                                            <SeletorCalendario
                                                quartoId={quartosEncontrados?.[0]?.id || ''}
                                                onSelect={(start, end) => {
                                                    setCheckIn(start);
                                                    setCheckOut(end);
                                                }}
                                            />
                                        </div>

                                        {/* Lista de Quartos */}
                                        <h2 className="font-serif text-3xl mb-10 text-white border-b border-white/10 pb-4 uppercase tracking-widest">Alojamentos Disponíveis</h2>
                                        <div className="space-y-8">
                                            {(quartosEncontrados || []).length > 0 ? (
                                                quartosEncontrados?.map((q) => {
                                                    const fotos = parseFotos(q.fotos);
                                                    const mainFoto = fotos.find(f => f.isMain)?.url || fotos[0]?.url || 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800&auto=format&fit=crop';
                                                    let comodidades: string[] = [];
                                                    try { comodidades = JSON.parse(q.comodidades || '[]'); } catch { }
                                                    const topBullets = comodidades.filter(c => c.toLowerCase().includes('cama') || c.toLowerCase().includes('m²') || c.toLowerCase().includes('vista')).slice(0, 4);

                                                    return (
                                                        <div key={q.id} className="bg-white/5 border border-carapita-gold/30 hover:border-carapita-gold hover:shadow-[0_20px_40px_rgba(212,175,55,0.1)] transition-all duration-700 group flex flex-col md:flex-row overflow-hidden block">
                                                            {/* Foto Hero */}
                                                            <div
                                                                className="w-full md:w-64 h-56 shrink-0 relative overflow-hidden cursor-pointer"
                                                                onClick={() => { if (fotos.length > 0) { setLightboxFotos(fotos.map(f => f.url)); setLightboxIdx(0); } }}
                                                            >
                                                                <img src={mainFoto} alt={q.nome} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" />
                                                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-500 flex items-center justify-center border-r border-carapita-gold/20">
                                                                    <Camera className="text-white opacity-0 group-hover:opacity-100 transition-opacity duration-500 drop-shadow-lg" size={28} strokeWidth={1.5} />
                                                                </div>
                                                                {fotos.length > 1 && (
                                                                    <div className="absolute bottom-3 right-3 bg-black/60 backdrop-blur-md text-white px-2 py-1 text-[8px] uppercase tracking-widest font-bold">
                                                                        +{fotos.length - 1} Fotos
                                                                    </div>
                                                                )}
                                                            </div>

                                                            {/* Detalhes do Quarto */}
                                                            <div className="p-6 md:p-8 flex-1 flex flex-col justify-between">
                                                                <div>
                                                                    <div className="flex justify-between items-start mb-2 border-b border-carapita-gold/10 pb-3">
                                                                        <div>
                                                                            <h3 className="font-serif text-2xl text-white group-hover:text-carapita-gold transition-colors">{q.nome}</h3>
                                                                            <p className="text-[9px] uppercase tracking-widest text-carapita-gold font-bold mt-1.5">{q.tipo}</p>
                                                                        </div>
                                                                        <div className="text-right flex flex-col items-end">
                                                                            <div className="flex items-baseline gap-1">
                                                                                <span className="text-sm font-serif text-carapita-gold">€</span>
                                                                                <span className="text-3xl font-serif text-white group-hover:text-carapita-gold transition-colors">{Number(q.preco_base).toFixed(0)}</span>
                                                                            </div>
                                                                            <p className="text-[8px] text-white/40 uppercase tracking-widest">Por noite</p>
                                                                        </div>
                                                                    </div>

                                                                    <p className="text-xs text-white/50 my-4 line-clamp-2 leading-relaxed font-light">{q.descricao}</p>

                                                                    {topBullets.length > 0 && (
                                                                        <ul className="flex flex-wrap gap-x-5 gap-y-2 mb-6">
                                                                            {topBullets.map((c, i) => (
                                                                                <li key={i} className="flex items-center gap-1.5 text-[9px] uppercase tracking-widest text-white/60 font-bold">
                                                                                    <div className="w-1 h-1 bg-carapita-gold rounded-full"></div> {c}
                                                                                </li>
                                                                            ))}
                                                                        </ul>
                                                                    )}
                                                                </div>

                                                                {/* Call to Action */}
                                                                <div className="flex justify-between items-center">
                                                                    <button onClick={() => iniciarReserva(q.id)} className="bg-transparent border border-carapita-gold text-carapita-gold px-8 py-3 text-[9px] uppercase tracking-widest font-bold hover:bg-carapita-gold hover:text-white transition-all duration-500 flex items-center gap-3 group/btn">
                                                                        Selecionar Alojamento <ChevronRight size={12} className="group-hover/btn:translate-x-1 transition-transform" />
                                                                    </button>
                                                                    {q.video_url && (
                                                                        <a href={q.video_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-carapita-gold hover:text-white transition-colors">
                                                                            <PlayCircle size={20} />
                                                                            <span className="text-[9px] font-bold uppercase tracking-widest">Ver Vídeo</span>
                                                                        </a>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                })
                                            ) : (
                                                <div className="py-16 text-center border border-dashed border-gray-200 bg-gray-50/50">
                                                    <p className="text-sm text-carapita-muted font-bold uppercase tracking-widest">Nenhum alojamento disponível</p>
                                                    <p className="text-xs text-gray-400 mt-2">Por favor, ajuste as datas da sua estadia.</p>
                                                </div>
                                            )}
                                        </div>
                                    </>
                                )}

                                {bookingStep === 'extras' && (
                                    <div className="animate-fade-in max-w-4xl mx-auto">
                                        <div className="text-center mb-16">
                                            <span className="text-carapita-gold text-[10px] uppercase tracking-mega font-bold block mb-4">Experiências Adicionais</span>
                                            <h2 className="font-serif text-4xl text-white uppercase tracking-widest leading-tight">Personalize a sua <i className="font-serif italic font-light">Estadia</i></h2>
                                            <p className="text-white/40 mt-4 text-[10px] uppercase tracking-widest font-medium">Selecione os mimos e serviços exclusivos para o seu refúgio</p>
                                        </div>

                                        <div className="space-y-6 mb-20">
                                            {disponiveisExtras.map(e => (
                                                <div key={e.id} className={`group flex flex-col md:flex-row bg-white/5 border transition-all duration-700 hover:shadow-2xl overflow-hidden ${selectedExtras.includes(e.id) ? 'border-carapita-gold ring-1 ring-carapita-gold/20' : 'border-white/5'}`}>
                                                    {/* Imagem do Extra */}
                                                    <div className="w-full md:w-44 h-44 shrink-0 bg-white/5 overflow-hidden relative">
                                                        {e.foto ? (
                                                            <img src={e.foto} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" alt={e.nome} />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center text-4xl opacity-30 bg-white/5">{e.icone || '✨'}</div>
                                                        )}
                                                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-500" />
                                                    </div>

                                                    {/* Detalhes do Extra */}
                                                    <div className="flex-1 p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
                                                        <div className="max-w-md">
                                                            <h4 className="font-serif text-xl text-white mb-2 group-hover:text-carapita-gold transition-colors">{e.nome}</h4>
                                                            <p className="text-[10px] text-white/40 font-light uppercase tracking-widest leading-relaxed line-clamp-2">{e.descricao}</p>
                                                        </div>

                                                        <div className="flex items-center md:flex-col md:items-end justify-between gap-4 border-t md:border-t-0 pt-4 md:pt-0 border-white/10 min-w-[140px]">
                                                            <div className="text-right">
                                                                <span className="text-lg font-serif text-carapita-gold">€{Number(e.preco).toFixed(2)}</span>
                                                                <p className="text-[8px] text-white/40 uppercase tracking-widest mt-0.5">Preço por serviço</p>
                                                            </div>
                                                            <button
                                                                onClick={() => {
                                                                    if (selectedExtras.includes(e.id)) setSelectedExtras(selectedExtras.filter(id => id !== e.id));
                                                                    else setSelectedExtras([...selectedExtras, e.id]);
                                                                }}
                                                                className={`text-[9px] uppercase tracking-mega font-bold px-8 py-3.5 transition-all duration-500 rounded-sm shadow-sm ${selectedExtras.includes(e.id)
                                                                    ? 'bg-carapita-gold text-white'
                                                                    : 'bg-transparent text-carapita-gold border border-carapita-gold hover:bg-carapita-gold hover:text-white'}`}
                                                            >
                                                                {selectedExtras.includes(e.id) ? 'Remover' : 'Adicionar'}
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        <div className="flex justify-between items-center border-t border-white/10 pt-12">
                                            <button onClick={() => setBookingStep('selection')} className="text-[10px] uppercase tracking-widest text-white/40 hover:text-white transition-all flex items-center gap-2 group">
                                                <ChevronLeft size={14} className="group-hover:-translate-x-1 transition-transform" /> Voltar
                                            </button>
                                            <button onClick={() => setBookingStep('details')} className="bg-carapita-dark text-white px-12 py-5 text-[11px] uppercase tracking-mega font-bold hover:bg-carapita-gold shadow-xl transform hover:-translate-y-1 transition-all">
                                                Confirmar e Continuar
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {bookingStep === 'details' && (
                                    <div className="animate-fade-in font-sans">
                                        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                                            <h2 className="font-serif text-3xl text-white uppercase tracking-widest">Detalhes do Hóspede</h2>
                                            {!isGuestLoggedIn && (
                                                <button
                                                    onClick={() => setShowGuestLoginModal(true)}
                                                    className="text-[10px] uppercase tracking-widest font-bold border border-carapita-gold text-carapita-gold px-6 py-2 hover:bg-carapita-gold hover:text-white transition-all shadow-sm"
                                                >
                                                    Já tem conta? Inicie sessão
                                                </button>
                                            )}
                                            {isGuestLoggedIn && (
                                                <div className="flex items-center gap-2 text-carapita-gold text-xs font-bold uppercase tracking-widest">
                                                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                                    Sessão Iniciada: {bookingForm.nome}
                                                </div>
                                            )}
                                        </div>

                                        <div className="space-y-10">
                                            <section>
                                                <h4 className="text-[10px] uppercase tracking-mega text-carapita-gold font-bold mb-6 border-b border-white/10 pb-2">Informação de Contacto</h4>
                                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                                                    <div className="col-span-1">
                                                        <label className="text-[10px] uppercase text-white/40 block mb-2">Prefixo</label>
                                                        <select value={bookingForm.prefixo} onChange={e => setBookingForm({ ...bookingForm, prefixo: e.target.value })} className="w-full border-b border-white/20 bg-transparent py-3 text-sm focus:border-carapita-gold outline-none text-white">
                                                            {['Mr.', 'Mrs.', 'Ms.', 'Dr.', 'Pr.'].map(p => <option key={p} value={p} className="bg-carapita-green">{p}</option>)}
                                                        </select>
                                                    </div>
                                                    <div className="col-span-1 lg:col-span-1">
                                                        <label className="text-[10px] uppercase text-white/40 block mb-2">Nome</label>
                                                        <input type="text" value={bookingForm.nome} onChange={e => setBookingForm({ ...bookingForm, nome: e.target.value })} className="w-full border-b border-white/20 bg-transparent py-3 text-sm focus:border-carapita-gold outline-none text-white" placeholder="João" />
                                                    </div>
                                                    <div className="col-span-2 lg:col-span-2">
                                                        <label className="text-[10px] uppercase text-white/40 block mb-2">Sobrenome</label>
                                                        <input type="text" value={bookingForm.sobrenome} onChange={e => setBookingForm({ ...bookingForm, sobrenome: e.target.value })} className="w-full border-b border-white/20 bg-transparent py-3 text-sm focus:border-carapita-gold outline-none text-white" placeholder="Silva" />
                                                    </div>
                                                    <div className="col-span-2 lg:col-span-2">
                                                        <label className="text-[10px] uppercase text-white/40 block mb-2">Telefone</label>
                                                        <input type="tel" value={bookingForm.telefone} onChange={e => setBookingForm({ ...bookingForm, telefone: e.target.value })} className="w-full border-b border-white/20 bg-transparent py-3 text-sm focus:border-carapita-gold outline-none text-white" placeholder="+351 000 000 000" />
                                                    </div>
                                                    <div className="col-span-2 lg:col-span-2">
                                                        <label className="text-[10px] uppercase text-white/40 block mb-2">E-mail</label>
                                                        <input type="email" value={bookingForm.email} onChange={e => setBookingForm({ ...bookingForm, email: e.target.value })} className="w-full border-b border-white/20 bg-transparent py-3 text-sm focus:border-carapita-gold outline-none text-white" placeholder="joao@exemplo.com" />
                                                    </div>
                                                </div>
                                            </section>

                                            <section>
                                                <h4 className="text-[10px] uppercase tracking-mega text-carapita-gold font-bold mb-6 border-b border-white/10 pb-2">Endereço de Faturação</h4>
                                                <div className="grid grid-cols-2 gap-6 text-sm">
                                                    <div className="col-span-2 lg:col-span-1">
                                                        <label className="text-[10px] uppercase text-white/40 block mb-2">País</label>
                                                        <select value={bookingForm.pais} onChange={e => setBookingForm({ ...bookingForm, pais: e.target.value })} className="w-full border-b border-white/20 py-3 focus:border-carapita-gold outline-none bg-transparent appearance-none text-white">
                                                            <option value="" disabled className="bg-carapita-green">Selecione o seu país</option>
                                                            <option value="Portugal" className="bg-carapita-green">Portugal</option>
                                                            <option value="Brasil" className="bg-carapita-green">Brasil</option>
                                                            <option value="Espanha" className="bg-carapita-green">Espanha</option>
                                                            <option value="França" className="bg-carapita-green">França</option>
                                                            <option value="Reino Unido" className="bg-carapita-green">Reino Unido</option>
                                                            <option value="Estados Unidos" className="bg-carapita-green">Estados Unidos</option>
                                                            <option value="Alemanha" className="bg-carapita-green">Alemanha</option>
                                                            <option value="Itália" className="bg-carapita-green">Itália</option>
                                                            <option value="Canadá" className="bg-carapita-green">Canadá</option>
                                                            <option value="Suíça" className="bg-carapita-green">Suíça</option>
                                                            <option value="Angola" className="bg-carapita-green">Angola</option>
                                                            <option value="Cabo Verde" className="bg-carapita-green">Cabo Verde</option>
                                                            <option value="Moçambique" className="bg-carapita-green">Moçambique</option>
                                                            <option value="Irlanda" className="bg-carapita-green">Irlanda</option>
                                                            <option value="Bélgica" className="bg-carapita-green">Bélgica</option>
                                                            <option value="Outro" className="bg-carapita-green">Outro</option>
                                                        </select>
                                                    </div>
                                                    <div className="col-span-2 lg:col-span-1">
                                                        <label className="text-[10px] uppercase text-white/40 block mb-2">Cidade</label>
                                                        <input type="text" value={bookingForm.cidade} onChange={e => setBookingForm({ ...bookingForm, cidade: e.target.value })} className="w-full border-b border-white/20 bg-transparent py-3 focus:border-carapita-gold outline-none text-white" />
                                                    </div>
                                                    <div className="col-span-2">
                                                        <label className="text-[10px] uppercase text-white/40 block mb-2">Endereço 1</label>
                                                        <input type="text" value={bookingForm.endereco1} onChange={e => setBookingForm({ ...bookingForm, endereco1: e.target.value })} className="w-full border-b border-white/20 bg-transparent py-3 focus:border-carapita-gold outline-none text-white" />
                                                    </div>
                                                    <div className="col-span-2 lg:col-span-1">
                                                        <label className="text-[10px] uppercase text-white/40 block mb-2">Endereço 2 (Opcional)</label>
                                                        <input type="text" value={bookingForm.endereco2} onChange={e => setBookingForm({ ...bookingForm, endereco2: e.target.value })} className="w-full border-b border-white/20 bg-transparent py-3 focus:border-carapita-gold outline-none text-white" />
                                                    </div>
                                                    <div className="col-span-2 lg:col-span-1">
                                                        <label className="text-[10px] uppercase text-white/40 block mb-2">CEP / Código Postal</label>
                                                        <input type="text" value={bookingForm.cep} onChange={e => setBookingForm({ ...bookingForm, cep: e.target.value })} className="w-full border-b border-white/20 bg-transparent py-3 focus:border-carapita-gold outline-none text-white" />
                                                    </div>
                                                </div>
                                            </section>

                                            <section className="bg-white/5 p-8 border border-white/10">
                                                <div className="flex items-center gap-3 mb-6">
                                                    <input type="checkbox" id="create" checked={bookingForm.criarConta} onChange={e => setBookingForm({ ...bookingForm, criarConta: e.target.checked })} className="w-4 h-4 accent-carapita-gold" />
                                                    <label htmlFor="create" className="text-xs font-bold uppercase tracking-widest text-white cursor-pointer">Desejo criar uma conta para reservar mais rápido</label>
                                                </div>
                                                {bookingForm.criarConta && (
                                                    <div className="grid grid-cols-2 gap-6 animate-slide-down">
                                                        <div>
                                                            <label className="text-[10px] uppercase text-white/40 block mb-2">Senha</label>
                                                            <input type="password" value={bookingForm.senha} onChange={e => setBookingForm({ ...bookingForm, senha: e.target.value })} className="w-full border-b border-white/20 bg-transparent py-3 text-sm focus:border-carapita-gold outline-none text-white" />
                                                        </div>
                                                        <div>
                                                            <label className="text-[10px] uppercase text-white/40 block mb-2">Confirmar Senha</label>
                                                            <input type="password" value={bookingForm.confirmarSenha} onChange={e => setBookingForm({ ...bookingForm, confirmarSenha: e.target.value })} className="w-full border-b border-white/20 bg-transparent py-3 text-sm focus:border-carapita-gold outline-none text-white" />
                                                        </div>
                                                    </div>
                                                )}
                                            </section>

                                            <section>
                                                <h4 className="text-[10px] uppercase tracking-mega text-carapita-gold font-bold mb-4">Requerimentos Especiais</h4>
                                                <p className="text-[10px] text-white/40 mb-4 uppercase tracking-widest leading-relaxed">Pode adicionar aqui informações como idade das crianças, pedidos de restaurante, dietas especiais ou animais de estimação.</p>
                                                <textarea value={bookingForm.requerimentosEspeciais} onChange={e => setBookingForm({ ...bookingForm, requerimentosEspeciais: e.target.value })} className="w-full border border-white/10 bg-transparent p-4 text-sm h-32 focus:border-carapita-gold outline-none text-white" placeholder="Escreva aqui os seus pedidos..." />
                                            </section>
                                        </div>

                                        <div className="flex justify-between mt-12 pt-8 border-t border-white/10">
                                            <button onClick={() => setBookingStep('extras')} className="text-[10px] uppercase tracking-widest text-white/40 hover:text-white">Voltar</button>
                                            <button onClick={() => setBookingStep('payment')} className="bg-carapita-gold text-white px-10 py-4 text-[11px] uppercase tracking-mega font-bold hover:bg-white hover:text-carapita-green transition-all shadow-xl">Prosseguir para pagamento</button>
                                        </div>
                                    </div>
                                )}

                                {bookingStep === 'payment' && (
                                    <div className="animate-fade-in font-sans">
                                        <h2 className="font-serif text-3xl mb-8 text-white uppercase tracking-widest text-sh">Pagamento e Políticas</h2>

                                        <div className="bg-green-600/10 p-6 flex items-start gap-4 mb-10 border border-green-600/30 text-green-400">
                                            <div className="p-2 bg-green-600 rounded-full text-white"><Check size={16} /></div>
                                            <p className="text-xs leading-relaxed uppercase tracking-widest font-medium">Usamos transmissão segura e armazenamento criptografado para proteger as suas informações pessoais e dados de pagamento.</p>
                                        </div>

                                        <section className="mb-12">
                                            <h4 className="text-[10px] uppercase tracking-mega text-carapita-gold font-bold mb-6 border-b border-white/10 pb-2">Detalhes de Pagamento</h4>
                                            <div className="bg-white/5 p-10 text-center border border-dashed border-white/10 rounded">
                                                <p className="text-[10px] uppercase tracking-widest text-white/40 mb-4">A processar integração com Cartões de Crédito (Stripe/Reduniq)</p>
                                                <div className="flex justify-center gap-4 opacity-50">
                                                    <img src="https://upload.wikimedia.org/wikipedia/commons/5/5e/Visa_Inc._logo.svg" className="h-6 brightness-0 invert" alt="Visa" />
                                                    <img src="https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg" className="h-8 brightness-0 invert" alt="Mastercard" />
                                                </div>
                                            </div>
                                        </section>

                                        <section className="space-y-8 mb-12">
                                            <div>
                                                <h4 className="text-[10px] uppercase tracking-mega text-white font-bold mb-3">POLÍTICA DE GARANTIA</h4>
                                                <p className="text-xs text-white/50 leading-relaxed italic uppercase tracking-widest p-4 border-l-2 border-carapita-gold bg-white/5">O depósito, não é reembolsável, no valor integral da estadia, incluindo taxa, será cobrado 02 dias antes da chegada.</p>
                                            </div>
                                            <div>
                                                <h4 className="text-[10px] uppercase tracking-mega text-white font-bold mb-3">POLÍTICAS DE CANCELAMENTO</h4>
                                                <p className="text-xs text-white/50 leading-relaxed italic uppercase tracking-widest p-4 border-l-2 border-carapita-gold bg-white/5">Cancelamento/modificação gratuito até 2 dias antes da chegada. Uma penalidade de toda a estadia incluindo impostos será cobrado por cancelamento/modificação tardio, não comparência ou partida antecipada.</p>
                                            </div>
                                        </section>

                                        <div className="space-y-4 mb-10">
                                            <div className="flex items-center gap-3">
                                                <input type="checkbox" id="terms" checked={bookingForm.aceitouTermos} onChange={e => setBookingForm({ ...bookingForm, aceitouTermos: e.target.checked })} className="w-4 h-4 accent-carapita-gold" />
                                                <label htmlFor="terms" className="text-[10px] uppercase tracking-widest text-white/60 cursor-pointer">Reconhecimento de que concordo com os termos de privacidade e condições de Reserva</label>
                                            </div>
                                        </div>

                                        <div className="flex justify-between pt-8 border-t border-white/10">
                                            <button onClick={() => setBookingStep('details')} className="text-[10px] uppercase tracking-widest text-white/40 hover:text-white">Voltar</button>
                                            <button
                                                onClick={handleConfirmarReserva}
                                                disabled={!bookingForm.aceitouTermos}
                                                className={`px-12 py-5 text-[11px] uppercase tracking-mega font-bold transition-all ${bookingForm.aceitouTermos ? 'bg-carapita-gold text-white hover:bg-white hover:text-carapita-green shadow-xl' : 'bg-white/10 text-white/20 cursor-not-allowed'}`}
                                            >
                                                Confirmar Reserva e Pagar
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Sumário lateral / Carrinho */}
                            <div className="lg:col-span-1">
                                <div className="sticky top-10 space-y-8">
                                    <div className="bg-carapita-dark text-white p-10">
                                        <h3 className="font-serif text-xl border-b border-white/10 pb-4 mb-6 uppercase tracking-widest italic">A Sua Estadia</h3>
                                        <div className="space-y-4 font-sans text-[11px] uppercase tracking-widest text-white/60">
                                            <div className="flex justify-between"><span>Check-in:</span> <span className="text-white">{checkIn || '-'}</span></div>
                                            <div className="flex justify-between"><span>Check-out:</span> <span className="text-white">{checkOut || '-'}</span></div>
                                            <div className="flex justify-between"><span>Hóspedes:</span> <span className="text-white">{hospedes} Pax</span></div>
                                        </div>
                                        <div className="mt-10 pt-6 border-t border-white/10">
                                            <div className="flex justify-between items-baseline mb-8">
                                                <span className="text-xs tracking-widest uppercase">Total Estimado</span>
                                                <span className="text-4xl font-serif text-carapita-gold">€{totalEstadia().toFixed(2).replace('.', ',')}</span>
                                            </div>
                                            <p className="text-[9px] text-white/30 italic uppercase">Taxas incluídas. O valor final será confirmado após aprovação.</p>
                                        </div>
                                    </div>

                                    {selectedExtras.length > 0 && (
                                        <div className="border border-carapita-gold/20 p-8 bg-white/5">
                                            <h4 className="text-[10px] uppercase tracking-mega font-bold text-white mb-4">Extras Selecionados</h4>
                                            <ul className="space-y-3 text-[10px] text-white/60 font-medium uppercase tracking-widest">
                                                {selectedExtras.map(id => {
                                                    const e = disponiveisExtras.find(ext => ext.id === id);
                                                    return (
                                                        <li key={id} className="flex justify-between border-b border-carapita-gold/10 pb-2">
                                                            <span>{e?.nome}</span>
                                                            <span>€{Number(e?.preco).toFixed(2)}</span>
                                                        </li>
                                                    );
                                                })}
                                            </ul>
                                        </div>
                                    )}

                                    <div className="border border-white/10 p-8 shadow-sm bg-white/5">
                                        <h4 className="text-[10px] uppercase tracking-mega font-bold text-white mb-4">Porquê reservar connosco?</h4>
                                        <ul className="space-y-4 text-[10px] text-white/40 font-sans uppercase tracking-widest leading-relaxed">
                                            <li className="flex gap-2">✓ Melhores preços garantidos</li>
                                            <li className="flex gap-2">✓ Check-in flexível</li>
                                            <li className="flex gap-2">✓ Apoio local 24/7</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

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
                                ><ChevronLeft size={24} /></button>
                                <button
                                    className="absolute right-6 bg-black/50 hover:bg-carapita-gold text-white p-4 rounded-full transition-all duration-300 flex items-center justify-center backdrop-blur-sm z-[1100]"
                                    onClick={e => { e.stopPropagation(); setLightboxIdx(i => (i + 1) % lightboxFotos.length); }}
                                ><ChevronRight size={24} /></button>

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
