export interface Quarto {
    id: string;
    nome: string;
    tipo: string;
    descricao: string;
    capacidade: number;
    preco_base: number;
    tarifa_semana?: number;
    tarifa_fds?: number;
    fotos: string;
    comodidades: string;
    video_url?: string;
    ical_url: string;
    ativo: boolean;
    minima_estadia_padrao: number;
}

export interface FotoObj {
    url: string;
    category: string;
    isMain: boolean;
}

export interface Comodidade {
    id: string;
    nome: string;
    categoria: string;
    icone: string;
}
