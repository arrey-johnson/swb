import { useState, useEffect } from 'react'
import { useDepositInstructions, useUpdatePlatformSettings } from '@/lib/api/hooks'
import { Card, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useToast } from '@/components/ui/Toast'
import { supabase } from '@/lib/supabase'
import { Shield, Smartphone } from 'lucide-react'

export default function AdminSettingsPage() {
  const { data: instructions, isLoading } = useDepositInstructions()
  const updateSettings = useUpdatePlatformSettings()
  const toast = useToast()

  const [phone, setPhone] = useState('')
  const [name, setName] = useState('')
  const [mfaEnabled, setMfaEnabled] = useState<boolean | null>(null)

  useEffect(() => {
    if (instructions) {
      setPhone(instructions.phone)
      setName(instructions.name)
    }
  }, [instructions])

  useEffect(() => {
    supabase.auth.mfa.listFactors().then(({ data }) => {
      const verified = data?.totp?.some((f) => f.status === 'verified') ?? false
      setMfaEnabled(verified)
    }).catch(() => setMfaEnabled(false))
  }, [])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await updateSettings.mutateAsync({ phone: phone.trim(), name: name.trim() })
      toast.success('Deposit instructions updated')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save')
    }
  }

  const handleEnrollMfa = async () => {
    try {
      const { data, error } = await supabase.auth.mfa.enroll({ factorType: 'totp' })
      if (error) throw error
      if (data?.totp?.qr_code) {
        window.open(data.totp.qr_code, '_blank')
        toast.success('Scan the QR code with your authenticator app, then verify in Supabase Auth settings')
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'MFA enrollment failed')
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-500 text-sm">Platform configuration and security</p>
      </div>

      <Card>
        <CardTitle className="mb-4 flex items-center gap-2">
          <Smartphone className="h-5 w-5" /> Deposit Instructions
        </CardTitle>
        <p className="text-sm text-gray-500 mb-4">
          Mobile Money details shown to savers when they make a deposit.
        </p>
        {isLoading ? (
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        ) : (
          <form onSubmit={handleSave} className="space-y-4 max-w-md">
            <Input label="Mobile Money Phone" value={phone} onChange={(e) => setPhone(e.target.value)} required />
            <Input label="Account Name" value={name} onChange={(e) => setName(e.target.value)} required />
            <Button type="submit" loading={updateSettings.isPending}>Save Changes</Button>
          </form>
        )}
      </Card>

      <Card>
        <CardTitle className="mb-4 flex items-center gap-2">
          <Shield className="h-5 w-5" /> Admin Security
        </CardTitle>
        <p className="text-sm text-gray-500 mb-4">
          Two-factor authentication adds an extra layer of security for admin accounts.
        </p>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">MFA Status</p>
            <p className="text-xs text-gray-400">
              {mfaEnabled === null ? 'Checking...' : mfaEnabled ? 'Enabled' : 'Not enabled'}
            </p>
          </div>
          {!mfaEnabled && mfaEnabled !== null && (
            <Button size="sm" variant="outline" onClick={handleEnrollMfa}>Enable MFA</Button>
          )}
        </div>
      </Card>
    </div>
  )
}
