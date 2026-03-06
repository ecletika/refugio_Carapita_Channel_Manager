"use client";
import React, { useState } from 'react';
import { Instagram, MapPin, Search, Calendar, Users, ChevronLeft, ChevronRight, CheckCircle, Camera, Star, Clock, Trophy, Coffee, ArrowRight, Menu, X, Instagram as InstagramIcon, Facebook as FacebookIcon, Facebook } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useRouter } from 'next/navigation';
import SeletorCalendario from '../components/SeletorCalendario';
import { useEffect } from 'react';

// Helper: parse fotos field (can be JSON array or plain URL)
import { dictionaries as dict } from '../i18n/dictionaries';
import { countries } from '../i18n/countries';

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
// Translation Dict was moved to i18n/dictionaries.ts;

interface BookingForm {
    prefixo: string;
    nome: string;
    sobrenome: string;
    email: string;
    telefone: string;
    pais: string;
    endereco1: string;
    endereco2: string;
    cidade: string;
    cep: string;
    criarConta: boolean;
    senha: string;
    confirmarSenha: string;
    requerimentosEspeciais: string;
    aceitouTermos: boolean;
    estrangeiro: boolean;
    data_nascimento: string;
    local_nascimento: string;
    nacionalidade: string;
    tipo_documento: string;
    numero_documento: string;
    pais_emissor_documento: string;
    metodoPagamento: string;
    dependentes: { nome: string; sobrenome: string }[];
}

const RoomImageGallery = ({ fotos, quartoNome, onClick }: { fotos: FotoObj[], quartoNome: string, onClick: () => void }) => {
    const [idx, setIdx] = useState(0);

    const prevImg = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIdx((prev) => (prev === 0 ? fotos.length - 1 : prev - 1));
    };

    const nextImg = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIdx((prev) => (prev === fotos.length - 1 ? 0 : prev + 1));
    };

    const currentImg = fotos.length > 0 ? fotos[idx].url : 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800&auto=format&fit=crop';

    return (
        <div className="w-full h-full min-h-[280px] xl:h-full relative overflow-hidden cursor-pointer group/slider" onClick={onClick}>
            <img src={currentImg} alt={quartoNome} className="w-full h-full object-cover group-hover/slider:scale-105 transition-transform duration-1000" />
            <div className="absolute inset-0 bg-black/0 group-hover/slider:bg-black/20 transition-colors duration-500 flex items-center justify-center">
                <Camera className="text-white opacity-0 group-hover/slider:opacity-100 transition-opacity duration-500 drop-shadow-lg" size={32} strokeWidth={1.5} />
            </div>

            {fotos.length > 1 && (
                <>
                    <button
                        onClick={prevImg}
                        className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 text-white flex items-center justify-center opacity-0 group-hover/slider:opacity-100 hover:bg-carapita-gold transition-all duration-300"
                    >
                        <ChevronLeft size={16} />
                    </button>
                    <button
                        onClick={nextImg}
                        className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 text-white flex items-center justify-center opacity-0 group-hover/slider:opacity-100 hover:bg-carapita-gold transition-all duration-300"
                    >
                        <ChevronRight size={16} />
                    </button>

                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1 z-10">
                        {fotos.map((_, i) => (
                            <div key={i} className={`h-1.5 rounded-full transition-all duration-300 ${i === idx ? 'w-4 bg-carapita-gold' : 'w-1.5 bg-white/50'}`} />
                        ))}
                    </div>
                </>
            )}
        </div>
    );
};

