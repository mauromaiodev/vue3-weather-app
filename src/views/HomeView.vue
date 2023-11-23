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
    </section>

    <button @click="getCurrentLocation" :disabled="loading">Atualizar Localização</button>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'

interface WeatherData {
  location: {
    name: string
    region: string
    country: string
  }
  current: {
    temp_c: number
    condition: {
      text: string
    }
  }
}

const apiKey = '687b52386fd944d696a195406232311'
const apiUrl = 'https://api.weatherapi.com/v1/current.json'
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
  }, 1000) // Atraso de 1 segundo
}

const fetchWeatherData = async (latitude: number, longitude: number) => {
  try {
    const response = await fetch(`${apiUrl}?key=${apiKey}&q=${latitude},${longitude}&lang=pt`)
    const data = await response.json()
    console.log('Dados do clima recebidos com sucesso:', data)
    weatherData.value = data
  } catch (error: any) {
    console.error('Erro ao obter dados do clima:', error.message)
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
/* Estilos conforme necessário */
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
