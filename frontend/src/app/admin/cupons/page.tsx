'use client';

import { useState, useEffect } from 'react';
import { Plus, Trash2, CircleCheck, Ticket, Percent } from 'lucide-react';

export default function CuponsAdmin() {
    const [cupons, setCupons] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);

    const [form, setForm] = useState({
        codigo: '',
        tipo_desconto: 'PERCENTUAL',
        valor_desconto: '',
        limite_usos: '',
        data_validade: ''
    });

    useEffect(() => {
        fetchCupons();
    }, []);

    const fetchCupons = async () => {
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/cupons`);
            const json = await res.json();
            if (json.status === 'success') {
                setCupons(json.data);
            }
        } catch (error) {
            console.error('Erro ao buscar cupons:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSalvar = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const payload = {
                codigo: form.codigo,
                tipo_desconto: form.tipo_desconto,
                valor_desconto: Number(form.valor_desconto),
                limite_usos: form.limite_usos ? Number(form.limite_usos) : null,
                data_validade: form.data_validade || null
            };

            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/cupons`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const json = await res.json();
            if (json.status === 'success') {
                await fetchCupons();
                setShowModal(false);
                setForm({ codigo: '', tipo_desconto: 'PERCENTUAL', valor_desconto: '', limite_usos: '', data_validade: '' });
                alert('Cupão criado com sucesso!');
            } else {
                alert('Erro: ' + json.error);
            }
        } catch (error) {
            console.error(error);
            alert('Erro ao tentar comunicar com o servidor.');
        }
    };

    const handleExcluir = async (id: string) => {
        if (!confirm('Tem certeza que deseja excluir este cupão?')) return;
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/cupons/${id}`, { method: 'DELETE' });
            if (res.ok) {
                setCupons(cupons.filter(c => c.id !== id));
            }
        } catch (e) {
            alert('Erro ao excluir.');
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center bg-white p-6 shadow-sm border border-gray-100 rounded-sm">
                <div>
                    <h1 className="text-2xl font-serif text-gray-900 tracking-wide">Cupons de Desconto</h1>
                    <p className="text-sm text-gray-500 mt-1">Gere os cupons para campanhas promocionais</p>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="flex items-center gap-2 bg-gradient-to-r from-gray-900 to-gray-800 text-white px-5 py-2.5 rounded hover:from-black hover:to-gray-900 transition-all font-medium text-sm shadow-md"
                >
                    <Plus size={18} /> Novo Cupão
                </button>
            </div>

            {loading ? (
                <div className="flex justify-center items-center py-20 text-gray-400">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-carapita-gold mb-4"></div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {cupons.map(cupom => (
                        <div key={cupom.id} className="bg-white rounded border border-gray-100 p-6 flex flex-col justify-between hover:shadow-lg transition-all shadow-sm">
                            <div>
                                <div className="flex justify-between items-start mb-4">
                                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-green-50 text-green-700 text-xs font-bold uppercase rounded tracking-wider border border-green-100">
                                        <Ticket size={14} />
                                        {cupom.codigo}
                                    </div>
                                    <button onClick={() => handleExcluir(cupom.id)} className="text-gray-300 hover:text-red-500 transition-colors">
                                        <Trash2 size={16} />
                                    </button>
                                </div>

                                <h3 className="text-3xl font-serif text-gray-900 mb-1">
                                    {cupom.tipo_desconto === 'PERCENTUAL' ? `${cupom.valor_desconto}%` : `€${cupom.valor_desconto}`}
                                </h3>
                                <p className="text-xs text-gray-500 font-medium">Desconto {cupom.tipo_desconto.toLowerCase()}</p>

                                <div className="mt-6 space-y-2 text-sm text-gray-600">
                                    <div className="flex justify-between">
                                        <span className="text-gray-400">Usos:</span>
                                        <span className="font-medium text-gray-900">{cupom.usos_atuais} / {cupom.limite_usos || '∞'}</span>
                                    </div>
                                    {cupom.data_validade && (
                                        <div className="flex justify-between">
                                            <span className="text-gray-400">Validade:</span>
                                            <span className="font-medium text-gray-900 ml-2">{new Date(cupom.data_validade).toLocaleDateString()}</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="mt-6 pt-4 border-t border-gray-50 flex items-center gap-2">
                                <CircleCheck size={16} className={cupom.ativo ? "text-green-500" : "text-gray-300"} />
                                <span className={cupom.ativo ? "text-xs font-medium text-green-600" : "text-xs font-medium text-gray-400"}>
                                    {cupom.ativo ? 'Em vigor' : 'Inativo'}
                                </span>
                            </div>
                        </div>
                    ))}
                    {cupons.length === 0 && (
                        <div className="col-span-full py-16 text-center text-gray-400 border border-dashed border-gray-200 rounded-lg">
                            <Ticket size={48} className="mx-auto text-gray-200 mb-4" />
                            <p className="text-gray-500">Nenhum cupão de desconto ativo.</p>
                        </div>
                    )}
                </div>
            )}

            {showModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-2xl relative">
                        <h2 className="text-xl font-serif text-gray-900 mb-6">Criar Novo Cupão</h2>

                        <form onSubmit={handleSalvar} className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Código (Ex: CARAPITA10)</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full border border-gray-200 p-3 rounded text-sm focus:border-carapita-gold outline-none"
                                    value={form.codigo}
                                    onChange={e => setForm({ ...form, codigo: e.target.value.toUpperCase() })}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Tipo</label>
                                    <select
                                        className="w-full border border-gray-200 p-3 rounded text-sm focus:border-carapita-gold outline-none bg-white"
                                        value={form.tipo_desconto}
                                        onChange={e => setForm({ ...form, tipo_desconto: e.target.value })}
                                    >
                                        <option value="PERCENTUAL">Em %</option>
                                        <option value="FIXO">Valor Fixo (€)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Valor</label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            required
                                            min="0"
                                            step="0.01"
                                            className="w-full border border-gray-200 p-3 rounded pl-8 text-sm focus:border-carapita-gold outline-none"
                                            value={form.valor_desconto}
                                            onChange={e => setForm({ ...form, valor_desconto: e.target.value })}
                                        />
                                        <div className="absolute left-3 top-3.5 text-gray-400">
                                            {form.tipo_desconto === 'PERCENTUAL' ? <Percent size={14} /> : '€'}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Limite de Usos (Opcional)</label>
                                <input
                                    type="number"
                                    min="1"
                                    placeholder="Ilimitado se em branco"
                                    className="w-full border border-gray-200 p-3 rounded text-sm focus:border-carapita-gold outline-none"
                                    value={form.limite_usos}
                                    onChange={e => setForm({ ...form, limite_usos: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Data de Validade (Opcional)</label>
                                <input
                                    type="date"
                                    className="w-full border border-gray-200 p-3 rounded text-sm focus:border-carapita-gold outline-none"
                                    value={form.data_validade}
                                    onChange={e => setForm({ ...form, data_validade: e.target.value })}
                                />
                            </div>

                            <div className="flex gap-3 mt-8 pt-4 border-t border-gray-100">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="flex-1 px-4 py-2 border border-gray-200 text-gray-600 rounded hover:bg-gray-50 font-medium"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 py-2 bg-black text-white rounded hover:bg-gray-900 font-medium shadow"
                                >
                                    Criar Cupão
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
