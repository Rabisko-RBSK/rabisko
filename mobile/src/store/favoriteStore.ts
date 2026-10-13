import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface FavoriteArtist {
  id: string;
  name: string;
  photo?: string | null;
  rating?: number | string | null;
  tags?: string[];
  address?: string | null;
}

interface FavoriteState {
  favorites: FavoriteArtist[];
  toggleFavorite: (artist: FavoriteArtist) => void;
  isFavorite: (id: string) => boolean;
  removeFavorite: (id: string) => void;
  clearFavorites: () => void;
}

export const useFavoriteStore = create<FavoriteState>()(
  persist(
    (set, get) => ({
      favorites: [],
      toggleFavorite: (artist) => {
        const current = get().favorites;
        const exists = current.some((f) => f.id === artist.id);
        if (exists) {
          set({ favorites: current.filter((f) => f.id !== artist.id) });
        } else {
          set({ favorites: [...current, artist] });
        }
      },
      isFavorite: (id) => get().favorites.some((f) => f.id === id),
      removeFavorite: (id) => {
        set({ favorites: get().favorites.filter((f) => f.id !== id) });
      },
      clearFavorites: () => set({ favorites: [] }),
    }),
    {
      name: 'rabisko-favorites',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
