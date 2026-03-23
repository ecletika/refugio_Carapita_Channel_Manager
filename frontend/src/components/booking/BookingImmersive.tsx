import React, { useState, useEffect } from 'react';
import { X, Calendar, Search, Users, CircleCheck, Check } from 'lucide-react';
import Step1Selection from './Step1Selection';
import Step2Rates from './Step2Rates';
import Step3Extras from './Step3Extras';
import Step4Details from './Step4Details';
import Step5Success from './Step5Success';
import SummarySidebar from './SummarySidebar';
import GuestsDrawer from './GuestsDrawer';
import PromoCodeDrawer from './PromoCodeDrawer';
import { useBookingStore } from '@/store/bookingStore';

interface BookingImmersiveProps {
    t: (key: string) => string;
    lang: string;
    setShowBookingScreen: (v: boolean) => void;
    quartosEncontrados: any[] | null;
    fetchCalendario: (id: string, start?: string, end?: string) => void;
    calendarioPrecos: any[];
    extrasTelaAtiva: boolean;
    disponiveisExtras: any[];
    countries: string[];
    isGuestLoggedIn: boolean;
    setShowGuestLoginModal: (v: boolean) => void;
    setLightboxFotos: (fotos: string[]) => void;
    setLightboxIdx: (idx: number) => void;
    parseFotos: (fotos: string | undefined) => any[];
}

