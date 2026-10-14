import type {
  StudioAgendaItem, StudioArtistResumo, StudioDailyRevenue, StudioDashboardPeriodo,
} from './api/studioDashboardService';

export type StudioPeriod = 'current' | 'previous';

export interface StudioStyleResumo {
  name: string;
  count: number;
  percent: number;
}

/** Dados que a tela do dashboard consome. Só `styles` ainda vem do mock. */
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
}

export interface StudioArtist {
  id: string;
  name: string;
}

export interface StudioBooking {
  id: string;
  artistId: string;
  clientId: string;
  clientName: string;
  date: string;
  time: string;
  value: number;
  style: string;
  recurring: boolean;
  status: 'confirmada' | 'concluida' | 'cancelada';
}

export const studioArtists: StudioArtist[] = [
  { id: '44444444-4444-4444-4444-444444444402', name: 'Diego Fernandes' },
  { id: '44444444-4444-4444-4444-444444444403', name: 'Filipe Ribeiro' },
  { id: 'cacc1353-c691-49b4-9a66-ce4a73891f3c', name: 'João Santos' },
];

const styles = ['Realismo', 'Oriental/Japonês', 'Old School', 'Aquarela', 'Tribal'];

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
    daily, peak: daily[0], average: 0, artists: [], styles: [], bookings: [],
  };
}

// Mock usado APENAS em "Estilos mais procurados": o banco não guarda estilo por
// serviço/reserva, então não há rota para esse gráfico. O resto do dashboard
// vem de /studio/me/dashboard/** (ver useStudioDashboard).
export function createStudioDemoBookings(now: Date): StudioBooking[] {
  return (['previous', 'current'] as const).flatMap((period) => {
    const month = periodDate(period, now);
    const days = period === 'current'
      ? now.getDate()
      : new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
    const count = period === 'current' ? 86 : 77;
    const total = period === 'current' ? 32450 : 27500;
    const weights = Array.from({ length: count }, (_, index) => 250 + (index % 6) * 50);
    const weightTotal = weights.reduce((sum, value) => sum + value, 0);
    const values = weights.map((weight) => Math.floor(weight / weightTotal * total));
    values[count - 1] += total - values.reduce((sum, value) => sum + value, 0);

    return values.map((value, index) => ({
      id: `demo-${monthKey(month)}-${index}`,
      artistId: studioArtists[index % studioArtists.length].id,
      clientId: `demo-client-${index % 24}`,
      clientName: index % 2 === 0 ? 'Ana Beatriz Souza' : 'Bruno Carvalho Lima',
      date: `${monthKey(month)}-${String(1 + Math.floor(index * days / count)).padStart(2, '0')}`,
      time: `${String(9 + index % 9).padStart(2, '0')}:00`,
      value,
      style: styles[index % 10 < 4 ? 0 : index % 10 < 7 ? 1 : index % 10 - 5],
      recurring: index >= 24,
      status: 'confirmada' as const,
    }));
  });
}

export function summarizeStudioBookings(bookings: StudioBooking[], month: Date, elapsedDays: number) {
  const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const days = Math.max(1, Math.min(elapsedDays, daysInMonth));
  const prefix = monthKey(month);
  const selected = bookings.filter((booking) =>
    booking.status !== 'cancelada' && booking.date.startsWith(`${prefix}-`)
    && Number(booking.date.slice(-2)) <= days,
  );
  const daily = Array.from({ length: days }, (_, index) => ({ day: index + 1, value: 0 }));
  selected.forEach((booking) => { daily[Number(booking.date.slice(-2)) - 1].value += booking.value; });
  const revenue = daily.reduce((sum, day) => sum + day.value, 0);
  const peak = daily.reduce((best, day) => day.value > best.value ? day : best, daily[0]);
  const artists = studioArtists.map((artist) => {
    const appointments = selected.filter((booking) => booking.artistId === artist.id);
    return { ...artist, appointments: appointments.length, revenue: appointments.reduce((sum, item) => sum + item.value, 0) };
  }).sort((a, b) => b.revenue - a.revenue);
  const popularStyles = styles.map((name) => {
    const count = selected.filter((booking) => booking.style === name).length;
    return { name, count, percent: selected.length ? count / selected.length * 100 : 0 };
  }).sort((a, b) => b.count - a.count);

  return {
    revenue,
    appointments: selected.length,
    newAppointments: selected.filter((booking) => !booking.recurring).length,
    recurringAppointments: selected.filter((booking) => booking.recurring).length,
    daily, peak, average: revenue / days, artists, styles: popularStyles,
    bookings: selected.slice().sort((a, b) => b.date.localeCompare(a.date) || a.time.localeCompare(b.time)),
  };
}

export function percentageChange(current: number, previous: number): number | null {
  return previous > 0 ? Math.round((current - previous) / previous * 100) : null;
}

export function formatStudioCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}
