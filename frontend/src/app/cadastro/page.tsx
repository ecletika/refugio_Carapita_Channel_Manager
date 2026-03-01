"use client";
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function CadastroHospede() {
    const [form, setForm] = useState({ nome: '', email: '', senha: '', telefone: '' });
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleCadastro = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const resp = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/hospede/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form)
            });
            const dados = await resp.json();
            if (dados.status === 'success') {
                alert('Cadastro realizado! Agora você pode fazer login.');
                router.push('/login');
            } else {
                alert(dados.error || 'Erro ao cadastrar');
            }
        } catch (e) {
            alert('Falha na comunicação com o servidor');
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="min-h-screen bg-[#141414] flex items-center justify-center p-6 font-sans">
            <div className="w-full max-w-md bg-white p-12 shadow-2xl">
                <div className="text-center mb-12">
                    <h1 className="text-3xl font-serif text-carapita-dark uppercase tracking-widest mb-2">Cadastro</h1>
                    <p className="text-[10px] text-carapita-muted tracking-mega uppercase">Crie sua conta no Refúgio</p>
                </div>

                <form onSubmit={handleCadastro} className="flex flex-col gap-6">
                    <div className="flex flex-col gap-2">
                        <label className="text-[10px] uppercase tracking-widest font-semibold text-carapita-muted">Nome Completo</label>
                        <input
                            type="text"
                            required
                            value={form.nome}
                            onChange={(e) => setForm({ ...form, nome: e.target.value })}
                            className="border-b border-gray-200 outline-none pb-2 text-sm font-light focus:border-carapita-gold transition-colors"
                        />
                    </div>

                    <div className="flex flex-col gap-2">
                        <label className="text-[10px] uppercase tracking-widest font-semibold text-carapita-muted">E-mail</label>
                        <input
                            type="email"
                            required
                            value={form.email}
                            onChange={(e) => setForm({ ...form, email: e.target.value })}
                            className="border-b border-gray-200 outline-none pb-2 text-sm font-light focus:border-carapita-gold transition-colors"
                        />
                    </div>

                    <div className="flex flex-col gap-2">
                        <label className="text-[10px] uppercase tracking-widest font-semibold text-carapita-muted">Telefone</label>
                        <input
                            type="text"
                            value={form.telefone}
                            onChange={(e) => setForm({ ...form, telefone: e.target.value })}
                            className="border-b border-gray-200 outline-none pb-2 text-sm font-light focus:border-carapita-gold transition-colors"
                        />
                    </div>

                    <div className="flex flex-col gap-2">
                        <label className="text-[10px] uppercase tracking-widest font-semibold text-carapita-muted">Senha</label>
                        <input
                            type="password"
                            required
                            value={form.senha}
                            onChange={(e) => setForm({ ...form, senha: e.target.value })}
                            className="border-b border-gray-200 outline-none pb-2 text-sm font-light focus:border-carapita-gold transition-colors"
                        />
                    </div>

                    <button
                        disabled={loading}
                        className="bg-carapita-dark text-white uppercase text-xs tracking-mega py-4 hover:bg-carapita-gold transition-colors duration-500 mt-6 disabled:opacity-50"
                    >
                        {loading ? 'Cadastrando...' : 'Criar Conta'}
                    </button>
                </form>

                <div className="mt-8 text-center text-[10px] uppercase tracking-widest text-carapita-muted">
                    Já tem conta? <a href="/login" className="text-carapita-gold font-bold">Faça login</a>
                </div>
            </div>
        </main>
    );
}
