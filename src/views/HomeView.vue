<template>
  <div class="container">
    <section class="weather-container" :class="{ 'day-theme': isDay, 'night-theme': !isDay }">
      <h2 v-if="weatherData.location.name">
        {{ weatherData.location.name }}, {{ weatherData.location.region }}
      </h2>

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
      <p v-if="weatherData.current.condition.text">
        {{ weatherData.current.condition.text }}
      </p>
      <p v-if="weatherData.current.feelslike_c">
        Sensação Termica: {{ weatherData.current.feelslike_c }}°C
      </p>
    </section>

    <div class="search-container">
      <label for="cityInput">Digite o nome da cidade:</label>
      <input v-model="selectedCity" id="cityInput" type="text" @input="handleInput" />
      <ul v-if="suggestedCities.length" style="position: relative">
        <li v-for="city in suggestedCities" :key="city.name">
          <a @click="selectCity(city)">{{ city.name }}, {{ city.region }}, {{ city.country }}</a>
        </li>
      </ul>

      <button @click="getWeatherByCity">Verificar Tempo</button>
    </div>

    <p v-if="loading">Carregando...</p>

    <section class="data-container" v-else>
      <h3 class="data-container-title">Hoje</h3>

      <p v-if="weatherData.current.wind_kph">
        Velocidade do Vento: {{ weatherData.current.wind_kph }} km/h
      </p>
      <p v-if="weatherData.current.wind_dir">
        Direção do Vento: {{ translateWindDirection(weatherData.current.wind_dir) }}
      </p>
      <p v-if="weatherData.current.air_quality">
        Qualidade do Ar: {{ translateAirQuality(weatherData.current.air_quality['us-epa-index']) }}
      </p>
    </section>

    <section>
      <div class="forecast-container">
        <div
          v-for="forecastDay in weatherData.forecast.forecastday"
          :key="forecastDay.date"
          class="forecast-item"
        >
          <p>Data: {{ formatDate(forecastDay.date) }}</p>
          <p>Temp. Média: {{ forecastDay.day.avgtemp_c }}°C</p>
          <p>Condição: {{ forecastDay.day.condition.text }}</p>
        </div>
      </div>
    </section>

    <button @click="getCurrentLocation" :disabled="loading">Atualizar Localização</button>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { formatDate } from '../helpers/formatDate'
import { translateAirQuality } from '../helpers/translateAirQuality'
import { translateWindDirection } from '../helpers/translateWindDirection'

interface Location {
  name: string
  region: string
  country: string
}

interface CurrentWeather {
  temp_c: number
  feelslike_c: number
  condition: {
    text: string
    icon: string
  }
  wind_kph: number
  wind_dir: string
  air_quality: {
    'us-epa-index': number
  }
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
    country: ''
  },
  current: {
    temp_c: 0,
    feelslike_c: 0,
    condition: {
      text: '',
      icon: ''
    },
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
        fetch(`${forecastApiUrl}?key=${apiKey}&q=${selectedCity.value}&lang=pt&aqi=yes&days=1`)
      ])

      const currentData = await currentResponse.json()
      const forecastData = await forecastResponse.json()

      console.log('Dados do clima recebidos com sucesso:', currentData, forecastData)

      weatherData.value = {
        location: {
          name: currentData.location.name,
          region: currentData.location.region,
          country: currentData.location.country
        },
        current: {
          temp_c: currentData.current.temp_c,
          feelslike_c: currentData.current.feelslike_c,
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
      console.log('🚀 ~ currentHour:', currentHour)
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
      fetch(`${forecastApiUrl}?key=${apiKey}&q=${latitude},${longitude}&lang=pt&aqi=yes&days=1`)
    ])

    const currentData = await currentResponse.json()
    const forecastData = await forecastResponse.json()

    console.log('Dados do clima recebidos com sucesso:', currentData, forecastData)

    weatherData.value = {
      location: {
        name: currentData.location.name,
        region: currentData.location.region,
        country: currentData.location.country
      },
      current: {
        temp_c: currentData.current.temp_c,
        feelslike_c: currentData.current.feelslike_c,
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
  margin-top: 10px;
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

.container {
  display: flex;
  flex-direction: column;
  gap: 10px;
  text-align: center;
}

.current-temp {
  font-size: 40px;
}

.weather-container {
  padding: 16px 16px 0px 16px;
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

.current-weather-icon {
  width: 64px;
  height: 64px;
}

.data-container-title {
  display: flex;
  margin-bottom: 10px;
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
  margin-top: 10px;
  border: 1px solid #ddd;
  border-radius: 5px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.forecast-container {
  display: flex;
  overflow-x: auto;
}

.forecast-item {
  flex: 0 0 auto;
  width: 200px;
  padding: 10px;
  margin-right: 10px;
  border: 1px solid #ddd;
  border-radius: 5px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
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
