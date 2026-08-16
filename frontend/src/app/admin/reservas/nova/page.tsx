"use client";
import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
    User, CalendarDays, CreditCard, ChevronRight, ChevronLeft,
    CheckCircle2, Home, Phone, Mail, MapPin, Hash, StickyNote,
    Sparkles, CircleDot, X, AlertCircle, Tag, Percent, RefreshCw
} from 'lucide-react';
import AdminSidebar from '@/components/AdminSidebar';

const EDGE_URL = 'https://vuidkeygtxfbgxvmilya.supabase.co/functions/v1';

const PAISES = [
    'Portugal','Brasil','Espanha','França','Reino Unido','Alemanha','Itália',
    'Estados Unidos','Canadá','Suíça','Angola','Cabo Verde','Moçambique','Irlanda','Bélgica','Outro'
];

interface Quarto { id: string; nome: string; preco_base: number; capacidade: number; descricao?: string; }
interface Extra  { id: string; nome: string; preco: number; icone?: string; }

const STEPS = [
    { id: 1, label: 'Hóspede',  short: 'Hóspede',  icon: User },
    { id: 2, label: 'Estadia',  short: 'Estadia',  icon: CalendarDays },
    { id: 3, label: 'Detalhes', short: 'Detalhes', icon: CreditCard },
];

