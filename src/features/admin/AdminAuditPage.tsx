import { useState } from 'react'
import { useAuditLogs } from '@/lib/api/hooks'
import { Card } from '@/components/ui/Card'
import { Pagination, ADMIN_PAGE_SIZE } from '@/components/ui/Pagination'
import { formatDate } from '@/lib/utils'
import { cn } from '@/lib/utils'

const ACTIONS = [
  { value: '', label: 'All actions' },
  { value: 'approve_deposit', label: 'Approve deposit' },
  { value: 'reject_deposit', label: 'Reject deposit' },
  { value: 'send_notification', label: 'Send notification' },
]

export default function AdminAuditPage() {
  const [action, setAction] = useState('')
  const [page, setPage] = useState(1)
  const { data, isLoading } = useAuditLogs(action || undefined, page, ADMIN_PAGE_SIZE)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Audit Log</h1>
        <p className="text-gray-500 text-sm">Track admin actions across the platform</p>
      </div>

      <div className="flex rounded-xl bg-gray-100 p-1 overflow-x-auto">
        {ACTIONS.map((a) => (
          <button key={a.value} type="button"
            onClick={() => { setAction(a.value); setPage(1) }}
            className={cn('flex-shrink-0 px-3 py-2 text-sm font-medium rounded-lg transition-colors whitespace-nowrap',
              action === a.value ? 'bg-white text-primary shadow-sm' : 'text-gray-500')}>
            {a.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      ) : data && data.logs.length > 0 ? (
        <>
          <div className="space-y-2">
            {data.logs.map((log) => (
              <Card key={log.id}>
                <div className="flex justify-between items-start gap-3">
                  <div>
                    <p className="font-medium text-sm capitalize">{log.action.replace(/_/g, ' ')}</p>
                    <p className="text-xs text-gray-400">
                      by {log.profiles?.full_name ?? 'System'} · {formatDate(log.created_at)}
                    </p>
                    {log.metadata && Object.keys(log.metadata).length > 0 && (
                      <pre className="text-[10px] text-gray-500 mt-2 bg-gray-50 rounded p-2 overflow-x-auto">
                        {JSON.stringify(log.metadata, null, 2)}
                      </pre>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
          <Pagination page={page} pageSize={ADMIN_PAGE_SIZE} total={data.total} onPageChange={setPage} />
        </>
      ) : (
        <Card className="text-center py-12 text-gray-400 text-sm">No audit entries found</Card>
      )}
    </div>
  )
}
