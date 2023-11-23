<template>
  <div>
    <h1>Previsão do Tempo</h1>

    <p v-if="loading">Carregando...</p>

    <section v-else>
      <p v-if="weatherData.location.name">
        {{ weatherData.location.name }}, {{ weatherData.location.region }},
        {{ weatherData.location.country }}
      </p>
      <p v-if="weatherData.current.temp_c">Temperatura: {{ weatherData.current.temp_c }}°C</p>
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
      text: ''
    },
    wind_kph: 0,
    wind_dir: '',
    air_quality: {
      'us-epa-index': 0
    }
  }
})

const loading = ref(false)

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
        (error: GeolocationPositionError) => {
          console.error('Erro ao obter localização:', error.message)
          loading.value = false
        }
      )
    } else {
      console.error('Geolocalização não suportada no seu navegador.')
      loading.value = false
    }
  }, 1000)
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
          text: data.current.condition.text
        },
        wind_kph: data.current.wind_kph,
        wind_dir: data.current.wind_dir,
        air_quality: {
          'us-epa-index': data.current.air_quality['us-epa-index']
        }
      }
    }
  } catch (error: any) {
    console.error('Erro ao obter dados do clima:', error.message)
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
</style>
