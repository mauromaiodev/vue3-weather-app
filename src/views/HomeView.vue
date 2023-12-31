<template>
  <BaseContainer>
    <BaseSection :class="{ 'day-theme': isDay, 'night-theme': !isDay }">
      <BaseWeatherHeader>
        <div class="location-name" v-if="weatherData.location.name">
          {{ weatherData.location.name }}
        </div>
        <BaseButton @click="getCurrentLocation" :disabled="loading">
          <i class="loading-icon" v-if="loading"></i>
          Loc. Atual
        </BaseButton>
      </BaseWeatherHeader>

      <BaseWeatherHeader>
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
      </BaseWeatherHeader>

      <BaseWeatherHeader class="current-weather-description">
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
      </BaseWeatherHeader>
    </BaseSection>

    <BaseContainer class="main-info">
      <BaseContainer>
        <label for="cityInput">Digite o nome da Cidade / Estado / País:</label>
        <input
          v-model="selectedCity"
          id="cityInput"
          type="text"
          @input="handleInput"
          placeholder="Cidade / Estado / País"
        />
        <div v-if="error" class="error-message">{{ error }}</div>
        <ul v-if="suggestedCities.length" style="position: relative">
          <li v-for="city in suggestedCities" :key="city.name">
            <div @click="selectCity(city)">
              {{ city.name }}, {{ city.region }}, {{ city.country }}
            </div>
          </li>
        </ul>

        <BaseButton class="search-button" @click="getWeatherByCity">Verificar Tempo</BaseButton>
        <BaseButton
          class="favorite-button"
          @click="toggleFavoriteCity"
          :class="{ 'favorite-button': isFavoriteCity }"
        >
          Favoritar
        </BaseButton>

        <BaseSection v-if="favoritesStore.favoriteCities.length">
          <BaseTitle title="Favoritos" />
          <ul class="favorite-list">
            <li
              v-for="(cityData, index) in favoritesStore.favoriteCities"
              :key="cityData.city"
              :class="{
                'list-item': true,
                'no-border': index === favoritesStore.favoriteCities.length - 1
              }"
            >
              <div>
                {{ cityData.city }}, {{ cityData.region }}, {{ cityData.country }} /
                {{ cityData.temp_c }}°C
              </div>
              <BaseRemoveButton @click="removeFromFavorites(cityData)">X</BaseRemoveButton>
            </li>
          </ul>
        </BaseSection>
      </BaseContainer>

      <div v-if="loading">Carregando...</div>

      <div v-else>
        <BaseSection>
          <BaseTitle title="Hoje" />

          <BaseDiv>
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
          </BaseDiv>
        </BaseSection>

        <BaseSection>
          <BaseTitle title="Previsão do dia por Hora" />
          <div class="forecast-hour-container">
            <div
              v-for="forecastHour in filteredHourlyForecast"
              :key="forecastHour.time"
              class="forecast-hour-item"
            >
              <div>{{ formatHour(forecastHour.time) }}</div>
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
        </BaseSection>

        <BaseSection>
          <BaseTitle title="Previsão da Semana" />
          <div class="forecast-week-container">
            <BaseDiv v-for="day in filteredWeekForecast" :key="day.date">
              <div>{{ formatDate(day.date) }}</div>

              <div class="forecast-hour-container">
                <div
                  v-for="forecastHour in day.hour"
                  :key="forecastHour.time"
                  class="forecast-hour-item"
                >
                  <div>{{ formatHour(forecastHour.time) }}</div>
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
            </BaseDiv>
          </div>
        </BaseSection>
      </div>
    </BaseContainer>
  </BaseContainer>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, toRefs, watch } from 'vue'

