import { useAdminWithdrawals, useMarkWithdrawalPaid } from '@/lib/api/hooks'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { formatFCFA, formatDate, getPayoutStatusColor } from '@/lib/utils'
import { cn } from '@/lib/utils'
import { useState } from 'react'

export default function AdminWithdrawalsPage() {
  const [pendingOnly, setPendingOnly] = useState(true)
  const { data: withdrawals, isLoading } = useAdminWithdrawals(pendingOnly)
  const markPaid = useMarkWithdrawalPaid()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Withdrawals</h1>
        <p className="text-gray-500 text-sm">Process payout requests to savers</p>
      </div>

      <div className="flex rounded-xl bg-gray-100 p-1">
        {([true, false] as const).map((p) => (
          <button
            key={String(p)}
            type="button"
            onClick={() => setPendingOnly(p)}
            className={cn(
              'flex-1 py-2 text-sm font-medium rounded-lg transition-colors',
              pendingOnly === p ? 'bg-white text-primary shadow-sm' : 'text-gray-500'
            )}
          >
            {p ? 'Pending Payout' : 'All'}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      ) : withdrawals && withdrawals.length > 0 ? (
        <div className="space-y-3">
          {withdrawals.map((w) => {
            const profile = w.profiles as { full_name?: string; email?: string; phone?: string } | undefined
            const goalTitle =
              w.savings_goals && 'title' in w.savings_goals ? w.savings_goals.title : 'Goal'
            return (
              <Card key={w.id}>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div>
                    <p className="font-semibold text-sm">{profile?.full_name ?? 'Saver'}</p>
                    <p className="text-xs text-gray-400">{profile?.email}</p>
                    <p className="text-xs text-gray-400 mt-1">{goalTitle} · {formatDate(w.created_at)}</p>
                  </div>
                  <Badge className={getPayoutStatusColor(w.payout_status)}>
                    {w.payout_status === 'pending_payout' ? 'Pending' : 'Paid'}
                  </Badge>
                </div>
                <div className="rounded-lg bg-gray-50 px-3 py-2 text-xs space-y-1 mb-3">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Net payout</span>
                    <span className="font-bold text-primary">{formatFCFA(w.net_amount)}</span>
                  </div>
                  {w.penalty_amount > 0 && (
                    <div className="flex justify-between text-danger">
                      <span>Penalty</span>
                      <span>−{formatFCFA(w.penalty_amount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-500">Send to</span>
                    <span className="font-medium">{w.payout_phone ?? profile?.phone}</span>
                  </div>
                </div>
                {w.payout_status === 'pending_payout' && (
                  <Button
                    size="sm"
                    className="w-full"
                    loading={markPaid.isPending}
                    onClick={() => markPaid.mutate(w.id)}
                  >
                    Mark as Paid
                  </Button>
                )}
              </Card>
            )
          })}
        </div>
      ) : (
        <Card className="text-center py-12 text-gray-400 text-sm">
          {pendingOnly ? 'No pending payouts' : 'No withdrawals yet'}
        </Card>
      )}
    </div>
  )
}
