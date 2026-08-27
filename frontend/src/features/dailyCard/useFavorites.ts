import { useState } from 'react';
import {
  getFavorites,
  toggleFavorite,
  removeFavorite,
  type FavoriteCard,
  type MotivationPrinciple,
} from './dailyCard';

export interface UseFavoritesResult {
  favorites: FavoriteCard[];
  isFavorite: (dayNumber: number) => boolean;
  toggle: (entry: { dayNumber: number; principle: MotivationPrinciple; text: string }) => void;
  remove: (dayNumber: number) => void;
}

export function useFavorites(): UseFavoritesResult {
  const [favorites, setFavorites] = useState<FavoriteCard[]>(() => getFavorites());

  return {
    favorites,
    isFavorite: (dayNumber) => favorites.some((f) => f.dayNumber === dayNumber),
    toggle: (entry) => setFavorites(toggleFavorite(entry)),
    remove: (dayNumber) => setFavorites(removeFavorite(dayNumber)),
  };
}
