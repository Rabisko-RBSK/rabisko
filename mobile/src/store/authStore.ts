import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

/** Account role — matches the backend `UserRole` (CLIENT / TATUADOR / ESTUDIO) and the
 *  RoleSwitch (Cliente / Artista / Estúdio). Drives auth copy and post-login routing
 *  (cliente → cliente tabs; artista/estúdio → Dashboard, once it exists). */
export type UserRoleId = 'cliente' | 'artista' | 'estudio';

/** Telas que o tatuador dono de estúdio está usando: as de artista ou as do estúdio. */
export type ModoArtista = 'artista' | 'estudio';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  role: UserRoleId;
  /** Estúdio próprio do tatuador (contrato "dono"); habilita o modo estúdio. */
  estudioProprioId: string | null;
  modo: ModoArtista;
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  setRole: (role: UserRoleId) => void;
  setEstudioProprioId: (id: string | null) => void;
  setModo: (modo: ModoArtista) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      role: 'cliente',
      estudioProprioId: null,
      modo: 'artista',
      setUser: (user) => set({ user, isAuthenticated: !!user }),
      setToken: (token) => set({ token }),
      setRole: (role) => set({ role }),
      // Sem estúdio próprio não há modo estúdio.
      setEstudioProprioId: (estudioProprioId) =>
        set((s) => ({ estudioProprioId, modo: estudioProprioId ? s.modo : 'artista' })),
      setModo: (modo) => set({ modo }),
      logout: () =>
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          role: 'cliente',
          estudioProprioId: null,
          modo: 'artista',
        }),
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
