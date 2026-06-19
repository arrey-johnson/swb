import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useGoal, useUpdateGoal, useCancelGoal } from '@/lib/api/hooks'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import { formatFCFA } from '@/lib/utils'

export default function EditGoalPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: goal, isLoading } = useGoal(id!)
  const updateGoal = useUpdateGoal()
  const cancelGoal = useCancelGoal()

  const [form, setForm] = useState({ title: '', description: '', target_amount: '' })
  const [error, setError] = useState('')

  useEffect(() => {
    if (goal) {
      setForm({
        title: goal.title,
        description: goal.description ?? '',
        target_amount: String(goal.target_amount),
      })
    }
  }, [goal])

  const canEditTarget = (goal?.current_amount ?? 0) === 0
  const canCancel = goal?.status === 'active' && (goal?.current_amount ?? 0) === 0

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    try {
      await updateGoal.mutateAsync({
        goal_id: id!,
        title: form.title,
        description: form.description,
        target_amount: canEditTarget ? parseFloat(form.target_amount) : undefined,
      })
      navigate(`/goals/${id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update goal')
    }
  }

  const handleCancel = async () => {
    if (!confirm('Cancel this goal? This cannot be undone.')) return
    setError('')
    try {
      await cancelGoal.mutateAsync(id!)
      navigate('/goals')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to cancel goal')
    }
  }

  if (isLoading || !goal) {
    return (
      <div className="flex justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  if (!['active', 'matured'].includes(goal.status)) {
    return (
      <Card className="text-center py-12">
        <p className="text-gray-500 text-sm">This goal cannot be edited.</p>
        <Link to={`/goals/${id}`} className="text-sm text-primary mt-2 inline-block hover:underline">
          Back to goal
        </Link>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Edit Goal</h1>
        <p className="text-gray-500 text-sm">{goal.title}</p>
      </div>

      <Card>
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
            label="Description"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
          <Input
            id="target"
            label={`Target Amount (FCFA)${!canEditTarget ? ' — locked after deposits' : ''}`}
            type="number"
            min="1000"
            value={form.target_amount}
            onChange={(e) => setForm({ ...form, target_amount: e.target.value })}
            disabled={!canEditTarget}
            required
          />
          {!canEditTarget && (
            <p className="text-xs text-gray-400">
              Current saved: {formatFCFA(goal.current_amount)}. Target cannot change once deposits are made.
            </p>
          )}
          <Button type="submit" className="w-full" loading={updateGoal.isPending}>
            Save Changes
          </Button>
        </form>
      </Card>

      {canCancel && (
        <Card className="border-danger/20">
          <p className="text-sm text-gray-600 mb-3">Cancel this empty goal if you no longer need it.</p>
          <Button variant="danger" className="w-full" loading={cancelGoal.isPending} onClick={handleCancel}>
            Cancel Goal
          </Button>
        </Card>
      )}
    </div>
  )
}
