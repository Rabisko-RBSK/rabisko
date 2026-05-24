import { useEffect, useState } from 'react';
import { Estilo, estiloService } from '../services/api/estiloService';

/**
 * Cache em memoria de processo. Catalogo de estilos:
 *  - e pequeno (~10 itens) -> manter inteiro em memoria e barato;
 *  - raramente muda -> refetch a cada cold start (sem AsyncStorage) e suficiente.
 *
 * `inFlight` coalesce chamadas simultaneas: Home e SearchResults podem
 * montar perto uma da outra; sem isso teriamos 2 requests pro mesmo dado.
 */
let cache: Estilo[] | null = null;
let inFlight: Promise<Estilo[]> | null = null;

async function loadEstilos(): Promise<Estilo[]> {
  if (cache) return cache;
  if (!inFlight) {
    inFlight = estiloService
      .listar()
      .then((data) => {
        cache = data;
        return data;
      })
      .finally(() => {
        inFlight = null;
      });
  }
  return inFlight;
}

interface UseEstilosResult {
  estilos: Estilo[];
  loading: boolean;
  error: string | null;
  reload: () => Promise<void>;
}

export function useEstilos(): UseEstilosResult {
  const [estilos, setEstilos] = useState<Estilo[]>(cache ?? []);
  const [loading, setLoading] = useState<boolean>(!cache);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelado = false;
    if (cache) {
      // ja temos cache; nada a fazer.
      setLoading(false);
      return () => {
        cancelado = true;
      };
    }
    setLoading(true);
    loadEstilos()
      .then((data) => {
        if (!cancelado) setEstilos(data);
      })
      .catch((err) => {
        if (cancelado) return;
        console.warn('[useEstilos] falha ao carregar catalogo', err?.message);
        setError('Nao foi possivel carregar a lista de estilos.');
      })
      .finally(() => {
        if (!cancelado) setLoading(false);
      });
    return () => {
      cancelado = true;
    };
  }, []);

  const reload = async () => {
    cache = null;
    setLoading(true);
    setError(null);
    try {
      const data = await loadEstilos();
      setEstilos(data);
    } catch (err: any) {
      console.warn('[useEstilos] falha ao recarregar', err?.message);
      setError('Nao foi possivel carregar a lista de estilos.');
    } finally {
      setLoading(false);
    }
  };

  return { estilos, loading, error, reload };
}
