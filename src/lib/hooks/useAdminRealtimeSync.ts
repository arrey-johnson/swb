import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { queryKeys } from '@/lib/query-keys'

export function useAdminRealtimeSync() {
  const qc = useQueryClient()

  useEffect(() => {
    const invalidate = () => {
      qc.invalidateQueries({ queryKey: queryKeys.depositRequests })
      qc.invalidateQueries({ queryKey: queryKeys.adminWithdrawals })
      qc.invalidateQueries({ queryKey: queryKeys.adminMetrics })
      qc.invalidateQueries({ queryKey: queryKeys.adminUsers })
      qc.invalidateQueries({ queryKey: queryKeys.auditLogs })
    }

    const channel = supabase
      .channel('admin-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'deposit_requests' }, invalidate)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'withdrawals' }, invalidate)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'profiles' }, invalidate)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'audit_logs' }, invalidate)
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [qc])
}
