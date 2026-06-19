import { Link } from 'react-router-dom'
import { Clock, CheckCircle, XCircle } from 'lucide-react'
import { useMyDepositRequests } from '@/lib/api/hooks'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { DepositProofLink } from '@/components/ui/DepositProofLink'
import { formatFCFA, formatDate, getDepositStatusColor } from '@/lib/utils'
import { useLanguage } from '@/lib/i18n/LanguageProvider'

const statusIcons = {
  pending: Clock,
  approved: CheckCircle,
  rejected: XCircle,
}

export default function MyDepositsPage() {
  const { data: requests, isLoading } = useMyDepositRequests()
  const { t } = useLanguage()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{t('deposits.title')}</h1>
        <p className="text-gray-500 text-sm">{t('deposits.subtitle')}</p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      ) : requests && requests.length > 0 ? (
        <div className="space-y-3">
          {requests.map((req) => {
            const Icon = statusIcons[req.status]
            const goalTitle =
              req.savings_goals && 'title' in req.savings_goals
                ? req.savings_goals.title
                : 'Goal'
            return (
              <Card key={req.id}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex gap-3">
                    <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${getDepositStatusColor(req.status)}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{formatFCFA(req.amount)}</p>
                      <Link to={`/goals/${req.goal_id}`} className="text-xs text-primary hover:underline">
                        {goalTitle}
                      </Link>
                      <p className="text-xs text-gray-400 mt-1">{formatDate(req.created_at)}</p>
                      {req.proof_url && <DepositProofLink path={req.proof_url} />}
                      {req.status === 'rejected' && req.rejection_reason && (
                        <p className="text-xs text-danger mt-2 bg-danger/5 rounded-lg px-2 py-1">
                          Reason: {req.rejection_reason}
                        </p>
                      )}
                      {req.reviewed_at && req.status !== 'pending' && (
                        <p className="text-xs text-gray-400 mt-1">
                          Reviewed {formatDate(req.reviewed_at)}
                        </p>
                      )}
                    </div>
                  </div>
                  <Badge className={getDepositStatusColor(req.status)}>{req.status}</Badge>
                </div>
              </Card>
            )
          })}
        </div>
      ) : (
        <Card className="text-center py-12">
          <Clock className="h-10 w-10 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-400 text-sm">{t('deposits.empty')}</p>
          <Link to="/goals" className="text-sm text-primary font-medium mt-2 inline-block hover:underline">
            Go to your goals →
          </Link>
        </Card>
      )}
    </div>
  )
}
