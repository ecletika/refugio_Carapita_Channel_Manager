"use client";
import React, { useState, useEffect, useRef } from 'react';

const EDGE_URL = 'https://vuidkeygtxfbgxvmilya.supabase.co/functions/v1';

const PAISES = [
  'Portugal','Brasil','Angola','Moçambique','Cabo Verde','São Tomé e Príncipe','Guiné-Bissau','Timor-Leste',
  'Espanha','França','Reino Unido','Alemanha','Itália','Holanda','Bélgica','Suíça','Áustria','Polónia',
  'EUA','Canadá','México','Argentina','Chile','Colômbia','Venezuela','Peru','Uruguai',
  'China','Japão','Coreia do Sul','Índia','Austrália','Nova Zelândia','África do Sul','Marrocos','Outro',
];
const TIPOS_DOC = ['Bilhete de Identidade','Passaporte','Carta de Condução','Título de Residência','Outro'];

interface ReservaInfo {
  checkIn: string; checkOut: string; quartoNome: string;
  jaPreenchido: boolean; codigoReserva: string;
}

interface HospedeForm {
  nome: string; sobrenome: string; email: string; telefone: string;
  data_nascimento: string; local_nascimento: string; nacionalidade: string;
  tipo_documento: string; numero_documento: string; pais_emissor_documento: string;
  pais: string; cidade: string; endereco1: string; cep: string;
  documento_imagem_base64: string; documento_imagem_mime: string; documento_imagem_preview: string;
}

function defaultHospede(): HospedeForm {
  return {
    nome: '', sobrenome: '', email: '', telefone: '', data_nascimento: '',
    local_nascimento: '', nacionalidade: 'Portugal', tipo_documento: 'Passaporte',
    numero_documento: '', pais_emissor_documento: 'Portugal',
    pais: 'Portugal', cidade: '', endereco1: '', cep: '',
    documento_imagem_base64: '', documento_imagem_mime: '', documento_imagem_preview: '',
  };
}

async function compressImage(file: File): Promise<{ base64: string; mime: string; preview: string }> {
  return new Promise((resolve) => {
    const img = new Image();
    const objUrl = URL.createObjectURL(file);
    img.onload = () => {
      const MAX = 1600;
      let w = img.width, h = img.height;
      if (w > MAX || h > MAX) {
        if (w > h) { h = Math.round(h * MAX / w); w = MAX; }
        else { w = Math.round(w * MAX / h); h = MAX; }
      }
      const canvas = document.createElement('canvas');
      canvas.width = w; canvas.height = h;
      canvas.getContext('2d')!.drawImage(img, 0, 0, w, h);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.82);
      URL.revokeObjectURL(objUrl);
      resolve({ base64: dataUrl.split(',')[1], mime: 'image/jpeg', preview: dataUrl });
    };
    img.onerror = () => {
      // fallback: read as-is
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        resolve({ base64: dataUrl.split(',')[1], mime: file.type, preview: dataUrl });
      };
      reader.readAsDataURL(file);
    };
    img.src = objUrl;
  });
}

