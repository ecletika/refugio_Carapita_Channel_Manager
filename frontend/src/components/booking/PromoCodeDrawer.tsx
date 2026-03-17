import React from 'react';
import { X, Check } from 'lucide-react';

interface PromoCodeDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    setCupomAplicado: (val: any) => void;
    lang: string;
}

export default function PromoCodeDrawer({
    isOpen,
    onClose,
    setCupomAplicado,
    lang
}: PromoCodeDrawerProps) {
    const [promoCodeInput, setPromoCodeInput] = React.useState("");
    const [promoStatus, setPromoStatus] = React.useState<"normal" | "loading" | "success" | "error">("normal");

    if (!isOpen) return null;

    const handleConfirm = () => {
        if (!promoCodeInput) return;
        setPromoStatus("loading");
        
        setTimeout(() => {
            if (promoCodeInput.length > 2) { 
                setPromoStatus("success"); 
                setCupomAplicado({codigo: promoCodeInput, tipo_desconto: 'PERCENTUAL', valor_desconto: 10});
                setTimeout(() => onClose(), 800) 
            } else { 
                setPromoStatus("error"); 
                setTimeout(() => setPromoStatus("normal"), 2000); 
            }
        }, 600);
    };

    return (
        <>
            <div 
                className="fixed inset-0 z-[250] bg-black/50 backdrop-blur-sm animate-fade-overlay" 
                onClick={() => onClose()} 
            />
            <div className="fixed inset-y-0 right-0 z-[260] w-full md:w-[380px] bg-[#1E3529] shadow-[-10px_0_30px_rgba(0,0,0,0.5)] transform translate-x-0 animate-slide-left flex flex-col p-8 border-l border-[#C9A84C]/20">
                <div className="flex justify-between items-center mb-10">
                    <h2 className="font-serif text-[28px] text-[#C9A84C] uppercase tracking-[0.05em] m-0 leading-none">Código Promocional</h2>
                    <button onClick={() => onClose()} className="text-[#C9A84C] hover:text-white transition-colors bg-transparent p-2 rounded-full border border-transparent">
                        <X size={24} strokeWidth={1.5} />
                    </button>
                </div>

                <div className="flex flex-col flex-1">
                    <input 
                        type="text" 
                        placeholder="Insira o seu código" 
                        value={promoCodeInput}
                        onChange={(e) => setPromoCodeInput(e.target.value.toUpperCase())}
                        className="w-full border border-[#C9A84C] bg-transparent text-white rounded-[12px] p-[14px] px-[20px] font-sans text-[14px] focus:outline-none focus:ring-[#C9A84C] uppercase tracking-widest placeholder:text-white/40 mb-auto mt-4"
                    />

                    <button 
                        disabled={promoStatus === 'loading'}
                        onClick={handleConfirm} 
                        className={`w-full p-[18px] font-sans text-[13px] font-bold tracking-[0.2em] uppercase border-none rounded-[14px] cursor-pointer transition-all mt-auto
                            ${promoStatus === 'success' ? 'bg-[#3D5C4F] text-white shadow-none' : promoStatus === 'error' ? 'border border-red-500 bg-transparent text-white' : 'bg-[#C9A84C] text-[#1A2E26] hover:bg-[#E8C96A]'}
                        `}
                    >
                        {promoStatus === 'loading' ? (
                            <div className="w-5 h-5 border-2 border-[#1A2E26] border-t-transparent rounded-full animate-spin mx-auto"></div>
                        ) : promoStatus === 'success' ? (
                            <span className="flex items-center justify-center gap-2"><Check size={16} /> Código Aplicado!</span>
                        ) : promoStatus === 'error' ? (
                            'Código Inválido'
                        ) : (
                            'Confirmar'
                        )}
                    </button>
                </div>
            </div>
        </>
    );
}
