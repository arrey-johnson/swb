import { Navigate } from 'react-router-dom'
import { useProfile } from '@/lib/api/hooks'

export function RoleRedirect() {
  const { data: profile, isLoading } = useProfile()

  if (isLoading) {
    return (
      <div className="min-h-dvh flex items-center justify-center safe-area-pt safe-area-pb">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  if (profile?.role === 'admin') {
    return <Navigate to="/admin" replace />
  }

  return <Navigate to="/dashboard" replace />
}
