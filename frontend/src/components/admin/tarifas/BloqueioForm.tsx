"use client";
import React from 'react';
import { Lock } from 'lucide-react';
import type { Quarto } from './types';

interface BloqueioFormProps {
    quartos:        Quarto[];
    novoBloqueio:   { quarto_id: string; data_inicio: string; data_fim: string; motivo: string };
    setNovoBloqueio: React.Dispatch<React.SetStateAction<{ quarto_id: string; data_inicio: string; data_fim: string; motivo: string }>>;
    savingBloqueio: boolean;
    onSubmit:       (e: React.FormEvent) => void;
}

export default function BloqueioForm({ quartos, novoBloqueio, setNovoBloqueio, savingBloqueio, onSubmit }: BloqueioFormProps) {
    return (
        <div className="bg-white border border-gray-100 shadow-sm">
            <div className="px-7 py-5 border-b border-gray-50 flex items-center gap-2.5">
                <div className="w-7 h-7 bg-[#1E3932] flex items-center justify-center">
                    <Lock size={13} className="text-[#C4A484]" />
                </div>
                <h2 className="font-serif text-lg text-[#1E3932]">Novo Bloqueio</h2>
            </div>

            <form onSubmit={onSubmit} className="p-7 space-y-6">
                <div>
                    <label className="text-[10px] uppercase tracking-widest text-gray-400 font-bold block mb-2">Alojamento *</label>
                    <select required value={novoBloqueio.quarto_id}
                        onChange={e => setNovoBloqueio(p => ({ ...p, quarto_id: e.target.value }))}
                        className="w-full border-b border-gray-200 py-3 outline-none text-sm focus:border-[#C4A484] transition-colors bg-transparent text-[#1E3932] cursor-pointer">
                        <option value="">— Selecionar alojamento —</option>
                        {quartos.map(q => <option key={q.id} value={q.id}>{q.nome}</option>)}
                    </select>
                </div>

                <div className="grid grid-cols-2 gap-5">
                    <div>
                        <label className="text-[10px] uppercase tracking-widest text-gray-400 font-bold block mb-2">Desde *</label>
                        <input type="date" required value={novoBloqueio.data_inicio}
                            onChange={e => setNovoBloqueio(p => ({ ...p, data_inicio: e.target.value }))}
                            className="w-full border-b border-gray-200 py-3 outline-none text-sm focus:border-[#C4A484] transition-colors" />
                    </div>
                    <div>
                        <label className="text-[10px] uppercase tracking-widest text-gray-400 font-bold block mb-2">Até *</label>
                        <input type="date" required value={novoBloqueio.data_fim}
                            onChange={e => setNovoBloqueio(p => ({ ...p, data_fim: e.target.value }))}
                            className="w-full border-b border-gray-200 py-3 outline-none text-sm focus:border-[#C4A484] transition-colors" />
                    </div>
                </div>

                <div>
                    <label className="text-[10px] uppercase tracking-widest text-gray-400 font-bold block mb-2">Motivo</label>
                    <textarea rows={2} value={novoBloqueio.motivo}
                        onChange={e => setNovoBloqueio(p => ({ ...p, motivo: e.target.value }))}
                        className="w-full border border-gray-100 bg-[#FAF8F4] p-4 text-sm outline-none focus:border-[#C4A484] transition-colors resize-none text-[#1E3932] placeholder-gray-300"
                        placeholder="Ex: Manutenção, uso pessoal, obras..." />
                </div>

                <button disabled={savingBloqueio}
                    className="w-full bg-[#1E3932] text-[#C4A484] py-4 text-[10px] uppercase tracking-widest font-bold hover:bg-[#C4A484] hover:text-white transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer">
                    {savingBloqueio
                        ? <><span className="w-3 h-3 border-2 border-current/30 border-t-current rounded-full animate-spin" /> A guardar...</>
                        : <><Lock size={13} /> Gravar Bloqueio</>}
                </button>
            </form>
        </div>
    );
}
