import { useCallback, useEffect, useState } from 'react';
import { ColaboradorDTO, studioService } from '../services/api/studioService';

interface UseColaboradoresResult {
  colaboradores: ColaboradorDTO[];
  loading: boolean;
  error: string | null;
  /** tatuadorId sendo removido no momento. */
  removendoId: string | null;
  remover: (tatuadorId: string) => Promise<void>;
  reload: () => Promise<void>;
}

/**
 * Equipe do estúdio logado (GET /studio/me/colaboradores). `remover` repassa
 * o erro pra tela decidir a mensagem e recarrega a lista no fim.
 */
export function useColaboradores(): UseColaboradoresResult {
  const [colaboradores, setColaboradores] = useState<ColaboradorDTO[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [removendoId, setRemovendoId] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await studioService.listarColaboradores();
      setColaboradores(data);
    } catch (err: any) {
      console.warn(
        '[useColaboradores] falha ao carregar equipe',
        err?.response?.status,
        err?.message,
      );
      setError('Não foi possível carregar sua equipe.');
      setColaboradores([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const remover = useCallback(
    async (tatuadorId: string) => {
      setRemovendoId(tatuadorId);
      try {
        await studioService.removerColaborador(tatuadorId);
      } finally {
        setRemovendoId(null);
        await carregar();
      }
    },
    [carregar],
  );

  return { colaboradores, loading, error, removendoId, remover, reload: carregar };
}
