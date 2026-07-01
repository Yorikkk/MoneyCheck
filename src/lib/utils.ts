import dayjs from 'dayjs'

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    minimumFractionDigits: 0,
  }).format(amount)
}

export function formatDate(date: Date | string): string {
  return dayjs(date).format('D MMM YYYY')
}

export function formatDateTime(date: Date | string): string {
  return dayjs(date).format('D MMM YYYY, HH:mm')
}

export function formatPeriod(start: Date, end: Date): string {
  const s = dayjs(start)
  const e = dayjs(end)
  const isFullMonth = s.date() === 1 && e.date() === e.daysInMonth()
  if (isFullMonth) {
    return s.format('MMMM YYYY')
  }
  return `${s.format('DD.MM.YYYY')} — ${e.format('DD.MM.YYYY')}`
}

export function simpleHash(input: string): string {
  let hash = 5381
  for (let i = 0; i < input.length; i++) {
    hash = ((hash << 5) + hash + input.charCodeAt(i)) | 0
  }
  return hash.toString(36)
}