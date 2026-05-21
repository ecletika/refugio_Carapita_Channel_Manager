"use client";
import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
    User, CalendarDays, CreditCard, ChevronRight, ChevronLeft,
    CheckCircle2, Home, Phone, Mail, MapPin, Hash, StickyNote,
    Sparkles, CircleDot, X, AlertCircle
} from 'lucide-react';
import AdminSidebar from '@/components/AdminSidebar';

const EDGE_URL = 'https://vuidkeygtxfbgxvmilya.supabase.co/functions/v1';

const PAISES = ['Portugal','Brasil','Espanha','França','Reino Unido','Alemanha','Itália',
    'Estados Unidos','Canadá','Suíça','Angola','Cabo Verde','Moçambique','Irlanda','Bélgica','Outro'];

interface Quarto { id: string; nome: string; preco_base: number; capacidade: number; descricao?: string; }
interface Extra { id: string; nome: string; preco: number; icone?: string; }

const STEPS = [
    { id: 1, label: 'Hóspede',   icon: User },
    { id: 2, label: 'Estadia',   icon: CalendarDays },
    { id: 3, label: 'Detalhes',  icon: CreditCard },
];

export default function NovaReservaManual() {
    const router = useRouter();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [loadingData, setLoadingData] = useState(true);
    const [quartos, setQuartos] = useState<Quarto[]>([]);
    const [extras, setExtras] = useState<Extra[]>([]);
    const [erro, setErro] = useState('');
    const [reservaCriada, setReservaCriada] = useState<any>(null);

    const [form, setForm] = useState({
        quartoId: '',
        checkIn: '',
        checkOut: '',
        canalNome: 'BALCÃO',
        metodoPagamento: 'DINHEIRO',
        requerimentosEspeciais: '',
        extrasIds: [] as string[],
        hospede: {
            nome: '', sobrenome: '', email: '',
            telefone: '', pais: 'Portugal', numero_documento: '',
        },
    });

    // ── carregar dados com auth ──────────────────────────────────────────────
    useEffect(() => {
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
        const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };
        Promise.all([
            fetch(`${EDGE_URL}/admin-quartos`, { headers }).then(r => r.json()),
            fetch(`${EDGE_URL}/admin-extras`,  { headers }).then(r => r.json()),
        ]).then(([qData, eData]) => {
            if (qData.status === 'success') setQuartos(qData.data || []);
            if (eData.status === 'success') setExtras(eData.data || []);
        }).catch(console.error)
          .finally(() => setLoadingData(false));
    }, []);

    // ── cálculo de preço em tempo real ──────────────────────────────────────
    const { noites, precoBase, precoExtras, total } = useMemo(() => {
        const q = quartos.find(q => q.id === form.quartoId);
        const noites = (form.checkIn && form.checkOut)
            ? Math.max(0, Math.ceil((new Date(form.checkOut).getTime() - new Date(form.checkIn).getTime()) / 86400000))
            : 0;
        const precoBase = q ? Number(q.preco_base) * noites : 0;
        const selecionados = extras.filter(e => form.extrasIds.includes(e.id));
        const precoExtras = selecionados.reduce((s, e) => s + Number(e.preco), 0);
        return { noites, precoBase, precoExtras, total: precoBase + precoExtras };
    }, [form.quartoId, form.checkIn, form.checkOut, form.extrasIds, quartos, extras]);

    const setH = (field: string, val: string) =>
        setForm(p => ({ ...p, hospede: { ...p.hospede, [field]: val } }));

    const toggleExtra = (id: string) =>
        setForm(p => ({
            ...p,
            extrasIds: p.extrasIds.includes(id) ? p.extrasIds.filter(x => x !== id) : [...p.extrasIds, id]
        }));

    // ── validações por step ─────────────────────────────────────────────────
    const canProceed = () => {
        if (step === 1) return form.hospede.nome.trim() && form.hospede.email.trim();
        if (step === 2) return form.quartoId && form.checkIn && form.checkOut && noites > 0;
        return true;
    };

    // ── submissão ───────────────────────────────────────────────────────────
    const handleSubmit = async () => {
        setErro('');
        setLoading(true);
        const token = localStorage.getItem('token');
        try {
            const payload = {
                quartoId: form.quartoId,
                checkIn:  form.checkIn,
                checkOut: form.checkOut,
                canalNome: form.canalNome,
                metodoPagamento: form.metodoPagamento,
                requerimentosEspeciais: form.requerimentosEspeciais || null,
                extrasIds: form.extrasIds.length > 0 ? form.extrasIds : [],
                hospede: {
                    nome:             form.hospede.nome,
                    sobrenome:        form.hospede.sobrenome || '',
                    email:            form.hospede.email,
                    telefone:         form.hospede.telefone || null,
                    pais:             form.hospede.pais,
                    numero_documento: form.hospede.numero_documento || null,
                },
            };
            const resp = await fetch(`${EDGE_URL}/reservas-criar`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            const data = await resp.json();
            if (data.status === 'success') {
                setReservaCriada(data.data);
            } else {
                setErro(data.error || 'Erro ao criar reserva. Verifique os dados.');
            }
        } catch {
            setErro('Erro de comunicação com o servidor.');
        } finally {
            setLoading(false);
        }
    };

    const quartoSelecionado = quartos.find(q => q.id === form.quartoId);

    // ── SUCESSO ─────────────────────────────────────────────────────────────
    if (reservaCriada) {
        return (
            <div className="min-h-screen bg-[#F9F8F6]">
                <AdminSidebar />
                <div className="ml-20 flex items-center justify-center min-h-screen p-8">
                    <div className="max-w-lg w-full text-center">
                        <div className="w-20 h-20 rounded-full bg-[#1E3932] flex items-center justify-center mx-auto mb-8">
                            <CheckCircle2 size={36} className="text-[#C4A484]" />
                        </div>
                        <h2 className="text-3xl font-serif text-[#1E3932] mb-2">Reserva Criada!</h2>
                        <p className="text-gray-400 text-sm mb-8">A reserva foi registada com sucesso no sistema.</p>

                        <div className="bg-[#1E3932] text-white p-8 mb-6 text-left">
                            <div className="text-center mb-6">
                                <span className="text-[10px] uppercase tracking-widest text-[#C4A484]/70 block">Número de Reserva</span>
                                <span className="text-2xl font-mono font-bold text-[#C4A484]">{reservaCriada.numero_reserva}</span>
                            </div>
                            <div className="grid grid-cols-2 gap-4 text-xs">
                                <div><span className="text-white/40 uppercase tracking-widest block mb-1">Hóspede</span><span className="font-medium">{form.hospede.nome} {form.hospede.sobrenome}</span></div>
                                <div><span className="text-white/40 uppercase tracking-widest block mb-1">Email</span><span className="font-medium">{form.hospede.email}</span></div>
                                <div><span className="text-white/40 uppercase tracking-widest block mb-1">Check-in</span><span className="font-medium">{form.checkIn}</span></div>
                                <div><span className="text-white/40 uppercase tracking-widest block mb-1">Check-out</span><span className="font-medium">{form.checkOut}</span></div>
                                <div><span className="text-white/40 uppercase tracking-widest block mb-1">Total</span><span className="text-[#C4A484] font-bold text-base">€{total.toFixed(2)}</span></div>
                                <div><span className="text-white/40 uppercase tracking-widest block mb-1">Estado</span><span className="text-green-400 font-bold uppercase text-[10px] tracking-widest">Confirmada</span></div>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <button onClick={() => router.push('/admin/reservas')}
                                className="flex-1 border border-[#1E3932] text-[#1E3932] py-3 text-[10px] uppercase tracking-widest hover:bg-[#1E3932] hover:text-white transition-colors duration-300 cursor-pointer">
                                Ver Todas as Reservas
                            </button>
                            <button onClick={() => { setReservaCriada(null); setStep(1); setForm({ quartoId:'', checkIn:'', checkOut:'', canalNome:'BALCÃO', metodoPagamento:'DINHEIRO', requerimentosEspeciais:'', extrasIds:[], hospede:{nome:'',sobrenome:'',email:'',telefone:'',pais:'Portugal',numero_documento:''} }); }}
                                className="flex-1 bg-[#C4A484] text-white py-3 text-[10px] uppercase tracking-widest hover:bg-[#1E3932] transition-colors duration-300 cursor-pointer">
                                Nova Reserva
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // ── FORMULÁRIO ──────────────────────────────────────────────────────────
    return (
        <div className="min-h-screen bg-[#F9F8F6]">
            <AdminSidebar />

            <div className="ml-20 p-8 xl:p-12">
                {/* Header */}
                <div className="mb-10 flex items-start justify-between flex-wrap gap-4">
                    <div>
                        <span className="text-[#C4A484] text-[10px] uppercase tracking-mega font-bold block mb-1">Recepção</span>
                        <h1 className="text-4xl font-serif text-[#1E3932]">Nova Reserva Manual</h1>
                    </div>
                    <button onClick={() => router.push('/admin/reservas')}
                        className="flex items-center gap-2 text-gray-400 hover:text-[#1E3932] transition-colors text-[10px] uppercase tracking-widest cursor-pointer">
                        <X size={14} /> Cancelar
                    </button>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-[1fr_340px] gap-8 max-w-6xl">

                    {/* ── Painel Principal ── */}
                    <div>
                        {/* Steps */}
                        <div className="flex gap-0 mb-8 overflow-hidden border border-gray-200">
                            {STEPS.map((s, i) => {
                                const Icon = s.icon;
                                const active = step === s.id;
                                const done   = step > s.id;
                                return (
                                    <button key={s.id} onClick={() => done ? setStep(s.id) : undefined}
                                        className={`flex-1 flex items-center justify-center gap-2 py-4 text-[10px] uppercase tracking-widest font-bold transition-all duration-300 cursor-pointer
                                            ${active ? 'bg-[#1E3932] text-[#C4A484]' : done ? 'bg-[#FAF8F4] text-[#1E3932] hover:bg-[#1E3932]/5' : 'bg-white text-gray-300'}
                                            ${i > 0 ? 'border-l border-gray-200' : ''}`}>
                                        {done ? <CheckCircle2 size={14} className="text-[#C4A484]" /> : <Icon size={14} />}
                                        <span className="hidden sm:inline">{s.label}</span>
                                        <span className="sm:hidden">{s.id}</span>
                                    </button>
                                );
                            })}
                        </div>

                        {/* Card */}
                        <div className="bg-white border border-gray-100 shadow-sm">

                            {/* STEP 1 — Hóspede */}
                            {step === 1 && (
                                <div className="p-8 md:p-10">
                                    <div className="flex items-center gap-3 mb-8 pb-6 border-b border-gray-50">
                                        <div className="w-8 h-8 rounded-full bg-[#1E3932] flex items-center justify-center">
                                            <User size={14} className="text-[#C4A484]" />
                                        </div>
                                        <div>
                                            <h2 className="font-serif text-xl text-[#1E3932]">Informações do Hóspede</h2>
                                            <p className="text-[10px] text-gray-400 uppercase tracking-widest mt-0.5">Dados de identificação</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-7">
                                        <Field label="Nome *" value={form.hospede.nome} onChange={v => setH('nome', v)} placeholder="João" />
                                        <Field label="Apelido" value={form.hospede.sobrenome} onChange={v => setH('sobrenome', v)} placeholder="Silva" />
                                        <Field label="Email *" type="email" value={form.hospede.email} onChange={v => setH('email', v)} placeholder="joao@email.com" icon={<Mail size={13} />} />
                                        <Field label="Telefone" type="tel" value={form.hospede.telefone} onChange={v => setH('telefone', v)} placeholder="+351 912 345 678" icon={<Phone size={13} />} />
                                        <Field label="Nº Documento" value={form.hospede.numero_documento} onChange={v => setH('numero_documento', v)} placeholder="AB123456" icon={<Hash size={13} />} />
                                        <SelectField label="País" value={form.hospede.pais} onChange={v => setH('pais', v)} options={PAISES} icon={<MapPin size={13} />} />
                                    </div>
                                </div>
                            )}

                            {/* STEP 2 — Estadia */}
                            {step === 2 && (
                                <div className="p-8 md:p-10">
                                    <div className="flex items-center gap-3 mb-8 pb-6 border-b border-gray-50">
                                        <div className="w-8 h-8 rounded-full bg-[#1E3932] flex items-center justify-center">
                                            <CalendarDays size={14} className="text-[#C4A484]" />
                                        </div>
                                        <div>
                                            <h2 className="font-serif text-xl text-[#1E3932]">Estadia e Alojamento</h2>
                                            <p className="text-[10px] text-gray-400 uppercase tracking-widest mt-0.5">Datas e quarto</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-6 mb-10">
                                        <Field label="Check-in *" type="date" value={form.checkIn}
                                            onChange={v => setForm(p => ({ ...p, checkIn: v }))} />
                                        <Field label="Check-out *" type="date" value={form.checkOut}
                                            onChange={v => setForm(p => ({ ...p, checkOut: v }))} />
                                    </div>

                                    {noites > 0 && (
                                        <div className="flex items-center gap-2 mb-8 text-[#C4A484]">
                                            <CircleDot size={12} />
                                            <span className="text-[11px] uppercase tracking-widest font-bold">{noites} {noites === 1 ? 'noite' : 'noites'} seleccionadas</span>
                                        </div>
                                    )}

                                    <div>
                                        <label className="text-[10px] uppercase tracking-widest text-gray-400 font-bold block mb-4">
                                            Selecionar Alojamento *
                                        </label>
                                        {loadingData ? (
                                            <div className="text-center py-12 text-gray-300 text-sm">A carregar alojamentos...</div>
                                        ) : (
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                {quartos.map(q => (
                                                    <button key={q.id} onClick={() => setForm(p => ({ ...p, quartoId: q.id }))}
                                                        className={`text-left p-6 border transition-all duration-200 cursor-pointer group
                                                            ${form.quartoId === q.id
                                                                ? 'border-[#C4A484] bg-[#1E3932] text-white'
                                                                : 'border-gray-100 hover:border-[#C4A484]/50 bg-white'}`}>
                                                        <div className="flex justify-between items-start mb-3">
                                                            <Home size={16} className={form.quartoId === q.id ? 'text-[#C4A484]' : 'text-gray-300'} />
                                                            {form.quartoId === q.id && <CheckCircle2 size={14} className="text-[#C4A484]" />}
                                                        </div>
                                                        <h4 className={`font-serif text-lg mb-1 ${form.quartoId === q.id ? 'text-white' : 'text-[#1E3932]'}`}>{q.nome}</h4>
                                                        <div className="flex justify-between items-center">
                                                            <span className={`text-[10px] uppercase tracking-widest ${form.quartoId === q.id ? 'text-white/50' : 'text-gray-300'}`}>{q.capacidade} hóspedes</span>
                                                            <span className="text-[#C4A484] font-bold text-sm">€{Number(q.preco_base).toFixed(0)}/noite</span>
                                                        </div>
                                                        {noites > 0 && (
                                                            <div className={`mt-3 pt-3 border-t text-[10px] tracking-widest ${form.quartoId === q.id ? 'border-white/10 text-[#C4A484]' : 'border-gray-50 text-gray-300'}`}>
                                                                {noites}n × €{Number(q.preco_base).toFixed(0)} = <strong>€{(Number(q.preco_base) * noites).toFixed(2)}</strong>
                                                            </div>
                                                        )}
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* STEP 3 — Detalhes */}
                            {step === 3 && (
                                <div className="p-8 md:p-10">
                                    <div className="flex items-center gap-3 mb-8 pb-6 border-b border-gray-50">
                                        <div className="w-8 h-8 rounded-full bg-[#1E3932] flex items-center justify-center">
                                            <CreditCard size={14} className="text-[#C4A484]" />
                                        </div>
                                        <div>
                                            <h2 className="font-serif text-xl text-[#1E3932]">Pagamento e Extras</h2>
                                            <p className="text-[10px] text-gray-400 uppercase tracking-widest mt-0.5">Canal, pagamento e serviços</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-7 mb-10">
                                        <SelectField label="Canal de Origem" value={form.canalNome}
                                            onChange={v => setForm(p => ({ ...p, canalNome: v }))}
                                            options={['BALCÃO','TELEFONE','EMAIL','WHATSAPP']}
                                            labels={['Balcão / Recepção','Telefone','E-mail','WhatsApp']} />
                                        <SelectField label="Meio de Pagamento" value={form.metodoPagamento}
                                            onChange={v => setForm(p => ({ ...p, metodoPagamento: v }))}
                                            options={['DINHEIRO','MBWAY','MULTIBANCO','TRANSFERENCIA','STRIPE']}
                                            labels={['Dinheiro','MBWay','Multibanco','Transferência Bancária','Cartão via Stripe']} />
                                    </div>

                                    {extras.length > 0 && (
                                        <div className="mb-10">
                                            <label className="text-[10px] uppercase tracking-widest text-gray-400 font-bold block mb-4 flex items-center gap-2">
                                                <Sparkles size={12} className="text-[#C4A484]" /> Serviços Adicionais
                                            </label>
                                            <div className="flex flex-wrap gap-2">
                                                {extras.map(e => (
                                                    <button key={e.id} onClick={() => toggleExtra(e.id)}
                                                        className={`px-4 py-2.5 text-[10px] uppercase tracking-widest transition-all duration-200 cursor-pointer border
                                                            ${form.extrasIds.includes(e.id)
                                                                ? 'bg-[#1E3932] text-[#C4A484] border-[#1E3932]'
                                                                : 'border-gray-200 text-gray-400 hover:border-[#C4A484] hover:text-[#C4A484]'}`}>
                                                        {form.extrasIds.includes(e.id) ? <CheckCircle2 size={10} className="inline mr-1" /> : <X size={10} className="inline mr-1" />}
                                                        {e.nome} +€{Number(e.preco).toFixed(0)}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    <div>
                                        <label className="text-[10px] uppercase tracking-widest text-gray-400 font-bold block mb-2 flex items-center gap-2">
                                            <StickyNote size={12} /> Notas Internas
                                        </label>
                                        <textarea rows={3}
                                            className="w-full border border-gray-100 bg-[#FAF8F4] p-4 text-sm outline-none focus:border-[#C4A484] transition-colors resize-none"
                                            value={form.requerimentosEspeciais}
                                            onChange={e => setForm(p => ({ ...p, requerimentosEspeciais: e.target.value }))}
                                            placeholder="Observações, pedidos especiais, notas internas..." />
                                    </div>

                                    {erro && (
                                        <div className="mt-6 flex items-start gap-3 bg-red-50 border border-red-100 p-4 text-red-600 text-sm">
                                            <AlertCircle size={16} className="mt-0.5 shrink-0" />
                                            {erro}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Navegação */}
                            <div className="px-8 md:px-10 py-6 border-t border-gray-50 flex justify-between items-center bg-[#FAFAF9]">
                                <button onClick={step === 1 ? () => router.push('/admin/reservas') : () => setStep(step - 1)}
                                    className="flex items-center gap-2 text-gray-400 hover:text-[#1E3932] transition-colors text-[10px] uppercase tracking-widest font-bold cursor-pointer py-2">
                                    <ChevronLeft size={14} /> {step === 1 ? 'Cancelar' : 'Anterior'}
                                </button>

                                {step < 3 ? (
                                    <button onClick={() => canProceed() && setStep(step + 1)}
                                        className={`flex items-center gap-3 px-10 py-4 text-[10px] uppercase tracking-widest font-bold transition-all duration-300 cursor-pointer
                                            ${canProceed() ? 'bg-[#1E3932] text-[#C4A484] hover:bg-[#C4A484] hover:text-white shadow-lg' : 'bg-gray-100 text-gray-300 cursor-not-allowed'}`}>
                                        Próximo <ChevronRight size={14} />
                                    </button>
                                ) : (
                                    <button onClick={handleSubmit} disabled={loading}
                                        className="flex items-center gap-3 bg-[#C4A484] text-white px-12 py-4 text-[10px] uppercase tracking-widest font-bold hover:bg-[#1E3932] transition-all duration-300 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer">
                                        {loading ? (
                                            <><span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" /> A processar...</>
                                        ) : (
                                            <><CheckCircle2 size={14} /> Confirmar Reserva</>
                                        )}
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* ── Painel de Resumo ── */}
                    <div className="xl:sticky xl:top-8 h-fit">
                        <div className="bg-[#1E3932] text-white">
                            <div className="px-7 py-6 border-b border-white/10">
                                <span className="text-[#C4A484] text-[10px] uppercase tracking-widest block mb-1">Resumo</span>
                                <h3 className="font-serif text-xl">Reserva Manual</h3>
                            </div>

                            <div className="px-7 py-6 space-y-5 text-sm">
                                {/* Hóspede */}
                                <SummaryRow
                                    icon={<User size={12} />} label="Hóspede"
                                    value={form.hospede.nome ? `${form.hospede.nome} ${form.hospede.sobrenome}`.trim() : '—'}
                                    sub={form.hospede.email || undefined}
                                />
                                {/* Alojamento */}
                                <SummaryRow
                                    icon={<Home size={12} />} label="Alojamento"
                                    value={quartoSelecionado?.nome || '—'}
                                />
                                {/* Datas */}
                                <SummaryRow
                                    icon={<CalendarDays size={12} />} label="Estadia"
                                    value={form.checkIn && form.checkOut ? `${form.checkIn} → ${form.checkOut}` : '—'}
                                    sub={noites > 0 ? `${noites} ${noites === 1 ? 'noite' : 'noites'}` : undefined}
                                />

                                {/* Preços */}
                                {noites > 0 && quartoSelecionado && (
                                    <div className="border-t border-white/10 pt-5 space-y-2">
                                        <div className="flex justify-between text-white/50 text-xs">
                                            <span>Alojamento ({noites}n × €{Number(quartoSelecionado.preco_base).toFixed(0)})</span>
                                            <span>€{precoBase.toFixed(2)}</span>
                                        </div>
                                        {precoExtras > 0 && (
                                            <div className="flex justify-between text-white/50 text-xs">
                                                <span>Extras</span>
                                                <span>€{precoExtras.toFixed(2)}</span>
                                            </div>
                                        )}
                                        <div className="flex justify-between items-baseline pt-3 border-t border-white/10">
                                            <span className="text-[10px] uppercase tracking-widest text-white/40">Total Estimado</span>
                                            <span className="text-[#C4A484] font-bold text-xl">€{total.toFixed(2)}</span>
                                        </div>
                                    </div>
                                )}

                                {/* Canal e Pagamento */}
                                {step === 3 && (
                                    <div className="border-t border-white/10 pt-5 space-y-2 text-xs text-white/50">
                                        <div className="flex justify-between"><span>Canal</span><span className="text-white">{form.canalNome}</span></div>
                                        <div className="flex justify-between"><span>Pagamento</span><span className="text-white">{form.metodoPagamento}</span></div>
                                    </div>
                                )}
                            </div>

                            {/* Progresso */}
                            <div className="px-7 pb-7">
                                <div className="flex gap-1.5 mt-4">
                                    {[1,2,3].map(s => (
                                        <div key={s} className={`flex-1 h-0.5 transition-all duration-500 ${step >= s ? 'bg-[#C4A484]' : 'bg-white/10'}`} />
                                    ))}
                                </div>
                                <p className="text-[10px] text-white/30 uppercase tracking-widest mt-3">Passo {step} de 3</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ── Sub-components ──────────────────────────────────────────────────────────
function Field({ label, value, onChange, placeholder = '', type = 'text', icon }: {
    label: string; value: string; onChange: (v: string) => void;
    placeholder?: string; type?: string; icon?: React.ReactNode;
}) {
    return (
        <div className="space-y-1.5">
            <label className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">{label}</label>
            <div className="relative">
                {icon && <span className="absolute left-0 top-1/2 -translate-y-1/2 text-gray-300">{icon}</span>}
                <input type={type} value={value} placeholder={placeholder}
                    onChange={e => onChange(e.target.value)}
                    className={`w-full border-b border-gray-100 py-3 outline-none focus:border-[#C4A484] transition-colors text-sm text-[#1E3932] placeholder-gray-200 bg-transparent ${icon ? 'pl-5' : ''}`} />
            </div>
        </div>
    );
}

function SelectField({ label, value, onChange, options, labels, icon }: {
    label: string; value: string; onChange: (v: string) => void;
    options: string[]; labels?: string[]; icon?: React.ReactNode;
}) {
    return (
        <div className="space-y-1.5">
            <label className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">{label}</label>
            <div className="relative">
                {icon && <span className="absolute left-0 top-1/2 -translate-y-1/2 text-gray-300">{icon}</span>}
                <select value={value} onChange={e => onChange(e.target.value)}
                    className={`w-full border-b border-gray-100 py-3 outline-none focus:border-[#C4A484] transition-colors text-sm text-[#1E3932] bg-transparent appearance-none cursor-pointer ${icon ? 'pl-5' : ''}`}>
                    {options.map((o, i) => <option key={o} value={o}>{labels?.[i] ?? o}</option>)}
                </select>
            </div>
        </div>
    );
}

function SummaryRow({ icon, label, value, sub }: {
    icon: React.ReactNode; label: string; value: string; sub?: string;
}) {
    return (
        <div className="flex items-start gap-3">
            <span className="text-[#C4A484]/50 mt-0.5">{icon}</span>
            <div className="flex-1 min-w-0">
                <span className="text-[9px] uppercase tracking-widest text-white/30 block">{label}</span>
                <span className="text-sm font-medium truncate block">{value}</span>
                {sub && <span className="text-[10px] text-white/40">{sub}</span>}
            </div>
        </div>
    );
}
