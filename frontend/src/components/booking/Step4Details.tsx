import React from 'react';
import { ChevronLeft, User, Plus, Check } from 'lucide-react';

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
    estrangeiro: boolean;
    data_nascimento: string;
    local_nascimento: string;
    nacionalidade: string;
    tipo_documento: string;
    numero_documento: string;
    pais_emissor_documento: string;
    criarConta: boolean;
    senha?: string;
    confirmarSenha?: string;
    requerimentosEspeciais: string;
    aceitouTermos: boolean;
    dependentes: { nome: string; sobrenome: string }[];
}

interface Step4DetailsProps {
    t: (key: string) => string;
    lang: string;
    isGuestLoggedIn: boolean;
    setShowGuestLoginModal: (v: boolean) => void;
    bookingForm: BookingForm;
    setBookingForm: React.Dispatch<React.SetStateAction<BookingForm>>;
    countries: string[];
    hospedes: number;
    visibleAdditionalGuests: number;
    setVisibleAdditionalGuests: (v: (prev: number) => number) => void;
    extrasTelaAtiva: boolean;
    disponiveisExtras: any[];
    setBookingStep: (step: string) => void;
    handleConfirmarReserva: () => void;
    isSubmitting: boolean;
}

const DDI_MAP: Record<string, string> = {
    "Portugal": "+351",
    "Brasil": "+55",
    "Espanha": "+34",
    "França": "+33",
    "Reino Unido": "+44",
    "Alemanha": "+49",
    "Itália": "+39",
    "Estados Unidos": "+1",
    "Canadá": "+1",
    "Suíça": "+41",
    "Angola": "+244",
    "Moçambique": "+258",
    "Cabo Verde": "+238",
    "São Tomé e Príncipe": "+239",
    "Guiné-Bissau": "+245",
    "Timor-Leste": "+670",
    "Bélgica": "+32",
    "Países Baixos": "+31",
    "Áustria": "+43",
    "Irlanda": "+353",
    "Luxemburgo": "+352"
};

export default function Step4Details({
    t,
    lang,
    isGuestLoggedIn,
    setShowGuestLoginModal,
    bookingForm,
    setBookingForm,
    countries,
    hospedes,
    visibleAdditionalGuests,
    setVisibleAdditionalGuests,
    extrasTelaAtiva,
    disponiveisExtras,
    setBookingStep,
    handleConfirmarReserva,
    isSubmitting
}: Step4DetailsProps) {
    return (
        <div className="animate-fade-in font-sans">
            <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                <h2 className="font-serif text-2xl text-white uppercase tracking-widest">{t('booking_title_details')}</h2>
                {!isGuestLoggedIn && (
                    <button
                        onClick={() => setShowGuestLoginModal(true)}
                        className="text-[10px] uppercase tracking-widest font-bold border border-carapita-gold text-carapita-gold px-6 py-2 hover:bg-carapita-gold hover:text-white transition-all shadow-sm"
                    >
                        {lang === 'PT' ? 'Já tem conta? Inicie sessão' : 'Already have an account? Log in'}
                    </button>
                )}
            </div>

            <div className="space-y-6">
                <section className="bg-carapita-gold/10 p-6 border border-carapita-gold/30 rounded-2xl">
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
                    <h4 className="text-[9px] uppercase tracking-mega text-carapita-gold font-bold mb-4 border-b border-white/10 pb-2">{t('form_info_contacto')}</h4>
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
                    <h4 className="text-[9px] uppercase tracking-mega text-carapita-gold font-bold mb-4 border-b border-white/10 pb-2">{t('form_faturacao')}</h4>
                    <div className="grid grid-cols-2 gap-6 text-sm">
                        <div className="col-span-2 lg:col-span-1">
                            <label className="text-[10px] uppercase text-white/40 block mb-2">{t('form_pais')}</label>
                            <select 
                                value={bookingForm.pais} 
                                onChange={e => {
                                    const selectedPais = e.target.value;
                                    const ddi = DDI_MAP[selectedPais];
                                    setBookingForm(prev => ({ 
                                        ...prev, 
                                        pais: selectedPais,
                                        telefone: ddi ? (prev.telefone.startsWith('+') ? ddi + prev.telefone.replace(/^\+\d+/, '') : ddi + ' ' + prev.telefone) : prev.telefone
                                    }));
                                }} 
                                className="w-full border-b border-white/20 py-3 focus:border-carapita-gold outline-none bg-transparent appearance-none text-white scrollbar-thin scrollbar-thumb-carapita-gold"
                            >
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

                <section className="bg-white/5 p-6 border border-white/10">
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
    );
}
