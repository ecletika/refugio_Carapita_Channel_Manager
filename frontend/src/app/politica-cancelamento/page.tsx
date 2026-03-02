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

                    <p className="italic">Garantir a sua estadia com tranquilidade é o nosso compromisso. Aqui encontram-se descritas as condições relativas ao cancelamento das reservas no Refúgio Carapita, acompanhando as políticas das principais plataformas.</p>

                    <div>
                        <h2 className="text-carapita-gold font-serif text-2xl mb-4">Período de Carência (24 Horas)</h2>
                        <p>A partir de outubro de 2025, a maioria das reservas (menos de 28 noites) permite <strong>cancelamento gratuito com reembolso total até 24 horas após a reserva</strong>, desde que faltem mais de 7 dias para a data prevista do check-in.</p>
                    </div>

                    <div className="border-t border-white/10 pt-8 mt-8">
                        <h2 className="text-carapita-gold font-serif text-2xl mb-6">Categorias Principais</h2>

                        <div className="space-y-6">
                            <div className="bg-white/5 p-6 rounded border-l-4 border-green-500">
                                <h3 className="font-bold uppercase tracking-widest text-xs text-white mb-2">Flexível</h3>
                                <p className="text-white/70">Reembolso total até 24 horas (1 dia) antes do check-in.</p>
                            </div>

                            <div className="bg-white/5 p-6 rounded border-l-4 border-yellow-500">
                                <h3 className="font-bold uppercase tracking-widest text-xs text-white mb-2">Moderada</h3>
                                <p className="text-white/70">Reembolso total até 5 dias antes do check-in.</p>
                            </div>

                            <div className="bg-white/5 p-6 rounded border-l-4 border-red-500">
                                <h3 className="font-bold uppercase tracking-widest text-xs text-white mb-2">Limitada / Firme</h3>
                                <p className="text-white/70">Reembolso total até 14 dias antes do check-in.</p>
                            </div>

                            <div className="bg-white/5 p-6 rounded border-l-4 border-purple-500">
                                <h3 className="font-bold uppercase tracking-widest text-xs text-white mb-2">Rigorosa</h3>
                                <p className="text-white/70">O cancelamento deve ocorrer com até 30 dias de antecedência para evitar penalizações significativas. Aplicável especialmente a eventos ou períodos de alta procura.</p>
                            </div>
                        </div>
                    </div>

                    <div className="border-t border-white/10 pt-8">
                        <h2 className="text-carapita-gold font-serif text-2xl mb-4">Reservas de Longa Duração (28+ noites)</h2>
                        <p>Estadias prolongadas geralmente têm políticas mais rigorosas. É frequentemente exigido um cancelamento com 30 dias de antecedência para evitar a cobrança integral dos próximos 30 dias reservados.</p>
                    </div>

                    <div className="border-t border-white/10 pt-8">
                        <h2 className="text-carapita-gold font-serif text-2xl mb-4">Eventos Extraordinários</h2>
                        <p>A Política de Cancelamento por Eventos Extraordinários pode aplicar-se a desastres naturais ou emergências de saúde severas. Nessas raras exceções autorizadas pelas plataformas e leis vigorantes, são permitidos cancelamentos sem penalizações mesmo que a nossa política base se aplique de forma rígida.</p>
                    </div>

                    <div className="border-t border-white/10 pt-8 mt-12">
                        <h2 className="text-carapita-gold font-serif text-2xl mb-4">Quando receberá o seu reembolso</h2>
                        <p className="mb-4">
                            Se tiver direito a reembolso por uma estadia ou experiência, iniciamos imediatamente o processo após o cancelamento. Contudo, o prazo para o valor ser creditado na sua conta ou cartão pode variar consoante o banco ou instituição financeira, da forma como pagou, do momento em que pagou e de onde reside.
                        </p>

                        <h3 className="font-bold text-white mb-2 mt-6">Se não for possível enviar um reembolso para o método de pagamento original</h3>
                        <p className="mb-4">
                            Se a conta associada ao método de pagamento original tiver sido encerrada, o reembolso enviado pela Refúgio Carapita não é processado. Se isto acontecer, pode contactar o seu banco ou instituição financeira para o localizar. Se ainda tiver uma conta no banco ou instituição financeira, pode ser possível transferir o reembolso para um novo cartão ou uma nova conta. Em alguns casos, o banco ou a instituição financeira pode enviar-lhe um cheque com o montante do reembolso.
                        </p>
                        <p className="mb-4">
                            Se precisar de lhes transmitir informações sobre o reembolso, contacte a Refúgio Carapita. Podemos fornecer-lhe as informações necessárias, incluindo um número de referência que pode ser utilizado pelo seu banco ou instituição financeira.
                        </p>
                        <p className="text-xs opacity-70 italic">
                            Observação: por vezes, devido a conversões de moeda, pode parecer que há um reembolso muito pequeno pendente. Quando o montante é inferior a 0,01 USD (ou equivalente), não é possível efetuar o reembolso.
                        </p>
                    </div>

                    <div className="border-t border-white/10 pt-8 mt-12">
                        <h2 className="text-carapita-gold font-serif text-2xl mb-4">Política de Cancelamento para Anfitriões</h2>
                        <p className="mb-4">
                            Embora os cancelamentos por parte dos anfitriões sejam raros e alguns ocorram por motivos de força maior, estas situações podem perturbar os planos dos hóspedes e comprometer a confiança na nossa comunidade. Por estes motivos, em caso de cancelamento de uma reserva confirmada, ou quando existe responsabilidade pelo cancelamento ao abrigo desta Política, a Airbnb (e a nossa plataforma) aplica taxas e outras consequências. As taxas e outras consequências estabelecidas nesta Política refletem os custos e outros impactos destes cancelamentos nos hóspedes, na comunidade alargada de anfitriões e na Airbnb. As taxas e, em alguns casos, outras consequências podem ser dispensadas se o cancelamento ocorrer devido a Eventos Extraordinários Relevantes ou motivos válidos fora do controlo dos anfitriões.
                        </p>

                        <h3 className="font-bold text-white mb-2 mt-6">Taxas de cancelamento</h3>
                        <p className="mb-4">
                            Em caso de cancelamento de uma reserva confirmada, ou quando existe responsabilidade pelo cancelamento ao abrigo desta Política, podem ser aplicadas taxas sujeitas a uma taxa de cancelamento mínima de 50 USD (ou equivalente). A taxa é calculada com base no valor da reserva e no momento do cancelamento:
                        </p>
                        <ul className="list-disc pl-6 space-y-2 mb-4">
                            <li>Se o cancelamento ocorrer nas 48 horas anteriores ao check-in, ou após o check-in, a taxa corresponde a 50% do valor da reserva para as noites não usufruídas.</li>
                            <li>Se o cancelamento ocorrer entre 48 horas e 30 dias antes do check-in, a taxa corresponde a 25% do valor da reserva.</li>
                            <li>Se o cancelamento ocorrer mais de 30 dias antes do check-in, a taxa corresponde a 10% do valor da reserva.</li>
                            <li>Para reservas de 28 dias ou mais, as taxas de cancelamento acima são calculadas como uma percentagem da parte não reembolsável da reserva à data do cancelamento.</li>
                        </ul>
                        <p className="mb-4 text-xs opacity-70">
                            No cálculo das taxas de cancelamento, o valor da reserva inclui a tarifa base, a taxa de limpeza e eventuais taxas para animais de estimação, mas exclui impostos e taxas de serviço para hóspedes.
                        </p>

                        <h3 className="font-bold text-white mb-2 mt-6">Situações em que as taxas podem ser dispensadas</h3>
                        <p className="mb-4">
                            Renunciamos às taxas em situações pertinentes, nomeadamente em caso de cancelamentos iniciados devido a Eventos Extraordinários Relevantes ou a determinados motivos válidos fora do controlo dos anfitriões. A decisão sobre a dispensa de taxas é tomada após avaliação dos elementos e provas disponíveis.
                        </p>

                        <h3 className="font-bold text-white mb-2 mt-6">Outras consequências e responsabilidades</h3>
                        <p className="mb-4">
                            Para além de uma taxa de cancelamento, podem aplicar-se outras consequências, tais como impedir a aceitação de outra reserva para o espaço nas datas afetadas (bloqueando o calendário do anúncio).
                        </p>
                        <p className="mb-4">
                            Pode existir responsabilidade pelo cancelamento quando o espaço apresenta condições substancialmente diferentes das anunciadas no momento da reserva (ex: reserva duplicada, publicitar funcionalidades inexistentes que perturbam a estadia).
                        </p>
                        <p className="mb-4 text-xs italic">
                            Esta Política aplica-se a cancelamentos que ocorram na data ou após a data de entrada em vigor. Quaisquer alterações a esta Política serão efetuadas em conformidade com os Termos de Serviço Globais.
                        </p>
                    </div>

                    <div className="bg-carapita-gold/10 p-6 !mt-12 text-center text-xs">
                        <p><strong>⚠️ Onde Verificar:</strong> A política exata de cada anúncio/reserva individual pode e deve ser consultada na secção "Detalhes da reserva" ou enviada junto à confirmação da estadia. As taxas de serviço de plataformas de terceiros (como Airbnb/Booking.com) podem não ser geridas ou reembolsadas por nós em todos os casos. Recomenda-se sempre verificar a política específica selecionada no momento efetivo da reserva online.</p>
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
