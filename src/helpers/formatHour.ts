export const formatHour = (time: string) => {
  const date = new Date(time)
  const formattedHour = `${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`
  return formattedHour
}
