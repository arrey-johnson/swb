import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/app/AuthProvider'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import { Mail, CheckCircle } from 'lucide-react'
import { AppIcon } from '@/components/brand/BrandMark'

export default function ForgotPasswordPage() {
  const { resetPassword } = useAuth()
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await resetPassword(email)
      setSent(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send reset email')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-dvh flex flex-col justify-center px-6 py-12 bg-gradient-to-b from-primary/5 to-gray-50 safe-area-pt safe-area-pb safe-area-px">
      <div className="mx-auto w-full max-w-sm">
        <div className="text-center mb-8">
          <AppIcon size="lg" className="rounded-2xl mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900">Reset password</h1>
          <p className="text-gray-500 mt-1">We'll email you a reset link</p>
        </div>

        <Card className="p-6">
          {sent ? (
            <div className="text-center">
              <CheckCircle className="h-10 w-10 text-success mx-auto mb-3" />
              <p className="text-sm text-gray-600 mb-4">
                If an account exists for <strong>{email}</strong>, you'll receive a password reset link shortly.
              </p>
              <Link to="/login" className="text-sm text-primary font-medium hover:underline">
                Back to sign in
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="rounded-xl bg-danger/10 text-danger text-sm px-4 py-3">{error}</div>
              )}
              <Input
                id="email"
                label="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
              />
              <Button type="submit" className="w-full" loading={loading}>
                <Mail className="h-4 w-4" />
                Send Reset Link
              </Button>
              <p className="text-center text-sm text-gray-500">
                <Link to="/login" className="text-primary font-medium hover:underline">
                  Back to sign in
                </Link>
              </p>
            </form>
          )}
        </Card>
      </div>
    </div>
  )
}
