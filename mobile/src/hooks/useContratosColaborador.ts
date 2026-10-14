import { useCallback, useEffect, useState } from 'react';
import { ContratoDTO, ContratoInput } from '../services/api/artistService';
import { studioService } from '../services/api/studioService';
import { ContratosDoEstudio, separarContratos } from '../utils/contrato';

interface UseContratosColaboradorResult extends ContratosDoEstudio {
  loading: boolean;
  error: string | null;
  propor: (input: ContratoInput) => Promise<void>;
  retirarProposta: () => Promise<void>;
  reload: () => Promise<void>;
}

/**
 * Contratos do estúdio logado com um colaborador
 * (GET /studio/me/colaboradores/{id}/contratos). `propor` e `retirarProposta`
 * repassam o erro pra tela decidir a mensagem e recarregam a lista no fim.
 */
export function useContratosColaborador(tatuadorId: string): UseContratosColaboradorResult {
  const [contratos, setContratos] = useState<ContratoDTO[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setContratos(await studioService.historicoContratos(tatuadorId));
    } catch (err: any) {
      console.warn(
        '[useContratosColaborador] falha ao carregar contratos',
        err?.response?.status,
        err?.message,
      );
      setError('Não foi possível carregar os contratos.');
      setContratos([]);
    } finally {
      setLoading(false);
    }
  }, [tatuadorId]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const propor = useCallback(
    async (input: ContratoInput) => {
      try {
        await studioService.proporContrato(tatuadorId, input);
      } finally {
        await carregar();
      }
    },
    [tatuadorId, carregar],
  );

  const retirarProposta = useCallback(async () => {
    try {
      await studioService.cancelarPropostaContrato(tatuadorId);
    } finally {
      await carregar();
    }
  }, [tatuadorId, carregar]);

  return { ...separarContratos(contratos), loading, error, propor, retirarProposta, reload: carregar };
}
