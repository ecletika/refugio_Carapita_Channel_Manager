"use client";
import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

const EDGE_URL = 'https://vuidkeygtxfbgxvmilya.supabase.co/functions/v1';

// ── Countries (bilingual list kept simple) ────────────────────────────────────
const PAISES = [
  'Portugal','Brasil','Angola','Moçambique','Cabo Verde','São Tomé e Príncipe','Guiné-Bissau','Timor-Leste',
  'Espanha','França','Reino Unido','Alemanha','Itália','Holanda','Bélgica','Suíça','Áustria','Polónia',
  'EUA','Canadá','México','Argentina','Chile','Colômbia','Venezuela','Peru','Uruguai',
  'China','Japão','Coreia do Sul','Índia','Austrália','Nova Zelândia','África do Sul','Marrocos','Outro / Other',
];

const TIPOS_DOC_PT = ['Bilhete de Identidade','Passaporte','Carta de Condução','Título de Residência','Outro'];
const TIPOS_DOC_EN = ['Identity Card','Passport','Driving Licence','Residence Permit','Other'];

// ── Translations ──────────────────────────────────────────────────────────────
const TR = {
  PT: {
    // AIMA full name
    aimaFull: 'AIMA (Integração, Migração e Asilo)',
    // Header
    formTitle: 'Formulário de Identificação',
    formSubtitle: 'AIMA — Agência para a Integração, Migração e Asilo',
    // Legal intro
    legalText: (n: number) =>
      `Por obrigação legal, necessitamos dos dados de identificação de todos os hóspedes para comunicação à AIMA (Integração, Migração e Asilo), conforme a legislação portuguesa de alojamento local. Pode adicionar até ${n} hóspedes.`,
    // Sections
    personalData: 'Dados Pessoais',
    identDoc: 'Documento de Identificação',
    address: 'Morada de Residência',
    // Fields
    firstName: 'Nome', lastName: 'Apelido', email: 'Email', phone: 'Telefone',
    dob: 'Data de Nascimento', pob: 'Local de Nascimento', nationality: 'Nacionalidade',
    docType: 'Tipo de Documento', docNumber: 'Número do Documento', docCountry: 'País Emissor',
    docPhoto: 'Fotografia do Documento', docPhotoReq: 'Fotografia do Documento *',
    street: 'Morada', city: 'Cidade', zip: 'Código Postal', country: 'País',
    // Image
    takePhoto: 'Tirar foto', orSelect: 'ou selecionar imagem',
    docOfId: 'do documento de identificação',
    docRequired: '⚠ Imagem obrigatória para cumprimento da AIMA (Integração, Migração e Asilo)',
    docAttached: 'Documento anexado',
    docSecure: 'A imagem será enviada de forma segura.',
    removeImg: 'Remover imagem',
    // Accordion
    mainGuest: 'Hóspede Principal', guest: 'Hóspede',
    addGuest: (n: number) => `Adicionar Hóspede ${n} de 4`,
    removeGuest: 'Remover hóspede',
    // Submit
    submit: (n: number) => n > 1 ? `Submeter ${n} Hóspedes` : 'Submeter Identificação',
    submitting: 'A enviar...',
    // Privacy
    privacyNote: 'Os dados e imagens dos documentos são tratados de forma confidencial e utilizados exclusivamente para cumprimento das obrigações legais perante a AIMA (Integração, Migração e Asilo). Consulte a nossa',
    privacyLink: 'Política de Tratamento de Dados',
    // Success
    received: 'Dados Recebidos!',
    successMsg: 'Os dados de identificação foram registados com sucesso.',
    registered: (n: number) => `${n} hóspede${n > 1 ? 's' : ''} registado${n > 1 ? 's' : ''}`,
    waiting: 'Estamos ansiosos por recebê-lo(a) no Refúgio Carapita!',
    // Reservation
    accommodation: 'Alojamento', checkIn: 'Check-in', checkOut: 'Check-out', reservation: 'Reserva',
    // Errors
    tokenMissing: 'Token em falta. Verifique o link recebido por email.',
    linkInvalid: 'Este link não é válido ou já expirou.',
    loadError: 'Erro ao carregar o formulário. Tente novamente.',
    submitError: 'Erro ao enviar os dados. Tente novamente.',
    connError: 'Erro de comunicação. Verifique a sua ligação.',
    imageRequired: (n: number) => `O Hóspede ${n} ainda não tem fotografia do documento. A imagem é obrigatória para comunicação à AIMA (Integração, Migração e Asilo).`,
    fieldsMissing: (n: number, campos: string) => `Hóspede ${n}: preencha ${campos}. Todos os hóspedes precisam destes dados para a comunicação à AIMA.`,
    loading: 'A carregar...',
  },
  EN: {
    aimaFull: 'AIMA (Integration, Migration and Asylum)',
    formTitle: 'Identification Form',
    formSubtitle: 'AIMA — Agency for Integration, Migration and Asylum',
    legalText: (n: number) =>
      `By legal obligation, we require identification data from all guests for submission to AIMA (Integration, Migration and Asylum), in accordance with Portuguese local accommodation legislation. You can add up to ${n} guests.`,
    personalData: 'Personal Details',
    identDoc: 'Identification Document',
    address: 'Residential Address',
    firstName: 'First Name', lastName: 'Last Name', email: 'Email', phone: 'Phone',
    dob: 'Date of Birth', pob: 'Place of Birth', nationality: 'Nationality',
    docType: 'Document Type', docNumber: 'Document Number', docCountry: 'Issuing Country',
    docPhoto: 'Document Photo', docPhotoReq: 'Document Photo *',
    street: 'Address', city: 'City', zip: 'Postal Code', country: 'Country',
    takePhoto: 'Take a photo', orSelect: 'or select an image',
    docOfId: 'of your identification document',
    docRequired: '⚠ Image required for AIMA (Integration, Migration and Asylum) compliance',
    docAttached: 'Document attached',
    docSecure: 'The image will be transmitted securely.',
    removeImg: 'Remove image',
    mainGuest: 'Main Guest', guest: 'Guest',
    addGuest: (n: number) => `Add Guest ${n} of 4`,
    removeGuest: 'Remove guest',
    submit: (n: number) => n > 1 ? `Submit ${n} Guests` : 'Submit Identification',
    submitting: 'Sending...',
    privacyNote: 'Document data and images are treated confidentially and used exclusively to fulfil legal obligations before AIMA (Integration, Migration and Asylum). See our',
    privacyLink: 'Data Processing Policy',
    received: 'Data Received!',
    successMsg: 'Identification data has been successfully registered.',
    registered: (n: number) => `${n} guest${n > 1 ? 's' : ''} registered`,
    waiting: 'We look forward to welcoming you to Refúgio Carapita!',
    accommodation: 'Accommodation', checkIn: 'Check-in', checkOut: 'Check-out', reservation: 'Booking',
    tokenMissing: 'Token missing. Please check the link received by email.',
    linkInvalid: 'This link is not valid or has expired.',
    loadError: 'Error loading the form. Please try again.',
    submitError: 'Error submitting data. Please try again.',
    connError: 'Communication error. Please check your connection.',
    imageRequired: (n: number) => `Guest ${n} does not yet have a document photo. An image is required for AIMA (Integration, Migration and Asylum) submission.`,
    fieldsMissing: (n: number, campos: string) => `Guest ${n}: please fill in ${campos}. All guests need this data for AIMA submission.`,
    loading: 'Loading...',
  },
};

