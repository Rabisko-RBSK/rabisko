import { useCallback, useEffect, useState } from 'react';
import { Avaliacao, avaliacaoService } from '../services/api/avaliacaoService';

interface UseAvaliacoesResult {
  avaliacoes: Avaliacao[];
  loading: boolean;
  error: string | null;
  /** Média das notas (1–5), ou null enquanto não há avaliações carregadas. */
  notaMedia: number | null;
  /** Total de avaliações carregadas. */
  total: number;
  reload: () => Promise<void>;
}

/**
 * Carrega as avaliações de um tatuador a partir do backend. Deixa a tela de
 * perfil pronta para consumir o banco: enquanto o endpoint não existir o hook
 * apenas cai no estado de erro (com retry via `reload`), sem quebrar a UI.
 *
 * `tatuadorId` indefinido (ex.: usuário sem sessão) não dispara request —
 * o hook fica ocioso, sem loading nem erro.
 */
export function useAvaliacoes(tatuadorId: string | undefined): UseAvaliacoesResult {
  const [avaliacoes, setAvaliacoes] = useState<Avaliacao[]>([]);
  const [loading, setLoading] = useState<boolean>(!!tatuadorId);
  const [error, setError] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    if (!tatuadorId) {
      setAvaliacoes([]);
      setLoading(false);
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await avaliacaoService.listarPorTatuador(tatuadorId);
      setAvaliacoes(data);
    } catch (err: any) {
      console.warn(
        '[useAvaliacoes] falha ao carregar avaliações',
        err?.response?.status,
        err?.message,
      );
      setError('Não foi possível carregar as avaliações.');
      setAvaliacoes([]);
    } finally {
      setLoading(false);
    }
  }, [tatuadorId]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const total = avaliacoes.length;
  const notaMedia =
    total > 0 ? avaliacoes.reduce((soma, a) => soma + a.nota, 0) / total : null;

  return { avaliacoes, loading, error, notaMedia, total, reload: carregar };
}