import BaseButton from '@/components/BaseButton.vue'
import BaseContainer from '@/components/BaseContainer.vue'
import BaseDiv from '@/components/BaseDiv.vue'
import BaseRemoveButton from '@/components/BaseRemoveButton.vue'
import BaseSection from '@/components/BaseSection.vue'
import BaseTitle from '@/components/BaseTitle.vue'
import BaseWeatherHeader from '@/components/BaseWeatherHeader.vue'
import {
  formatDate,
  formatHour,
  formatLastUpdated,
  translateAirQuality,
  translateWindDirection
} from '../helpers'
import type { FavoriteCitiesWeatherData, SuggestedCity, WeatherData } from '../interfaces'
import { useFavoritesStore } from '../stores/useFavoritesStore'

const apiKey = import.meta.env.VITE_API_KEY
const currentWeatherApiUrl = 'https://api.weatherapi.com/v1/current.json'
const forecastApiUrl = 'https://api.weatherapi.com/v1/forecast.json'
const favoritesStore = useFavoritesStore()
const selectedCity = ref('')
const loading = ref(false)
const suggestedCities = ref<SuggestedCity[]>([])
const error = ref<string | null>(null)
const isDay = ref(true)
const { favoriteCities } = toRefs(favoritesStore)

watch(favoriteCities, (newFavorites) => {
  console.log('Lista de cidades favoritas atualizada:')
  console.log(newFavorites)
})

onMounted(() => {
  getCurrentLocation()
})

onUnmounted(() => clearInterval(updateInterval))

const updateFavoritesWeatherData = async () => {
  for (const cityData of favoriteCities.value) {
    const { lat, lon } = cityData
    await getWeatherDataForFavorite(lat, lon)
  }
}

const updateInterval = setInterval(updateFavoritesWeatherData, 5 * 60 * 1000)

const toggleFavoriteCity = () => {
  const { name, region, country, lat, lon } = weatherData.value.location
  const { temp_c } = weatherData.value.current
  favoritesStore.toggleFavoriteCity({ city: name, region, country, temp_c, lat, lon })
}

const isFavoriteCity = computed(() => {
  const { name } = weatherData.value.location
  return favoritesStore.isCityFavorite(name)
})

const removeFromFavorites = (cityData: {
  city: string
  temp_c: number
  region?: string
  country?: string
  lat?: number
  lon?: number
}) => {
  if (weatherData.value.location) {
    const { region, country, lat, lon } = weatherData.value.location
    favoritesStore.toggleFavoriteCity({
      city: cityData.city,
      temp_c: cityData.temp_c,
      region,
      country,
      lat,
      lon
    })
  }
}

