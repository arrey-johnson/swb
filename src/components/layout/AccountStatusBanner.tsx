import { Link } from 'react-router-dom'
import { AlertTriangle, XCircle, AlertCircle } from 'lucide-react'
import { useDashboardMetrics, useGoals } from '@/lib/api/hooks'
import { formatFCFA } from '@/lib/utils'
import type { AccountStatus } from '@/types/database'

export function AccountStatusBanner() {
  const { data: metrics } = useDashboardMetrics()
  const { data: goals } = useGoals()
  const status = metrics?.account_status as AccountStatus | undefined

  if (!status || status === 'active') return null

  if (status === 'pending') {
    const firstGoal = goals?.[0]
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 flex items-start gap-3 mb-4">
        <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="flex-1 text-sm">
          <p className="font-semibold text-amber-900">Account not active</p>
          <p className="text-amber-800 text-xs mt-0.5">
            Deposit at least {formatFCFA(metrics?.activation_remaining ?? 1000)} to activate your account.
            The {formatFCFA(metrics?.reserve_balance ?? 1000)} reserve floor secures your account and cannot be withdrawn.
          </p>
          {firstGoal && (
            <Link
              to={`/goals/${firstGoal.id}/deposit`}
              className="inline-block mt-2 text-xs font-medium text-primary hover:underline"
            >
              Make activation deposit →
            </Link>
          )}
        </div>
      </div>
    )
  }

  if (status === 'suspended') {
    return (
      <div className="rounded-xl border border-danger/30 bg-danger/5 px-4 py-3 flex items-start gap-3 mb-4">
        <AlertTriangle className="h-5 w-5 text-danger shrink-0 mt-0.5" />
        <div className="flex-1 text-sm">
          <p className="font-semibold text-danger">Account suspended</p>
          <p className="text-gray-600 text-xs mt-0.5">
            Deposits and withdrawals are disabled.{' '}
            <Link to="/help" className="text-primary font-medium hover:underline">
              Contact support
            </Link>
          </p>
        </div>
      </div>
    )
  }

  if (status === 'closed') {
    return (
      <div className="rounded-xl border border-gray-300 bg-gray-100 px-4 py-3 flex items-start gap-3 mb-4">
        <XCircle className="h-5 w-5 text-gray-500 shrink-0 mt-0.5" />
        <div className="flex-1 text-sm">
          <p className="font-semibold text-gray-700">Account closed</p>
          <p className="text-gray-500 text-xs mt-0.5">
            This account is no longer active.{' '}
            <Link to="/help" className="text-primary font-medium hover:underline">
              Contact support
            </Link>
          </p>
        </div>
      </div>
    )
  }

  return null
}

export function useAccountBlocked() {
  const { data: metrics } = useDashboardMetrics()
  const status = metrics?.account_status
  return status === 'suspended' || status === 'closed'
}
