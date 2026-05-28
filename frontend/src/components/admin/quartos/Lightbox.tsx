"use client";
import React from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

interface LightboxProps {
    fotos:    string[];
    index:    number;
    onChange: (idx: number) => void;
    onClose:  () => void;
}

export default function Lightbox({ fotos, index, onChange, onClose }: LightboxProps) {
    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 backdrop-blur-md"
            onClick={onClose}>
            <button onClick={onClose}
                className="absolute top-4 right-4 text-white/50 hover:text-white z-[210] p-2 bg-black/30 rounded-full hover:bg-black/50 transition-colors cursor-pointer">
                <X size={24} />
            </button>

            <div className="relative w-full max-w-5xl h-[85vh] flex items-center justify-center px-4"
                onClick={e => e.stopPropagation()}>
                <img src={fotos[index]} alt="Galeria"
                    className="max-w-full max-h-full object-contain shadow-2xl"
                    key={`foto-${index}`} />

                {fotos.length > 1 && (
                    <>
                        <button
                            onClick={() => onChange(index === 0 ? fotos.length - 1 : index - 1)}
                            className="absolute left-6 bg-black/50 hover:bg-[#C4A484] text-white p-3 rounded-full transition-all duration-300 cursor-pointer">
                            <ChevronLeft size={22} />
                        </button>
                        <button
                            onClick={() => onChange((index + 1) % fotos.length)}
                            className="absolute right-6 bg-black/50 hover:bg-[#C4A484] text-white p-3 rounded-full transition-all duration-300 cursor-pointer">
                            <ChevronRight size={22} />
                        </button>
                        <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2 z-[210]">
                            {fotos.map((url, i) => (
                                <button key={i} onClick={() => onChange(i)}
                                    className={`w-10 h-10 rounded overflow-hidden border-2 transition-all cursor-pointer ${i === index ? 'border-[#C4A484] scale-110' : 'border-transparent opacity-40 hover:opacity-80'}`}>
                                    <img src={url} className="w-full h-full object-cover" alt="" />
                                </button>
                            ))}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
