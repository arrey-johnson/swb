import { Link } from 'react-router-dom'
import { useState } from 'react'
import { Plus } from 'lucide-react'
import { useGoals } from '@/lib/api/hooks'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { GoalStatusBadge } from '@/components/ui/Badge'
import { formatFCFA, formatDate, cn } from '@/lib/utils'
import type { GoalStatus } from '@/types/database'

type FilterTab = 'all' | GoalStatus

const TABS: { value: FilterTab; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'matured', label: 'Matured' },
  { value: 'completed', label: 'Completed' },
  { value: 'withdrawn_early', label: 'Early Exit' },
]

export default function GoalsPage() {
  const { data: goals, isLoading } = useGoals()
  const [tab, setTab] = useState<FilterTab>('all')

  const visible = goals?.filter((g) => g.status !== 'cancelled') ?? []
  const filtered = tab === 'all' ? visible : visible.filter((g) => g.status === tab)

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Savings Goals</h1>
          <p className="text-gray-500 text-sm">{visible.length} goals</p>
        </div>
        <Link to="/goals/new">
          <Button size="sm">
            <Plus className="h-4 w-4" />
            New
          </Button>
        </Link>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {TABS.map((t) => (
          <button
            key={t.value}
            type="button"
            onClick={() => setTab(t.value)}
            className={cn(
              'shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors',
              tab === t.value ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600'
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {filtered.length > 0 ? (
        <div className="space-y-3">
          {filtered.map((goal) => (
            <Link key={goal.id} to={`/goals/${goal.id}`}>
              <Card className="hover:border-primary/30 transition-colors">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-gray-900">{goal.title}</h3>
                    {goal.description && (
                      <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{goal.description}</p>
                    )}
                  </div>
                  <GoalStatusBadge status={goal.status} />
                </div>
                <ProgressBar value={goal.current_amount} max={goal.target_amount} />
                <div className="flex justify-between text-xs text-gray-400 mt-2">
                  <span>{formatFCFA(goal.current_amount)} of {formatFCFA(goal.target_amount)}</span>
                  <span>Matures {formatDate(goal.maturity_date)}</span>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <Card className="text-center py-12">
          <p className="text-gray-400 mb-4">
            {tab === 'all' ? 'No savings goals yet' : `No ${tab.replace('_', ' ')} goals`}
          </p>
          {tab === 'all' && (
            <Link to="/goals/new">
              <Button>Create Your First Goal</Button>
            </Link>
          )}
        </Card>
      )}
    </div>
  )
}
