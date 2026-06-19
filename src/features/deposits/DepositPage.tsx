import { useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Phone, User, Upload, CheckCircle, AlertCircle, Copy, Check, Clock } from 'lucide-react'
import { useGoal, useDepositRequest, useCompleteOnboarding, useDashboardMetrics, useDepositInstructions, useMyDepositRequests } from '@/lib/api/hooks'
import { useLanguage } from '@/lib/i18n/LanguageProvider'
import { useAccountBlocked } from '@/components/layout/AccountStatusBanner'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/app/AuthProvider'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardTitle } from '@/components/ui/Card'
import { formatFCFA } from '@/lib/utils'

export default function DepositPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { data: goal } = useGoal(id!)
  const { data: metrics } = useDashboardMetrics()
  const { data: instructions } = useDepositInstructions()
  const depositRequest = useDepositRequest()
  const completeOnboarding = useCompleteOnboarding()
  const { data: myDeposits } = useMyDepositRequests()
  const blocked = useAccountBlocked()
  const { t } = useLanguage()
  const fileRef = useRef<HTMLInputElement>(null)

  const hasPendingForGoal = myDeposits?.some((d) => d.goal_id === id && d.status === 'pending')

  const DEPOSIT_PHONE = instructions?.phone ?? '654112103'
  const DEPOSIT_NAME = instructions?.name ?? 'Melvis-Dalitine'

  const [amount, setAmount] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [error, setError] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [phoneCopied, setPhoneCopied] = useState(false)

  const needsActivation = metrics?.activation_required ?? false
  const minAmount = needsActivation ? (metrics?.reserve_balance ?? 1000) : 100

  const copyPhoneNumber = async () => {
    try {
      await navigator.clipboard.writeText(DEPOSIT_PHONE)
      setPhoneCopied(true)
      window.setTimeout(() => setPhoneCopied(false), 2000)
    } catch {
      const textarea = document.createElement('textarea')
      textarea.value = DEPOSIT_PHONE
      textarea.style.position = 'fixed'
      textarea.style.opacity = '0'
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
      setPhoneCopied(true)
      window.setTimeout(() => setPhoneCopied(false), 2000)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file || !user) return
    setError('')

    const parsedAmount = parseFloat(amount)
    if (needsActivation && parsedAmount < minAmount) {
      setError(`A minimum deposit of ${formatFCFA(minAmount)} is required to activate your account.`)
      return
    }

    setLoading(true)

    try {
      const ext = file.name.split('.').pop()
      const path = `${user.id}/${id}/${Date.now()}.${ext}`

      const { error: uploadError } = await supabase.storage
        .from('deposit-proofs')
        .upload(path, file)

      if (uploadError) throw uploadError

      await depositRequest.mutateAsync({
        goal_id: id!,
        amount: parseFloat(amount),
        proof_url: path,
      })

      try {
        await completeOnboarding.mutateAsync()
      } catch {
        // onboarding may already be complete
      }

      setSubmitted(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Deposit request failed')
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <div className="text-center py-12">
        <div className="mx-auto h-16 w-16 rounded-full bg-success/10 flex items-center justify-center mb-4">
          <CheckCircle className="h-8 w-8 text-success" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Deposit Request Submitted</h2>
        <p className="text-gray-500 text-sm mb-6">
          Your deposit of {formatFCFA(parseFloat(amount))} is pending admin review.
        </p>
        <div className="flex flex-col gap-2">
          <Button onClick={() => navigate('/deposits')}>Track Deposit Status</Button>
          <Button variant="ghost" onClick={() => navigate(`/goals/${id}`)}>Back to Goal</Button>
        </div>
      </div>
    )
  }

  if (blocked) {
    return (
      <div className="space-y-6">
        <Card className="text-center py-12 border-danger/20">
          <AlertCircle className="h-10 w-10 text-danger mx-auto mb-3" />
          <p className="text-gray-600 text-sm">Deposits are not available on your account.</p>
          <Button className="mt-4" variant="outline" onClick={() => navigate(`/goals/${id}`)}>
            Back to Goal
          </Button>
        </Card>
      </div>
    )
  }

  if (hasPendingForGoal) {
    return (
      <div className="space-y-6">
        <Card className="text-center py-12 border-amber-200 bg-amber-50">
          <Clock className="h-10 w-10 text-amber-500 mx-auto mb-3" />
          <p className="text-gray-700 text-sm px-4">{t('deposits.pendingBlocked')}</p>
          <div className="flex flex-col gap-2 mt-4">
            <Button onClick={() => navigate('/deposits')}>View My Deposits</Button>
            <Button variant="ghost" onClick={() => navigate(`/goals/${id}`)}>Back to Goal</Button>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Make a Deposit</h1>
        <p className="text-gray-500 text-sm">
          {needsActivation ? 'Activate your account' : `Fund ${goal?.title}`}
        </p>
      </div>

      <Card className="bg-primary/5 border-primary/20">
        <CardTitle className="text-primary mb-3">Payment Instructions</CardTitle>
        <p className="text-sm text-gray-600 mb-4">
          Send your payment via Mobile Money or Bank Transfer to:
        </p>
        <div className="space-y-3">
          <div className="flex items-center gap-3 bg-white rounded-xl p-3">
            <Phone className="h-5 w-5 text-primary shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-400">Phone Number</p>
              <p className="font-semibold text-lg tracking-wide">{DEPOSIT_PHONE}</p>
            </div>
            <button
              type="button"
              onClick={copyPhoneNumber}
              aria-label={phoneCopied ? 'Phone number copied' : 'Copy phone number'}
              className={`shrink-0 flex h-12 w-12 items-center justify-center rounded-xl transition-all active:scale-95 ${
                phoneCopied
                  ? 'bg-success/15 text-success'
                  : 'bg-primary/10 text-primary hover:bg-primary/20'
              }`}
            >
              {phoneCopied ? <Check className="h-5 w-5" /> : <Copy className="h-5 w-5" />}
            </button>
          </div>
          {phoneCopied && (
            <p className="text-xs text-success font-medium text-right -mt-1">Number copied!</p>
          )}
          <div className="flex items-center gap-3 bg-white rounded-xl p-3">
            <User className="h-5 w-5 text-primary" />
            <div>
              <p className="text-xs text-gray-400">Account Name</p>
              <p className="font-semibold">{DEPOSIT_NAME}</p>
            </div>
          </div>
        </div>
      </Card>

      <Card>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <div className="rounded-xl bg-danger/10 text-danger text-sm px-4 py-3">{error}</div>}
          <Input
            id="amount"
            label={needsActivation ? `Minimum ${formatFCFA(minAmount)}` : 'Amount (FCFA)'}
            type="number"
            min={minAmount}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Payment Screenshot
            </label>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="w-full border-2 border-dashed border-gray-200 rounded-xl p-8 text-center hover:border-primary/50 transition-colors"
            >
              <Upload className="h-8 w-8 text-gray-300 mx-auto mb-2" />
              {file ? (
                <p className="text-sm text-primary font-medium">{file.name}</p>
              ) : (
                <p className="text-sm text-gray-400">Tap to upload screenshot</p>
              )}
            </button>
          </div>

          <Button type="submit" className="w-full" loading={loading} disabled={!file || !amount}>
            Submit Deposit Request
          </Button>
        </form>
      </Card>
    </div>
  )
}