type Lang = 'PT' | 'EN';

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

// ── Language toggle button ────────────────────────────────────────────────────
function LangButton({ lang, setLang }: { lang: Lang; setLang: (l: Lang) => void }) {
  return (
    <button
      type="button"
      onClick={() => setLang(lang === 'PT' ? 'EN' : 'PT')}
      className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest font-bold text-[#C4A484] hover:text-white border border-[#C4A484]/40 hover:border-[#C4A484] px-3 py-1.5 transition-colors cursor-pointer"
    >
      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 010 20M12 2a15.3 15.3 0 000 20"/>
      </svg>
      {lang === 'PT' ? 'English' : 'Português'}
    </button>
  );
}

// ── Inner component ───────────────────────────────────────────────────────────
function AimaFormInner() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token') ?? '';

  const [lang, setLang]           = useState<Lang>('PT');
  const [reserva, setReserva]     = useState<ReservaInfo | null>(null);
  const [loading, setLoading]     = useState(true);
  const [erro, setErro]           = useState('');
  const [enviado, setEnviado]     = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [totalEnviados, setTotalEnviados] = useState(0);

  const [hospedes, setHospedes]   = useState<HospedeForm[]>([defaultHospede()]);
  const [activeIdx, setActiveIdx] = useState(0);
  const fileRefs = useRef<(HTMLInputElement | null)[]>([]);

  const t = TR[lang];
  const tiposDoc = lang === 'PT' ? TIPOS_DOC_PT : TIPOS_DOC_EN;

  useEffect(() => {
    if (!token) {
      setErro(t.tokenMissing);
      setLoading(false);
      return;
    }
    fetch(`${EDGE_URL}/aima-form/${token}`)
      .then(r => r.json())
      .then(d => {
        if (d.status === 'success') {
          setReserva(d.data);
          if (d.data.jaPreenchido) setEnviado(true);
        } else setErro(t.linkInvalid);
      })
      .catch(() => setErro(t.loadError))
      .finally(() => setLoading(false));
  }, [token]); // eslint-disable-line

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
    } catch { /* ignore */ }
  };

  const removeImage = (idx: number) => {
    setHospedes(prev => prev.map((h, i) => i === idx ? {
      ...h, documento_imagem_base64: '', documento_imagem_mime: '', documento_imagem_preview: '',
    } : h));
    if (fileRefs.current[idx]) fileRefs.current[idx]!.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro('');

    // ── Campos obrigatórios para TODOS os hóspedes (exigência da AIMA) ───────
    for (let i = 0; i < hospedes.length; i++) {
      const h = hospedes[i];
      const faltam: string[] = [];
      if (!h.nome.trim()) faltam.push(t.firstName);
      if (!h.sobrenome.trim()) faltam.push(t.lastName);
      if (!h.data_nascimento) faltam.push(t.dob);
      if (!h.numero_documento.trim()) faltam.push(t.docNumber);
      if (faltam.length > 0) {
        setErro(t.fieldsMissing(i + 1, faltam.join(', ')));
        setActiveIdx(i);
        setTimeout(() => {
          document.querySelectorAll('[data-guest-accordion]')[i]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 100);
        return;
      }
    }

    // ── Imagem obrigatória para TODOS os hóspedes ───────────────────────────
    for (let i = 0; i < hospedes.length; i++) {
      if (!hospedes[i].documento_imagem_base64) {
        setErro(t.imageRequired(i + 1));
        setActiveIdx(i); // abre o accordion do hóspede sem imagem
        // scroll suave até ao accordion
        setTimeout(() => {
          document.querySelectorAll('[data-guest-accordion]')[i]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 100);
        return;
      }
    }

    setSubmitting(true);
    try {
      const payload = hospedes.map(h => ({
        nome: h.nome, sobrenome: h.sobrenome, email: h.email, telefone: h.telefone,
        data_nascimento: h.data_nascimento, local_nascimento: h.local_nascimento,
        nacionalidade: h.nacionalidade, tipo_documento: h.tipo_documento,
        numero_documento: h.numero_documento, pais_emissor_documento: h.pais_emissor_documento,
        pais: h.pais, cidade: h.cidade, endereco1: h.endereco1, cep: h.cep,
        documento_imagem_base64: h.documento_imagem_base64,
        documento_imagem_mime: h.documento_imagem_mime,
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
        setErro(data.error || t.submitError);
      }
    } catch {
      setErro(t.connError);
    } finally {
      setSubmitting(false);
    }
  };

  /* ── Loading ── */
  if (loading) return (
    <main className="min-h-screen bg-[#141414] flex items-center justify-center">
      <div className="text-white text-sm tracking-widest uppercase animate-pulse">{TR.PT.loading}</div>
    </main>
  );

  /* ── Error (no reservation) ── */
  if (erro && !reserva) return (
    <main className="min-h-screen bg-[#141414] flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-white p-12 shadow-2xl text-center">
        <div className="flex justify-end mb-4">
          <LangButton lang={lang} setLang={setLang} />
        </div>
        <h1 className="text-2xl font-serif text-[#1E3932] uppercase tracking-widest mb-4">Refúgio Carapita</h1>
        <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-4 rounded">{erro}</div>
      </div>
    </main>
  );

  /* ── Success ── */
  if (enviado) return (
    <main className="min-h-screen bg-[#141414] flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-white p-12 shadow-2xl text-center">
        <div className="flex justify-end mb-2">
          <LangButton lang={lang} setLang={setLang} />
        </div>
        <div className="text-center mb-8">
          <h1 className="text-2xl font-serif text-[#1E3932] uppercase tracking-widest mb-2">Refúgio Carapita</h1>
          <p className="text-[10px] text-gray-400 tracking-widest uppercase">{t.formSubtitle}</p>
        </div>
        <div className="w-16 h-16 rounded-full bg-green-50 border-2 border-green-200 flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-xl font-serif text-[#1E3932] mb-3">{t.received}</h2>
        <p className="text-sm text-gray-500 leading-relaxed mb-2">{t.successMsg}</p>
        {totalEnviados > 0 && (
          <p className="text-xs text-[#C4A484] font-semibold tracking-wider mb-4">{t.registered(totalEnviados)}</p>
        )}
        {reserva && (
          <div className="bg-[#FAF8F4] border border-[#D4C5A9] p-4 text-left text-xs mt-4">
            <div className="flex justify-between mb-1.5">
              <span className="text-gray-400 uppercase tracking-widest">{t.checkIn}</span>
              <span className="font-semibold text-[#1E3932]">{reserva.checkIn}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400 uppercase tracking-widest">{t.checkOut}</span>
              <span className="font-semibold text-[#1E3932]">{reserva.checkOut}</span>
            </div>
          </div>
        )}
        <p className="text-[10px] text-gray-400 mt-6 tracking-wider">{t.waiting}</p>
      </div>
    </main>
  );

  /* ── Main form ── */
  return (
    <main className="min-h-screen bg-[#141414] flex items-start justify-center p-4 py-10">
      <div className="w-full max-w-2xl bg-white shadow-2xl">

        {/* Header */}
        <div className="bg-[#1E3932] px-8 py-6">
          <div className="flex items-start justify-between gap-4 mb-3">
            <div>
              <h1 className="text-2xl font-serif text-[#C4A484] uppercase tracking-widest mb-1">Refúgio Carapita</h1>
              <p className="text-[10px] text-white/50 tracking-widest uppercase">{t.formTitle}</p>
            </div>
            <LangButton lang={lang} setLang={setLang} />
          </div>
          {/* AIMA full name banner */}
          <div className="mt-2 border-t border-white/10 pt-3">
            <p className="text-[10px] text-white/40 tracking-widest uppercase leading-relaxed">
              {t.formSubtitle}
            </p>
          </div>
        </div>

        {/* Reserva info */}
        {reserva && (
          <div className="bg-[#FAF8F4] border-b border-[#D4C5A9] px-8 py-4">
            <div className="flex flex-wrap gap-6 text-xs">
              <div><span className="text-gray-400 uppercase tracking-widest block mb-0.5">{t.accommodation}</span><span className="font-semibold text-[#1E3932]">{reserva.quartoNome}</span></div>
              <div><span className="text-gray-400 uppercase tracking-widest block mb-0.5">{t.checkIn}</span><span className="font-semibold text-[#1E3932]">{reserva.checkIn}</span></div>
              <div><span className="text-gray-400 uppercase tracking-widest block mb-0.5">{t.checkOut}</span><span className="font-semibold text-[#1E3932]">{reserva.checkOut}</span></div>
              {reserva.codigoReserva && (
                <div><span className="text-gray-400 uppercase tracking-widest block mb-0.5">{t.reservation}</span><span className="font-mono font-semibold text-[#C4A484]">{reserva.codigoReserva}</span></div>
              )}
            </div>
          </div>
        )}

        <div className="px-8 py-8">
          <p className="text-sm text-gray-500 leading-relaxed mb-6">
            {t.legalText(4)}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">

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
                t={t}
                tiposDoc={tiposDoc}
              />
            ))}

            {hospedes.length < 4 && (
              <button
                type="button"
                onClick={addHospede}
                className="w-full flex items-center justify-center gap-2 border border-dashed border-[#C4A484] text-[#C4A484] text-xs uppercase tracking-widest py-3.5 hover:bg-[#FAF8F4] transition-colors cursor-pointer"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                {t.addGuest(hospedes.length + 1)}
              </button>
            )}

            {hospedes.length > 1 && (
              <div className="flex gap-1.5 justify-center pt-1">
                {hospedes.map((_, i) => (
                  <div key={i} className={`h-1.5 rounded-full transition-all ${i === activeIdx ? 'w-6 bg-[#C4A484]' : 'w-1.5 bg-gray-200'}`} />
                ))}
              </div>
            )}

            {/* Error */}
            {erro && (
              <div className="bg-red-50 border border-red-200 text-red-600 text-xs px-4 py-3 rounded flex items-start gap-2">
                <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                </svg>
                {erro}
              </div>
            )}

            {/* Privacy note */}
            <div className="bg-[#FAF8F4] border border-[#D4C5A9] p-4 text-[11px] text-gray-500 leading-relaxed">
              {t.privacyNote}{' '}
              <a href="/tratamento-dados" className="text-[#C4A484] underline" target="_blank" rel="noreferrer">
                {t.privacyLink}
              </a>.
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-[#1E3932] text-[#C4A484] uppercase text-xs tracking-widest py-4 hover:bg-[#C4A484] hover:text-white transition-colors duration-500 disabled:opacity-50 cursor-pointer"
            >
              {submitting ? t.submitting : t.submit(hospedes.length)}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}

// ── Guest Accordion ───────────────────────────────────────────────────────────
type TType = typeof TR['PT'];

function GuestAccordion({
  idx, hospede, isOpen, onToggle, onChange, onRemove,
  fileRef, onImageSelect, onImageRemove, t, tiposDoc,
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
  t: TType;
  tiposDoc: string[];
}) {
  const label = idx === 0 ? t.mainGuest : `${t.guest} ${idx + 1}`;
  const displayName = hospede.nome ? `${hospede.nome}${hospede.sobrenome ? ' ' + hospede.sobrenome : ''}` : label;
  const hasDoc = !!hospede.documento_imagem_preview;
  const missingImage = !hasDoc;

  return (
    <div
      data-guest-accordion
      className={`border transition-colors ${isOpen ? 'border-[#C4A484]' : missingImage ? 'border-orange-200' : 'border-gray-200'}`}
    >
      {/* Accordion header */}
      <div className="flex items-center gap-3 px-5 py-4 cursor-pointer select-none" onClick={onToggle}>
        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 transition-colors ${isOpen ? 'bg-[#1E3932] text-[#C4A484]' : 'bg-gray-100 text-gray-500'}`}>
          {idx + 1}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[10px] uppercase tracking-widest text-gray-400 leading-none mb-0.5">{label}</div>
          <div className={`text-sm font-medium truncate ${hospede.nome ? 'text-[#1E3932]' : 'text-gray-300'}`}>{displayName}</div>
        </div>
        {/* Image status badge */}
        {hasDoc && !isOpen && (
          <div className="flex-shrink-0 w-10 h-7 border border-[#D4C5A9] overflow-hidden rounded-sm">
            <img src={hospede.documento_imagem_preview} alt="doc" className="w-full h-full object-cover" />
          </div>
        )}
        {!hasDoc && !isOpen && (
          <div className="flex-shrink-0 text-[9px] uppercase tracking-widest text-orange-500 font-bold bg-orange-50 border border-orange-200 px-2 py-0.5 rounded-sm">
            Foto
          </div>
        )}
        {onRemove && (
          <button type="button" onClick={(e) => { e.stopPropagation(); onRemove(); }}
            className="flex-shrink-0 text-gray-300 hover:text-red-400 transition-colors cursor-pointer p-1" title={t.removeGuest}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
        <svg className={`w-4 h-4 text-gray-400 flex-shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </div>

      {/* Accordion body */}
      {isOpen && (
        <div className="px-5 pb-6 border-t border-gray-100 pt-5 space-y-7">

          {/* Personal data */}
          <section>
            <SectionTitle>{t.personalData}</SectionTitle>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label={`${t.firstName} *`} value={hospede.nome} onChange={v => onChange('nome', v)} placeholder="—" required />
              <Field label={`${t.lastName} *`} value={hospede.sobrenome} onChange={v => onChange('sobrenome', v)} placeholder="—" required />
              <Field label={idx === 0 ? `${t.email} *` : t.email} type="email" value={hospede.email} onChange={v => onChange('email', v)} placeholder="—" required={idx === 0} />
              <Field label={t.phone} type="tel" value={hospede.telefone} onChange={v => onChange('telefone', v)} placeholder="+351 900 000 000" />
              <Field label={`${t.dob} *`} type="date" value={hospede.data_nascimento} onChange={v => onChange('data_nascimento', v)} required />
              <Field label={t.pob} value={hospede.local_nascimento} onChange={v => onChange('local_nascimento', v)} placeholder="—" />
              <SelectField label={t.nationality} value={hospede.nacionalidade} onChange={v => onChange('nacionalidade', v)} options={PAISES} />
            </div>
          </section>

          {/* Document */}
          <section>
            <SectionTitle>{t.identDoc}</SectionTitle>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <SelectField label={t.docType} value={hospede.tipo_documento} onChange={v => onChange('tipo_documento', v)} options={tiposDoc} />
              <Field label={`${t.docNumber} *`} value={hospede.numero_documento} onChange={v => onChange('numero_documento', v)} placeholder="Ex: AB123456" required />
              <SelectField label={t.docCountry} value={hospede.pais_emissor_documento} onChange={v => onChange('pais_emissor_documento', v)} options={PAISES} />
            </div>

            {/* Image upload — OBRIGATÓRIO */}
            <div className="mt-4">
              <label className="text-[10px] uppercase tracking-widest font-semibold text-gray-500 block mb-1">
                {t.docPhotoReq}
              </label>
              <p className="text-[10px] text-orange-500 mb-2 leading-relaxed">{t.docRequired}</p>

              {hospede.documento_imagem_preview ? (
                <div className="flex items-start gap-4 p-3 border border-[#D4C5A9] bg-[#FAF8F4]">
                  <div className="w-24 h-16 border border-gray-200 overflow-hidden flex-shrink-0 bg-white rounded-sm">
                    <img src={hospede.documento_imagem_preview} alt="Documento" className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-[#1E3932] font-medium mb-1">{t.docAttached}</p>
                    <p className="text-[10px] text-gray-400 mb-2">{t.docSecure}</p>
                    <button type="button" onClick={onImageRemove}
                      className="text-[10px] uppercase tracking-widest text-red-400 hover:text-red-600 cursor-pointer">
                      {t.removeImg}
                    </button>
                  </div>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-orange-200 hover:border-[#C4A484] bg-orange-50/40 hover:bg-[#FAF8F4] transition-colors px-4 py-8 cursor-pointer">
                  <svg className="w-9 h-9 text-orange-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span className="text-xs text-gray-500 text-center leading-relaxed">
                    <span className="text-[#C4A484] font-semibold">{t.takePhoto}</span> {t.orSelect}<br />
                    <span className="text-[10px] text-gray-400">{t.docOfId}</span>
                  </span>
                  <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,image/heic,image/*" className="hidden"
                    onChange={e => e.target.files?.[0] && onImageSelect(e.target.files[0])} />
                </label>
              )}
            </div>
          </section>

          {/* Address */}
          <section>
            <SectionTitle>{t.address}</SectionTitle>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <Field label={t.street} value={hospede.endereco1} onChange={v => onChange('endereco1', v)} placeholder="—" />
              </div>
              <Field label={t.city} value={hospede.cidade} onChange={v => onChange('cidade', v)} placeholder="—" />
              <Field label={t.zip} value={hospede.cep} onChange={v => onChange('cep', v)} placeholder="0000-000" />
              <SelectField label={t.country} value={hospede.pais} onChange={v => onChange('pais', v)} options={PAISES} />
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
        style={{ fontSize: '16px' }}
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
        value={value}
        style={{ fontSize: '16px' }}
        onChange={e => onChange(e.target.value)}
        className="border-b border-gray-200 outline-none pb-2 text-sm font-light focus:border-[#C4A484] transition-colors bg-transparent cursor-pointer"
      >
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}

/* ── Root export ── */
export default function AimaFormPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-[#141414] flex items-center justify-center">
        <div className="text-white text-sm tracking-widest uppercase animate-pulse">A carregar...</div>
      </main>
    }>
      <AimaFormInner />
    </Suspense>
  );
}
