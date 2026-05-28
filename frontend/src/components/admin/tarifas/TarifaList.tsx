"use client";
import React from 'react';
import { TrendingUp, Calendar, Moon, Edit2, Trash2 } from 'lucide-react';
import type { TarifaSazonal, Quarto } from './types';
import { fmtDate, nomeQuarto, getSemanaBase, getFdsBase, euroToPercent, POLITICA_LABEL } from './helpers';

interface TarifaListProps {
    tarifas:   TarifaSazonal[];
    quartos:   Quarto[];
    onEditar:  (t: TarifaSazonal) => void;
    onDeletar: (id: string) => void;
}

export default function TarifaList({ tarifas, quartos, onEditar, onDeletar }: TarifaListProps) {
    const pctSem = (t: TarifaSazonal) => {
        const base = getSemanaBase(quartos, t.quarto_id);
        return base ? euroToPercent(Number(t.preco_noite), base) : null;
    };
    const pctFds = (t: TarifaSazonal) => {
        if (!t.preco_noite_fds) return null;
        const base = getFdsBase(quartos, t.quarto_id);
        return base ? euroToPercent(Number(t.preco_noite_fds), base) : null;
    };

    return (
        <div>
            <div className="flex items-center justify-between mb-5 pb-4 border-b border-gray-100">
                <h2 className="font-serif text-xl text-[#1E3932]">Tarifas Ativas</h2>
                <span className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">
                    {tarifas.length} {tarifas.length === 1 ? 'regra' : 'regras'}
                </span>
            </div>

            {tarifas.length === 0 ? (
                <div className="bg-white border border-dashed border-gray-200 py-14 text-center">
                    <TrendingUp size={28} className="text-gray-200 mx-auto mb-3" />
                    <p className="text-[10px] uppercase tracking-widest text-gray-300">Sem variações de preço configuradas.</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {tarifas.map(t => {
                        const ps = pctSem(t);
                        const pf = pctFds(t);
                        return (
                            <div key={t.id} className="bg-white border border-gray-100 hover:border-[#C4A484]/30 transition-all duration-200 group">
                                <div className="flex items-stretch">
                                    <div className="w-1 bg-[#C4A484]/30 group-hover:bg-[#C4A484] transition-colors shrink-0" />
                                    <div className="flex items-center gap-5 px-5 py-4 flex-1 min-w-0">

                                        {/* Info */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                                                <span className="font-serif text-base text-[#1E3932] truncate">{nomeQuarto(t)}</span>
                                                {t.motivo && (
                                                    <span className="text-[9px] uppercase tracking-widest bg-[#1E3932]/5 text-[#1E3932] px-2 py-0.5 font-bold shrink-0">
                                                        {t.motivo}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2 text-gray-400 flex-wrap">
                                                <Calendar size={10} className="text-[#C4A484]" />
                                                <span className="text-[10px]">{fmtDate(t.data_inicio)}</span>
                                                <span className="text-gray-200 text-[10px]">→</span>
                                                <span className="text-[10px]">{fmtDate(t.data_fim)}</span>
                                                <span className="text-gray-200">·</span>
                                                <span className="text-[10px] text-[#C4A484] font-bold">
                                                    {POLITICA_LABEL[t.politica_cancelamento] || t.politica_cancelamento}
                                                </span>
                                                <span className="text-gray-200">·</span>
                                                <Moon size={9} className="text-gray-300" />
                                                <span className="text-[10px] text-gray-400">mín {t.minima_estadia}n</span>
                                            </div>
                                        </div>

                                        {/* Preços */}
                                        <div className="shrink-0 text-right pr-2 space-y-1.5">
                                            <div>
                                                <div className="flex items-baseline gap-0.5 justify-end">
                                                    <span className="text-sm text-[#C4A484] font-serif">€</span>
                                                    <span className="text-2xl font-serif text-[#1E3932] leading-none">{Number(t.preco_noite).toFixed(0)}</span>
                                                    <span className="text-[9px] text-gray-300 ml-0.5">/noite</span>
                                                </div>
                                                {ps !== null && (
                                                    <div className={`text-[9px] font-bold uppercase tracking-widest text-right
                                                        ${ps > 100 ? 'text-green-500' : ps < 100 ? 'text-amber-500' : 'text-gray-400'}`}>
                                                        {ps > 100 ? `+${(ps-100).toFixed(1)}%` : ps < 100 ? `−${(100-ps).toFixed(1)}%` : '= Base'}
                                                    </div>
                                                )}
                                            </div>
                                            {t.preco_noite_fds ? (
                                                <div className="border-t border-[#C4A484]/20 pt-1.5">
                                                    <div className="flex items-baseline gap-0.5 justify-end">
                                                        <span className="text-[8px] text-[#C4A484] font-bold uppercase mr-0.5">★fds</span>
                                                        <span className="text-[#C4A484] font-serif">€</span>
                                                        <span className="text-lg font-serif text-[#C4A484] leading-none">{Number(t.preco_noite_fds).toFixed(0)}</span>
                                                    </div>
                                                    {pf !== null && (
                                                        <div className={`text-[9px] font-bold uppercase tracking-widest text-right
                                                            ${pf > 100 ? 'text-green-500' : pf < 100 ? 'text-amber-500' : 'text-gray-400'}`}>
                                                            {pf > 100 ? `+${(pf-100).toFixed(1)}%` : pf < 100 ? `−${(100-pf).toFixed(1)}%` : '= Base'}
                                                        </div>
                                                    )}
                                                </div>
                                            ) : null}
                                        </div>

                                        {/* Actions */}
                                        <div className="flex gap-1.5 shrink-0">
                                            <button onClick={() => onEditar(t)}
                                                className="w-8 h-8 flex items-center justify-center border border-gray-100 text-gray-300 hover:text-amber-500 hover:border-amber-200 transition-all duration-200 cursor-pointer">
                                                <Edit2 size={13} />
                                            </button>
                                            <button onClick={() => onDeletar(t.id)}
                                                className="w-8 h-8 flex items-center justify-center border border-gray-100 text-gray-300 hover:text-red-500 hover:border-red-100 transition-all duration-200 cursor-pointer">
                                                <Trash2 size={13} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
