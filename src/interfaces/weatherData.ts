import type { CurrentWeather } from './currentWeather'
import type { Forecast } from './forecast'
import type { Location } from './location'

export interface WeatherData {
  location: Location
  current: CurrentWeather
  forecast: Forecast
}
