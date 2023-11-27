export const formatDate = (rawDate: string): string => {
  const dateObject = new Date(rawDate + 'T00:00:00')

  const dayOfWeek = dateObject.toLocaleString('pt-BR', {
    weekday: 'long'
  })
  const day = dateObject.getDate()
  const month = dateObject.toLocaleString('pt-BR', {
    month: 'short'
  })

  const formattedDayOfWeek = dayOfWeek.charAt(0).toUpperCase() + dayOfWeek.slice(1).toLowerCase()
  const formattedMonth = month.charAt(0).toUpperCase() + month.slice(1).toLowerCase()

  return `${formattedDayOfWeek}, ${day} ${formattedMonth}`
}
