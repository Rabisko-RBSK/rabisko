import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { AuthRoutes } from './auth.routes';
import { AppRoutes } from './app.routes';
import { ArtistRoutes } from './artist.routes';
import { StudioRoutes } from './studio.routes';
import { useAuthStore } from '../store/authStore';
import { stompClient } from '../services/ws/stompClient';
import { supabase } from '../services/supabase';

export function Router() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const token = useAuthStore((s) => s.token);
  const role = useAuthStore((s) => s.role);
  // Tatuador dono de estúdio alterna para as telas do estúdio (Configurações).
  const modoEstudio = useAuthStore((s) => s.role === 'artista' && s.modo === 'estudio' && !!s.estudioProprioId);

  // Mantém o authStore em dia com a sessão do Supabase Auth: token renovado,
  // logout (inclusive de outra aba/expiração) e app aberto sem sessão válida —
  // ex.: aparelho que ainda guarda o token antigo do backend.
  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      const store = useAuthStore.getState();
      if (!session) {
        if (store.isAuthenticated || store.token) store.logout();
        return;
      }
      if (event === 'TOKEN_REFRESHED' || event === 'INITIAL_SESSION') {
        store.setToken(session.access_token);
      }
    });
    return () => data.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    console.log('[router] auth effect — isAuthenticated:', isAuthenticated, 'token?', !!token);
    if (isAuthenticated && token) {
      stompClient.connect(token);
    } else {
      stompClient.disconnect();
    }
  }, [isAuthenticated, token]);

  return (
    <NavigationContainer>
      {!isAuthenticated ? (
        <AuthRoutes />
      ) : role === 'artista' && !modoEstudio ? (
        <ArtistRoutes />
      ) : role === 'estudio' || modoEstudio ? (
        <StudioRoutes />
      ) : (
        <AppRoutes />
      )}
    </NavigationContainer>
  );
}

