import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  useProfile,
  useDashboardMetrics,
  useUpdateProfile,
} from '@/lib/api/hooks'
import { useAuth } from '@/app/AuthProvider'
import { Card, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { PasswordInput } from '@/components/ui/PasswordInput'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { getDisciplineBadge, formatFCFA } from '@/lib/utils'
import { getDisciplineProgress, DISCIPLINE_RULES, DISCIPLINE_PERKS } from '@/lib/discipline'
import { useLanguage } from '@/lib/i18n/LanguageProvider'
import type { TranslationKey } from '@/lib/i18n/translations'
import type { DisciplineLevel } from '@/types/database'
import {
  User,
  Mail,
  Phone,
  Award,
  LogOut,
  HelpCircle,
  History,
  Wallet,
  Smartphone,
  Pencil,
} from 'lucide-react'

export default function ProfilePage() {
  const { signOut, updatePassword } = useAuth()
  const { data: profile } = useProfile()
  const { data: metrics } = useDashboardMetrics()
  const updateProfile = useUpdateProfile()
  const { locale, setLocale, t } = useLanguage()

  const [editing, setEditing] = useState(false)
  const [editForm, setEditForm] = useState({ full_name: '', phone: '', payout_phone: '' })
  const [passwordForm, setPasswordForm] = useState({ password: '', confirm: '' })
  const [profileError, setProfileError] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [passwordSuccess, setPasswordSuccess] = useState(false)

  useEffect(() => {
    if (profile) {
      setEditForm({
        full_name: profile.full_name,
        phone: profile.phone,
        payout_phone: profile.payout_phone ?? profile.phone,
      })
    }
  }, [profile])

  const badge = getDisciplineBadge(metrics?.discipline_level ?? 'bronze')
  const progress = getDisciplineProgress(metrics?.discipline_points ?? 0)
  const level = (metrics?.discipline_level ?? 'bronze') as DisciplineLevel
  const perks = DISCIPLINE_PERKS[level] ?? []

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setProfileError('')
    try {
      await updateProfile.mutateAsync(editForm)
      setEditing(false)
    } catch (err) {
      setProfileError(err instanceof Error ? err.message : 'Failed to update profile')
    }
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (passwordForm.password !== passwordForm.confirm) {
      setPasswordError('Passwords do not match')
      return
    }
    setPasswordError('')
    setPasswordSuccess(false)
    try {
      await updatePassword(passwordForm.password)
      setPasswordForm({ password: '', confirm: '' })
      setPasswordSuccess(true)
    } catch (err) {
      setPasswordError(err instanceof Error ? err.message : 'Failed to update password')
    }
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="mx-auto h-20 w-20 rounded-full bg-gradient-to-br from-primary to-primary-light flex items-center justify-center mb-4">
          <span className="text-white text-2xl font-bold">
            {profile?.full_name?.charAt(0)?.toUpperCase() ?? 'U'}
          </span>
        </div>
        <h1 className="text-xl font-bold text-gray-900">{profile?.full_name}</h1>
        <span className={`inline-block mt-2 text-xs font-medium px-3 py-1 rounded-full ${badge.color}`}>
          <Award className="inline h-3 w-3 mr-1" />
          {badge.label} · {metrics?.discipline_points ?? 0} pts
        </span>
      </div>

      <Card>
        <CardTitle className="mb-3">Discipline Progress</CardTitle>
        {progress.next ? (
          <>
            <div className="flex justify-between text-xs text-gray-500 mb-2">
              <span>{progress.current.label}</span>
              <span>{progress.next.label} in {progress.pointsToNext} pts</span>
            </div>
            <ProgressBar value={progress.progressPercent} max={100} showLabel={false} />
          </>
        ) : (
          <p className="text-sm text-primary font-medium">Platinum level reached!</p>
        )}
        <div className="mt-4 space-y-2">
          {DISCIPLINE_RULES.map((rule) => (
            <div key={rule.action} className="flex justify-between text-xs">
              <span className="text-gray-500">{rule.action}</span>
              <span className={rule.points.startsWith('−') ? 'text-danger' : 'text-success'}>
                {rule.points}
              </span>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <CardTitle className="mb-3">{t('perks.title')}</CardTitle>
        <ul className="space-y-2">
          {perks.map((key) => (
            <li key={key} className="text-sm text-gray-600 flex items-center gap-2">
              <Award className="h-4 w-4 text-primary shrink-0" />
              {t(key as TranslationKey)}
            </li>
          ))}
        </ul>
      </Card>

      <Card>
        <CardTitle className="mb-4">{t('lang.label')}</CardTitle>
        <div className="flex gap-2">
          {(['en', 'fr'] as const).map((code) => (
            <button
              key={code}
              type="button"
              onClick={() => setLocale(code)}
              className={`flex-1 py-2 rounded-xl text-sm font-medium border transition-colors ${
                locale === code ? 'border-primary bg-primary/5 text-primary' : 'border-gray-200 text-gray-600'
              }`}
            >
              {t(code === 'en' ? 'lang.en' : 'lang.fr')}
            </button>
          ))}
        </div>
      </Card>

      <Card>
        <div className="flex items-center justify-between mb-4">
          <CardTitle>Account Details</CardTitle>
          {!editing && (
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="text-primary text-sm font-medium flex items-center gap-1"
            >
              <Pencil className="h-3.5 w-3.5" />
              Edit
            </button>
          )}
        </div>

        {editing ? (
          <form onSubmit={handleSaveProfile} className="space-y-4">
            {profileError && (
              <div className="rounded-xl bg-danger/10 text-danger text-sm px-4 py-3">{profileError}</div>
            )}
            <Input
              id="full_name"
              label="Full Name"
              value={editForm.full_name}
              onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
              required
            />
            <Input
              id="phone"
              label="Phone Number"
              type="tel"
              value={editForm.phone}
              onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
              required
            />
            <Input
              id="payout_phone"
              label="Payout Phone (Mobile Money)"
              type="tel"
              value={editForm.payout_phone}
              onChange={(e) => setEditForm({ ...editForm, payout_phone: e.target.value })}
              required
            />
            <p className="text-xs text-gray-400">
              Withdrawals are sent to your payout phone number.
            </p>
            <div className="flex gap-2">
              <Button type="submit" className="flex-1" loading={updateProfile.isPending}>
                Save
              </Button>
              <Button type="button" variant="ghost" className="flex-1" onClick={() => setEditing(false)}>
                Cancel
              </Button>
            </div>
          </form>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <User className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-xs text-gray-400">Full Name</p>
                <p className="text-sm font-medium">{profile?.full_name}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Mail className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-xs text-gray-400">Email</p>
                <p className="text-sm font-medium">{profile?.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Phone className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-xs text-gray-400">Phone</p>
                <p className="text-sm font-medium">{profile?.phone}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Smartphone className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-xs text-gray-400">Payout Phone</p>
                <p className="text-sm font-medium">{profile?.payout_phone ?? profile?.phone ?? '—'}</p>
              </div>
            </div>
          </div>
        )}
      </Card>

      <Card>
        <CardTitle className="mb-4">Change Password</CardTitle>
        <form onSubmit={handleChangePassword} className="space-y-4">
          {passwordError && (
            <div className="rounded-xl bg-danger/10 text-danger text-sm px-4 py-3">{passwordError}</div>
          )}
          {passwordSuccess && (
            <div className="rounded-xl bg-success/10 text-success text-sm px-4 py-3">
              Password updated successfully.
            </div>
          )}
          <PasswordInput
            id="new_password"
            label="New Password"
            value={passwordForm.password}
            onChange={(e) => setPasswordForm({ ...passwordForm, password: e.target.value })}
            minLength={8}
          />
          <PasswordInput
            id="confirm_password"
            label="Confirm Password"
            value={passwordForm.confirm}
            onChange={(e) => setPasswordForm({ ...passwordForm, confirm: e.target.value })}
            minLength={8}
          />
          <Button type="submit" variant="outline" className="w-full">
            Update Password
          </Button>
        </form>
      </Card>

      <Card>
        <CardTitle className="mb-2">Reserve Balance</CardTitle>
        <p className="text-sm text-gray-500 mb-2">
          {metrics?.activation_required
            ? `Deposit ${formatFCFA(metrics.activation_remaining)} to activate your account.`
            : `A permanent ${formatFCFA(metrics?.reserve_balance ?? 1000)} reserve keeps your account active.`}
        </p>
        <p className="text-2xl font-bold text-primary">{formatFCFA(metrics?.reserve_balance ?? 1000)}</p>
      </Card>

      <Card>
        <CardTitle className="mb-3">Quick Links</CardTitle>
        <div className="space-y-1">
          <Link to="/deposits" className="flex items-center gap-3 px-2 py-2.5 rounded-lg hover:bg-gray-50 text-sm text-gray-700">
            <Wallet className="h-4 w-4 text-gray-400" />
            My Deposits
          </Link>
          <Link to="/history/transactions" className="flex items-center gap-3 px-2 py-2.5 rounded-lg hover:bg-gray-50 text-sm text-gray-700">
            <History className="h-4 w-4 text-gray-400" />
            Transaction History
          </Link>
          <Link to="/history/withdrawals" className="flex items-center gap-3 px-2 py-2.5 rounded-lg hover:bg-gray-50 text-sm text-gray-700">
            <History className="h-4 w-4 text-gray-400" />
            Withdrawal History
          </Link>
          <Link to="/help" className="flex items-center gap-3 px-2 py-2.5 rounded-lg hover:bg-gray-50 text-sm text-gray-700">
            <HelpCircle className="h-4 w-4 text-gray-400" />
            Help & Support
          </Link>
        </div>
      </Card>

      <Button variant="ghost" className="w-full text-gray-500" onClick={() => signOut()}>
        <LogOut className="h-4 w-4" />
        Sign Out
      </Button>
    </div>
  )
}
