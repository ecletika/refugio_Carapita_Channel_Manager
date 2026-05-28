import type { FotoObj } from './types';

export const EDGE_URL = 'https://vuidkeygtxfbgxvmilya.supabase.co/functions/v1';

export const CAT_LABELS: Record<string, string> = {
    'Camas & Quartos': 'Camas & Quartos',
    'Sala de estar':   'Sala de Estar',
    'Espaço & Área':   'Espaço & Área',
    'Comodidades':     'Comodidades',
    'Casa de Banho':   'Casa de Banho',
    'Serviços':        'Serviços',
    'Políticas':       'Políticas',
};

export const DEFAULT_CATS = [
    'Camas & Quartos', 'Sala de estar', 'Espaço & Área',
    'Comodidades', 'Casa de Banho', 'Serviços', 'Políticas',
];

export function parseFotos(fotos: string | undefined): FotoObj[] {
    if (!fotos) return [];
    try {
        const parsed = JSON.parse(fotos);
        if (Array.isArray(parsed)) {
            return parsed.map((item, i) =>
                typeof item === 'string'
                    ? { url: item, category: 'Quarto', isMain: i === 0 }
                    : { ...item, category: item.category || 'Quarto', isMain: item.isMain || false }
            );
        }
        return [{ url: fotos, category: 'Quarto', isMain: true }];
    } catch { return fotos ? [{ url: fotos, category: 'Quarto', isMain: true }] : []; }
}

export function parseComodidades(c: string | undefined): string[] {
    if (!c) return [];
    try { return JSON.parse(c); } catch { return []; }
}

export function serializeFotos(arr: FotoObj[]): string {
    return JSON.stringify(arr);
}

export function normalize(s: string): string {
    return s.trim().toLowerCase();
}