const weatherData = ref<WeatherData>({
  location: {
    name: '',
    region: '',
    country: '',
    localTime: '',
    lat: 0,
    lon: 0
  },
  current: {
    temp_c: 0,
    feelslike_c: 0,
    last_updated: '',
    is_day: 0,
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

const favoriteCitiesWeather = ref<FavoriteCitiesWeatherData>({
  location: {
    name: '',
    region: '',
    country: '',
    lat: 0,
    lon: 0
  },
  current: {
    temp_c: 0
  }
})

const getWeatherDataForFavorite = async (latitude: number, longitude: number) => {
  try {
    const url = `${currentWeatherApiUrl}?key=${apiKey}&q=${latitude},${longitude}&lang=pt&aqi=yes`

    const response = await fetch(url)
    const currentData = await response.json()

    console.log('Dados do clima para cidade favorita recebidos com sucesso:', currentData)

    favoriteCitiesWeather.value.location = {
      name: currentData.location.name,
      region: currentData.location.region,
      country: currentData.location.country,
      lat: currentData.location.lat,
      lon: currentData.location.lon
    }

    favoriteCitiesWeather.value.current = {
      temp_c: currentData.current.temp_c
    }
  } catch (err: any) {
    console.error('Erro ao obter dados do clima para cidade favorita:', err.message)
    error.value = err.message
  }
}

const getWeatherData = async (latitude?: number, longitude?: number, city?: string) => {
  loading.value = true

  try {
    const url = city
      ? `${currentWeatherApiUrl}?key=${apiKey}&q=${city}&lang=pt&aqi=yes`
      : `${currentWeatherApiUrl}?key=${apiKey}&q=${latitude},${longitude}&lang=pt&aqi=yes`

    const [currentResponse, forecastResponse] = await Promise.all([
      fetch(url),
      fetch(
        `${forecastApiUrl}?key=${apiKey}&q=${city || latitude},${longitude}&lang=pt&aqi=yes&days=4`
      )
    ])

    const currentData = await currentResponse.json()
    const forecastData = await forecastResponse.json()

    console.log('Dados do clima recebidos com sucesso:', currentData, forecastData)

    weatherData.value = {
      location: {
        name: currentData.location.name,
        region: currentData.location.region,
        country: currentData.location.country,
        localTime: currentData.location.localtime,
        lat: currentData.location.lat,
        lon: currentData.location.lon
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
        is_day: currentData.current.is_day,
        air_quality: {
          'us-epa-index': currentData.current.air_quality['us-epa-index']
        }
      },
      forecast: {
        forecastday: forecastData.forecast.forecastday
      }
    }
    isDay.value = currentData.current.is_day === 1
  } catch (err: any) {
    console.error('Erro ao obter dados do clima:', err.message)
    error.value = err.message
  } finally {
    loading.value = false
  }
}

const getCurrentLocation = () => {
  loading.value = true

  setTimeout(async () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords
          await getWeatherData(latitude, longitude)
        },
        (err: GeolocationPositionError) => {
          console.error('Erro ao obter localização:', err.message)
          loading.value = false
        }
      )
    } else {
      window.alert('Geolocalização não suportada no seu navegador.')
      loading.value = false
    }
  }, 1000)
}

const getWeatherByCity = async () => {
  if (selectedCity.value) {
    await getWeatherData(undefined, undefined, selectedCity.value)
  } else {
    window.alert('Digite o nome da cidade antes de verificar o tempo.')
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

const currentIndex = computed(() => {
  const currentHour = new Date().getHours()
  return getHourlyForecast.value.findIndex((hour) => {
    const hourDate = new Date(hour.time)
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

<style>
ul {
  list-style-type: none;
  padding: 0;
  margin: 0;
  position: absolute;
  background-color: #f1f1f1;
  width: 100%;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  border-radius: 5px;
}

li {
  padding: 10px;
}

li div {
  text-decoration: none;
  color: #333;
  display: block;
}

li:hover {
  background-color: #ddd;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

.location-name {
  font-size: 22px;
}

.favorite-list {
  position: relative;
  border-radius: 5px;
}

.favorite-list .list-item {
  border-bottom: 1px solid #ddd;
}

.favorite-list .no-border {
  border-bottom: none;
}

.loading-icon {
  display: inline-block;
  border: 4px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top: 4px solid #333;
  width: 16px;
  height: 16px;
  animation: spin 1s linear infinite;
  margin-right: 8px;
}

.main-info {
  padding: 0px 10px;
}

.current-temp {
  font-size: 40px;
}

.current-weather-info {
  display: flex;
  flex-direction: row;
  gap: 20px;
}

.current-weather-description {
  flex-direction: column;
  font-size: 13px;
  gap: 5px;
  justify-content: center;
}

.current-weather-icon {
  width: 64px;
  height: 64px;
}

.last-updated {
  font-size: 12px;
  color: #f3f1f1be;
  margin-top: 12px;
}

.forecast-week-container {
  display: flex;
  flex-direction: column;
  overflow-x: auto;
  gap: 12px;
}

.forecast-hour-container {
  display: flex;
  overflow-x: auto;
  gap: 12px;
  padding: 0px 0px 12px 0px;
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
.list-item {
  padding: 10px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.list-item div {
  text-decoration: none;
  color: #333;
  display: block;
}

.list-item:hover {
  background-color: #ddd;
}

.search-button {
  background-color: #2162af;
}
.search-button:hover {
  background-color: #2161afcc;
}
</style>
