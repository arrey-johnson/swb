import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '@/app/AuthProvider'
import { useProfile, useGoals } from '@/lib/api/hooks'
import { SplashScreen } from '@/components/brand/SplashScreen'

export function OnboardingGuard() {
  const { user } = useAuth()
  const { data: profile, isLoading: profileLoading } = useProfile()
  const { data: goals, isLoading: goalsLoading } = useGoals()

  if (profileLoading || goalsLoading) return <SplashScreen />

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
