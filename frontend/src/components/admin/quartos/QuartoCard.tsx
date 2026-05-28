"use client";
import React from 'react';
import { Camera, Users, Euro, Home, RefreshCw, Edit2, Trash2, CircleCheck, CircleX, Loader2 } from 'lucide-react';
import type { Quarto, FotoObj } from './types';
import { parseFotos } from './helpers';
import { BtnIcon, StatChip } from './atoms';

interface QuartoCardProps {
    quarto:          Quarto;
    savingId:        string | null;
    onToggleAtivo:   (q: Quarto) => void;
    onSync:          (id: string) => void;
    onEdit:          (q: Quarto) => void;
    onDelete:        (id: string) => void;
    onOpenLightbox:  (fotos: FotoObj[]) => void;
}

export default function QuartoCard({
    quarto: q, savingId, onToggleAtivo, onSync, onEdit, onDelete, onOpenLightbox
}: QuartoCardProps) {
    const fotos   = parseFotos(q.fotos);
    const mainFoto = fotos.find(f => f.isMain)?.url || fotos[0]?.url
        || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=80';

    return (
        <div className="bg-white border border-gray-100 rounded-lg overflow-hidden hover:shadow-md transition-shadow duration-300">
            <div className="flex flex-col sm:flex-row sm:items-center">

                {/* Thumbnail */}
                <div
                    className="w-full sm:w-28 h-44 sm:h-24 shrink-0 bg-gray-100 relative overflow-hidden cursor-pointer group"
                    onClick={() => { if (fotos.length > 0) onOpenLightbox(fotos); }}
                >
                    <img src={mainFoto} alt={q.nome}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                        <Camera size={18} className="text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-md" />
                    </div>
                    {fotos.length > 1 && (
                        <div className="absolute bottom-2 right-2 bg-black/70 text-white text-[9px] px-2 py-0.5 rounded font-bold">
                            +{fotos.length - 1}
                        </div>
                    )}
                </div>

                {/* Info */}
                <div className="flex-1 p-4 sm:px-5 sm:py-3 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1.5">
                        <h3 className="font-serif text-lg text-[#1E3932] leading-tight">{q.nome}</h3>
                        <span className="text-[9px] uppercase tracking-widest bg-gray-50 border border-gray-200 text-gray-500 px-2 py-0.5 rounded">
                            {q.tipo}
                        </span>
                        <button type="button" onClick={() => onToggleAtivo(q)} disabled={savingId === q.id}
                            title={q.ativo ? "Clique para desativar" : "Clique para ativar"}
                            className={`text-[9px] uppercase tracking-widest font-bold flex items-center gap-1 transition-all cursor-pointer rounded px-2 py-0.5 border
                                ${q.ativo
                                    ? 'bg-green-50 text-green-600 border-green-100 hover:bg-red-50 hover:text-red-500 hover:border-red-100'
                                    : 'bg-red-50 text-red-500 border-red-100 hover:bg-green-50 hover:text-green-600 hover:border-green-100'}`}>
                            {savingId === q.id
                                ? <Loader2 size={10} className="animate-spin" />
                                : q.ativo ? <CircleCheck size={10} /> : <CircleX size={10} />}
                            {q.ativo ? 'Ativo' : 'Inativo'}
                        </button>
                    </div>

                    <p className="text-xs text-gray-600 line-clamp-1 mb-2 leading-relaxed">{q.descricao}</p>

                    <div className="flex flex-wrap gap-3">
                        <StatChip icon={<Users size={11} className="text-[#C4A484]" />}    label={`${q.capacidade} hóspedes`} />
                        <StatChip icon={<Euro size={11} className="text-[#C4A484]" />}     label={`€${q.preco_base} / noite`} />
                        <StatChip icon={<Home size={11} className="text-[#C4A484]" />}     label={`Min ${q.minima_estadia_padrao || 2} noites`} />
                        {q.ical_url && <StatChip icon={<RefreshCw size={11} className="text-blue-400" />} label="iCal Sync" className="text-blue-500" />}
                    </div>
                </div>

                {/* Actions */}
                <div className="border-t sm:border-t-0 sm:border-l border-gray-100 flex sm:flex-col items-center justify-around sm:justify-center gap-1 p-3 sm:px-4 sm:py-3 shrink-0">
                    <BtnIcon onClick={() => onSync(q.id)} title="Sincronizar iCal" variant="gold">
                        <RefreshCw size={14} />
                    </BtnIcon>
                    <BtnIcon onClick={() => onEdit(q)} title="Editar alojamento">
                        <Edit2 size={14} />
                    </BtnIcon>
                    <BtnIcon onClick={() => onDelete(q.id)} title="Remover alojamento" variant="danger">
                        <Trash2 size={14} />
                    </BtnIcon>
                </div>
            </div>
        </div>
    );
}
