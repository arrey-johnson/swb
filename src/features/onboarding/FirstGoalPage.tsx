import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCreateGoal } from '@/lib/api/hooks'
import { usePenaltyMap } from '@/lib/hooks/usePenaltyMap'
import { useLanguage } from '@/lib/i18n/LanguageProvider'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'

const DURATION_MONTHS = [3, 6, 12] as const

const EXAMPLES = ['School Fees', 'Business Capital', 'Emergency Fund', 'House Project', 'Car Purchase', 'Wedding Fund']

export default function FirstGoalPage() {
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    try {
      await createGoal.mutateAsync({
        title: form.title,
        description: form.description,
        target_amount: parseFloat(form.target_amount),
        duration_months: form.duration_months,
      })
      navigate('/onboarding/fund')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create goal')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-12 bg-gray-50">
      <Card className="max-w-md w-full">
        <h1 className="text-xl font-bold text-gray-900 mb-1">Create your first goal</h1>
        <p className="text-gray-500 text-sm mb-6">What are you saving for?</p>

        <div className="flex flex-wrap gap-2 mb-6">
          {EXAMPLES.map((ex) => (
            <button
              key={ex}
              type="button"
              onClick={() => setForm({ ...form, title: ex })}
              className="text-xs px-3 py-1.5 rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
            >
              {ex}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <div className="rounded-xl bg-danger/10 text-danger text-sm px-4 py-3">{error}</div>}
          <Input
            id="title"
            label="Goal Name"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            required
          />
          <Input
            id="description"
            label="Description (optional)"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
          <Input
            id="target"
            label="Target Amount (FCFA)"
            type="number"
            min="1000"
            value={form.target_amount}
            onChange={(e) => setForm({ ...form, target_amount: e.target.value })}
            required
          />

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

          <Button type="submit" className="w-full" loading={createGoal.isPending}>
            Create Goal
          </Button>
        </form>
      </Card>
    </div>
  )
}
