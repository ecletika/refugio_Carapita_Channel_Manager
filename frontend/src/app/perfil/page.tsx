"use client";
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { LogOut, Calendar, Home, User, Plus, Trash2, MapPin, Instagram, Phone, Save, Navigation, Camera, FileText, X, CreditCard } from 'lucide-react';

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
    const [activeTab, setActiveTab] = useState<'perfil' | 'reservas' | 'dependentes' | 'roteiros' | 'cancelamento' | 'pagamentos'>('perfil');
    const [passeioSelecionado, setPasseioSelecionado] = useState<any>(null);

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
        <main className="min-h-screen bg-carapita-green flex flex-col font-sans">
            {/* Nav do Dashboard */}
            <header className="bg-carapita-green text-white border-b border-white/10 p-4 md:px-12 flex justify-between items-center shadow-sm relative z-50 h-[72px]">
                {/* Placeholder para flex justify-between */}
                <div className="hidden md:block w-32"></div>

                {/* Logo Centralizado Absoluto */}
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 cursor-pointer w-max z-10" onClick={() => router.push('/')}>
                    <h2 className="text-2xl font-serif font-light uppercase tracking-widest text-white text-center w-full">
                        Refúgio <span className="text-carapita-gold text-lg tracking-mega">Carapita</span>
                    </h2>
                </div>

                {/* Info Utilizador à Direita */}
                <div className="flex items-center gap-6 ml-auto relative z-20">
                    <div className="hidden md:flex flex-col text-right">
                        <span className="text-[10px] uppercase font-bold tracking-widest leading-none block">{hospede?.nome}</span>
                        <span className="text-[9px] uppercase tracking-widest text-white/50 mt-1 block">{hospede?.email}</span>
                    </div>
                    <button onClick={() => router.push('/')} className="text-white/80 hover:text-carapita-gold transition-colors" title="Ir para a página inicial">
                        <Home size={18} />
                    </button>
                    <button onClick={handleLogout} className="text-white/80 hover:text-carapita-gold transition-colors" title="Terminar Sessão">
                        <LogOut size={18} />
                    </button>
                </div>
            </header>

            {/* Banner Topo */}
            <div className="relative w-full h-48 md:h-56 bg-carapita-dark overflow-hidden flex items-center justify-center">
                <img src="/essencia_carapita.jpg" alt="Refúgio Carapita" className="absolute w-full h-full object-cover opacity-40 mix-blend-overlay" />
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
                    <h2 className="text-2xl md:text-4xl font-serif text-white mb-2 shadow-sm text-balance">
                        Bem-vindo(a) <span className="text-carapita-gold">{hospede?.nome}</span> ao Refúgio Carapita
                    </h2>
                    <p className="text-white/80 tracking-mega uppercase text-[10px] md:text-xs">Gerencie a sua estadia, perfil e descubra roteiros exclusivos</p>
                </div>
            </div>

            <section className="flex-1 w-full max-w-7xl mx-auto -mt-10 relative z-20 px-4 md:px-6 mb-20 flex flex-col gap-8">

                {/* Abas Topo */}
                <div className="w-full bg-carapita-dark/40 backdrop-blur-md shadow-xl flex border-b border-white/5 overflow-x-auto no-scrollbar scroll-smooth">
                    <nav className="flex items-center gap-8 min-w-max px-8">
                        <button onClick={() => setActiveTab('perfil')} className={`flex items-center gap-2 py-4 whitespace-nowrap text-[10px] uppercase font-bold tracking-widest transition-colors border-b-2 ${activeTab === 'perfil' ? 'text-carapita-gold border-carapita-gold' : 'text-white/50 border-transparent hover:text-white'}`}>
                            <User size={14} /> Meu Perfil
                        </button>
                        <button onClick={() => setActiveTab('reservas')} className={`flex items-center gap-2 py-4 whitespace-nowrap text-[10px] uppercase font-bold tracking-widest transition-colors border-b-2 ${activeTab === 'reservas' ? 'text-carapita-gold border-carapita-gold' : 'text-white/50 border-transparent hover:text-white'}`}>
                            <Calendar size={14} /> Reservas & Anfitrião
                        </button>
                        <button onClick={() => setActiveTab('dependentes')} className={`flex items-center gap-2 py-4 whitespace-nowrap text-[10px] uppercase font-bold tracking-widest transition-colors border-b-2 ${activeTab === 'dependentes' ? 'text-carapita-gold border-carapita-gold' : 'text-white/50 border-transparent hover:text-white'}`}>
                            <Plus size={14} /> Acompanhantes
                        </button>
                        <button onClick={() => setActiveTab('roteiros')} className={`flex items-center gap-2 py-4 whitespace-nowrap text-[10px] uppercase font-bold tracking-widest transition-colors border-b-2 ${activeTab === 'roteiros' ? 'text-carapita-gold border-carapita-gold' : 'text-white/50 border-transparent hover:text-white'}`}>
                            <Navigation size={14} /> Roteiros Exclusivos
                        </button>
                        <button onClick={() => router.push('/politica-cancelamento')} className={`flex items-center gap-2 py-4 whitespace-nowrap text-[10px] uppercase font-bold tracking-widest transition-colors border-b-2 text-white/50 border-transparent hover:text-carapita-gold`}>
                            <FileText size={14} /> Política Cancelamento
                        </button>
                        <button onClick={() => router.push('/perfil/pagamentos')} className={`flex items-center gap-2 py-4 whitespace-nowrap text-[10px] uppercase font-bold tracking-widest transition-colors border-b-2 text-white/50 border-transparent hover:text-carapita-gold`}>
                            <CreditCard size={14} /> Pagamentos
                        </button>
                    </nav>
                </div>

                {/* Área de Conteúdo */}
                <div className="flex-1 p-4 md:p-8 text-white">

                    {/* TAB PERFIL */}
                    {activeTab === 'perfil' && (
                        <div className="animate-fade-in">
                            <div className="mb-8 border-b border-white/10 pb-4 flex justify-between items-end">
                                <div>
                                    <h2 className="text-2xl font-serif text-white">Dados Pessoais</h2>
                                    <p className="text-[10px] text-white/50 tracking-widest uppercase mt-1">Gabinete Internacional (Requerido pelo AIMA)</p>
                                </div>
                            </div>

                            <form onSubmit={saveProfile} className="flex flex-col gap-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="flex flex-col gap-2">
                                        <label className="text-[10px] uppercase font-bold tracking-widest text-white/50">Nome</label>
                                        <input type="text" value={hospede?.nome || ''} onChange={e => setHospede({ ...hospede, nome: e.target.value })} className="p-3 border border-white/20 outline-none text-sm bg-black/20 text-white focus:border-carapita-gold transition-colors" required />
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <label className="text-[10px] uppercase font-bold tracking-widest text-white/50">Apelido</label>
                                        <input type="text" value={hospede?.sobrenome || ''} onChange={e => setHospede({ ...hospede, sobrenome: e.target.value })} className="p-3 border border-white/20 outline-none text-sm bg-black/20 text-white focus:border-carapita-gold transition-colors" required />
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <label className="text-[10px] uppercase font-bold tracking-widest text-white/50">Email</label>
                                        <input type="email" value={hospede?.email || ''} readOnly className="p-3 border border-white/10 text-white/50 bg-black/40 text-sm cursor-not-allowed" />
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <label className="text-[10px] uppercase font-bold tracking-widest text-white/50">Telemóvel</label>
                                        <input type="text" value={hospede?.telefone || ''} onChange={e => setHospede({ ...hospede, telefone: e.target.value })} className="p-3 border border-white/20 outline-none text-sm bg-black/20 text-white focus:border-carapita-gold transition-colors" />
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <label className="text-[10px] uppercase font-bold tracking-widest text-white/50">Nacionalidade</label>
                                        <input type="text" placeholder="Ex: Portuguesa, Brasileira..." value={hospede?.nacionalidade || ''} onChange={e => setHospede({ ...hospede, nacionalidade: e.target.value })} className="p-3 border border-white/20 outline-none text-sm bg-black/20 text-white focus:border-carapita-gold transition-colors placeholder-white/20" />
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <label className="text-[10px] uppercase font-bold tracking-widest text-white/50">Data de Nascimento</label>
                                        <input type="date" value={hospede?.data_nascimento || ''} onChange={e => setHospede({ ...hospede, data_nascimento: e.target.value })} className="p-3 border border-white/20 outline-none text-sm bg-black/20 text-white focus:border-carapita-gold transition-colors" />
                                    </div>
                                </div>

                                <div className="p-6 bg-black/10 border border-white/10 mt-4 rounded">
                                    <h4 className="text-sm font-bold text-white tracking-widest uppercase mb-4">Documentação de Identificação</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        <div className="flex flex-col gap-2">
                                            <label className="text-[10px] uppercase font-bold tracking-widest text-white/50">Tipo Documento</label>
                                            <select value={hospede?.tipo_documento || 'Passaporte'} onChange={e => setHospede({ ...hospede, tipo_documento: e.target.value })} className="p-3 border border-white/20 outline-none text-sm bg-carapita-dark text-white focus:border-carapita-gold">
                                                <option value="Passaporte">Passaporte</option>
                                                <option value="Cartao Cidadao">Cartão de Cidadão (BI)</option>
                                                <option value="Outro">Outro</option>
                                            </select>
                                        </div>
                                        <div className="flex flex-col gap-2">
                                            <label className="text-[10px] uppercase font-bold tracking-widest text-white/50">Nr. Documento</label>
                                            <input type="text" value={hospede?.numero_documento || ''} onChange={e => setHospede({ ...hospede, numero_documento: e.target.value })} className="p-3 border border-white/20 outline-none text-sm bg-black/20 text-white placeholder-white/20 focus:border-carapita-gold transition-colors" placeholder="Nº do Id..." />
                                        </div>
                                        <div className="flex flex-col gap-2">
                                            <label className="text-[10px] uppercase font-bold tracking-widest text-white/50">País Emissor</label>
                                            <input type="text" value={hospede?.pais_emissor_documento || ''} onChange={e => setHospede({ ...hospede, pais_emissor_documento: e.target.value })} className="p-3 border border-white/20 outline-none text-sm bg-black/20 text-white placeholder-white/20 focus:border-carapita-gold transition-colors" placeholder="Ex: Portugal" />
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-6 flex justify-end">
                                    <button disabled={saving} className="bg-carapita-dark text-carapita-gold border border-carapita-gold/50 hover:bg-carapita-gold hover:text-carapita-dark transition-colors px-10 py-4 uppercase text-[10px] font-bold tracking-mega flex items-center gap-2">
                                        <Save size={16} /> {saving ? 'A Salvar...' : 'Salvar Meu Perfil'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    {/* TAB RESERVAS & ANFITRIÃO */}
                    {activeTab === 'reservas' && (
                        <div className="flex flex-col gap-10 animate-fade-in">
                            <div className="flex flex-col items-center justify-center mb-8">
                                <h2 className="text-2xl font-serif text-white mb-6 border-b border-white/10 pb-4 text-center w-full max-w-4xl">Detalhes da Hospedagem</h2>
                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 w-full">
                                    <div className="bg-carapita-dark p-5 flex flex-col items-center justify-center text-center gap-2 shadow-sm border border-white/5">
                                        <MapPin className="text-carapita-gold" size={20} />
                                        <span className="text-[10px] uppercase text-gray-400 tracking-widest font-bold">Local</span>
                                        <p className="text-xs text-white line-clamp-2">{configs?.endereco || 'Rua D. Afonso IV, 450, 2490-378 Ourém'}</p>
                                    </div>
                                    <div className="bg-carapita-dark p-5 flex flex-col items-center justify-center text-center gap-2 shadow-sm border border-white/5">
                                        <User className="text-carapita-gold" size={20} />
                                        <span className="text-[10px] uppercase text-gray-400 tracking-widest font-bold">Anfitrião</span>
                                        <p className="text-xs text-white line-clamp-2">Leonardo Guede Azevedo</p>
                                    </div>
                                    <div className="bg-carapita-dark p-5 flex flex-col items-center justify-center text-center gap-2 shadow-sm border border-white/5">
                                        <Phone className="text-carapita-gold" size={20} />
                                        <span className="text-[10px] uppercase text-gray-400 tracking-widest font-bold">Apoio Hóspede</span>
                                        <p className="text-xs text-white line-clamp-2">{configs?.telefone || '+351 920 003 608'}</p>
                                    </div>
                                    <div className="bg-carapita-dark p-5 flex flex-col items-center justify-center text-center gap-2 shadow-sm border border-white/5">
                                        <Instagram className="text-carapita-gold" size={20} />
                                        <span className="text-[10px] uppercase text-gray-400 tracking-widest font-bold">Social</span>
                                        <a href={configs?.instagram || '#'} target="_blank" className="text-xs text-white hover:text-carapita-gold underline underline-offset-4 line-clamp-2">@refugiocarapita</a>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <h2 className="text-2xl font-serif text-white mb-4 border-b border-white/10 pb-4">Seu Histórico de Reservas</h2>
                                {reservas.length === 0 ? (
                                    <div className="bg-black/10 border border-dashed border-white/20 p-12 text-center text-sm text-white/50 font-light uppercase tracking-widest">
                                        Nenhuma reserva registada até ao momento.
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {reservas.map((res: any) => (
                                            <div key={res.id} className="bg-black/20 p-6 border border-white/10 flex flex-col gap-4 hover:border-carapita-gold/50 transition-colors">
                                                <div className="flex justify-between">
                                                    <div>
                                                        <h3 className="font-serif text-lg text-white">{res.quarto?.nome}</h3>
                                                        <span className={`text-[9px] uppercase tracking-widest font-bold ${res.status === 'CONFIRMADA' ? 'text-green-400' : 'text-carapita-gold'}`}>{res.status}</span>
                                                    </div>
                                                    <span className="text-lg font-bold text-white pr-2">€{Number(res.valor_total).toFixed(2)}</span>
                                                </div>
                                                <div className="grid grid-cols-2 gap-2 text-sm bg-black/40 p-4 border border-white/5">
                                                    <div><span className="block text-[9px] text-white/40 uppercase tracking-widest">Check-In</span><strong className="text-white font-medium">{new Date(res.data_check_in).toLocaleDateString()}</strong></div>
                                                    <div><span className="block text-[9px] text-white/40 uppercase tracking-widest">Check-Out</span><strong className="text-white font-medium">{new Date(res.data_check_out).toLocaleDateString()}</strong></div>
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
                        <div className="animate-fade-in">
                            <div className="mb-6 border-b border-white/10 pb-4 flex justify-between items-center flex-wrap gap-4">
                                <div>
                                    <h2 className="text-2xl font-serif text-white">Acompanhantes do Grupo</h2>
                                    <p className="text-[10px] text-white/50 tracking-widest uppercase mt-1">Registe familiares/passageiros adicionais para o AIMA</p>
                                </div>
                                <button onClick={addDependente} className="bg-carapita-dark text-carapita-gold hover:bg-carapita-gold hover:text-carapita-dark border border-carapita-gold/50 transition-colors px-6 py-2 uppercase text-[10px] font-bold tracking-mega flex items-center gap-2">
                                    <Plus size={14} /> Adicionar Pessoa
                                </button>
                            </div>

                            {dependentes.length === 0 ? (
                                <div className="text-center p-12 bg-black/10 border border-dashed border-white/20 text-white/50 uppercase tracking-widest text-[10px]">
                                    Sem acompanhantes registados no momento.
                                </div>
                            ) : (
                                <div className="flex flex-col gap-6">
                                    {dependentes.map((dep, i) => (
                                        <div key={i} className="bg-black/20 border border-carapita-gold/30 p-6 relative">
                                            <button onClick={() => removeDependente(i)} className="absolute top-4 right-4 text-white/40 hover:text-red-500 transition-colors p-2" title="Remover">
                                                <Trash2 size={16} />
                                            </button>
                                            <h4 className="font-serif text-white mb-4 text-lg">Hóspede {i + 2}</h4>
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                <div className="flex flex-col gap-1">
                                                    <label className="text-[9px] uppercase font-bold tracking-widest text-white/50">Nome Completo</label>
                                                    <input type="text" value={dep.nome} onChange={e => updateDependente(i, 'nome', e.target.value)} className="p-2 border border-white/20 outline-none text-sm bg-black/20 text-white focus:border-carapita-gold" />
                                                </div>
                                                <div className="flex flex-col gap-1">
                                                    <label className="text-[9px] uppercase font-bold tracking-widest text-white/50">Nacionalidade</label>
                                                    <input type="text" value={dep.nacionalidade} onChange={e => updateDependente(i, 'nacionalidade', e.target.value)} className="p-2 border border-white/20 outline-none text-sm bg-black/20 text-white focus:border-carapita-gold" />
                                                </div>
                                                <div className="flex flex-col gap-1">
                                                    <label className="text-[9px] uppercase font-bold tracking-widest text-white/50">Nascimento</label>
                                                    <input type="date" value={dep.data_nascimento} onChange={e => updateDependente(i, 'data_nascimento', e.target.value)} className="p-2 border border-white/20 outline-none text-sm bg-black/20 text-white justify-between focus:border-carapita-gold [color-scheme:dark]" />
                                                </div>
                                                <div className="flex flex-col gap-1">
                                                    <label className="text-[9px] uppercase font-bold tracking-widest text-white/50">Documento</label>
                                                    <select value={dep.tipo_documento} onChange={e => updateDependente(i, 'tipo_documento', e.target.value)} className="p-2 border border-white/20 outline-none text-sm bg-carapita-dark text-white focus:border-carapita-gold">
                                                        <option value="Passaporte">Passaporte</option>
                                                        <option value="Cartao Cidadao">Cartão de Cidadão</option>
                                                        <option value="Outro">Outro</option>
                                                    </select>
                                                </div>
                                                <div className="flex flex-col gap-1 md:col-span-2">
                                                    <label className="text-[9px] uppercase font-bold tracking-widest text-white/50">Número do Id</label>
                                                    <input type="text" value={dep.numero_documento} onChange={e => updateDependente(i, 'numero_documento', e.target.value)} className="p-2 border border-white/20 outline-none text-sm bg-black/20 text-white focus:border-carapita-gold" placeholder="Nº Documento" />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    <div className="flex justify-end mt-2">
                                        <button onClick={saveProfile} className="bg-carapita-dark border border-carapita-gold/50 text-carapita-gold hover:bg-carapita-gold hover:text-carapita-dark transition-colors px-10 py-4 uppercase text-[10px] font-bold tracking-mega flex items-center gap-2">
                                            <Save size={16} /> Salvar Dependentes
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* TAB ROTEIROS */}
                    {activeTab === 'roteiros' && (
                        <div className="animate-fade-in w-full overflow-hidden">
                            <div className="mb-8 border-b border-white/10 pb-4">
                                <h2 className="text-2xl font-serif text-white">Roteiros Recomendados</h2>
                                <p className="text-[10px] text-white/50 tracking-widest uppercase mt-1">Explorar os melhores caminhos na região</p>
                            </div>

                            {roteiros.length === 0 ? (
                                <div className="text-center p-12 bg-black/10 border border-dashed border-white/20 text-white/50 font-light text-[10px] uppercase tracking-widest">
                                    Nenhum roteiro especial ativo no momento.
                                </div>
                            ) : (
                                <div className="flex gap-6 overflow-x-auto pb-8 pt-4 no-scrollbar snap-x">
                                    {roteiros.map(r => (
                                        <div key={r.id} className="min-w-[280px] w-[280px] sm:min-w-[320px] sm:w-[320px] snap-center group flex flex-col items-center text-center cursor-pointer" onClick={() => setPasseioSelecionado(r)}>
                                            <div className="w-full h-64 md:h-72 overflow-hidden mb-6 relative border border-white/10">
                                                <img src={r.img} alt={r.nome} className="w-full h-full object-cover transform duration-700 group-hover:scale-105 filter group-hover:brightness-110" />
                                                <div className="absolute top-4 left-4 bg-carapita-green/90 backdrop-blur-sm px-3 py-1 flex items-center gap-1 shadow-sm border border-white/5">
                                                    <Calendar size={10} className="text-carapita-gold" />
                                                    <span className="text-[9px] uppercase tracking-widest font-semibold text-white">{r.dias} {r.dias > 1 ? 'Dias' : 'Dia'}</span>
                                                </div>
                                                <div className="absolute top-4 right-4 bg-carapita-green/90 backdrop-blur-sm px-3 py-1 flex items-center gap-1 shadow-sm border border-white/5">
                                                    <MapPin size={10} className="text-carapita-gold" />
                                                    <span className="text-[9px] uppercase tracking-widest font-semibold text-white">{r.dist}</span>
                                                </div>
                                            </div>
                                            <h5 className="text-sm font-serif text-white font-medium mb-2 group-hover:text-carapita-gold transition-colors">{r.nome}</h5>
                                            <p className="text-[11px] text-white/50 font-light leading-relaxed max-w-[220px]">{r.desc}</p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}


                </div>
            </section>

            {/* Modal de Detalhes do Passeio */}
            {passeioSelecionado && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm shadow-2xl transition-opacity animate-fade-in" onClick={() => setPasseioSelecionado(null)}></div>
                    <div className="relative bg-carapita-green w-full max-w-4xl max-h-[90vh] overflow-y-auto z-[101] shadow-2xl flex flex-col md:flex-row animate-fade-in border border-white/5">
                        {/* Botão Fechar */}
                        <button
                            className="absolute top-4 right-4 z-[102] w-10 h-10 bg-black/50 hover:bg-carapita-gold text-white flex items-center justify-center transition-colors border border-white/10"
                            onClick={() => setPasseioSelecionado(null)}
                        >
                            <X size={20} />
                        </button>

                        {/* Imagem Lado Esquerdo Modal */}
                        <div className="w-full md:w-1/2 h-64 md:h-auto min-h-[300px] relative">
                            <img src={passeioSelecionado.img} className="absolute inset-0 w-full h-full object-cover" alt={passeioSelecionado.nome} />
                            <div className="absolute bottom-4 left-4 bg-carapita-green/90 backdrop-blur-sm px-4 py-2 flex items-center gap-2 shadow-lg border border-white/5">
                                <MapPin size={12} className="text-carapita-gold" />
                                <span className="text-[10px] uppercase tracking-widest font-semibold text-white">{passeioSelecionado.dist} da casa</span>
                            </div>
                        </div>

                        {/* Conteúdo Lado Direito Modal */}
                        <div className="w-full md:w-1/2 p-10 md:p-14 flex flex-col justify-center bg-carapita-green text-left">
                            <span className="text-carapita-gold uppercase tracking-widest text-[10px] font-medium block mb-4 border-b border-carapita-gold/30 pb-4 inline-block w-max">Descobrir Roteiro</span>
                            <h3 className="text-3xl md:text-4xl font-serif text-white leading-tight font-light mb-6">
                                {passeioSelecionado.nome}
                            </h3>
                            <p className="text-white/60 font-light leading-[2.0] text-sm mb-12 text-justify">
                                {passeioSelecionado.historia}
                            </p>

                            <a
                                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(passeioSelecionado.nome + " Portugal")}`}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-block text-center w-full bg-carapita-dark hover:bg-carapita-gold text-white text-[10px] uppercase tracking-mega py-4 transition-colors duration-500"
                            >
                                Ver no Mapa
                            </a>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
}
