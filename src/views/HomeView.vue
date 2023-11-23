<template>
  <div>
    <h1>Previsão do Tempo</h1>

    <div>
      <label for="cityInput">Digite o nome da cidade:</label>
      <input v-model="selectedCity" id="cityInput" type="text" @input="searchCities" />
      <button @click="getWeatherByCity">Verificar Tempo</button>

      <ul v-if="suggestedCities.length" style="width: auto">
        <li v-for="city in suggestedCities" :key="city.name">
          <a @click="selectCity(city)">{{ city.name }}, {{ city.region }}, {{ city.country }}</a>
        </li>
      </ul>
    </div>

    <p v-if="loading">Carregando...</p>

    <section v-else>
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
    </section>

    <button @click="getCurrentLocation" :disabled="loading">Atualizar Localização</button>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'

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

interface WeatherData {
  location: Location
  current: CurrentWeather
}

interface SuggestedCity {
  name: string
  region: string
  country: string
}

const apiKey = '687b52386fd944d696a195406232311'
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
      const response = await fetch(
        `${forecastApiUrl}?key=${apiKey}&q=${selectedCity.value}&lang=pt&days=1&aqi=yes`
      )
      const data = await response.json()
      console.log('Dados do clima recebidos com sucesso:', data)
      weatherData.value = {
        location: {
          name: data.location.name,
          region: data.location.region,
          country: data.location.country
        },
        current: {
          temp_c: data.current.temp_c,
          condition: {
            text: data.current.condition.text,
            icon: data.current.condition.icon
          },
          wind_kph: data.current.wind_kph,
          wind_dir: data.current.wind_dir,
          air_quality: {
            'us-epa-index': data.current.air_quality['us-epa-index']
          }
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
    const response = await fetch(
      `${forecastApiUrl}?key=${apiKey}&q=${latitude},${longitude}&lang=pt&days=1&aqi=yes`
    )
    const data = await response.json()
    console.log('Dados do clima recebidos com sucesso:', data)
    weatherData.value = {
      location: {
        name: data.location.name,
        region: data.location.region,
        country: data.location.country
      },
      current: {
        temp_c: data.current.temp_c,
        condition: {
          text: data.current.condition.text,
          icon: data.current.condition.icon
        },
        wind_kph: data.current.wind_kph,
        wind_dir: data.current.wind_dir,
        air_quality: {
          'us-epa-index': data.current.air_quality['us-epa-index']
        }
      }
    }
  } catch (err: any) {
    console.error('Erro ao obter dados do clima:', err.message)
    error.value = err.message
  } finally {
    loading.value = false
  }
}

const translateWindDirection = (windDirection: string) => {
  const directionMap: Record<string, string> = {
    N: 'Norte',
    NNE: 'Nor-Nordeste',
    NE: 'Nordeste',
    ENE: 'Leste-Nordeste',
    E: 'Leste',
    ESE: 'Leste-Sudeste',
    SE: 'Sudeste',
    SSE: 'Sul-Sudeste',
    S: 'Sul',
    SSW: 'Sul-Sudoeste',
    SW: 'Sudoeste',
    WSW: 'Oeste-Sudoeste',
    W: 'Oeste',
    WNW: 'Oeste-Noroeste',
    NW: 'Noroeste',
    NNW: 'Nor-Noroeste'
  }

  return directionMap[windDirection] || windDirection
}

const translateAirQuality = (airQuality: number) => {
  const qualityMap: Record<number, string> = {
    1: 'Boa',
    2: 'Moderada',
    3: 'Insalubre para grupos sensíveis',
    4: 'Insalubre',
    5: 'Muito insalubre',
    6: 'Perigosa'
  }

  return qualityMap[airQuality] || 'Desconhecida'
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
body {
  font-family: 'Roboto', sans-serif;
  margin: 0;
  padding: 0;
}

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
</style>
