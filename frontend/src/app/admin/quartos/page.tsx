"use client";
import React from 'react';
import { Plus, Home } from 'lucide-react';
import AdminSidebar from '@/components/AdminSidebar';
import { useQuartos } from '@/hooks/useQuartos';
import QuartoCard  from '@/components/admin/quartos/QuartoCard';
import QuartoModal from '@/components/admin/quartos/QuartoModal';
import Lightbox    from '@/components/admin/quartos/Lightbox';
import { BtnPrimary } from '@/components/admin/quartos/atoms';
import { AdminExtrasContent } from './ExtrasContent';

export default function AdminQuartos() {
    const {
        quartos, loading,
        editQuarto, setEditQuarto, fotosEdit, setFotosEdit,
        comodidadesEdit, customComodidade, setCustomComodidade,
        urlInput, setUrlInput,
        uploading, fileInputRef,
        lightbox, setLightbox,
        savingId,
        allComodidades, newComodidadeCat, setNewComodidadeCat, loadingGlobal,
        allCats, isGlobalMatch,
        openEdit, addUrlFoto, removeFoto, handleFileUpload,
        toggleComodidade, addCustomComodidade, registerGlobally,
        handleToggleAtivo, handleSave, handleDelete, handleSync,
    } = useQuartos();

    if (loading) return (
        <div className="min-h-screen bg-[#F9F8F6] flex items-center justify-center">
            <div className="text-center">
                <div className="w-8 h-8 border-2 border-[#C4A484] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="text-[10px] uppercase tracking-widest text-gray-600">A carregar o inventário...</p>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#F9F8F6]">
            <AdminSidebar />

            <div className="ml-0 md:ml-20 p-4 md:p-8 lg:p-12 max-w-6xl mx-auto pb-24 md:pb-8">

                <div className="mb-8 md:mb-12">
                    <span className="text-[#C4A484] text-[10px] uppercase tracking-widest font-bold block mb-1">Inventário Global</span>
                    <h1 className="text-3xl md:text-4xl font-serif text-[#1E3932]">Alojamento &amp; Extras</h1>
                    <p className="text-sm text-gray-600 mt-2 font-light">Gerencie os alojamentos e os serviços adicionais disponíveis.</p>
                </div>

                {/* Alojamentos */}
                <section className="mb-16">
                    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
                        <div>
                            <span className="text-[#C4A484] text-[10px] uppercase tracking-widest font-bold block mb-0.5">Configurações</span>
                            <h2 className="text-2xl md:text-3xl font-serif text-[#1E3932] font-light">Gestão de Alojamento</h2>
                        </div>
                        <BtnPrimary onClick={() => openEdit()}>
                            <Plus size={14} /> Novo Alojamento
                        </BtnPrimary>
                    </div>

                    <div className="flex flex-col gap-3">
                        {quartos.map(q => (
                            <QuartoCard key={q.id} quarto={q} savingId={savingId}
                                onToggleAtivo={handleToggleAtivo}
                                onSync={handleSync}
                                onEdit={openEdit}
                                onDelete={handleDelete}
                                onOpenLightbox={fotos => setLightbox({ fotos: fotos.map(f => f.url), index: 0 })}
                            />
                        ))}

                        {quartos.length === 0 && (
                            <div className="flex flex-col items-center justify-center py-16 bg-white border border-dashed border-gray-200 rounded-lg gap-3">
                                <Home size={32} className="text-gray-200" />
                                <p className="text-sm text-gray-600">Nenhum alojamento registado.</p>
                                <BtnPrimary onClick={() => openEdit()}>
                                    <Plus size={12} /> Adicionar Alojamento
                                </BtnPrimary>
                            </div>
                        )}
                    </div>
                </section>

                {/* Extras */}
                <section>
                    <AdminExtrasContent />
                </section>
            </div>

            {editQuarto && (
                <QuartoModal
                    editQuarto={editQuarto}
                    setEditQuarto={setEditQuarto}
                    fotosEdit={fotosEdit}
                    setFotosEdit={setFotosEdit}
                    comodidadesEdit={comodidadesEdit}
                    customComodidade={customComodidade}
                    setCustomComodidade={setCustomComodidade}
                    urlInput={urlInput}
                    setUrlInput={setUrlInput}
                    uploading={uploading}
                    fileInputRef={fileInputRef}
                    allComodidades={allComodidades}
                    newComodidadeCat={newComodidadeCat}
                    setNewComodidadeCat={setNewComodidadeCat}
                    loadingGlobal={loadingGlobal}
                    allCats={allCats}
                    isGlobalMatch={isGlobalMatch}
                    onAddUrlFoto={addUrlFoto}
                    onRemoveFoto={removeFoto}
                    onFileUpload={handleFileUpload}
                    onToggleComodidade={toggleComodidade}
                    onAddCustomComodidade={addCustomComodidade}
                    onRegisterGlobally={registerGlobally}
                    onSubmit={handleSave}
                    onClose={() => setEditQuarto(null)}
                />
            )}

            {lightbox && (
                <Lightbox
                    fotos={lightbox.fotos}
                    index={lightbox.index}
                    onChange={idx => setLightbox(prev => prev ? { ...prev, index: idx } : null)}
                    onClose={() => setLightbox(null)}
                />
            )}
        </div>
    );
}
