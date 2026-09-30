import { useCallback, useEffect, useState } from 'react';
import { ConviteDetalheDTO, artistService } from '../services/api/artistService';

interface UseConvitesResult {
  convites: ConviteDetalheDTO[];
  loading: boolean;
  error: string | null;
  /** conviteId sendo aceito/recusado no momento (desabilita os botões). */
  respondendoId: string | null;
  aceitar: (conviteId: string) => Promise<void>;
  recusar: (conviteId: string) => Promise<void>;
  reload: () => Promise<void>;
}

/**
 * Convites de estúdio pendentes do tatuador logado (GET /artist/me/convites).
 * `aceitar` e `recusar` repassam o erro pra tela decidir a mensagem, e
 * recarregam a lista no fim — ao aceitar, o backend cancela os outros
 * convites pendentes, então a lista sempre vem do servidor.
 */
export function useConvites(): UseConvitesResult {
  const [convites, setConvites] = useState<ConviteDetalheDTO[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [respondendoId, setRespondendoId] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await artistService.listarConvites();
      setConvites(data);
    } catch (err: any) {
      console.warn(
        '[useConvites] falha ao carregar convites',
        err?.response?.status,
        err?.message,
      );
      setError('Não foi possível carregar seus convites.');
      setConvites([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const responder = useCallback(
    async (conviteId: string, acao: (id: string) => Promise<unknown>) => {
      setRespondendoId(conviteId);
      try {
        await acao(conviteId);
      } finally {
        setRespondendoId(null);
        await carregar();
      }
    },
    [carregar],
  );

  const aceitar = useCallback(
    (conviteId: string) => responder(conviteId, artistService.aceitarConvite),
    [responder],
  );

  const recusar = useCallback(
    (conviteId: string) => responder(conviteId, artistService.recusarConvite),
    [responder],
  );

  return {
    convites,
    loading,
    error,
    respondendoId,
    aceitar,
    recusar,
    reload: carregar,
  };
}
