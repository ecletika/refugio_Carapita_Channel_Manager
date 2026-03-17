"use client";
import React, { useEffect, useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function PoliticaCancelamento() {
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

            {/* Conteúdo da Política */}
            <section className="flex-1 max-w-4xl mx-auto w-full px-6 pt-40 pb-20 text-white">
                <div className="mb-12">
                    <span className="text-carapita-gold text-[10px] uppercase tracking-mega font-bold block mb-4">Informação Legal</span>
                    <h1 className="text-4xl md:text-5xl font-serif text-white mb-6">Política de Cancelamento</h1>
                    <p className="text-white/60 text-sm font-sans uppercase tracking-widest leading-relaxed border-l-2 border-carapita-gold pl-4 opacity-80">Condições aplicáveis às reservas e estadias no Refúgio Carapita.</p>
                </div>

                <div className="bg-white/5 border border-white/10 p-8 md:p-12 text-sm leading-relaxed text-white/80 space-y-8 font-light shadow-xl">

                    <div className="space-y-4">
                        <p className="italic">No Refúgio Carapita, valorizamos a transparência e a confiança. Ao reservar diretamente connosco, garantimos as melhores condições e um contacto personalizado. Abaixo, detalhamos a nossa política para garantir a melhor experiência para ambas as partes.</p>
                    </div>

                    <div>
                        <h2 className="text-carapita-gold font-serif text-2xl mb-4">1. Confirmação de Reserva</h2>
                        <div className="space-y-4">
                            <p>Para garantir a sua reserva, solicitamos o pagamento de um sinal correspondente a 50% do valor total da estadia (via Transferência Bancária, MB WAY ou Cartão de Crédito/Stripe).</p>
                            <p>Os restantes 50% deverão ser liquidados até ao momento do check-in.</p>
                        </div>
                    </div>

                    <div>
                        <h2 className="text-carapita-gold font-serif text-2xl mb-4">2. Cancelamento e Reembolso</h2>
                        <div className="space-y-4">
                            <p>Entendemos que imprevistos acontecem. No entanto, como somos um alojamento local de gestão familiar, os cancelamentos de última hora impactam-nos significativamente. Assim, aplicamos as seguintes condições:</p>
                            <ul className="list-disc pl-6 space-y-4">
                                <li><strong className="text-white font-medium">Cancelamento Gratuito (Até 14 dias antes):</strong> Se cancelar a sua reserva com uma antecedência igual ou superior a 14 dias em relação à data de check-in, o sinal pago será totalmente reembolsado (deduzindo eventuais taxas de transação bancária).</li>
                                <li><strong className="text-white font-medium">Cancelamento Fora de Prazo (Menos de 14 dias):</strong> Em caso de cancelamento com menos de 14 dias de antecedência ou em caso de "não comparência" (No-Show), o sinal de 50% não será reembolsado.</li>
                                <li><strong className="text-white font-medium">Saída Antecipada:</strong> A saída antes da data prevista de check-out não confere direito a reembolso dos dias não usufruídos.</li>
                            </ul>
                        </div>
                    </div>

                    <div>
                        <h2 className="text-carapita-gold font-serif text-2xl mb-4">3. Alternativa Flexível: Voucher de Crédito</h2>
                        <p>Em situações de força maior (justificadas), e caso não seja possível o reembolso direto, o Refúgio Carapita poderá, por mútuo acordo, converter o valor do sinal num Voucher de Crédito, válido por 12 meses, para ser utilizado numa estadia futura (sujeito a disponibilidade e ajuste de tarifas conforme a época).</p>
                    </div>

                    <div>
                        <h2 className="text-carapita-gold font-serif text-2xl mb-4">4. Notas Importantes</h2>
                        <div className="space-y-4">
                            <p>Esta política aplica-se exclusivamente a reservas efetuadas diretamente através do site refugiocarapita.pt, e-mail ou contacto telefónico.</p>
                            <p className="italic text-xs opacity-80">Reservas efetuadas via Booking.com ou Airbnb regem-se pelas políticas específicas selecionadas nessas plataformas, que podem diferir das aqui apresentadas.</p>
                        </div>
                    </div>

                    <div className="border-t border-white/10 pt-12 mt-12 space-y-8">
                        <div>
                            <span className="text-carapita-gold text-[10px] uppercase tracking-mega font-bold block mb-2">Longa Duração</span>
                            <h2 className="text-3xl font-serif text-white mb-6">Política de Cancelamento para Estadias de Longa Duração (28 dias)</h2>
                            <p className="italic mb-6">No Refúgio Carapita, oferecemos condições especiais para estadias prolongadas. Devido ao bloqueio exclusivo do nosso espaço por um período alargado, aplicamos a seguinte política de cancelamento e reserva:</p>
                        </div>

                        <div>
                            <h3 className="text-carapita-gold font-serif text-xl mb-4">1. Confirmação e Pagamento</h3>
                            <ul className="list-disc pl-6 space-y-4">
                                <li><strong className="text-white font-medium">Sinal de Reserva:</strong> Para confirmar estadias de 28 dias, solicitamos o pagamento de 50% do valor total no ato da reserva.</li>
                                <li><strong className="text-white font-medium">Pagamento Final:</strong> Os restantes 50% devem ser liquidados até 15 dias antes da data de check-in.</li>
                            </ul>
                            <p className="mt-4 text-xs font-medium text-red-300">Caso o pagamento final não seja efetuado no prazo estipulado, a reserva será cancelada e o sinal não será reembolsado.</p>
                        </div>

                        <div>
                            <h3 className="text-carapita-gold font-serif text-xl mb-4">2. Cancelamento e Reembolso</h3>
                            <ul className="list-disc pl-6 space-y-4">
                                <li><strong className="text-white font-medium">Cancelamento com Antecedência (Mais de 28 dias):</strong> Se o cancelamento for comunicado com mais de 28 dias de antecedência em relação ao check-in, o hóspede terá direito ao reembolso de 50% do sinal pago (25% do valor total da reserva).</li>
                                <li><strong className="text-white font-medium">Cancelamento Próximo (Menos de 28 dias):</strong> Se o cancelamento ocorrer com menos de 28 dias de antecedência, ou após o início da estadia, não haverá lugar a qualquer reembolso.</li>
                                <li><strong className="text-white font-medium">Não Comparência (No-Show):</strong> Em caso de não comparência, o valor total da reserva será retido.</li>
                            </ul>
                        </div>

                        <div>
                            <h3 className="text-carapita-gold font-serif text-xl mb-4">3. Alterações de Datas</h3>
                            <p>Pedidos de alteração de datas para estadias de longa duração devem ser feitos com pelo menos 30 dias de antecedência e estão sujeitos a disponibilidade e ajuste de tarifa (consoante a época). Reservamo-nos o direito de não aceitar alterações que reduzam o período total da estadia.</p>
                        </div>

                        <div>
                            <h3 className="text-carapita-gold font-serif text-xl mb-4">4. Saída Antecipada</h3>
                            <p>Se o hóspede decidir terminar a estadia antes da data de check-out prevista, o valor correspondente aos dias não usufruídos não será reembolsado, uma vez que o calendário foi bloqueado especificamente para este período.</p>
                        </div>
                    </div>

                    <div className="border-t border-white/10 pt-12 mt-12 space-y-8">
                        <div>
                            <span className="text-carapita-gold text-[10px] uppercase tracking-mega font-bold block mb-2">Exceções</span>
                            <h2 className="text-3xl font-serif text-white mb-6">Política de Causas de Força Maior e Eventos Extraordinários</h2>
                            <p className="italic mb-6">No Refúgio Carapita, a segurança dos nossos hóspedes e a integridade da nossa propriedade são prioridades absolutas. Em situações excecionais que escapem ao controlo de ambas as partes, aplicamos as seguintes condições:</p>
                        </div>

                        <div>
                            <h3 className="text-carapita-gold font-serif text-xl mb-4">1. Definição de Eventos Extraordinários</h3>
                            <p className="mb-4">Consideram-se eventos extraordinários ou de força maior as situações que tornem impossível ou comprovadamente perigosa a realização da estadia, tais como:</p>
                            <ul className="list-disc pl-6 space-y-4">
                                <li><strong className="text-white font-medium">Desastres Naturais:</strong> Incêndios florestais graves na zona envolvente, inundações, terramotos ou outros fenómenos climatéricos extremos que impeçam o acesso à propriedade.</li>
                                <li><strong className="text-white font-medium">Restrições Governamentais:</strong> Estados de emergência, restrições de circulação impostas por autoridades de saúde ou fecho de fronteiras.</li>
                                <li><strong className="text-white font-medium">Falhas de Infraestrutura Crítica:</strong> Cortes prolongados de energia ou água na região que impossibilitem as condições mínimas de habitabilidade e conforto do refúgio.</li>
                            </ul>
                        </div>

                        <div>
                            <h3 className="text-carapita-gold font-serif text-xl mb-4">2. Procedimentos e Reembolsos</h3>
                            <p className="mb-4">Caso ocorra um evento de força maior que impeça o usufruto da reserva:</p>
                            <ul className="list-disc pl-6 space-y-4">
                                <li><strong className="text-white font-medium">Cancelamento por parte do Refúgio Carapita:</strong> Se, por razões de segurança ou danos na propriedade, não pudermos receber o hóspede, este terá direito ao reembolso integral (100%) dos valores já pagos ou, se preferir, à emissão de um Voucher de Crédito com validade de 12 meses.</li>
                                <li><strong className="text-white font-medium">Cancelamento por parte do Hóspede:</strong> Se o hóspede não puder viajar devido a restrições legais oficiais ou desastres naturais comprovados na sua zona de residência ou no trajeto, deverá apresentar prova documental. Nestes casos, priorizamos a remarcação de datas sem custos adicionais (sujeito a ajuste tarifário de época) ou a emissão de um Voucher de Crédito.</li>
                            </ul>
                        </div>

                        <div>
                            <h3 className="text-carapita-gold font-serif text-xl mb-4">3. Exclusões</h3>
                            <p className="mb-4">Esta política não se aplica a:</p>
                            <ul className="list-disc pl-6 space-y-4">
                                <li>Doenças ou imprevistos pessoais do hóspede (nestes casos, aplica-se a Política de Cancelamento Normal).</li>
                                <li>Condições meteorológicas comuns (ex: chuva, frio ou vento moderado) que não representem perigo imediato ou restrições oficiais.</li>
                                <li>Cancelamentos de voos por greves ou problemas das companhias aéreas (nestes casos, o hóspede deve reclamar junto da transportadora ou do seu seguro de viagem).</li>
                            </ul>
                        </div>

                        <div>
                            <h3 className="text-carapita-gold font-serif text-xl mb-4">4. Recomendação de Seguro de Viagem</h3>
                            <p>Aconselhamos todos os nossos hóspedes a subscreverem um Seguro de Viagem que cubra cancelamentos por motivos de saúde ou transporte, garantindo proteção total além das responsabilidades diretas do alojamento.</p>
                        </div>
                    </div>

                    <div className="border-t border-white/10 pt-12 mt-12 space-y-8">
                        <div>
                            <span className="text-carapita-gold text-[10px] uppercase tracking-mega font-bold block mb-2">Anfitrião</span>
                            <h2 className="text-3xl font-serif text-white mb-6">Cancelamento por Iniciativa do Refúgio Carapita</h2>
                            <p className="italic mb-6">Embora façamos todos os esforços para garantir a sua estadia, existem situações excecionais em que o Refúgio Carapita se reserva o direito de cancelar uma reserva confirmada. Nestes casos, procedemos da seguinte forma:</p>
                        </div>

                        <div>
                            <h3 className="text-carapita-gold font-serif text-xl mb-4">1. Motivos de Cancelamento pelo Anfitrião</h3>
                            <p className="mb-4">O cancelamento por nossa iniciativa poderá ocorrer nas seguintes situações:</p>
                            <ul className="list-disc pl-6 space-y-4">
                                <li><strong className="text-white font-medium">Avarias Críticas:</strong> Problemas técnicos súbitos e graves (ex: rutura de canalização, falha elétrica total, danos estruturais) que impeçam a habitabilidade ou ponham em causa a segurança e o conforto dos hóspedes.</li>
                                <li><strong className="text-white font-medium">Erros de Sistema:</strong> No caso raro de uma falha informática (overbooking técnico) que gere uma reserva duplicada ou erro óbvio de tarifa no site.</li>
                                <li><strong className="text-white font-medium">Incumprimento do Hóspede:</strong> Falta de pagamento do sinal (50%) ou do valor remanescente nos prazos estipulados nas condições de reserva.</li>
                                <li><strong className="text-white font-medium">Violação de Regras Prévias:</strong> Caso existam provas de que a reserva se destina a fins não autorizados (ex: festas, eventos não declarados ou ocupação superior à capacidade máxima).</li>
                            </ul>
                        </div>

                        <div>
                            <h3 className="text-carapita-gold font-serif text-xl mb-4">2. Compensação e Resolução</h3>
                            <p className="mb-4">Caso o cancelamento seja da inteira responsabilidade do Refúgio Carapita (ex: avarias ou erro de sistema):</p>
                            <ul className="list-disc pl-6 space-y-4">
                                <li><strong className="text-white font-medium">Reembolso Integral:</strong> O hóspede será notificado de imediato e receberá o reembolso de 100% de todos os valores já pagos, no prazo máximo de 5 dias úteis.</li>
                                <li><strong className="text-white font-medium">Apoio na Recolocação:</strong> Faremos o possível para sugerir alojamentos alternativos na região de qualidade equivalente, embora não possamos garantir a disponibilidade de terceiros.</li>
                                <li><strong className="text-white font-medium">Voucher de Cortesia:</strong> Como pedido de desculpas pelo transtorno, poderemos oferecer um desconto especial para uma futura reserva direta.</li>
                            </ul>
                        </div>

                        <div>
                            <h3 className="text-carapita-gold font-serif text-xl mb-4">3. Limitação de Responsabilidade</h3>
                            <p>O Refúgio Carapita não se responsabiliza por custos externos ao alojamento (ex: passagens aéreas, aluguer de carros ou bilhetes para eventos) decorrentes do cancelamento da reserva. Recomendamos vivamente a subscrição de um seguro de viagem que cubra estas eventualidades.</p>
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
