<template>
  <div class="container">
    <section class="weather-container" :class="{ 'day-theme': isDay, 'night-theme': !isDay }">
      <div>
        <h2 v-if="weatherData.location.name">
          {{ weatherData.location.name }}, {{ weatherData.location.region }}
        </h2>
        <button @click="getCurrentLocation" :disabled="loading">Atualizar Localização</button>
      </div>

      <div class="current-weather-container">
        <div v-if="weatherData.current.temp_c" class="current-weather-info">
          <div class="current-temp">{{ weatherData.current.temp_c }}°C</div>
          <div>
            <img
              class="current-weather-icon"
              :src="weatherData.current.condition.icon"
              alt="Weather Icon"
            />
          </div>
        </div>
      </div>

      <div class="current-weather-description">
        <div v-if="weatherData.current.feelslike_c">
          Sensação Térmica: {{ weatherData.current.feelslike_c }}°C
        </div>
        <div v-if="weatherData.current.condition.text">
          {{ weatherData.current.condition.text }}
        </div>
        <div v-if="weatherData.current.last_updated" class="last-updated">
          Atualizado
          {{ formatLastUpdated(weatherData.current.last_updated, weatherData.location.localTime) }}
        </div>
      </div>
    </section>

    <div class="main-info">
      <section class="search-container">
        <label for="cityInput">Digite o nome da cidade:</label>
        <input v-model="selectedCity" id="cityInput" type="text" @input="handleInput" />
        <ul v-if="suggestedCities.length" style="position: relative">
          <li v-for="city in suggestedCities" :key="city.name">
            <a @click="selectCity(city)">{{ city.name }}, {{ city.region }}, {{ city.country }}</a>
          </li>
        </ul>

        <button @click="getWeatherByCity">Verificar Tempo</button>
      </section>

      <div v-if="loading">Carregando...</div>

      <div class="data-container-main" v-else>
        <section>
          <div class="data-container-title">Hoje</div>

          <div class="data-container">
            <div v-if="weatherData.current.wind_kph">
              Velocidade do Vento: {{ weatherData.current.wind_kph }} km/h
            </div>
            <div v-if="weatherData.current.wind_dir">
              Direção do Vento: {{ translateWindDirection(weatherData.current.wind_dir) }}
            </div>
            <div v-if="weatherData.current.air_quality">
              Qualidade do Ar:
              {{ translateAirQuality(weatherData.current.air_quality['us-epa-index']) }}
            </div>
            <div v-if="weatherData.current.humidity">
              Umidade: {{ weatherData.current.humidity }}%
            </div>
          </div>
        </section>

        <section>
          <div class="data-container-title">Previsão por Hora</div>
          <div class="forecast-hour-container">
            <div
              v-for="forecastHour in filteredHourlyForecast"
              :key="forecastHour.time_epoch"
              class="forecast-hour-item"
            >
              <div>{{ formatHour(forecastHour.time_epoch) }}</div>
              <div>{{ forecastHour.temp_c }}°C</div>
              <div v-if="forecastHour.condition?.text">{{ forecastHour.condition.text }}</div>
              <img
                v-if="forecastHour.condition?.icon"
                class="forecast-hour-icon"
                :src="forecastHour.condition.icon"
                alt="Hourly Weather Icon"
              />
            </div>
          </div>
        </section>

        <section>
          <div class="data-container-title">Previsão da Semana</div>
          <div class="forecast-week-container">
            <div v-for="day in filteredWeekForecast" :key="day.date" class="forecast-week-item">
              <div>{{ formatDate(day.date) }}</div>
              <div>{{ day.day.avgtemp_c }}°C</div>
              <div>{{ day.day.condition.text }}</div>

              <div class="forecast-hour-container">
                <div
                  v-for="forecastHour in day.hour"
                  :key="forecastHour.time_epoch"
                  class="forecast-hour-item"
                >
                  <div>{{ formatHour(forecastHour.time_epoch) }}</div>
                  <div>{{ forecastHour.temp_c }}°C</div>
                  <div v-if="forecastHour.condition?.text">{{ forecastHour.condition.text }}</div>
                  <img
                    v-if="forecastHour.condition?.icon"
                    class="forecast-hour-icon"
                    :src="forecastHour.condition.icon"
                    alt="Hourly Weather Icon"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { formatDate } from '../helpers/formatDate'
import { formatLastUpdated } from '../helpers/formatLastUpdated'
import { translateAirQuality } from '../helpers/translateAirQuality'
import { translateWindDirection } from '../helpers/translateWindDirection'

interface Location {
  name: string
  region: string
  country: string
  localTime: string
}

interface CurrentWeather {
  temp_c: number
  feelslike_c: number
  last_updated: string
  condition: {
    text: string
    icon: string
  }
  wind_kph: number
  wind_dir: string
  air_quality: {
    'us-epa-index': number
  }
  humidity: number
}

