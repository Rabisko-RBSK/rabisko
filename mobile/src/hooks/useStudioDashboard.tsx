import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import {
  createStudioDemoBookings, periodDate, summarizeStudioBookings,
  percentageChange, type StudioPeriod,
} from '../services/studioDashboard';

function useStudioDashboardState() {
  const [period, setPeriod] = useState<StudioPeriod>('current');
  const [now, setNow] = useState(() => new Date());
  const refresh = useCallback(() => setNow(new Date()), []);
  const result = useMemo(() => {
    const bookings = createStudioDemoBookings(now);
    const month = periodDate(period, now);
    const days = period === 'current' ? now.getDate() : new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
    const dashboard = summarizeStudioBookings(bookings, month, days);
    const previousMonth = new Date(month.getFullYear(), month.getMonth() - 1, 1);
    const previous = summarizeStudioBookings(bookings, previousMonth, 31);
    return {
      dashboard, month,
      monthLabel: month.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }),
      revenueChange: percentageChange(dashboard.revenue, previous.revenue),
      bookingChange: percentageChange(dashboard.appointments, previous.appointments),
    };
  }, [period, now]);
  return { ...result, period, setPeriod, refresh };
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
