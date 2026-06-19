import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { queryKeys } from '@/lib/query-keys'
import { useAuth } from '@/app/AuthProvider'

export function useRealtimeSync() {
  const { user } = useAuth()
  const qc = useQueryClient()

  useEffect(() => {
    if (!user) return

    const invalidate = () => {
      qc.invalidateQueries({ queryKey: queryKeys.notifications })
      qc.invalidateQueries({ queryKey: queryKeys.unreadCount })
      qc.invalidateQueries({ queryKey: queryKeys.myDepositRequests })
      qc.invalidateQueries({ queryKey: queryKeys.depositRequests })
      qc.invalidateQueries({ queryKey: queryKeys.withdrawals })
      qc.invalidateQueries({ queryKey: queryKeys.transactions })
      qc.invalidateQueries({ queryKey: queryKeys.dashboard })
      qc.invalidateQueries({ queryKey: queryKeys.goals })
    }

    const channel = supabase
      .channel(`saver-${user.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` },
        invalidate
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'deposit_requests', filter: `user_id=eq.${user.id}` },
        invalidate
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'withdrawals', filter: `user_id=eq.${user.id}` },
        invalidate
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'transactions', filter: `user_id=eq.${user.id}` },
        invalidate
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user, qc])
}
