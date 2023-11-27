import { defineStore } from 'pinia'

interface FavoritesState {
  favoriteCities: string[]
}

export const useFavoritesStore = defineStore('favorites', {
  state: (): FavoritesState => ({
    favoriteCities: []
  }),

  actions: {
    toggleFavoriteCity(city: string): void {
      if (this.isCityFavorite(city)) {
        this.favoriteCities = this.favoriteCities.filter((favoriteCity) => favoriteCity !== city)
      } else {
        this.favoriteCities = [...this.favoriteCities, city]
      }
    },

    isCityFavorite(city: string): boolean {
      return this.favoriteCities.includes(city)
    }
  }
})
