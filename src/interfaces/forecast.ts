export interface Forecast {
  forecastday: {
    date: string
    day: {
      avgtemp_c: number
      condition: {
        text: string
        icon: string
      }
    }
    hour: {
      time: string
      temp_c: number
      condition?: {
        text: string
        icon: string
      }
    }[]
  }[]
}