export default function BookingImmersive({
    t,
    lang,
    setShowBookingScreen,
    quartosEncontrados,
    fetchCalendario,
    calendarioPrecos,
    extrasTelaAtiva,
    disponiveisExtras,
    countries,
    isGuestLoggedIn,
    setShowGuestLoginModal,
    setLightboxFotos,
    setLightboxIdx,
    parseFotos
}: BookingImmersiveProps) {
    const { 
        checkIn, checkOut, setDates,
        adultos, criancas, setGuests,
        codigoPromocional, setPromoCode
    } = useBookingStore();

    const [bookingStep, setBookingStep] = useState('selection');
    const [idQuartoParaReserva, setIdQuartoParaReserva] = useState<string | null>(null);
    const [selectedExtras, setSelectedExtras] = useState<string[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isFetchingProfile, setIsFetchingProfile] = useState(false);
    const [cupomAplicado, setCupomAplicado] = useState<any>(null);
    const [visibleAdditionalGuests, setVisibleAdditionalGuests] = useState(0);
    const [isGuestsDrawerOpen, setIsGuestsDrawerOpen] = useState(false);
    const [isPromoDrawerOpen, setIsPromoDrawerOpen] = useState(false);

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
        estrangeiro: false,
        data_nascimento: '',
        local_nascimento: '',
        nacionalidade: '',
        tipo_documento: 'Passaporte',
        numero_documento: '',
        pais_emissor_documento: '',
        criarConta: false,
        senha: '',
        confirmarSenha: '',
        requerimentosEspeciais: '',
        aceitouTermos: false,
        dependentes: [] as { nome: string; sobrenome: string }[]
    });

    const hospedes = adultos + criancas;

    const calculateRoomTotal = (q: any) => {
        if (!checkIn || !checkOut || !q) return Number(q?.preco_base || 0);
        let subtotal = 0;
        const start = new Date(`${checkIn}T00:00:00.000Z`);
        const end = new Date(`${checkOut}T00:00:00.000Z`);
        let current = new Date(start);
        while (current < end) {
            const dateStr = current.toISOString().split('T')[0];
            const diaPrice = calendarioPrecos.find(p => p.data === dateStr);
            subtotal += diaPrice ? Number(diaPrice.preco) : Number(q.preco_base);
            current.setUTCDate(current.getUTCDate() + 1);
        }
        return subtotal || Number(q.preco_base);
    };

    const totalEstadia = () => {
        if (!checkIn || !checkOut || !idQuartoParaReserva) return 0;
        const q = quartosEncontrados?.find(r => r.id === idQuartoParaReserva);
        if (!q) return 0;
        const subtotal = calculateRoomTotal(q);
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
            subtotal += diaPrice ? Number(diaPrice.preco) : Number(q.preco_base);
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
        if (extrasTelaAtiva && disponiveisExtras.length > 0) setBookingStep('extras');
        else setBookingStep('details');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // Auto-preenchimento ao estar logado
    useEffect(() => {
        const fetchHospedeData = async () => {
            if (isGuestLoggedIn && bookingStep === 'details' && !bookingForm.email) {
                setIsFetchingProfile(true);
                try {
                    const token = localStorage.getItem('guestToken');
                    if (!token) return;
                    
                    const resp = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/hospede/me`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    const resJson = await resp.json();
                    
                    if (resJson.status === 'success' && resJson.data) {
                        const h = resJson.data;
                        setBookingForm(prev => ({
                            ...prev,
                            nome: h.nome || '',
                            sobrenome: h.sobrenome || '',
                            email: h.email || '',
                            telefone: h.telefone || '',
                            pais: h.pais || 'Portugal',
                            cidade: h.cidade || '',
                            endereco1: h.endereco1 || '',
                            endereco2: h.endereco2 || '',
                            cep: h.cep || '',
                            data_nascimento: h.data_nascimento ? h.data_nascimento.split('T')[0] : '',
                            local_nascimento: h.local_nascimento || '',
                            nacionalidade: h.nacionalidade || '',
                            tipo_documento: h.tipo_documento || 'Passaporte',
                            numero_documento: h.numero_documento || '',
                            pais_emissor_documento: h.pais_emissor_documento || '',
                            estrangeiro: !!h.estrangeiro,
                            requerimentosEspeciais: prev.requerimentosEspeciais,
                            aceitouTermos: prev.aceitouTermos,
                            dependentes: h.dependentes && h.dependentes.length > 0 ? h.dependentes : prev.dependentes
                        }));
                    }
                } catch (e) {
                    console.error("Erro ao carregar perfil para auto-fill:", e);
                } finally {
                    setIsFetchingProfile(false);
                }
            }
        };

        fetchHospedeData();
    }, [isGuestLoggedIn, bookingStep]);


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
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 60000);
        try {
            const body = {
                quartoId: idQuartoParaReserva,
                checkIn,
                checkOut,
                canalNome: 'SITE',
                hospede: { ...bookingForm, senha: bookingForm.criarConta ? bookingForm.senha : undefined },
                extrasIds: selectedExtras,
                requerimentosEspeciais: bookingForm.requerimentosEspeciais,
                metodoPagamento: 'PENDENTE',
                cupomCodigo: cupomAplicado?.codigo,
                adultos,
                criancas
            };
            const resp = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/reservas`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
                signal: controller.signal
            });
            const data = await resp.json();
            if (data.status === 'success') setBookingStep('success');
            else alert(data.error || "Erro ao criar reserva");
        } catch (e: any) {
            if (e?.name === 'AbortError') {
                alert("O servidor demorou demasiado a responder. Por favor tente novamente.");
            } else {
                alert("Erro de conexão ao criar reserva");
            }
        } finally {
            clearTimeout(timeoutId);
            setIsSubmitting(false);
        }
    };

    const steps = [
        { step: 'selection', label: t('menu_alojamento'), icon: <Search size={14} /> },
        { step: 'extras', label: t('booking_step_personalize'), icon: <Calendar size={14} /> },
        { step: 'details', label: t('booking_step_details'), icon: <Users size={14} /> },
        { step: 'payment', label: t('booking_step_payment'), icon: <CircleCheck size={14} /> }
    ];

    return (
        <div className="fixed inset-0 z-[100] bg-carapita-green overflow-y-auto scrollbar-hide py-10">
            <div className="max-w-[1400px] mx-auto px-4 md:px-8 mb-10">
                <div className="flex items-center justify-between border-b border-white/10 pb-6">
                    <div className="flex items-center gap-6 overflow-x-auto no-scrollbar py-2">
                        {steps.map((s, idx) => (
                            <div key={s.step} className="flex items-center shrink-0">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center border text-[10px] font-bold mr-3 transition-all duration-500 ${
                                    bookingStep === s.step ? 'bg-carapita-gold border-carapita-gold text-carapita-dark' : 
                                    idx < ['selection', 'extras', 'details', 'payment'].indexOf(bookingStep) ? 'bg-white/10 border-white/20 text-white/40' : 'bg-transparent border-white/20 text-white/40'
                                }`}>
                                    {s.icon}
                                </div>
                                <span className={`text-[9px] uppercase tracking-widest font-bold ${bookingStep === s.step ? 'text-white' : 'text-white/20'}`}>
                                    {s.label}
                                </span>
                                {idx < 3 && <div className="w-4 h-px bg-white/10 ml-2"></div>}
                            </div>
                        ))}
                    </div>
                    <button onClick={() => setShowBookingScreen(false)} className="bg-white/5 hover:bg-carapita-gold hover:text-carapita-dark p-2 rounded-full text-white backdrop-blur transition-all border border-white/10">
                        <X size={18} />
                    </button>
                </div>
            </div>

            <div className="max-w-[1400px] mx-auto py-6 px-4 md:px-8">
                <div className="flex flex-col lg:flex-row gap-8 items-start">
                    <div className="flex-1 w-full min-w-0">
                        {bookingStep === 'selection' && (
                            <Step1Selection 
                                checkIn={checkIn} checkOut={checkOut} setDates={setDates}
                                quartosEncontrados={quartosEncontrados} fetchCalendario={fetchCalendario}
                                adultos={adultos} criancas={criancas} 
                                setIsGuestsDrawerOpen={setIsGuestsDrawerOpen}
                                cupomAplicado={cupomAplicado}
                                setIsPromoDrawerOpen={setIsPromoDrawerOpen}
                                setBookingStep={setBookingStep}
                            />
                        )}
                        {bookingStep === 'rates' && (
                            <Step2Rates 
                                t={t} lang={lang} quartosEncontrados={quartosEncontrados}
                                checkIn={checkIn!} checkOut={checkOut!} setCheckIn={(d) => setDates(d, checkOut)} setCheckOut={(d) => setDates(checkIn, d)}
                                fetchCalendario={fetchCalendario} adultos={adultos} criancas={criancas}
                                setBookingStep={setBookingStep} calculateRoomTotal={calculateRoomTotal}
                                cupomAplicado={cupomAplicado} iniciarReserva={iniciarReserva}
                                setLightboxFotos={setLightboxFotos} setLightboxIdx={setLightboxIdx} parseFotos={parseFotos}
                            />
                        )}
                        {bookingStep === 'extras' && (
                            <Step3Extras 
                                t={t} lang={lang} disponiveisExtras={disponiveisExtras}
                                selectedExtras={selectedExtras} setSelectedExtras={setSelectedExtras}
                                setBookingStep={setBookingStep}
                            />
                        )}
                        {bookingStep === 'details' && (
                            <Step4Details 
                                t={t} lang={lang} isGuestLoggedIn={isGuestLoggedIn} 
                                setShowGuestLoginModal={setShowGuestLoginModal}
                                bookingForm={bookingForm} setBookingForm={setBookingForm}
                                countries={countries} hospedes={hospedes}
                                visibleAdditionalGuests={visibleAdditionalGuests} setVisibleAdditionalGuests={setVisibleAdditionalGuests}
                                extrasTelaAtiva={extrasTelaAtiva} disponiveisExtras={disponiveisExtras}
                                setBookingStep={setBookingStep} handleConfirmarReserva={handleConfirmarReserva}
                                isSubmitting={isSubmitting}
                            />
                        )}
                        {bookingStep === 'success' && (
                            <Step5Success 
                                setShowBookingScreen={setShowBookingScreen}
                                setBookingStep={setBookingStep}
                                setSelectedExtras={setSelectedExtras}
                                setBookingForm={setBookingForm}
                            />
                        )}
                    </div>

                    {(bookingStep === 'extras' || bookingStep === 'details') && (
                        <SummarySidebar 
                            t={t} cupomAplicado={cupomAplicado} totalEstadia={totalEstadia}
                            valorDesconto={valorDesconto} checkIn={checkIn} checkOut={checkOut}
                            hospedes={hospedes} selectedExtras={selectedExtras} disponiveisExtras={disponiveisExtras}
                        />
                    )}
                </div>
            </div>

            <GuestsDrawer 
                isOpen={isGuestsDrawerOpen} 
                onClose={() => setIsGuestsDrawerOpen(false)} 
                adultos={adultos} 
                criancas={criancas} 
                setGuests={setGuests} 
            />
            
            <PromoCodeDrawer 
                isOpen={isPromoDrawerOpen} 
                onClose={() => setIsPromoDrawerOpen(false)} 
                setCupomAplicado={setCupomAplicado} 
                lang={lang} 
            />
        </div>
    );
}
