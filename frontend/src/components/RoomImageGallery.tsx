import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Camera } from 'lucide-react';

interface RoomImageGalleryProps {
    fotos: { url: string; category: string; isMain: boolean }[];
    quartoNome: string;
    onClick?: () => void;
}

export default function RoomImageGallery({ fotos, quartoNome, onClick }: RoomImageGalleryProps) {
    const [idx, setIdx] = useState(0);

    const next = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIdx((prev) => (prev + 1) % fotos.length);
    };

    const prev = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIdx((prev) => (prev - 1 + fotos.length) % fotos.length);
    };

    if (!fotos.length) return <div className="w-full h-full bg-white/5 flex items-center justify-center text-white/20 uppercase tracking-widest text-[10px]">Sem fotos</div>;

    return (
        <div className="relative w-full h-full group" onClick={onClick}>
            <div 
                className="flex transition-transform duration-700 h-full"
                style={{ transform: `translateX(-${idx * 100}%)`, width: `${fotos.length * 100}%` }}
            >
                {fotos.map((f, i) => (
                    <div key={i} className="w-full h-full relative">
                        <img src={f.url} alt={`${quartoNome} - ${i}`} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-gradient-to-t from-carapita-green/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    </div>
                ))}
            </div>

            {fotos.length > 1 && (
                <>
                    <button 
                        onClick={prev}
                        className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/30 backdrop-blur-md text-white border border-white/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-carapita-gold hover:text-carapita-dark"
                    >
                        <ChevronLeft size={20} />
                    </button>
                    <button 
                        onClick={next}
                        className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/30 backdrop-blur-md text-white border border-white/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-carapita-gold hover:text-carapita-dark"
                    >
                        <ChevronRight size={20} />
                    </button>

                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-10">
                        {fotos.map((_, i) => (
                            <div 
                                key={i} 
                                className={`h-1 rounded-full transition-all duration-500 ${i === idx ? 'w-8 bg-carapita-gold' : 'w-2 bg-white/30'}`} 
                            />
                        ))}
                    </div>
                </>
            )}

            <div className="absolute top-6 right-6 bg-carapita-dark/60 backdrop-blur-md border border-white/10 px-3 py-1.5 rounded-full flex items-center gap-2 text-white/80 text-[10px] uppercase tracking-widest font-bold">
                <Camera size={12} className="text-carapita-gold" />
                {idx + 1} / {fotos.length}
            </div>
        </div>
    );
}
