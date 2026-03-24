import React from 'react';

interface EssenciaSectionProps {
    t: (key: string) => string;
    scrollTo?: (id: string) => void;
}

export default function EssenciaSection({ t, scrollTo }: EssenciaSectionProps) {
    return (
        <section id="a-essencia" className="w-full bg-carapita-green text-white py-20 lg:py-32 px-4 md:px-8 lg:px-24 overflow-hidden relative border-t border-white/5">
            <div className="max-w-[1400px] mx-auto flex flex-col items-center">

                {/* Cabeçalho */}
                <div className="text-center mb-16 lg:mb-32 z-10 relative px-4">
                    <div className="flex justify-center mb-6 lg:mb-8">
                        <span className="w-[1px] h-8 lg:h-12 bg-carapita-gold opacity-50 block"></span>
                    </div>
                    <span className="text-carapita-gold uppercase tracking-widest text-[9px] md:text-[10px] font-medium block mb-4 lg:mb-6"> 
                        {t('essencia_tag')} 
                    </span>
                    <h3 className="text-3xl md:text-6xl lg:text-7xl font-serif text-carapita-goldLight leading-tight font-light uppercase tracking-widest">
                        {t('essencia_title')}
                    </h3>
                </div>

                {/* Layout Sobreposto (Imagens + Texto) */}
                <div className="w-full flex flex-col lg:flex-row items-center lg:items-start justify-between gap-12 lg:gap-16 relative">

                    {/* Box Decorativo Fino Atrás */}
                    <div className="hidden lg:block absolute left-4 xl:-left-8 top-12 w-[65%] h-[110%] border opacity-20 border-carapita-gold z-0 pointer-events-none"></div>

                    {/* Coluna das Imagens (Esquerda) */}
                    <div className="w-full lg:w-[82%] relative min-h-[400px] sm:min-h-[600px] md:min-h-[900px] flex items-center justify-center lg:justify-start">

                        {/* Imagem 1 — Fundo Direita (exterior) */}
                        <div className="absolute right-0 lg:-right-8 xl:-right-12 top-0 w-full md:w-[85%] lg:w-[75%] h-[320px] sm:h-[480px] md:h-[750px] z-10 overflow-hidden shadow-2xl">
                            <img
                                src="/essencia_carapita.jpg"
                                className="w-full h-full object-cover transform duration-[3s] hover:scale-105 filter brightness-100"
                                alt="Vista Exterior Mágica"
                            />
                        </div>

                        {/* Imagem 2 — Frente Esquerda (detalhe alojamento) */}
                        <div className="hidden md:block absolute left-0 lg:-left-12 xl:-left-20 bottom-[-20px] md:bottom-[-40px] w-[60%] md:w-[50%] lg:w-[40%] h-[320px] sm:h-[450px] md:h-[520px] z-20 overflow-hidden group shadow-[20px_20px_50px_rgba(0,0,0,0.5)] border-4 border-carapita-gold">
                            <img
                                src="https://a0.muscache.com/im/pictures/hosting/Hosting-1580467683590335058/original/f0f4a673-77ef-4b5a-ba7a-2888f3e9eebf.jpeg?im_w=960"
                                className="w-full h-full object-cover transform duration-[3s] group-hover:scale-105"
                                alt="Detalhes do Alojamento"
                            />
                        </div>

                        {/* Imagem 3 — Centro Sobreposta (quarto principal) */}
                        <div className="hidden md:block absolute left-[28%] lg:left-[24%] top-[60px] md:top-[80px] w-[42%] md:w-[36%] h-[240px] md:h-[320px] z-30 overflow-hidden group shadow-[0px_25px_60px_rgba(0,0,0,0.7)] border-4 border-white/30">
                            <img
                                src="/images/quarto-principal.jpg"
                                className="w-full h-full object-cover transform duration-[3s] group-hover:scale-105"
                                alt="Quarto Principal"
                            />
                        </div>
                    </div>

                    {/* Coluna de Texto (Direita) */}
                    <div className="w-full lg:w-[15%] flex flex-col justify-start text-left z-30 mt-12 md:mt-28 lg:mt-0 lg:pt-12 xl:pl-4 px-4 md:px-0">
                        <p className="text-white/70 font-light leading-[2.2] text-sm tracking-wide text-justify md:text-left mb-12">
                            {t('essencia_p1')}
                            <br /><br />
                            {t('essencia_p2')}
                        </p>

                        {/* Botão Oval Elegante */}
                        <button 
                            onClick={() => scrollTo('alojamento')} 
                            className="flex items-center justify-center w-full md:w-48 h-12 border border-carapita-gold/60 rounded-[30px] text-[9px] uppercase tracking-[0.2em] text-carapita-gold hover:bg-carapita-gold hover:text-white transition-all duration-700 mx-auto md:mx-0"
                        >
                            {t('essencia_btn')}
                        </button>
                    </div>
                </div>

            </div>
        </section>
    );
}
