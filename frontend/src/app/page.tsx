"use client";
import React, { useState } from 'react';
import { ChevronRight, Calendar, Users, Menu, MapPin, X, Check } from 'lucide-react';
import { useRouter } from 'next/navigation';
import SeletorCalendario from '../components/SeletorCalendario';
import { useEffect } from 'react';

// Helper: parse fotos field (can be JSON array or plain URL)
function parseFotos(fotos: string | undefined): string[] {
    if (!fotos) return [];
    try {
        const parsed = JSON.parse(fotos);
        if (Array.isArray(parsed)) return parsed.filter(Boolean);
        return [fotos];
    } catch {
        return fotos ? [fotos] : [];
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
    const [showGuestLoginModal, setShowGuestLoginModal] = useState(false);
    const [isGuestLoggedIn, setIsGuestLoggedIn] = useState(false);
    const [lightboxFotos, setLightboxFotos] = useState<string[]>([]);
    const [lightboxIdx, setLightboxIdx] = useState(0);
    const router = useRouter();


    useEffect(() => {
        const fetchExtras = async () => {
            try {
                const resp = await fetch('http://localhost:5000/api/extras');
                const data = await resp.json();
                if (data.status === 'success') setDisponiveisExtras(data.data);
            } catch (e) {
                console.error("Erro ao procurar extras", e);
            }
        };
        fetchExtras();
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
            const resp = await fetch('http://localhost:5000/api/hospede/login', {
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

    const categories = ['Todos', 'Quarto', 'Cozinha', 'Sala', 'Banheiro', 'Exterior'];
    const filteredGallery = activeTab === 'Todos' ? gallery : gallery.filter(f => f.category === activeTab);

    // 10 Passeios pela Região com História Completa
    const passeios = [
        {
            nome: 'Castelo de Ourém', dist: '10 min', img: 'https://turismo.ourem.pt/wp-content/uploads/2023/07/castelo-medieval-ourem-768x384.jpg', desc: 'Um dos mais belos castelos medievais com vista panorâmica da região.',
            historia: 'Erguido no século XII, o Castelo de Ourém domina o topo de uma colina oferecendo vistas deslumbrantes sobre os vales circundantes. Durante séculos serviu como ponto de defesa crucial durante a Reconquista Cristã. A vila medieval amuralhada que o rodeia, com as suas ruas calcetadas e atmosfera histórica, transporta os visitantes para uma verdadeira viagem no tempo. Reza a lenda que a cidade foi batizada em homenagem a Fátima, uma princesa moura que se converteu ao cristianismo após se apaixonar por um cavaleiro cristão, adotando o nome de Oureana.'
        },
        {
            nome: 'Santuário de Fátima', dist: '15 min', img: 'https://images.unsplash.com/photo-1627933189870-071a9e32ff09?q=80&w=1000&auto=format&fit=crop', desc: 'O maior centro de peregrinação católica de Portugal, conhecido mundialmente.',
            historia: 'Conhecido globalmente, o Santuário de Fátima é um dos mais importantes locais de peregrinação católica do mundo. Foi neste local, na Cova da Iria, que em 1917 os três pastorinhos (Lúcia, Francisco e Jacinta) relataram as aparições da Virgem Maria. Ao longo do ano, especialmente nos dias 13 de maio e 13 de outubro, milhões de fiéis reúnem-se na gigantesca praça frente à Basílica de Nossa Senhora do Rosário numa imensa e comovente procissão de velas, num ambiente de fé, paz e profunda reflexão.'
        },
        {
            nome: 'Convento de Cristo (Tomar)', dist: '25 min', img: 'https://images.unsplash.com/photo-1517400508447-f8dd518b86e3?q=80&w=1000&auto=format&fit=crop', desc: 'Patrimônio Mundial da UNESCO e antiga sede mística dos Cavaleiros Templários.',
            historia: 'Classificado como Património Mundial pela UNESCO em 1983, o impressionante Convento de Cristo em Tomar foi originalmente a fortaleza e a sede matriz da misteriosa Ordem dos Cavaleiros Templários em Portugal no século XII. O monumento é uma obra-prima que mistura diferentes estilos arquitetónicos: o românico templário, o gótico inicial, o renascimento e a famosa janela do estilo manuelino. Andar por seus claustros e entrar na Charola (o oratório octogonal) é adentrar uma das maiores relíquias de toda a Europa.'
        },
        {
            nome: 'Praia Fluvial do Agroal', dist: '20 min', img: 'https://images.unsplash.com/photo-1505322022379-7c3353ee6291?q=80&w=1000&auto=format&fit=crop', desc: 'Piscinas naturais com águas cristalinas e terapêuticas na nascente do Rio Nabão.',
            historia: 'Aninhada no maior aquífero kárstico do país, a Praia Fluvial do Agroal é um verdadeiro oásis de natureza selvagem. Formada na impressionante nascente do Rio Nabão, dispõe de uma piscina biológica e águas correntes incrivelmente geladas e cristalinas durante o Verão inteiro. A sua água, proveniente de grandes profundidades da rocha vulcânica, tem forte fama de conter propriedades minerais terapêuticas, sendo popular há décadas por ajudar no tratamento de doenças de pele e do foro gastrointestinal.'
        },
        {
            nome: 'Mosteiro da Batalha', dist: '30 min', img: 'https://images.unsplash.com/photo-1558368529-6534d0bfe45f?q=80&w=1000&auto=format&fit=crop', desc: 'Gótico imponente e Patrimônio Mundial, símbolo da independência portuguesa.',
            historia: 'O Mosteiro de Santa Maria da Vitória (vulgo Mosteiro da Batalha) é uma das obras mais imponentes do gótico e manuelino da Península Ibérica. Foi mandado edificar pelo rei D. João I em agradecimento à Virgem Maria pela vitória sobre os castelhanos na épica Batalha de Aljubarrota, em 1385, garantindo a independência de Portugal. Classificado como Património Mundial da Humanidade, destaca-se pelos ricos vitrais góticos coloridos, as famosas Capelas Imperfeitas (sem teto) e a intrincada arquitetura dos túmulos reais.'
        },
        {
            nome: 'Pegadas de Dinossáurios', dist: '25 min', img: 'https://images.unsplash.com/photo-1518002171953-a080ee817e1f?q=80&w=1000&auto=format&fit=crop', desc: 'Trilhos que conservam os maiores rastros de saurópodes já encontrados no mundo.',
            historia: 'Escondido na encosta da Serra de Aire está o Monumento Natural das Pegadas dos Dinossáurios, um verdadeiro tesouro paleontológico mundial de 175 milhões de anos (Período Jurássico Médio). Numa antiga laje calcária enorme (pedreira) de 40 mil metros quadrados, foram descobertos quilômetros de rastos deixados por Saurópodes gigantes herbívoros. O local possui um centro de interpretação, longas trilhas de caminhada entre as pegadas fossilizadas gigantes com até 1 metro de diâmetro e representações em tamanho real dessas magníficas feras!'
        },
        {
            nome: 'Grutas de Mira de Aire', dist: '35 min', img: 'https://images.unsplash.com/photo-1515444744559-7be63e160efe?q=80&w=1000&auto=format&fit=crop', desc: 'Uma maravilha subterrânea e as maiores grutas naturais calcárias de Portugal.',
            historia: 'Eleitas como uma das 7 Maravilhas Naturais de Portugal, as impressionantes Grutas de Mira de Aire são as maiores cavidades subterrâneas abertas ao público do país. A visita guiada adentra as entranhas frias da terra até mais de 110 metros de profundidade! No trajeto imensamente iluminado descobrirá espetaculares formações calcárias de estalactites e estalagmites com nomes divertidos (Medusa, Órgão, Joia da Mantiqueira), finalizando numa galeria colossal aos pés de um rio subterrâneo enigmático. O local dispõe ainda de um resort de água sazonal.'
        },
        {
            nome: 'Aqueduto dos Pegões', dist: '25 min', img: 'https://images.unsplash.com/photo-1516084439075-842279c09ef9?q=80&w=1000&auto=format&fit=crop', desc: 'Enorme e majestosa obra arquitetônica que levava água ao castelo de Tomar.',
            historia: 'Esta obra colossal do século XVI é um esplendoroso aqueduto de seis quilómetros de extensão criado por Filippo Terzi (o mesmo arquiteto de El Escorial). O seu propósito era abastecer exclusivamente de água fresca as fontes e lavabos sumptuosos do Convento de Cristo. A parte mais monumental do aqueduto situa-se no Vale dos Pegões Altos, onde o conjunto de 180 imponentes arcos duplos e inteiramente de pedra se eleva a espantosos 30 metros acima do leito selvagem, criando a ilusão fantástica de uma fortaleza a rasgar o horizonte azul e verde profundo.'
        },
        {
            nome: 'Serras de Aire e Candeeiros', dist: '30 min', img: 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?q=80&w=1000&auto=format&fit=crop', desc: 'Parque Natural preservado para realizar agradáveis trilhas (hiking) e fotografia.',
            historia: 'Este vasto e sereno Parque Natural Maciço Calcário Estremenho abrange uma superfície de centenas de quilómetros, sendo famoso pela aridez mítica da sua vegetação à superfície em brutal contraste com a imensa riqueza das suas bacias e rios todos a circular invisivelmente por debaixo da terra! A paisagem de rochas modeladas naturalmente pela chuva lembra frequentemente superfícies lunares. Ideal para explorar a flora, fazer hiking (caminhadas) e bird-watching. No topo de algumas serrações, há dezenas de impressionantes "moinhos de vento" tradicionais a adornar o topo das montanhas.'
        },
        {
            nome: 'Pia do Urso', dist: '35 min', img: 'https://images.unsplash.com/photo-1601614742617-57ceb10c2266?q=80&w=1000&auto=format&fit=crop', desc: 'Aldeia típica de pedra, tranquilidade e lar do primeiro parque ecossensorial.',
            historia: 'A mágica Ecoparque e Aldeia da Pia do Urso não é apenas uma requalificada típica aldeia rural de casas em pedra, barrocos e sobreiros. Trata-se do pioneiro ecoparque sensorial inteiramente projetado para invisuais e totalmente acessível de Portugal! Ao passear lentamente por frondosas sombras de carvalhos, pode-se escutar variadas estações de áudio interativas sobre a vida natural da montanha. O próprio nome intrigante "Pia do Urso" conta a lenda antiga na qual vastos e extintos ursos desciam das serranias escondidas em busca de poças naturais de água gelada gravadas nas rochas para beber.'
        }
    ];

    const totalEstadia = () => {
        if (!checkIn || !checkOut || !idQuartoParaReserva) return 0;
        const q = quartosEncontrados?.find(r => r.id === idQuartoParaReserva);
        if (!q) return 0;
        const noites = checkIn && checkOut
            ? Math.ceil((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / (1000 * 60 * 60 * 24))
            : 0;
        const base = Number(q.preco_base) * noites;
        const extras = selectedExtras.reduce((acc, id) => {
            const extra = disponiveisExtras.find(e => e.id === id);
            return acc + (extra ? Number(extra.preco) : 0);
        }, 0);
        return base + extras;
    };

    const iniciarReserva = (quartoId: string) => {
        setIdQuartoParaReserva(quartoId);
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

            const resp = await fetch('http://localhost:5000/api/reservas', {
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
            const resp = await fetch(`http://localhost:5000/api/reservas/disponibilidade?checkIn=${checkIn}&checkOut=${checkOut}&capacidade=${hospedes}`);
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
            const resp = await fetch(`http://localhost:5000/api/tarifas/calendario?quartoId=${quartoId}&inicio=${hoje.toISOString()}&fim=${fim.toISOString()}`);
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
                // Carregar todos os quartos inicialmente
                fetch('http://localhost:5000/api/quartos')
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
            const resp = await fetch('http://localhost:5000/api/reservas', {
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
        <main className="min-h-screen bg-white flex flex-col font-sans selection:bg-carapita-gold selection:text-white">

            {/* Header / Navigation */}
            <header className={`fixed top-0 w-full z-50 px-6 md:px-12 py-6 flex items-center justify-between transition-all duration-700 ${scrolled ? 'bg-white shadow-lg py-4 border-b-0 text-carapita-dark' : 'bg-transparent text-white border-b border-white/20'}`}>
                {/* Left: Navigation Menu */}
                <nav className="flex-1 hidden lg:block">
                    <ul className="flex gap-10 text-[10px] uppercase tracking-mega font-medium">
                        <li className="hover:text-carapita-gold transition-colors duration-300 cursor-pointer" onClick={() => scrollTo('a-essencia')}>A Casa</li>
                        <li className="hover:text-carapita-gold transition-colors duration-300 cursor-pointer" onClick={() => scrollTo('alojamento')}>Alojamento</li>
                        <li className="hover:text-carapita-gold transition-colors duration-300 cursor-pointer" onClick={() => scrollTo('passeios')}>Passeios</li>
                        <li className="hover:text-carapita-gold transition-colors duration-300 cursor-pointer" onClick={() => scrollTo('contatos')}>Contatos</li>
                    </ul>
                </nav>

                {/* Center: Logo (Elegante e Imponente) */}
                <div className="flex-shrink-0 text-center mx-4">
                    <h1 className="cursor-pointer group flex flex-col items-center" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
                        <span className={`block text-3xl md:text-5xl font-serif tracking-widest uppercase font-light transition-colors duration-700 ${scrolled ? 'text-carapita-dark' : 'text-white'}`}>Refúgio</span>
                        <span className="block text-4xl md:text-6xl font-sans tracking-[0.3em] uppercase mt-1 text-carapita-gold group-hover:text-carapita-goldLight transition-colors">Carapita</span>
                    </h1>
                </div>

                {/* Right: Admin & Auth */}
                <div className="flex-1 flex justify-end items-center gap-6">
                    <div className="hidden xl:flex items-center gap-6 mr-4 opacity-60 hover:opacity-100 transition-opacity">
                        <button onClick={() => router.push('/admin/reservas')} className="text-[9px] uppercase tracking-widest font-bold hover:text-carapita-gold transition-colors">Reservas</button>
                        <button onClick={() => router.push('/admin/quartos')} className="text-[9px] uppercase tracking-widest font-bold hover:text-carapita-gold transition-colors">Quartos</button>
                        <button onClick={() => router.push('/admin/tarifas')} className="text-[9px] uppercase tracking-widest font-bold hover:text-carapita-gold transition-colors">Tarifas</button>
                    </div>

                    <button
                        onClick={() => {
                            const token = localStorage.getItem('token');
                            if (token) router.push('/perfil');
                            else router.push('/login');
                        }}
                        className={`hidden md:block px-6 py-2 rounded-full text-[10px] uppercase tracking-widest transition-all duration-300 border ${scrolled
                            ? 'border-carapita-dark text-carapita-dark hover:bg-carapita-dark hover:text-white'
                            : 'border-white text-white hover:bg-white hover:text-carapita-dark'
                            }`}
                    >
                        {mounted && isLoggedIn ? 'Minha Conta' : 'Login'}
                    </button>

                    <button onClick={() => setShowBookingScreen(true)} className={`text-[10px] uppercase tracking-mega font-bold rounded-full px-8 py-3 transition-all duration-500 bg-carapita-dark text-white hover:bg-carapita-gold`}>
                        Reservar Agora
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

            {/* Booking Bar */}
            <section id="motor" className="w-full relative z-20 bg-white">
                <div className="w-full max-w-7xl mx-auto px-6 md:px-16 py-10 flex flex-col md:flex-row items-center justify-between gap-8 border-b border-carapita-border">
                    <div className="flex-1 w-full grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="flex flex-col gap-2 w-full cursor-pointer" onClick={() => setShowCalendar(!showCalendar)}>
                            <label className="text-[10px] text-carapita-muted tracking-mega uppercase font-medium">Data de Chegada</label>
                            <div className="flex items-center gap-3 border-b border-carapita-border pb-2 focus-within:border-carapita-dark transition-colors">
                                <Calendar className="text-carapita-gold" size={14} />
                                <span className="w-full bg-transparent outline-none text-carapita-dark text-sm font-light uppercase tracking-widest">{checkIn || 'Selecionar'}</span>
                            </div>
                        </div>
                        <div className="flex flex-col gap-2 w-full cursor-pointer" onClick={() => setShowCalendar(!showCalendar)}>
                            <label className="text-[10px] text-carapita-muted tracking-mega uppercase font-medium">Data de Partida</label>
                            <div className="flex items-center gap-3 border-b border-carapita-border pb-2 focus-within:border-carapita-dark transition-colors">
                                <Calendar className="text-carapita-gold" size={14} />
                                <span className="w-full bg-transparent outline-none text-carapita-dark text-sm font-light uppercase tracking-widest">{checkOut || 'Selecionar'}</span>
                            </div>
                        </div>
                        <div className="flex flex-col gap-2 w-full">
                            <label className="text-[10px] text-carapita-muted tracking-mega uppercase font-medium">Ocupação</label>
                            <div className="flex items-center gap-3 border-b border-carapita-border pb-2 focus-within:border-carapita-dark transition-colors">
                                <Users className="text-carapita-gold" size={14} />
                                <select value={hospedes} onChange={(e) => setHospedes(Number(e.target.value))} className="w-full bg-transparent outline-none text-carapita-dark text-sm font-light uppercase tracking-widest cursor-pointer appearance-none">
                                    <option value={1}>1 Adulto</option>
                                    <option value={2}>2 Adultos</option>
                                    <option value={3}>3 Adultos</option>
                                    <option value={4}>4 Adultos</option>
                                </select>
                            </div>
                        </div>
                    </div>
                    <button onClick={buscarDisponibilidade} disabled={loading} className="w-full md:w-auto px-12 py-4 bg-carapita-gold hover:bg-carapita-dark text-white text-xs tracking-mega uppercase font-medium transition-colors duration-500 disabled:opacity-50">
                        {loading ? 'Pesquisando...' : 'Verificar'}
                    </button>
                </div>

                {showCalendar && (
                    <div className="bg-white border-b border-carapita-border">
                        <SeletorCalendario
                            quartoId="8de6abb4-d7e9-488d-ba06-29e26259321f" // ID da Suíte Master atualizado
                            onSelect={(start, end) => {
                                setCheckIn(start);
                                setCheckOut(end);
                                setShowCalendar(false);
                            }}
                        />
                    </div>
                )}
            </section>

            {/* Resultados da Busca */}
            {quartosEncontrados && (
                <section id="resultados-busca" className="py-24 px-6 md:px-16 max-w-7xl mx-auto w-full border-b border-gray-100">
                    <div className="text-center mb-16">
                        <span className="text-carapita-gold uppercase tracking-mega text-[10px] font-semibold">Reserva Direta</span>
                        <h3 className="text-4xl font-serif text-carapita-dark font-light mt-4">Disponibilidade Encontrada</h3>
                    </div>
                    {quartosEncontrados.length === 0 ? (
                        <p className="text-center text-carapita-muted font-light uppercase tracking-widest text-sm">Não há habitações disponíveis para este período.</p>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                            {quartosEncontrados.map((quarto) => (
                                <div key={quarto.id} className="group border border-gray-100 p-6 flex flex-col hover:border-carapita-gold transition-colors duration-500">
                                    <div className="flex items-center justify-between mb-4">
                                        <h4 className="text-2xl font-serif text-carapita-dark">{quarto.nome}</h4>
                                        <span className="text-xl font-light text-carapita-gold">€{quarto.preco_base}/Noite</span>
                                    </div>
                                    <p className="text-sm text-carapita-muted font-light mb-8 flex-grow">{quarto.descricao} • Suporta {quarto.capacidade} pessoas.</p>
                                    <button
                                        onClick={() => iniciarReserva(quarto.id)}
                                        disabled={loading}
                                        className="bg-[#1E3932] hover:bg-carapita-dark text-white rounded-full uppercase text-[10px] tracking-mega px-10 py-4 transition-all duration-300 w-full mb-4 disabled:opacity-50"
                                    >
                                        {loading ? 'Processando...' : 'Reservar Agora'}
                                    </button>

                                    <p className="text-[10px] text-center text-carapita-muted font-light uppercase tracking-widest">Via Conexão Segura Stripe</p>
                                </div>
                            ))}
                        </div>
                    )}
                </section>
            )}

            {/* A Essência - "Um Lugar Mágico" (Estilo Casa da Calçada) */}
            <section id="a-essencia" className="w-full bg-[#141414] text-white py-32 px-4 md:px-12 lg:px-24 overflow-hidden relative">
                <div className="max-w-[1400px] mx-auto flex flex-col items-center">

                    {/* Cabeçalho */}
                    <div className="text-center mb-16 lg:mb-32 z-10 relative">
                        <div className="flex justify-center mb-8">
                            <span className="w-[1px] h-12 bg-carapita-gold opacity-50 block"></span>
                        </div>
                        <span className="text-carapita-gold uppercase tracking-widest text-[9px] md:text-[10px] font-medium block mb-6"> Refúgio Carapita </span>
                        <h3 className="text-4xl md:text-6xl lg:text-7xl font-serif text-carapita-goldLight leading-tight font-light uppercase tracking-widest">
                            Um Lugar Mágico
                        </h3>
                    </div>

                    {/* Layout Sobreposto (Imagens + Texto) */}
                    <div className="w-full flex flex-col lg:flex-row items-center lg:items-end justify-between gap-16 lg:gap-8 relative">

                        {/* Box Decorativo Fino Atrás */}
                        <div className="hidden lg:block absolute left-4 xl:-left-8 top-12 w-[60%] h-[110%] border opacity-20 border-carapita-gold z-0 pointer-events-none"></div>

                        {/* Coluna das Imagens (Esquerda) */}
                        <div className="w-full lg:w-[65%] relative min-h-[450px] sm:min-h-[600px] md:min-h-[750px] flex items-center justify-center lg:justify-start">

                            {/* Imagem Maior (Fundo Direita) - id: 2469830518 */}
                            <div className="absolute right-0 lg:-right-4 xl:right-10 top-0 w-[80%] md:w-[70%] h-[380px] sm:h-[500px] md:h-[650px] z-10 overflow-hidden shadow-2xl">
                                <img
                                    src="https://a0.muscache.com/im/pictures/hosting/Hosting-1580467683590335058/original/f53992ea-c556-40bf-8ff8-07900f8f79a1.jpeg?im_w=1200"
                                    className="w-full h-full object-cover transform duration-[3s] hover:scale-105 filter brightness-100"
                                    alt="Vista Exterior Mágica"
                                />
                            </div>

                            {/* Imagem Menor Sobreposta (Frente Esquerda, com margem negativa) - id: 2469846945 */}
                            <div className="absolute left-0 lg:left-8 xl:-left-4 bottom-[-40px] md:bottom-[-60px] w-[55%] md:w-[45%] h-[280px] sm:h-[400px] md:h-[500px] z-20 overflow-hidden group shadow-[20px_20px_50px_rgba(0,0,0,0.5)] border-4 border-[#141414]">
                                <img
                                    src="https://a0.muscache.com/im/pictures/hosting/Hosting-1580467683590335058/original/f0f4a673-77ef-4b5a-ba7a-2888f3e9eebf.jpeg?im_w=960"
                                    className="w-full h-full object-cover transform duration-[3s] group-hover:scale-105"
                                    alt="Detalhes do Alojamento"
                                />
                            </div>
                        </div>

                        {/* Coluna de Texto (Direita) */}
                        <div className="w-full lg:w-[35%] flex flex-col justify-end text-left z-30 mt-28 lg:mt-0 lg:pb-12 xl:pl-8">
                            <p className="text-white/70 font-light leading-[2.2] text-xs sm:text-sm tracking-wide text-justify md:text-left mb-12">
                                Uma propriedade com encanto secular. Um passado intemporal que se mescla com a história de Ourém e de Portugal. Um lugar visionário, recheado de natureza, onde se serviu a comunidade e celebraram vinhos e sonhos.
                                <br /><br />
                                Uma casa que ganha fama pelas suas maravilhosas vistas panorâmicas, e volta agora a abrir as portas como alojamento de charme e absoluto requinte.
                                Bem-vindos a esta casa mágica no coração lusitano, cujo espírito navega ao ritmo das paisagens verdes, com o qual aprendeu que tudo muda e tudo repousa!
                            </p>

                            {/* Botão Oval Elegante */}
                            <button onClick={() => scrollTo('alojamento')} className="flex items-center justify-center w-48 h-12 border border-carapita-gold/60 rounded-[30px] text-[9px] uppercase tracking-[0.2em] text-carapita-gold hover:bg-carapita-gold hover:text-white transition-all duration-700 mx-auto md:mx-0">
                                Descobrir &#10141;
                            </button>
                        </div>
                    </div>

                </div>
            </section>

            {/* Galeria de Alojamento c/ Abas (Fotos Reais do Airbnb) */}
            <section id="alojamento" className="pb-32 px-4 md:px-12 max-w-[1400px] mx-auto w-full">
                <div className="text-center mb-16">
                    <span className="text-carapita-gold uppercase tracking-mega text-[10px] font-semibold block mb-4">Alojamento</span>
                    <h3 className="text-4xl md:text-5xl font-serif text-carapita-dark font-light mb-12">As Suas Áreas</h3>

                    {/* Abas */}
                    <div className="flex flex-wrap justify-center gap-6 md:gap-12 border-b border-gray-100 pb-4 max-w-3xl mx-auto">
                        {categories.map((cat) => (
                            <button
                                key={cat}
                                onClick={() => setActiveTab(cat)}
                                className={`text-[10px] md:text-xs uppercase tracking-widest font-medium pb-2 transition-all ${activeTab === cat ? 'text-carapita-gold border-b border-carapita-gold' : 'text-carapita-muted hover:text-carapita-dark'}`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Grid de Fotos */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 animate-fade-in">
                    {filteredGallery.map((img, idx) => (
                        <div key={`${img.category}-${idx}`} className="group overflow-hidden relative w-full h-80 md:h-96 bg-gray-50 cursor-pointer">
                            <img src={img.url} alt={`Refúgio Carapita - ${img.category}`} className="w-full h-full object-cover transform duration-[2s] ease-out group-hover:scale-105" />
                            <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-6">
                                <span className="text-white text-xs uppercase tracking-widest font-semibold drop-shadow-md">{img.category}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Passeios pela Região (10 Passeios) */}
            <section id="passeios" className="py-24 px-4 md:px-12 max-w-[1400px] mx-auto w-full bg-white border-b border-gray-100">
                <div className="text-center mb-16">
                    <span className="text-carapita-gold uppercase tracking-mega text-[10px] font-semibold block mb-4">Descubra a Região</span>
                    <h3 className="text-4xl md:text-5xl font-serif text-carapita-dark font-light max-w-2xl mx-auto leading-tight">
                        Explorar além do nosso <i className="font-serif text-carapita-gold">Refúgio</i>
                    </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                    {passeios.map((passeio, idx) => (
                        <div key={idx} className="group flex flex-col items-center text-center cursor-pointer" onClick={() => setPasseioSelecionado(passeio)}>
                            <div className="w-full h-64 md:h-72 overflow-hidden mb-6 relative border border-gray-100">
                                <img src={passeio.img} alt={passeio.nome} className="w-full h-full object-cover transform duration-700 group-hover:scale-105 filter group-hover:brightness-110" />
                                <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-1 flex items-center gap-1 shadow-sm">
                                    <MapPin size={10} className="text-carapita-gold" />
                                    <span className="text-[9px] uppercase tracking-widest font-semibold text-carapita-dark">{passeio.dist}</span>
                                </div>
                            </div>
                            <h5 className="text-sm font-serif text-carapita-dark font-medium mb-2 group-hover:text-carapita-gold transition-colors">{passeio.nome}</h5>
                            <p className="text-[11px] text-carapita-muted font-light leading-relaxed max-w-[220px]">{passeio.desc}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* Footer Padrão Relais & Châteaux */}
            <footer id="contatos" className="bg-carapita-dark text-white py-24 px-6 md:px-16 border-t-[12px] border-carapita-gold mt-auto">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start gap-16">
                    <div className="w-full md:w-1/3 text-center md:text-left">
                        <h2 className="text-3xl font-serif mb-6 font-light uppercase tracking-widest cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
                            Refúgio<br /><span className="text-carapita-gold text-lg tracking-mega">Carapita</span>
                        </h2>
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
                            <p>Rua da Paz, S/N</p>
                            <p>Ourém, Portugal</p>
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
                    <div className="relative bg-white w-full max-w-4xl max-h-[90vh] overflow-y-auto z-[101] shadow-2xl flex flex-col md:flex-row animate-fade-in border border-carapita-border">
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
                            <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm px-4 py-2 flex items-center gap-2 shadow-lg">
                                <MapPin size={12} className="text-carapita-gold" />
                                <span className="text-[10px] uppercase tracking-widest font-semibold text-carapita-dark">{passeioSelecionado.dist} da Casa</span>
                            </div>
                        </div>

                        {/* Conteúdo Lado Direito Modal */}
                        <div className="w-full md:w-1/2 p-10 md:p-14 flex flex-col justify-center bg-white text-left">
                            <span className="text-carapita-gold uppercase tracking-widest text-[10px] font-medium block mb-4 border-b border-carapita-gold/30 pb-4 inline-block w-max">Descobrir Ourém & Arredores</span>
                            <h3 className="text-3xl md:text-4xl font-serif text-carapita-dark leading-tight font-light mb-6">
                                {passeioSelecionado.nome}
                            </h3>
                            <p className="text-carapita-muted font-light leading-[2.0] text-sm mb-12 text-justify">
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
                    <div className="relative bg-white w-full max-w-lg p-10 shadow-2xl animate-fade-in border border-carapita-border">
                        <button className="absolute top-4 right-4 text-carapita-muted" onClick={() => setShowGuestModal(false)}><X size={20} /></button>
                        <h3 className="text-2xl font-serif text-carapita-dark mb-2">Finalize sua Reserva</h3>
                        <p className="text-xs text-carapita-muted uppercase tracking-widest mb-8">Precisamos de alguns dados para confirmar sua estadia.</p>

                        <div className="flex flex-col gap-6">
                            <div className="flex flex-col gap-2">
                                <label className="text-[10px] uppercase tracking-mega text-carapita-muted">Nome Completo</label>
                                <input
                                    type="text"
                                    value={formHospede.nome}
                                    onChange={(e) => setFormHospede({ ...formHospede, nome: e.target.value })}
                                    className="border-b border-carapita-border pb-2 outline-none focus:border-carapita-gold text-sm font-light"
                                    placeholder="Como devemos chamá-lo?"
                                />
                            </div>
                            <div className="flex flex-col gap-2">
                                <label className="text-[10px] uppercase tracking-mega text-carapita-muted">E-mail</label>
                                <input
                                    type="email"
                                    value={formHospede.email}
                                    onChange={(e) => setFormHospede({ ...formHospede, email: e.target.value })}
                                    className="border-b border-carapita-border pb-2 outline-none focus:border-carapita-gold text-sm font-light"
                                    placeholder="exemplo@email.com"
                                />
                            </div>
                            <div className="flex flex-col gap-2">
                                <label className="text-[10px] uppercase tracking-mega text-carapita-muted">Telefone / WhatsApp</label>
                                <input
                                    type="text"
                                    value={formHospede.telefone}
                                    onChange={(e) => setFormHospede({ ...formHospede, telefone: e.target.value })}
                                    className="border-b border-carapita-border pb-2 outline-none focus:border-carapita-gold text-sm font-light"
                                    placeholder="+351 000 000 000"
                                />
                            </div>

                            <div className="flex flex-col gap-2">
                                <label className="text-[10px] uppercase tracking-mega text-carapita-muted">Método de Pagamento</label>
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
                <div className="fixed inset-0 z-[200] bg-white overflow-y-auto animate-fade-in font-serif">
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
                        <div className="absolute bottom-10 left-6 md:left-20 bg-white/90 backdrop-blur p-8 shadow-2xl max-w-sm border-t-4 border-carapita-gold">
                            <h2 className="text-2xl text-carapita-dark mb-4 tracking-widest uppercase">Refúgio Carapita</h2>
                            <div className="space-y-3 text-[11px] text-carapita-muted font-sans uppercase tracking-widest">
                                <p className="flex items-start gap-2">
                                    <MapPin size={14} className="text-carapita-gold shrink-0" />
                                    <span>R. Dom Afonso Quarto Conde de Ourém IV 450, 2490-480 Ourém</span>
                                </p>
                                <p className="flex items-center gap-2">
                                    <Users size={14} className="text-carapita-gold" />
                                    <span>+351 967 244 938</span>
                                </p>
                                <p className="flex items-center gap-2">
                                    <ChevronRight size={14} className="text-carapita-gold" />
                                    <span>refugiocarapita.com</span>
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
                                        <div className="flex items-end gap-4 mb-8 pb-6 border-b border-gray-100">
                                            <div>
                                                <label className="text-[9px] uppercase tracking-mega text-carapita-muted block mb-2">Nº de Hóspedes</label>
                                                <select
                                                    value={hospedes}
                                                    onChange={(e) => setHospedes(Number(e.target.value))}
                                                    className="bg-gray-50 px-4 py-3 border border-gray-100 outline-none font-sans text-sm focus:border-carapita-gold"
                                                >
                                                    {[1, 2, 3, 4, 5, 6].map(n => <option key={n} value={n}>{n} {n === 1 ? 'Hóspede' : 'Hóspedes'}</option>)}
                                                </select>
                                            </div>
                                            {checkIn && checkOut && (
                                                <div className="flex items-center gap-3 bg-carapita-goldLight/20 border border-carapita-gold/30 px-4 py-3">
                                                    <Calendar size={14} className="text-carapita-gold" />
                                                    <span className="text-xs font-sans text-carapita-dark font-bold">{checkIn} → {checkOut}</span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Calendário Interativo Real */}
                                        <div className="mb-12">
                                            <h4 className="font-serif text-xl mb-6 text-carapita-dark border-b border-gray-100 pb-4">
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
                                        <h2 className="font-serif text-3xl mb-10 text-carapita-dark border-b border-gray-100 pb-4 uppercase tracking-widest">Selecionar Alojamento</h2>
                                        <div className="space-y-0 divide-y divide-gray-200 border border-gray-200 bg-white">
                                            {(quartosEncontrados || []).length > 0 ? (
                                                quartosEncontrados?.map((q) => {
                                                    const fotos = parseFotos(q.fotos);
                                                    const mainFoto = fotos[0] || 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800&auto=format&fit=crop';
                                                    let comodidades: string[] = [];
                                                    try { comodidades = JSON.parse(q.comodidades || '[]'); } catch { }
                                                    const topBullets = comodidades.filter(c => c.toLowerCase().includes('cama') || c.toLowerCase().includes('m²')).slice(0, 4);
                                                    const noites = checkIn && checkOut ? Math.ceil((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / (1000 * 60 * 60 * 24)) : 0;

                                                    return (
                                                        <div key={q.id} className="bg-white p-6 flex gap-6">
                                                            <div className="shrink-0 w-52 md:w-64">
                                                                <div className="relative cursor-pointer h-40 overflow-hidden" onClick={() => { if (fotos.length > 0) { setLightboxFotos(fotos); setLightboxIdx(0); } }}>
                                                                    <img src={mainFoto} className="w-full h-full object-cover" />
                                                                </div>
                                                            </div>
                                                            <div className="flex-1">
                                                                <h3 className="font-serif text-xl text-carapita-dark mb-4 capitalize">{q.nome}</h3>
                                                                <ul className="space-y-1.5 mb-4 text-sm text-gray-700">
                                                                    {topBullets.map((c, i) => <li key={i}>• {c}</li>)}
                                                                </ul>
                                                                <div className="flex justify-between items-end">
                                                                    <div>
                                                                        <div className="text-2xl font-bold text-gray-900">€{Number(q.preco_base).toFixed(2)}</div>
                                                                        <p className="text-[10px] text-gray-500 uppercase tracking-widest">Por noite</p>
                                                                    </div>
                                                                    <button onClick={() => iniciarReserva(q.id)} className="bg-carapita-dark text-white px-8 py-3 text-[10px] uppercase tracking-widest font-bold hover:bg-carapita-gold transition-all">Selecionar</button>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                })
                                            ) : (
                                                <p className="p-10 text-center text-carapita-muted italic">Selecione datas para ver disponibilidade.</p>
                                            )}
                                        </div>
                                    </>
                                )}

                                {bookingStep === 'extras' && (
                                    <div className="animate-fade-in">
                                        <h2 className="font-serif text-3xl mb-4 text-carapita-dark uppercase tracking-widest">Personalize a sua Estadia</h2>
                                        <p className="text-carapita-muted mb-10 text-sm">Adicione extras ao seu aluguer para uma experiência ainda mais inesquecível.</p>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
                                            {disponiveisExtras.map(e => (
                                                <div key={e.id} className={`border p-6 flex items-start gap-4 transition-all ${selectedExtras.includes(e.id) ? 'border-carapita-gold bg-carapita-goldLight/10' : 'border-gray-100'}`}>
                                                    <span className="text-3xl">{e.icone || '✨'}</span>
                                                    <div className="flex-1">
                                                        <h4 className="font-bold text-carapita-dark text-sm">{e.nome}</h4>
                                                        <p className="text-xs text-gray-500 mb-4">{e.descricao}</p>
                                                        <p className="text-carapita-gold font-bold text-sm mb-3">€{Number(e.preco).toFixed(2)}</p>
                                                        <button
                                                            onClick={() => {
                                                                if (selectedExtras.includes(e.id)) setSelectedExtras(selectedExtras.filter(id => id !== e.id));
                                                                else setSelectedExtras([...selectedExtras, e.id]);
                                                            }}
                                                            className={`text-[10px] uppercase tracking-widest font-bold border px-4 py-2 transition-all ${selectedExtras.includes(e.id) ? 'bg-carapita-gold text-white border-carapita-gold' : 'border-gray-200 text-gray-400 hover:border-carapita-gold hover:text-carapita-gold'}`}
                                                        >
                                                            {selectedExtras.includes(e.id) ? 'Adicionado' : 'Adicionar'}
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        <div className="flex justify-between border-t border-gray-100 pt-8">
                                            <button onClick={() => setBookingStep('selection')} className="text-[10px] uppercase tracking-widest text-gray-400 hover:text-carapita-dark transition-all">Voltar</button>
                                            <button onClick={() => setBookingStep('details')} className="bg-carapita-dark text-white px-10 py-4 text-[11px] uppercase tracking-mega font-bold hover:bg-carapita-gold">Continuar reserva</button>
                                        </div>
                                    </div>
                                )}

                                {bookingStep === 'details' && (
                                    <div className="animate-fade-in font-sans">
                                        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                                            <h2 className="font-serif text-3xl text-carapita-dark uppercase tracking-widest">Detalhes do Hóspede</h2>
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
                                                <h4 className="text-[10px] uppercase tracking-mega text-carapita-gold font-bold mb-6 border-b border-gray-100 pb-2">Informação de Contacto</h4>
                                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                                                    <div className="col-span-1">
                                                        <label className="text-[10px] uppercase text-gray-400 block mb-2">Prefixo</label>
                                                        <select value={bookingForm.prefixo} onChange={e => setBookingForm({ ...bookingForm, prefixo: e.target.value })} className="w-full border-b border-gray-200 py-3 text-sm focus:border-carapita-gold outline-none">
                                                            {['Mr.', 'Mrs.', 'Ms.', 'Dr.', 'Pr.'].map(p => <option key={p} value={p}>{p}</option>)}
                                                        </select>
                                                    </div>
                                                    <div className="col-span-1 lg:col-span-1">
                                                        <label className="text-[10px] uppercase text-gray-400 block mb-2">Nome</label>
                                                        <input type="text" value={bookingForm.nome} onChange={e => setBookingForm({ ...bookingForm, nome: e.target.value })} className="w-full border-b border-gray-200 py-3 text-sm focus:border-carapita-gold outline-none" placeholder="João" />
                                                    </div>
                                                    <div className="col-span-2 lg:col-span-2">
                                                        <label className="text-[10px] uppercase text-gray-400 block mb-2">Sobrenome</label>
                                                        <input type="text" value={bookingForm.sobrenome} onChange={e => setBookingForm({ ...bookingForm, sobrenome: e.target.value })} className="w-full border-b border-gray-200 py-3 text-sm focus:border-carapita-gold outline-none" placeholder="Silva" />
                                                    </div>
                                                    <div className="col-span-2 lg:col-span-2">
                                                        <label className="text-[10px] uppercase text-gray-400 block mb-2">Telefone</label>
                                                        <input type="tel" value={bookingForm.telefone} onChange={e => setBookingForm({ ...bookingForm, telefone: e.target.value })} className="w-full border-b border-gray-200 py-3 text-sm focus:border-carapita-gold outline-none" placeholder="+351 000 000 000" />
                                                    </div>
                                                    <div className="col-span-2 lg:col-span-2">
                                                        <label className="text-[10px] uppercase text-gray-400 block mb-2">E-mail</label>
                                                        <input type="email" value={bookingForm.email} onChange={e => setBookingForm({ ...bookingForm, email: e.target.value })} className="w-full border-b border-gray-200 py-3 text-sm focus:border-carapita-gold outline-none" placeholder="joao@exemplo.com" />
                                                    </div>
                                                </div>
                                            </section>

                                            <section>
                                                <h4 className="text-[10px] uppercase tracking-mega text-carapita-gold font-bold mb-6 border-b border-gray-100 pb-2">Endereço de Faturação</h4>
                                                <div className="grid grid-cols-2 gap-6 text-sm">
                                                    <div className="col-span-2 lg:col-span-1">
                                                        <label className="text-[10px] uppercase text-gray-400 block mb-2">País</label>
                                                        <input type="text" value={bookingForm.pais} onChange={e => setBookingForm({ ...bookingForm, pais: e.target.value })} className="w-full border-b border-gray-200 py-3 focus:border-carapita-gold outline-none" />
                                                    </div>
                                                    <div className="col-span-2 lg:col-span-1">
                                                        <label className="text-[10px] uppercase text-gray-400 block mb-2">Cidade</label>
                                                        <input type="text" value={bookingForm.cidade} onChange={e => setBookingForm({ ...bookingForm, cidade: e.target.value })} className="w-full border-b border-gray-200 py-3 focus:border-carapita-gold outline-none" />
                                                    </div>
                                                    <div className="col-span-2">
                                                        <label className="text-[10px] uppercase text-gray-400 block mb-2">Endereço 1</label>
                                                        <input type="text" value={bookingForm.endereco1} onChange={e => setBookingForm({ ...bookingForm, endereco1: e.target.value })} className="w-full border-b border-gray-200 py-3 focus:border-carapita-gold outline-none" />
                                                    </div>
                                                    <div className="col-span-2 lg:col-span-1">
                                                        <label className="text-[10px] uppercase text-gray-400 block mb-2">Endereço 2 (Opcional)</label>
                                                        <input type="text" value={bookingForm.endereco2} onChange={e => setBookingForm({ ...bookingForm, endereco2: e.target.value })} className="w-full border-b border-gray-200 py-3 focus:border-carapita-gold outline-none" />
                                                    </div>
                                                    <div className="col-span-2 lg:col-span-1">
                                                        <label className="text-[10px] uppercase text-gray-400 block mb-2">CEP / Código Postal</label>
                                                        <input type="text" value={bookingForm.cep} onChange={e => setBookingForm({ ...bookingForm, cep: e.target.value })} className="w-full border-b border-gray-200 py-3 focus:border-carapita-gold outline-none" />
                                                    </div>
                                                </div>
                                            </section>

                                            <section className="bg-gray-50 p-8 border border-gray-100">
                                                <div className="flex items-center gap-3 mb-6">
                                                    <input type="checkbox" id="create" checked={bookingForm.criarConta} onChange={e => setBookingForm({ ...bookingForm, criarConta: e.target.checked })} className="w-4 h-4 accent-carapita-gold" />
                                                    <label htmlFor="create" className="text-xs font-bold uppercase tracking-widest text-carapita-dark cursor-pointer">Desejo criar uma conta para reservar mais rápido</label>
                                                </div>
                                                {bookingForm.criarConta && (
                                                    <div className="grid grid-cols-2 gap-6 animate-slide-down">
                                                        <div>
                                                            <label className="text-[10px] uppercase text-gray-400 block mb-2">Senha</label>
                                                            <input type="password" value={bookingForm.senha} onChange={e => setBookingForm({ ...bookingForm, senha: e.target.value })} className="w-full border-b border-gray-200 py-3 text-sm focus:border-carapita-gold outline-none bg-transparent" />
                                                        </div>
                                                        <div>
                                                            <label className="text-[10px] uppercase text-gray-400 block mb-2">Confirmar Senha</label>
                                                            <input type="password" value={bookingForm.confirmarSenha} onChange={e => setBookingForm({ ...bookingForm, confirmarSenha: e.target.value })} className="w-full border-b border-gray-200 py-3 text-sm focus:border-carapita-gold outline-none bg-transparent" />
                                                        </div>
                                                    </div>
                                                )}
                                            </section>

                                            <section>
                                                <h4 className="text-[10px] uppercase tracking-mega text-carapita-gold font-bold mb-4">Requerimentos Especiais</h4>
                                                <p className="text-[10px] text-gray-400 mb-4 uppercase tracking-widest leading-relaxed">Pode adicionar aqui informações como idade das crianças, pedidos de restaurante, dietas especiais ou animais de estimação.</p>
                                                <textarea value={bookingForm.requerimentosEspeciais} onChange={e => setBookingForm({ ...bookingForm, requerimentosEspeciais: e.target.value })} className="w-full border border-gray-200 p-4 text-sm h-32 focus:border-carapita-gold outline-none" placeholder="Escreva aqui os seus pedidos..." />
                                            </section>
                                        </div>

                                        <div className="flex justify-between mt-12 pt-8 border-t border-gray-100">
                                            <button onClick={() => setBookingStep('extras')} className="text-[10px] uppercase tracking-widest text-gray-400 hover:text-carapita-dark">Voltar</button>
                                            <button onClick={() => setBookingStep('payment')} className="bg-carapita-dark text-white px-10 py-4 text-[11px] uppercase tracking-mega font-bold hover:bg-carapita-gold">Prosseguir para pagamento</button>
                                        </div>
                                    </div>
                                )}

                                {bookingStep === 'payment' && (
                                    <div className="animate-fade-in font-sans">
                                        <h2 className="font-serif text-3xl mb-8 text-carapita-dark uppercase tracking-widest text-sh">Pagamento e Políticas</h2>

                                        <div className="bg-green-50 p-6 flex items-start gap-4 mb-10 border border-green-100 text-green-800">
                                            <div className="p-2 bg-green-600 rounded-full text-white"><Check size={16} /></div>
                                            <p className="text-xs leading-relaxed uppercase tracking-widest font-medium">Usamos transmissão segura e armazenamento criptografado para proteger as suas informações pessoais e dados de pagamento.</p>
                                        </div>

                                        <section className="mb-12">
                                            <h4 className="text-[10px] uppercase tracking-mega text-carapita-gold font-bold mb-6 border-b border-gray-100 pb-2">Detalhes de Pagamento</h4>
                                            <div className="bg-gray-50 p-10 text-center border border-dashed border-gray-200 rounded">
                                                <p className="text-[10px] uppercase tracking-widest text-gray-400 mb-4">A processar integração com Cartões de Crédito (Stripe/Reduniq)</p>
                                                <div className="flex justify-center gap-4 opacity-30 grayscale">
                                                    <img src="https://upload.wikimedia.org/wikipedia/commons/5/5e/Visa_Inc._logo.svg" className="h-6" alt="Visa" />
                                                    <img src="https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg" className="h-8" alt="Mastercard" />
                                                </div>
                                            </div>
                                        </section>

                                        <section className="space-y-8 mb-12">
                                            <div>
                                                <h4 className="text-[10px] uppercase tracking-mega text-carapita-dark font-bold mb-3">POLÍTICA DE GARANTIA</h4>
                                                <p className="text-xs text-gray-500 leading-relaxed italic uppercase tracking-widest p-4 border-l-2 border-carapita-gold bg-gray-50">O depósito, não é reembolsável, no valor integral da estadia, incluindo taxa, será cobrado 02 dias antes da chegada.</p>
                                            </div>
                                            <div>
                                                <h4 className="text-[10px] uppercase tracking-mega text-carapita-dark font-bold mb-3">POLÍTICAS DE CANCELAMENTO</h4>
                                                <p className="text-xs text-gray-500 leading-relaxed italic uppercase tracking-widest p-4 border-l-2 border-carapita-gold bg-gray-50">Cancelamento/modificação gratuito até 2 dias antes da chegada. Uma penalidade de toda a estadia incluindo impostos será cobrado por cancelamento/modificação tardio, não comparência ou partida antecipada.</p>
                                            </div>
                                        </section>

                                        <div className="space-y-4 mb-10">
                                            <div className="flex items-center gap-3">
                                                <input type="checkbox" id="terms" checked={bookingForm.aceitouTermos} onChange={e => setBookingForm({ ...bookingForm, aceitouTermos: e.target.checked })} className="w-4 h-4 accent-carapita-gold" />
                                                <label htmlFor="terms" className="text-[10px] uppercase tracking-widest text-gray-700 cursor-pointer">Reconhecimento de que concordo com os termos de privacidade e condições de Reserva</label>
                                            </div>
                                        </div>

                                        <div className="flex justify-between pt-8 border-t border-gray-100">
                                            <button onClick={() => setBookingStep('details')} className="text-[10px] uppercase tracking-widest text-gray-400 hover:text-carapita-dark">Voltar</button>
                                            <button
                                                onClick={handleConfirmarReserva}
                                                disabled={!bookingForm.aceitouTermos}
                                                className={`px-12 py-5 text-[11px] uppercase tracking-mega font-bold transition-all ${bookingForm.aceitouTermos ? 'bg-carapita-gold text-white hover:bg-carapita-dark shadow-xl' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
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
                                        <div className="border border-carapita-gold/20 p-8 bg-carapita-goldLight/10">
                                            <h4 className="text-[10px] uppercase tracking-mega font-bold text-carapita-dark mb-4">Extras Selecionados</h4>
                                            <ul className="space-y-3 text-[10px] text-carapita-dark font-medium uppercase tracking-widest">
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

                                    <div className="border border-gray-100 p-8 shadow-sm">
                                        <h4 className="text-[10px] uppercase tracking-mega font-bold text-carapita-dark mb-4">Porquê reservar connosco?</h4>
                                        <ul className="space-y-4 text-[10px] text-carapita-muted font-sans uppercase tracking-widest leading-relaxed">
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

            {/* === MODAL DE LOGIN GUEST === */}
            {showGuestLoginModal && (
                <div className="fixed inset-0 z-[500] flex items-center justify-center p-6 backdrop-blur-sm bg-carapita-dark/20">
                    <div className="absolute inset-0" onClick={() => setShowGuestLoginModal(false)} />
                    <div className="relative bg-white w-full max-w-md p-10 animate-fade-in shadow-3xl">
                        <button onClick={() => setShowGuestLoginModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-carapita-dark"><X size={20} /></button>
                        <h4 className="text-[10px] uppercase tracking-mega text-carapita-gold font-bold mb-2">Acesso Rápido</h4>
                        <h2 className="font-serif text-2xl text-carapita-dark mb-6">Inicie sessão para reservar</h2>
                        <form onSubmit={handleGuestLogin} className="space-y-6">
                            <div>
                                <label className="text-[10px] uppercase text-gray-400 block mb-2">E-mail</label>
                                <input name="email" type="email" required className="w-full border-b border-gray-200 py-3 text-sm focus:border-carapita-gold outline-none" placeholder="joao@exemplo.com" />
                            </div>
                            <div>
                                <label className="text-[10px] uppercase text-gray-400 block mb-2">Senha</label>
                                <input name="password" type="password" required className="w-full border-b border-gray-200 py-3 text-sm focus:border-carapita-gold outline-none" />
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
                    className="fixed inset-0 z-[1000] bg-black/95 flex items-center justify-center"
                    onClick={() => setLightboxFotos([])}
                >
                    <button
                        className="absolute top-8 right-8 text-white/70 hover:text-white z-10 w-12 h-12 flex items-center justify-center bg-white/10 rounded-full"
                        onClick={() => setLightboxFotos([])}
                    ><X size={24} /></button>
                    <img src={lightboxFotos[lightboxIdx]} alt="" className="max-h-[85vh] max-w-[90vw] object-contain shadow-2xl" onClick={e => e.stopPropagation()} />
                    {lightboxFotos.length > 1 && (
                        <>
                            <button className="absolute left-8 top-1/2 -translate-y-1/2 w-14 h-14 bg-white/10 hover:bg-white/25 text-white flex items-center justify-center rounded-full transition-all" onClick={e => { e.stopPropagation(); setLightboxIdx(i => (i - 1 + lightboxFotos.length) % lightboxFotos.length); }}><ChevronRight size={24} className="rotate-180" /></button>
                            <button className="absolute right-8 top-1/2 -translate-y-1/2 w-14 h-14 bg-white/10 hover:bg-white/25 text-white flex items-center justify-center rounded-full transition-all" onClick={e => { e.stopPropagation(); setLightboxIdx(i => (i + 1) % lightboxFotos.length); }}><ChevronRight size={24} /></button>
                        </>
                    )}
                </div>
            )}

        </main>
    );
}