export default function Home() {
    const [checkIn, setCheckIn] = useState('');
    const [checkOut, setCheckOut] = useState('');
    const [adultos, setAdultos] = useState(2);
    const [criancas, setCriancas] = useState(0);
    const hospedes = adultos + criancas;
    const [showGuestSelector, setShowGuestSelector] = useState(false);
    const [cupomCodigo, setCupomCodigo] = useState('');
    const [cupomAplicado, setCupomAplicado] = useState<any>(null);
    const [cupomMensagem, setCupomMensagem] = useState({ text: '', type: '' });
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
    const [bookingStep, setBookingStep] = useState<'selection' | 'extras' | 'details' | 'success'>('selection');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [extrasTelaAtiva, setExtrasTelaAtiva] = useState(false);
    const [disponiveisExtras, setDisponiveisExtras] = useState<any[]>([]);
    const [selectedExtras, setSelectedExtras] = useState<string[]>([]);
    const [bookingForm, setBookingForm] = useState<BookingForm>({
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
        aceitouTermos: false,
        estrangeiro: false,
        data_nascimento: '',
        local_nascimento: '',
        nacionalidade: '',
        tipo_documento: 'Passaporte',
        numero_documento: '',
        pais_emissor_documento: '',
        metodoPagamento: 'CARTAO',
        dependentes: []
    });
    const [calendarioPrecos, setCalendarioPrecos] = useState<any[]>([]);
    const [galleryRooms, setGalleryRooms] = useState<any[]>([]);
    const [activeGalleryRoom, setActiveGalleryRoom] = useState<string>('');
    const [showGuestLoginModal, setShowGuestLoginModal] = useState(false);
    const [isGuestLoggedIn, setIsGuestLoggedIn] = useState(false);
    const [lightboxFotos, setLightboxFotos] = useState<string[]>([]);
    const [lightboxIdx, setLightboxIdx] = useState(0);
    const [siteConfigs, setSiteConfigs] = useState<any>({});
    const [lang, setLangState] = useState<'PT' | 'EN'>('PT');
    const [visibleAdditionalGuests, setVisibleAdditionalGuests] = useState(1);

    // Using a wrapper around setLang to persist preference
    const setLang = (newLang: 'PT' | 'EN') => {
        setLangState(newLang);
        if (typeof window !== 'undefined') {
            localStorage.setItem('preferencia_idioma', newLang);
        }
    };
    const t = (key: string) => dict[lang][key as keyof typeof dict['PT']] || key;

    const router = useRouter();


    useEffect(() => {
        if (typeof window !== 'undefined') {
            const savedLang = localStorage.getItem('preferencia_idioma') as 'PT' | 'EN';
            if (savedLang && (savedLang === 'PT' || savedLang === 'EN')) {
                setLangState(savedLang);
            }
        }
    }, []);


    useEffect(() => {
        const fetchExtras = async () => {
            try {
                const resp = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/extras?t=${Date.now()}`, {
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
                const resp = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/site/configuracoes?t=${Date.now()}`, { cache: 'no-store' });
                const json = await resp.json();
                if (json.status === 'success' && json.data) {
                    setSiteConfigs(json.data);
                    setExtrasTelaAtiva(!!json.data.tela_extras_ativa);
                }
            } catch (e) { }
        };

        const fetchPasseiosData = async () => {
            try {
                const resp = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/site/passeios?t=${Date.now()}`, {
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
                const resp = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/quartos?ativo=true`, { cache: 'no-store' });
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
                setBookingForm(prev => ({
                    ...prev,
                    nome: data.hospede.nome || prev.nome,
                    email: data.hospede.email || prev.email,
                    sobrenome: data.hospede.sobrenome || prev.sobrenome,
                    telefone: data.hospede.telefone || prev.telefone,
                    cidade: data.hospede.cidade || prev.cidade,
                    pais: data.hospede.pais || prev.pais,
                    endereco1: data.hospede.endereco1 || prev.endereco1,
                    endereco2: data.hospede.endereco2 || prev.endereco2,
                    cep: data.hospede.cep || prev.cep,
                    prefixo: data.hospede.prefixo || prev.prefixo,
                    data_nascimento: data.hospede.data_nascimento || prev.data_nascimento,
                    local_nascimento: data.hospede.local_nascimento || prev.local_nascimento,
                    nacionalidade: data.hospede.nacionalidade || prev.nacionalidade,
                    tipo_documento: data.hospede.tipo_documento || prev.tipo_documento,
                    numero_documento: data.hospede.numero_documento || prev.numero_documento,
                    pais_emissor_documento: data.hospede.pais_emissor_documento || prev.pais_emissor_documento,
                    estrangeiro: data.hospede.estrangeiro !== undefined ? data.hospede.estrangeiro : prev.estrangeiro,
                    dependentes: data.hospede.dependentes || prev.dependentes,
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

        let total = subtotal + extras;

        if (cupomAplicado) {
            if (cupomAplicado.tipo_desconto === 'PERCENTUAL') {
                total -= (total * Number(cupomAplicado.valor_desconto) / 100);
            } else {
                total -= Number(cupomAplicado.valor_desconto);
            }
        }

        return Math.max(0, total);
    };

    const valorDesconto = () => {
        if (!cupomAplicado || !checkIn || !checkOut || !idQuartoParaReserva) return 0;
        let subtotal = 0;
        const start = new Date(`${checkIn}T00:00:00.000Z`);
        const end = new Date(`${checkOut}T00:00:00.000Z`);
        const q = quartosEncontrados?.find(r => r.id === idQuartoParaReserva);
        if (!q) return 0;
        let current = new Date(start);
        while (current < end) {
            const dateStr = current.toISOString().split('T')[0];
            const diaPrice = calendarioPrecos.find(p => p.data === dateStr);
            if (diaPrice) subtotal += Number(diaPrice.preco);
            else subtotal += Number(q.preco_base);
            current.setUTCDate(current.getUTCDate() + 1);
        }
        const extras = selectedExtras.reduce((acc, id) => {
            const extra = disponiveisExtras.find(e => e.id === id);
            return acc + (extra ? Number(extra.preco) : 0);
        }, 0);

        let totalBase = subtotal + extras;
        if (cupomAplicado.tipo_desconto === 'PERCENTUAL') {
            return totalBase * (Number(cupomAplicado.valor_desconto) / 100);
        } else {
            return Number(cupomAplicado.valor_desconto);
        }
    };

    const iniciarReserva = (quartoId: string) => {
        if (!checkIn || !checkOut) {
            alert("Por favor, escolha as datas da sua estadia no calendário antes de prosseguir com a reserva.");
            return;
        }
        setIdQuartoParaReserva(quartoId);
        fetchCalendario(quartoId);
        // Só vai para Extras se a tela estiver activa E houver extras disponíveis
        if (extrasTelaAtiva && disponiveisExtras.length > 0) {
            setBookingStep('extras');
        } else {
            setBookingStep('details');
        }
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleConfirmarReserva = async () => {
        if (!bookingForm.aceitouTermos) {
            alert('Por favor, aceite os termos e condições para continuar.');
            return;
        }
        if (bookingForm.criarConta && bookingForm.senha !== bookingForm.confirmarSenha) {
            alert("As senhas não coincidem!");
            return;
        }
        if (!bookingForm.nome || !bookingForm.email) {
            alert('Por favor preencha o nome e o email.');
            return;
        }

        setIsSubmitting(true);
        try {
            const body = {
                quartoId: idQuartoParaReserva,
                checkIn,
                checkOut,
                canalNome: 'SITE',
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
                    estrangeiro: bookingForm.estrangeiro,
                    data_nascimento: bookingForm.data_nascimento,
                    local_nascimento: bookingForm.local_nascimento,
                    nacionalidade: bookingForm.nacionalidade,
                    tipo_documento: bookingForm.tipo_documento,
                    numero_documento: bookingForm.numero_documento,
                    pais_emissor_documento: bookingForm.pais_emissor_documento,
                    senha: bookingForm.criarConta ? bookingForm.senha : undefined,
                    dependentes: bookingForm.dependentes
                },
                extrasIds: selectedExtras,
                requerimentosEspeciais: bookingForm.requerimentosEspeciais,
                metodoPagamento: 'PENDENTE',
                cupomCodigo: cupomCodigo || undefined
            };

            const resp = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/reservas`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });

            const data = await resp.json();
            if (data.status === 'success') {
                setBookingStep('success');
            } else {
                alert("Erro ao processar reserva: " + (data.error || 'Erro desconhecido'));
            }
        } catch (e) {
            console.error(e);
            alert("Erro de conexão com o servidor.");
        } finally {
            setIsSubmitting(false);
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

    const validarCupom = async () => {
        if (!cupomCodigo) return;
        setCupomMensagem({ text: 'A verificar...', type: 'info' });
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/cupons/validar/${cupomCodigo}`);
            const data = await res.json();
            if (data.status === 'success') {
                setCupomAplicado(data.data);
                setCupomMensagem({ text: 'Cupão aplicado!', type: 'success' });
            } else {
                setCupomAplicado(null);
                setCupomMensagem({ text: data.error || 'Cupão inválido', type: 'error' });
            }
        } catch (e) {
            setCupomMensagem({ text: 'Erro ao validar', type: 'error' });
        }
    };

    const buscarDisponibilidade = async () => {
        setLoading(true);
        try {
            const resp = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/reservas/disponibilidade?checkIn=${checkIn}&checkOut=${checkOut}&capacidade=${hospedes}`);
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
            const resp = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/tarifas/calendario?quartoId=${quartoId}&inicio=${hoje.toISOString()}&fim=${fim.toISOString()}&t=${Date.now()}`, {
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
                fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/quartos?ativo=true`)
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
            const resp = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/reservas`, {
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

            <Header
                lang={lang}
                setLang={setLang}
                mounted={mounted}
                isLoggedIn={isLoggedIn}
                onReservar={() => setShowBookingScreen(true)}
                scrolled={scrolled}
            />

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
                        {t('hero_subtitle')}
                    </p>
                    <h2 className="text-5xl md:text-7xl lg:text-8xl text-white mb-8 font-serif font-light leading-tight drop-shadow-lg">
                        {t('hero_title')} <br /><i className="font-serif text-carapita-goldLight">{t('hero_title_exclusividade')}</i>
                    </h2>
                </div>

                {/* Scroll Indicator */}
                <div className="absolute bottom-12 left-1/2 -translate-x-1/2 text-white flex flex-col items-center gap-4 opacity-80 cursor-pointer hover:text-carapita-gold hover:opacity-100 transition-colors" onClick={() => setShowBookingScreen(true)}>
                    <div className="w-[1px] h-20 bg-gradient-to-b from-white to-transparent"></div>
                    <span className="text-[10px] tracking-mega uppercase font-bold">{t('hero_ver_dispo')}</span>
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
                        <span className="text-carapita-gold uppercase tracking-widest text-[9px] md:text-[10px] font-medium block mb-4 lg:mb-6"> {t('essencia_tag')} </span>
                        <h3 className="text-3xl md:text-6xl lg:text-7xl font-serif text-carapita-goldLight leading-tight font-light uppercase tracking-widest">
                            {t('essencia_title')}
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
                                    src="/casa-exterior.jpg"
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
                                {t('essencia_p1')}
                                <br /><br />
                                {t('essencia_p2')}
                            </p>

                            {/* Botão Oval Elegante */}
                            <button onClick={() => scrollTo('alojamento')} className="flex items-center justify-center w-full md:w-48 h-12 border border-carapita-gold/60 rounded-[30px] text-[9px] uppercase tracking-[0.2em] text-carapita-gold hover:bg-carapita-gold hover:text-white transition-all duration-700 mx-auto md:mx-0">
                                {t('essencia_btn')}
                            </button>
                        </div>
                    </div>

                </div>
            </section>

            {/* Galeria de Alojamento c/ Abas (Fotos Reais do Airbnb) */}
            <section id="alojamento" className="pb-20 lg:pb-32 px-4 md:px-8 max-w-[1400px] mx-auto w-full">
                <div className="text-center mb-12 lg:mb-16">
                    <span className="text-carapita-gold uppercase tracking-mega text-[10px] font-semibold block mb-4">{t('alojamento_tag')}</span>
                    <h3 className="text-3xl md:text-5xl font-serif text-white font-light mb-8 lg:mb-12">{t('alojamento_title')}</h3>

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
                    <span className="text-carapita-gold uppercase tracking-mega text-[10px] font-semibold block mb-4">{t('passeios_tag')}</span>
                    <h3 className="text-4xl md:text-5xl font-serif text-white font-light max-w-2xl mx-auto leading-tight">
                        {t('passeios_title')} <i className="font-serif text-carapita-gold">{t('passeios_title_refugio')}</i>
                    </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {passeios.slice(0, 4).map((passeio, idx) => (
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

                <div className="mt-16 text-center">
                    <button
                        onClick={() => router.push('/passeios')}
                        className="px-10 py-4 bg-transparent border border-carapita-gold text-carapita-gold text-[10px] uppercase tracking-mega font-bold rounded-full hover:bg-carapita-gold hover:text-white transition-all duration-500"
                    >
                        Ver Todos os Passeios e Roteiros
                    </button>
                </div>
            </section>

            {/* Footer Padrão Relais & Châteaux */}
            <Footer lang={lang} siteConfigs={siteConfigs} />
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
                                <span className="text-[10px] uppercase tracking-widest font-semibold text-white">{passeioSelecionado.dist} {t('passeios_da_casa')}</span>
                            </div>
                        </div>

                        {/* Conteúdo Lado Direito Modal */}
                        <div className="w-full md:w-1/2 p-10 md:p-14 flex flex-col justify-center bg-carapita-green text-left">
                            <span className="text-carapita-gold uppercase tracking-widest text-[10px] font-medium block mb-4 border-b border-carapita-gold/30 pb-4 inline-block w-max">{t('passeios_descobrir')}</span>
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
                                {t('passeios_btn_mapa')}
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

                    <div className="max-w-[1600px] mx-auto py-12 px-4 md:px-8">
                        <div className="flex flex-col xl:flex-row gap-8 xl:gap-10 items-start">
                            {/* Coluna do Calendário e Filtros */}
                            <div className="w-full xl:w-auto xl:flex-shrink-0">
                                {bookingStep === 'selection' && (
                                    <div className="flex flex-col xl:flex-row gap-8">
                                        {/* Left Side: Calendar + Guests + Cupons */}
                                        <div className="w-full xl:w-[420px] xl:flex-shrink-0 space-y-5">
                                            <div className="bg-white/5 border border-white/10 p-6 rounded-3xl backdrop-blur-sm">
                                                <h4 className="font-serif text-xl mb-6 text-white text-center border-b border-white/10 pb-4">
                                                    {t('booking_selecione_datas')}
                                                </h4>
                                                <SeletorCalendario
                                                    quartoId={quartosEncontrados?.[0]?.id || ''}
                                                    onSelect={(start, end) => {
                                                        setCheckIn(start);
                                                        setCheckOut(end);
                                                    }}
                                                />
                                            </div>

                                            <div className="bg-white/5 border border-white/10 p-6 rounded-3xl backdrop-blur-sm">
                                                <h4 className="font-serif text-lg mb-6 text-white uppercase tracking-widest text-center border-b border-white/10 pb-4">{t('booking_num_hospedes')}</h4>

                                                <div className="space-y-4">
                                                    <div className="flex justify-between items-center border-b border-white/10 pb-4">
                                                        <div>
                                                            <div className="text-white text-sm font-semibold">Adultos (18+)</div>
                                                        </div>
                                                        <div className="flex items-center gap-4">
                                                            <button
                                                                onClick={() => setAdultos(Math.max(1, adultos - 1))}
                                                                className="w-8 h-8 rounded-full border border-white/30 flex items-center justify-center text-white hover:border-carapita-gold hover:text-carapita-gold transition-colors disabled:opacity-30"
                                                                disabled={adultos <= 1}
                                                            >−</button>
                                                            <span className="text-white font-serif text-lg w-4 text-center">{adultos}</span>
                                                            <button
                                                                onClick={() => setAdultos(Math.min(10, adultos + 1))}
                                                                className="w-8 h-8 rounded-full border border-white/30 flex items-center justify-center text-white hover:border-carapita-gold hover:text-carapita-gold transition-colors"
                                                            >+</button>
                                                        </div>
                                                    </div>

                                                    <div className="flex justify-between items-center pt-2">
                                                        <div>
                                                            <div className="text-white text-sm font-semibold">Crianças (5-17)</div>
                                                        </div>
                                                        <div className="flex items-center gap-4">
                                                            <button
                                                                onClick={() => setCriancas(Math.max(0, criancas - 1))}
                                                                className="w-8 h-8 rounded-full border border-white/30 flex items-center justify-center text-white hover:border-carapita-gold hover:text-carapita-gold transition-colors disabled:opacity-30"
                                                                disabled={criancas <= 0}
                                                            >−</button>
                                                            <span className="text-white font-serif text-lg w-4 text-center">{criancas}</span>
                                                            <button
                                                                onClick={() => setCriancas(Math.min(10, criancas + 1))}
                                                                className="w-8 h-8 rounded-full border border-white/30 flex items-center justify-center text-white hover:border-carapita-gold hover:text-carapita-gold transition-colors"
                                                            >+</button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="bg-white/5 border border-white/10 p-6 rounded-3xl backdrop-blur-sm">
                                                <h4 className="font-serif text-lg mb-6 text-white uppercase tracking-widest text-center border-b border-white/10 pb-4">Cupão Promocional</h4>
                                                <div className="flex flex-col gap-2">
                                                    <div className="flex gap-2">
                                                        <input
                                                            type="text"
                                                            placeholder="Ex: CARAPITA10"
                                                            value={cupomCodigo}
                                                            onChange={e => {
                                                                setCupomCodigo(e.target.value.toUpperCase());
                                                                if (cupomAplicado) {
                                                                    setCupomAplicado(null);
                                                                    setCupomMensagem({ text: '', type: '' });
                                                                }
                                                            }}
                                                            className="flex-1 bg-transparent border border-white/20 px-4 py-3 text-white focus:border-carapita-gold outline-none text-sm uppercase rounded-lg text-center tracking-widest"
                                                        />
                                                        <button
                                                            onClick={validarCupom}
                                                            className="bg-carapita-gold text-carapita-dark px-4 py-3 rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-white transition-colors"
                                                        >
                                                            Aplicar
                                                        </button>
                                                    </div>
                                                    {cupomMensagem.text && (
                                                        <p className={`text-[10px] text-center uppercase tracking-widest font-bold mt-2 ${cupomMensagem.type === 'error' ? 'text-red-400' : cupomMensagem.type === 'success' ? 'text-green-400' : 'text-carapita-gold'}`}>
                                                            {cupomMensagem.text}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Right Side: Rooms */}
                                        <div className="flex-1 min-w-0">
                                            <h2 className="font-serif text-2xl lg:text-3xl mb-8 text-white border-b border-white/10 pb-4 uppercase tracking-widest">{t('booking_alojamentos_disp')}</h2>
                                            <div className="space-y-8">
                                                {(quartosEncontrados || []).length > 0 ? (
                                                    quartosEncontrados?.map((q) => {
                                                        const fotos = parseFotos(q.fotos);
                                                        const mainFoto = fotos.find(f => f.isMain)?.url || fotos[0]?.url || 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800&auto=format&fit=crop';
                                                        let comodidades: string[] = [];
                                                        try { comodidades = JSON.parse(q.comodidades || '[]'); } catch { }
                                                        const topBullets = comodidades.filter(c => c.toLowerCase().includes('cama') || c.toLowerCase().includes('m²') || c.toLowerCase().includes('vista')).slice(0, 4);

                                                        return (
                                                            <div key={q.id} className="bg-[#1C2621] border border-white/10 rounded-[2.5rem] hover:border-carapita-gold/50 shadow-2xl transition-all duration-700 flex flex-col md:flex-row overflow-hidden group min-h-[350px]">
                                                                {/* Foto Hero com setas em vez de Thumbnails */}
                                                                <div className="w-full md:w-[35%] lg:w-[30%] xl:w-[32%] shrink-0 relative flex flex-col overflow-hidden">
                                                                    {(() => {
                                                                        // Usando um pequeno hack ou criando subcomponente inline? Melhor criar um component. 
                                                                        // Mas como não podemos exportar facilmente e usar hook no meio do map:
                                                                        // Em React não podemos chamar useState dentro de map. Então vamos usar um wrapper component.
                                                                        return <RoomImageGallery fotos={fotos} quartoNome={q.nome} onClick={() => { setLightboxFotos(fotos.map(f => f.url)); setLightboxIdx(0); }} />;
                                                                    })()}
                                                                </div>

                                                                {/* Detalhes do Quarto */}
                                                                <div className="p-8 flex-1 flex flex-col justify-between">
                                                                    <div className="mb-6 xl:mb-0">
                                                                        <div className="flex justify-between items-start mb-4 border-b border-white/5 pb-4">
                                                                            <div>
                                                                                <h3 className="font-serif text-2xl lg:text-3xl text-white group-hover:text-carapita-gold transition-colors">{q.nome}</h3>
                                                                                <p className="text-[10px] uppercase tracking-widest text-carapita-gold font-bold mt-2">{q.tipo}</p>
                                                                            </div>
                                                                            <div className="text-right">
                                                                                <div className="flex items-baseline gap-1 justify-end">
                                                                                    <span className="text-lg font-serif text-carapita-gold opacity-80">€</span>
                                                                                    <span className="text-4xl font-serif text-white">{Number(q.preco_base).toFixed(0)}</span>
                                                                                </div>
                                                                                <p className="text-[9px] text-white/40 uppercase tracking-wide mt-1">{lang === 'PT' ? 'Preço total aproximado' : 'Approx. Total Price'}</p>
                                                                            </div>
                                                                        </div>

                                                                        <p className="text-sm text-white/60 mb-6 leading-relaxed font-light line-clamp-3">{q.descricao}</p>

                                                                        {topBullets.length > 0 && (
                                                                            <ul className="flex flex-wrap gap-x-6 gap-y-3 mb-6">
                                                                                {topBullets.map((c, i) => (
                                                                                    <li key={i} className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-white/70 font-bold">
                                                                                        <div className="w-1 h-1 bg-carapita-gold rounded-full"></div> {c}
                                                                                    </li>
                                                                                ))}
                                                                            </ul>
                                                                        )}
                                                                    </div>

                                                                    {/* Call to Action */}
                                                                    <div className="flex flex-col-reverse sm:flex-row justify-between items-center bg-[#151D18] border border-white/5 rounded-2xl p-4 mt-auto">
                                                                        {q.video_url ? (
                                                                            <a href={q.video_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-carapita-gold hover:text-white transition-colors py-2 px-4">
                                                                                <PlayCircle size={24} />
                                                                                <span className="text-[10px] font-bold uppercase tracking-widest">Ver Vídeo</span>
                                                                            </a>
                                                                        ) : <div />}

                                                                        <button onClick={() => iniciarReserva(q.id)} className="w-full sm:w-auto bg-carapita-gold text-carapita-dark px-10 py-4 rounded-xl text-[11px] uppercase tracking-mega font-bold hover:bg-white transition-all duration-500 shadow-xl group/btn flex items-center justify-center gap-3">
                                                                            Selecionar <ChevronRight size={14} className="group-hover/btn:translate-x-1 transition-transform" />
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        );
                                                    })
                                                ) : (
                                                    <div className="py-24 text-center border border-dashed border-white/20 rounded-[2rem] bg-white/5">
                                                        <Search size={48} className="mx-auto text-white/20 mb-4" />
                                                        <p className="text-lg text-white font-serif tracking-wide mb-2">Nenhum alojamento disponível</p>
                                                        <p className="text-sm text-white/40">Por favor, ajuste as datas da sua estadia.</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {bookingStep === 'extras' && (
                                    <div className="animate-fade-in max-w-4xl mx-auto">
                                        <div className="text-center mb-16">
                                            <span className="text-carapita-gold text-[10px] uppercase tracking-mega font-bold block mb-4">{t('booking_step_personalize')}</span>
                                            <h2 className="font-serif text-4xl text-white uppercase tracking-widest leading-tight">{t('booking_title_extras')}</h2>
                                            <p className="text-white/40 mt-4 text-[10px] uppercase tracking-widest font-medium">{lang === 'PT' ? 'Selecione os mimos e serviços exclusivos para o seu refúgio' : 'Select the exclusive treats and services for your retreat'}</p>
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
                                                <ChevronLeft size={14} className="group-hover:-translate-x-1 transition-transform" /> {t('form_voltar')}
                                            </button>
                                            <button onClick={() => setBookingStep('details')} className="bg-carapita-dark text-white px-12 py-5 text-[11px] uppercase tracking-mega font-bold hover:bg-carapita-gold shadow-xl transform hover:-translate-y-1 transition-all">
                                                {t('form_prosseguir')}
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {bookingStep === 'details' && (
                                    <div className="animate-fade-in font-sans">
                                        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                                            <h2 className="font-serif text-3xl text-white uppercase tracking-widest">{t('booking_title_details')}</h2>
                                            {!isGuestLoggedIn && (
                                                <button
                                                    onClick={() => setShowGuestLoginModal(true)}
                                                    className="text-[10px] uppercase tracking-widest font-bold border border-carapita-gold text-carapita-gold px-6 py-2 hover:bg-carapita-gold hover:text-white transition-all shadow-sm"
                                                >
                                                    {lang === 'PT' ? 'Já tem conta? Inicie sessão' : 'Already have an account? Log in'}
                                                </button>
                                            )}
                                        </div>

                                        <div className="space-y-10">
                                            <section className="bg-carapita-gold/10 p-8 border border-carapita-gold/30">
                                                <div className="flex items-center gap-3 mb-4">
                                                    <input type="checkbox" id="estrangeiro" checked={bookingForm.estrangeiro} onChange={e => setBookingForm({ ...bookingForm, estrangeiro: e.target.checked })} className="w-5 h-5 accent-carapita-gold" />
                                                    <label htmlFor="estrangeiro" className="text-[11px] font-bold uppercase tracking-widest text-carapita-gold cursor-pointer">{t('form_estrangeiro')}</label>
                                                </div>

                                                {bookingForm.estrangeiro && (
                                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-6 animate-slide-down mt-8 pt-8 border-t border-carapita-gold/20">
                                                        <div className="col-span-2 md:col-span-1">
                                                            <label className="text-[10px] uppercase text-white/40 block mb-2">{t('form_nascimento')}</label>
                                                            <input type="date" value={bookingForm.data_nascimento} onChange={e => setBookingForm({ ...bookingForm, data_nascimento: e.target.value })} className="w-full border-b border-carapita-gold/30 bg-transparent py-2 text-sm focus:border-carapita-gold outline-none text-white" />
                                                        </div>
                                                        <div className="col-span-2 md:col-span-1">
                                                            <label className="text-[10px] uppercase text-white/40 block mb-2">{t('form_local_nascimento')}</label>
                                                            <input type="text" value={bookingForm.local_nascimento} onChange={e => setBookingForm({ ...bookingForm, local_nascimento: e.target.value })} className="w-full border-b border-carapita-gold/30 bg-transparent py-2 text-sm focus:border-carapita-gold outline-none text-white" placeholder="City / Country" />
                                                        </div>
                                                        <div className="col-span-2 md:col-span-1">
                                                            <label className="text-[10px] uppercase text-white/40 block mb-2">{t('form_nacionalidade')}</label>
                                                            <input type="text" value={bookingForm.nacionalidade} onChange={e => setBookingForm({ ...bookingForm, nacionalidade: e.target.value })} className="w-full border-b border-carapita-gold/30 bg-transparent py-2 text-sm focus:border-carapita-gold outline-none text-white" />
                                                        </div>
                                                        <div className="col-span-2 md:col-span-1">
                                                            <label className="text-[10px] uppercase text-white/40 block mb-2">{t('form_tipo_documento')}</label>
                                                            <select value={bookingForm.tipo_documento} onChange={e => setBookingForm({ ...bookingForm, tipo_documento: e.target.value })} className="w-full border-b border-carapita-gold/30 bg-transparent py-2 text-sm focus:border-carapita-gold outline-none text-white appearance-none">
                                                                <option value="Passaporte" className="bg-carapita-green">Passaporte / Passport</option>
                                                                <option value="Cartao de Identidade" className="bg-carapita-green">Cartão de Identidade / ID Card</option>
                                                                <option value="Titulo de Residencia" className="bg-carapita-green">Título de Residência / Residence Permit</option>
                                                            </select>
                                                        </div>
                                                        <div className="col-span-2 md:col-span-1">
                                                            <label className="text-[10px] uppercase text-white/40 block mb-2">{t('form_num_documento')}</label>
                                                            <input type="text" value={bookingForm.numero_documento} onChange={e => setBookingForm({ ...bookingForm, numero_documento: e.target.value })} className="w-full border-b border-carapita-gold/30 bg-transparent py-2 text-sm focus:border-carapita-gold outline-none text-white" />
                                                        </div>
                                                        <div className="col-span-2 md:col-span-1">
                                                            <label className="text-[10px] uppercase text-white/40 block mb-2">{t('form_pais_emissor')}</label>
                                                            <input type="text" value={bookingForm.pais_emissor_documento} onChange={e => setBookingForm({ ...bookingForm, pais_emissor_documento: e.target.value })} className="w-full border-b border-carapita-gold/30 bg-transparent py-2 text-sm focus:border-carapita-gold outline-none text-white" />
                                                        </div>
                                                    </div>
                                                )}
                                            </section>

                                            <section>
                                                <h4 className="text-[10px] uppercase tracking-mega text-carapita-gold font-bold mb-6 border-b border-white/10 pb-2">{t('form_info_contato')}</h4>
                                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                                                    <div className="col-span-1">
                                                        <label className="text-[10px] uppercase text-white/40 block mb-2">Prefixo</label>
                                                        <select value={bookingForm.prefixo} onChange={e => setBookingForm({ ...bookingForm, prefixo: e.target.value })} className="w-full border-b border-white/20 bg-transparent py-3 text-sm focus:border-carapita-gold outline-none text-white">
                                                            {['Mr.', 'Mrs.', 'Ms.', 'Dr.', 'Pr.'].map(p => <option key={p} value={p} className="bg-carapita-green">{p}</option>)}
                                                        </select>
                                                    </div>
                                                    <div className="col-span-1 lg:col-span-1">
                                                        <label className="text-[10px] uppercase text-white/40 block mb-2">{t('form_primeiro_nome')}</label>
                                                        <input type="text" value={bookingForm.nome} onChange={e => setBookingForm({ ...bookingForm, nome: e.target.value })} className="w-full border-b border-white/20 bg-transparent py-3 text-sm focus:border-carapita-gold outline-none text-white" placeholder="João" />
                                                    </div>
                                                    <div className="col-span-2 lg:col-span-2">
                                                        <label className="text-[10px] uppercase text-white/40 block mb-2">{t('form_sobrenome')}</label>
                                                        <input type="text" value={bookingForm.sobrenome} onChange={e => setBookingForm({ ...bookingForm, sobrenome: e.target.value })} className="w-full border-b border-white/20 bg-transparent py-3 text-sm focus:border-carapita-gold outline-none text-white" placeholder="Silva" />
                                                    </div>
                                                    <div className="col-span-2 lg:col-span-2">
                                                        <label className="text-[10px] uppercase text-white/40 block mb-2">{t('form_telefone')}</label>
                                                        <input type="tel" value={bookingForm.telefone} onChange={e => setBookingForm({ ...bookingForm, telefone: e.target.value })} className="w-full border-b border-white/20 bg-transparent py-3 text-sm focus:border-carapita-gold outline-none text-white" placeholder="+351 000 000 000" />
                                                    </div>
                                                    <div className="col-span-2 lg:col-span-2">
                                                        <label className="text-[10px] uppercase text-white/40 block mb-2">{t('form_email')}</label>
                                                        <input type="email" value={bookingForm.email} onChange={e => setBookingForm({ ...bookingForm, email: e.target.value })} className="w-full border-b border-white/20 bg-transparent py-3 text-sm focus:border-carapita-gold outline-none text-white" placeholder="joao@exemplo.com" />
                                                    </div>
                                                </div>
                                            </section>

                                            {hospedes > 1 && (
                                                <section className="animate-fade-in">
                                                    <h4 className="text-[10px] uppercase tracking-mega text-carapita-gold font-bold mb-6 border-b border-white/10 pb-2">
                                                        {lang === 'PT' ? 'Hóspedes Adicionais' : 'Additional Guests'}
                                                    </h4>
                                                    <div className="space-y-6">
                                                        {Array.from({ length: hospedes - 1 }).slice(0, visibleAdditionalGuests).map((_, i) => (
                                                            <div key={i} className="bg-white/5 p-6 border border-white/5 rounded-xl hover:border-carapita-gold/30 transition-all duration-300">
                                                                <div className="flex items-center justify-between mb-4">
                                                                    <span className="text-[10px] uppercase font-bold text-carapita-gold tracking-widest flex items-center gap-2">
                                                                        <User size={12} /> {lang === 'PT' ? `Hóspede ${i + 2}` : `Guest ${i + 2}`}
                                                                    </span>
                                                                </div>
                                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                                    <div>
                                                                        <label className="text-[10px] uppercase text-white/40 block mb-2">{t('form_primeiro_nome')}</label>
                                                                        <input
                                                                            type="text"
                                                                            className="w-full border-b border-white/20 bg-transparent py-2 text-sm focus:border-carapita-gold outline-none text-white"
                                                                            placeholder="Nome"
                                                                            value={bookingForm.dependentes[i]?.nome || ''}
                                                                            onChange={(e) => {
                                                                                const newDeps = [...bookingForm.dependentes];
                                                                                if (!newDeps[i]) newDeps[i] = { nome: '', sobrenome: '' };
                                                                                newDeps[i].nome = e.target.value;
                                                                                setBookingForm({ ...bookingForm, dependentes: newDeps });
                                                                            }}
                                                                        />
                                                                    </div>
                                                                    <div>
                                                                        <label className="text-[10px] uppercase text-white/40 block mb-2">{t('form_sobrenome')}</label>
                                                                        <input
                                                                            type="text"
                                                                            className="w-full border-b border-white/20 bg-transparent py-2 text-sm focus:border-carapita-gold outline-none text-white"
                                                                            placeholder="Apelido"
                                                                            value={bookingForm.dependentes[i]?.sobrenome || ''}
                                                                            onChange={(e) => {
                                                                                const newDeps = [...bookingForm.dependentes];
                                                                                if (!newDeps[i]) newDeps[i] = { nome: '', sobrenome: '' };
                                                                                newDeps[i].sobrenome = e.target.value;
                                                                                setBookingForm({ ...bookingForm, dependentes: newDeps });
                                                                            }}
                                                                        />
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ))}

                                                        {visibleAdditionalGuests < hospedes - 1 && (
                                                            <button
                                                                type="button"
                                                                onClick={() => setVisibleAdditionalGuests(prev => prev + 1)}
                                                                className="w-full py-4 border border-dashed border-white/20 text-white/40 hover:text-carapita-gold hover:border-carapita-gold transition-all flex items-center justify-center gap-2 text-[10px] uppercase tracking-mega font-bold group"
                                                            >
                                                                <Plus size={14} className="group-hover:rotate-90 transition-transform" />
                                                                {lang === 'PT' ? `+ Hóspede ${visibleAdditionalGuests + 2}` : `+ Guest ${visibleAdditionalGuests + 2}`}
                                                            </button>
                                                        )}
                                                    </div>
                                                </section>
                                            )}

                                            <section>
                                                <h4 className="text-[10px] uppercase tracking-mega text-carapita-gold font-bold mb-6 border-b border-white/10 pb-2">{t('form_faturacao')}</h4>
                                                <div className="grid grid-cols-2 gap-6 text-sm">
                                                    <div className="col-span-2 lg:col-span-1">
                                                        <label className="text-[10px] uppercase text-white/40 block mb-2">{t('form_pais')}</label>
                                                        <select value={bookingForm.pais} onChange={e => setBookingForm({ ...bookingForm, pais: e.target.value })} className="w-full border-b border-white/20 py-3 focus:border-carapita-gold outline-none bg-transparent appearance-none text-white scrollbar-thin scrollbar-thumb-carapita-gold">
                                                            <option value="" disabled className="bg-carapita-green">Select Country</option>
                                                            {countries.map(c => (
                                                                <option key={c} value={c} className="bg-carapita-green">{c}</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                    <div className="col-span-2 lg:col-span-1">
                                                        <label className="text-[10px] uppercase text-white/40 block mb-2">{t('form_cidade')}</label>
                                                        <input type="text" value={bookingForm.cidade} onChange={e => setBookingForm({ ...bookingForm, cidade: e.target.value })} className="w-full border-b border-white/20 bg-transparent py-3 focus:border-carapita-gold outline-none text-white" />
                                                    </div>
                                                    <div className="col-span-2">
                                                        <label className="text-[10px] uppercase text-white/40 block mb-2">{t('form_endereco')}</label>
                                                        <input type="text" value={bookingForm.endereco1} onChange={e => setBookingForm({ ...bookingForm, endereco1: e.target.value })} className="w-full border-b border-white/20 bg-transparent py-3 focus:border-carapita-gold outline-none text-white" />
                                                    </div>
                                                    <div className="col-span-2 lg:col-span-1">
                                                        <label className="text-[10px] uppercase text-white/40 block mb-2">{t('form_endereco_opcional')}</label>
                                                        <input type="text" value={bookingForm.endereco2} onChange={e => setBookingForm({ ...bookingForm, endereco2: e.target.value })} className="w-full border-b border-white/20 bg-transparent py-3 focus:border-carapita-gold outline-none text-white" />
                                                    </div>
                                                    <div className="col-span-2 lg:col-span-1">
                                                        <label className="text-[10px] uppercase text-white/40 block mb-2">{t('form_cep')}</label>
                                                        <input type="text" value={bookingForm.cep} onChange={e => setBookingForm({ ...bookingForm, cep: e.target.value })} className="w-full border-b border-white/20 bg-transparent py-3 focus:border-carapita-gold outline-none text-white" />
                                                    </div>
                                                </div>
                                            </section>

                                            <section className="bg-white/5 p-8 border border-white/10">
                                                <div className="flex items-center gap-3 mb-6">
                                                    <input type="checkbox" id="create" checked={bookingForm.criarConta} onChange={e => setBookingForm({ ...bookingForm, criarConta: e.target.checked })} className="w-4 h-4 accent-carapita-gold" />
                                                    <label htmlFor="create" className="text-xs font-bold uppercase tracking-widest text-white cursor-pointer">{t('form_criar_conta')}</label>
                                                </div>
                                                {bookingForm.criarConta && (
                                                    <div className="grid grid-cols-2 gap-6 animate-slide-down">
                                                        <div>
                                                            <label className="text-[10px] uppercase text-white/40 block mb-2">{t('form_senha')}</label>
                                                            <input type="password" value={bookingForm.senha} onChange={e => setBookingForm({ ...bookingForm, senha: e.target.value })} className="w-full border-b border-white/20 bg-transparent py-3 text-sm focus:border-carapita-gold outline-none text-white" />
                                                        </div>
                                                        <div>
                                                            <label className="text-[10px] uppercase text-white/40 block mb-2">{t('form_confirmar_senha')}</label>
                                                            <input type="password" value={bookingForm.confirmarSenha} onChange={e => setBookingForm({ ...bookingForm, confirmarSenha: e.target.value })} className="w-full border-b border-white/20 bg-transparent py-3 text-sm focus:border-carapita-gold outline-none text-white" />
                                                        </div>
                                                    </div>
                                                )}
                                            </section>

                                            <section>
                                                <h4 className="text-[10px] uppercase tracking-mega text-carapita-gold font-bold mb-4">{t('form_requerimentos')}</h4>
                                                <p className="text-[10px] text-white/40 mb-4 uppercase tracking-widest leading-relaxed">{t('form_requerimentos_desc')}</p>
                                                <textarea value={bookingForm.requerimentosEspeciais} onChange={e => setBookingForm({ ...bookingForm, requerimentosEspeciais: e.target.value })} className="w-full border border-white/10 bg-transparent p-4 text-sm h-32 focus:border-carapita-gold outline-none text-white" placeholder={t('form_requerimentos_placeholder')} />
                                            </section>
                                        </div>

                                        <div className="flex justify-between mt-12 pt-8 border-t border-white/10">
                                            <button onClick={() => setBookingStep(extrasTelaAtiva && disponiveisExtras.length > 0 ? 'extras' : 'selection')} className="text-[10px] uppercase tracking-widest text-white/40 hover:text-white flex items-center gap-2 group">
                                                <ChevronLeft size={14} className="group-hover:-translate-x-1 transition-transform" /> {t('form_voltar')}
                                            </button>
                                            <div className="flex flex-col items-end gap-4">
                                                <div className="flex items-center gap-3">
                                                    <input type="checkbox" id="terms" checked={bookingForm.aceitouTermos} onChange={e => setBookingForm({ ...bookingForm, aceitouTermos: e.target.checked })} className="w-4 h-4 accent-carapita-gold" />
                                                    <label htmlFor="terms" className="text-[10px] uppercase tracking-widest text-white/60 cursor-pointer">{t('form_aceito_termos')}</label>
                                                </div>
                                                <button
                                                    onClick={handleConfirmarReserva}
                                                    disabled={!bookingForm.aceitouTermos || !bookingForm.nome || !bookingForm.email || isSubmitting}
                                                    className={`px-12 py-5 text-[11px] uppercase tracking-mega font-bold transition-all flex items-center gap-3 ${bookingForm.aceitouTermos && bookingForm.nome && bookingForm.email && !isSubmitting
                                                        ? 'bg-carapita-gold text-white hover:bg-white hover:text-carapita-green shadow-xl'
                                                        : 'bg-white/10 text-white/20 cursor-not-allowed'
                                                        }`}
                                                >
                                                    <Check size={16} /> {isSubmitting ? 'A processar...' : 'Confirmar sua reserva'}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {bookingStep === 'success' && (
                                    <div className="animate-fade-in font-sans flex flex-col items-center justify-center text-center p-12 bg-white/5 border border-carapita-gold/30 mt-12 rounded-sm shadow-[0_20px_40px_rgba(212,175,55,0.05)]">
                                        <div className="w-20 h-20 rounded-full bg-carapita-gold/20 flex items-center justify-center mb-6">
                                            <Check size={40} className="text-carapita-gold" />
                                        </div>
                                        <h2 className="font-serif text-3xl md:text-4xl text-white mb-6 leading-tight">
                                            Obrigado pela sua Reserva
                                        </h2>
                                        <div className="space-y-4 text-[13px] text-white/70 max-w-xl mx-auto font-light leading-relaxed">
                                            <p>
                                                Tem <strong>48 Horas</strong> para pagar 50% de sua Reserva. Para saber mais acesse termos e condições em seu portal Carapita.
                                            </p>
                                            <p>
                                                Dentro do seu portal, tem tudo o que precisa: os dados do alojamento, Anfitrião, termos e condições, área de pagamentos e roteiros da região.
                                            </p>
                                        </div>

                                        <div className="mt-12 w-full max-w-sm flex flex-col gap-4">
                                            <a
                                                href="/perfil"
                                                className="w-full bg-carapita-gold hover:bg-white text-white hover:text-carapita-green uppercase text-[11px] tracking-mega font-bold py-5 transition-all duration-500 block shadow-xl"
                                                onClick={() => {
                                                    // Optional cleanups when they navigate to portal
                                                    setShowBookingScreen(false);
                                                    setBookingStep('selection');
                                                    setSelectedExtras([]);
                                                    setBookingForm(prev => ({ ...prev, aceitouTermos: false }));
                                                }}
                                            >
                                                Entrar no Portal Carapita
                                            </a>
                                            <button
                                                onClick={() => {
                                                    setShowBookingScreen(false);
                                                    setBookingStep('selection');
                                                    setSelectedExtras([]);
                                                    setBookingForm(prev => ({ ...prev, aceitouTermos: false }));
                                                }}
                                                className="w-full bg-transparent border border-white/20 hover:border-carapita-gold text-white/60 hover:text-carapita-gold uppercase text-[10px] tracking-widest font-bold py-4 transition-all"
                                            >
                                                Voltar à Página Inicial
                                            </button>
                                        </div>
                                    </div>
                                )}

                            </div>

                            {/* Sumário lateral / Carrinho */}
                            <div className="w-full xl:w-80 xl:flex-shrink-0 mt-8 xl:mt-0">
                                <div className="sticky top-10 space-y-8">
                                    <div className="bg-carapita-dark text-white p-10">
                                        <h3 className="font-serif text-xl border-b border-white/10 pb-4 mb-6 uppercase tracking-widest italic">{t('summary_title')}</h3>
                                        <div className="mb-10 pb-6 border-b border-white/10">
                                            <div className="flex justify-between items-baseline mb-2">
                                                <span className="text-xs tracking-widest uppercase text-white/40">{t('summary_total')}</span>
                                                <div className="text-right">
                                                    {cupomAplicado && (
                                                        <span className="block text-[11px] text-white/40 line-through mb-1 tracking-widest uppercase">
                                                            {(totalEstadia() + valorDesconto()).toFixed(2).replace('.', ',')}
                                                        </span>
                                                    )}
                                                    <span className="text-4xl font-serif text-carapita-gold">€{totalEstadia().toFixed(2).replace('.', ',')}</span>
                                                </div>
                                            </div>
                                            {cupomAplicado && (
                                                <div className="flex justify-between items-center mb-2 text-green-400 text-[10px] uppercase tracking-widest font-bold">
                                                    <span>Desconto Aplicado ({cupomAplicado.codigo}):</span>
                                                    <span>- €{valorDesconto().toFixed(2).replace('.', ',')}</span>
                                                </div>
                                            )}
                                            <p className="text-[9px] text-white/30 italic uppercase mt-2">{t('summary_taxas')}</p>
                                        </div>

                                        <div className="space-y-4 font-sans text-[11px] uppercase tracking-widest text-white/60">
                                            <div className="flex justify-between"><span>{t('summary_checkin')}:</span> <span className="text-white">{checkIn || '-'}</span></div>
                                            <div className="flex justify-between"><span>{t('summary_checkout')}:</span> <span className="text-white">{checkOut || '-'}</span></div>
                                            <div className="flex justify-between"><span>{t('summary_hospedes')}:</span> <span className="text-white">{hospedes} Pax</span></div>
                                        </div>
                                    </div>

                                    {selectedExtras.length > 0 && (
                                        <div className="border border-carapita-gold/20 p-8 bg-white/5">
                                            <h4 className="text-[10px] uppercase tracking-mega font-bold text-white mb-4">{t('booking_extras_selecionados')}</h4>
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
                                        <h4 className="text-[10px] uppercase tracking-mega font-bold text-white mb-4">{t('summary_pq_nos')}</h4>
                                        <ul className="space-y-4 text-[10px] text-white/40 font-sans uppercase tracking-widest leading-relaxed">
                                            <li className="flex gap-2">✓ {t('summary_melhores_precos')}</li>
                                            <li className="flex gap-2">✓ {t('summary_checkin_flex')}</li>
                                            <li className="flex gap-2">✓ {t('summary_apoio')}</li>
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

