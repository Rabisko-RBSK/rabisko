import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { KanbanCardDTO, servicosService } from '../services/api/servicosService';

export type VisaoKanban = 'tatuador' | 'estudio';

interface UseKanbanServicosResult {
  cards: KanbanCardDTO[];
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  reload: () => Promise<void>;
  refresh: () => Promise<void>;
}

/**
 * Cards do Kanban de serviços: do tatuador logado (GET /artist/me/servicos) ou
 * de toda a equipe do estúdio (GET /studio/me/servicos). Recarrega ao focar a
 * aba — as colunas dependem do horário atual e de mensagens novas.
 */
export function useKanbanServicos(visao: VisaoKanban): UseKanbanServicosResult {
  const [cards, setCards] = useState<KanbanCardDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const buscar = useCallback(async () => {
    try {
      setCards(visao === 'estudio' ? await servicosService.doEstudio() : await servicosService.doTatuador());
      setError(null);
    } catch (err: any) {
      console.warn('[useKanbanServicos] falha ao carregar serviços', err?.response?.status, err?.message);
      setError('Não foi possível carregar os serviços.');
    }
  }, [visao]);

  const reload = useCallback(async () => {
    setLoading(true);
    await buscar();
    setLoading(false);
  }, [buscar]);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    await buscar();
    setRefreshing(false);
  }, [buscar]);

  // Só o primeiro carregamento mostra o spinner; ao voltar à aba, atualiza por baixo.
  useFocusEffect(
    useCallback(() => {
      buscar().finally(() => setLoading(false));
    }, [buscar]),
  );

  return { cards, loading, refreshing, error, reload, refresh };
}
