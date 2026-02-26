"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    Calendar, User, Home, Euro, ArrowRight, ArrowLeft,
    CheckCircle, Info, Hash, MapPin, Phone, Mail, Plus, X, Sparkles
} from 'lucide-react';
import AdminSidebar from '@/components/AdminSidebar';

interface Quarto {
    id: string;
    nome: string;
    preco_base: number;
    capacidade: number;
}

interface Extra {
    id: string;
    nome: string;
    preco: number;
}

export default function NovaReservaManual() {
    const router = useRouter();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [quartos, setQuartos] = useState<Quarto[]>([]);
    const [extras, setExtras] = useState<Extra[]>([]);

    // Form State
    const [formData, setFormData] = useState({
        quartoId: '',
        checkIn: '',
        checkOut: '',
        canalNome: 'BALCÃO',
        metodoPagamento: 'DINHEIRO',
        requerimentosEspeciais: '',
        hospede: {
            nome: '',
            email: '',
            telefone: '',
            pais: 'Portugal',
            nif: ''
        },
        extrasIds: [] as string[]
    });

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [qResp, eResp] = await Promise.all([
                    fetch('http://localhost:5000/api/quartos'),
                    fetch('http://localhost:5000/api/extras')
                ]);
                const qData = await qResp.json();
                const eData = await eResp.json();
                if (qData.status === 'success') setQuartos(qData.data);
                if (eData.status === 'success') setExtras(eData.data);
            } catch (e) {
                console.error(e);
            }
        };
        fetchData();
    }, []);

    const handleSubmit = async () => {
        setLoading(true);
        const token = localStorage.getItem('token');
        try {
            const resp = await fetch('http://localhost:5000/api/reservas', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });
            const data = await resp.json();
            if (data.status === 'success') {
                router.push('/admin/reservas');
            } else {
                alert(data.error || 'Erro ao criar reserva');
            }
        } catch (e) {
            alert('Erro de comunicação');
        } finally {
            setLoading(false);
        }
    };

    const toggleExtra = (id: string) => {
        setFormData(prev => ({
            ...prev,
            extrasIds: prev.extrasIds.includes(id)
                ? prev.extrasIds.filter(x => x !== id)
                : [...prev.extrasIds, id]
        }));
    };

    return (
        <div className="min-h-screen bg-[#F9F8F6]">
            <AdminSidebar />

            <div className="ml-20 p-8 md:p-12 max-w-4xl mx-auto">
                <div className="mb-12 flex items-center justify-between">
                    <div>
                        <span className="text-carapita-gold text-[10px] uppercase tracking-mega font-bold block mb-1">Recepção</span>
                        <h1 className="text-4xl font-serif text-carapita-dark">Nova Reserva Manual</h1>
                    </div>
                    <div className="flex items-center gap-2">
                        {[1, 2, 3].map(s => (
                            <div key={s} className={`w-8 h-1 rounded-full ${step >= s ? 'bg-carapita-gold' : 'bg-gray-200'}`} />
                        ))}
                    </div>
                </div>

                <div className="bg-white border border-gray-100 shadow-xl overflow-hidden min-h-[500px] flex flex-col">
                    {/* STEP 1: DADOS DO HÓSPEDE */}
                    {step === 1 && (
                        <div className="p-10 flex-1 animate-fade-in">
                            <div className="flex items-center gap-3 mb-8">
                                <User className="text-carapita-gold" size={20} />
                                <h2 className="text-xl font-serif text-carapita-dark">Informações do Hóspede</h2>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-1">
                                    <label className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">Nome Completo</label>
                                    <input
                                        type="text"
                                        className="w-full border-b border-gray-100 py-3 outline-none focus:border-carapita-gold transition-colors text-sm"
                                        value={formData.hospede.nome}
                                        onChange={e => setFormData({ ...formData, hospede: { ...formData.hospede, nome: e.target.value } })}
                                        placeholder="Ex: João Silva"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">E-mail</label>
                                    <input
                                        type="email"
                                        className="w-full border-b border-gray-100 py-3 outline-none focus:border-carapita-gold transition-colors text-sm"
                                        value={formData.hospede.email}
                                        onChange={e => setFormData({ ...formData, hospede: { ...formData.hospede, email: e.target.value } })}
                                        placeholder="joao@exemplo.com"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">Telefone</label>
                                    <input
                                        type="tel"
                                        className="w-full border-b border-gray-100 py-3 outline-none focus:border-carapita-gold transition-colors text-sm"
                                        value={formData.hospede.telefone}
                                        onChange={e => setFormData({ ...formData, hospede: { ...formData.hospede, telefone: e.target.value } })}
                                        placeholder="+351 912 345 678"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">NIF / Identificação</label>
                                    <input
                                        type="text"
                                        className="w-full border-b border-gray-100 py-3 outline-none focus:border-carapita-gold transition-colors text-sm"
                                        value={formData.hospede.nif}
                                        onChange={e => setFormData({ ...formData, hospede: { ...formData.hospede, nif: e.target.value } })}
                                        placeholder="123456789"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* STEP 2: DATAS E QUARTO */}
                    {step === 2 && (
                        <div className="p-10 flex-1 animate-fade-in">
                            <div className="flex items-center gap-3 mb-8">
                                <Calendar className="text-carapita-gold" size={20} />
                                <h2 className="text-xl font-serif text-carapita-dark">Estadia e Alojamento</h2>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
                                <div className="space-y-1">
                                    <label className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">Check-in</label>
                                    <input
                                        type="date"
                                        className="w-full border-b border-gray-100 py-3 outline-none focus:border-carapita-gold transition-colors text-sm"
                                        value={formData.checkIn}
                                        onChange={e => setFormData({ ...formData, checkIn: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">Check-out</label>
                                    <input
                                        type="date"
                                        className="w-full border-b border-gray-100 py-3 outline-none focus:border-carapita-gold transition-colors text-sm"
                                        value={formData.checkOut}
                                        onChange={e => setFormData({ ...formData, checkOut: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="space-y-4">
                                <label className="text-[10px] uppercase tracking-widest text-gray-400 font-bold block mb-4">Selecionar Alojamento</label>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {quartos.map(q => (
                                        <div
                                            key={q.id}
                                            onClick={() => setFormData({ ...formData, quartoId: q.id })}
                                            className={`p-6 border cursor-pointer transition-all duration-300 ${formData.quartoId === q.id ? 'border-carapita-gold bg-carapita-gold/5 shadow-lg' : 'border-gray-100 hover:border-carapita-gold'}`}
                                        >
                                            <div className="flex justify-between items-start mb-2">
                                                <h4 className="font-serif text-lg text-carapita-dark">{q.nome}</h4>
                                                {formData.quartoId === q.id && <CheckCircle size={16} className="text-carapita-gold" />}
                                            </div>
                                            <div className="flex justify-between items-center text-[10px] text-gray-400 uppercase tracking-widest">
                                                <span>{q.capacidade} Hóspedes</span>
                                                <span className="font-bold text-carapita-gold">€{Number(q.preco_base).toFixed(0)} / noite</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* STEP 3: EXTRAS E PAGAMENTO */}
                    {step === 3 && (
                        <div className="p-10 flex-1 animate-fade-in">
                            <div className="flex items-center gap-3 mb-8">
                                <Sparkles className="text-carapita-gold" size={20} />
                                <h2 className="text-xl font-serif text-carapita-dark">Personalização e Pagamento</h2>
                            </div>

                            <div className="mb-10">
                                <label className="text-[10px] uppercase tracking-widest text-gray-400 font-bold block mb-4">Serviços Adicionais</label>
                                <div className="flex flex-wrap gap-2">
                                    {extras.map(e => (
                                        <button
                                            key={e.id}
                                            onClick={() => toggleExtra(e.id)}
                                            className={`px-4 py-2 border rounded-full text-[10px] uppercase tracking-widest transition-all ${formData.extrasIds.includes(e.id) ? 'bg-carapita-dark text-white border-carapita-dark' : 'border-gray-200 text-gray-400 hover:border-carapita-gold hover:text-carapita-gold'}`}
                                        >
                                            {e.nome} (+€{Number(e.preco).toFixed(0)})
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
                                <div className="space-y-1">
                                    <label className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">Meio de Pagamento</label>
                                    <select
                                        className="w-full border-b border-gray-100 py-3 outline-none focus:border-carapita-gold transition-colors text-sm bg-transparent"
                                        value={formData.metodoPagamento}
                                        onChange={e => setFormData({ ...formData, metodoPagamento: e.target.value })}
                                    >
                                        <option value="DINHEIRO">Dinheiro</option>
                                        <option value="MBWAY">MBWay</option>
                                        <option value="MULTIBANCO">Multibanco</option>
                                        <option value="TRANSFERENCIA">Transferência Bancária</option>
                                        <option value="STRIPE">Cartão via Stripe</option>
                                    </select>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">Canal de Origem</label>
                                    <select
                                        className="w-full border-b border-gray-100 py-3 outline-none focus:border-carapita-gold transition-colors text-sm bg-transparent"
                                        value={formData.canalNome}
                                        onChange={e => setFormData({ ...formData, canalNome: e.target.value })}
                                    >
                                        <option value="BALCÃO">Balcão / Recepção</option>
                                        <option value="TELEFONE">Telefone</option>
                                        <option value="EMAIL">E-mail</option>
                                        <option value="WHATSAPP">WhatsApp</option>
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">Notas Internas</label>
                                <textarea
                                    className="w-full border border-gray-100 p-4 text-sm outline-none focus:border-carapita-gold transition-colors bg-gray-50/30"
                                    rows={3}
                                    value={formData.requerimentosEspeciais}
                                    onChange={e => setFormData({ ...formData, requerimentosEspeciais: e.target.value })}
                                    placeholder="Instruções especiais ou observações..."
                                />
                            </div>
                        </div>
                    )}

                    {/* BOTÕES DE NAVEGAÇÃO */}
                    <div className="p-8 bg-gray-50 flex justify-between items-center">
                        <button
                            onClick={step === 1 ? () => router.back() : () => setStep(step - 1)}
                            className="flex items-center gap-2 text-gray-400 hover:text-carapita-dark transition-colors uppercase text-[10px] tracking-widest font-bold"
                        >
                            <ArrowLeft size={14} /> {step === 1 ? 'Cancelar' : 'Anterior'}
                        </button>

                        {step < 3 ? (
                            <button
                                onClick={() => setStep(step + 1)}
                                className="bg-carapita-dark text-white px-10 py-4 text-[10px] uppercase tracking-mega flex items-center gap-3 hover:bg-carapita-gold transition-all duration-500 shadow-xl"
                            >
                                Próximo Passo <ArrowRight size={14} />
                            </button>
                        ) : (
                            <button
                                onClick={handleSubmit}
                                disabled={loading}
                                className="bg-carapita-gold text-white px-12 py-4 text-[10px] uppercase tracking-mega flex items-center gap-3 hover:bg-carapita-dark transition-all duration-500 shadow-xl"
                            >
                                {loading ? 'A processar...' : 'Confirmar Reserva'} <CheckCircle size={14} />
                            </button>
                        )
                        }
                    </div>
                </div>
            </div>
        </div>
    );
}