interface Forecast {
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
      time_epoch: number
      temp_c: number
      condition?: {
        text: string
        icon: string
      }
    }[]
  }[]
}

interface WeatherData {
  location: Location
  current: CurrentWeather
  forecast: Forecast
}

interface SuggestedCity {
  name: string
  region: string
  country: string
}

const apiKey = import.meta.env.VITE_API_KEY
const currentWeatherApiUrl = 'https://api.weatherapi.com/v1/current.json'
const forecastApiUrl = 'https://api.weatherapi.com/v1/forecast.json'

const weatherData = ref<WeatherData>({
  location: {
    name: '',
    region: '',
    country: '',
    localTime: ''
  },
  current: {
    temp_c: 0,
    feelslike_c: 0,
    last_updated: '',
    condition: {
      text: '',
      icon: ''
    },
    humidity: 0,
    wind_kph: 0,
    wind_dir: '',
    air_quality: {
      'us-epa-index': 0
    }
  },
  forecast: {
    forecastday: []
  }
})

const selectedCity = ref('')
const loading = ref(false)
const suggestedCities = ref<SuggestedCity[]>([])
const error = ref<string | null>(null)
const isDay = ref(true)

onMounted(() => {
  getCurrentLocation()
})

const getCurrentLocation = () => {
  loading.value = true

  setTimeout(async () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords
          await fetchWeatherData(latitude, longitude)

          const currentHour = new Date().getHours()
          isDay.value = currentHour >= 6 && currentHour < 18
        },
        (err: GeolocationPositionError) => {
          console.error('Erro ao obter localização:', err.message)
          loading.value = false
        }
      )
    } else {
      console.error('Geolocalização não suportada no seu navegador.')
      loading.value = false
    }
  }, 1000)
}

const getWeatherByCity = async () => {
  if (selectedCity.value) {
    loading.value = true
    try {
      const [currentResponse, forecastResponse] = await Promise.all([
        fetch(`${currentWeatherApiUrl}?key=${apiKey}&q=${selectedCity.value}&lang=pt&aqi=yes`),
        fetch(`${forecastApiUrl}?key=${apiKey}&q=${selectedCity.value}&lang=pt&aqi=yes&days=4`)
      ])

      const currentData = await currentResponse.json()
      const forecastData = await forecastResponse.json()

      console.log('Dados do clima recebidos com sucesso:', currentData, forecastData)

      weatherData.value = {
        location: {
          name: currentData.location.name,
          region: currentData.location.region,
          country: currentData.location.country,
          localTime: currentData.location.localtime
        },
        current: {
          temp_c: currentData.current.temp_c,
          feelslike_c: currentData.current.feelslike_c,
          last_updated: currentData.current.last_updated,
          humidity: currentData.current.humidity,
          condition: {
            text: currentData.current.condition.text,
            icon: currentData.current.condition.icon
          },
          wind_kph: currentData.current.wind_kph,
          wind_dir: currentData.current.wind_dir,
          air_quality: {
            'us-epa-index': currentData.current.air_quality['us-epa-index']
          }
        },
        forecast: {
          forecastday: forecastData.forecast.forecastday
        }
      }

      const currentHour = new Date(currentData.location.localtime).getHours()
      isDay.value = currentHour >= 6 && currentHour < 18
    } catch (err: any) {
      console.error('Erro ao obter dados do clima:', err.message)
      error.value = err.message
    } finally {
      loading.value = false
    }
  } else {
    console.error('Digite o nome da cidade antes de verificar o tempo.')
  }
}

const fetchWeatherData = async (latitude: number, longitude: number) => {
  try {
    const [currentResponse, forecastResponse] = await Promise.all([
      fetch(`${currentWeatherApiUrl}?key=${apiKey}&q=${latitude},${longitude}&lang=pt&aqi=yes`),
      fetch(`${forecastApiUrl}?key=${apiKey}&q=${latitude},${longitude}&lang=pt&aqi=yes&days=4`)
    ])

    const currentData = await currentResponse.json()
    const forecastData = await forecastResponse.json()

    console.log('Dados do clima recebidos com sucesso:', currentData, forecastData)

    weatherData.value = {
      location: {
        name: currentData.location.name,
        region: currentData.location.region,
        country: currentData.location.country,
        localTime: currentData.location.localtime
      },
      current: {
        temp_c: currentData.current.temp_c,
        last_updated: currentData.current.last_updated,
        feelslike_c: currentData.current.feelslike_c,
        humidity: currentData.current.humidity,
        condition: {
          text: currentData.current.condition.text,
          icon: currentData.current.condition.icon
        },
        wind_kph: currentData.current.wind_kph,
        wind_dir: currentData.current.wind_dir,
        air_quality: {
          'us-epa-index': currentData.current.air_quality['us-epa-index']
        }
      },
      forecast: {
        forecastday: forecastData.forecast.forecastday.map((day: any) => ({
          date: day.date,
          day: {
            avgtemp_c: day.day.avgtemp_c,
            condition: {
              text: day.day.condition.text,
              icon: day.day.condition.icon
            }
          },
          hour: day.hour.map((hour: any) => ({
            time_epoch: hour.time_epoch,
            temp_c: hour.temp_c,
            condition: {
              text: hour.condition.text,
              icon: hour.condition.icon
            }
          }))
        }))
      }
    }
  } catch (err: any) {
    console.error('Erro ao obter dados do clima:', err.message)
    error.value = err.message
  } finally {
    loading.value = false
  }
}

