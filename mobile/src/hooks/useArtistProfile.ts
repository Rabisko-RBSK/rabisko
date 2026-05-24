import { useCallback, useEffect, useState } from 'react';
import { ArtistProfile, artistService } from '../services/api/artistService';

interface UseArtistProfileResult {
  profile: ArtistProfile | null;
  loading: boolean;
  error: string | null;
  reload: () => Promise<void>;
}

/**
 * Carrega o perfil do tatuador logado (nome, foto, "Sobre" e portfólio) do
 * backend. Deixa a tela pronta para consumir o banco: enquanto o endpoint
 * não existir, o hook apenas cai no estado de erro (com retry via `reload`),
 * sem quebrar a UI.
 */
export function useArtistProfile(): UseArtistProfileResult {
  const [profile, setProfile] = useState<ArtistProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await artistService.obterMeuPerfil();
      setProfile(data);
    } catch (err: any) {
      // Erros 4xx/5xx do axios viram exception. Mensagem amigável na UI —
      // o detalhe técnico fica no log do dev.
      console.warn(
        '[useArtistProfile] falha ao carregar perfil',
        err?.response?.status,
        err?.message,
      );
      setError('Não foi possível carregar seu perfil.');
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  return { profile, loading, error, reload: carregar };
}
