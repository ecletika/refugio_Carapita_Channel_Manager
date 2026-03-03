"use client";
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { LogOut, Calendar, Home, User, Plus, Trash2, MapPin, Instagram, Phone, Save, Navigation, Camera } from 'lucide-react';

interface Dependente {
    nome: string;
    nacionalidade: string;
    tipo_documento: string;
    numero_documento: string;
    data_nascimento: string;
}

export default function PerfilHospede() {
    const [reservas, setReservas] = useState<any[]>([]);
    const [hospede, setHospede] = useState<any>(null);
    const [dependentes, setDependentes] = useState<Dependente[]>([]);
    const [roteiros, setRoteiros] = useState<any[]>([]);
    const [configs, setConfigs] = useState<any>({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [uploadingLogo, setUploadingLogo] = useState(false);

    // Tab tracking
    const [activeTab, setActiveTab] = useState<'perfil' | 'reservas' | 'dependentes' | 'roteiros'>('perfil');

    const router = useRouter();

    useEffect(() => {
        const token = localStorage.getItem('token') || localStorage.getItem('guestToken');
        if (!token) {
            router.push('/login');
            return;
        }

        const fetchData = async () => {
            try {
                // Fetch Hospede Data
                const resMe = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/hospede/me`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (resMe.ok) {
                    const dadosMe = await resMe.json();
                    if (dadosMe.status === 'success') {
                        setHospede(dadosMe.data);
                        setDependentes(dadosMe.data.dependentes || []);
                    }
                }

                // Fetch Reservas
                const resReservas = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/reservas/minhas-reservas`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (resReservas.ok) {
                    const dadosReservas = await resReservas.json();
                    if (dadosReservas.status === 'success') {
                        setReservas(dadosReservas.data);
                    }
                }

                // Fetch Roteiros (Passeios)
                const resRoteiros = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/site/passeios`);
                if (resRoteiros.ok) {
                    const dadosRoteiros = await resRoteiros.json();
                    if (dadosRoteiros.status === 'success') {
                        setRoteiros(dadosRoteiros.data.filter((p: any) => p.mostrar_perfil && p.ativo));
                    }
                }

                // Fetch Configs
                const resConfigs = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/site/configs`);
                if (resConfigs.ok) {
                    const dadosConfigs = await resConfigs.json();
                    if (dadosConfigs.status === 'success') {
                        setConfigs(dadosConfigs.data);
                    }
                }

            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [router]);

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('guestToken');
        localStorage.removeItem('usuario');
        localStorage.removeItem('hospede');
        router.push('/');
    };

    const addDependente = () => {
        setDependentes([...dependentes, { nome: '', nacionalidade: '', tipo_documento: 'Passaporte', numero_documento: '', data_nascimento: '' }]);
    };

    const removeDependente = (index: number) => {
        const newD = [...dependentes];
        newD.splice(index, 1);
        setDependentes(newD);
    };

    const updateDependente = (index: number, field: string, value: string) => {
        const newD = [...dependentes];
        (newD[index] as any)[field] = value;
        setDependentes(newD);
    };

    const saveProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        const token = localStorage.getItem('token') || localStorage.getItem('guestToken');
        try {
            const payload = { ...hospede, dependentes };
            const resp = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/hospede/me`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(payload)
            });
            const dados = await resp.json();
            if (dados.status === 'success') {
                alert('Perfil atualizado com sucesso!');
                setHospede(dados.data);
            } else {
                alert('Erro ao atualizar: ' + dados.error);
            }
        } catch (e) {
            alert('Erro de conexão ao salvar.');
        } finally {
            setSaving(false);
        }
    };

    const handleUploadPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploadingLogo(true);
        const token = localStorage.getItem('token') || localStorage.getItem('guestToken');
        const formData = new FormData();
        formData.append('foto', file);

        try {
            const resp = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/upload`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData
            });
            const data = await resp.json();
            if (data.status === 'success') {
                const updatedHospede = { ...hospede, foto_perfil: data.url };
                setHospede(updatedHospede);

                // Salvar de imediato
                await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/hospede/me`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                    body: JSON.stringify(updatedHospede)
                });
            } else {
                alert('Erro ao carregar foto.');
            }
        } catch (error) {
            alert('Erro de conexão ao carregar imagem.');
        } finally {
            setUploadingLogo(false);
        }
    };

    if (loading) return <div className="min-h-screen bg-white flex items-center justify-center font-sans tracking-mega uppercase text-xs">Carregando O Seu Portal...</div>;

    return (
        <main className="min-h-screen bg-[#F9F8F6] flex flex-col font-sans">
            {/* Nav do Dashboard */}
            <header className="bg-white text-carapita-dark border-b border-gray-100 p-4 md:px-12 flex justify-between items-center shadow-sm relative z-10">
                <div className="cursor-pointer" onClick={() => router.push('/')}>
                    <img src="/logo.jpg" alt="Refúgio Carapita" className="h-10 object-contain" />
                </div>
                <div className="flex items-center gap-6">
                    <div className="hidden md:flex flex-col text-right">
                        <span className="text-[10px] uppercase font-bold tracking-widest leading-none block">{hospede?.nome}</span>
                        <span className="text-[9px] uppercase tracking-widest text-gray-400 mt-1 block">{hospede?.email}</span>
                    </div>
                    <button onClick={() => router.push('/')} className="text-carapita-dark hover:text-carapita-gold transition-colors" title="Ir para a página inicial">
                        <Home size={18} />
                    </button>
                    <button onClick={handleLogout} className="text-carapita-dark hover:text-carapita-gold transition-colors" title="Terminar Sessão">
                        <LogOut size={18} />
                    </button>
                </div>
            </header>

            {/* Banner Topo */}
            <div className="relative w-full h-64 md:h-80 bg-carapita-dark overflow-hidden flex items-center justify-center">
                <img src="/casa-exterior.jpg" alt="Refúgio Carapita" className="absolute w-full h-full object-cover opacity-40 mix-blend-overlay" />
                <div className="relative text-center z-10 px-4 flex flex-col items-center">
                    <div className="relative mb-4 group cursor-pointer w-24 h-24 rounded-full border-2 border-carapita-gold overflow-hidden bg-white/10 flex items-center justify-center backdrop-blur-md">
                        {hospede?.foto_perfil ? (
                            <img src={hospede.foto_perfil} alt="Perfil" className="w-full h-full object-cover" />
                        ) : (
                            <span className="text-carapita-gold font-serif text-3xl">{hospede?.nome?.charAt(0) || 'U'}</span>
                        )}
                        <label className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center cursor-pointer text-white">
                            {uploadingLogo ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Camera size={20} />}
                            <input type="file" className="hidden" accept="image/*" onChange={handleUploadPhoto} />
                        </label>
                    </div>
                    <h2 className="text-3xl md:text-5xl font-serif text-white mb-2 shadow-sm text-balance">
                        Bem-vindo(a) <span className="text-carapita-gold">{hospede?.nome}</span> ao Refúgio Carapita
                    </h2>
                    <p className="text-white/80 tracking-mega uppercase text-[10px] md:text-xs">Gerencie a sua estadia, perfil e descubra roteiros exclusivos</p>
                </div>
            </div>

            <section className="flex-1 w-full max-w-7xl mx-auto -mt-10 relative z-20 px-4 md:px-6 mb-20 flex flex-col gap-8">

                {/* Abas Topo */}
                <div className="w-full bg-white shadow-xl flex px-4 border-b border-gray-100 overflow-x-auto no-scrollbar">
                    <nav className="flex items-center gap-8 min-w-max mx-auto md:mx-0">
                        <button onClick={() => setActiveTab('perfil')} className={`flex items-center gap-2 py-6 whitespace-nowrap text-[10px] uppercase font-bold tracking-widest transition-colors border-b-2 ${activeTab === 'perfil' ? 'text-carapita-gold border-carapita-gold' : 'text-gray-400 border-transparent hover:text-carapita-dark'}`}>
                            <User size={14} /> Meu Perfil
                        </button>
                        <button onClick={() => setActiveTab('reservas')} className={`flex items-center gap-2 py-6 whitespace-nowrap text-[10px] uppercase font-bold tracking-widest transition-colors border-b-2 ${activeTab === 'reservas' ? 'text-carapita-gold border-carapita-gold' : 'text-gray-400 border-transparent hover:text-carapita-dark'}`}>
                            <Calendar size={14} /> Reservas & Anfitrião
                        </button>
                        <button onClick={() => setActiveTab('dependentes')} className={`flex items-center gap-2 py-6 whitespace-nowrap text-[10px] uppercase font-bold tracking-widest transition-colors border-b-2 ${activeTab === 'dependentes' ? 'text-carapita-gold border-carapita-gold' : 'text-gray-400 border-transparent hover:text-carapita-dark'}`}>
                            <Plus size={14} /> Acompanhantes
                        </button>
                        <button onClick={() => setActiveTab('roteiros')} className={`flex items-center gap-2 py-6 whitespace-nowrap text-[10px] uppercase font-bold tracking-widest transition-colors border-b-2 ${activeTab === 'roteiros' ? 'text-carapita-gold border-carapita-gold' : 'text-gray-400 border-transparent hover:text-carapita-dark'}`}>
                            <Navigation size={14} /> Roteiros Exclusivos
                        </button>
                    </nav>
                </div>

                {/* Área de Conteúdo */}
                <div className="flex-1 bg-white shadow-xl p-6 md:p-10">

                    {/* TAB PERFIL */}
                    {activeTab === 'perfil' && (
                        <div>
                            <div className="mb-8 border-b border-gray-100 pb-4 flex justify-between items-end">
                                <div>
                                    <h2 className="text-2xl font-serif text-carapita-dark">Dados Pessoais</h2>
                                    <p className="text-[10px] text-carapita-muted tracking-widest uppercase mt-1">Gabinete Internacional (Requerido pelo AIMA)</p>
                                </div>
                            </div>

                            <form onSubmit={saveProfile} className="flex flex-col gap-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="flex flex-col gap-2">
                                        <label className="text-[10px] uppercase font-bold tracking-widest text-carapita-muted">Nome</label>
                                        <input type="text" value={hospede?.nome || ''} onChange={e => setHospede({ ...hospede, nome: e.target.value })} className="p-3 border border-gray-200 outline-none text-sm bg-gray-50/50" required />
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <label className="text-[10px] uppercase font-bold tracking-widest text-carapita-muted">Sobrenome</label>
                                        <input type="text" value={hospede?.sobrenome || ''} onChange={e => setHospede({ ...hospede, sobrenome: e.target.value })} className="p-3 border border-gray-200 outline-none text-sm bg-gray-50/50" required />
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <label className="text-[10px] uppercase font-bold tracking-widest text-carapita-muted">Email</label>
                                        <input type="email" value={hospede?.email || ''} readOnly className="p-3 border border-gray-200 text-gray-400 bg-gray-100 text-sm cursor-not-allowed" />
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <label className="text-[10px] uppercase font-bold tracking-widest text-carapita-muted">Telemóvel</label>
                                        <input type="text" value={hospede?.telefone || ''} onChange={e => setHospede({ ...hospede, telefone: e.target.value })} className="p-3 border border-gray-200 outline-none text-sm bg-gray-50/50" />
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <label className="text-[10px] uppercase font-bold tracking-widest text-carapita-muted">Nacionalidade</label>
                                        <input type="text" placeholder="Ex: Portuguesa, Brasileira..." value={hospede?.nacionalidade || ''} onChange={e => setHospede({ ...hospede, nacionalidade: e.target.value })} className="p-3 border border-gray-200 outline-none text-sm bg-gray-50/50" />
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <label className="text-[10px] uppercase font-bold tracking-widest text-carapita-muted">Data de Nascimento</label>
                                        <input type="date" value={hospede?.data_nascimento || ''} onChange={e => setHospede({ ...hospede, data_nascimento: e.target.value })} className="p-3 border border-gray-200 outline-none text-sm bg-gray-50/50" />
                                    </div>
                                </div>

                                <div className="p-6 bg-gray-50 border border-gray-200 mt-4 rounded">
                                    <h4 className="text-sm font-bold text-carapita-dark tracking-widest uppercase mb-4">Documentação de Identificação</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        <div className="flex flex-col gap-2">
                                            <label className="text-[10px] uppercase font-bold tracking-widest text-carapita-muted">Tipo Documento</label>
                                            <select value={hospede?.tipo_documento || 'Passaporte'} onChange={e => setHospede({ ...hospede, tipo_documento: e.target.value })} className="p-3 border border-gray-200 outline-none text-sm bg-white">
                                                <option value="Passaporte">Passaporte</option>
                                                <option value="Cartao Cidadao">Cartão de Cidadão (BI)</option>
                                                <option value="Outro">Outro</option>
                                            </select>
                                        </div>
                                        <div className="flex flex-col gap-2">
                                            <label className="text-[10px] uppercase font-bold tracking-widest text-carapita-muted">Nr. Documento</label>
                                            <input type="text" value={hospede?.numero_documento || ''} onChange={e => setHospede({ ...hospede, numero_documento: e.target.value })} className="p-3 border border-gray-200 outline-none text-sm bg-white" placeholder="Nº do Id..." />
                                        </div>
                                        <div className="flex flex-col gap-2">
                                            <label className="text-[10px] uppercase font-bold tracking-widest text-carapita-muted">País Emissor</label>
                                            <input type="text" value={hospede?.pais_emissor_documento || ''} onChange={e => setHospede({ ...hospede, pais_emissor_documento: e.target.value })} className="p-3 border border-gray-200 outline-none text-sm bg-white" placeholder="Ex: Brasil" />
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-6 flex justify-end">
                                    <button disabled={saving} className="bg-carapita-dark text-carapita-gold hover:bg-black transition-colors px-10 py-4 uppercase text-[10px] font-bold tracking-mega flex items-center gap-2">
                                        <Save size={16} /> {saving ? 'A Salvar...' : 'Salvar Meu Perfil'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    {/* TAB RESERVAS & ANFITRIÃO */}
                    {activeTab === 'reservas' && (
                        <div className="flex flex-col gap-10">
                            <div>
                                <h2 className="text-2xl font-serif text-carapita-dark mb-4 border-b border-gray-100 pb-4">Detalhes da Hospedagem</h2>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="bg-carapita-dark p-6 flex flex-col items-center justify-center text-center gap-3">
                                        <MapPin className="text-carapita-gold" size={24} />
                                        <span className="text-[10px] uppercase text-gray-400 tracking-widest font-bold">Local</span>
                                        <p className="text-sm text-white">{configs?.endereco || 'Rua Principal, Carapita - Portugal'}</p>
                                    </div>
                                    <div className="bg-carapita-dark p-6 flex flex-col items-center justify-center text-center gap-3">
                                        <User className="text-carapita-gold" size={24} />
                                        <span className="text-[10px] uppercase text-gray-400 tracking-widest font-bold">Anfitrião</span>
                                        <p className="text-sm text-white">Leonardo Azevedo</p>
                                    </div>
                                    <div className="bg-carapita-dark p-6 flex flex-col items-center justify-center text-center gap-3">
                                        <Phone className="text-carapita-gold" size={24} />
                                        <span className="text-[10px] uppercase text-gray-400 tracking-widest font-bold">Apoio Hóspede</span>
                                        <p className="text-sm text-white">{configs?.telefone || '+351 969 581 657'}</p>
                                    </div>
                                    <div className="bg-carapita-dark p-6 flex flex-col items-center justify-center text-center gap-3">
                                        <Instagram className="text-carapita-gold" size={24} />
                                        <span className="text-[10px] uppercase text-gray-400 tracking-widest font-bold">Social</span>
                                        <a href={configs?.instagram || '#'} target="_blank" className="text-sm text-white hover:text-carapita-gold underline underline-offset-4">@refugiocarapita</a>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <h2 className="text-2xl font-serif text-carapita-dark mb-4 border-b border-gray-100 pb-4">Seu Histórico de Reservas</h2>
                                {reservas.length === 0 ? (
                                    <div className="bg-gray-50 border border-dashed border-gray-300 p-12 text-center text-sm text-gray-500 font-light uppercase tracking-widest">
                                        Nenhuma reserva registada até ao momento.
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {reservas.map((res: any) => (
                                            <div key={res.id} className="bg-white p-6 border border-gray-200 flex flex-col gap-4">
                                                <div className="flex justify-between">
                                                    <div>
                                                        <h3 className="font-serif text-lg text-carapita-dark">{res.quarto?.nome}</h3>
                                                        <span className={`text-[9px] uppercase tracking-widest font-bold ${res.status === 'CONFIRMADA' ? 'text-green-600' : 'text-carapita-gold'}`}>{res.status}</span>
                                                    </div>
                                                    <span className="text-lg font-bold text-carapita-dark pr-2">€{Number(res.valor_total).toFixed(2)}</span>
                                                </div>
                                                <div className="grid grid-cols-2 gap-2 text-sm bg-gray-50 p-4">
                                                    <div><span className="block text-[9px] text-gray-400 uppercase tracking-widest">Check-In</span><strong className="text-carapita-dark font-medium">{new Date(res.data_check_in).toLocaleDateString()}</strong></div>
                                                    <div><span className="block text-[9px] text-gray-400 uppercase tracking-widest">Check-Out</span><strong className="text-carapita-dark font-medium">{new Date(res.data_check_out).toLocaleDateString()}</strong></div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* TAB DEPENDENTES */}
                    {activeTab === 'dependentes' && (
                        <div>
                            <div className="mb-6 border-b border-gray-100 pb-4 flex justify-between items-center flex-wrap gap-4">
                                <div>
                                    <h2 className="text-2xl font-serif text-carapita-dark">Acompanhantes do Grupo</h2>
                                    <p className="text-[10px] text-carapita-muted tracking-widest uppercase mt-1">Registe familiares/passageiros adicionais para o SEF/AIMA</p>
                                </div>
                                <button onClick={addDependente} className="bg-carapita-dark text-carapita-gold hover:bg-black transition-colors px-6 py-2 uppercase text-[10px] font-bold tracking-mega flex items-center gap-2">
                                    <Plus size={14} /> Adicionar Pessoa
                                </button>
                            </div>

                            {dependentes.length === 0 ? (
                                <div className="text-center p-12 bg-gray-50 border border-dashed border-gray-300 text-gray-500 uppercase tracking-widest text-[10px]">
                                    Sem acompanhantes registados no momento.
                                </div>
                            ) : (
                                <div className="flex flex-col gap-6">
                                    {dependentes.map((dep, i) => (
                                        <div key={i} className="bg-white border border-carapita-gold/30 p-6 relative">
                                            <button onClick={() => removeDependente(i)} className="absolute top-4 right-4 text-gray-400 hover:text-red-500 transition-colors p-2" title="Remover">
                                                <Trash2 size={16} />
                                            </button>
                                            <h4 className="font-serif text-carapita-dark mb-4 text-lg">Hóspede {i + 2}</h4>
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                <div className="flex flex-col gap-1">
                                                    <label className="text-[9px] uppercase font-bold tracking-widest text-gray-500">Nome Completo</label>
                                                    <input type="text" value={dep.nome} onChange={e => updateDependente(i, 'nome', e.target.value)} className="p-2 border border-gray-200 outline-none text-sm focus:border-carapita-gold" />
                                                </div>
                                                <div className="flex flex-col gap-1">
                                                    <label className="text-[9px] uppercase font-bold tracking-widest text-gray-500">Nacionalidade</label>
                                                    <input type="text" value={dep.nacionalidade} onChange={e => updateDependente(i, 'nacionalidade', e.target.value)} className="p-2 border border-gray-200 outline-none text-sm focus:border-carapita-gold" />
                                                </div>
                                                <div className="flex flex-col gap-1">
                                                    <label className="text-[9px] uppercase font-bold tracking-widest text-gray-500">Nascimento</label>
                                                    <input type="date" value={dep.data_nascimento} onChange={e => updateDependente(i, 'data_nascimento', e.target.value)} className="p-2 border border-gray-200 outline-none text-sm focus:border-carapita-gold" />
                                                </div>
                                                <div className="flex flex-col gap-1">
                                                    <label className="text-[9px] uppercase font-bold tracking-widest text-gray-500">Documento</label>
                                                    <select value={dep.tipo_documento} onChange={e => updateDependente(i, 'tipo_documento', e.target.value)} className="p-2 border border-gray-200 outline-none text-sm focus:border-carapita-gold bg-white">
                                                        <option value="Passaporte">Passaporte</option>
                                                        <option value="Cartao Cidadao">Cartão de Cidadão</option>
                                                        <option value="Outro">Outro</option>
                                                    </select>
                                                </div>
                                                <div className="flex flex-col gap-1 md:col-span-2">
                                                    <label className="text-[9px] uppercase font-bold tracking-widest text-gray-500">Número do Id</label>
                                                    <input type="text" value={dep.numero_documento} onChange={e => updateDependente(i, 'numero_documento', e.target.value)} className="p-2 border border-gray-200 outline-none text-sm focus:border-carapita-gold" placeholder="Nº Documento" />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    <div className="flex justify-end mt-2">
                                        <button onClick={saveProfile} className="bg-carapita-gold text-white hover:bg-carapita-dark transition-colors px-10 py-4 uppercase text-[10px] font-bold tracking-mega flex items-center gap-2">
                                            <Save size={16} /> Salvar Dependentes
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* TAB ROTEIROS */}
                    {activeTab === 'roteiros' && (
                        <div>
                            <div className="mb-8 border-b border-gray-100 pb-4">
                                <h2 className="text-2xl font-serif text-carapita-dark">Roteiros Recomendados</h2>
                                <p className="text-[10px] text-carapita-muted tracking-widest uppercase mt-1">Explorar os melhores caminhos na região</p>
                            </div>

                            {roteiros.length === 0 ? (
                                <div className="text-center p-12 text-gray-400 font-light text-[10px] uppercase tracking-widest">
                                    Nenhum roteiro especial ativo no momento.
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    {roteiros.map(r => (
                                        <div key={r.id} className="border border-gray-100 group hover:shadow-xl transition-all overflow-hidden flex flex-col bg-white">
                                            <div className="h-48 relative overflow-hidden bg-gray-50">
                                                <img src={r.img} alt={r.nome} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                                                <div className="absolute top-4 left-4 bg-carapita-dark text-carapita-gold px-3 py-1 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest shadow-lg">
                                                    <Calendar size={12} /> {r.dias} {r.dias > 1 ? 'Dias' : 'Dia'}
                                                </div>
                                            </div>
                                            <div className="p-6 flex-1 flex flex-col">
                                                <h3 className="font-serif text-xl text-carapita-dark mb-2">{r.nome}</h3>
                                                <p className="text-xs text-grat-500 font-light leading-relaxed mb-4">{r.desc}</p>

                                                <div className="mt-auto flex items-center justify-between border-t border-gray-50 pt-4">
                                                    <span className="text-[10px] text-carapita-muted uppercase tracking-widest flex items-center gap-1 font-bold">
                                                        <MapPin size={12} className="text-carapita-gold" /> {r.dist}
                                                    </span>
                                                    <button className="text-[9px] uppercase text-carapita-gold font-bold tracking-mega hover:underline underline-offset-4" onClick={() => alert(r.historia)}>
                                                        Ver Roteiro Extra
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                </div>
            </section>
        </main>
    );
}
