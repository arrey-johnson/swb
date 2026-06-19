import { Link } from 'react-router-dom'
import { Bell } from 'lucide-react'
import { useGoals } from '@/lib/api/hooks'
import { Card } from '@/components/ui/Card'
import { formatFCFA } from '@/lib/utils'
import { monthlySavingsNeeded, daysUntil } from '@/lib/discipline'
import { useLanguage } from '@/lib/i18n/LanguageProvider'

export function SavingsReminderCard() {
  const { data: goals } = useGoals()
  const { t } = useLanguage()

  const activeGoal = goals?.find(
    (g) => g.status === 'active' && g.current_amount < g.target_amount
  )
  if (!activeGoal) return null

  const daysLeft = daysUntil(activeGoal.maturity_date)
  const monthsLeft = Math.max(1, Math.ceil(daysLeft / 30))
  const monthly = monthlySavingsNeeded(
    activeGoal.target_amount,
    activeGoal.current_amount,
    monthsLeft
  )
  if (monthly <= 0) return null

  return (
    <Card className="border-primary/20 bg-primary/5">
      <div className="flex gap-3">
        <Bell className="h-5 w-5 text-primary shrink-0 mt-0.5" />
        <div className="flex-1 text-sm">
          <p className="font-semibold text-gray-900">{t('reminder.title')}</p>
          <p className="text-gray-600 text-xs mt-1">
            {t('reminder.body', {
              amount: formatFCFA(monthly),
              goal: activeGoal.title,
            })}
          </p>
          <Link
            to={`/goals/${activeGoal.id}/deposit`}
            className="inline-block mt-2 text-xs font-medium text-primary hover:underline"
          >
            {t('reminder.cta')} →
          </Link>
        </div>
      </div>
    </Card>
  )
}
