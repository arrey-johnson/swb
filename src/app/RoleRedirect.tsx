import { Navigate } from 'react-router-dom'
import { useProfile } from '@/lib/api/hooks'
import { SplashScreen } from '@/components/brand/SplashScreen'

export function RoleRedirect() {
  const { data: profile, isLoading } = useProfile()

  if (isLoading) return <SplashScreen />

  if (profile?.role === 'admin') {
    return <Navigate to="/admin" replace />
  }

  return <Navigate to="/dashboard" replace />
}
