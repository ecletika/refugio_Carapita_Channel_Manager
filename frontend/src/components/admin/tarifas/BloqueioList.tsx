"use client";
import React from 'react';
import { ShieldOff, Calendar, Moon, Trash2 } from 'lucide-react';
import type { Bloqueio } from './types';
import { fmtDate, nomeQuarto } from './helpers';

interface BloqueioListProps {
    bloqueios:  Bloqueio[];
    onDeletar:  (id: string) => void;
}

export default function BloqueioList({ bloqueios, onDeletar }: BloqueioListProps) {
    return (
        <div>
            <div className="flex items-center justify-between mb-5 pb-4 border-b border-gray-100">
                <h2 className="font-serif text-xl text-[#1E3932]">Agenda Bloqueada</h2>
                <span className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">
                    {bloqueios.length} {bloqueios.length === 1 ? 'período' : 'períodos'}
                </span>
            </div>

            {bloqueios.length === 0 ? (
                <div className="bg-white border border-dashed border-gray-200 py-14 text-center">
                    <ShieldOff size={28} className="text-gray-200 mx-auto mb-3" />
                    <p className="text-[10px] uppercase tracking-widest text-gray-300">Toda a agenda está disponível.</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {bloqueios.map(b => (
                        <div key={b.id}
                            className="bg-white border border-gray-100 hover:border-red-100 transition-all duration-200 group">
                            <div className="flex items-stretch">
                                <div className="w-1 bg-gray-200 group-hover:bg-red-300 transition-colors shrink-0" />
                                <div className="flex items-center gap-5 px-5 py-4 flex-1 min-w-0">
                                    <div className="w-9 h-9 bg-gray-100 group-hover:bg-red-50 flex items-center justify-center transition-colors shrink-0">
                                        <Moon size={15} className="text-gray-400 group-hover:text-red-400 transition-colors" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                                            <span className="font-serif text-base text-[#1E3932] truncate">{nomeQuarto(b)}</span>
                                            <span className="text-[9px] uppercase tracking-widest text-red-500 border border-red-100 bg-red-50 px-2 py-0.5 font-bold shrink-0">
                                                Bloqueado
                                            </span>
                                        </div>
                                        {b.motivo && (
                                            <p className="text-[10px] text-gray-400 italic mb-1.5 truncate">"{b.motivo}"</p>
                                        )}
                                        <div className="flex items-center gap-2 text-gray-400">
                                            <Calendar size={10} className="text-[#C4A484]" />
                                            <span className="text-[10px]">{fmtDate(b.data_inicio)}</span>
                                            <span className="text-gray-200 text-[10px]">→</span>
                                            <span className="text-[10px]">{fmtDate(b.data_fim)}</span>
                                        </div>
                                    </div>
                                    <button onClick={() => onDeletar(b.id)}
                                        className="w-8 h-8 flex items-center justify-center border border-gray-100 text-gray-300 hover:text-red-500 hover:border-red-100 transition-all duration-200 shrink-0 cursor-pointer">
                                        <Trash2 size={13} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
