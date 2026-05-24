import { useCallback, useEffect, useState } from 'react';
import { ArtistDashboard, dashboardService } from '../services/api/dashboardService';

interface UseArtistDashboardResult {
  dashboard: ArtistDashboard | null;
  loading: boolean;
  error: string | null;
  reload: () => Promise<void>;
}

/**
 * Carrega as métricas do dashboard do tatuador logado (chats abertos, etc.)
 * do backend (GET /artist/dashboard). Estados de loading/erro tratados aqui
 * pra que a tela só consuma `dashboard`, `loading` e `error` sem lógica
 * própria. `reload` permite refresh manual (pull-to-refresh, retry).
 *
 * Espelha o padrão de useArtistProfile — mantém consistência entre hooks
 * de dados do tatuador.
 */
export function useArtistDashboard(): UseArtistDashboardResult {
  const [dashboard, setDashboard] = useState<ArtistDashboard | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await dashboardService.obterDashboard();
      setDashboard(data);
    } catch (err: any) {
      console.warn(
        '[useArtistDashboard] falha ao carregar dashboard',
        err?.response?.status,
        err?.message,
      );
      setError('Não foi possível carregar o dashboard.');
      setDashboard(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  return { dashboard, loading, error, reload: carregar };
}
