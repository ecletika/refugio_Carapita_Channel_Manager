"use client";
import React, { useEffect, useState, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CreditCard, FileText, CheckCircle, Clock, AlertTriangle, ArrowLeft, Download, ExternalLink, Home, LogOut, Loader2, Shield } from 'lucide-react';

interface Parcela {
    tipo: string;
    descricao: string;
    valor: number;
    prazo: string;
}

interface DadosPagamento {
    reserva: any;
    resumo: {
        valor_total: number;
        valor_pago: number;
        valor_em_aberto: number;
        pagou_inicial: boolean;
        pagou_total: boolean;
    };
    parcela_pendente: Parcela | null;
}

interface Fatura {
    numero: string;
    data_emissao: string;
    emitente: any;
    cliente: any;
    reserva: any;
    financeiro: any;
}

export default function PagamentosPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-carapita-green flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="animate-spin text-carapita-gold" size={40} />
                    <p className="text-white/60 text-xs uppercase tracking-widest">A carregar pagamentos...</p>
                </div>
            </div>
        }>
            <PagamentosContent />
        </Suspense>
    );
}

function PagamentosContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const reservaIdParam = searchParams.get('reserva');
    const pagamentoStatus = searchParams.get('pagamento');

    const [reservas, setReservas] = useState<any[]>([]);
    const [reservaSelecionada, setReservaSelecionada] = useState<string | null>(reservaIdParam);
    const [dadosPagamento, setDadosPagamento] = useState<DadosPagamento | null>(null);
    const [fatura, setFatura] = useState<Fatura | null>(null);
    const [hospede, setHospede] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [loadingPagamento, setLoadingPagamento] = useState(false);
    const [loadingFatura, setLoadingFatura] = useState(false);
    const [showFatura, setShowFatura] = useState(false);
    const [toast, setToast] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

    const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

    const getToken = () => localStorage.getItem('token') || localStorage.getItem('guestToken');

    const showToast = (type: 'success' | 'error', msg: string) => {
        setToast({ type, msg });
        setTimeout(() => setToast(null), 5000);
    };

    const fetchReservas = useCallback(async () => {
        const token = getToken();
        if (!token) { router.push('/login'); return; }
        try {
            const [meRes, resRes] = await Promise.all([
                fetch(`${API}/api/hospede/me`, { headers: { Authorization: `Bearer ${token}` } }),
                fetch(`${API}/api/reservas/minhas-reservas`, { headers: { Authorization: `Bearer ${token}` } }),
            ]);
            if (meRes.ok) { const d = await meRes.json(); if (d.status === 'success') setHospede(d.data); }
            if (resRes.ok) {
                const d = await resRes.json();
                if (d.status === 'success') {
                    const ativas = d.data.filter((r: any) => r.status !== 'CANCELADA');
                    setReservas(ativas);
                    if (!reservaSelecionada && ativas.length > 0) setReservaSelecionada(ativas[0].id);
                }
            }
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    }, [API, router, reservaSelecionada]);

    const fetchDetalhesPagamento = useCallback(async (id: string) => {
        const token = getToken();
        if (!token || !id) return;
        try {
            const res = await fetch(`${API}/api/pagamentos/reserva/${id}`, { headers: { Authorization: `Bearer ${token}` } });
            if (res.ok) { const d = await res.json(); if (d.status === 'success') setDadosPagamento(d.data); }
        } catch (e) { console.error(e); }
    }, [API]);

    useEffect(() => { fetchReservas(); }, []);

    useEffect(() => {
        if (reservaSelecionada) fetchDetalhesPagamento(reservaSelecionada);
    }, [reservaSelecionada, fetchDetalhesPagamento]);

    useEffect(() => {
        if (pagamentoStatus === 'sucesso') showToast('success', '✅ Pagamento confirmado com sucesso! A sua reserva foi atualizada.');
        if (pagamentoStatus === 'cancelado') showToast('error', '❌ Pagamento cancelado. Pode tentar novamente a qualquer momento.');
    }, [pagamentoStatus]);

    const handlePagar = async (tipo: 'inicial' | 'final') => {
        const token = getToken();
        if (!token || !reservaSelecionada) return;
        setLoadingPagamento(true);
        try {
            const res = await fetch(`${API}/api/pagamentos/checkout`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ reservaId: reservaSelecionada, tipo }),
            });
            const data = await res.json();
            if (data.status === 'success' && data.url) {
                window.location.href = data.url;
            } else {
                showToast('error', data.error || 'Erro ao iniciar pagamento.');
            }
        } catch (e) { showToast('error', 'Erro de ligação. Tente novamente.'); }
        finally { setLoadingPagamento(false); }
    };

    const handleVerFatura = async () => {
        const token = getToken();
        if (!token || !reservaSelecionada) return;
        setLoadingFatura(true);
        try {
            const res = await fetch(`${API}/api/pagamentos/fatura/${reservaSelecionada}`, { headers: { Authorization: `Bearer ${token}` } });
            const data = await res.json();
            if (data.status === 'success') { setFatura(data.data); setShowFatura(true); }
            else showToast('error', data.error || 'Erro ao gerar fatura.');
        } catch (e) { showToast('error', 'Erro de ligação.'); }
        finally { setLoadingFatura(false); }
    };

    const handleImprimir = () => window.print();
    const handleLogout = () => {
        ['token', 'guestToken', 'usuario', 'hospede'].forEach(k => localStorage.removeItem(k));
        router.push('/');
    };

    if (loading) return (
        <div className="min-h-screen bg-carapita-green flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
                <Loader2 className="animate-spin text-carapita-gold" size={40} />
                <p className="text-white/60 text-xs uppercase tracking-widest">A carregar pagamentos...</p>
            </div>
        </div>
    );

    const progresso = dadosPagamento ? (dadosPagamento.resumo.valor_pago / dadosPagamento.resumo.valor_total) * 100 : 0;

    return (
        <main className="min-h-screen bg-carapita-green flex flex-col font-sans">
            {/* Toast */}
            {toast && (
                <div className={`fixed top-6 right-6 z-[200] px-6 py-4 text-sm font-medium shadow-2xl border animate-fade-in max-w-sm
                    ${toast.type === 'success'
                        ? 'bg-green-900 border-green-500 text-green-100'
                        : 'bg-red-900 border-red-500 text-red-100'}`}>
                    {toast.msg}
                </div>
            )}

            {/* Header */}
            <header className="bg-carapita-green text-white border-b border-white/10 p-4 md:px-12 flex justify-between items-center h-[72px] relative">
                <button onClick={() => router.push('/perfil')} className="flex items-center gap-2 text-white/60 hover:text-carapita-gold transition-colors text-xs uppercase tracking-widest">
                    <ArrowLeft size={16} /> Voltar ao Perfil
                </button>
                <div className="absolute left-1/2 -translate-x-1/2 cursor-pointer" onClick={() => router.push('/')}>
                    <h2 className="text-xl font-serif font-light uppercase tracking-widest text-white text-center">
                        Refúgio <span className="text-carapita-gold text-base tracking-mega">Carapita</span>
                    </h2>
                </div>
                <div className="flex items-center gap-4">
                    <button onClick={() => router.push('/')} className="text-white/60 hover:text-carapita-gold transition-colors"><Home size={18} /></button>
                    <button onClick={handleLogout} className="text-white/60 hover:text-carapita-gold transition-colors"><LogOut size={18} /></button>
                </div>
            </header>

            {/* Banner */}
            <div className="relative w-full h-40 bg-carapita-dark overflow-hidden flex items-center justify-center">
                <img src="/casa-exterior.jpg" alt="Refúgio Carapita" className="absolute w-full h-full object-cover opacity-20" />
                <div className="relative z-10 text-center">
                    <CreditCard className="text-carapita-gold mx-auto mb-3" size={32} />
                    <h1 className="text-3xl font-serif text-white">Pagamentos</h1>
                    <p className="text-white/50 text-[10px] uppercase tracking-widest mt-1">Gerencie os pagamentos das suas reservas</p>
                </div>
            </div>

            {/* Aviso de Segurança */}
            <div className="bg-carapita-dark/80 border-b border-carapita-gold/20 px-6 py-3">
                <div className="max-w-6xl mx-auto flex items-center gap-3">
                    <Shield className="text-carapita-gold shrink-0" size={16} />
                    <p className="text-[11px] text-white/60 leading-relaxed">
                        <strong className="text-carapita-gold">Segurança:</strong> O Refúgio Carapita <strong>nunca envia dados de pagamento por email ou links externos.</strong> Todos os pagamentos são processados exclusivamente nesta área segura.
                    </p>
                </div>
            </div>

            <section className="flex-1 w-full max-w-6xl mx-auto px-4 md:px-6 py-10 flex flex-col lg:flex-row gap-8">

                {/* Coluna Esquerda — Seleção de Reserva */}
                <div className="lg:w-1/3 flex flex-col gap-4">
                    <h3 className="text-white/50 text-[10px] uppercase tracking-widest font-bold border-b border-white/10 pb-3">
                        As Suas Reservas
                    </h3>
                    {reservas.length === 0 ? (
                        <div className="bg-black/20 border border-dashed border-white/20 p-8 text-center text-white/40 text-xs uppercase tracking-widest">
                            Nenhuma reserva ativa encontrada.
                        </div>
                    ) : (
                        reservas.map((r: any) => (
                            <button
                                key={r.id}
                                onClick={() => setReservaSelecionada(r.id)}
                                className={`text-left p-4 border transition-all duration-200 ${reservaSelecionada === r.id
                                    ? 'border-carapita-gold bg-carapita-gold/5'
                                    : 'border-white/10 bg-black/10 hover:border-white/30'
                                    }`}
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <span className="font-serif text-white text-sm">{r.Quarto?.nome || r.quarto?.nome || 'Alojamento'}</span>
                                    <span className={`text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 ${r.status === 'CONFIRMADA' ? 'text-green-400 bg-green-900/30' :
                                        r.status === 'PENDENTE' ? 'text-yellow-400 bg-yellow-900/30' :
                                            'text-white/40 bg-white/5'
                                        }`}>{r.status}</span>
                                </div>
                                <p className="text-white/50 text-[11px]">
                                    {new Date(r.data_check_in).toLocaleDateString('pt-PT')} → {new Date(r.data_check_out).toLocaleDateString('pt-PT')}
                                </p>
                                <p className="text-carapita-gold text-sm font-bold mt-1">€{Number(r.valor_total).toFixed(2)}</p>
                                {/* Indicadores de pagamento */}
                                <div className="flex gap-2 mt-2">
                                    {r.pagamento_inicial_em && <span className="text-[9px] bg-green-900/40 text-green-400 px-2 py-0.5">1.ª Prest. ✓</span>}
                                    {r.pagamento_total_em && <span className="text-[9px] bg-green-900/40 text-green-400 px-2 py-0.5">2.ª Prest. ✓</span>}
                                    {!r.pagamento_inicial_em && <span className="text-[9px] bg-yellow-900/40 text-yellow-400 px-2 py-0.5">Pagamento Pendente</span>}
                                </div>
                            </button>
                        ))
                    )}
                </div>

                {/* Coluna Direita — Detalhe de Pagamento */}
                <div className="flex-1 flex flex-col gap-6">
                    {!dadosPagamento ? (
                        <div className="flex-1 flex items-center justify-center">
                            <Loader2 className="animate-spin text-carapita-gold" size={32} />
                        </div>
                    ) : (
                        <>
                            {/* Card Resumo Financeiro */}
                            <div className="bg-carapita-dark/60 border border-white/10 p-6">
                                <h3 className="text-white font-serif text-xl mb-1">{dadosPagamento.reserva.quarto?.nome || 'Alojamento'}</h3>
                                <p className="text-white/40 text-xs uppercase tracking-widest mb-6">
                                    {new Date(dadosPagamento.reserva.data_check_in).toLocaleDateString('pt-PT', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                                    {' → '}
                                    {new Date(dadosPagamento.reserva.data_check_out).toLocaleDateString('pt-PT', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                                </p>

                                {/* Barra de Progresso */}
                                <div className="mb-6">
                                    <div className="flex justify-between text-xs mb-2">
                                        <span className="text-white/50 uppercase tracking-widest">Progresso do Pagamento</span>
                                        <span className="text-carapita-gold font-bold">{Math.round(progresso)}%</span>
                                    </div>
                                    <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-gradient-to-r from-carapita-gold to-yellow-300 transition-all duration-700"
                                            style={{ width: `${progresso}%` }}
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-3 gap-4 mb-6">
                                    <div className="bg-black/20 p-4 text-center border border-white/5">
                                        <span className="block text-[9px] text-white/40 uppercase tracking-widest mb-1">Total</span>
                                        <span className="text-white font-bold text-lg">€{dadosPagamento.resumo.valor_total.toFixed(2)}</span>
                                    </div>
                                    <div className="bg-green-900/20 p-4 text-center border border-green-500/20">
                                        <span className="block text-[9px] text-green-400 uppercase tracking-widest mb-1">Pago</span>
                                        <span className="text-green-400 font-bold text-lg">€{dadosPagamento.resumo.valor_pago.toFixed(2)}</span>
                                    </div>
                                    <div className={`p-4 text-center border ${dadosPagamento.resumo.valor_em_aberto > 0 ? 'bg-yellow-900/20 border-yellow-500/20' : 'bg-green-900/20 border-green-500/20'}`}>
                                        <span className={`block text-[9px] uppercase tracking-widest mb-1 ${dadosPagamento.resumo.valor_em_aberto > 0 ? 'text-yellow-400' : 'text-green-400'}`}>Em Aberto</span>
                                        <span className={`font-bold text-lg ${dadosPagamento.resumo.valor_em_aberto > 0 ? 'text-yellow-400' : 'text-green-400'}`}>€{dadosPagamento.resumo.valor_em_aberto.toFixed(2)}</span>
                                    </div>
                                </div>

                                {/* Status dos Pagamentos */}
                                <div className="flex flex-col gap-3">
                                    {/* 1.ª Prestação */}
                                    <div className={`flex items-center justify-between p-4 border ${dadosPagamento.resumo.pagou_inicial ? 'border-green-500/30 bg-green-900/10' : 'border-yellow-500/30 bg-yellow-900/10'}`}>
                                        <div className="flex items-center gap-3">
                                            {dadosPagamento.resumo.pagou_inicial
                                                ? <CheckCircle className="text-green-400 shrink-0" size={20} />
                                                : <Clock className="text-yellow-400 shrink-0" size={20} />}
                                            <div>
                                                <p className="text-white text-sm font-medium">1.ª Prestação — 50% Iniciais</p>
                                                <p className={`text-[11px] ${dadosPagamento.resumo.pagou_inicial ? 'text-green-400' : 'text-yellow-400'}`}>
                                                    {dadosPagamento.resumo.pagou_inicial
                                                        ? `Pago em ${new Date(dadosPagamento.reserva.pagamento_inicial_em).toLocaleDateString('pt-PT')}`
                                                        : `Prazo: ${dadosPagamento.parcela_pendente?.prazo || '48h após reserva'}`}
                                                </p>
                                            </div>
                                        </div>
                                        <span className="text-white font-bold">€{(dadosPagamento.resumo.valor_total * 0.5).toFixed(2)}</span>
                                    </div>

                                    {/* 2.ª Prestação */}
                                    <div className={`flex items-center justify-between p-4 border ${dadosPagamento.resumo.pagou_total ? 'border-green-500/30 bg-green-900/10' :
                                        dadosPagamento.resumo.pagou_inicial ? 'border-yellow-500/30 bg-yellow-900/10' :
                                            'border-white/10 bg-black/10 opacity-60'}`}>
                                        <div className="flex items-center gap-3">
                                            {dadosPagamento.resumo.pagou_total
                                                ? <CheckCircle className="text-green-400 shrink-0" size={20} />
                                                : dadosPagamento.resumo.pagou_inicial
                                                    ? <AlertTriangle className="text-yellow-400 shrink-0" size={20} />
                                                    : <Clock className="text-white/30 shrink-0" size={20} />}
                                            <div>
                                                <p className={`text-sm font-medium ${dadosPagamento.resumo.pagou_inicial || dadosPagamento.resumo.pagou_total ? 'text-white' : 'text-white/40'}`}>2.ª Prestação — 50% Finais</p>
                                                <p className={`text-[11px] ${dadosPagamento.resumo.pagou_total ? 'text-green-400' : dadosPagamento.resumo.pagou_inicial ? 'text-yellow-400' : 'text-white/30'}`}>
                                                    {dadosPagamento.resumo.pagou_total
                                                        ? `Pago em ${new Date(dadosPagamento.reserva.pagamento_total_em).toLocaleDateString('pt-PT')}`
                                                        : dadosPagamento.resumo.pagou_inicial
                                                            ? `Prazo: até 10 dias antes do check-in`
                                                            : 'Disponível após 1.ª prestação'}
                                                </p>
                                            </div>
                                        </div>
                                        <span className={`font-bold ${dadosPagamento.resumo.pagou_inicial || dadosPagamento.resumo.pagou_total ? 'text-white' : 'text-white/30'}`}>€{(dadosPagamento.resumo.valor_total * 0.5).toFixed(2)}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Botões de Ação */}
                            {dadosPagamento.parcela_pendente && (
                                <div className="bg-carapita-dark/60 border border-carapita-gold/30 p-6">
                                    <div className="flex items-start gap-3 mb-5">
                                        <AlertTriangle className="text-carapita-gold shrink-0 mt-0.5" size={20} />
                                        <div>
                                            <h4 className="text-white font-semibold text-sm">{dadosPagamento.parcela_pendente.descricao}</h4>
                                            <p className="text-white/50 text-xs mt-1">Prazo de pagamento: <strong className="text-yellow-400">{dadosPagamento.parcela_pendente.prazo}</strong></p>
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => handlePagar(dadosPagamento.parcela_pendente!.tipo === 'pagamento_inicial' ? 'inicial' : 'final')}
                                        disabled={loadingPagamento}
                                        className="w-full bg-carapita-gold hover:bg-yellow-500 text-carapita-dark font-bold py-4 text-xs uppercase tracking-widest transition-all duration-200 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {loadingPagamento ? <Loader2 size={16} className="animate-spin" /> : <CreditCard size={16} />}
                                        {loadingPagamento ? 'A redirecionar...' : `Pagar €${dadosPagamento.parcela_pendente.valor.toFixed(2)} — ${dadosPagamento.parcela_pendente.descricao}`}
                                    </button>

                                    <div className="flex items-center justify-center gap-2 mt-3">
                                        <Shield size={12} className="text-white/30" />
                                        <p className="text-[10px] text-white/30 text-center">
                                            Pagamento seguro via Stripe — Multibanco / MB Way / Cartão
                                        </p>
                                    </div>
                                </div>
                            )}

                            {dadosPagamento.resumo.pagou_total && (
                                <div className="bg-green-900/20 border border-green-500/30 p-6 flex items-center gap-4">
                                    <CheckCircle className="text-green-400 shrink-0" size={32} />
                                    <div>
                                        <h4 className="text-green-400 font-bold text-sm uppercase tracking-widest">Reserva Totalmente Paga 🎊</h4>
                                        <p className="text-white/60 text-xs mt-1">A sua reserva está 100% confirmada. Estamos à sua espera!</p>
                                    </div>
                                </div>
                            )}

                            {/* Fatura */}
                            <div className="bg-carapita-dark/40 border border-white/10 p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <div>
                                        <h4 className="text-white font-semibold text-sm">Comprovativo / Fatura</h4>
                                        <p className="text-white/40 text-xs mt-0.5">Emitir documento com dados do cliente e do Refúgio Carapita</p>
                                    </div>
                                    <FileText className="text-carapita-gold" size={24} />
                                </div>
                                <button
                                    onClick={handleVerFatura}
                                    disabled={loadingFatura}
                                    className="w-full border border-carapita-gold/50 text-carapita-gold hover:bg-carapita-gold hover:text-carapita-dark transition-all py-3 text-xs uppercase tracking-widest flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    {loadingFatura ? <Loader2 size={14} className="animate-spin" /> : <FileText size={14} />}
                                    {loadingFatura ? 'A gerar...' : 'Ver / Imprimir Fatura'}
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </section>

            {/* Modal Fatura */}
            {showFatura && fatura && (
                <div className="fixed inset-0 z-[100] flex items-start justify-center p-4 pt-10 overflow-y-auto">
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowFatura(false)} />
                    <div className="relative bg-white w-full max-w-2xl z-10 shadow-2xl print:shadow-none" id="fatura-print">
                        {/* Botões */}
                        <div className="flex gap-2 p-4 border-b border-gray-200 no-print">
                            <button onClick={handleImprimir} className="flex items-center gap-2 bg-carapita-green text-white px-4 py-2 text-xs uppercase tracking-widest hover:bg-opacity-90">
                                <Download size={14} /> Imprimir / Guardar PDF
                            </button>
                            <button onClick={() => setShowFatura(false)} className="ml-auto text-gray-400 hover:text-gray-700 text-xs uppercase tracking-widest px-4">Fechar</button>
                        </div>

                        {/* Conteúdo da Fatura */}
                        <div className="p-10 text-gray-800 font-sans">
                            {/* Cabeçalho */}
                            <div className="flex justify-between items-start mb-10">
                                <div>
                                    <h1 className="text-2xl font-serif text-carapita-green font-bold">Refúgio Carapita</h1>
                                    <p className="text-gray-500 text-xs mt-1">{fatura.emitente.morada}</p>
                                    <p className="text-gray-500 text-xs">{fatura.emitente.nif} | {fatura.emitente.email}</p>
                                    <p className="text-gray-500 text-xs">{fatura.emitente.telefone}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs font-bold uppercase tracking-widest text-gray-400">Comprovativo de Pagamento</p>
                                    <p className="text-2xl font-bold text-carapita-green mt-1">{fatura.numero}</p>
                                    <p className="text-xs text-gray-500 mt-1">Data: {fatura.data_emissao}</p>
                                </div>
                            </div>

                            {/* Divisor */}
                            <div className="border-b-2 border-carapita-green mb-8"></div>

                            {/* Dados Cliente */}
                            <div className="grid grid-cols-2 gap-8 mb-8">
                                <div>
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Faturado a</p>
                                    <p className="font-bold text-gray-800">{fatura.cliente.nome}</p>
                                    <p className="text-sm text-gray-600">{fatura.cliente.email}</p>
                                    {fatura.cliente.telefone && <p className="text-sm text-gray-600">{fatura.cliente.telefone}</p>}
                                    {fatura.cliente.morada && <p className="text-sm text-gray-600">{fatura.cliente.morada}</p>}
                                    {fatura.cliente.nif && <p className="text-sm text-gray-600">NIF: {fatura.cliente.nif}</p>}
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Detalhes da Estadia</p>
                                    <p className="font-bold text-gray-800">{fatura.reserva.quarto}</p>
                                    <p className="text-sm text-gray-600">Check-in: {fatura.reserva.check_in}</p>
                                    <p className="text-sm text-gray-600">Check-out: {fatura.reserva.check_out}</p>
                                    <p className="text-sm text-gray-600">{fatura.reserva.noites} noite{fatura.reserva.noites !== 1 ? 's' : ''}</p>
                                </div>
                            </div>

                            {/* Tabela Valores */}
                            <table className="w-full border-collapse mb-8">
                                <thead>
                                    <tr className="bg-carapita-green text-white text-xs uppercase tracking-widest">
                                        <th className="text-left p-3">Descrição</th>
                                        <th className="text-right p-3">Valor</th>
                                        <th className="text-right p-3">Estado</th>
                                    </tr>
                                </thead>
                                <tbody className="text-sm">
                                    <tr className="border-b border-gray-200">
                                        <td className="p-3">1.ª Prestação — 50% do Valor Total</td>
                                        <td className="text-right p-3 font-mono">€{(fatura.financeiro.valor_total * 0.5).toFixed(2)}</td>
                                        <td className="text-right p-3">
                                            {fatura.financeiro.pagamento_inicial_em
                                                ? <span className="text-green-600 font-bold">✓ Pago em {fatura.financeiro.pagamento_inicial_em}</span>
                                                : <span className="text-orange-500">Pendente</span>}
                                        </td>
                                    </tr>
                                    <tr className="border-b border-gray-200">
                                        <td className="p-3">2.ª Prestação — 50% Restantes</td>
                                        <td className="text-right p-3 font-mono">€{(fatura.financeiro.valor_total * 0.5).toFixed(2)}</td>
                                        <td className="text-right p-3">
                                            {fatura.financeiro.pagamento_total_em
                                                ? <span className="text-green-600 font-bold">✓ Pago em {fatura.financeiro.pagamento_total_em}</span>
                                                : <span className="text-orange-500">Pendente</span>}
                                        </td>
                                    </tr>
                                </tbody>
                                <tfoot>
                                    <tr className="bg-gray-50 font-bold">
                                        <td className="p-3 text-carapita-green">Total</td>
                                        <td className="text-right p-3 font-mono text-carapita-green">€{fatura.financeiro.valor_total.toFixed(2)}</td>
                                        <td className="text-right p-3 text-green-600">€{fatura.financeiro.total_pago.toFixed(2)} pagos</td>
                                    </tr>
                                    {fatura.financeiro.saldo_devedor > 0 && (
                                        <tr className="bg-orange-50">
                                            <td colSpan={2} className="p-3 text-orange-700">Saldo em Aberto</td>
                                            <td className="text-right p-3 font-mono font-bold text-orange-700">€{fatura.financeiro.saldo_devedor.toFixed(2)}</td>
                                        </tr>
                                    )}
                                </tfoot>
                            </table>

                            {/* Rodapé */}
                            <div className="border-t border-gray-200 pt-6 text-center text-gray-400 text-xs">
                                <p className="font-serif text-carapita-green text-sm mb-1">"Onde a tranquilidade encontra a história."</p>
                                <p>Este documento serve como comprovativo de pagamento emitido pelo Refúgio Carapita.</p>
                                <p className="mt-1">Para questões: {fatura.emitente.email} | {fatura.emitente.telefone}</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
}
