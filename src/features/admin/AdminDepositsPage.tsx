import { useState, useEffect } from 'react'
import {
  useDepositRequestsPaginated, useApproveDeposit, useRejectDeposit,
} from '@/lib/api/hooks'
import { supabase } from '@/lib/supabase'
import { Card, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { Pagination, ADMIN_PAGE_SIZE } from '@/components/ui/Pagination'
import { useToast } from '@/components/ui/Toast'
import { formatFCFA, formatDate, getDepositStatusColor } from '@/lib/utils'
import { Check, X, Image } from 'lucide-react'
import { cn } from '@/lib/utils'

function ProofLink({ path }: { path: string }) {
  const [url, setUrl] = useState<string | null>(null)
  useEffect(() => {
    supabase.storage.from('deposit-proofs').createSignedUrl(path, 3600).then(({ data }) => {
      if (data?.signedUrl) setUrl(data.signedUrl)
    })
  }, [path])
  if (!url) return <span className="text-xs text-gray-400">Loading proof...</span>
  return (
    <a href={url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-primary mb-3 hover:underline">
      <Image className="h-4 w-4" />
      View payment screenshot
    </a>
  )
}

const TABS = [
  { key: 'pending', label: 'Pending' },
  { key: 'approved', label: 'Approved' },
  { key: 'rejected', label: 'Rejected' },
] as const

export default function AdminDepositsPage() {
  const [tab, setTab] = useState<typeof TABS[number]['key']>('pending')
  const [page, setPage] = useState(1)
  const { data, isLoading } = useDepositRequestsPaginated(tab, page, ADMIN_PAGE_SIZE)
  const approve = useApproveDeposit()
  const reject = useRejectDeposit()
  const toast = useToast()

  const [rejectId, setRejectId] = useState<string | null>(null)
  const [reason, setReason] = useState('')
  const [confirmApprove, setConfirmApprove] = useState<{ id: string; amount: number; name: string } | null>(null)

  const handleApprove = async (id: string) => {
    try {
      await approve.mutateAsync(id)
      toast.success('Deposit approved')
      setConfirmApprove(null)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Approval failed')
    }
  }

  const handleReject = async (id: string) => {
    try {
      await reject.mutateAsync({ requestId: id, reason: reason || 'Rejected by admin' })
      toast.success('Deposit rejected')
      setRejectId(null)
      setReason('')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Rejection failed')
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Deposit Queue</h1>
        <p className="text-gray-500 text-sm">Review and process deposit requests</p>
      </div>

      <div className="flex rounded-xl bg-gray-100 p-1">
        {TABS.map((t) => (
          <button key={t.key} type="button" onClick={() => { setTab(t.key); setPage(1) }}
            className={cn('flex-1 py-2 text-sm font-medium rounded-lg transition-colors',
              tab === t.key ? 'bg-white text-primary shadow-sm' : 'text-gray-500')}>
            {t.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      ) : data && data.requests.length > 0 ? (
        <>
          <div className="space-y-4">
            {data.requests.map((req) => (
              <Card key={req.id}>
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-base">{formatFCFA(req.amount)}</CardTitle>
                      {tab !== 'pending' && (
                        <Badge className={getDepositStatusColor(req.status)}>{req.status}</Badge>
                      )}
                    </div>
                    <p className="text-xs text-gray-400">
                      {req.profiles?.full_name} · {req.savings_goals?.title}
                    </p>
                    <p className="text-xs text-gray-400">{formatDate(req.created_at)}</p>
                    {req.rejection_reason && (
                      <p className="text-xs text-danger mt-1">Reason: {req.rejection_reason}</p>
                    )}
                  </div>
                </div>

                {req.proof_url && <ProofLink path={req.proof_url} />}

                {tab === 'pending' && (
                  rejectId === req.id ? (
                    <div className="space-y-2">
                      <input className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
                        placeholder="Rejection reason..." value={reason}
                        onChange={(e) => setReason(e.target.value)} />
                      <div className="flex gap-2">
                        <Button size="sm" variant="danger" loading={reject.isPending}
                          onClick={() => handleReject(req.id)}>Confirm Reject</Button>
                        <Button size="sm" variant="ghost" onClick={() => setRejectId(null)}>Cancel</Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => setConfirmApprove({
                        id: req.id, amount: req.amount, name: req.profiles?.full_name ?? 'Saver',
                      })}>
                        <Check className="h-4 w-4" /> Approve
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setRejectId(req.id)}>
                        <X className="h-4 w-4" /> Reject
                      </Button>
                    </div>
                  )
                )}
              </Card>
            ))}
          </div>
          <Pagination page={page} pageSize={ADMIN_PAGE_SIZE} total={data.total} onPageChange={setPage} />
        </>
      ) : (
        <Card className="text-center py-12 text-gray-400 text-sm">
          No {tab} deposit requests
        </Card>
      )}

      <Modal open={!!confirmApprove} onClose={() => setConfirmApprove(null)} title="Confirm Approval">
        {confirmApprove && (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Approve <strong>{formatFCFA(confirmApprove.amount)}</strong> deposit for{' '}
              <strong>{confirmApprove.name}</strong>? This will credit their goal immediately.
            </p>
            <div className="flex gap-2 justify-end">
              <Button variant="ghost" onClick={() => setConfirmApprove(null)}>Cancel</Button>
              <Button loading={approve.isPending} onClick={() => handleApprove(confirmApprove.id)}>
                Confirm Approve
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
