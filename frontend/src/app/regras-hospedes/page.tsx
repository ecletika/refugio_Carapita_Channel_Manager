"use client";
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function RegrasHospedes() {
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
                    <span className="text-carapita-gold text-[10px] uppercase tracking-mega font-bold block mb-4">Informação Legal</span>
                    <h1 className="text-4xl md:text-5xl font-serif text-white mb-6">Regras Básicas para Hóspedes</h1>
                    <p className="text-white/60 text-sm font-sans uppercase tracking-widest leading-relaxed border-l-2 border-carapita-gold pl-4 opacity-80">Orientações para uma estadia harmoniosa no Refúgio Carapita.</p>
                </div>

                <div className="bg-white/5 border border-white/10 p-8 md:p-12 text-sm leading-relaxed text-white/80 space-y-8 font-light shadow-xl">

                    <p className="italic font-bold">Para serem bons hóspedes, exigimos que todos os membros da nossa comunidade respeitem estas regras simples quando ficam num alojamento:</p>

                    <ul className="list-disc pl-6 space-y-2 mb-8">
                        <li>Cuide da casa dos anfitriões como se fosse a sua</li>
                        <li>Respeite as regras da casa padrão dos anfitriões</li>
                    </ul>

                    <div className="border-t border-white/10 pt-8 mt-8">
                        <h2 className="text-carapita-gold font-serif text-2xl mb-6">Detalhes das Regras Básicas</h2>

                        <h3 className="text-xl font-serif text-white mb-4">Cuide da casa dos anfitriões como se fosse a sua</h3>

                        <div className="space-y-6">
                            <div className="bg-white/5 p-6 rounded border-l-4 border-carapita-gold/50">
                                <h3 className="font-bold uppercase tracking-widest text-xs text-white mb-2">Limpeza</h3>
                                <p className="text-white/70">Os hóspedes não devem deixar o espaço num estado que necessite de uma limpeza profunda (por exemplo, loiça com bolor, tapetes sujos, manchas de animais de estimação, etc.). As taxas de limpeza estabelecidas pelos anfitriões só cobrem o custo de uma limpeza normal entre reservas (lavandaria, aspiração, etc.).</p>
                            </div>

                            <div className="bg-white/5 p-6 rounded border-l-4 border-carapita-gold/50">
                                <h3 className="font-bold uppercase tracking-widest text-xs text-white mb-2">Lixo</h3>
                                <p className="text-white/70">Os hóspedes devem despejar o lixo nos contentores designados e ter cuidado com grandes quantidades de lixo.</p>
                            </div>

                            <div className="bg-white/5 p-6 rounded border-l-4 border-carapita-gold/50">
                                <h3 className="font-bold uppercase tracking-widest text-xs text-white mb-2">Danos</h3>
                                <p className="text-white/70">Sempre que os hóspedes causem danos que vão além do desgaste normal, esperamos que informem os anfitriões dos mesmos o mais rapidamente possível, e que colaborem para encontrar uma solução razoável. Espera-se que os hóspedes paguem pedidos razoáveis de reembolso se forem responsáveis por danos, artigos em falta ou custos de limpeza inesperados.</p>
                            </div>
                        </div>

                        <h3 className="text-xl font-serif text-white mt-12 mb-4">Respeite as regras da casa padrão dos anfitriões</h3>

                        <div className="space-y-6">
                            <div className="bg-white/5 p-6 rounded border-l-4 border-carapita-gold/50">
                                <h3 className="font-bold uppercase tracking-widest text-xs text-white mb-2">Hóspedes Aprovados</h3>
                                <p className="text-white/70">O número máximo de 4 hóspedes deve ser respeitado. Aceitamos apenas crianças acima de 5 anos de idade. Em caso de dúvida, os hóspedes devem perguntar aos anfitriões quais são as regras para visitas. Proibem-se sempre os ajuntamentos suscetíveis de causar incómodos.</p>
                            </div>

                            <div className="bg-white/5 p-6 rounded border-l-4 border-carapita-gold/50">
                                <h3 className="font-bold uppercase tracking-widest text-xs text-white mb-2">Horário de Check-in</h3>
                                <p className="text-white/70">Os hóspedes devem respeitar o período de check-in dos anfitriões e não devem fazer o check-in nem antes nem depois sem aprovação prévia.</p>
                            </div>

                            <div className="bg-white/5 p-6 rounded border-l-4 border-carapita-gold/50">
                                <h3 className="font-bold uppercase tracking-widest text-xs text-white mb-2">Horário de Check-out</h3>
                                <p className="text-white/70">Os hóspedes devem concluir o check-out, incluindo a devolução das chaves, até à hora do check-out indicada na reserva. Os pertences não devem ser deixados no espaço após a hora indicada (seja para os guardar como para os recolher mais tarde) sem a aprovação prévia dos anfitriões.</p>
                            </div>

                            <div className="bg-white/5 p-6 rounded border-l-4 border-carapita-gold/50">
                                <h3 className="font-bold uppercase tracking-widest text-xs text-white mb-2">Fumar</h3>
                                <p className="text-white/70">Os hóspedes devem respeitar as regras de "não fumar" e, em caso de dúvida, perguntar aos anfitriões quais são as limitações. Isto inclui o uso de tabaco, canábis, cigarros eletrónicos, etc. Os hóspedes são responsáveis pelo cumprimento da legislação aplicável.</p>
                            </div>

                            <div className="bg-white/5 p-6 rounded border-l-4 border-carapita-gold/50">
                                <h3 className="font-bold uppercase tracking-widest text-xs text-white mb-2">Animais de Estimação</h3>
                                <p className="text-white/70">Os hóspedes não devem levar animais de estimação para um espaço cujas regras da casa não os permitam, não devem levar mais animais de estimação do que os que são permitidos e devem informar os anfitriões sobre os que levarem para o espaço. Os animais de assistência não são considerados animais de estimação.</p>
                            </div>

                            <div className="bg-white/5 p-6 rounded border-l-4 border-carapita-gold/50">
                                <h3 className="font-bold uppercase tracking-widest text-xs text-white mb-2">Barulho</h3>
                                <p className="text-white/70">Os hóspedes devem respeitar as horas de silêncio estabelecidas e não devem incomodar a comunidade de vizinhos com um nível de barulho perturbador (música alta, gritos, bater de portas, etc.).</p>
                            </div>

                            <div className="bg-white/5 p-6 rounded border-l-4 border-carapita-gold/50">
                                <h3 className="font-bold uppercase tracking-widest text-xs text-white mb-2">Filmagens e Fotografias</h3>
                                <p className="text-white/70">Os hóspedes não devem participar em filmagens ou fotografias que se destinem a fins comerciais ou lucrativos, sem permissão documentada dos anfitriões.</p>
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
