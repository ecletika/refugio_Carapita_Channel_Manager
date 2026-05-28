"use client";
import React from 'react';
import { Plus, Euro, Moon, Edit2, X, Tag, Percent, AlertCircle } from 'lucide-react';
import type { Quarto, NovaTarifaState } from './types';
import { isFimDeSemana, getSemanaBase, getFdsBase } from './helpers';

interface TarifaFormProps {
    quartos:         Quarto[];
    novaTarifa:      NovaTarifaState;
    setNovaTarifa:   React.Dispatch<React.SetStateAction<NovaTarifaState>>;
    editandoTarifaId: string | null;
    savingTarifa:    boolean;
    onSubmit:        (e: React.FormEvent) => void;
    onPrecoChange:   (v: string) => void;
    onPercentagemChange: (v: string) => void;
    onPrecoFdsChange: (v: string) => void;
    onPercentagemFdsChange: (v: string) => void;
    onReset:         () => void;
}

export default function TarifaForm({
    quartos, novaTarifa, setNovaTarifa, editandoTarifaId,
    savingTarifa, onSubmit, onPrecoChange, onPercentagemChange,
    onPrecoFdsChange, onPercentagemFdsChange, onReset,
}: TarifaFormProps) {
    const quartoSelecionado  = quartos.find(q => q.id === novaTarifa.quarto_id);
    const baseSemanaSelected = getSemanaBase(quartos, novaTarifa.quarto_id);
    const baseFdsSelected    = getFdsBase(quartos, novaTarifa.quarto_id);

    return (
        <div className="bg-white border border-gray-100 shadow-sm">
            <div className={`px-7 py-5 border-b flex items-center justify-between
                ${editandoTarifaId ? 'bg-amber-50 border-amber-100' : 'border-gray-50'}`}>
                <div className="flex items-center gap-2.5">
                    <div className={`w-7 h-7 flex items-center justify-center ${editandoTarifaId ? 'bg-amber-100' : 'bg-[#1E3932]'}`}>
                        {editandoTarifaId ? <Edit2 size={13} className="text-amber-600" /> : <Plus size={13} className="text-[#C4A484]" />}
                    </div>
                    <h2 className="font-serif text-lg text-[#1E3932]">
                        {editandoTarifaId ? 'Editar Época Especial' : 'Nova Época Especial'}
                    </h2>
                </div>
                {editandoTarifaId && (
                    <button onClick={onReset}
                        className="text-[9px] uppercase tracking-widest text-gray-400 hover:text-red-500 transition-colors flex items-center gap-1 cursor-pointer">
                        <X size={11} /> Cancelar
                    </button>
                )}
            </div>

            <form onSubmit={onSubmit} className="p-7 space-y-6">

                {/* Alojamento */}
                <div>
                    <label className="text-[10px] uppercase tracking-widest text-gray-400 font-bold block mb-2">Alojamento *</label>
                    <select required value={novaTarifa.quarto_id}
                        onChange={e => setNovaTarifa(p => ({ ...p, quarto_id: e.target.value }))}
                        className="w-full border-b border-gray-200 py-3 outline-none text-sm focus:border-[#C4A484] transition-colors bg-transparent text-[#1E3932] cursor-pointer">
                        <option value="">— Selecionar alojamento —</option>
                        {quartos.map(q => (
                            <option key={q.id} value={q.id}>
                                {q.nome}
                                {(q.tarifa_semana || q.tarifa_fds)
                                    ? ` (Sem: €${Number(q.tarifa_semana ?? q.preco_base).toFixed(0)} · FDS: €${Number(q.tarifa_fds ?? q.preco_base).toFixed(0)})`
                                    : ` (base: €${Number(q.preco_base).toFixed(0)}/noite)`}
                            </option>
                        ))}
                    </select>
                    {quartoSelecionado && (
                        <div className="mt-2 flex gap-3 flex-wrap">
                            <span className="text-[9px] bg-[#1E3932]/5 text-[#1E3932] px-2 py-1 font-bold uppercase tracking-widest">
                                Semana: €{Number(quartoSelecionado.tarifa_semana ?? quartoSelecionado.preco_base).toFixed(2)}
                            </span>
                            <span className="text-[9px] bg-[#C4A484]/10 text-[#1E3932] px-2 py-1 font-bold uppercase tracking-widest">
                                FDS: €{Number(quartoSelecionado.tarifa_fds ?? quartoSelecionado.preco_base).toFixed(2)}
                            </span>
                        </div>
                    )}
                    {quartos.length === 0 && (
                        <p className="text-[10px] text-amber-500 mt-1 flex items-center gap-1">
                            <AlertCircle size={10} /> A carregar alojamentos...
                        </p>
                    )}
                </div>

                {/* Datas */}
                <div className="grid grid-cols-2 gap-5">
                    <div>
                        <label className="text-[10px] uppercase tracking-widest text-gray-400 font-bold block mb-2">Desde *</label>
                        <input type="date" required value={novaTarifa.data_inicio}
                            onChange={e => setNovaTarifa(p => ({ ...p, data_inicio: e.target.value }))}
                            className="w-full border-b border-gray-200 py-3 outline-none text-sm focus:border-[#C4A484] transition-colors" />
                        {novaTarifa.data_inicio && (
                            <span className={`text-[9px] mt-1 block font-bold uppercase tracking-widest
                                ${isFimDeSemana(novaTarifa.data_inicio) ? 'text-[#C4A484]' : 'text-[#1E3932]/60'}`}>
                                {isFimDeSemana(novaTarifa.data_inicio) ? '★ Fim de Semana' : '● Semana'}
                            </span>
                        )}
                    </div>
                    <div>
                        <label className="text-[10px] uppercase tracking-widest text-gray-400 font-bold block mb-2">Até *</label>
                        <input type="date" required value={novaTarifa.data_fim}
                            onChange={e => setNovaTarifa(p => ({ ...p, data_fim: e.target.value }))}
                            className="w-full border-b border-gray-200 py-3 outline-none text-sm focus:border-[#C4A484] transition-colors" />
                    </div>
                </div>

                {/* Preços Semana + FDS */}
                <div className="border border-gray-100 bg-gray-50/50 p-4 space-y-5">
                    <span className="text-[10px] uppercase tracking-widest text-gray-500 font-bold block">Valor por Noite</span>

                    {/* Semana */}
                    <div className="border-l-2 border-[#1E3932]/25 pl-3 space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="text-[9px] uppercase tracking-widest text-[#1E3932]/70 font-bold">● Semana · Seg–Qui</span>
                            {baseSemanaSelected > 0 && (
                                <span className="text-[9px] bg-[#1E3932]/5 text-[#1E3932] px-2 py-0.5 font-bold uppercase tracking-widest">
                                    Base: €{baseSemanaSelected.toFixed(2)}
                                </span>
                            )}
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-[10px] uppercase tracking-widest text-gray-400 font-bold block mb-1.5">Valor (€) *</label>
                                <div className="flex items-center gap-2 border-b border-gray-200 focus-within:border-[#C4A484] transition-colors pb-1">
                                    <Euro size={13} className="text-[#C4A484] shrink-0" />
                                    <input type="number" required min="0" step="0.01"
                                        value={novaTarifa.preco_noite || ''}
                                        onChange={e => onPrecoChange(e.target.value)}
                                        className="w-full py-2 outline-none text-sm bg-transparent text-[#1E3932]"
                                        placeholder="0.00" />
                                </div>
                            </div>
                            <div>
                                <label className="text-[10px] uppercase tracking-widest text-gray-400 font-bold block mb-1.5">% da base</label>
                                <div className="flex items-center gap-2 border-b border-gray-200 focus-within:border-[#C4A484] transition-colors pb-1">
                                    <Percent size={13} className="text-[#C4A484] shrink-0" />
                                    <input type="number" min="0" step="0.01"
                                        value={novaTarifa.percentagem || ''}
                                        onChange={e => onPercentagemChange(e.target.value)}
                                        disabled={!baseSemanaSelected}
                                        className="w-full py-2 outline-none text-sm bg-transparent text-[#1E3932] disabled:opacity-40 disabled:cursor-not-allowed"
                                        placeholder="100" />
                                </div>
                                {!baseSemanaSelected && novaTarifa.quarto_id && (
                                    <p className="text-[9px] text-amber-500 mt-1">Configure tarifas base no alojamento.</p>
                                )}
                            </div>
                        </div>
                        {novaTarifa.preco_noite > 0 && baseSemanaSelected > 0 && (
                            <div className={`text-[9px] font-bold uppercase tracking-widest flex items-center gap-1.5
                                ${novaTarifa.percentagem > 100 ? 'text-green-600' : novaTarifa.percentagem < 100 ? 'text-amber-600' : 'text-gray-400'}`}>
                                {novaTarifa.percentagem > 100
                                    ? `▲ +${(novaTarifa.percentagem - 100).toFixed(2)}% acima da base`
                                    : novaTarifa.percentagem < 100
                                    ? `▼ −${(100 - novaTarifa.percentagem).toFixed(2)}% abaixo da base`
                                    : '= Igual à tarifa base'}
                            </div>
                        )}
                    </div>

                    {/* FDS */}
                    <div className="border-l-2 border-[#C4A484]/50 pl-3 space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="text-[9px] uppercase tracking-widest text-[#C4A484] font-bold">★ Fim de Semana · Sex–Dom</span>
                            {baseFdsSelected > 0 && (
                                <span className="text-[9px] bg-[#C4A484]/10 text-[#1E3932] px-2 py-0.5 font-bold uppercase tracking-widest">
                                    Base: €{baseFdsSelected.toFixed(2)}
                                </span>
                            )}
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-[10px] uppercase tracking-widest text-gray-400 font-bold block mb-1.5">Valor (€)</label>
                                <div className="flex items-center gap-2 border-b border-gray-200 focus-within:border-[#C4A484] transition-colors pb-1">
                                    <Euro size={13} className="text-[#C4A484] shrink-0" />
                                    <input type="number" min="0" step="0.01"
                                        value={novaTarifa.preco_noite_fds || ''}
                                        onChange={e => onPrecoFdsChange(e.target.value)}
                                        className="w-full py-2 outline-none text-sm bg-transparent text-[#1E3932]"
                                        placeholder="Vazio = igual à semana" />
                                </div>
                            </div>
                            <div>
                                <label className="text-[10px] uppercase tracking-widest text-gray-400 font-bold block mb-1.5">% base FDS</label>
                                <div className="flex items-center gap-2 border-b border-gray-200 focus-within:border-[#C4A484] transition-colors pb-1">
                                    <Percent size={13} className="text-[#C4A484] shrink-0" />
                                    <input type="number" min="0" step="0.01"
                                        value={novaTarifa.percentagem_fds || ''}
                                        onChange={e => onPercentagemFdsChange(e.target.value)}
                                        disabled={!baseFdsSelected}
                                        className="w-full py-2 outline-none text-sm bg-transparent text-[#1E3932] disabled:opacity-40 disabled:cursor-not-allowed"
                                        placeholder="Opcional" />
                                </div>
                            </div>
                        </div>
                        {novaTarifa.preco_noite_fds > 0 && baseFdsSelected > 0 ? (
                            <div className={`text-[9px] font-bold uppercase tracking-widest flex items-center gap-1.5
                                ${novaTarifa.percentagem_fds > 100 ? 'text-green-600' : novaTarifa.percentagem_fds < 100 ? 'text-amber-600' : 'text-gray-400'}`}>
                                {novaTarifa.percentagem_fds > 100
                                    ? `▲ +${(novaTarifa.percentagem_fds - 100).toFixed(2)}% acima da base FDS`
                                    : novaTarifa.percentagem_fds < 100
                                    ? `▼ −${(100 - novaTarifa.percentagem_fds).toFixed(2)}% abaixo da base FDS`
                                    : '= Igual à tarifa base FDS'}
                            </div>
                        ) : (
                            <p className="text-[9px] text-gray-400 italic">Deixe vazio para aplicar o mesmo preço da semana ao FDS.</p>
                        )}
                    </div>
                </div>

                {/* Identificador */}
                <div>
                    <label className="text-[10px] uppercase tracking-widest text-gray-400 font-bold block mb-2">Identificador</label>
                    <div className="flex items-center gap-3 border-b border-gray-200 focus-within:border-[#C4A484] transition-colors">
                        <Tag size={13} className="text-gray-300 shrink-0" />
                        <input value={novaTarifa.motivo}
                            onChange={e => setNovaTarifa(p => ({ ...p, motivo: e.target.value }))}
                            className="w-full py-3 outline-none text-sm bg-transparent text-[#1E3932] placeholder-gray-300"
                            placeholder="Ex: Verão 2025, Semana Santa..." />
                    </div>
                </div>

                {/* Política + Mín */}
                <div className="grid grid-cols-2 gap-5">
                    <div>
                        <label className="text-[10px] uppercase tracking-widest text-gray-400 font-bold block mb-2">Política Cancel.</label>
                        <select value={novaTarifa.politica_cancelamento}
                            onChange={e => setNovaTarifa(p => ({ ...p, politica_cancelamento: e.target.value }))}
                            className="w-full border-b border-gray-200 py-3 outline-none text-sm focus:border-[#C4A484] transition-colors bg-transparent text-[#1E3932] cursor-pointer">
                            <option value="FLEXIVEL">Flexível</option>
                            <option value="MODERADA">Moderada</option>
                            <option value="LIMITADA">Limitada</option>
                            <option value="RIGOROSA">Rigorosa</option>
                        </select>
                    </div>
                    <div>
                        <label className="text-[10px] uppercase tracking-widest text-gray-400 font-bold block mb-2">Mín. Noites</label>
                        <div className="flex items-center gap-3 border-b border-gray-200 focus-within:border-[#C4A484] transition-colors">
                            <Moon size={13} className="text-gray-300 shrink-0" />
                            <input type="number" min="1" value={novaTarifa.minima_estadia}
                                onChange={e => setNovaTarifa(p => ({ ...p, minima_estadia: parseInt(e.target.value) || 1 }))}
                                className="w-full py-3 outline-none text-sm bg-transparent text-[#1E3932]" />
                        </div>
                    </div>
                </div>

                <button disabled={savingTarifa}
                    className={`w-full py-4 text-[10px] uppercase tracking-widest font-bold transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer
                        ${editandoTarifaId ? 'bg-amber-600 text-white hover:bg-amber-700' : 'bg-[#1E3932] text-[#C4A484] hover:bg-[#C4A484] hover:text-white'}
                        disabled:opacity-50 disabled:cursor-not-allowed`}>
                    {savingTarifa
                        ? <><span className="w-3 h-3 border-2 border-current/30 border-t-current rounded-full animate-spin" /> A guardar...</>
                        : editandoTarifaId
                            ? <><Edit2 size={13} /> Guardar Alterações</>
                            : <><Plus size={13} /> Aplicar Tarifa Especial</>}
                </button>
            </form>
        </div>
    );
}