export default function AimaFormPage({ params }: { params: { token: string } }) {
  const { token } = params;
  const [reserva, setReserva] = useState<ReservaInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');
  const [enviado, setEnviado] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [totalEnviados, setTotalEnviados] = useState(0);

  const [hospedes, setHospedes] = useState<HospedeForm[]>([defaultHospede()]);
  const [activeIdx, setActiveIdx] = useState(0);
  const fileRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    fetch(`${EDGE_URL}/aima-form/${token}`)
      .then(r => r.json())
      .then(d => {
        if (d.status === 'success') {
          setReserva(d.data);
          if (d.data.jaPreenchido) setEnviado(true);
        } else setErro('Este link não é válido ou já expirou.');
      })
      .catch(() => setErro('Erro ao carregar o formulário. Tente novamente.'))
      .finally(() => setLoading(false));
  }, [token]);

  const setHospede = (idx: number, field: keyof HospedeForm, value: string) => {
    setHospedes(prev => prev.map((h, i) => i === idx ? { ...h, [field]: value } : h));
  };

  const addHospede = () => {
    if (hospedes.length >= 4) return;
    const next = hospedes.length;
    setHospedes(prev => [...prev, defaultHospede()]);
    setActiveIdx(next);
  };

  const removeHospede = (idx: number) => {
    setHospedes(prev => prev.filter((_, i) => i !== idx));
    setActiveIdx(Math.max(0, idx - 1));
  };

  const handleImage = async (idx: number, file: File) => {
    try {
      const result = await compressImage(file);
      setHospedes(prev => prev.map((h, i) => i === idx ? {
        ...h,
        documento_imagem_base64: result.base64,
        documento_imagem_mime: result.mime,
        documento_imagem_preview: result.preview,
      } : h));
    } catch {
      // ignore
    }
  };

  const removeImage = (idx: number) => {
    setHospedes(prev => prev.map((h, i) => i === idx ? {
      ...h, documento_imagem_base64: '', documento_imagem_mime: '', documento_imagem_preview: '',
    } : h));
    if (fileRefs.current[idx]) fileRefs.current[idx]!.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErro('');
    try {
      const payload = hospedes.map(h => ({
        nome: h.nome, sobrenome: h.sobrenome, email: h.email, telefone: h.telefone,
        data_nascimento: h.data_nascimento, local_nascimento: h.local_nascimento,
        nacionalidade: h.nacionalidade, tipo_documento: h.tipo_documento,
        numero_documento: h.numero_documento, pais_emissor_documento: h.pais_emissor_documento,
        pais: h.pais, cidade: h.cidade, endereco1: h.endereco1, cep: h.cep,
        ...(h.documento_imagem_base64 ? {
          documento_imagem_base64: h.documento_imagem_base64,
          documento_imagem_mime: h.documento_imagem_mime,
        } : {}),
      }));

      const resp = await fetch(`${EDGE_URL}/aima-form/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hospedes: payload }),
      });
      const data = await resp.json();
      if (data.status === 'success') {
        setTotalEnviados(data.hospedes || hospedes.length);
        setEnviado(true);
      } else {
        setErro(data.error || 'Erro ao enviar os dados. Tente novamente.');
      }
    } catch {
      setErro('Erro de comunicação. Verifique a sua ligação.');
    } finally {
      setSubmitting(false);
    }
  };

  /* ── Screens ── */
  if (loading) return (
    <main className="min-h-screen bg-[#141414] flex items-center justify-center">
      <div className="text-white text-sm tracking-widest uppercase animate-pulse">A carregar...</div>
    </main>
  );

  if (erro && !reserva) return (
    <main className="min-h-screen bg-[#141414] flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-white p-12 shadow-2xl text-center">
        <h1 className="text-2xl font-serif text-[#1E3932] uppercase tracking-widest mb-4">Refúgio Carapita</h1>
        <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-4 rounded">{erro}</div>
      </div>
    </main>
  );

  if (enviado) return (
    <main className="min-h-screen bg-[#141414] flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-white p-12 shadow-2xl text-center">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-serif text-[#1E3932] uppercase tracking-widest mb-2">Refúgio Carapita</h1>
          <p className="text-[10px] text-gray-400 tracking-widest uppercase">Identificação AIMA</p>
        </div>
        <div className="w-16 h-16 rounded-full bg-green-50 border-2 border-green-200 flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-xl font-serif text-[#1E3932] mb-3">Dados Recebidos!</h2>
        <p className="text-sm text-gray-500 leading-relaxed mb-2">
          Os dados de identificação foram registados com sucesso.
        </p>
        {totalEnviados > 0 && (
          <p className="text-xs text-[#C4A484] font-semibold tracking-wider mb-4">
            {totalEnviados} hóspede{totalEnviados > 1 ? 's' : ''} registado{totalEnviados > 1 ? 's' : ''}
          </p>
        )}
        {reserva && (
          <div className="bg-[#FAF8F4] border border-[#D4C5A9] p-4 text-left text-xs mt-4">
            <div className="flex justify-between mb-1.5">
              <span className="text-gray-400 uppercase tracking-widest">Check-in</span>
              <span className="font-semibold text-[#1E3932]">{reserva.checkIn}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400 uppercase tracking-widest">Check-out</span>
              <span className="font-semibold text-[#1E3932]">{reserva.checkOut}</span>
            </div>
          </div>
        )}
        <p className="text-[10px] text-gray-400 mt-6 tracking-wider">
          Estamos ansiosos por recebê-lo(a) no Refúgio Carapita!
        </p>
      </div>
    </main>
  );

  /* ── Main form ── */
  return (
    <main className="min-h-screen bg-[#141414] flex items-start justify-center p-4 py-10">
      <div className="w-full max-w-2xl bg-white shadow-2xl">

        {/* Header */}
        <div className="bg-[#1E3932] px-8 py-8 text-center">
          <h1 className="text-2xl font-serif text-[#C4A484] uppercase tracking-widest mb-1">Refúgio Carapita</h1>
          <p className="text-[10px] text-white/50 tracking-widest uppercase">Formulário de Identificação — AIMA</p>
        </div>

        {/* Reserva info */}
        {reserva && (
          <div className="bg-[#FAF8F4] border-b border-[#D4C5A9] px-8 py-4">
            <div className="flex flex-wrap gap-6 text-xs">
              <div><span className="text-gray-400 uppercase tracking-widest block mb-0.5">Alojamento</span><span className="font-semibold text-[#1E3932]">{reserva.quartoNome}</span></div>
              <div><span className="text-gray-400 uppercase tracking-widest block mb-0.5">Check-in</span><span className="font-semibold text-[#1E3932]">{reserva.checkIn}</span></div>
              <div><span className="text-gray-400 uppercase tracking-widest block mb-0.5">Check-out</span><span className="font-semibold text-[#1E3932]">{reserva.checkOut}</span></div>
              {reserva.codigoReserva && <div><span className="text-gray-400 uppercase tracking-widest block mb-0.5">Reserva</span><span className="font-mono font-semibold text-[#C4A484]">{reserva.codigoReserva}</span></div>}
            </div>
          </div>
        )}

        <div className="px-8 py-8">
          <p className="text-sm text-gray-500 leading-relaxed mb-6">
            Por obrigação legal, necessitamos dos dados de identificação de <strong>todos os hóspedes</strong> para
            comunicação à <strong>AIMA</strong>, conforme a legislação portuguesa de alojamento local.
            Pode adicionar até <strong>4 hóspedes</strong>.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Guest accordions */}
            {hospedes.map((h, idx) => (
              <GuestAccordion
                key={idx}
                idx={idx}
                hospede={h}
                isOpen={activeIdx === idx}
                onToggle={() => setActiveIdx(activeIdx === idx ? -1 : idx)}
                onChange={(field, val) => setHospede(idx, field, val)}
                onRemove={idx > 0 ? () => removeHospede(idx) : undefined}
                fileRef={el => { fileRefs.current[idx] = el; }}
                onImageSelect={(file) => handleImage(idx, file)}
                onImageRemove={() => removeImage(idx)}
              />
            ))}

            {/* Add guest button */}
            {hospedes.length < 4 && (
              <button
                type="button"
                onClick={addHospede}
                className="w-full flex items-center justify-center gap-2 border border-dashed border-[#C4A484] text-[#C4A484] text-xs uppercase tracking-widest py-3.5 hover:bg-[#FAF8F4] transition-colors cursor-pointer"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                Adicionar Hóspede {hospedes.length + 1} de 4
              </button>
            )}

            {/* Hóspedes count indicator */}
            {hospedes.length > 1 && (
              <div className="flex gap-1.5 justify-center pt-1">
                {hospedes.map((_, i) => (
                  <div key={i} className={`h-1.5 rounded-full transition-all ${i === activeIdx ? 'w-6 bg-[#C4A484]' : 'w-1.5 bg-gray-200'}`} />
                ))}
              </div>
            )}

            {/* Error */}
            {erro && (
              <div className="bg-red-50 border border-red-200 text-red-600 text-xs px-4 py-3 rounded">{erro}</div>
            )}

            {/* Privacy note */}
            <div className="bg-[#FAF8F4] border border-[#D4C5A9] p-4 text-[11px] text-gray-500 leading-relaxed">
              🔒 Os dados e imagens dos documentos são tratados de forma confidencial e utilizados exclusivamente
              para cumprimento das obrigações legais perante a AIMA. Consulte a nossa{' '}
              <a href="/tratamento-dados" className="text-[#C4A484] underline" target="_blank">Política de Tratamento de Dados</a>.
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-[#1E3932] text-[#C4A484] uppercase text-xs tracking-widest py-4 hover:bg-[#C4A484] hover:text-white transition-colors duration-500 disabled:opacity-50 cursor-pointer"
            >
              {submitting ? 'A enviar...' : `Submeter ${hospedes.length > 1 ? `${hospedes.length} Hóspedes` : 'Identificação'}`}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}

/* ── Guest Accordion ── */
function GuestAccordion({
  idx, hospede, isOpen, onToggle, onChange, onRemove,
  fileRef, onImageSelect, onImageRemove,
}: {
  idx: number;
  hospede: HospedeForm;
  isOpen: boolean;
  onToggle: () => void;
  onChange: (field: keyof HospedeForm, value: string) => void;
  onRemove?: () => void;
  fileRef: (el: HTMLInputElement | null) => void;
  onImageSelect: (file: File) => void;
  onImageRemove: () => void;
}) {
  const label = idx === 0 ? 'Hóspede Principal' : `Hóspede ${idx + 1}`;
  const displayName = hospede.nome ? `${hospede.nome}${hospede.sobrenome ? ' ' + hospede.sobrenome : ''}` : label;
  const hasDoc = !!hospede.documento_imagem_preview;

  return (
    <div className={`border transition-colors ${isOpen ? 'border-[#C4A484]' : 'border-gray-200'}`}>
      {/* Accordion header */}
      <div
        className="flex items-center gap-3 px-5 py-4 cursor-pointer select-none"
        onClick={onToggle}
      >
        {/* Number badge */}
        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 transition-colors ${isOpen ? 'bg-[#1E3932] text-[#C4A484]' : 'bg-gray-100 text-gray-500'}`}>
          {idx + 1}
        </div>

        <div className="flex-1 min-w-0">
          <div className="text-[10px] uppercase tracking-widest text-gray-400 leading-none mb-0.5">{label}</div>
          <div className={`text-sm font-medium truncate ${hospede.nome ? 'text-[#1E3932]' : 'text-gray-300'}`}>
            {displayName}
          </div>
        </div>

        {/* Doc thumbnail */}
        {hasDoc && !isOpen && (
          <div className="flex-shrink-0 w-10 h-7 border border-[#D4C5A9] overflow-hidden rounded-sm">
            <img src={hospede.documento_imagem_preview} alt="doc" className="w-full h-full object-cover" />
          </div>
        )}

        {/* Remove button */}
        {onRemove && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onRemove(); }}
            className="flex-shrink-0 text-gray-300 hover:text-red-400 transition-colors cursor-pointer p-1"
            title="Remover hóspede"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}

        {/* Chevron */}
        <svg
          className={`w-4 h-4 text-gray-400 flex-shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </div>

      {/* Accordion body */}
      {isOpen && (
        <div className="px-5 pb-6 border-t border-gray-100 pt-5 space-y-7">

          {/* Dados Pessoais */}
          <section>
            <SectionTitle>Dados Pessoais</SectionTitle>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label={idx === 0 ? "Nome *" : "Nome"} value={hospede.nome} onChange={v => onChange('nome', v)} placeholder="Nome próprio" required={idx === 0} />
              <Field label={idx === 0 ? "Apelido *" : "Apelido"} value={hospede.sobrenome} onChange={v => onChange('sobrenome', v)} placeholder="Apelido" required={idx === 0} />
              <Field label={idx === 0 ? "Email *" : "Email"} type="email" value={hospede.email} onChange={v => onChange('email', v)} placeholder="o-seu@email.com" required={idx === 0} />
              <Field label="Telefone" type="tel" value={hospede.telefone} onChange={v => onChange('telefone', v)} placeholder="+351 900 000 000" />
              <Field label={idx === 0 ? "Data de Nascimento *" : "Data de Nascimento"} type="date" value={hospede.data_nascimento} onChange={v => onChange('data_nascimento', v)} required={idx === 0} />
              <Field label="Local de Nascimento" value={hospede.local_nascimento} onChange={v => onChange('local_nascimento', v)} placeholder="Cidade, País" />
              <SelectField label="Nacionalidade" value={hospede.nacionalidade} onChange={v => onChange('nacionalidade', v)} options={PAISES} />
            </div>
          </section>

          {/* Documento */}
          <section>
            <SectionTitle>Documento de Identificação</SectionTitle>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <SelectField label="Tipo de Documento" value={hospede.tipo_documento} onChange={v => onChange('tipo_documento', v)} options={TIPOS_DOC} />
              <Field label={idx === 0 ? "Número do Documento *" : "Número do Documento"} value={hospede.numero_documento} onChange={v => onChange('numero_documento', v)} placeholder="Ex: AB123456" required={idx === 0} />
              <SelectField label="País Emissor" value={hospede.pais_emissor_documento} onChange={v => onChange('pais_emissor_documento', v)} options={PAISES} />
            </div>

            {/* Document image upload */}
            <div className="mt-4">
              <label className="text-[10px] uppercase tracking-widest font-semibold text-gray-400 block mb-2">
                Fotografia do Documento
              </label>

              {hospede.documento_imagem_preview ? (
                /* Preview */
                <div className="flex items-start gap-4 p-3 border border-[#D4C5A9] bg-[#FAF8F4]">
                  <div className="w-24 h-16 border border-gray-200 overflow-hidden flex-shrink-0 bg-white">
                    <img
                      src={hospede.documento_imagem_preview}
                      alt="Documento"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-[#1E3932] font-medium mb-1">Documento anexado</p>
                    <p className="text-[10px] text-gray-400 mb-2">A imagem será enviada de forma segura.</p>
                    <button
                      type="button"
                      onClick={onImageRemove}
                      className="text-[10px] uppercase tracking-widest text-red-400 hover:text-red-600 cursor-pointer"
                    >
                      Remover imagem
                    </button>
                  </div>
                </div>
              ) : (
                /* Upload area */
                <label className="flex flex-col items-center justify-center gap-2 border border-dashed border-gray-300 hover:border-[#C4A484] bg-gray-50 hover:bg-[#FAF8F4] transition-colors px-4 py-6 cursor-pointer">
                  <svg className="w-8 h-8 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span className="text-xs text-gray-400 text-center leading-relaxed">
                    <span className="text-[#C4A484] font-medium">Tirar foto</span> ou selecionar imagem<br />
                    <span className="text-[10px]">do documento de identificação</span>
                  </span>
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/heic,image/*"
                    className="hidden"
                    onChange={e => e.target.files?.[0] && onImageSelect(e.target.files[0])}
                  />
                </label>
              )}
            </div>
          </section>

          {/* Morada */}
          <section>
            <SectionTitle>Morada de Residência</SectionTitle>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <Field label="Morada" value={hospede.endereco1} onChange={v => onChange('endereco1', v)} placeholder="Rua, número, andar" />
              </div>
              <Field label="Cidade" value={hospede.cidade} onChange={v => onChange('cidade', v)} placeholder="Cidade" />
              <Field label="Código Postal" value={hospede.cep} onChange={v => onChange('cep', v)} placeholder="0000-000" />
              <SelectField label="País" value={hospede.pais} onChange={v => onChange('pais', v)} options={PAISES} />
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

/* ── Sub-components ── */
function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-[10px] uppercase tracking-widest font-semibold text-[#C4A484] border-b border-gray-100 pb-2 mb-4">
      {children}
    </h3>
  );
}

function Field({ label, value, onChange, placeholder = '', type = 'text', required = false }: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; type?: string; required?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[10px] uppercase tracking-widest font-semibold text-gray-400">{label}</label>
      <input
        type={type} value={value} required={required} placeholder={placeholder}
        onChange={e => onChange(e.target.value)}
        className="border-b border-gray-200 outline-none pb-2 text-sm font-light focus:border-[#C4A484] transition-colors bg-transparent"
      />
    </div>
  );
}

function SelectField({ label, value, onChange, options }: {
  label: string; value: string; onChange: (v: string) => void; options: string[];
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[10px] uppercase tracking-widest font-semibold text-gray-400">{label}</label>
      <select
        value={value} onChange={e => onChange(e.target.value)}
        className="border-b border-gray-200 outline-none pb-2 text-sm font-light focus:border-[#C4A484] transition-colors bg-transparent cursor-pointer"
      >
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}
