import { Link } from 'react-router-dom'
import { useGoals } from '@/lib/api/hooks'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Wallet, AlertCircle } from 'lucide-react'
import { formatFCFA } from '@/lib/utils'

const ACTIVATION_MIN = 1000

export default function FundGoalPage() {
  const { data: goals } = useGoals()
  const firstGoal = goals?.[0]

  return (
    <div className="min-h-screen flex items-center justify-center px-6 bg-gray-50">
      <Card className="max-w-md w-full text-center">
        <div className="mx-auto h-14 w-14 rounded-full bg-success/10 flex items-center justify-center mb-4">
          <Wallet className="h-7 w-7 text-success" />
        </div>
        <h1 className="text-xl font-bold text-gray-900 mb-2">Activate your account</h1>
        <p className="text-gray-500 text-sm mb-4">
          New accounts start with a zero balance. Deposit at least{' '}
          <strong>{formatFCFA(ACTIVATION_MIN)}</strong> to activate your account and start saving toward{' '}
          <strong>{firstGoal?.title ?? 'your goal'}</strong>.
        </p>

        <div className="flex items-start gap-2 rounded-xl bg-amber-50 border border-amber-200 p-3 text-left mb-6">
          <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
          <p className="text-xs text-amber-800">
            The {formatFCFA(ACTIVATION_MIN)} activation deposit becomes your permanent reserve floor and cannot be withdrawn.
          </p>
        </div>

        {firstGoal ? (
          <Link to={`/goals/${firstGoal.id}/deposit`} className="block">
            <Button className="w-full">Deposit {formatFCFA(ACTIVATION_MIN)} to Activate</Button>
          </Link>
        ) : (
          <p className="text-sm text-gray-400">Create a goal first to make your activation deposit.</p>
        )}
      </Card>
    </div>
  )
}
