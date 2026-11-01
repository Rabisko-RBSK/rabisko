import { useCallback, useEffect, useState } from 'react';
import { HorarioDTO, artistService } from '../services/api/artistService';
import { studioService } from '../services/api/studioService';
import { normalizarGrade } from '../utils/horario';

interface UseHorariosResult {
  horarios: HorarioDTO[];
  loading: boolean;
  error: string | null;
  reload: () => Promise<void>;
}

/**
 * Grade de atendimento: do estúdio logado (sem `tatuadorId`) ou do estúdio
 * onde um tatuador atende (perfil público). Lista vazia = sem restrição.
 */
export function useHorarios(tatuadorId?: string): UseHorariosResult {
  const [horarios, setHorarios] = useState<HorarioDTO[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = tatuadorId
        ? await artistService.horariosDoTatuador(tatuadorId)
        : await studioService.meusHorarios();
      setHorarios(normalizarGrade(data));
    } catch (err: any) {
      console.warn('[useHorarios] falha ao carregar horários', err?.response?.status, err?.message);
      setError('Não foi possível carregar os horários.');
      setHorarios([]);
    } finally {
      setLoading(false);
    }
  }, [tatuadorId]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  return { horarios, loading, error, reload: carregar };
}
