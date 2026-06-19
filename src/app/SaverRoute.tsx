import { Navigate, Outlet } from 'react-router-dom'
import { useProfile } from '@/lib/api/hooks'
import { SplashScreen } from '@/components/brand/SplashScreen'

export function SaverRoute() {
  const { data: profile, isLoading } = useProfile()

  if (isLoading) return <SplashScreen />

  if (profile?.role === 'admin') {
    return <Navigate to="/admin" replace />
  }

  return <Outlet />
}