const inputDelay = 1000
let inputTimer: ReturnType<typeof setTimeout> | null = null

const handleInput = () => {
  if (inputTimer) {
    clearTimeout(inputTimer)
  }

  inputTimer = setTimeout(searchCities, inputDelay) as any
}

const searchCities = async () => {
  if (selectedCity.value.length >= 3) {
    try {
      const response = await fetch(
        `https://api.weatherapi.com/v1/search.json?key=${apiKey}&q=${selectedCity.value}`
      )
      const data = await response.json()
      suggestedCities.value = data.map((city: SuggestedCity) => ({
        name: city.name,
        region: city.region,
        country: city.country
      }))
    } catch (err: any) {
      console.error('Erro ao buscar cidades:', err.message)
      error.value = err.message
    }
  } else {
    suggestedCities.value = []
  }
}

const selectCity = (city: SuggestedCity) => {
  selectedCity.value = `${city.name}, ${city.region}, ${city.country}`
  suggestedCities.value = []
  error.value = null
}

const getHourlyForecast = computed(() => {
  return weatherData.value.forecast.forecastday[0]?.hour || []
})

const formatHour = (timeEpoch: number) => {
  const date = new Date(timeEpoch * 1000)
  return `${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`
}

const currentIndex = computed(() => {
  const currentHour = new Date().getHours()
  return getHourlyForecast.value.findIndex((hour) => {
    const hourDate = new Date(hour.time_epoch * 1000)
    return hourDate.getHours() >= currentHour
  })
})

const filteredHourlyForecast = computed(() => {
  return getHourlyForecast.value.slice(currentIndex.value)
})

const filteredWeekForecast = computed(() => {
  const weekForecast = [...weatherData.value.forecast.forecastday]
  weekForecast.shift()
  return weekForecast
})
</script>

<style scoped>
button {
  background-color: #4caf50;
  color: white;
  padding: 10px 20px;
  font-size: 16px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
}

button:hover {
  background-color: #45a049;
}

ul {
  list-style-type: none;
  padding: 0;
  margin: 0;
  position: absolute;
  background-color: #f1f1f1;
  width: 100%;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

li {
  padding: 10px;
  border-bottom: 1px solid #ddd;
}

li a {
  text-decoration: none;
  color: #333;
  display: block;
}

li:hover {
  background-color: #ddd;
}

.main-info {
  padding: 10px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.container {
  display: flex;
  flex-direction: column;
  gap: 10px;
  text-align: center;
}

.current-temp {
  font-size: 40px;
}

.data-container-main {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.weather-container {
  padding: 10px 0px;
  display: flex;
  flex-direction: column;
}
.current-weather-container {
  display: flex;
  justify-content: center;
}

.current-weather-info {
  display: flex;
  flex-direction: row;
  gap: 20px;
}

.current-weather-description {
  font-size: 13px;
}

.current-weather-icon {
  width: 64px;
  height: 64px;
}

.data-container-title {
  display: flex;
  font-size: 20px;
}

.last-updated {
  font-size: 12px;
  color: #f3f1f1be;
  margin-top: 12px;
}

.search-container {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.data-container {
  display: flex;
  flex-direction: column;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 5px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.forecast-week-container {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.forecast-week-item {
  display: flex;
  flex-direction: column;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 5px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.forecast-hour-container {
  display: flex;
  overflow-x: auto;
  gap: 8px;
}

.forecast-hour-item {
  min-width: 100px;
  flex: 1 1 auto;
  padding: 5px;
  border: 1px solid #ddd;
  border-radius: 5px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.forecast-hour-icon {
  width: 30px;
  height: 30px;
}

.day-theme {
  background-color: #5d9be5;
  transition:
    background-color 0.5s ease,
    color 0.5s ease;
}

.night-theme {
  background-color: #44296a;
  transition:
    background-color 0.5s ease,
    color 0.5s ease;
}
</style>
