export const toDateKey = (d = new Date()) => d.toISOString().slice(0, 10)

export const formatTime = (ms: number) => {
  const d = new Date(ms)
  const hh = d.getHours().toString().padStart(2, '0')
  const mm = d.getMinutes().toString().padStart(2, '0')
  return `${hh}:${mm}`
}

export const formatHourLabel = (date: Date) => date.getHours().toString().padStart(2, '0')
