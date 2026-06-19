import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatFCFA(amount: number | string): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount
  return new Intl.NumberFormat('fr-CM', {
    style: 'currency',
    currency: 'XAF',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num)
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(date))
}

export function getGoalStatusColor(status: string): string {
  const colors: Record<string, string> = {
    active: 'bg-primary/10 text-primary',
    matured: 'bg-success/10 text-success',
    completed: 'bg-success/10 text-success',
    withdrawn_early: 'bg-danger/10 text-danger',
    cancelled: 'bg-gray-100 text-gray-500',
  }
  return colors[status] ?? 'bg-gray-100 text-gray-600'
}

export function getDepositStatusColor(status: string): string {
  const colors: Record<string, string> = {
    pending: 'bg-warning/10 text-warning',
    approved: 'bg-success/10 text-success',
    rejected: 'bg-danger/10 text-danger',
  }
  return colors[status] ?? 'bg-gray-100 text-gray-600'
}

export function getPayoutStatusColor(status: string): string {
  const colors: Record<string, string> = {
    pending_payout: 'bg-warning/10 text-warning',
    paid: 'bg-success/10 text-success',
  }
  return colors[status] ?? 'bg-gray-100 text-gray-600'
}

export function getDisciplineBadge(level: string): { label: string; color: string } {
  const badges: Record<string, { label: string; color: string }> = {
    bronze: { label: 'Bronze', color: 'bg-amber-700/10 text-amber-700' },
    silver: { label: 'Silver', color: 'bg-gray-400/10 text-gray-500' },
    gold: { label: 'Gold', color: 'bg-warning/10 text-warning' },
    platinum: { label: 'Platinum', color: 'bg-primary/10 text-primary' },
  }
  return badges[level] ?? badges.bronze
}
