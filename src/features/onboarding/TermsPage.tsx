import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAcceptTerms, useProfile } from '@/lib/api/hooks'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'

export default function TermsPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const acceptTerms = useAcceptTerms()
  const { data: profile } = useProfile()
  const [agreed, setAgreed] = useState(false)

  const readOnly = !!profile?.terms_accepted_at && location.pathname === '/onboarding/terms'

  const handleAccept = async () => {
    await acceptTerms.mutateAsync()
    navigate('/onboarding/first-goal')
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6 bg-gray-50">
      <Card className="max-w-md w-full">
        <h1 className="text-xl font-bold text-gray-900 mb-2">Terms & Conditions</h1>
        <p className="text-gray-500 text-sm mb-4">
          {readOnly ? 'Review our terms and conditions.' : 'Please read and accept our terms to continue.'}
        </p>

        <div className="max-h-64 overflow-y-auto rounded-xl bg-gray-50 p-4 text-sm text-gray-600 space-y-3 mb-6">
          <p>By using SaveWithBanks, you agree to lock your savings for the selected duration. Early withdrawals incur penalty fees as configured.</p>
          <p>Your account maintains a permanent reserve balance of 1,000 FCFA that cannot be withdrawn under any circumstances.</p>
          <p>Deposits are processed after admin verification of your payment proof. SaveWithBanks is not responsible for payments sent to incorrect accounts.</p>
          <p>You agree to provide accurate personal information and maintain the security of your account credentials.</p>
        </div>

        <label className="flex items-start gap-3 mb-6 cursor-pointer">
          <input
            type="checkbox"
            checked={readOnly ? true : agreed}
            disabled={readOnly}
            onChange={(e) => setAgreed(e.target.checked)}
            className="mt-1 rounded border-gray-300 text-primary focus:ring-primary"
          />
          <span className="text-sm text-gray-700">I have read and agree to the Terms & Conditions</span>
        </label>

        {readOnly ? (
          <Button className="w-full" variant="outline" onClick={() => navigate(-1)}>
            Back
          </Button>
        ) : (
          <Button
            className="w-full"
            disabled={!agreed}
            loading={acceptTerms.isPending}
            onClick={handleAccept}
          >
            Accept & Continue
          </Button>
        )}
      </Card>
    </div>
  )
}
