import type { Quarto, TarifaSazonal, Bloqueio } from './types';

export const POLITICA_LABEL: Record<string, string> = {
    FLEXIVEL: 'Flexível', MODERADA: 'Moderada',
    LIMITADA: 'Limitada', RIGOROSA: 'Rigorosa',
};

/** true se Sexta(5), Sábado(6) ou Domingo(0) */
export function isFimDeSemana(dateStr: string): boolean {
    if (!dateStr) return false;
    return [0, 5, 6].includes(new Date(dateStr + 'T12:00:00').getDay());
}

export function getSemanaBase(quartos: Quarto[], quartoId: string): number {
    const q = quartos.find(x => x.id === quartoId);
    if (!q) return 0;
    return Number(q.tarifa_semana ?? q.preco_base) || 0;
}

export function getFdsBase(quartos: Quarto[], quartoId: string): number {
    const q = quartos.find(x => x.id === quartoId);
    if (!q) return 0;
    return Number(q.tarifa_fds ?? q.preco_base) || 0;
}

export function euroToPercent(euro: number, base: number): number {
    if (!base) return 0;
    return Math.round((euro / base) * 10000) / 100;
}

export function percentToEuro(pct: number, base: number): number {
    return Math.round((pct / 100) * base * 100) / 100;
}

export function fmtDate(d: string): string {
    return new Date(d + 'T00:00:00').toLocaleDateString('pt-PT', {
        day: '2-digit', month: 'short', year: 'numeric',
    });
}

export function nomeQuarto(item: TarifaSazonal | Bloqueio): string {
    return (item.quarto || (item as any).Quarto)?.nome || '—';
}
