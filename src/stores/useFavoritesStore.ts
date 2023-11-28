import { defineStore } from 'pinia'

interface FavoritesState {
  favoriteCities: {
    city: string
    region: string
    country: string
    temp_c: number
    lat: number
    lon: number
  }[]
}

export const useFavoritesStore = defineStore('favorites', {
  state: (): FavoritesState => ({
    favoriteCities: []
  }),

  actions: {
    toggleFavoriteCity(cityData: {
      city: string
      region: string
      country: string
      temp_c: number
      lat: number
      lon: number
    }): void {
      const { city, region, country, temp_c, lat, lon } = cityData
      const isFavorite = this.isCityFavorite(city)

      if (isFavorite) {
        this.favoriteCities = this.favoriteCities.filter(
          (favoriteCity) => favoriteCity.city !== city
        )
      } else {
        this.favoriteCities = [...this.favoriteCities, { city, region, country, temp_c, lat, lon }]
      }
    },

    isCityFavorite(city: string): boolean {
      return this.favoriteCities.some((favoriteCity) => favoriteCity.city === city)
    }
  }
})
