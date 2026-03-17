import React from 'react';
import { Check } from 'lucide-react';

interface Step5SuccessProps {
    setShowBookingScreen: (v: boolean) => void;
    setBookingStep: (step: string) => void;
    setSelectedExtras: (ids: string[]) => void;
    setBookingForm: (v: any) => void;
}

export default function Step5Success({
    setShowBookingScreen,
    setBookingStep,
    setSelectedExtras,
    setBookingForm
}: Step5SuccessProps) {
    const handleClose = () => {
        setShowBookingScreen(false);
        setBookingStep('selection');
        setSelectedExtras([]);
        setBookingForm((prev: any) => ({ ...prev, aceitouTermos: false }));
    };

    return (
        <div className="animate-fade-in font-sans flex flex-col items-center justify-center text-center p-8 bg-white/5 border border-carapita-gold/30 mt-8 rounded-sm shadow-[0_20px_40px_rgba(212,175,55,0.05)]">
            <div className="w-20 h-20 rounded-full bg-carapita-gold/20 flex items-center justify-center mb-6">
                <Check size={40} className="text-carapita-gold" />
            </div>
            <h2 className="font-serif text-2xl md:text-3xl text-white mb-6 leading-tight">
                Obrigado pela sua Reserva
            </h2>
            <div className="space-y-4 text-[13px] text-white/70 max-w-xl mx-auto font-light leading-relaxed">
                <p>
                    Tem <strong>48 Horas</strong> para pagar 50% de sua Reserva. Para saber mais acesse termos e condições em seu portal Carapita.
                </p>
                <p>
                    Dentro do seu portal, tem tudo o que precisa: os dados do alojamento, Anfitrião, termos e condições, área de pagamentos e roteiros da região.
                </p>
            </div>

            <div className="mt-12 w-full max-w-sm flex flex-col gap-4">
                <a
                    href="/perfil"
                    className="w-full bg-carapita-gold hover:bg-white text-white hover:text-carapita-green uppercase text-[11px] tracking-mega font-bold py-5 transition-all duration-500 block shadow-xl"
                    onClick={handleClose}
                >
                    Entrar no Portal Carapita
                </a>
                <button
                    onClick={handleClose}
                    className="w-full bg-transparent border border-white/20 hover:border-carapita-gold text-white/60 hover:text-carapita-gold uppercase text-[10px] tracking-widest font-bold py-4 transition-all"
                >
                    Voltar à Página Inicial
                </button>
            </div>
        </div>
    );
}
