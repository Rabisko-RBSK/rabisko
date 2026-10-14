import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  createStudioDemoBookings, emptyStudioDashboard, monthRange, percentageChange, periodDate, periodDays,
  summarizeStudioBookings, type StudioDashboard, type StudioPeriod,
} from '../services/studioDashboard';
import { studioDashboardService } from '../services/api/studioDashboardService';

interface StudioDashboardData {
  dashboard: Omit<StudioDashboard, 'styles'>;
  previousRevenue: number;
  previousAppointments: number;
}

/**
 * Carrega o dashboard do estúdio logado das rotas /studio/me/dashboard/**.
 * Período: mês atual até hoje, ou o mês anterior inteiro. A variação
 * "vs mês anterior" compara com o mês inteiro antes do período.
 * "Estilos mais procurados" continua com dados de demonstração (sem dados no banco).
 */
function useStudioDashboardState() {
  const [period, setPeriod] = useState<StudioPeriod>('current');
  const [now, setNow] = useState(() => new Date());
  const [data, setData] = useState<StudioDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const refresh = useCallback(() => setNow(new Date()), []);

  const month = useMemo(() => periodDate(period, now), [period, now]);
  const days = periodDays(period, now);
  const styles = useMemo(
    () => summarizeStudioBookings(createStudioDemoBookings(now), month, days).styles,
    [now, month, days],
  );

  useEffect(() => {
    let active = true;
    const range = monthRange(month, days);
    const previousRange = monthRange(new Date(month.getFullYear(), month.getMonth() - 1, 1));
    // A agenda pega o mês inteiro para incluir as sessões futuras.
    const agendaRange = monthRange(month);
    setLoading(true);
    setError(null);
    Promise.all([
      studioDashboardService.agendamentos(range),
      studioDashboardService.receitaTotal(range),
      studioDashboardService.evolucaoReceita(range),
      studioDashboardService.tatuadores(range),
      studioDashboardService.agenda(agendaRange),
      studioDashboardService.receitaTotal(previousRange),
      studioDashboardService.agendamentos(previousRange),
    ])
      .then(([agendamentos, receita, evolucao, artists, bookings, previousReceita, previousAgendamentos]) => {
        if (!active) return;
        setData({
          dashboard: { ...agendamentos, ...receita, ...evolucao, artists, bookings },
          previousRevenue: previousReceita.revenue,
          previousAppointments: previousAgendamentos.appointments,
        });
      })
      .catch((err: any) => {
        if (!active) return;
        console.warn('[useStudioDashboard] falha ao carregar dashboard', err?.response?.status, err?.message);
        setError('Não foi possível carregar o dashboard.');
        setData(null);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [month, days]);

  const result = useMemo(() => {
    const dashboard: StudioDashboard = { ...(data?.dashboard ?? emptyStudioDashboard(days)), styles };
    return {
      dashboard, month,
      monthLabel: month.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }),
      revenueChange: data ? percentageChange(dashboard.revenue, data.previousRevenue) : null,
      bookingChange: data ? percentageChange(dashboard.appointments, data.previousAppointments) : null,
    };
  }, [data, days, styles, month]);
  return { ...result, period, setPeriod, refresh, loading, error };
}

const StudioDashboardContext = createContext<ReturnType<typeof useStudioDashboardState> | null>(null);

export function StudioDashboardProvider({ children }: { children: React.ReactNode }) {
  const value = useStudioDashboardState();
  return <StudioDashboardContext.Provider value={value}>{children}</StudioDashboardContext.Provider>;
}

export function useStudioDashboard() {
  const value = useContext(StudioDashboardContext);
  if (!value) throw new Error('StudioDashboardProvider não encontrado.');
  return value;
}
