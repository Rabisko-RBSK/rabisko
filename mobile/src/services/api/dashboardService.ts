import api from './index';

export interface ArtistDashboard {
  chatsAbertos: number;
  valorTotalMes: string;
  totalAgendamentosMes: number;
  /** Faturamento do mês / agendamentos do mês. Null quando não há serviços no mês. */
  valorMedioServicoMes: string | null;
}


export const dashboardService = {
    async obterDashboard(): Promise<ArtistDashboard> {
        const { data } = await api.get<ArtistDashboard>('/artist/dashboard');
        return data;
    }
};

export function formatarBRL(valor: string | number): string {
  const n = typeof valor === 'string' ? parseFloat(valor) : valor;
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(n);
}
