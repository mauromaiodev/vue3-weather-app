export const translateAirQuality = (airQuality: number) => {
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
