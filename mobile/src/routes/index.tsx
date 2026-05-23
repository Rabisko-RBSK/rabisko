import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { AuthRoutes } from './auth.routes';
import { AppRoutes } from './app.routes';
import { ArtistRoutes } from './artist.routes';
import { useAuthStore } from '../store/authStore';

/**
 * Raiz da navegação. Decide a árvore de rotas a partir do authStore:
 *  - não autenticado            -> AuthRoutes (login / cadastro)
 *  - autenticado + role artista -> ArtistRoutes (abas do tatuador)
 *  - autenticado (demais roles) -> AppRoutes   (abas do cliente)
 *
 * O `role` já é hidratado no login/cadastro (LoginScreen/RegisterScreen
 * chamam `setRole(backendRoleToFront(me.role))`) e persiste via Zustand —
 * num cold start o usuário cai direto no fluxo certo. `estudio` ainda não
 * tem fluxo próprio: por ora cai no fluxo do cliente.
 */
export function Router() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const role = useAuthStore((s) => s.role);

  return (
    <NavigationContainer>
      {!isAuthenticated ? (
        <AuthRoutes />
      ) : role === 'artista' ? (
        <ArtistRoutes />
      ) : (
        <AppRoutes />
      )}
    </NavigationContainer>
  );
}
