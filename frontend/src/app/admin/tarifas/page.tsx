"use client";
import React from 'react';
import { TrendingUp, Lock, CheckCircle2, AlertCircle } from 'lucide-react';
import AdminSidebar from '@/components/AdminSidebar';
import { useTarifas } from '@/hooks/useTarifas';
import TarifaForm   from '@/components/admin/tarifas/TarifaForm';
import TarifaList   from '@/components/admin/tarifas/TarifaList';
import BloqueioForm from '@/components/admin/tarifas/BloqueioForm';
import BloqueioList from '@/components/admin/tarifas/BloqueioList';

export default function AdminTarifasBloqueios() {
    const {
        tab, setTab,
        quartos, tarifas, bloqueios, loading, toast,
        novaTarifa, setNovaTarifa, editandoTarifaId, savingTarifa,
        novoBloqueio, setNovoBloqueio, savingBloqueio,
        handlePrecoChange, handlePercentagemChange,
        handlePrecoFdsChange, handlePercentagemFdsChange,
        handleSalvarTarifa, handleEditarTarifa, handleDeletarTarifa, resetTarifaForm,
        handleSalvarBloqueio, handleDeletarBloqueio,
    } = useTarifas();

    if (loading) return (
        <div className="min-h-screen bg-[#F9F8F6] flex items-center justify-center">
            <div className="text-center">
                <div className="w-8 h-8 border-2 border-[#C4A484] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="text-[10px] uppercase tracking-widest text-gray-400">A carregar...</p>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#F9F8F6]">
            <AdminSidebar />

            {toast && (
                <div className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-4 shadow-lg text-sm max-w-sm
                    ${toast.tipo === 'ok' ? 'bg-[#1E3932] text-white' : 'bg-red-600 text-white'}`}>
                    {toast.tipo === 'ok'
                        ? <CheckCircle2 size={15} className="text-[#C4A484] shrink-0" />
                        : <AlertCircle size={15} className="shrink-0" />}
                    <span className="text-[12px]">{toast.msg}</span>
                </div>
            )}

            <div className="ml-0 md:ml-20 p-4 md:p-8 xl:p-12 max-w-[1400px] mx-auto pb-24 md:pb-4">

                <div className="mb-10">
                    <span className="text-[#C4A484] text-[10px] uppercase tracking-widest font-bold block mb-1">
                        Estratégia &amp; Disponibilidade
                    </span>
                    <h1 className="text-4xl font-serif text-[#1E3932]">Tarifas e Bloqueios</h1>
                    <p className="text-xs text-gray-400 mt-1.5 font-light">
                        Defina preços sazonais e bloqueie datas na agenda de cada alojamento.
                    </p>
                </div>

                {/* Tabs */}
                <div className="flex gap-0 mb-10 border border-gray-200 w-fit">
                    {(['tarifas', 'bloqueios'] as const).map((t, i) => (
                        <button key={t} onClick={() => setTab(t)}
                            className={`flex items-center gap-2 px-8 py-3.5 text-[10px] uppercase tracking-widest font-bold transition-all duration-200 cursor-pointer
                                ${i > 0 ? 'border-l border-gray-200' : ''}
                                ${tab === t ? 'bg-[#1E3932] text-[#C4A484]' : 'bg-white text-gray-400 hover:text-[#1E3932]'}`}>
                            {t === 'tarifas' ? <TrendingUp size={13} /> : <Lock size={13} />}
                            {t === 'tarifas' ? 'Tarifas Sazonais' : 'Bloqueios'}
                            <span className={`ml-1 text-[9px] px-1.5 py-0.5 rounded-sm font-mono
                                ${tab === t ? 'bg-[#C4A484]/20 text-[#C4A484]' : 'bg-gray-100 text-gray-400'}`}>
                                {t === 'tarifas' ? tarifas.length : bloqueios.length}
                            </span>
                        </button>
                    ))}
                </div>

                {tab === 'tarifas' && (
                    <div className="grid grid-cols-1 xl:grid-cols-[460px_1fr] gap-8 items-start">
                        <TarifaForm
                            quartos={quartos}
                            novaTarifa={novaTarifa}
                            setNovaTarifa={setNovaTarifa}
                            editandoTarifaId={editandoTarifaId}
                            savingTarifa={savingTarifa}
                            onSubmit={handleSalvarTarifa}
                            onPrecoChange={handlePrecoChange}
                            onPercentagemChange={handlePercentagemChange}
                            onPrecoFdsChange={handlePrecoFdsChange}
                            onPercentagemFdsChange={handlePercentagemFdsChange}
                            onReset={resetTarifaForm}
                        />
                        <TarifaList
                            tarifas={tarifas}
                            quartos={quartos}
                            onEditar={handleEditarTarifa}
                            onDeletar={handleDeletarTarifa}
                        />
                    </div>
                )}

                {tab === 'bloqueios' && (
                    <div className="grid grid-cols-1 xl:grid-cols-[440px_1fr] gap-8 items-start">
                        <BloqueioForm
                            quartos={quartos}
                            novoBloqueio={novoBloqueio}
                            setNovoBloqueio={setNovoBloqueio}
                            savingBloqueio={savingBloqueio}
                            onSubmit={handleSalvarBloqueio}
                        />
                        <BloqueioList
                            bloqueios={bloqueios}
                            onDeletar={handleDeletarBloqueio}
                        />
                    </div>
                )}

            </div>
        </div>
    );
}
