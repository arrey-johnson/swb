import type { DisciplineLevel } from '@/types/database'

export const DISCIPLINE_LEVELS: {
  level: DisciplineLevel
  label: string
  minPoints: number
  color: string
}[] = [
  { level: 'bronze', label: 'Bronze', minPoints: 0, color: 'bg-amber-700/10 text-amber-700' },
  { level: 'silver', label: 'Silver', minPoints: 100, color: 'bg-gray-400/10 text-gray-500' },
  { level: 'gold', label: 'Gold', minPoints: 300, color: 'bg-warning/10 text-warning' },
  { level: 'platinum', label: 'Platinum', minPoints: 500, color: 'bg-primary/10 text-primary' },
]

export const DISCIPLINE_PERKS: Record<DisciplineLevel, string[]> = {
  bronze: ['perks.bronze'],
  silver: ['perks.bronze', 'perks.silver'],
  gold: ['perks.bronze', 'perks.silver', 'perks.gold'],
  platinum: ['perks.bronze', 'perks.silver', 'perks.gold', 'perks.platinum'],
}

export const DISCIPLINE_RULES = [
  { action: 'Make a deposit in a new calendar month', points: '+20', icon: 'deposit' },
  { action: 'Complete a savings goal', points: '+100', icon: 'goal' },
  { action: 'Early withdrawal (penalty applied)', points: '−50', icon: 'penalty' },
] as const

export function getDisciplineProgress(points: number) {
  const current =
    [...DISCIPLINE_LEVELS].reverse().find((l) => points >= l.minPoints) ?? DISCIPLINE_LEVELS[0]
  const currentIdx = DISCIPLINE_LEVELS.findIndex((l) => l.level === current.level)
  const next = DISCIPLINE_LEVELS[currentIdx + 1] ?? null

  if (!next) {
    return {
      current,
      next: null,
      pointsToNext: 0,
      progressPercent: 100,
    }
  }

  const range = next.minPoints - current.minPoints
  const earned = points - current.minPoints
  const progressPercent = Math.min(100, Math.round((earned / range) * 100))

  return {
    current,
    next,
    pointsToNext: next.minPoints - points,
    progressPercent,
  }
}

export function monthlySavingsNeeded(target: number, current: number, monthsLeft: number): number {
  if (monthsLeft <= 0) return Math.max(0, target - current)
  return Math.ceil(Math.max(0, target - current) / monthsLeft)
}

export function daysUntil(date: string | Date): number {
  const target = new Date(date)
  const now = new Date()
  target.setHours(0, 0, 0, 0)
  now.setHours(0, 0, 0, 0)
  return Math.max(0, Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
}
