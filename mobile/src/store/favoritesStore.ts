import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface FavoriteArtist {
  id: string;
  name: string;
  photo?: string | null;
  rating?: string | number;
  tags?: string[];
  endereco?: string | null;
}

interface FavoritesState {
  favorites: FavoriteArtist[];
  addFavorite: (artist: FavoriteArtist) => void;
  removeFavorite: (id: string) => void;
  toggleFavorite: (artist: FavoriteArtist) => void;
  isFavorite: (id: string) => boolean;
}

export const useFavoritesStore = create<FavoritesState>()(
  persist(
    (set, get) => ({
      favorites: [],
      addFavorite: (artist) =>
        set((state) => {
          if (state.favorites.some((f) => f.id === artist.id)) return state;
          return { favorites: [...state.favorites, artist] };
        }),
      removeFavorite: (id) =>
        set((state) => ({
          favorites: state.favorites.filter((f) => f.id !== id),
        })),
      toggleFavorite: (artist) =>
        set((state) => {
          const exists = state.favorites.some((f) => f.id === artist.id);
          return {
            favorites: exists
              ? state.favorites.filter((f) => f.id !== artist.id)
              : [...state.favorites, artist],
          };
        }),
      isFavorite: (id) => get().favorites.some((f) => f.id === id),
    }),
    {
      name: 'rabisko-favorites-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
