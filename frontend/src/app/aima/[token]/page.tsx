"use client";
import React, { useState, useEffect } from 'react';

const EDGE_URL = 'https://vuidkeygtxfbgxvmilya.supabase.co/functions/v1';

const PAISES = [
  'Portugal','Brasil','Angola','Moçambique','Cabo Verde','São Tomé e Príncipe','Guiné-Bissau','Timor-Leste',
  'Espanha','França','Reino Unido','Alemanha','Itália','Holanda','Bélgica','Suíça','Áustria','Polónia',
  'EUA','Canadá','México','Argentina','Chile','Colômbia','Venezuela','Peru','Uruguai',
  'China','Japão','Coreia do Sul','Índia','Austrália','Nova Zelândia','África do Sul','Marrocos',
  'Outro'
];

const TIPOS_DOC = ['Bilhete de Identidade','Passaporte','Carta de Condução','Título de Residência','Outro'];

interface ReservaInfo {
  checkIn: string;
  checkOut: string;
  quartoNome: string;
  jaPreenchido: boolean;
  codigoReserva: string;
}

export default function AimaFormPage({ params }: { params: { token: string } }) {
  const { token } = params;
  const [reserva, setReserva] = useState<ReservaInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');
  const [enviado, setEnviado] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    nome: '', sobrenome: '', email: '', telefone: '',
    data_nascimento: '', local_nascimento: '', nacionalidade: 'Portugal',
    tipo_documento: 'Passaporte', numero_documento: '', pais_emissor_documento: 'Portugal',
    pais: 'Portugal', cidade: '', endereco1: '', cep: '',
  });

  useEffect(() => {
    fetch(`${EDGE_URL}/aima-form/${token}`)
      .then(r => r.json())
      .then(d => {
        if (d.status === 'success') {
          setReserva(d.data);
          if (d.data.jaPreenchido) setEnviado(true);
        } else {
          setErro('Este link não é válido ou já expirou.');
        }
      })
      .catch(() => setErro('Erro ao carregar o formulário. Tente novamente.'))
      .finally(() => setLoading(false));
  }, [token]);

  const set = (field: string, value: string) => setForm(prev => ({ ...prev, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErro('');
    try {
      const resp = await fetch(`${EDGE_URL}/aima-form/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await resp.json();
      if (data.status === 'success') {
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

  if (loading) {
    return (
      <main className="min-h-screen bg-[#141414] flex items-center justify-center">
        <div className="text-white text-sm tracking-widest uppercase animate-pulse">A carregar...</div>
      </main>
    );
  }

  if (erro && !reserva) {
    return (
      <main className="min-h-screen bg-[#141414] flex items-center justify-center p-6">
        <div className="w-full max-w-md bg-white p-12 shadow-2xl text-center">
          <h1 className="text-2xl font-serif text-carapita-dark uppercase tracking-widest mb-4">Refúgio Carapita</h1>
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-4 rounded">{erro}</div>
        </div>
      </main>
    );
  }

  if (enviado) {
    return (
      <main className="min-h-screen bg-[#141414] flex items-center justify-center p-6">
        <div className="w-full max-w-md bg-white p-12 shadow-2xl text-center">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-serif text-carapita-dark uppercase tracking-widest mb-2">Refúgio Carapita</h1>
            <p className="text-[10px] text-carapita-muted tracking-mega uppercase">Identificação AIMA</p>
          </div>
          <div className="text-5xl mb-6">✅</div>
          <h2 className="text-xl font-serif text-carapita-dark mb-4">Dados Recebidos!</h2>
          <p className="text-sm text-gray-600 leading-relaxed mb-4">
            Os seus dados foram registados com sucesso. Receberá uma confirmação por email.
          </p>
          {reserva && (
            <div className="bg-[#FAF8F4] border border-[#D4C5A9] p-4 text-left text-xs mt-4">
              <div className="flex justify-between mb-1"><span className="text-gray-500 uppercase tracking-widest">Check-in</span><span className="font-semibold">{reserva.checkIn}</span></div>
              <div className="flex justify-between"><span className="text-gray-500 uppercase tracking-widest">Check-out</span><span className="font-semibold">{reserva.checkOut}</span></div>
            </div>
          )}
          <p className="text-[10px] text-gray-400 mt-6 tracking-wider">
            Estamos ansiosos por recebê-lo(a) no Refúgio Carapita!
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#141414] flex items-start justify-center p-6 py-12">
      <div className="w-full max-w-2xl bg-white shadow-2xl">
        {/* Header */}
        <div className="bg-[#1E3932] px-10 py-8 text-center">
          <h1 className="text-2xl font-serif text-[#C4A484] uppercase tracking-widest mb-1">Refúgio Carapita</h1>
          <p className="text-[10px] text-white/50 tracking-widest uppercase">Formulário de Identificação — AIMA</p>
        </div>

        {/* Info da reserva */}
        {reserva && (
          <div className="bg-[#FAF8F4] border-b border-[#D4C5A9] px-10 py-5">
            <div className="flex flex-wrap gap-6 text-xs">
              <div><span className="text-gray-400 uppercase tracking-widest block mb-0.5">Alojamento</span><span className="font-semibold text-[#1E3932]">{reserva.quartoNome}</span></div>
              <div><span className="text-gray-400 uppercase tracking-widest block mb-0.5">Check-in</span><span className="font-semibold text-[#1E3932]">{reserva.checkIn}</span></div>
              <div><span className="text-gray-400 uppercase tracking-widest block mb-0.5">Check-out</span><span className="font-semibold text-[#1E3932]">{reserva.checkOut}</span></div>
            </div>
          </div>
        )}

        <div className="px-10 py-8">
          <p className="text-sm text-gray-600 leading-relaxed mb-8">
            Por obrigação legal, necessitamos dos seus dados de identificação para comunicação à
            <strong> AIMA (Agência para a Integração, Migrações e Asilo)</strong>, conforme a legislação portuguesa de alojamento local.
          </p>

          <form onSubmit={handleSubmit} className="space-y-8">

            {/* Dados Pessoais */}
            <section>
              <h3 className="text-[10px] uppercase tracking-widest font-semibold text-[#C4A484] border-b border-gray-100 pb-2 mb-5">Dados Pessoais</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <Field label="Nome *" value={form.nome} onChange={v => set('nome', v)} placeholder="Nome próprio" required />
                <Field label="Apelido *" value={form.sobrenome} onChange={v => set('sobrenome', v)} placeholder="Apelido" required />
                <Field label="Email *" type="email" value={form.email} onChange={v => set('email', v)} placeholder="o-seu@email.com" required />
                <Field label="Telefone" type="tel" value={form.telefone} onChange={v => set('telefone', v)} placeholder="+351 900 000 000" />
                <Field label="Data de Nascimento *" type="date" value={form.data_nascimento} onChange={v => set('data_nascimento', v)} required />
                <Field label="Local de Nascimento" value={form.local_nascimento} onChange={v => set('local_nascimento', v)} placeholder="Cidade, País" />
                <SelectField label="Nacionalidade" value={form.nacionalidade} onChange={v => set('nacionalidade', v)} options={PAISES} />
              </div>
            </section>

            {/* Documento */}
            <section>
              <h3 className="text-[10px] uppercase tracking-widest font-semibold text-[#C4A484] border-b border-gray-100 pb-2 mb-5">Documento de Identificação</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <SelectField label="Tipo de Documento *" value={form.tipo_documento} onChange={v => set('tipo_documento', v)} options={TIPOS_DOC} />
                <Field label="Número do Documento *" value={form.numero_documento} onChange={v => set('numero_documento', v)} placeholder="Ex: AB123456" required />
                <SelectField label="País Emissor" value={form.pais_emissor_documento} onChange={v => set('pais_emissor_documento', v)} options={PAISES} />
              </div>
            </section>

            {/* Morada */}
            <section>
              <h3 className="text-[10px] uppercase tracking-widest font-semibold text-[#C4A484] border-b border-gray-100 pb-2 mb-5">Morada de Residência</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="md:col-span-2">
                  <Field label="Morada" value={form.endereco1} onChange={v => set('endereco1', v)} placeholder="Rua, número, andar" />
                </div>
                <Field label="Cidade" value={form.cidade} onChange={v => set('cidade', v)} placeholder="Cidade" />
                <Field label="Código Postal" value={form.cep} onChange={v => set('cep', v)} placeholder="0000-000" />
                <SelectField label="País" value={form.pais} onChange={v => set('pais', v)} options={PAISES} />
              </div>
            </section>

            {erro && (
              <div className="bg-red-50 border border-red-200 text-red-600 text-xs px-4 py-3 rounded">{erro}</div>
            )}

            <div className="bg-[#FAF8F4] border border-[#D4C5A9] p-4 text-[11px] text-gray-500 leading-relaxed">
              🔒 Os seus dados são tratados de forma confidencial e utilizados exclusivamente para cumprimento das obrigações legais do Refúgio Carapita perante a AIMA. Consulte a nossa{' '}
              <a href="/tratamento-dados" className="text-[#C4A484] underline" target="_blank">Política de Tratamento de Dados</a>.
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-[#1E3932] text-[#C4A484] uppercase text-xs tracking-widest py-4 hover:bg-[#C4A484] hover:text-white transition-colors duration-500 disabled:opacity-50"
            >
              {submitting ? 'A enviar...' : 'Submeter Dados de Identificação'}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}

// Componentes auxiliares
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
        className="border-b border-gray-200 outline-none pb-2 text-sm font-light focus:border-[#C4A484] transition-colors bg-transparent"
      >
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}
