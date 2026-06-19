import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { AlertTriangle, Smartphone } from 'lucide-react'
import { useGoal, useWithdrawFunds, usePenaltyPreview, useProfile } from '@/lib/api/hooks'
import { useAccountBlocked } from '@/components/layout/AccountStatusBanner'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import { formatFCFA } from '@/lib/utils'

export default function WithdrawPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: goal } = useGoal(id!)
  const { data: profile } = useProfile()
  const withdrawFunds = useWithdrawFunds()
  const blocked = useAccountBlocked()

  const [amount, setAmount] = useState('')
  const [error, setError] = useState('')
  const [confirmed, setConfirmed] = useState(false)

  const payoutPhone = profile?.payout_phone ?? profile?.phone
  const numAmount = parseFloat(amount) || 0
  const { data: preview } = usePenaltyPreview(id!, numAmount)

  const handleWithdraw = async () => {
    setError('')
    try {
      await withdrawFunds.mutateAsync({ goal_id: id!, amount: numAmount })
      navigate('/history/withdrawals')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Withdrawal failed')
    }
  }

  if (blocked) {
    return (
      <Card className="text-center py-12 border-danger/20">
        <AlertTriangle className="h-10 w-10 text-danger mx-auto mb-3" />
        <p className="text-gray-600 text-sm">Withdrawals are not available on your account.</p>
        <Button className="mt-4" variant="outline" onClick={() => navigate(`/goals/${id}`)}>
          Back to Goal
        </Button>
      </Card>
    )
  }

  if (!payoutPhone) {
    return (
      <Card className="text-center py-12">
        <Smartphone className="h-10 w-10 text-primary mx-auto mb-3" />
        <p className="text-gray-600 text-sm mb-4">
          Set a payout phone number before withdrawing funds.
        </p>
        <Link to="/profile">
          <Button>Go to Profile</Button>
        </Link>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Withdraw Funds</h1>
        <p className="text-gray-500 text-sm">From {goal?.title}</p>
      </div>

      <Card className="bg-primary/5 border-primary/20">
        <div className="flex gap-3 text-sm">
          <Smartphone className="h-5 w-5 text-primary shrink-0 mt-0.5" />
          <div>
            <p className="text-gray-600">
              Payout will be sent to <strong>{payoutPhone}</strong> via Mobile Money.
            </p>
            <Link to="/profile" className="text-xs text-primary hover:underline mt-1 inline-block">
              Change payout number
            </Link>
          </div>
        </div>
      </Card>

      <Card className="bg-warning/5 border-warning/20">
        <div className="flex gap-3">
          <AlertTriangle className="h-5 w-5 text-warning shrink-0 mt-0.5" />
          <div className="text-sm text-gray-600">
            <p>Your account must maintain a <strong>1,000 FCFA</strong> reserve balance.</p>
            {preview?.is_early && (
              <p className="mt-1 text-warning">Early withdrawal penalties apply before maturity.</p>
            )}
            <p className="mt-1 text-gray-500">Payouts typically process within 1–2 business days.</p>
          </div>
        </div>
      </Card>

      <Card>
        <div className="space-y-4">
          <Input
            id="amount"
            label={`Amount (max ${formatFCFA(goal?.current_amount ?? 0)})`}
            type="number"
            min="1"
            max={goal?.current_amount}
            value={amount}
            onChange={(e) => { setAmount(e.target.value); setConfirmed(false) }}
          />

          {preview && numAmount > 0 && (
            <div className="rounded-xl bg-gray-50 p-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Withdrawal Amount</span>
                <span>{formatFCFA(numAmount)}</span>
              </div>
              {preview.is_early && (
                <div className="flex justify-between text-danger">
                  <span>Penalty ({preview.penalty_percentage}%)</span>
                  <span>-{formatFCFA(preview.penalty_amount)}</span>
                </div>
              )}
              <div className="flex justify-between font-semibold border-t border-gray-200 pt-2">
                <span>You Receive</span>
                <span className="text-primary">{formatFCFA(preview.net_amount)}</span>
              </div>
            </div>
          )}

          {error && <div className="rounded-xl bg-danger/10 text-danger text-sm px-4 py-3">{error}</div>}

          {!confirmed ? (
            <Button
              className="w-full"
              disabled={numAmount <= 0 || numAmount > (goal?.current_amount ?? 0)}
              onClick={() => setConfirmed(true)}
            >
              Review Withdrawal
            </Button>
          ) : (
            <div className="space-y-2">
              <Button
                className="w-full"
                variant="danger"
                loading={withdrawFunds.isPending}
                onClick={handleWithdraw}
              >
                Confirm Withdrawal
              </Button>
              <Button className="w-full" variant="ghost" onClick={() => setConfirmed(false)}>
                Cancel
              </Button>
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}
