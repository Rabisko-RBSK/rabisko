import { useCallback, useEffect, useState } from 'react';
import { ConviteDetalheDTO } from '../services/api/artistService';
import { studioService } from '../services/api/studioService';

interface UseConvitesEstudioResult {
  convites: ConviteDetalheDTO[];
  loading: boolean;
  error: string | null;
  /** conviteId sendo cancelado no momento. */
  cancelandoId: string | null;
  cancelar: (conviteId: string) => Promise<void>;
  reload: () => Promise<void>;
}

/**
 * Convites pendentes enviados pelo estúdio logado (GET /studio/me/convites).
 * `cancelar` repassa o erro pra tela e recarrega a lista no fim — o convite
 * pode ter sido aceito/recusado pelo tatuador nesse meio-tempo.
 */
export function useConvitesEstudio(): UseConvitesEstudioResult {
  const [convites, setConvites] = useState<ConviteDetalheDTO[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [cancelandoId, setCancelandoId] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await studioService.listarConvites();
      setConvites(data);
    } catch (err: any) {
      console.warn(
        '[useConvitesEstudio] falha ao carregar convites',
        err?.response?.status,
        err?.message,
      );
      setError('Não foi possível carregar os convites enviados.');
      setConvites([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const cancelar = useCallback(
    async (conviteId: string) => {
      setCancelandoId(conviteId);
      try {
        await studioService.cancelarConvite(conviteId);
      } finally {
        setCancelandoId(null);
        await carregar();
      }
    },
    [carregar],
  );

  return { convites, loading, error, cancelandoId, cancelar, reload: carregar };
}
