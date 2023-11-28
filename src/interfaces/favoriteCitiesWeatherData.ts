import type { FavoriteCitiesCurrentWeather } from './favoriteCitiesCurrentWeather'
import type { FavoriteCitiesLocation } from './favoriteCitiesLocation'

export interface FavoriteCitiesWeatherData {
  location: FavoriteCitiesLocation
  current: FavoriteCitiesCurrentWeather
}
