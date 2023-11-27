import { defineStore } from 'pinia'

interface FavoritesState {
  favoriteCities: { city: string; temp_c: number }[]
}

export const useFavoritesStore = defineStore('favorites', {
  state: (): FavoritesState => ({
    favoriteCities: []
  }),

  actions: {
    toggleFavoriteCity(cityData: { city: string; temp_c: number }): void {
      const { city, temp_c } = cityData
      const isFavorite = this.isCityFavorite(city)

      if (isFavorite) {
        this.favoriteCities = this.favoriteCities.filter(
          (favoriteCity) => favoriteCity.city !== city
        )
      } else {
        this.favoriteCities = [...this.favoriteCities, { city, temp_c }]
      }
    },

    isCityFavorite(city: string): boolean {
      return this.favoriteCities.some((favoriteCity) => favoriteCity.city === city)
    }
  }
})
