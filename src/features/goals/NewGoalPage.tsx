import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCreateGoal } from '@/lib/api/hooks'
import { usePenaltyMap } from '@/lib/hooks/usePenaltyMap'
import { useLanguage } from '@/lib/i18n/LanguageProvider'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import { formatFCFA } from '@/lib/utils'
import { monthlySavingsNeeded } from '@/lib/discipline'

const DURATION_MONTHS = [3, 6, 12] as const

export default function NewGoalPage() {
  const navigate = useNavigate()
  const createGoal = useCreateGoal()
  const { getPenalty } = usePenaltyMap()
  const { t } = useLanguage()
  const [form, setForm] = useState({
    title: '',
    description: '',
    target_amount: '',
    duration_months: 3 as 3 | 6 | 12,
  })
  const [error, setError] = useState('')

  const target = parseFloat(form.target_amount) || 0
  const monthlyHint =
    target > 0 ? monthlySavingsNeeded(target, 0, form.duration_months) : 0

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    try {
      const { goal_id } = await createGoal.mutateAsync({
        title: form.title,
        description: form.description,
        target_amount: parseFloat(form.target_amount),
        duration_months: form.duration_months,
      })
      navigate(`/goals/${goal_id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create goal')
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">New Goal</h1>
        <p className="text-gray-500 text-sm">Set a savings target</p>
      </div>

      <Card>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <div className="rounded-xl bg-danger/10 text-danger text-sm px-4 py-3">{error}</div>}
          <Input id="title" label="Goal Name" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
          <Input id="description" label="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <Input id="target" label="Target Amount (FCFA)" type="number" min="1000" value={form.target_amount} onChange={(e) => setForm({ ...form, target_amount: e.target.value })} required />
          {monthlyHint > 0 && (
            <p className="text-xs text-primary bg-primary/5 rounded-lg px-3 py-2">
              Save about {formatFCFA(monthlyHint)}/month to reach your target in {form.duration_months} months.
            </p>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Duration</label>
            <div className="grid grid-cols-3 gap-2">
              {DURATION_MONTHS.map((months) => (
                <button
                  key={months}
                  type="button"
                  onClick={() => setForm({ ...form, duration_months: months })}
                  className={`rounded-xl border p-3 text-center transition-colors ${
                    form.duration_months === months
                      ? 'border-primary bg-primary/5 text-primary'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="text-sm font-semibold">{months} Months</div>
                  <div className="text-xs text-gray-400 mt-0.5">
                    {t('penalty.earlyFee', { pct: String(getPenalty(months)) })}
                  </div>
                </button>
              ))}
            </div>
          </div>
          <Button type="submit" className="w-full" loading={createGoal.isPending}>Create Goal</Button>
        </form>
      </Card>
    </div>
  )
}
