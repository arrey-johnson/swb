import { Link } from 'react-router-dom'
import { Wallet, Lock, Target, TrendingUp, Calendar, Award } from 'lucide-react'
import { useDashboardMetrics, useTransactions, useGoals } from '@/lib/api/hooks'
import { StatCard } from '@/components/ui/StatCard'
import { Card, CardTitle } from '@/components/ui/Card'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { GoalStatusBadge } from '@/components/ui/Badge'
import { SavingsReminderCard } from '@/components/dashboard/SavingsReminderCard'

import { formatFCFA, formatDate, getDisciplineBadge } from '@/lib/utils'

export default function DashboardPage() {
  const { data: metrics, isLoading } = useDashboardMetrics()
  const { data: transactions } = useTransactions(5)
  const { data: goals } = useGoals()

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  const badge = getDisciplineBadge(metrics?.discipline_level ?? 'bronze')
  const activeGoals = goals?.filter((g) => g.status === 'active' || g.status === 'matured') ?? []

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 text-sm">Your savings overview</p>
      </div>

      <SavingsReminderCard />

      <StatCard
        title="Account Balance"
        value={metrics?.account_balance ?? 0}
        subtitle={
          metrics?.activation_required
            ? `Activation deposit: ${formatFCFA(metrics.activation_remaining)} remaining`
            : `Reserve: ${formatFCFA(metrics?.reserve_balance ?? 1000)}`
        }
        icon={<Wallet className="h-5 w-5" />}
        variant="primary"
      />

      <div className="grid grid-cols-2 gap-3">
        <StatCard
          title="Locked Funds"
          value={metrics?.total_locked ?? 0}
          icon={<Lock className="h-5 w-5" />}
        />
        <StatCard
          title="Withdrawable"
          value={metrics?.max_withdrawable ?? 0}
          icon={<TrendingUp className="h-5 w-5" />}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <StatCard title="Active Goals" value={metrics?.active_goals ?? 0} icon={<Target className="h-5 w-5" />} formatAsCurrency={false} />
        <StatCard title="Completed" value={metrics?.completed_goals ?? 0} icon={<Award className="h-5 w-5" />} formatAsCurrency={false} />
      </div>

      {metrics?.next_maturity && (
        <Card className="flex items-center gap-3">
          <Calendar className="h-5 w-5 text-primary" />
          <div>
            <p className="text-sm text-gray-500">Next Maturity</p>
            <p className="font-semibold">{formatDate(metrics.next_maturity)}</p>
          </div>
        </Card>
      )}

      <Card>
        <div className="flex items-center justify-between mb-3">
          <CardTitle>Discipline Score</CardTitle>
          <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${badge.color}`}>
            {badge.label}
          </span>
        </div>
        <p className="text-3xl font-bold text-primary">{metrics?.discipline_points ?? 0} pts</p>
      </Card>

      {activeGoals.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-gray-900">Goal Progress</h2>
            <Link to="/goals" className="text-sm text-primary">View all</Link>
          </div>
          <div className="space-y-3">
            {activeGoals.slice(0, 3).map((goal) => (
              <Link key={goal.id} to={`/goals/${goal.id}`}>
                <Card className="hover:border-primary/30 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-sm">{goal.title}</span>
                    <GoalStatusBadge status={goal.status} />
                  </div>
                  <ProgressBar value={goal.current_amount} max={goal.target_amount} />
                  <div className="flex justify-between text-xs text-gray-400 mt-2">
                    <span>{formatFCFA(goal.current_amount)}</span>
                    <span>{formatFCFA(goal.target_amount)}</span>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      )}

      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-gray-900">Recent Transactions</h2>
          <Link to="/history/transactions" className="text-sm text-primary">View all</Link>
        </div>
        {transactions && transactions.length > 0 ? (
          <div className="space-y-2">
            {transactions.map((tx) => (
              <Card key={tx.id} className="flex items-center justify-between py-3">
                <div>
                  <p className="text-sm font-medium capitalize">{tx.transaction_type}</p>
                  <p className="text-xs text-gray-400">{formatDate(tx.created_at)}</p>
                </div>
                <span className={`text-sm font-semibold ${
                  tx.transaction_type === 'deposit' ? 'text-success' : 'text-gray-900'
                }`}>
                  {tx.transaction_type === 'deposit' ? '+' : '-'}{formatFCFA(tx.amount)}
                </span>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="text-center text-gray-400 text-sm py-8">
            No transactions yet
          </Card>
        )}
      </div>
    </div>
  )
}
