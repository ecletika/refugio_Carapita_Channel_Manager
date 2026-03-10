import React from 'react';
import { ChevronLeft } from 'lucide-react';
import Link from 'next/link';

export default function TratamentoDados() {
    return (
        <main className="min-h-screen bg-carapita-green font-sans text-white pt-24 pb-20 px-6">
            <div className="max-w-4xl mx-auto">
                <Link href="/" className="inline-flex items-center gap-2 text-carapita-gold hover:text-white uppercase tracking-widest text-[10px] font-bold mb-10 transition-colors">
                    <ChevronLeft size={14} /> Voltar ao Início
                </Link>

                <h1 className="font-serif text-4xl md:text-5xl text-white mb-12 uppercase tracking-widest text-center border-b border-white/10 pb-8">
                    Política de Tratamento de Dados Pessoais
                </h1>

                <div className="bg-white/5 border border-white/10 p-8 md:p-12 text-sm leading-relaxed text-white/80 space-y-8 font-light shadow-2xl">
                    <section>
                        <h2 className="text-xl font-serif text-carapita-gold mb-4 uppercase tracking-widest">1. Introdução</h2>
                        <p>
                            A presente Política de Privacidade e Tratamento de Dados Pessoais regula a recolha e tratamento dos dados pessoais fornecidos pelos utilizadores ao visitar e utilizar o site do Refúgio Carapita, bem como no ato de reserva, em conformidade com o Regulamento Geral sobre a Proteção de Dados (RGPD - Regulamento (UE) 2016/679).
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-serif text-carapita-gold mb-4 uppercase tracking-widest">2. Responsável pelo Tratamento</h2>
                        <p className="mb-4">A entidade responsável pelo tratamento dos seus dados pessoais é:</p>
                        <ul className="list-disc pl-5 space-y-2">
                            <li><strong>Entidade:</strong> <span>Leonardo Guede Azevedo</span></li>
                            <li><strong>NIF:</strong> <span>260876640</span></li>
                            <li><strong>Morada:</strong> <span>Rua D. Afonso IV, 450, 2490-378 Ourém</span></li>
                            <li><strong>Telemóvel:</strong> <span>+351 967 244 938</span></li>
                            <li><strong>E-mail:</strong> <span>contacto@refugiocarapita.pt</span></li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-serif text-carapita-gold mb-4 uppercase tracking-widest">3. Dados Pessoais Recolhidos</h2>
                        <p>
                            Para a realização da sua reserva e estadia, recolhemos os seguintes dados pessoais:
                        </p>
                        <ul className="list-disc pl-5 space-y-2 mt-4 text-white/70">
                            <li>Dados de Identificação: Nome, apelido, número do documento de identificação civil ou passaporte (obrigatório pela AIMA - Agência para a Integração Migrações e Asilo para hóspedes estrangeiros).</li>
                            <li>Dados de Contacto: E-mail, número de telefone e morada completa.</li>
                            <li>Dados de Pagamento: Informações de faturação. Transações por cartão, MBWAY ou paypal são efetuadas por prestadores que garantem a conformidade legal.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-serif text-carapita-gold mb-4 uppercase tracking-widest">4. Finalidades do Tratamento</h2>
                        <p>Os seus dados são recolhidos e utilizados exclusivamente para:</p>
                        <ul className="list-disc pl-5 space-y-2 mt-4 text-white/70">
                            <li>Gestão de reservas e estadias no Refúgio Carapita;</li>
                            <li>Comunicação com o hóspede sobre atualizações da reserva ou check-in;</li>
                            <li>Cumprimento de obrigações legais, como faturação (Autoridade Tributária) e comunicação de estrangeiros à AIMA;</li>
                            <li>Eventual envio (apenas com o seu consentimento) de e-mails de marketing e ofertas relativas ao alojamento.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-serif text-carapita-gold mb-4 uppercase tracking-widest">5. Conservação dos Dados</h2>
                        <p>
                            O Refúgio Carapita conservará os seus dados pessoais apenas pelo tempo estritamente necessário para as finalidades para os quais foram recolhidos ou, caso aplicável, até que o hóspede exerça o seu direito de oposição, direito a ser esquecido, ou retire o seu consentimento. Adicionalmente, alguns dados de faturação ou identificação terão de ser mantidos pelos prazos exigidos por lei (ex. 10 anos por obrigação da Autoridade Tributária).
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-serif text-carapita-gold mb-4 uppercase tracking-widest">6. Partilha de Dados a Terceiros</h2>
                        <p>
                            Garantimos que os seus dados apenas serão partilhados com terceiros quando estritamente necessário para:
                        </p>
                        <ul className="list-disc pl-5 space-y-2 mt-4 text-white/70">
                            <li>Obrigações legais (ex: AIMA, Autoridade Tributária);</li>
                            <li>Plataformas de processamento de pagamento contratadas, que cumpram rigorosamente as normas em vigor em matéria de proteção de dados.</li>
                        </ul>
                        <p className="mt-4">Não vendemos nem comercializamos os seus dados a outras organizações.</p>
                    </section>

                    <section>
                        <h2 className="text-xl font-serif text-carapita-gold mb-4 uppercase tracking-widest">7. Direitos do Titular dos Dados</h2>
                        <p>Enquanto titular de dados pessoais, a legislação atribui-lhe o direito a:</p>
                        <ul className="list-disc pl-5 space-y-2 mt-4 text-white/70">
                            <li>Aceder aos dados pessoais que nos forneceu;</li>
                            <li>Solicitar a retificação de eventuais dados inexatos ou incompletos;</li>
                            <li>Solicitar o apagamento dos seus dados (Direito a Ser Esquecido), desde que tal não contrarie normas ou imposições legais;</li>
                            <li>Retirar o seu consentimento para comunicações de marketing a qualquer momento.</li>
                        </ul>
                        <p className="mt-6">Para exercer qualquer um destes direitos, utilize o e-mail: <strong>contacto@refugiocarapita.pt</strong> indicando no assunto "Proteção de Dados".</p>
                    </section>

                </div>
            </div>
        </main>
    );
}
