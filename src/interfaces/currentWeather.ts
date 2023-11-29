export interface CurrentWeather {
  temp_c: number
  feelslike_c: number
  last_updated: string
  condition: {
    text: string
    icon: string
  }
  wind_kph: number
  is_day: number
  wind_dir: string
  air_quality: {
    'us-epa-index': number
  }
  humidity: number
}
