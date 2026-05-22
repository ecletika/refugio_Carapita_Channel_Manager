import React from 'react';

interface HeroBannerProps {
    t: (key: string) => string;
    onReservar: () => void;
}

export default function HeroBanner({ t, onReservar }: HeroBannerProps) {
    const [currentHeroIndex, setCurrentHeroIndex] = React.useState(0);
    const heroImages = [
        // Imagem principal (upload direto — Supabase Storage)
        "https://vuidkeygtxfbgxvmilya.supabase.co/storage/v1/object/public/carapita-images/1772751561638-WhatsApp_Image_2026-02-23_at_22.22.54_(7).jpeg",
        // Exterior da propriedade (Airbnb CDN)
        "https://a0.muscache.com/im/pictures/hosting/Hosting-1580467683590335058/original/6b48752c-55b9-44ba-a6e8-61c2c68239df.jpeg?im_w=1440",
        // Quarto (Booking.com CDN)
        "https://cf.bstatic.com/xdata/images/hotel/max1024x768/808586137.jpg?k=7c0dbcd1b2989c9eb0784f8d5edb580acca24f4095745aba62a6f844b02d8f3d&o=",
    ];

    React.useEffect(() => {
        const interval = setInterval(() => {
            setCurrentHeroIndex((prev) => (prev + 1) % heroImages.length);
        }, 5000);
        return () => clearInterval(interval);
    }, []);
    return (
        <section className="relative w-full h-screen flex items-center justify-center overflow-hidden bg-black">
            {/* Carrossel de Imagens */}
            {heroImages.map((img, idx) => (
                <div
                    key={idx}
                    className={`absolute inset-0 bg-cover bg-center transition-opacity duration-1000 ${
                        idx === currentHeroIndex ? 'opacity-100 scale-105' : 'opacity-0'
                    }`}
                    style={{
                        backgroundImage: `url("${img}")`,
                        transitionProperty: 'opacity, transform',
                        transitionDuration: '1000ms, 10s'
                    }}
                ></div>
            ))}

            <div className="absolute inset-0 bg-black/30"></div>

            <div className="z-10 text-center px-4 max-w-5xl mt-24">
                <p className="text-white text-xs md:text-sm tracking-mega uppercase mb-8 font-light drop-shadow-md">
                    {t('hero_subtitle')}
                </p>
                <h2 className="text-5xl md:text-7xl lg:text-8xl text-white mb-8 font-serif font-light leading-tight drop-shadow-lg">
                    {t('hero_title')} <br />
                    <i className="font-serif text-carapita-goldLight">{t('hero_title_exclusividade')}</i>
                </h2>
            </div>

            {/* Scroll Indicator */}
            <div 
                className="absolute bottom-12 left-1/2 -translate-x-1/2 text-white flex flex-col items-center gap-4 opacity-80 cursor-pointer hover:text-carapita-gold hover:opacity-100 transition-colors" 
                onClick={onReservar}
            >
                <div className="w-[1px] h-20 bg-gradient-to-b from-white to-transparent"></div>
                <span className="text-[10px] tracking-mega uppercase font-bold">{t('hero_ver_dispo')}</span>
            </div>
        </section>
    );
}
