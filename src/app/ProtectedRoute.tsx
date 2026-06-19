import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '@/app/AuthProvider'
import { RoleRedirect } from '@/app/RoleRedirect'
import { SplashScreen } from '@/components/brand/SplashScreen'

export function ProtectedRoute() {
  const { user, loading } = useAuth()

  if (loading) return <SplashScreen />

  if (!user) return <Navigate to="/login" replace />
  return <Outlet />
}

export function PublicRoute() {
  const { user, loading } = useAuth()

  if (loading) return <SplashScreen />

  if (user) return <RoleRedirect />
  return <Outlet />
}
