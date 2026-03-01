"use client";
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginHospede() {
    const [email, setEmail] = useState('');
    const [senha, setSenha] = useState('');
    const [loading, setLoading] = useState(false);
    const [erro, setErro] = useState('');
    const router = useRouter();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setErro('');
        setLoading(true);

        try {
            // ── 1. Tenta login como Admin/Staff primeiro ──
            const respAdmin = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, senha })
            });
            const dadosAdmin = await respAdmin.json();

            if (dadosAdmin.status === 'success') {
                // É um utilizador do sistema (ADMIN ou RECEPCAO)
                localStorage.setItem('token', dadosAdmin.token);
                localStorage.setItem('usuario', JSON.stringify(dadosAdmin.usuario));
                localStorage.setItem('role', dadosAdmin.usuario.role);
                // Redireciona sempre para o painel de controlo
                router.push('/admin');
                return;
            }

            // ── 2. Se falhou como admin, tenta como hóspede ──
            const respHospede = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/hospede/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, senha })
            });
            const dadosHospede = await respHospede.json();

            if (dadosHospede.status === 'success') {
                localStorage.setItem('token', dadosHospede.token);
                localStorage.setItem('usuario', JSON.stringify(dadosHospede.hospede));
                localStorage.setItem('role', 'HOSPEDE');
                router.push('/perfil');
            } else {
                setErro('E-mail ou senha incorretos. Por favor tente novamente.');
            }

        } catch {
            setErro('Falha na comunicação com o servidor. Verifique a ligação.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="min-h-screen bg-[#141414] flex items-center justify-center p-6 font-sans">
            <div className="w-full max-w-md bg-white p-12 shadow-2xl">
                <div className="text-center mb-12">
                    <h1 className="text-3xl font-serif text-carapita-dark uppercase tracking-widest mb-2">Login</h1>
                    <p className="text-[10px] text-carapita-muted tracking-mega uppercase">Refúgio Carapita</p>
                </div>

                <form onSubmit={handleLogin} className="flex flex-col gap-6">
                    <div className="flex flex-col gap-2">
                        <label className="text-[10px] uppercase tracking-widest font-semibold text-carapita-muted">E-mail</label>
                        <input
                            id="login-email"
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="border-b border-gray-200 outline-none pb-2 text-sm font-light focus:border-carapita-gold transition-colors"
                            placeholder="o-seu@email.com"
                        />
                    </div>

                    <div className="flex flex-col gap-2">
                        <label className="text-[10px] uppercase tracking-widest font-semibold text-carapita-muted">Senha</label>
                        <input
                            id="login-senha"
                            type="password"
                            required
                            value={senha}
                            onChange={(e) => setSenha(e.target.value)}
                            className="border-b border-gray-200 outline-none pb-2 text-sm font-light focus:border-carapita-gold transition-colors"
                            placeholder="••••••••"
                        />
                    </div>

                    {/* Mensagem de erro */}
                    {erro && (
                        <div className="bg-red-50 border border-red-200 text-red-600 text-[11px] px-4 py-3 rounded text-center leading-relaxed">
                            {erro}
                        </div>
                    )}

                    <button
                        id="login-btn"
                        disabled={loading}
                        className="bg-carapita-dark text-white uppercase text-xs tracking-mega py-4 hover:bg-carapita-gold transition-colors duration-500 mt-6 disabled:opacity-50"
                    >
                        {loading ? 'A verificar...' : 'Entrar'}
                    </button>
                </form>

                <div className="mt-8 text-center text-[10px] uppercase tracking-widest text-carapita-muted">
                    Ainda não tem conta? <a href="/cadastro" className="text-carapita-gold font-bold">Cadastre-se</a>
                </div>
            </div>
        </main>
    );
}
