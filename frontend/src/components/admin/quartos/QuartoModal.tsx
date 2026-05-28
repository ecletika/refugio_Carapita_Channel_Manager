"use client";
import React from 'react';
import {
    X, Plus, Trash2, Edit2, CircleCheck, Upload, Euro, Loader2
} from 'lucide-react';
import type { Quarto, FotoObj, Comodidade } from './types';
import { CAT_LABELS, normalize } from './helpers';
import { BtnPrimary, BtnSecondary, ModalField } from './atoms';

interface QuartoModalProps {
    editQuarto:        Partial<Quarto>;
    setEditQuarto:     React.Dispatch<React.SetStateAction<Partial<Quarto> | null>>;
    fotosEdit:         FotoObj[];
    setFotosEdit:      React.Dispatch<React.SetStateAction<FotoObj[]>>;
    comodidadesEdit:   string[];
    customComodidade:  string;
    setCustomComodidade: React.Dispatch<React.SetStateAction<string>>;
    urlInput:          string;
    setUrlInput:       React.Dispatch<React.SetStateAction<string>>;
    uploading:         boolean;
    fileInputRef:      React.RefObject<HTMLInputElement | null>;
    allComodidades:    Comodidade[];
    newComodidadeCat:  string;
    setNewComodidadeCat: React.Dispatch<React.SetStateAction<string>>;
    loadingGlobal:     boolean;
    allCats:           string[];
    isGlobalMatch:     (s: string) => boolean;
    onAddUrlFoto:      () => void;
    onRemoveFoto:      (idx: number) => void;
    onFileUpload:      (e: React.ChangeEvent<HTMLInputElement>) => void;
    onToggleComodidade: (item: string) => void;
    onAddCustomComodidade: () => void;
    onRegisterGlobally: (nome: string) => void;
    onSubmit:          (e: React.FormEvent) => void;
    onClose:           () => void;
}

