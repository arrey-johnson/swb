import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '@/app/AuthProvider'
import { useProfile, useGoals } from '@/lib/api/hooks'

export function OnboardingGuard() {
  const { user } = useAuth()
  const { data: profile, isLoading: profileLoading } = useProfile()
  const { data: goals, isLoading: goalsLoading } = useGoals()

  if (profileLoading || goalsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  if (!user?.email_confirmed_at) {
    return <Navigate to="/onboarding/verify" replace />
  }

  if (!profile?.terms_accepted_at) {
    return <Navigate to="/onboarding/terms" replace />
  }

  if (!goals || goals.length === 0) {
    return <Navigate to="/onboarding/first-goal" replace />
  }

  if (!profile?.onboarding_completed) {
    return <Navigate to="/onboarding/fund" replace />
  }

  return <Outlet />
}
