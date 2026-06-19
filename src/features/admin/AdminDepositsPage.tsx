import { useState, useEffect } from 'react'
import { useDepositRequests, useApproveDeposit, useRejectDeposit } from '@/lib/api/hooks'
import { supabase } from '@/lib/supabase'
import { Card, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { formatFCFA, formatDate } from '@/lib/utils'
import { Check, X, Image } from 'lucide-react'

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

export default function AdminDepositsPage() {
  const { data: requests, isLoading } = useDepositRequests('pending')
  const approve = useApproveDeposit()
  const reject = useRejectDeposit()
  const [rejectId, setRejectId] = useState<string | null>(null)
  const [reason, setReason] = useState('')

  const handleReject = async (id: string) => {
    await reject.mutateAsync({ requestId: id, reason: reason || 'Rejected by admin' })
    setRejectId(null)
    setReason('')
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Deposit Queue</h1>
        <p className="text-gray-500 text-sm">{requests?.length ?? 0} pending</p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      ) : requests && requests.length > 0 ? (
        <div className="space-y-4">
          {requests.map((req) => (
            <Card key={req.id}>
              <div className="flex justify-between items-start mb-3">
                <div>
                  <CardTitle className="text-base">{formatFCFA(req.amount)}</CardTitle>
                  <p className="text-xs text-gray-400">
                    {req.profiles?.full_name} · {req.savings_goals?.title}
                  </p>
                  <p className="text-xs text-gray-400">{formatDate(req.created_at)}</p>
                </div>
              </div>

              {req.proof_url && <ProofLink path={req.proof_url} />}

              {rejectId === req.id ? (
                <div className="space-y-2">
                  <input
                    className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
                    placeholder="Rejection reason..."
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                  />
                  <div className="flex gap-2">
                    <Button size="sm" variant="danger" loading={reject.isPending} onClick={() => handleReject(req.id)}>
                      Confirm Reject
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setRejectId(null)}>Cancel</Button>
                  </div>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    loading={approve.isPending}
                    onClick={() => approve.mutate(req.id)}
                  >
                    <Check className="h-4 w-4" />
                    Approve
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setRejectId(req.id)}>
                    <X className="h-4 w-4" />
                    Reject
                  </Button>
                </div>
              )}
            </Card>
          ))}
        </div>
      ) : (
        <Card className="text-center py-12 text-gray-400 text-sm">
          No pending deposit requests
        </Card>
      )}
    </div>
  )
}
