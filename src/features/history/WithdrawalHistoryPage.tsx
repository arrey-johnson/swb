import { Link } from 'react-router-dom'
import { ArrowUpRight } from 'lucide-react'
import { useWithdrawals } from '@/lib/api/hooks'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { formatFCFA, formatDate, getPayoutStatusColor } from '@/lib/utils'

export default function WithdrawalHistoryPage() {
  const { data: withdrawals, isLoading } = useWithdrawals()

  return (
    <div className="space-y-4">
      {isLoading ? (
        <div className="flex justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      ) : withdrawals && withdrawals.length > 0 ? (
        <div className="space-y-3">
          {withdrawals.map((w) => {
            const goalTitle =
              w.savings_goals && 'title' in w.savings_goals ? w.savings_goals.title : 'Goal'
            return (
              <Card key={w.id}>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex gap-3">
                    <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                      <ArrowUpRight className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{formatFCFA(w.net_amount)} received</p>
                      <Link to={`/goals/${w.goal_id}`} className="text-xs text-primary hover:underline">
                        {goalTitle}
                      </Link>
                      <p className="text-xs text-gray-400 mt-1">{formatDate(w.created_at)}</p>
                    </div>
                  </div>
                  <Badge className={getPayoutStatusColor(w.payout_status)}>
                    {w.payout_status === 'pending_payout' ? 'Processing' : 'Paid'}
                  </Badge>
                </div>
                <div className="rounded-lg bg-gray-50 px-3 py-2 text-xs space-y-1">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Gross amount</span>
                    <span>{formatFCFA(w.amount)}</span>
                  </div>
                  {w.penalty_amount > 0 && (
                    <div className="flex justify-between text-danger">
                      <span>Penalty</span>
                      <span>−{formatFCFA(w.penalty_amount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-500">Payout to</span>
                    <span className="font-medium">{w.payout_phone ?? '—'}</span>
                  </div>
                  {w.paid_at && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Paid on</span>
                      <span>{formatDate(w.paid_at)}</span>
                    </div>
                  )}
                </div>
              </Card>
            )
          })}
        </div>
      ) : (
        <Card className="text-center py-12">
          <ArrowUpRight className="h-10 w-10 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-400 text-sm">No withdrawals yet</p>
        </Card>
      )}
    </div>
  )
}
