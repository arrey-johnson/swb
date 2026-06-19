import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  useAdminUserDetail, useAdminUserGoals, useAdminUserTransactions,
  useAdminUpdateAccountStatus, useAdminVerifyPhone, useAdminCreditBalance,
  useAdminDebitBalance,
} from '@/lib/api/hooks'
import { Card, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { useToast } from '@/components/ui/Toast'
import { formatFCFA, formatDate, getGoalStatusColor, getDisciplineBadge } from '@/lib/utils'
import { ArrowLeft, Shield, Ban, CheckCircle, Phone } from 'lucide-react'
import type { AccountStatus } from '@/types/database'

export default function AdminUserDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { data: detail, isLoading } = useAdminUserDetail(id!)
  const { data: goals } = useAdminUserGoals(id!)
  const { data: transactions } = useAdminUserTransactions(id!)
  const updateStatus = useAdminUpdateAccountStatus()
  const verifyPhone = useAdminVerifyPhone()
  const creditBalance = useAdminCreditBalance()
  const debitBalance = useAdminDebitBalance()
  const toast = useToast()

  const [statusModal, setStatusModal] = useState<AccountStatus | null>(null)
  const [statusReason, setStatusReason] = useState('')
  const [adjustModal, setAdjustModal] = useState<'credit' | 'debit' | null>(null)
  const [adjustAmount, setAdjustAmount] = useState('')
  const [adjustReason, setAdjustReason] = useState('')
  const [adjustType, setAdjustType] = useState<'adjustment' | 'refund'>('adjustment')

  if (isLoading || !detail?.profile) {
    return (
      <div className="flex justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  const { profile, account, discipline } = detail
  const disciplineBadge = discipline ? getDisciplineBadge(discipline.level) : null

  const handleStatusChange = async () => {
    if (!statusModal || !id) return
    try {
      await updateStatus.mutateAsync({ userId: id, status: statusModal, reason: statusReason })
      toast.success(`Account ${statusModal}`)
      setStatusModal(null)
      setStatusReason('')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update status')
    }
  }

  const handleAdjust = async () => {
    if (!id || !adjustModal) return
    const amount = parseFloat(adjustAmount)
    if (isNaN(amount) || amount <= 0) { toast.error('Enter a valid amount'); return }
    if (!adjustReason.trim()) { toast.error('Reason is required'); return }
    try {
      if (adjustModal === 'credit') {
        await creditBalance.mutateAsync({ userId: id, amount, type: adjustType, reason: adjustReason })
        toast.success('Balance credited')
      } else {
        await debitBalance.mutateAsync({ userId: id, amount, reason: adjustReason })
        toast.success('Balance debited')
      }
      setAdjustModal(null)
      setAdjustAmount('')
      setAdjustReason('')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Adjustment failed')
    }
  }

  const accountStatusColor: Record<string, string> = {
    active: 'bg-success/10 text-success',
    pending: 'bg-warning/10 text-warning',
    suspended: 'bg-danger/10 text-danger',
    closed: 'bg-gray-100 text-gray-500',
  }

  return (
    <div className="space-y-6">
      <Link to="/admin/users" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-primary">
        <ArrowLeft className="h-4 w-4" /> Back to users
      </Link>

      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{profile.full_name}</h1>
          <p className="text-gray-500 text-sm">{profile.email} · {profile.phone}</p>
          {profile.payout_phone && <p className="text-xs text-gray-400">Payout: {profile.payout_phone}</p>}
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge className={accountStatusColor[account?.status ?? 'pending']}>
            {account?.status ?? 'unknown'}
          </Badge>
          {disciplineBadge && (
            <Badge className={disciplineBadge.color}>{disciplineBadge.label} · {discipline?.points}pts</Badge>
          )}
          {profile.phone_verified ? (
            <Badge className="bg-success/10 text-success"><Phone className="h-3 w-3" /> Verified</Badge>
          ) : (
            <Button size="sm" variant="outline" loading={verifyPhone.isPending}
              onClick={async () => {
                try {
                  await verifyPhone.mutateAsync({ userId: id!, verified: true })
                  toast.success('Phone marked verified')
                } catch (e) { toast.error(e instanceof Error ? e.message : 'Failed') }
              }}>
              Verify Phone
            </Button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card><p className="text-xs text-gray-500">Balance</p><p className="text-lg font-bold">{formatFCFA(account?.balance ?? 0)}</p></Card>
        <Card><p className="text-xs text-gray-500">Goals</p><p className="text-lg font-bold">{detail.active_goals} active / {detail.goals_count}</p></Card>
        <Card><p className="text-xs text-gray-500">Total Deposited</p><p className="text-lg font-bold">{formatFCFA(detail.total_deposited)}</p></Card>
        <Card><p className="text-xs text-gray-500">Pending</p><p className="text-lg font-bold">{detail.pending_deposits} dep · {detail.pending_payouts} pay</p></Card>
      </div>

      {/* Actions */}
      <Card>
        <CardTitle className="mb-4">Account Actions</CardTitle>
        <div className="flex flex-wrap gap-2">
          {account?.status === 'suspended' ? (
            <Button size="sm" onClick={() => setStatusModal('active')}>
              <CheckCircle className="h-4 w-4" /> Reactivate
            </Button>
          ) : account?.status !== 'closed' && (
            <Button size="sm" variant="outline" onClick={() => setStatusModal('suspended')}>
              <Ban className="h-4 w-4" /> Suspend
            </Button>
          )}
          {account?.status !== 'closed' && (
            <Button size="sm" variant="danger" onClick={() => setStatusModal('closed')}>
              Close Account
            </Button>
          )}
          <Button size="sm" variant="outline" onClick={() => { setAdjustModal('credit'); setAdjustType('refund') }}>
            Credit / Refund
          </Button>
          <Button size="sm" variant="outline" onClick={() => setAdjustModal('debit')}>
            Debit Adjustment
          </Button>
          <Link to={`/admin/notify?user=${id}`}>
            <Button size="sm" variant="ghost"><Shield className="h-4 w-4" /> Send Notification</Button>
          </Link>
        </div>
      </Card>

      {/* Goals */}
      <div>
        <h2 className="text-sm font-semibold text-gray-700 mb-3">Savings Goals</h2>
        <div className="space-y-2">
          {goals?.map((g) => (
            <Card key={g.id}>
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-medium text-sm">{g.title}</p>
                  <p className="text-xs text-gray-400">{formatFCFA(g.current_amount)} / {formatFCFA(g.target_amount)} · {g.duration_months}mo</p>
                </div>
                <Badge className={getGoalStatusColor(g.status)}>{g.status}</Badge>
              </div>
            </Card>
          ))}
          {goals?.length === 0 && <Card className="text-center py-8 text-gray-400 text-sm">No goals</Card>}
        </div>
      </div>

      {/* Recent transactions */}
      <div>
        <h2 className="text-sm font-semibold text-gray-700 mb-3">Recent Transactions</h2>
        <div className="space-y-2">
          {transactions?.map((tx) => (
            <Card key={tx.id}>
              <div className="flex justify-between text-sm">
                <div>
                  <p className="font-medium capitalize">{tx.transaction_type}</p>
                  <p className="text-xs text-gray-400">{tx.description}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold">{formatFCFA(tx.amount)}</p>
                  <p className="text-xs text-gray-400">{formatDate(tx.created_at)}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Status modal */}
      <Modal open={!!statusModal} onClose={() => setStatusModal(null)} title={`${statusModal} account`}>
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            This will change the account status to <strong>{statusModal}</strong> and notify the user.
          </p>
          <Input
            label="Reason (shown to user)"
            value={statusReason}
            onChange={(e) => setStatusReason(e.target.value)}
            placeholder="Explain why..."
          />
          <div className="flex gap-2 justify-end">
            <Button variant="ghost" onClick={() => setStatusModal(null)}>Cancel</Button>
            <Button loading={updateStatus.isPending} onClick={handleStatusChange}>Confirm</Button>
          </div>
        </div>
      </Modal>

      {/* Adjust modal */}
      <Modal open={!!adjustModal} onClose={() => setAdjustModal(null)}
        title={adjustModal === 'credit' ? 'Credit / Refund' : 'Debit Adjustment'}>
        <div className="space-y-4">
          {adjustModal === 'credit' && (
            <div className="flex gap-2">
              {(['refund', 'adjustment'] as const).map((t) => (
                <button key={t} type="button" onClick={() => setAdjustType(t)}
                  className={`flex-1 py-2 text-sm rounded-lg border capitalize ${adjustType === t ? 'border-primary bg-primary/5 text-primary' : 'border-gray-200'}`}>
                  {t}
                </button>
              ))}
            </div>
          )}
          <Input label="Amount (FCFA)" type="number" min="1" value={adjustAmount}
            onChange={(e) => setAdjustAmount(e.target.value)} />
          <Input label="Reason (required)" value={adjustReason}
            onChange={(e) => setAdjustReason(e.target.value)} placeholder="Explain this adjustment..." />
          <div className="flex gap-2 justify-end">
            <Button variant="ghost" onClick={() => setAdjustModal(null)}>Cancel</Button>
            <Button loading={creditBalance.isPending || debitBalance.isPending} onClick={handleAdjust}>
              Confirm
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