export default function NovaReservaManual() {
    const router = useRouter();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [loadingData, setLoadingData] = useState(true);
    const [loadingError, setLoadingError] = useState('');
    const [quartos, setQuartos] = useState<Quarto[]>([]);
    const [extras, setExtras] = useState<Extra[]>([]);
    const [erro, setErro] = useState('');
    const [erroValidacao, setErroValidacao] = useState('');
    const [reservaCriada, setReservaCriada] = useState<any>(null);
    const [cupom, setCupom] = useState<{ codigo: string; tipo_desconto: string; valor_desconto: number } | null>(null);
    const [cupomInput, setCupomInput] = useState('');
    const [cupomErro, setCupomErro] = useState('');
    const [cupomLoading, setCupomLoading] = useState(false);
    // Precos reais por noite (tarifas sazonais + fim-de-semana), iguais aos do site
    const [calendarioPrecos, setCalendarioPrecos] = useState<{ data: string; preco: number }[]>([]);

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

    // ── guard: redireciona se não for admin ──────────────────────────────────
    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) router.replace('/admin');
    }, [router]);

    // ── carregar quartos e extras ────────────────────────────────────────────
    const fetchData = () => {
        setLoadingData(true);
        setLoadingError('');
        const token = localStorage.getItem('token') || '';
        const headers: Record<string, string> = {};
        if (token) headers['Authorization'] = `Bearer ${token}`;

        Promise.all([
            fetch(`${EDGE_URL}/site-quartos?ativo=true`, { headers }).then(r => r.json()),
            fetch(`${EDGE_URL}/site-extras`, { headers }).then(r => r.json()),
        ]).then(([qData, eData]) => {
            if (qData.status === 'success') {
                setQuartos(qData.data || []);
            } else {
                setLoadingError('Erro ao carregar alojamentos. Verifique a sua ligação.');
            }
            if (eData.status === 'success') setExtras(eData.data || []);
        }).catch(() => {
            setLoadingError('Erro de ligação ao servidor. Tente novamente.');
        }).finally(() => setLoadingData(false));
    };

    useEffect(() => { fetchData(); }, []);

    // ── carregar os preços reais por noite do quarto/datas escolhidos ────────
    // Sem isto o total mostrado usava preco_base e ignorava tarifas sazonais e
    // fins-de-semana, divergindo do valor que o servidor grava na reserva.
    useEffect(() => {
        if (!form.quartoId || !form.checkIn || !form.checkOut) { setCalendarioPrecos([]); return; }
        let cancelado = false;
        fetch(`${EDGE_URL}/tarifas-calendario?quartoId=${form.quartoId}&inicio=${form.checkIn}&fim=${form.checkOut}`)
            .then(r => r.json())
            .then(d => { if (!cancelado && d.status === 'success') setCalendarioPrecos(d.data || []); })
            .catch(() => { if (!cancelado) setCalendarioPrecos([]); });
        return () => { cancelado = true; };
    }, [form.quartoId, form.checkIn, form.checkOut]);

    // ── cálculo de preço em tempo real ──────────────────────────────────────
    const { noites, precoBase, precoExtras, desconto, total } = useMemo(() => {
        const q = quartos.find(q => q.id === form.quartoId);
        const noites = (form.checkIn && form.checkOut)
            ? Math.max(0, Math.ceil(
                (new Date(form.checkOut).getTime() - new Date(form.checkIn).getTime()) / 86400000
            ))
            : 0;
        // Somar noite a noite usando o preço real de cada data (fallback: preco_base)
        let precoBase = 0;
        if (q && form.checkIn && form.checkOut) {
            const d = new Date(`${form.checkIn}T00:00:00.000Z`);
            const fim = new Date(`${form.checkOut}T00:00:00.000Z`);
            while (d < fim) {
                const ymd = d.toISOString().split('T')[0];
                const dia = calendarioPrecos.find(p => p.data === ymd);
                precoBase += dia ? Number(dia.preco) : Number(q.preco_base);
                d.setUTCDate(d.getUTCDate() + 1);
            }
        }
        const selecionados = extras.filter(e => form.extrasIds.includes(e.id));
        const precoExtras = selecionados.reduce((s, e) => s + Number(e.preco), 0);
        const subtotal = precoBase + precoExtras;
        const desconto = cupom
            ? cupom.tipo_desconto === 'PERCENTUAL'
                ? subtotal * (Number(cupom.valor_desconto) / 100)
                : Math.min(Number(cupom.valor_desconto), subtotal)
            : 0;
        return { noites, precoBase, precoExtras, desconto, total: subtotal - desconto };
    }, [form.quartoId, form.checkIn, form.checkOut, form.extrasIds, quartos, extras, cupom, calendarioPrecos]);

    const setH = (field: string, val: string) =>
        setForm(p => ({ ...p, hospede: { ...p.hospede, [field]: val } }));

    const toggleExtra = (id: string) =>
        setForm(p => ({
            ...p,
            extrasIds: p.extrasIds.includes(id) ? p.extrasIds.filter(x => x !== id) : [...p.extrasIds, id]
        }));

    const aplicarCupom = async () => {
        if (!cupomInput.trim()) return;
        setCupomErro('');
        setCupomLoading(true);
        try {
            const resp = await fetch(`${EDGE_URL}/cupom-validar/${encodeURIComponent(cupomInput.trim().toUpperCase())}`);
            const data = await resp.json();
            if (data.status === 'success' && data.data) {
                setCupom(data.data);
                setCupomErro('');
            } else {
                setCupomErro(data.error || 'Cupão inválido ou expirado.');
                setCupom(null);
            }
        } catch {
            setCupomErro('Erro ao validar cupão. Tente novamente.');
        } finally {
            setCupomLoading(false);
        }
    };

    const canProceed = () => {
        if (step === 1) return !!(form.hospede.nome.trim() && form.hospede.email.trim());
        if (step === 2) return !!(form.quartoId && form.checkIn && form.checkOut && noites > 0);
        return true;
    };

    const handleNext = () => {
        if (canProceed()) {
            setErroValidacao('');
            setErro('');
            setStep(s => s + 1);
        } else {
            if (step === 1) setErroValidacao('Preencha o Nome e o Email do hóspede para continuar.');
            if (step === 2) setErroValidacao('Selecione um alojamento e defina as datas de check-in e check-out.');
        }
    };

    const handleBack = () => {
        setErroValidacao('');
        setErro('');
        if (step === 1) router.push('/admin/reservas');
        else setStep(s => s - 1);
    };

    const handleSubmit = async () => {
        if (!form.quartoId)                           { setErro('Selecione um alojamento no passo 2.'); return; }
        if (!form.checkIn || !form.checkOut || noites <= 0) { setErro('Defina as datas de check-in e check-out.'); return; }
        if (!form.hospede.nome.trim() || !form.hospede.email.trim()) { setErro('Nome e email do hóspede são obrigatórios.'); return; }

        setErro('');
        setLoading(true);
        const token = localStorage.getItem('token');
        try {
            const payload = {
                quartoId: form.quartoId,
                checkIn: form.checkIn,
                checkOut: form.checkOut,
                canalNome: form.canalNome,
                metodoPagamento: form.metodoPagamento,
                requerimentosEspeciais: form.requerimentosEspeciais || null,
                extrasIds: form.extrasIds.length > 0 ? form.extrasIds : [],
                ...(cupom ? { cupomCodigo: cupom.codigo } : {}),
                hospede: {
                    nome:             form.hospede.nome.trim(),
                    sobrenome:        form.hospede.sobrenome.trim() || '',
                    email:            form.hospede.email.trim(),
                    telefone:         form.hospede.telefone || null,
                    pais:             form.hospede.pais,
                    numero_documento: form.hospede.numero_documento || null,
                },
            };
            const resp = await fetch(`${EDGE_URL}/reservas-criar`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
                },
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
        const aimaFormToken = reservaCriada?.aima_form_token || reservaCriada?.aimaFormToken || reservaCriada?.aimaToken;
        const aimaFormUrl = aimaFormToken ? `https://refugiocarapita.pt/aima?token=${aimaFormToken}` : '';
        const aimaMailto = aimaFormUrl
            ? `mailto:${encodeURIComponent(form.hospede.email)}?subject=${encodeURIComponent('Formulario de identificacao AIMA - Refugio Carapita')}&body=${encodeURIComponent(`Ola ${form.hospede.nome},\n\nPara concluirmos os dados obrigatorios da sua estadia no Refugio Carapita, por favor preencha o formulario de identificacao AIMA neste link:\n\n${aimaFormUrl}\n\nObrigado,\nRefugio Carapita`)}`
            : '';

        return (
            <div className="min-h-screen bg-[#F9F8F6]">
                <AdminSidebar />
                <div className="ml-0 md:ml-20 flex items-center justify-center min-h-screen p-4 pb-28 md:pb-8">
                    <div className="max-w-lg w-full text-center">
                        <div className="w-20 h-20 rounded-full bg-[#1E3932] flex items-center justify-center mx-auto mb-8">
                            <CheckCircle2 size={36} className="text-[#C4A484]" />
                        </div>
                        <h2 className="text-3xl font-serif text-[#1E3932] mb-2">Reserva Criada!</h2>
                        <p className="text-gray-400 text-sm mb-8">A reserva foi registada com sucesso no sistema.</p>

                        <div className="bg-[#1E3932] text-white p-6 md:p-8 mb-6 text-left">
                            <div className="text-center mb-6">
                                <span className="text-[10px] uppercase tracking-widest text-[#C4A484]/70 block">Número de Reserva</span>
                                <span className="text-2xl font-mono font-bold text-[#C4A484]">{reservaCriada.numero_reserva}</span>
                            </div>
                            <div className="grid grid-cols-2 gap-4 text-xs">
                                <div><span className="text-white/40 uppercase tracking-widest block mb-1">Hóspede</span><span className="font-medium">{form.hospede.nome} {form.hospede.sobrenome}</span></div>
                                <div><span className="text-white/40 uppercase tracking-widest block mb-1">Email</span><span className="font-medium break-all">{form.hospede.email}</span></div>
                                <div><span className="text-white/40 uppercase tracking-widest block mb-1">Check-in</span><span className="font-medium">{form.checkIn}</span></div>
                                <div><span className="text-white/40 uppercase tracking-widest block mb-1">Check-out</span><span className="font-medium">{form.checkOut}</span></div>
                                <div><span className="text-white/40 uppercase tracking-widest block mb-1">Total</span><span className="text-[#C4A484] font-bold text-base">€{total.toFixed(2)}</span></div>
                                <div><span className="text-white/40 uppercase tracking-widest block mb-1">Estado</span><span className="text-green-400 font-bold uppercase text-[10px] tracking-widest">Confirmada</span></div>
                            </div>
                        </div>

                        <div className="bg-white border border-gray-100 p-6 mb-6 text-left">
                            <span className="text-[10px] uppercase tracking-widest text-[#C4A484] font-bold block mb-2">Formulario AIMA</span>
                            {aimaFormUrl ? (
                                <>
                                    <p className="text-xs text-gray-500 leading-relaxed mb-4">
                                        Envie este link ao hóspede para recolher os dados de identificação antes do check-in.
                                    </p>
                                    <div className="bg-[#FAF8F4] border border-gray-100 px-4 py-3 text-xs text-[#1E3932] break-all mb-4 rounded">
                                        {aimaFormUrl}
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                        <a href={aimaMailto}
                                            className="text-center bg-[#1E3932] text-[#C4A484] py-3 text-[10px] uppercase tracking-widest hover:bg-[#C4A484] hover:text-white transition-colors duration-300 cursor-pointer">
                                            Enviar Email
                                        </a>
                                        <button onClick={() => window.open(aimaFormUrl, '_blank')}
                                            className="border border-[#1E3932] text-[#1E3932] py-3 text-[10px] uppercase tracking-widest hover:bg-[#1E3932] hover:text-white transition-colors duration-300 cursor-pointer">
                                            Abrir Link
                                        </button>
                                        <button onClick={() => navigator.clipboard?.writeText(aimaFormUrl)}
                                            className="border border-gray-200 text-gray-500 py-3 text-[10px] uppercase tracking-widest hover:bg-gray-50 transition-colors duration-300 cursor-pointer">
                                            Copiar Link
                                        </button>
                                    </div>
                                </>
                            ) : (
                                <div className="flex items-start gap-3 bg-amber-50 border border-amber-100 p-4 text-amber-700 text-sm rounded">
                                    <AlertCircle size={16} className="mt-0.5 shrink-0" />
                                    A reserva foi criada, mas a API não devolveu o token AIMA. Abra a reserva em "Ver Todas as Reservas" para verificar.
                                </div>
                            )}
                        </div>

                        <div className="flex gap-3">
                            <button onClick={() => router.push('/admin/reservas')}
                                className="flex-1 border border-[#1E3932] text-[#1E3932] py-3 text-[10px] uppercase tracking-widest hover:bg-[#1E3932] hover:text-white transition-colors duration-300 cursor-pointer">
                                Ver Reservas
                            </button>
                            <button onClick={() => {
                                setReservaCriada(null); setStep(1);
                                setForm({ quartoId:'', checkIn:'', checkOut:'', canalNome:'BALCÃO', metodoPagamento:'DINHEIRO', requerimentosEspeciais:'', extrasIds:[], hospede:{nome:'',sobrenome:'',email:'',telefone:'',pais:'Portugal',numero_documento:''} });
                                setCupom(null); setCupomInput(''); setCupomErro('');
                            }}
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

            <div className="ml-0 md:ml-20 p-4 md:p-8 xl:p-12 pb-28 md:pb-8">

                {/* Header */}
                <div className="mb-8 flex items-start justify-between flex-wrap gap-4">
                    <div>
                        <span className="text-[#C4A484] text-[10px] uppercase tracking-widest font-bold block mb-1">Recepção</span>
                        <h1 className="text-3xl md:text-4xl font-serif text-[#1E3932]">Nova Reserva Manual</h1>
                    </div>
                    <button onClick={() => router.push('/admin/reservas')}
                        className="flex items-center gap-2 text-gray-400 hover:text-[#1E3932] transition-colors text-[10px] uppercase tracking-widest cursor-pointer min-h-[44px] px-2">
                        <X size={14} /> Cancelar
                    </button>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-6 max-w-6xl">

                    {/* ── Painel Principal ── */}
                    <div className="min-w-0">

                        {/* Steps */}
                        <div className="flex mb-6 overflow-hidden border border-gray-200 bg-white rounded-lg">
                            {STEPS.map((s, i) => {
                                const Icon = s.icon;
                                const active = step === s.id;
                                const done = step > s.id;
                                return (
                                    <button key={s.id}
                                        type="button"
                                        onClick={() => { if (done) { setErroValidacao(''); setErro(''); setStep(s.id); } }}
                                        aria-current={active ? 'step' : undefined}
                                        className={`flex-1 flex items-center justify-center gap-2 py-4 text-[10px] uppercase tracking-widest font-bold transition-all duration-300 min-h-[52px]
                                            ${active ? 'bg-[#1E3932] text-[#C4A484]' : done ? 'bg-[#FAF8F4] text-[#1E3932] hover:bg-[#1E3932]/5 cursor-pointer' : 'bg-white text-gray-300 cursor-default'}
                                            ${i > 0 ? 'border-l border-gray-200' : ''}`}>
                                        {done ? <CheckCircle2 size={14} className="text-[#C4A484]" /> : <Icon size={14} />}
                                        <span className="hidden sm:inline">{s.label}</span>
                                        <span className="sm:hidden text-[9px]">{s.id}</span>
                                    </button>
                                );
                            })}
                        </div>

                        {/* Card */}
                        <div className="bg-white border border-gray-100 shadow-sm rounded-lg overflow-hidden">

                            {/* STEP 1 — Hóspede */}
                            {step === 1 && (
                                <div className="p-5 md:p-8">
                                    <div className="flex items-center gap-3 mb-7 pb-5 border-b border-gray-50">
                                        <div className="w-8 h-8 rounded-full bg-[#1E3932] flex items-center justify-center shrink-0">
                                            <User size={14} className="text-[#C4A484]" />
                                        </div>
                                        <div>
                                            <h2 className="font-serif text-xl text-[#1E3932]">Informações do Hóspede</h2>
                                            <p className="text-[10px] text-gray-400 uppercase tracking-widest mt-0.5">Dados de identificação</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 md:gap-7">
                                        <Field label="Nome *" value={form.hospede.nome} onChange={v => { setH('nome', v); setErroValidacao(''); }} placeholder="João" />
                                        <Field label="Apelido" value={form.hospede.sobrenome} onChange={v => setH('sobrenome', v)} placeholder="Silva" />
                                        <Field label="Email *" type="email" value={form.hospede.email} onChange={v => { setH('email', v); setErroValidacao(''); }} placeholder="joao@email.com" icon={<Mail size={13} />} />
                                        <Field label="Telefone" type="tel" value={form.hospede.telefone} onChange={v => setH('telefone', v)} placeholder="+351 912 345 678" icon={<Phone size={13} />} />
                                        <Field label="Nº Documento" value={form.hospede.numero_documento} onChange={v => setH('numero_documento', v)} placeholder="AB123456" icon={<Hash size={13} />} />
                                        <SelectField label="País" value={form.hospede.pais} onChange={v => setH('pais', v)} options={PAISES} icon={<MapPin size={13} />} />
                                    </div>

                                    {erroValidacao && (
                                        <div className="mt-6 flex items-start gap-3 bg-amber-50 border border-amber-100 p-4 text-amber-700 text-sm rounded-lg">
                                            <AlertCircle size={16} className="mt-0.5 shrink-0" />
                                            {erroValidacao}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* STEP 2 — Estadia */}
                            {step === 2 && (
                                <div className="p-5 md:p-8">
                                    <div className="flex items-center gap-3 mb-7 pb-5 border-b border-gray-50">
                                        <div className="w-8 h-8 rounded-full bg-[#1E3932] flex items-center justify-center shrink-0">
                                            <CalendarDays size={14} className="text-[#C4A484]" />
                                        </div>
                                        <div>
                                            <h2 className="font-serif text-xl text-[#1E3932]">Estadia e Alojamento</h2>
                                            <p className="text-[10px] text-gray-400 uppercase tracking-widest mt-0.5">Datas e quarto</p>
                                        </div>
                                    </div>

                                    {/* Datas */}
                                    <div className="grid grid-cols-2 gap-4 mb-6">
                                        <Field label="Check-in *" type="date" value={form.checkIn}
                                            onChange={v => { setForm(p => ({ ...p, checkIn: v, quartoId: '' })); setErroValidacao(''); }} />
                                        <Field label="Check-out *" type="date" value={form.checkOut}
                                            onChange={v => { setForm(p => ({ ...p, checkOut: v, quartoId: '' })); setErroValidacao(''); }} />
                                    </div>

                                    {noites > 0 && (
                                        <div className="flex items-center gap-2 mb-6 px-4 py-3 bg-[#1E3932]/5 rounded-lg">
                                            <CircleDot size={12} className="text-[#C4A484]" />
                                            <span className="text-[11px] uppercase tracking-widest font-bold text-[#1E3932]">
                                                {noites} {noites === 1 ? 'noite' : 'noites'} seleccionadas
                                            </span>
                                        </div>
                                    )}

                                    {erroValidacao && (
                                        <div className="mb-5 flex items-start gap-3 bg-amber-50 border border-amber-100 p-4 text-amber-700 text-sm rounded-lg">
                                            <AlertCircle size={16} className="mt-0.5 shrink-0" />
                                            {erroValidacao}
                                        </div>
                                    )}

                                    {/* Alojamentos */}
                                    <div>
                                        <label className="text-[10px] uppercase tracking-widest text-gray-400 font-bold block mb-4">
                                            Selecionar Alojamento *
                                        </label>

                                        {loadingData ? (
                                            <div className="flex flex-col items-center justify-center py-14 gap-3 text-gray-400">
                                                <span className="w-6 h-6 border-2 border-gray-200 border-t-[#C4A484] rounded-full animate-spin" />
                                                <span className="text-xs uppercase tracking-widest">A carregar alojamentos...</span>
                                            </div>
                                        ) : loadingError ? (
                                            <div className="flex flex-col items-center gap-4 py-12 border border-dashed border-red-100 rounded-lg bg-red-50/50">
                                                <AlertCircle size={24} className="text-red-300" />
                                                <p className="text-sm text-red-500 text-center px-4">{loadingError}</p>
                                                <button
                                                    type="button"
                                                    onClick={fetchData}
                                                    className="flex items-center gap-2 px-5 py-2.5 bg-[#1E3932] text-[#C4A484] text-[10px] uppercase tracking-widest hover:bg-[#C4A484] hover:text-white transition-colors cursor-pointer rounded">
                                                    <RefreshCw size={12} /> Tentar novamente
                                                </button>
                                            </div>
                                        ) : quartos.length === 0 ? (
                                            <div className="flex flex-col items-center gap-3 py-12 border border-dashed border-gray-100 rounded-lg">
                                                <Home size={28} className="text-gray-200" />
                                                <p className="text-sm text-gray-300">Nenhum alojamento ativo encontrado.</p>
                                                <button type="button" onClick={fetchData}
                                                    className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-[#C4A484] hover:text-[#1E3932] transition-colors cursor-pointer">
                                                    <RefreshCw size={10} /> Recarregar
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                {quartos.map(q => {
                                                    const selected = form.quartoId === q.id;
                                                    return (
                                                        <button
                                                            key={q.id}
                                                            type="button"
                                                            onClick={() => { setForm(p => ({ ...p, quartoId: q.id })); setErroValidacao(''); }}
                                                            className={`text-left p-5 border-2 rounded-lg transition-all duration-200 cursor-pointer w-full min-h-[100px]
                                                                ${selected
                                                                    ? 'border-[#C4A484] bg-[#1E3932] text-white shadow-lg'
                                                                    : 'border-gray-100 hover:border-[#C4A484]/50 bg-white hover:shadow-md'}`}>
                                                            <div className="flex justify-between items-start mb-3">
                                                                <Home size={16} className={selected ? 'text-[#C4A484]' : 'text-gray-300'} />
                                                                {selected && <CheckCircle2 size={16} className="text-[#C4A484]" />}
                                                            </div>
                                                            <h4 className={`font-serif text-base mb-2 leading-tight ${selected ? 'text-white' : 'text-[#1E3932]'}`}>{q.nome}</h4>
                                                            <div className="flex justify-between items-center">
                                                                <span className={`text-[10px] uppercase tracking-widest ${selected ? 'text-white/50' : 'text-gray-300'}`}>
                                                                    {q.capacidade} hóspedes
                                                                </span>
                                                                <span className="text-[#C4A484] font-bold text-sm">€{Number(q.preco_base).toFixed(0)}/noite</span>
                                                            </div>
                                                            {noites > 0 && (
                                                                <div className={`mt-3 pt-3 border-t text-[10px] tracking-widest ${selected ? 'border-white/10 text-[#C4A484]' : 'border-gray-50 text-gray-300'}`}>
                                                                    {noites}n × €{Number(q.preco_base).toFixed(0)} = <strong>€{(Number(q.preco_base) * noites).toFixed(2)}</strong>
                                                                </div>
                                                            )}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* STEP 3 — Detalhes */}
                            {step === 3 && (
                                <div className="p-5 md:p-8">
                                    <div className="flex items-center gap-3 mb-7 pb-5 border-b border-gray-50">
                                        <div className="w-8 h-8 rounded-full bg-[#1E3932] flex items-center justify-center shrink-0">
                                            <CreditCard size={14} className="text-[#C4A484]" />
                                        </div>
                                        <div>
                                            <h2 className="font-serif text-xl text-[#1E3932]">Pagamento e Extras</h2>
                                            <p className="text-[10px] text-gray-400 uppercase tracking-widest mt-0.5">Canal, pagamento e serviços</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 md:gap-7 mb-8">
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
                                        <div className="mb-8">
                                            <label className="text-[10px] uppercase tracking-widest text-gray-400 font-bold flex items-center gap-2 mb-4">
                                                <Sparkles size={12} className="text-[#C4A484]" /> Serviços Adicionais
                                            </label>
                                            <div className="flex flex-wrap gap-2">
                                                {extras.map(e => (
                                                    <button key={e.id} type="button" onClick={() => toggleExtra(e.id)}
                                                        className={`px-4 py-2.5 text-[10px] uppercase tracking-widest transition-all duration-200 cursor-pointer border rounded min-h-[44px]
                                                            ${form.extrasIds.includes(e.id)
                                                                ? 'bg-[#1E3932] text-[#C4A484] border-[#1E3932]'
                                                                : 'border-gray-200 text-gray-400 hover:border-[#C4A484] hover:text-[#C4A484]'}`}>
                                                        {form.extrasIds.includes(e.id)
                                                            ? <CheckCircle2 size={10} className="inline mr-1.5" />
                                                            : <X size={10} className="inline mr-1.5" />}
                                                        {e.nome} +€{Number(e.preco).toFixed(0)}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Cupão */}
                                    <div className="mb-8">
                                        <label className="text-[10px] uppercase tracking-widest text-gray-400 font-bold flex items-center gap-2 mb-4">
                                            <Tag size={12} className="text-[#C4A484]" /> Cupão de Desconto
                                        </label>
                                        {cupom ? (
                                            <div className="flex items-center justify-between bg-[#1E3932]/5 border border-[#C4A484]/40 px-4 py-3 rounded-lg">
                                                <div className="flex items-center gap-3">
                                                    <Percent size={14} className="text-[#C4A484]" />
                                                    <div>
                                                        <span className="text-sm font-bold text-[#1E3932] font-mono">{cupom.codigo}</span>
                                                        <span className="text-[10px] text-gray-400 ml-2 uppercase tracking-widest">
                                                            {cupom.tipo_desconto === 'PERCENTUAL'
                                                                ? `${cupom.valor_desconto}% de desconto`
                                                                : `€${Number(cupom.valor_desconto).toFixed(2)} de desconto`}
                                                        </span>
                                                    </div>
                                                </div>
                                                <button type="button" onClick={() => { setCupom(null); setCupomInput(''); setCupomErro(''); }}
                                                    className="text-gray-400 hover:text-red-500 transition-colors cursor-pointer p-1 min-h-[44px] min-w-[44px] flex items-center justify-center">
                                                    <X size={14} />
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="flex gap-2">
                                                <input
                                                    type="text"
                                                    value={cupomInput}
                                                    onChange={e => { setCupomInput(e.target.value.toUpperCase()); setCupomErro(''); }}
                                                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); aplicarCupom(); } }}
                                                    placeholder="Código do cupão"
                                                    className="flex-1 border-b border-gray-200 py-3 outline-none focus:border-[#C4A484] transition-colors text-sm text-[#1E3932] placeholder-gray-300 bg-transparent uppercase tracking-widest"
                                                />
                                                <button type="button"
                                                    onClick={aplicarCupom}
                                                    disabled={cupomLoading || !cupomInput.trim()}
                                                    className="px-6 py-2 bg-[#1E3932] text-[#C4A484] text-[10px] uppercase tracking-widest hover:bg-[#C4A484] hover:text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer min-h-[44px]">
                                                    {cupomLoading
                                                        ? <span className="w-3 h-3 border-2 border-[#C4A484]/30 border-t-[#C4A484] rounded-full animate-spin inline-block" />
                                                        : 'Aplicar'}
                                                </button>
                                            </div>
                                        )}
                                        {cupomErro && (
                                            <p className="mt-2 text-xs text-red-500 flex items-center gap-1.5">
                                                <AlertCircle size={11} /> {cupomErro}
                                            </p>
                                        )}
                                    </div>

                                    {/* Notas */}
                                    <div>
                                        <label className="text-[10px] uppercase tracking-widest text-gray-400 font-bold flex items-center gap-2 mb-2">
                                            <StickyNote size={12} /> Notas Internas
                                        </label>
                                        <textarea rows={3}
                                            className="w-full border border-gray-100 bg-[#FAF8F4] p-4 text-sm outline-none focus:border-[#C4A484] transition-colors resize-none rounded-lg"
                                            value={form.requerimentosEspeciais}
                                            onChange={e => setForm(p => ({ ...p, requerimentosEspeciais: e.target.value }))}
                                            placeholder="Observações, pedidos especiais, notas internas..." />
                                    </div>

                                    {erro && (
                                        <div className="mt-6 flex items-start gap-3 bg-red-50 border border-red-100 p-4 text-red-600 text-sm rounded-lg">
                                            <AlertCircle size={16} className="mt-0.5 shrink-0" />
                                            {erro}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Navegação */}
                            <div className="px-5 md:px-8 py-5 border-t border-gray-50 flex justify-between items-center bg-[#FAFAF9]">
                                <button type="button" onClick={handleBack}
                                    className="flex items-center gap-2 text-gray-400 hover:text-[#1E3932] transition-colors text-[10px] uppercase tracking-widest font-bold cursor-pointer py-3 px-2 min-h-[44px]">
                                    <ChevronLeft size={14} /> {step === 1 ? 'Cancelar' : 'Anterior'}
                                </button>

                                {step < 3 ? (
                                    <button type="button" onClick={handleNext}
                                        className={`flex items-center gap-3 px-8 py-4 text-[10px] uppercase tracking-widest font-bold transition-all duration-300 min-h-[44px]
                                            ${canProceed()
                                                ? 'bg-[#1E3932] text-[#C4A484] hover:bg-[#C4A484] hover:text-white shadow-lg cursor-pointer'
                                                : 'bg-gray-100 text-gray-400 cursor-pointer'}`}>
                                        Próximo <ChevronRight size={14} />
                                    </button>
                                ) : (
                                    <button type="button" onClick={handleSubmit} disabled={loading}
                                        className="flex items-center gap-3 bg-[#C4A484] text-white px-8 md:px-12 py-4 text-[10px] uppercase tracking-widest font-bold hover:bg-[#1E3932] transition-all duration-300 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer min-h-[44px]">
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
                    <div className="xl:sticky xl:top-8 h-fit order-first xl:order-last">
                        <div className="bg-[#1E3932] text-white rounded-lg overflow-hidden">
                            <div className="px-6 py-5 border-b border-white/10">
                                <span className="text-[#C4A484] text-[10px] uppercase tracking-widest block mb-0.5">Resumo</span>
                                <h3 className="font-serif text-xl">Reserva Manual</h3>
                            </div>

                            <div className="px-6 py-5 space-y-4 text-sm">
                                <SummaryRow icon={<User size={12} />} label="Hóspede"
                                    value={form.hospede.nome ? `${form.hospede.nome} ${form.hospede.sobrenome}`.trim() : '—'}
                                    sub={form.hospede.email || undefined} />
                                <SummaryRow icon={<Home size={12} />} label="Alojamento"
                                    value={quartoSelecionado?.nome || '—'} />
                                <SummaryRow icon={<CalendarDays size={12} />} label="Estadia"
                                    value={form.checkIn && form.checkOut ? `${form.checkIn} → ${form.checkOut}` : '—'}
                                    sub={noites > 0 ? `${noites} ${noites === 1 ? 'noite' : 'noites'}` : undefined} />

                                {noites > 0 && quartoSelecionado && (
                                    <div className="border-t border-white/10 pt-4 space-y-2">
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
                                        {desconto > 0 && (
                                            <div className="flex justify-between text-green-400 text-xs">
                                                <span className="flex items-center gap-1">
                                                    <Tag size={10} /> {cupom?.codigo}
                                                </span>
                                                <span>-€{desconto.toFixed(2)}</span>
                                            </div>
                                        )}
                                        <div className="flex justify-between items-baseline pt-3 border-t border-white/10">
                                            <span className="text-[10px] uppercase tracking-widest text-white/40">Total Estimado</span>
                                            <span className="text-[#C4A484] font-bold text-xl">€{total.toFixed(2)}</span>
                                        </div>
                                    </div>
                                )}

                                {step === 3 && (
                                    <div className="border-t border-white/10 pt-4 space-y-2 text-xs text-white/50">
                                        <div className="flex justify-between"><span>Canal</span><span className="text-white">{form.canalNome}</span></div>
                                        <div className="flex justify-between"><span>Pagamento</span><span className="text-white">{form.metodoPagamento}</span></div>
                                    </div>
                                )}
                            </div>

                            {/* Progresso */}
                            <div className="px-6 pb-6">
                                <div className="flex gap-1.5 mt-2">
                                    {[1,2,3].map(s => (
                                        <div key={s} className={`flex-1 h-0.5 transition-all duration-500 rounded-full ${step >= s ? 'bg-[#C4A484]' : 'bg-white/10'}`} />
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
                <input
                    type={type}
                    value={value}
                    placeholder={placeholder}
                    onChange={e => onChange(e.target.value)}
                    className={`w-full border-b border-gray-200 py-3 outline-none focus:border-[#C4A484] transition-colors text-sm text-[#1E3932] placeholder-gray-300 bg-transparent min-h-[44px] ${icon ? 'pl-5' : ''}`}
                />
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
                <select
                    value={value}
                    onChange={e => onChange(e.target.value)}
                    className={`w-full border-b border-gray-200 py-3 outline-none focus:border-[#C4A484] transition-colors text-sm text-[#1E3932] bg-transparent appearance-none cursor-pointer min-h-[44px] ${icon ? 'pl-5' : ''}`}>
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
            <span className="text-[#C4A484]/50 mt-0.5 shrink-0">{icon}</span>
            <div className="flex-1 min-w-0">
                <span className="text-[9px] uppercase tracking-widest text-white/30 block">{label}</span>
                <span className="text-sm font-medium truncate block">{value}</span>
                {sub && <span className="text-[10px] text-white/40">{sub}</span>}
            </div>
        </div>
    );
}
