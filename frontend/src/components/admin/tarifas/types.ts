export interface Quarto {
    id: string;
    nome: string;
    preco_base: number;
    tarifa_semana?: number;
    tarifa_fds?: number;
}

export interface TarifaSazonal {
    id: string; quarto_id: string;
    quarto?: { nome: string }; Quarto?: { nome: string };
    data_inicio: string; data_fim: string;
    preco_noite: number; preco_noite_fds?: number; motivo: string;
    politica_cancelamento: string; minima_estadia: number;
}

export interface Bloqueio {
    id: string; quarto_id: string;
    quarto?: { nome: string }; Quarto?: { nome: string };
    data_inicio: string; data_fim: string; motivo: string;
}

export type Tab = 'tarifas' | 'bloqueios';

export interface NovaTarifaState {
    quarto_id: string; data_inicio: string; data_fim: string;
    preco_noite: number; percentagem: number;
    preco_noite_fds: number; percentagem_fds: number;
    motivo: string; politica_cancelamento: string; minima_estadia: number;
}
