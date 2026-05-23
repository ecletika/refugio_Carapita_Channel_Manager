"use client";
import React, { useState, useEffect, useCallback } from 'react';
import { Calendar, Home, Info, Tag, X, Send, FileText, CheckCircle, AlertCircle, Clock, ChevronDown, ChevronUp, Eye, ZoomIn, Download } from 'lucide-react';
import AdminSidebar from '@/components/AdminSidebar';

const EDGE_URL = 'https://vuidkeygtxfbgxvmilya.supabase.co/functions/v1';
const PUBLIC_SITE_URL = 'https://refugiocarapita.pt';

interface Reserva {
  id: string;
  data_check_in: string;
  data_check_out: string;
  status: string;
  valor_total: number;
  numero_reserva?: string;
  aima_dados_completos?: boolean;
  aima_form_token?: string;
  quarto: { nome: string };
  hospede: { nome: string; email: string; telefone: string };
  canal: { nome_canal: string };
  criado_em: string;
  extras_ids?: string[] | null;
}

interface AimaHospede {
  id: string;
  ordem: number;
  nome: string;
  sobrenome?: string;
  email?: string;
  telefone?: string;
  data_nascimento?: string;
  local_nascimento?: string;
  nacionalidade?: string;
  tipo_documento?: string;
  numero_documento?: string;
  pais_emissor_documento?: string;
  pais?: string;
  cidade?: string;
  endereco1?: string;
  documento_imagem_url?: string;
  documento_imagem_signed?: string;
}

interface AimaLog {
  id: string;
  status: string;
  erro?: string;
  criado_em: string;
  hospede_nome?: string;
}

interface AimaData {
  reserva: { id: string; numero_reserva?: string; data_check_in: string; data_check_out: string; aima_dados_completos: boolean; aima_form_token?: string; quartoNome?: string };
  hospedes: AimaHospede[];
  logs: AimaLog[];
}

