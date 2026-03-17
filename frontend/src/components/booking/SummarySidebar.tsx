import React from 'react';

interface SummarySidebarProps {
    t: (key: string) => string;
    cupomAplicado: any;
    totalEstadia: () => number;
    valorDesconto: () => number;
    checkIn: string | null;
    checkOut: string | null;
    hospedes: number;
    selectedExtras: string[];
    disponiveisExtras: any[];
}

export default function SummarySidebar({
    t,
    cupomAplicado,
    totalEstadia,
    valorDesconto,
    checkIn,
    checkOut,
    hospedes,
    selectedExtras,
    disponiveisExtras
}: SummarySidebarProps) {
    return (
        <div className="w-full xl:w-80 xl:flex-shrink-0 mt-8 xl:mt-0">
            <div className="sticky top-24 space-y-6">
                <div className="bg-carapita-dark text-white p-6 rounded-2xl border border-white/5">
                    <h3 className="font-serif text-lg border-b border-white/10 pb-3 mb-4 uppercase tracking-widest italic">{t('summary_title')}</h3>
                    <div className="mb-10 pb-6 border-b border-white/10">
                        <div className="flex justify-between items-baseline mb-2">
                            <span className="text-[10px] tracking-widest uppercase text-white/40">{t('summary_total')}</span>
                            <div className="text-right">
                                {cupomAplicado && (
                                    <span className="block text-[10px] text-white/40 line-through mb-0.5 tracking-widest uppercase">
                                        {(totalEstadia() + valorDesconto()).toFixed(2).replace('.', ',')}
                                    </span>
                                )}
                                <span className="text-3xl font-serif text-carapita-gold">€{totalEstadia().toFixed(2).replace('.', ',')}</span>
                            </div>
                        </div>
                        {cupomAplicado && (
                            <div className="flex justify-between items-center mb-2 text-green-400 text-[10px] uppercase tracking-widest font-bold">
                                <span>Desconto Aplicado ({cupomAplicado.codigo}):</span>
                                <span>- €{valorDesconto().toFixed(2).replace('.', ',')}</span>
                            </div>
                        )}
                        <p className="text-[9px] text-white/30 italic uppercase mt-2">{t('summary_taxas')}</p>
                    </div>

                    <div className="space-y-4 font-sans text-[11px] uppercase tracking-widest text-white/60">
                        <div className="flex justify-between"><span>{t('summary_checkin')}:</span> <span className="text-white">{checkIn || '-'}</span></div>
                        <div className="flex justify-between"><span>{t('summary_checkout')}:</span> <span className="text-white">{checkOut || '-'}</span></div>
                        <div className="flex justify-between"><span>{t('summary_hospedes')}:</span> <span className="text-white">{hospedes} Pax</span></div>
                    </div>
                </div>

                {selectedExtras.length > 0 && (
                    <div className="border border-carapita-gold/20 p-8 bg-white/5">
                        <h4 className="text-[10px] uppercase tracking-mega font-bold text-white mb-4">{t('booking_extras_selecionados')}</h4>
                        <ul className="space-y-3 text-[10px] text-white/60 font-medium uppercase tracking-widest">
                            {selectedExtras.map(id => {
                                const e = disponiveisExtras.find(ext => ext.id === id);
                                return (
                                    <li key={id} className="flex justify-between border-b border-carapita-gold/10 pb-2">
                                        <span>{e?.nome}</span>
                                        <span>€{Number(e?.preco).toFixed(2)}</span>
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                )}
            </div>
        </div>
    );
}
