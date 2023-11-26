export const formatLastUpdated = (lastUpdated: string) => {
  const updatedTime = new Date(lastUpdated).getTime()
  const currentTime = new Date().getTime()
  const differenceInMinutes = Math.floor((currentTime - updatedTime) / (1000 * 60))

  if (differenceInMinutes === 0) {
    return 'agora mesmo'
  } else {
    const pluralSuffix = differenceInMinutes === 1 ? '' : 's'
    return `${differenceInMinutes} minuto${pluralSuffix} atrás`
  }
}