export default function AdminReservas() {
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [loading, setLoading] = useState(true);

  // AIMA modal state
  const [aimaModal, setAimaModal] = useState<string | null>(null); // reservaId
  const [aimaData, setAimaData] = useState<AimaData | null>(null);
  const [aimaLoading, setAimaLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState<{ ok: boolean; msg: string } | null>(null);
  const [formSendResult, setFormSendResult] = useState<{ ok: boolean; msg: string } | null>(null);
  const [sendingForm, setSendingForm] = useState(false);
  const [expandedGuest, setExpandedGuest] = useState<number>(0);
  const [lightboxImg, setLightboxImg] = useState<string | null>(null);
  const [lightboxLabel, setLightboxLabel] = useState('');

  const fetchReservas = async () => {
    const token = localStorage.getItem('token');
    try {
      const resp = await fetch(`${EDGE_URL}/admin-reservas`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await resp.json();
      if (data.status === 'success') setReservas(data.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchReservas(); }, []);

  const updateStatus = async (id: string, endpoint: string) => {
    const token = localStorage.getItem('token');
    try {
      const resp = await fetch(`${EDGE_URL}/admin-reservas/${id}/${endpoint}`, {
        method: 'POST', headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await resp.json();
      if (data.status === 'success') fetchReservas();
      else alert(data.error || 'Erro ao atualizar status');
    } catch { alert('Erro de comunicação com o servidor'); }
  };

  const openAimaModal = useCallback(async (reservaId: string) => {
    setAimaModal(reservaId);
    setAimaData(null);
    setSendResult(null);
    setFormSendResult(null);
    setExpandedGuest(0);
    setAimaLoading(true);
    try {
      const token = localStorage.getItem('token');
      const resp = await fetch(`${EDGE_URL}/enviar-aima/${reservaId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await resp.json();
      if (data.status === 'success') setAimaData(data);
      else setAimaData(null);
    } catch { setAimaData(null); }
    finally { setAimaLoading(false); }
  }, []);

  const sendToAima = async () => {
    if (!aimaModal) return;
    setSending(true);
    setSendResult(null);
    try {
      const token = localStorage.getItem('token');
      const resp = await fetch(`${EDGE_URL}/enviar-aima/${aimaModal}`, {
        method: 'POST', headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await resp.json();
      setSendResult({ ok: data.status === 'success', msg: data.message || data.error || 'Erro desconhecido' });
      if (data.status === 'success') {
        setTimeout(() => openAimaModal(aimaModal), 800);
      }
    } catch { setSendResult({ ok: false, msg: 'Erro de comunicação com o servidor.' }); }
    finally { setSending(false); }
  };

  const sendAimaFormEmail = async () => {
    if (!aimaModal) return;
    const token = localStorage.getItem('token');
    setSendingForm(true);
    setFormSendResult(null);
    try {
      const url = `${EDGE_URL}/enviar-formulario-aima/${aimaModal}`;
      const resp = await fetch(url, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await resp.json();
      if (data.status === 'success') {
        // email_enviado=false significa que o link foi gerado mas email falhou (aviso âmbar)
        const emailOk = data.email_enviado !== false;
        setFormSendResult({ ok: emailOk, msg: data.message || 'Formulário enviado com sucesso.' });
        if (data.data?.aima_form_token) {
          setReservas(prev => prev.map(res => res.id === aimaModal ? { ...res, aima_form_token: data.data.aima_form_token } : res));
        }
        // Também actualizar aimaData se disponível
        if (data.data?.aima_form_token && aimaData) {
          setAimaData(prev => prev ? { ...prev, reserva: { ...prev.reserva, aima_form_token: data.data.aima_form_token } } : prev);
        }
      } else {
        setFormSendResult({ ok: false, msg: data.error || 'Erro ao enviar formulário.' });
      }
    } catch {
      setFormSendResult({ ok: false, msg: 'Erro de comunicação ao enviar formulário.' });
    } finally {
      setSendingForm(false);
    }
  };

  const closeModal = () => { setAimaModal(null); setAimaData(null); setSendResult(null); setFormSendResult(null); };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CONFIRMADA': return 'bg-green-100 text-green-800';
      case 'PENDENTE': return 'bg-yellow-100 text-yellow-800';
      case 'CANCELADA': return 'bg-red-100 text-red-800';
      case 'CHECK_IN': return 'bg-blue-100 text-blue-800';
      case 'CHECK_OUT': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const showAimaButton = (res: Reserva) =>
    ['CONFIRMADA', 'CHECK_IN', 'CHECK_OUT', 'PENDENTE'].includes(res.status);

  const selectedReserva = aimaModal ? reservas.find(res => res.id === aimaModal) : null;
  const aimaToken = selectedReserva?.aima_form_token || aimaData?.reserva.aima_form_token;
  const aimaFormUrl = aimaToken
    ? `${PUBLIC_SITE_URL}/aima?token=${aimaToken}`
    : '';

  if (loading) return (
    <div className="min-h-screen bg-[#F9F8F6] flex items-center justify-center">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-carapita-gold border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-[10px] uppercase tracking-widest text-gray-400">A carregar o livro de reservas...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F9F8F6]">
      <AdminSidebar />

      <div className="ml-20 p-8 md:p-12 max-w-7xl mx-auto">
        <div className="flex justify-between items-end mb-12">
          <div>
            <span className="text-carapita-gold text-[10px] uppercase tracking-mega font-bold">Gestão</span>
            <h1 className="text-4xl font-serif text-carapita-dark">Livro de Reservas</h1>
          </div>
          <button
            onClick={() => window.location.href = '/admin/reservas/nova'}
            className="bg-carapita-dark text-white px-8 py-4 text-[10px] uppercase tracking-mega hover:bg-carapita-gold transition-all duration-500 shadow-xl shadow-carapita-dark/10 cursor-pointer"
          >
            + Reserva Manual
          </button>
        </div>

        <div className="grid grid-cols-1 gap-6">
          {reservas.length === 0 ? (
            <div className="bg-white p-20 text-center border border-gray-100 shadow-sm">
              <p className="text-carapita-muted uppercase tracking-widest text-[10px]">Nenhuma reserva encontrada no sistema.</p>
            </div>
          ) : reservas.map((res) => (
            <div key={res.id} className="bg-white border border-gray-100 flex flex-col xl:flex-row divide-y xl:divide-y-0 xl:divide-x divide-gray-100 hover:shadow-2xl transition-all duration-500 overflow-hidden group">

              {/* Col 1: Datas e Status */}
              <div className="p-8 lg:w-64 flex flex-col justify-center bg-gray-50/20 group-hover:bg-white transition-colors">
                <div className={`text-[9px] uppercase tracking-widest font-bold px-3 py-1 rounded-full w-fit mb-4 shadow-sm ${getStatusColor(res.status)}`}>
                  {res.status}
                </div>
                {res.numero_reserva && (
                  <div className="text-[9px] font-mono text-carapita-gold tracking-widest mb-4">{res.numero_reserva}</div>
                )}
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-carapita-dark">
                    <Calendar size={14} className="text-carapita-gold" />
                    <span className="text-sm font-medium">{new Date(res.data_check_in).toLocaleDateString('pt-PT')}</span>
                  </div>
                  <div className="flex items-center gap-2 text-carapita-muted ml-5">
                    <span className="text-[10px] text-gray-300">até</span>
                    <span className="text-sm font-light">{new Date(res.data_check_out).toLocaleDateString('pt-PT')}</span>
                  </div>
                </div>
              </div>

              {/* Col 2: Hóspede e Quarto */}
              <div className="p-8 flex-1 grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="flex flex-col justify-center">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 rounded-full bg-carapita-gold/10 flex items-center justify-center text-carapita-gold font-serif">
                      {res.hospede.nome.charAt(0)}
                    </div>
                    <h3 className="font-serif text-xl text-carapita-dark group-hover:text-carapita-gold transition-colors">{res.hospede.nome}</h3>
                  </div>
                  <p className="text-[10px] text-carapita-muted uppercase tracking-widest mb-1 flex items-center gap-2">
                    <span className="w-1 h-1 rounded-full bg-carapita-gold" />{res.hospede.email}
                  </p>
                  <p className="text-[10px] text-carapita-muted uppercase tracking-widest flex items-center gap-2">
                    <span className="w-1 h-1 rounded-full bg-carapita-gold" />{res.hospede.telefone || 'Sem telefone'}
                  </p>
                </div>
                <div className="flex flex-col justify-center">
                  <div className="flex items-center gap-2 mb-3">
                    <Home size={16} className="text-carapita-gold" />
                    <h3 className="font-serif text-xl text-carapita-dark">{res.quarto.nome}</h3>
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <Tag size={12} className="text-carapita-gold/40" />
                    <span className="text-[10px] text-carapita-muted uppercase tracking-widest font-medium">{res.canal.nome_canal}</span>
                  </div>
                  {/* AIMA badge */}
                  {res.aima_dados_completos ? (
                    <div className="flex items-center gap-1.5 text-[9px] uppercase tracking-widest font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-1 w-fit">
                      <CheckCircle size={10} /> AIMA Preenchido
                    </div>
                  ) : res.aima_form_token ? (
                    <div className="flex items-center gap-1.5 text-[9px] uppercase tracking-widest font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-1 w-fit">
                      <Clock size={10} /> AIMA Pendente
                    </div>
                  ) : null}
                </div>
              </div>

              {/* Col 3: Financeiro */}
              <div className="p-8 lg:w-72 flex flex-col justify-center bg-gray-50/50 group-hover:bg-carapita-gold/5 transition-colors">
                <div className="flex flex-col mb-4">
                  <span className="text-[9px] uppercase tracking-widest text-carapita-muted mb-1">Total da Reserva</span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-sm font-serif text-carapita-gold">€</span>
                    <span className="text-3xl font-serif text-carapita-dark">{Number(res.valor_total).toLocaleString('pt-PT', { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-carapita-muted border-t border-gray-200/50 pt-4">
                  <Info size={12} />
                  <span className="text-[9px] uppercase tracking-widest leading-tight">Registada em:<br />{new Date(res.criado_em).toLocaleString('pt-PT')}</span>
                </div>
              </div>

              {/* Col 4: Ações */}
              <div className="p-8 lg:w-48 flex flex-col gap-2 justify-center bg-white">
                {res.status === 'PENDENTE' && (
                  <button onClick={() => updateStatus(res.id, 'confirmar')} className="w-full py-2 bg-green-600 text-white text-[9px] uppercase tracking-widest font-bold hover:bg-green-700 transition-colors cursor-pointer">Confirmar</button>
                )}
                {res.status === 'CONFIRMADA' && (
                  <button onClick={() => updateStatus(res.id, 'checkin')} className="w-full py-2 bg-blue-600 text-white text-[9px] uppercase tracking-widest font-bold hover:bg-blue-700 transition-colors cursor-pointer">Check-in</button>
                )}
                {res.status === 'CHECK_IN' && (
                  <button onClick={() => updateStatus(res.id, 'checkout')} className="w-full py-2 bg-purple-600 text-white text-[9px] uppercase tracking-widest font-bold hover:bg-purple-700 transition-colors cursor-pointer">Check-out</button>
                )}
                {showAimaButton(res) && (
                  <button
                    onClick={() => openAimaModal(res.id)}
                    className={`w-full py-2 text-[9px] uppercase tracking-widest font-bold transition-colors cursor-pointer ${res.aima_dados_completos ? 'bg-[#1E3932] text-[#C4A484] hover:bg-[#C4A484] hover:text-white' : 'border border-gray-200 text-gray-500 hover:bg-gray-50'}`}
                  >
                    {res.aima_dados_completos ? 'Enviar AIMA' : 'Ver AIMA'}
                  </button>
                )}
                {res.status !== 'CANCELADA' && res.status !== 'CHECK_OUT' && (
                  <button onClick={() => updateStatus(res.id, 'cancelar')} className="w-full py-2 border border-red-200 text-red-500 text-[9px] uppercase tracking-widest hover:bg-red-50 transition-colors cursor-pointer">Cancelar</button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── AIMA Modal ── */}
      {aimaModal && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 p-4 overflow-y-auto" onClick={closeModal}>
          <div
            className="w-full max-w-2xl bg-white shadow-2xl my-8"
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="bg-[#1E3932] px-8 py-6 flex items-center justify-between">
              <div>
                <h2 className="text-[#C4A484] font-serif text-xl uppercase tracking-widest">Dados AIMA</h2>
                {aimaData?.reserva.numero_reserva && (
                  <p className="text-white/40 text-[10px] tracking-widest mt-0.5 font-mono">{aimaData.reserva.numero_reserva}</p>
                )}
              </div>
              <button onClick={closeModal} className="text-white/40 hover:text-[#C4A484] transition-colors cursor-pointer p-1">
                <X size={20} />
              </button>
            </div>

            {aimaLoading ? (
              <div className="py-20 flex flex-col items-center gap-3">
                <div className="w-8 h-8 border-2 border-[#C4A484] border-t-transparent rounded-full animate-spin" />
                <p className="text-[10px] uppercase tracking-widest text-gray-400">A carregar dados AIMA...</p>
              </div>
            ) : aimaData ? (
              <div className="p-8 space-y-6">

                {/* Status AIMA */}
                <div className={`flex items-center gap-3 p-4 border ${aimaData.reserva.aima_dados_completos ? 'bg-emerald-50 border-emerald-200' : 'bg-amber-50 border-amber-200'}`}>
                  {aimaData.reserva.aima_dados_completos
                    ? <CheckCircle size={20} className="text-emerald-600 flex-shrink-0" />
                    : <Clock size={20} className="text-amber-600 flex-shrink-0" />}
                  <div>
                    <p className={`text-xs font-semibold uppercase tracking-widest ${aimaData.reserva.aima_dados_completos ? 'text-emerald-700' : 'text-amber-700'}`}>
                      {aimaData.reserva.aima_dados_completos ? 'Formulário preenchido — pronto para envio' : 'Aguardando preenchimento do formulário'}
                    </p>
                    <p className="text-[10px] text-gray-500 mt-0.5">
                      {aimaData.hospedes.length} hóspede{aimaData.hospedes.length !== 1 ? 's' : ''} · Check-in {new Date(aimaData.reserva.data_check_in).toLocaleDateString('pt-PT')}
                    </p>
                  </div>
                </div>

                {!aimaData.reserva.aima_dados_completos && (
                  <div className="border border-amber-200 bg-white p-4">
                    <p className="text-[10px] uppercase tracking-widest font-bold text-[#C4A484] mb-2">Enviar formulario ao hospede</p>
                    {aimaFormUrl ? (
                      <>
                        <div className="bg-[#FAF8F4] border border-gray-100 px-3 py-2 text-[10px] text-[#1E3932] break-all mb-3">
                          {aimaFormUrl}
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                          <button
                            onClick={sendAimaFormEmail}
                            disabled={sendingForm}
                            className="py-2 bg-[#1E3932] text-[#C4A484] text-[9px] uppercase tracking-widest font-bold hover:bg-[#C4A484] hover:text-white transition-colors text-center disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
                          >
                            {sendingForm ? 'A Enviar...' : 'Enviar Email'}
                          </button>
                          <button
                            onClick={() => window.open(aimaFormUrl, '_blank')}
                            className="py-2 border border-gray-200 text-gray-500 text-[9px] uppercase tracking-widest font-bold hover:bg-gray-50 transition-colors cursor-pointer"
                          >
                            Abrir Link
                          </button>
                          <button
                            onClick={() => navigator.clipboard?.writeText(aimaFormUrl)}
                            className="py-2 border border-gray-200 text-gray-500 text-[9px] uppercase tracking-widest font-bold hover:bg-gray-50 transition-colors cursor-pointer"
                          >
                            Copiar Link
                          </button>
                        </div>
                        {formSendResult && (
                          <p className={`mt-3 text-xs leading-relaxed ${formSendResult.ok ? 'text-emerald-700' : formSendResult.msg.includes('Link AIMA') ? 'text-amber-700' : 'text-red-600'}`}>
                            {formSendResult.msg}
                          </p>
                        )}
                      </>
                    ) : (
                      <p className="text-xs text-amber-700 leading-relaxed">
                        Esta reserva ainda nao devolveu um token do formulario AIMA. Verifique se a funcao de criacao de reserva esta a gerar o token.
                      </p>
                    )}
                  </div>
                )}

                {/* Guest list */}
                {aimaData.hospedes.length > 0 && (
                  <section>
                    <h3 className="text-[10px] uppercase tracking-widest font-semibold text-[#C4A484] border-b border-gray-100 pb-2 mb-3">Hóspedes</h3>
                    <div className="space-y-2">
                      {aimaData.hospedes.map((h, i) => (
                        <div key={h.id || i} className={`border transition-colors ${expandedGuest === i ? 'border-[#C4A484]' : 'border-gray-200'}`}>
                          {/* Guest header */}
                          <button
                            className="w-full flex items-center gap-3 px-4 py-3 text-left cursor-pointer"
                            onClick={() => setExpandedGuest(expandedGuest === i ? -1 : i)}
                          >
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${expandedGuest === i ? 'bg-[#1E3932] text-[#C4A484]' : 'bg-gray-100 text-gray-500'}`}>
                              {h.ordem || i + 1}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-[#1E3932] truncate">{h.nome} {h.sobrenome}</p>
                              <p className="text-[10px] text-gray-400">{h.tipo_documento} · {h.numero_documento}</p>
                            </div>
                            {h.documento_imagem_signed && (
                              <div
                                className="w-10 h-7 border border-[#C4A484] overflow-hidden flex-shrink-0 rounded-sm cursor-pointer hover:opacity-80 transition-opacity"
                                onClick={e => { e.stopPropagation(); setLightboxImg(h.documento_imagem_signed!); setLightboxLabel(`${h.nome} ${h.sobrenome || ''} — Documento`); }}
                                title="Ver documento"
                              >
                                <img src={h.documento_imagem_signed} alt="doc" className="w-full h-full object-cover" />
                              </div>
                            )}
                            {expandedGuest === i ? <ChevronUp size={14} className="text-gray-400 flex-shrink-0" /> : <ChevronDown size={14} className="text-gray-400 flex-shrink-0" />}
                          </button>
                          {/* Guest detail */}
                          {expandedGuest === i && (
                            <div className="px-4 pb-4 pt-1 border-t border-gray-100">
                              <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-xs">
                                <DetailRow label="Nome completo" value={`${h.nome || ''} ${h.sobrenome || ''}`.trim()} />
                                <DetailRow label="Email" value={h.email} />
                                <DetailRow label="Telefone" value={h.telefone} />
                                <DetailRow label="Data nascimento" value={h.data_nascimento ? new Date(h.data_nascimento).toLocaleDateString('pt-PT') : undefined} />
                                <DetailRow label="Local nascimento" value={h.local_nascimento} />
                                <DetailRow label="Nacionalidade" value={h.nacionalidade} />
                                <DetailRow label="Tipo documento" value={h.tipo_documento} />
                                <DetailRow label="Nº documento" value={h.numero_documento} />
                                <DetailRow label="País emissor" value={h.pais_emissor_documento} />
                                <DetailRow label="País residência" value={h.pais} />
                                <DetailRow label="Cidade" value={h.cidade} />
                                <DetailRow label="Morada" value={h.endereco1} />
                              </div>
                              {h.documento_imagem_signed ? (
                                <div className="mt-4">
                                  <p className="text-[10px] uppercase tracking-widest text-gray-400 mb-2">Documento Anexado</p>
                                  <button
                                    onClick={() => { setLightboxImg(h.documento_imagem_signed!); setLightboxLabel(`${h.nome} ${h.sobrenome || ''} — Documento`); }}
                                    className="group relative border border-gray-200 hover:border-[#C4A484] overflow-hidden w-full max-w-xs block transition-colors cursor-pointer"
                                  >
                                    <img src={h.documento_imagem_signed} alt="Documento de identificação" className="w-full object-contain" />
                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                                      <ZoomIn size={20} className="text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-md" />
                                    </div>
                                  </button>
                                  <p className="text-[9px] text-gray-400 mt-1 flex items-center gap-1"><ZoomIn size={9} /> Clique para ampliar</p>
                                </div>
                              ) : (
                                <div className="mt-4 border border-dashed border-gray-100 py-4 text-center">
                                  <p className="text-[10px] text-gray-300 uppercase tracking-widest">Sem documento anexado</p>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {/* Documentos de Identificação — gallery */}
                {aimaData.hospedes.length > 0 && (
                  <section>
                    <h3 className="text-[10px] uppercase tracking-widest font-semibold text-[#C4A484] border-b border-gray-100 pb-2 mb-3 flex items-center gap-2">
                      <Eye size={11} />
                      Documentos de Identificação
                    </h3>
                    {aimaData.hospedes.some(h => h.documento_imagem_signed) ? (
                      <div className="grid grid-cols-2 gap-3">
                        {aimaData.hospedes.filter(h => h.documento_imagem_signed).map((h, i) => (
                          <button
                            key={h.id || i}
                            onClick={() => { setLightboxImg(h.documento_imagem_signed!); setLightboxLabel(`${h.nome} ${h.sobrenome || ''} — Documento`); }}
                            className="group relative border border-gray-200 overflow-hidden bg-gray-50 hover:border-[#C4A484] transition-colors cursor-pointer aspect-video flex items-center justify-center"
                          >
                            <img
                              src={h.documento_imagem_signed}
                              alt={`Documento ${h.nome}`}
                              className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-200"
                            />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/35 transition-colors flex items-center justify-center">
                              <ZoomIn size={20} className="text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-lg" />
                            </div>
                            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent px-2 py-1.5">
                              <p className="text-white text-[9px] uppercase tracking-wider truncate text-left">{h.nome} {h.sobrenome}</p>
                            </div>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="border border-dashed border-gray-200 py-8 text-center">
                        <FileText size={24} className="text-gray-200 mx-auto mb-2" />
                        <p className="text-xs text-gray-400">Nenhum documento anexado</p>
                        <p className="text-[10px] text-gray-300 mt-1 leading-relaxed px-4">Os hóspedes podem anexar a foto do documento ao preencher o formulário AIMA.</p>
                      </div>
                    )}
                  </section>
                )}

                {/* Histórico de envios */}
                {aimaData.logs.length > 0 && (
                  <section>
                    <h3 className="text-[10px] uppercase tracking-widest font-semibold text-[#C4A484] border-b border-gray-100 pb-2 mb-3">Histórico de Envios</h3>
                    <div className="space-y-2">
                      {aimaData.logs.map(log => (
                        <div key={log.id} className={`flex items-start gap-3 px-4 py-3 text-xs border ${log.status === 'SUCESSO' ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}>
                          {log.status === 'SUCESSO'
                            ? <CheckCircle size={14} className="text-emerald-600 flex-shrink-0 mt-0.5" />
                            : <AlertCircle size={14} className="text-red-500 flex-shrink-0 mt-0.5" />}
                          <div className="flex-1 min-w-0">
                            <p className={`font-semibold uppercase tracking-widest text-[10px] ${log.status === 'SUCESSO' ? 'text-emerald-700' : 'text-red-700'}`}>{log.status}</p>
                            <p className="text-gray-500 text-[10px] mt-0.5">{new Date(log.criado_em).toLocaleString('pt-PT')}</p>
                            {log.erro && <p className="text-red-600 text-[10px] mt-1 break-words">{log.erro}</p>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {/* Send result banner */}
                {sendResult && (
                  <div className={`flex items-start gap-3 px-4 py-4 border ${sendResult.ok ? 'bg-emerald-50 border-emerald-300' : 'bg-red-50 border-red-300'}`}>
                    {sendResult.ok
                      ? <CheckCircle size={18} className="text-emerald-600 flex-shrink-0 mt-0.5" />
                      : <AlertCircle size={18} className="text-red-500 flex-shrink-0 mt-0.5" />}
                    <p className={`text-sm leading-relaxed ${sendResult.ok ? 'text-emerald-700' : 'text-red-700'}`}>{sendResult.msg}</p>
                  </div>
                )}

                {/* Footer actions */}
                <div className="flex gap-3 pt-2 border-t border-gray-100">
                  <button onClick={closeModal} className="flex-1 py-3 border border-gray-200 text-gray-500 text-[10px] uppercase tracking-widest hover:bg-gray-50 transition-colors cursor-pointer">
                    Fechar
                  </button>
                  <button
                    onClick={sendToAima}
                    disabled={sending || !aimaData.reserva.aima_dados_completos}
                    className={`flex-1 py-3 text-[10px] uppercase tracking-widest font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer ${aimaData.reserva.aima_dados_completos ? 'bg-[#1E3932] text-[#C4A484] hover:bg-[#C4A484] hover:text-white' : 'bg-gray-100 text-gray-400 cursor-not-allowed'} disabled:opacity-60`}
                  >
                    {sending ? (
                      <>
                        <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
                        A enviar para AIMA...
                      </>
                    ) : (
                      <>
                        <Send size={12} />
                        Enviar para AIMA
                      </>
                    )}
                  </button>
                </div>
              </div>
            ) : (
              <div className="py-16 text-center px-8">
                <FileText size={32} className="text-gray-200 mx-auto mb-4" />
                <p className="text-sm text-gray-400">Não foi possível carregar os dados AIMA desta reserva.</p>
                <p className="text-[10px] text-gray-300 mt-1 uppercase tracking-widest">Verifique se o formulário foi enviado ao hóspede.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Lightbox ──────────────────────────────────────── */}
      {lightboxImg && (
        <div
          className="fixed inset-0 z-[200] bg-black/92 flex items-center justify-center p-4"
          onClick={() => setLightboxImg(null)}
        >
          <div className="relative w-full max-w-3xl" onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
              <p className="text-white/60 text-[10px] uppercase tracking-widest truncate pr-4">{lightboxLabel}</p>
              <div className="flex gap-2 flex-shrink-0">
                <a
                  href={lightboxImg}
                  download
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white text-[10px] uppercase tracking-widest transition-colors"
                  onClick={e => e.stopPropagation()}
                >
                  <Download size={11} /> Guardar
                </a>
                <button
                  onClick={() => setLightboxImg(null)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white text-[10px] uppercase tracking-widest transition-colors cursor-pointer"
                >
                  <X size={11} /> Fechar
                </button>
              </div>
            </div>
            {/* Image */}
            <div className="border border-white/15 overflow-hidden bg-black/40">
              <img
                src={lightboxImg}
                alt={lightboxLabel}
                className="w-full max-h-[80vh] object-contain"
              />
            </div>
            <p className="text-white/30 text-[9px] uppercase tracking-widest text-center mt-3">Clique fora da imagem para fechar</p>
          </div>
        </div>
      )}
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div>
      <span className="text-[9px] uppercase tracking-widest text-gray-400 block mb-0.5">{label}</span>
      <span className="text-[#1E3932] font-medium">{value}</span>
    </div>
  );
}
