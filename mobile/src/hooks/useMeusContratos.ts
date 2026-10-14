import { useCallback, useEffect, useState } from 'react';
import { ContratoDTO, artistService } from '../services/api/artistService';
import { ContratosDoEstudio, separarContratos } from '../utils/contrato';

interface UseMeusContratosResult extends ContratosDoEstudio {
  loading: boolean;
  error: string | null;
  aceitarProposta: () => Promise<void>;
  recusarProposta: () => Promise<void>;
  reload: () => Promise<void>;
}

/**
 * Contratos do tatuador logado com o estúdio atual (GET /artist/me/contratos,
 * filtrado por `estudioId`). Sem estúdio, não busca nada. `aceitarProposta` e
 * `recusarProposta` repassam o erro pra tela e recarregam a lista no fim.
 */
export function useMeusContratos(estudioId: string | null): UseMeusContratosResult {
  const [contratos, setContratos] = useState<ContratoDTO[]>([]);
  const [loading, setLoading] = useState<boolean>(!!estudioId);
  const [error, setError] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    if (!estudioId) {
      setContratos([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      setContratos(await artistService.listarContratos());
    } catch (err: any) {
      console.warn(
        '[useMeusContratos] falha ao carregar contratos',
        err?.response?.status,
        err?.message,
      );
      setError('Não foi possível carregar seu contrato.');
      setContratos([]);
    } finally {
      setLoading(false);
    }
  }, [estudioId]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const responder = useCallback(
    async (acao: () => Promise<unknown>) => {
      try {
        await acao();
      } finally {
        await carregar();
      }
    },
    [carregar],
  );

  const aceitarProposta = useCallback(
    () => responder(artistService.aceitarPropostaContrato),
    [responder],
  );

  const recusarProposta = useCallback(
    () => responder(artistService.recusarPropostaContrato),
    [responder],
  );

  const separados = estudioId
    ? separarContratos(contratos, estudioId)
    : { ativo: null, proposta: null, historico: [] };

  return { ...separados, loading, error, aceitarProposta, recusarProposta, reload: carregar };
}
