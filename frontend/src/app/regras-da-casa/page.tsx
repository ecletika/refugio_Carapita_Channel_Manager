"use client";
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function RegrasDaCasa() {
    const router = useRouter();
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 50);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <main className="min-h-screen bg-carapita-green flex flex-col font-sans selection:bg-carapita-gold selection:text-white">
            {/* Nav Header Simples */}
            <header className={`fixed top-0 w-full z-50 px-4 md:px-12 py-4 md:py-6 flex items-center justify-between transition-all duration-700 ${scrolled ? 'bg-carapita-green shadow-lg border-b border-white/5' : 'bg-carapita-green border-b border-white/10'}`}>
                <div className="flex-1 flex gap-4 md:hidden"></div>

                <div className="flex-shrink-0 text-center mx-2 md:mx-4 cursor-pointer" onClick={() => router.push('/')}>
                    <div className={`relative w-16 h-16 md:w-20 md:h-20 rounded-full overflow-hidden border-2 transition-all duration-700 p-0.5 shadow-2xl ${scrolled ? 'border-carapita-gold bg-carapita-green' : 'border-white/40 bg-white/10 backdrop-blur-sm'}`}>
                        <img src="/logo.jpg" alt="Refúgio Carapita" className="w-full h-full object-cover" />
                    </div>
                </div>

                <div className="flex-1 flex justify-end">
                    <button onClick={() => router.push('/')} className="text-[10px] uppercase tracking-mega font-medium text-white hover:text-carapita-gold transition-colors">Voltar ←</button>
                </div>
            </header>

            {/* Conteúdo das Regras */}
            <section className="flex-1 max-w-4xl mx-auto w-full px-6 pt-40 pb-20 text-white">
                <div className="mb-12">
                    <span className="text-carapita-gold text-[10px] uppercase tracking-mega font-bold block mb-4">Informação da Estadia</span>
                    <h1 className="text-4xl md:text-5xl font-serif text-white mb-6">Regras da casa</h1>
                    <p className="text-white/60 text-sm font-sans uppercase tracking-widest leading-relaxed border-l-2 border-carapita-gold pl-4 opacity-80">Irá ficar em casa de alguém, por isso trate-a com cuidado e respeito.</p>
                </div>

                <div className="bg-white/5 border border-white/10 p-8 md:p-12 text-sm leading-relaxed text-white/80 space-y-8 font-light shadow-xl">

                    <h2 className="text-carapita-gold font-serif text-2xl mb-4">Fazer o check-in e o check-out</h2>
                    <ul className="list-disc pl-6 space-y-2 mb-8">
                        <li>Check-in após as 15:00</li>
                        <li>Check-out até às 11:00</li>
                        <li>Check-in autónomo com cofre</li>
                    </ul>

                    <h2 className="text-carapita-gold font-serif text-2xl mb-4 mt-8">Durante a sua estadia</h2>
                    <ul className="list-disc pl-6 space-y-2 mb-8">
                        <li>Máximo de 4 pessoas</li>
                        <li>Não são permitidos animais de estimação</li>
                        <li>Crianças apenas acima de 5 anos</li>
                        <li>Horário de silêncio: 22:00 - 08:00</li>
                    </ul>

                    <div className="border-t border-white/10 pt-8 mt-8">
                        <h2 className="text-carapita-gold font-serif text-2xl mb-6">🏡 Regras Adicionais – Refúgio Carapita</h2>
                        <p className="italic mb-6">Queremos que a sua estadia seja tranquila, confortável e respeitosa para todos. Por favor, leia com atenção:</p>

                        <div className="space-y-6">
                            <div className="bg-white/5 p-6 rounded border-l-4 border-carapita-gold/50">
                                <h3 className="font-bold uppercase tracking-widest text-xs text-white mb-2">🔹 Uso do espaço</h3>
                                <p className="mb-2">Utilize o alojamento com cuidado e respeito, como se fosse a sua própria casa.</p>
                                <p className="mb-2">Mantenha portas e janelas fechadas ao sair.</p>
                                <p>Não são permitidas visitas externas sem autorização prévia.</p>
                            </div>

                            <div className="bg-white/5 p-6 rounded border-l-4 border-carapita-gold/50">
                                <h3 className="font-bold uppercase tracking-widest text-xs text-white mb-2">🔹 Limpeza e organização</h3>
                                <p className="mb-2">Lave e arrume a loiça utilizada antes do check-out.</p>
                                <p className="mb-2">Coloque o lixo nos contentores exteriores apropriados.</p>
                                <p>Evite deixar comida fora do frigorífico para não atrair insetos.</p>
                            </div>

                            <div className="bg-white/5 p-6 rounded border-l-4 border-carapita-gold/50">
                                <h3 className="font-bold uppercase tracking-widest text-xs text-white mb-2">🔹 Ruído e convivência</h3>
                                <p className="mb-2">Respeite o horário de silêncio definido: 22h00–08h00.</p>
                                <p>Evite ruídos excessivos dentro e fora da propriedade.</p>
                            </div>

                            <div className="bg-white/5 p-6 rounded border-l-4 border-carapita-gold/50">
                                <h3 className="font-bold uppercase tracking-widest text-xs text-white mb-2">🔹 Segurança</h3>
                                <p className="mb-2">Certifique-se de que apaga luzes e equipamentos elétricos ao sair.</p>
                                <p className="mb-2">É proibido utilizar velas ou qualquer chama aberta dentro do alojamento.</p>
                                <p>Informe imediatamente caso algo se danifique.</p>
                            </div>

                            <div className="bg-white/5 p-6 rounded border-l-4 border-carapita-gold/50">
                                <h3 className="font-bold uppercase tracking-widest text-xs text-white mb-2">🔹 Animais de estimação e Crianças</h3>
                                <p className="mb-2">Animais não são permitidos, exceto cães guia para pessoas cegas.</p>
                                <p>Crianças apenas acima de 5 anos.</p>
                            </div>

                            <div className="bg-white/5 p-6 rounded border-l-4 border-carapita-gold/50">
                                <h3 className="font-bold uppercase tracking-widest text-xs text-white mb-2">🔹 Check-in e check-out</h3>
                                <p className="mb-2">Check-in: a partir das 15h00</p>
                                <p className="mb-2">Check-out: até às 11h00</p>
                                <p>Se precisar de flexibilidade, peça com antecedência — tentaremos ajudar.</p>
                            </div>

                            <div className="bg-white/5 p-6 rounded border-l-4 border-carapita-gold/50">
                                <h3 className="font-bold uppercase tracking-widest text-xs text-white mb-2">🔹 Outras notas importantes</h3>
                                <p className="mb-2">Proibido fumar dentro do alojamento (permitido apenas no exterior).</p>
                                <p className="mb-2">Não é permitido mover móveis sem autorização.</p>
                                <p className="italic text-red-300 mt-4">Qualquer violação grave das regras pode resultar em cancelamento da estadia.</p>
                            </div>
                        </div>
                    </div>

                </div>
            </section>

            {/* Footer */}
            <footer className="bg-carapita-dark text-white/50 py-12 border-t border-white/10 text-center">
                <p className="text-[10px] uppercase tracking-widest mb-4">© {new Date().getFullYear()} Refúgio Carapita</p>
            </footer>
        </main>
    );
}
