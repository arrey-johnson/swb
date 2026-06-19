import { Link, useParams } from 'react-router-dom'
import { ArrowDownLeft, ArrowUpRight, CheckCircle, Pencil, Clock } from 'lucide-react'
import { useGoal, useCompleteGoal, useTransactions } from '@/lib/api/hooks'
import { useAccountBlocked } from '@/components/layout/AccountStatusBanner'
import { Button } from '@/components/ui/Button'
import { Card, CardTitle } from '@/components/ui/Card'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { GoalStatusBadge } from '@/components/ui/Badge'
import { formatFCFA, formatDate, cn } from '@/lib/utils'
import { daysUntil, monthlySavingsNeeded } from '@/lib/discipline'

export default function GoalDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { data: goal, isLoading } = useGoal(id!)
  const { data: transactions } = useTransactions(undefined, id!)
  const completeGoal = useCompleteGoal()
  const blocked = useAccountBlocked()

  if (isLoading || !goal) {
    return (
      <div className="flex justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  const canWithdraw = !blocked && goal.current_amount > 0 && ['active', 'matured'].includes(goal.status)
  const canDeposit = !blocked && goal.status === 'active'
  const canComplete = goal.status === 'matured'
  const canEdit = ['active', 'matured'].includes(goal.status)

  const daysLeft = goal.status === 'active' ? daysUntil(goal.maturity_date) : null
  const monthsLeft = daysLeft !== null ? Math.max(1, Math.ceil(daysLeft / 30)) : 0
  const monthlyNeeded =
    goal.status === 'active'
      ? monthlySavingsNeeded(goal.target_amount, goal.current_amount, monthsLeft)
      : 0

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center justify-between gap-2 mb-1">
          <div className="flex items-center gap-2 min-w-0">
            <h1 className="text-2xl font-bold text-gray-900 truncate">{goal.title}</h1>
            <GoalStatusBadge status={goal.status} />
          </div>
          {canEdit && (
            <Link to={`/goals/${goal.id}/edit`} className="shrink-0 p-2 text-gray-400 hover:text-primary">
              <Pencil className="h-4 w-4" />
            </Link>
          )}
        </div>
        {goal.description && <p className="text-gray-500 text-sm">{goal.description}</p>}
      </div>

      <Card>
        <ProgressBar value={goal.current_amount} max={goal.target_amount} />
        <div className="flex justify-between mt-3">
          <div>
            <p className="text-xs text-gray-400">Saved</p>
            <p className="text-lg font-bold text-primary">{formatFCFA(goal.current_amount)}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-400">Target</p>
            <p className="text-lg font-bold">{formatFCFA(goal.target_amount)}</p>
          </div>
        </div>
      </Card>

      {goal.status === 'active' && daysLeft !== null && (
        <Card className="flex items-center gap-3 bg-primary/5 border-primary/20">
          <Clock className="h-5 w-5 text-primary shrink-0" />
          <div className="text-sm">
            <p className="font-medium text-gray-900">
              {daysLeft === 0 ? 'Matures today' : `${daysLeft} days until maturity`}
            </p>
            {monthlyNeeded > 0 && goal.current_amount < goal.target_amount && (
              <p className="text-xs text-gray-500 mt-0.5">
                Save ~{formatFCFA(monthlyNeeded)}/month to reach your target
              </p>
            )}
          </div>
        </Card>
      )}

      <div className="grid grid-cols-2 gap-3 text-sm">
        <Card>
          <p className="text-gray-400 text-xs">Duration</p>
          <p className="font-semibold">{goal.duration_months} months</p>
        </Card>
        <Card>
          <p className="text-gray-400 text-xs">Maturity Date</p>
          <p className="font-semibold">{formatDate(goal.maturity_date)}</p>
        </Card>
      </div>

      {goal.status !== 'cancelled' && (
        <div className="grid grid-cols-2 gap-3">
          {canDeposit && (
            <Link to={`/goals/${goal.id}/deposit`}>
              <Button className="w-full" variant="primary">
                <ArrowDownLeft className="h-4 w-4" />
                Deposit
              </Button>
            </Link>
          )}
          {canWithdraw && (
            <Link to={`/goals/${goal.id}/withdraw`}>
              <Button className="w-full" variant="outline">
                <ArrowUpRight className="h-4 w-4" />
                Withdraw
              </Button>
            </Link>
          )}
        </div>
      )}

      {canComplete && (
        <Button
          className="w-full"
          variant="secondary"
          loading={completeGoal.isPending}
          onClick={() => completeGoal.mutate(goal.id)}
        >
          <CheckCircle className="h-4 w-4" />
          Mark as Completed
        </Button>
      )}

      <div>
        <CardTitle className="mb-3">Activity</CardTitle>
        {transactions && transactions.length > 0 ? (
          <div className="space-y-2">
            {transactions.map((tx) => (
              <Card key={tx.id} className="flex items-center justify-between py-3">
                <div>
                  <p className="text-sm font-medium capitalize">{tx.transaction_type}</p>
                  <p className="text-xs text-gray-400">{formatDate(tx.created_at)}</p>
                </div>
                <span
                  className={cn(
                    'text-sm font-semibold',
                    tx.transaction_type === 'deposit' ? 'text-success' : 'text-gray-900'
                  )}
                >
                  {tx.transaction_type === 'deposit' ? '+' : '−'}
                  {formatFCFA(tx.amount)}
                </span>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="text-center text-gray-400 text-sm py-6">No activity yet</Card>
        )}
      </div>
    </div>
  )
}