export default function QuartoModal({
    editQuarto, setEditQuarto,
    fotosEdit, setFotosEdit,
    comodidadesEdit,
    customComodidade, setCustomComodidade,
    urlInput, setUrlInput,
    uploading, fileInputRef,
    allComodidades, newComodidadeCat, setNewComodidadeCat, loadingGlobal,
    allCats, isGlobalMatch,
    onAddUrlFoto, onRemoveFoto, onFileUpload,
    onToggleComodidade, onAddCustomComodidade, onRegisterGlobally,
    onSubmit, onClose,
}: QuartoModalProps) {
    return (
        <div className="fixed inset-0 z-[100] flex justify-end">
            <div className="absolute inset-0 bg-[#1E3932]/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white w-full max-w-[560px] h-full z-10 shadow-2xl flex flex-col">

                {/* Header */}
                <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between shrink-0">
                    <div>
                        <span className="text-[#C4A484] text-[9px] uppercase tracking-widest font-bold block mb-0.5">Inventário</span>
                        <h2 className="text-xl font-serif text-[#1E3932]">
                            {editQuarto.id ? 'Editar Alojamento' : 'Novo Alojamento'}
                        </h2>
                    </div>
                    <button type="button" onClick={onClose}
                        className="p-2 text-gray-600 hover:text-[#1E3932] hover:bg-gray-50 rounded-full transition-colors cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center">
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <form onSubmit={onSubmit} className="flex-1 overflow-y-auto p-6 space-y-6 pb-28">

                    {/* Basic Info */}
                    <fieldset className="space-y-5">
                        <ModalField label="Nome do Alojamento *">
                            <input required value={editQuarto.nome || ''}
                                onChange={e => setEditQuarto(p => ({ ...p, nome: e.target.value }))}
                                className="w-full border-b border-gray-200 focus:border-[#C4A484] pb-2 outline-none text-sm transition-colors text-[#1E3932] bg-transparent"
                                placeholder="Ex: Suite Deluxe" />
                        </ModalField>

                        <div className="grid grid-cols-2 gap-5">
                            <ModalField label="Tipo">
                                <select value={editQuarto.tipo || 'Quarto'}
                                    onChange={e => setEditQuarto(p => ({ ...p, tipo: e.target.value }))}
                                    className="w-full border-b border-gray-200 focus:border-[#C4A484] pb-2 outline-none text-sm bg-transparent text-[#1E3932] cursor-pointer">
                                    <option>Quarto</option><option>Suite</option><option>Casa</option><option>Cabana</option>
                                </select>
                            </ModalField>
                            <ModalField label="Capacidade (hóspedes)">
                                <input type="number" required min="1" value={editQuarto.capacidade || 2}
                                    onChange={e => setEditQuarto(p => ({ ...p, capacidade: parseInt(e.target.value) }))}
                                    className="w-full border-b border-gray-200 focus:border-[#C4A484] pb-2 outline-none text-sm bg-transparent text-[#1E3932]" />
                            </ModalField>
                            <ModalField label="Preço Base (€)">
                                <input type="number" required min="0" step="0.01" value={editQuarto.preco_base || 0}
                                    onChange={e => setEditQuarto(p => ({ ...p, preco_base: parseFloat(e.target.value) }))}
                                    className="w-full border-b border-gray-200 focus:border-[#C4A484] pb-2 outline-none text-sm bg-transparent text-[#1E3932]" />
                            </ModalField>
                            <ModalField label="Mínimo Estadia (noites)">
                                <input type="number" required min="1" value={editQuarto.minima_estadia_padrao || 2}
                                    onChange={e => setEditQuarto(p => ({ ...p, minima_estadia_padrao: parseInt(e.target.value) }))}
                                    className="w-full border-b border-gray-200 focus:border-[#C4A484] pb-2 outline-none text-sm bg-transparent text-[#1E3932]" />
                            </ModalField>
                        </div>

                        {/* Tarifas base diferenciadas */}
                        <div className="p-4 bg-[#1E3932]/5 border border-[#1E3932]/10 rounded-sm space-y-3">
                            <p className="text-[9px] uppercase tracking-widest text-[#1E3932] font-bold flex items-center gap-2">
                                <Euro size={11} className="text-[#C4A484]" />
                                Tarifas Base por Dia da Semana
                            </p>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-[9px] uppercase tracking-widest text-gray-600 font-bold block">Semana (€/noite) *</label>
                                    <input type="number" required min="0" step="0.01"
                                        value={editQuarto.tarifa_semana ?? editQuarto.preco_base ?? 0}
                                        onChange={e => setEditQuarto(p => ({ ...p, tarifa_semana: parseFloat(e.target.value) || 0 }))}
                                        className="w-full border-b border-gray-200 focus:border-[#C4A484] pb-2 outline-none text-sm bg-transparent text-[#1E3932]" />
                                    <span className="text-[9px] text-gray-400 block">Seg · Ter · Qua · Qui</span>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[9px] uppercase tracking-widest text-gray-600 font-bold block">Fim de Semana (€/noite) *</label>
                                    <input type="number" required min="0" step="0.01"
                                        value={editQuarto.tarifa_fds ?? editQuarto.preco_base ?? 0}
                                        onChange={e => setEditQuarto(p => ({ ...p, tarifa_fds: parseFloat(e.target.value) || 0 }))}
                                        className="w-full border-b border-gray-200 focus:border-[#C4A484] pb-2 outline-none text-sm bg-transparent text-[#1E3932]" />
                                    <span className="text-[9px] text-gray-400 block">Sex · Sáb · Dom</span>
                                </div>
                            </div>
                            <p className="text-[9px] text-gray-400 italic">Usadas como referência nos preços por época (% automática).</p>
                        </div>

                        {/* Ativo toggle */}
                        <div className="flex items-center justify-between py-3 border-b border-gray-100">
                            <span className="text-[10px] uppercase tracking-widest text-gray-600 font-bold">Visível no Site</span>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" checked={!!editQuarto.ativo}
                                    onChange={e => setEditQuarto(p => ({ ...p, ativo: e.target.checked }))}
                                    className="sr-only peer" />
                                <div className="w-10 h-5 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#C4A484]" />
                                <span className="ml-2 text-[10px] uppercase font-bold text-[#1E3932]">
                                    {editQuarto.ativo ? 'Sim' : 'Não'}
                                </span>
                            </label>
                        </div>

                        <ModalField label="URL iCal (Sincronização)">
                            <input value={editQuarto.ical_url || ''}
                                onChange={e => setEditQuarto(p => ({ ...p, ical_url: e.target.value }))}
                                className="w-full border-b border-gray-200 focus:border-[#C4A484] pb-2 outline-none text-sm text-[#1E3932] bg-transparent"
                                placeholder="https://..." />
                        </ModalField>

                        <ModalField label="Link Vídeo Promocional">
                            <input type="url" value={editQuarto.video_url || ''}
                                onChange={e => setEditQuarto(p => ({ ...p, video_url: e.target.value }))}
                                className="w-full border-b border-gray-200 focus:border-[#C4A484] pb-2 outline-none text-sm text-[#1E3932] bg-transparent"
                                placeholder="YouTube, Vimeo..." />
                        </ModalField>

                        <ModalField label="Descrição">
                            <textarea rows={3} value={editQuarto.descricao || ''}
                                onChange={e => setEditQuarto(p => ({ ...p, descricao: e.target.value }))}
                                className="w-full border border-gray-200 focus:border-[#C4A484] p-3 outline-none text-sm text-[#1E3932] bg-gray-50/50 rounded-lg resize-none transition-colors"
                                placeholder="Detalhes do alojamento..." />
                        </ModalField>
                    </fieldset>

                    {/* Fotos */}
                    <fieldset className="space-y-4 pt-5 border-t border-gray-100">
                        <legend className="text-[10px] uppercase tracking-widest text-gray-600 font-bold">
                            Fotos ({fotosEdit.length})
                        </legend>

                        {fotosEdit.length > 0 && (
                            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                                {fotosEdit.map((foto, idx) => (
                                    <div key={idx}
                                        className={`relative aspect-square group/foto rounded-lg overflow-hidden border-2 ${foto.isMain ? 'border-[#C4A484]' : 'border-gray-100'}`}>
                                        <img src={foto.url} className="w-full h-full object-cover" alt="" />
                                        {foto.isMain && (
                                            <div className="absolute top-1 left-1 bg-[#C4A484] text-white text-[8px] px-1.5 py-0.5 rounded font-bold uppercase">
                                                Capa
                                            </div>
                                        )}
                                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover/foto:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1.5 p-2">
                                            {!foto.isMain && (
                                                <button type="button"
                                                    onClick={() => setFotosEdit(prev => prev.map((f, i) => ({ ...f, isMain: i === idx })))}
                                                    className="w-full py-1 bg-[#C4A484] text-white rounded text-[8px] uppercase tracking-widest font-bold">
                                                    Capa
                                                </button>
                                            )}
                                            <select value={foto.category}
                                                onChange={e => setFotosEdit(prev => prev.map((f, i) => i === idx ? { ...f, category: e.target.value } : f))}
                                                className="w-full text-[9px] bg-white text-black p-1 rounded outline-none">
                                                {['Quarto', 'Cozinha', 'Sala', 'Casa de Banho', 'Exterior', 'Outros'].map(c =>
                                                    <option key={c} value={c}>{c}</option>
                                                )}
                                            </select>
                                            <button type="button" onClick={() => onRemoveFoto(idx)}
                                                className="p-1.5 bg-red-500 text-white rounded hover:bg-red-600 transition-colors">
                                                <Trash2 size={11} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="space-y-2">
                            <div className="flex gap-2">
                                <input type="url" value={urlInput}
                                    onChange={e => setUrlInput(e.target.value)}
                                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); onAddUrlFoto(); } }}
                                    placeholder="Colar link de imagem..."
                                    className="flex-1 border-b border-gray-200 focus:border-[#C4A484] pb-2 outline-none text-xs transition-colors text-[#1E3932] bg-transparent" />
                                <button type="button" onClick={onAddUrlFoto}
                                    className="text-[#1E3932] font-bold text-[9px] uppercase tracking-widest hover:text-[#C4A484] transition-colors cursor-pointer">
                                    Adicionar
                                </button>
                            </div>
                            <div onClick={() => fileInputRef.current?.click()}
                                className="border border-dashed border-gray-200 hover:border-[#C4A484] p-4 text-center cursor-pointer rounded-lg flex justify-center items-center gap-2 transition-colors">
                                <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={onFileUpload} />
                                {uploading
                                    ? <Loader2 size={14} className="text-[#C4A484] animate-spin" />
                                    : <Upload size={14} className="text-gray-500" />}
                                <span className="text-[9px] uppercase tracking-widest text-gray-600">
                                    {uploading ? 'A enviar...' : 'Upload do dispositivo'}
                                </span>
                            </div>
                        </div>
                    </fieldset>

                    {/* Comodidades */}
                    <fieldset className="space-y-4 pt-5 border-t border-gray-100">
                        <div className="flex items-center justify-between flex-wrap gap-2">
                            <legend className="text-[10px] uppercase tracking-widest text-gray-600 font-bold">Comodidades</legend>
                            <span className="text-[8px] text-[#C4A484] uppercase font-bold px-2 py-0.5 bg-[#C4A484]/10 rounded-full">
                                Base de Dados Supabase
                            </span>
                        </div>

                        <div className="p-4 bg-gray-50/50 border border-gray-100 rounded-lg space-y-3">
                            <p className="text-[9px] uppercase tracking-widest text-[#1E3932] font-bold">Adicionar ao Dicionário Global</p>
                            <div className="flex gap-2 flex-wrap">
                                <select value={newComodidadeCat} onChange={e => setNewComodidadeCat(e.target.value)}
                                    className="border-b border-gray-200 outline-none bg-transparent text-[10px] py-1.5 font-bold text-[#1E3932] min-w-[110px] cursor-pointer">
                                    {allCats.map(c => <option key={c} value={c}>{CAT_LABELS[c] || c}</option>)}
                                    <option value="NOVA">+ Nova Categoria...</option>
                                </select>
                                <input type="text" value={customComodidade}
                                    onChange={e => setCustomComodidade(e.target.value)}
                                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); onAddCustomComodidade(); } }}
                                    placeholder="Nome do item (ex: Lareira)"
                                    className="flex-1 border-b border-gray-200 focus:border-[#C4A484] pb-1.5 outline-none text-xs text-[#1E3932] bg-transparent min-w-[120px]" />
                                <button type="button" onClick={onAddCustomComodidade}
                                    className="bg-[#1E3932] text-white px-4 py-1.5 text-[9px] uppercase tracking-widest font-bold hover:bg-[#C4A484] transition-colors cursor-pointer rounded">
                                    Registar
                                </button>
                            </div>
                        </div>

                        <div className="max-h-72 overflow-y-auto space-y-4 pr-1">
                            {loadingGlobal ? (
                                <div className="flex justify-center py-6">
                                    <Loader2 size={16} className="text-[#C4A484] animate-spin" />
                                </div>
                            ) : (
                                <>
                                    {allCats.map(catName => {
                                        const items = allComodidades.filter(c => c.categoria === catName);
                                        if (items.length === 0 && !['Camas & Quartos', 'Sala de estar', 'Espaço & Área', 'Comodidades', 'Casa de Banho', 'Serviços', 'Políticas'].includes(catName)) return null;
                                        return (
                                            <div key={catName} className="border-l-2 border-gray-100 pl-3">
                                                <p className="text-[9px] uppercase tracking-widest text-[#1E3932] font-bold mb-2 flex items-center justify-between">
                                                    <span>{CAT_LABELS[catName] || catName}</span>
                                                    <span className="text-[8px] font-normal text-gray-600">{items.length} itens</span>
                                                </p>
                                                <div className="flex flex-wrap gap-1.5">
                                                    {items.map(c => {
                                                        const sel = comodidadesEdit.some(item => normalize(item) === normalize(c.nome));
                                                        return (
                                                            <button key={c.id} type="button" onClick={() => onToggleComodidade(c.nome)}
                                                                className={`text-[9px] px-2.5 py-1.5 rounded border transition-all min-h-[32px] cursor-pointer
                                                                    ${sel
                                                                        ? 'bg-[#C4A484] text-white border-[#C4A484]'
                                                                        : 'bg-white text-gray-500 border-gray-200 hover:border-[#C4A484] hover:text-[#C4A484]'}`}>
                                                                {c.nome}
                                                            </button>
                                                        );
                                                    })}
                                                    {items.length === 0 && (
                                                        <p className="text-[8px] italic text-gray-500">Vazio — adicione itens acima.</p>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}

                                    {comodidadesEdit.filter(item => !isGlobalMatch(item)).length > 0 && (
                                        <div className="p-4 bg-red-50/50 border border-red-100 rounded-lg">
                                            <p className="text-[9px] uppercase tracking-widest text-red-600 font-bold mb-2">
                                                Itens fora do Dicionário Global
                                            </p>
                                            <div className="flex flex-wrap gap-2">
                                                {comodidadesEdit.filter(item => !isGlobalMatch(item)).map(item => (
                                                    <div key={item} className="flex items-center gap-1 bg-white border border-red-200 rounded px-2 py-1">
                                                        <span className="text-[9px] text-red-500">{item}</span>
                                                        <button type="button" onClick={() => onRegisterGlobally(item)} title="Registar Globalmente"
                                                            className="p-1 text-blue-500 hover:bg-blue-50 rounded transition-colors cursor-pointer">
                                                            <Upload size={10} />
                                                        </button>
                                                        <button type="button" onClick={() => onToggleComodidade(item)} title="Remover"
                                                            className="p-1 text-red-300 hover:text-red-500 rounded transition-colors cursor-pointer">
                                                            <Trash2 size={10} />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                            <p className="text-[8px] text-red-400 mt-2 italic leading-relaxed">
                                                Estes itens estão selecionados mas não estão no dicionário global. Use o ícone azul para os registar.
                                            </p>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </fieldset>
                </form>

                {/* Footer */}
                <div className="absolute bottom-0 left-0 right-0 p-5 bg-white border-t border-gray-100 flex justify-end gap-3">
                    <BtnSecondary onClick={onClose}>Cancelar</BtnSecondary>
                    <BtnPrimary type="submit" onClick={onSubmit}>
                        <CircleCheck size={14} /> Guardar
                    </BtnPrimary>
                </div>
            </div>
        </div>
    );
}
