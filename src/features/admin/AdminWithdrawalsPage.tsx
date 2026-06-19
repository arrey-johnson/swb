import { useAdminWithdrawalsPaginated, useMarkWithdrawalPaid } from '@/lib/api/hooks'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { Pagination, ADMIN_PAGE_SIZE } from '@/components/ui/Pagination'
import { useToast } from '@/components/ui/Toast'
import { formatFCFA, formatDate, getPayoutStatusColor } from '@/lib/utils'
import { cn } from '@/lib/utils'
import { useState } from 'react'

export default function AdminWithdrawalsPage() {
  const [pendingOnly, setPendingOnly] = useState(true)
  const [page, setPage] = useState(1)
  const { data, isLoading } = useAdminWithdrawalsPaginated(pendingOnly, page, ADMIN_PAGE_SIZE)
  const markPaid = useMarkWithdrawalPaid()
  const toast = useToast()

  const [payModal, setPayModal] = useState<{
    id: string; netAmount: number; phone: string; name: string
  } | null>(null)
  const [payoutRef, setPayoutRef] = useState('')

  const handleMarkPaid = async () => {
    if (!payModal) return
    try {
      await markPaid.mutateAsync({
        withdrawalId: payModal.id,
        payoutReference: payoutRef.trim() || undefined,
      })
      toast.success('Payout marked as paid')
      setPayModal(null)
      setPayoutRef('')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to mark paid')
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Withdrawals</h1>
        <p className="text-gray-500 text-sm">Process payout requests to savers</p>
      </div>

      <div className="flex rounded-xl bg-gray-100 p-1">
        {([true, false] as const).map((p) => (
          <button key={String(p)} type="button" onClick={() => { setPendingOnly(p); setPage(1) }}
            className={cn('flex-1 py-2 text-sm font-medium rounded-lg transition-colors',
              pendingOnly === p ? 'bg-white text-primary shadow-sm' : 'text-gray-500')}>
            {p ? 'Pending Payout' : 'All'}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      ) : data && data.withdrawals.length > 0 ? (
        <>
          <div className="space-y-3">
            {data.withdrawals.map((w) => {
              const profile = w.profiles
              const goalTitle = w.savings_goals && 'title' in w.savings_goals ? w.savings_goals.title : 'Goal'
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
                        <span>Penalty</span><span>−{formatFCFA(w.penalty_amount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-gray-500">Send to</span>
                      <span className="font-medium">{w.payout_phone ?? profile?.phone}</span>
                    </div>
                    {w.payout_reference && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Ref</span>
                        <span className="font-mono text-[10px]">{w.payout_reference}</span>
                      </div>
                    )}
                    {w.paid_at && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Paid</span>
                        <span>{formatDate(w.paid_at)}</span>
                      </div>
                    )}
                  </div>
                  {w.payout_status === 'pending_payout' && (
                    <Button size="sm" className="w-full" onClick={() => setPayModal({
                      id: w.id,
                      netAmount: w.net_amount,
                      phone: w.payout_phone ?? profile?.phone ?? '',
                      name: profile?.full_name ?? 'Saver',
                    })}>
                      Mark as Paid
                    </Button>
                  )}
                </Card>
              )
            })}
          </div>
          <Pagination page={page} pageSize={ADMIN_PAGE_SIZE} total={data.total} onPageChange={setPage} />
        </>
      ) : (
        <Card className="text-center py-12 text-gray-400 text-sm">
          {pendingOnly ? 'No pending payouts' : 'No withdrawals yet'}
        </Card>
      )}

      <Modal open={!!payModal} onClose={() => setPayModal(null)} title="Confirm Payout">
        {payModal && (
          <div className="space-y-4">
            <div className="rounded-lg bg-gray-50 p-4 text-sm space-y-2">
              <div className="flex justify-between"><span className="text-gray-500">Recipient</span><span className="font-medium">{payModal.name}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Phone</span><span className="font-medium">{payModal.phone}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Amount</span><span className="font-bold text-primary">{formatFCFA(payModal.netAmount)}</span></div>
            </div>
            <p className="text-xs text-gray-500">Confirm you have sent the Mobile Money payment before marking as paid.</p>
            <Input label="Payout reference (optional)" placeholder="MoMo transaction ID"
              value={payoutRef} onChange={(e) => setPayoutRef(e.target.value)} />
            <div className="flex gap-2 justify-end">
              <Button variant="ghost" onClick={() => setPayModal(null)}>Cancel</Button>
              <Button loading={markPaid.isPending} onClick={handleMarkPaid}>Confirm Paid</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
