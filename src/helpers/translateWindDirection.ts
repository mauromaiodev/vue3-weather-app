export const translateWindDirection = (windDirection: string) => {
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
