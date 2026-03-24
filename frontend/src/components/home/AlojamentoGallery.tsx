"use client";
import React, { useState } from 'react';

interface Room {
    id: string;
    nome: string;
    fotos: string;
}

interface AlojamentoGalleryProps {
    t: (key: string) => string;
    galleryRooms: any[];
    onInicarReserva: (quartoId: string) => void;
    parseFotos: (fotos: string | undefined) => any[];
}

export default function AlojamentoGallery({
    t,
    galleryRooms,
    onInicarReserva,
    parseFotos
}: AlojamentoGalleryProps) {
    const [activeGalleryRoom, setActiveGalleryRoom] = useState<string>(galleryRooms[0]?.id || '');
    const [activeTab, setActiveTab] = useState('Todos');

    // Sincronizar activeGalleryRoom quando os dados chegam via API
    React.useEffect(() => {
        if (!activeGalleryRoom && galleryRooms.length > 0) {
            setActiveGalleryRoom(galleryRooms[0].id);
        }
    }, [galleryRooms, activeGalleryRoom]);

    const selectedRoom = galleryRooms.find(r => r.id === activeGalleryRoom);
    const roomPhotos = selectedRoom ? parseFotos(selectedRoom.fotos) : [];
    
    const categories = ['Todos', 'Quarto', 'Cozinha', 'Sala', 'Casa de Banho', 'Exterior', 'Outros'];
    const filteredGallery = activeTab === 'Todos' ? roomPhotos : roomPhotos.filter((f: any) => f.category === activeTab);

    return (
        <section id="alojamento" className="pb-20 lg:pb-32 px-4 md:px-8 max-w-[1400px] mx-auto w-full scroll-mt-44">
            <div className="text-center mb-12 lg:mb-16">
                <a
                    href="https://rnt.turismodeportugal.pt/RNT/RNAL.aspx?nr=172760"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-carapita-gold uppercase tracking-mega text-[10px] font-semibold block mb-4 hover:underline"
                >
                    {t('alojamento_tag')}
                </a>
                <h3 className="text-3xl md:text-5xl font-serif text-white font-light mb-8 lg:mb-12">{t('alojamento_title')}</h3>

                {/* Seletor de Alojamento */}
                {galleryRooms.length > 1 && (
                    <div className="flex flex-wrap justify-center gap-2 md:gap-3 mb-8 lg:mb-10 px-2">
                        {galleryRooms.map((room) => (
                            <button
                                key={room.id}
                                onClick={() => {
                                    setActiveGalleryRoom(room.id);
                                    setActiveTab('Todos');
                                }}
                                className={`px-4 md:px-6 py-2 md:py-2.5 rounded-full text-[9px] md:text-[10px] uppercase tracking-widest font-bold transition-all border ${
                                    activeGalleryRoom === room.id 
                                        ? 'bg-carapita-gold text-white border-carapita-gold shadow-md' 
                                        : 'bg-white/5 text-white/40 border-white/10 hover:border-carapita-gold hover:text-carapita-gold'
                                }`}
                            >
                                {room.nome}
                            </button>
                        ))}
                    </div>
                )}

                {/* Abas */}
                <div className="flex overflow-x-auto hide-scrollbars md:flex-wrap justify-start md:justify-center gap-6 md:gap-12 border-b border-white/10 pb-4 max-w-3xl mx-auto px-4 snap-x">
                    {categories.map((cat) => (
                        <button
                            key={cat}
                            onClick={() => setActiveTab(cat)}
                            className={`snap-start text-[10px] md:text-xs uppercase tracking-widest font-medium pb-2 transition-all whitespace-nowrap ${
                                activeTab === cat ? 'text-carapita-gold border-b border-carapita-gold' : 'text-white/40 hover:text-white'
                            }`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            </div>

            {/* Grid de Fotos */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 animate-fade-in">
                {filteredGallery.map((img: any, idx: number) => (
                    <div key={`${img.category}-${idx}`} className="group overflow-hidden relative w-full h-80 md:h-96 bg-white/5 cursor-pointer border border-white/5 hover:border-carapita-gold/30 transition-all duration-700" onClick={() => onInicarReserva(activeGalleryRoom)}>
                        <img src={img.url} alt={`Refúgio Carapita - ${img.category}`} className="w-full h-full object-cover transform duration-[2s] ease-out group-hover:scale-105" />
                        <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-6">
                            <span className="text-white text-xs uppercase tracking-widest font-semibold drop-shadow-md">{img.category}</span>
                        </div>
                    </div>
                ))}
                {filteredGallery.length === 0 && (
                    <div className="col-span-full py-20 text-center text-white/20 uppercase tracking-widest text-[10px]">
                        Sem fotos nesta categoria
                    </div>
                )}
            </div>
        </section>
    );
}
