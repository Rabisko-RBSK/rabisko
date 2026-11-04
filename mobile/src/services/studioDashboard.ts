import type {
  StudioAgendaItem, StudioArtistResumo, StudioDailyRevenue, StudioDashboardPeriodo, StudioEstiloResumo,
  StudioFinanceiroLinha,
} from './api/studioDashboardService';

export type StudioPeriod = 'current' | 'previous';

export type StudioStyleResumo = StudioEstiloResumo;

/** Dados que a tela do dashboard consome, todos das rotas /studio/me/dashboard/**. */
export interface StudioDashboard {
  revenue: number;
  appointments: number;
  newAppointments: number;
  recurringAppointments: number;
  daily: StudioDailyRevenue[];
  peak: StudioDailyRevenue;
  average: number;
  artists: StudioArtistResumo[];
  styles: StudioStyleResumo[];
  bookings: StudioAgendaItem[];
  /** Resultados financeiros com a equipe: uma linha por contrato no período. */
  financeiro: StudioFinanceiroLinha[];
}

/** Totais dos cards de resultados financeiros. */
export function totaisFinanceiros(linhas: StudioFinanceiroLinha[]) {
  const soma = (filtro: (l: StudioFinanceiroLinha) => number) => linhas.reduce((total, l) => total + filtro(l), 0);
  const comissoes = soma((l) => (l.modelo === 'comissao' ? l.aReceber : 0));
  const alugueis = soma((l) => (l.modelo === 'aluguel' ? l.aReceber : 0));
  const salarios = soma((l) => l.aPagar);
  return { comissoes, alugueis, aReceber: comissoes + alugueis, aPagar: salarios, consolidado: comissoes + alugueis - salarios };
}

export function monthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

export function periodDate(period: StudioPeriod, now: Date): Date {
  return new Date(now.getFullYear(), now.getMonth() - (period === 'previous' ? 1 : 0), 1);
}

/** Dias considerados no período: até hoje no mês atual, o mês inteiro no anterior. */
export function periodDays(period: StudioPeriod, now: Date): number {
  const month = periodDate(period, now);
  return period === 'current' ? now.getDate() : new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
}

/** Do dia 1 até o dia `days` do mês (inclusivo, padrão: último dia), no formato das rotas. */
export function monthRange(month: Date, days?: number): StudioDashboardPeriodo {
  const lastDay = days ?? new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  return { startDate: `${monthKey(month)}-01`, endDate: `${monthKey(month)}-${String(lastDay).padStart(2, '0')}` };
}

export function emptyStudioDashboard(days: number): StudioDashboard {
  const daily = Array.from({ length: days }, (_, index) => ({ day: index + 1, value: 0 }));
  return {
    revenue: 0, appointments: 0, newAppointments: 0, recurringAppointments: 0,
    daily, peak: daily[0], average: 0, artists: [], styles: [], bookings: [], financeiro: [],
  };
}

export function percentageChange(current: number, previous: number): number | null {
  return previous > 0 ? Math.round((current - previous) / previous * 100) : null;
}

export function formatStudioCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}
