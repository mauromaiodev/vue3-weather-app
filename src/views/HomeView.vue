<template>
  <div>
    <h1>Previsão do Tempo</h1>

    <section class="search-container">
      <label for="cityInput">Digite o nome da cidade:</label>
      <input v-model="selectedCity" id="cityInput" type="text" @input="handleInput" />
      <button @click="getWeatherByCity">Verificar Tempo</button>

      <ul v-if="suggestedCities.length">
        <li v-for="city in suggestedCities" :key="city.name">
          <a @click="selectCity(city)">{{ city.name }}, {{ city.region }}, {{ city.country }}</a>
        </li>
      </ul>
    </section>

    <p v-if="loading">Carregando...</p>

    <section class="data-container" v-else>
      <p v-if="weatherData.location.name">
        {{ weatherData.location.name }}, {{ weatherData.location.region }},
        {{ weatherData.location.country }}
      </p>

      <div v-if="weatherData.current.temp_c">
        <img :src="weatherData.current.condition.icon" alt="Weather Icon" />
        <p>Temperatura: {{ weatherData.current.temp_c }}°C</p>
      </div>

      <p v-if="weatherData.current.condition.text">
        Condição: {{ weatherData.current.condition.text }}
      </p>
      <p v-if="weatherData.current.wind_kph">
        Velocidade do Vento: {{ weatherData.current.wind_kph }} km/h
      </p>
      <p v-if="weatherData.current.wind_dir">
        Direção do Vento: {{ translateWindDirection(weatherData.current.wind_dir) }}
      </p>
      <p v-if="weatherData.current.air_quality">
        Qualidade do Ar: {{ translateAirQuality(weatherData.current.air_quality['us-epa-index']) }}
      </p>

      <div class="forecast-container">
        <div
          v-for="forecastDay in weatherData.forecast.forecastday"
          :key="forecastDay.date"
          class="forecast-item"
        >
          <p>Data: {{ forecastDay.date }}</p>
          <p>Temp. Média: {{ forecastDay.day.avgtemp_c }}°C</p>
          <p>Condição: {{ forecastDay.day.condition.text }}</p>
          {{ console.log('Forecast Data:', forecastDay) }}
        </div>
      </div>
    </section>

    <button @click="getCurrentLocation" :disabled="loading">Atualizar Localização</button>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { translateAirQuality } from '../helpers/translateAirQuality'
import { translateWindDirection } from '../helpers/translateWindDirection'

interface Location {
  name: string
  region: string
  country: string
}

interface CurrentWeather {
  temp_c: number
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
          console.log('Localização obtida com sucesso:', latitude, longitude)
          await fetchWeatherData(latitude, longitude)
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
div {
  text-align: center;
  padding: 20px;
}

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

img {
  width: 64px;
  height: 64px;
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

.search-container {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.data-container {
  display: flex;
  flex-direction: column;
  margin-top: 10px;
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
</style>
