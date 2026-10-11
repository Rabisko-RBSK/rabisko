import api from './index';

/**
 * Rotas `/studio/me/dashboard/**` — cada uma alimenta um card/gráfico do
 * dashboard do estúdio. Todas recebem o período (YYYY-MM-DD, inclusivo,
 * horário de Brasília) e devolvem o mesmo formato usado pela tela.
 * Valores são "contratados" (servicos.valor_total), agrupados pela data de
 * criação do serviço; a agenda usa a data da sessão.
 */
export interface StudioDashboardPeriodo {
  startDate: string;
  endDate: string;
}

export interface StudioDailyRevenue {
  day: number;
  value: number;
}

export interface StudioReceitaTotal {
  revenue: number;
  daily: StudioDailyRevenue[];
}

export interface StudioAgendamentos {
  appointments: number;
  newAppointments: number;
  recurringAppointments: number;
}

export interface StudioEvolucaoReceita {
  daily: StudioDailyRevenue[];
  peak: StudioDailyRevenue;
  average: number;
}

export interface StudioArtistResumo {
  id: string;
  name: string;
  appointments: number;
  revenue: number;
}

export type StudioSessaoStatus = 'agendada' | 'confirmada' | 'em_andamento' | 'concluida' | 'no_show';

/** Sessão da agenda. Não há estilo por sessão no banco, então não vem `style`. */
export interface StudioAgendaItem {
  id: string;
  artistId: string;
  clientId: string;
  clientName: string;
  date: string;
  time: string;
  value: number;
  recurring: boolean;
  status: StudioSessaoStatus;
}

export const studioDashboardService = {
  async receitaTotal(params: StudioDashboardPeriodo): Promise<StudioReceitaTotal> {
    const { data } = await api.get<StudioReceitaTotal>('/studio/me/dashboard/receita-total', { params });
    return data;
  },

  async agendamentos(params: StudioDashboardPeriodo): Promise<StudioAgendamentos> {
    const { data } = await api.get<StudioAgendamentos>('/studio/me/dashboard/agendamentos', { params });
    return data;
  },

  async evolucaoReceita(params: StudioDashboardPeriodo): Promise<StudioEvolucaoReceita> {
    const { data } = await api.get<StudioEvolucaoReceita>('/studio/me/dashboard/evolucao-receita', { params });
    return data;
  },

  async tatuadores(params: StudioDashboardPeriodo): Promise<StudioArtistResumo[]> {
    const { data } = await api.get<StudioArtistResumo[]>('/studio/me/dashboard/tatuadores', { params });
    return data;
  },

  async agenda(params: StudioDashboardPeriodo): Promise<StudioAgendaItem[]> {
    const { data } = await api.get<StudioAgendaItem[]>('/studio/me/dashboard/agenda', { params });
    return data;
  },
};
