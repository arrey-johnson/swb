import { Mail, CheckCircle } from 'lucide-react'
import { useAuth } from '@/app/AuthProvider'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'

export default function VerifyEmailPage() {
  const { user } = useAuth()

  return (
    <div className="min-h-screen flex items-center justify-center px-6 bg-gray-50">
      <Card className="max-w-sm w-full text-center">
        <div className="mx-auto h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center mb-4">
          {user?.email_confirmed_at ? (
            <CheckCircle className="h-7 w-7 text-success" />
          ) : (
            <Mail className="h-7 w-7 text-primary" />
          )}
        </div>
        <h1 className="text-xl font-bold text-gray-900 mb-2">Verify your email</h1>
        {user?.email_confirmed_at ? (
          <>
            <p className="text-gray-500 text-sm mb-6">Your email has been verified successfully.</p>
            <Button className="w-full" onClick={() => window.location.href = '/onboarding/terms'}>
              Continue
            </Button>
          </>
        ) : (
          <>
            <p className="text-gray-500 text-sm mb-2">
              We sent a verification link to <strong>{user?.email}</strong>
            </p>
            <p className="text-gray-400 text-xs mb-6">
              Click the link in your email, then refresh this page to continue.
            </p>
            <Button variant="outline" className="w-full" onClick={() => window.location.reload()}>
              I've verified my email
            </Button>
          </>
        )}
      </Card>
    </div>
  )
}
