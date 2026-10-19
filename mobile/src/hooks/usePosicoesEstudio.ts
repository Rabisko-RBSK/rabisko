import { useCallback, useEffect, useState } from 'react';
import { studioService } from '../services/api/studioService';

interface UsePosicoesEstudioResult {
  /** Quantidade atual; null enquanto não carregou. */
  posicoes: number | null;
  loading: boolean;
  error: string | null;
  salvando: boolean;
  /** Repassa o erro pra tela decidir a mensagem (ex.: 409 ao reduzir). */
  salvar: (novaQuantidade: number) => Promise<void>;
  reload: () => Promise<void>;
}

/** Posições de atendimento do estúdio logado (GET/PATCH /studio/me). */
export function usePosicoesEstudio(): UsePosicoesEstudioResult {
  const [posicoes, setPosicoes] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [salvando, setSalvando] = useState<boolean>(false);

  /** Só altera estado depois da resposta (o efeito inicial não marca loading de novo). */
  const buscar = useCallback(
    () =>
      studioService
        .meuEstudio()
        .then((estudio) => {
          setPosicoes(estudio.posicoes);
          setError(null);
        })
        .catch((err: any) => {
          console.warn('[usePosicoesEstudio] falha ao carregar', err?.response?.status, err?.message);
          setError('Não foi possível carregar as posições do estúdio.');
        })
        .finally(() => setLoading(false)),
    [],
  );

  useEffect(() => {
    buscar();
  }, [buscar]);

  const reload = useCallback(async () => {
    setLoading(true);
    await buscar();
  }, [buscar]);

  const salvar = useCallback(
    async (novaQuantidade: number) => {
      if (novaQuantidade === posicoes) return; // nada a alterar
      setSalvando(true);
      try {
        const estudio = await studioService.atualizarPosicoes(novaQuantidade);
        setPosicoes(estudio.posicoes);
      } finally {
        setSalvando(false);
      }
    },
    [posicoes],
  );

  return { posicoes, loading, error, salvando, salvar, reload };
}
