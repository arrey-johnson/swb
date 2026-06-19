import { usePenaltySettings } from '@/lib/api/hooks'

export function usePenaltyMap() {
  const { data: settings } = usePenaltySettings()

  const map = new Map<number, number>()
  settings?.forEach((s) => map.set(s.duration_months, s.percentage))

  const getPenalty = (months: 3 | 6 | 12) => map.get(months) ?? ({ 3: 5, 6: 7, 12: 10 }[months])

  const formatPenalty = (months: 3 | 6 | 12) => `${getPenalty(months)}%`

  return { map, getPenalty, formatPenalty, settings }
}
