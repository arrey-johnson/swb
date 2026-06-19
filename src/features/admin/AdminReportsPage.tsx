import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useToast } from '@/components/ui/Toast'
import { Download } from 'lucide-react'

const EXPORT_TYPES = [
  { type: 'transactions', label: 'Transactions', desc: 'All deposit, withdrawal, penalty, and adjustment records' },
  { type: 'withdrawals', label: 'Withdrawals', desc: 'Withdrawal records with penalty and payout details' },
  { type: 'deposits', label: 'Deposit Requests', desc: 'All deposit requests with status and review info' },
  { type: 'users', label: 'Users', desc: 'Saver profiles with account balance and status' },
] as const

export default function AdminReportsPage() {
  const [loading, setLoading] = useState<string | null>(null)
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const toast = useToast()

  const handleExport = async (type: string) => {
    setLoading(type)
    try {
      const { data, error } = await supabase.functions.invoke('export-report', {
        body: {
          type,
          from: from ? new Date(from).toISOString() : undefined,
          to: to ? new Date(to + 'T23:59:59').toISOString() : undefined,
          limit: 10000,
        },
      })
      if (error) throw error

      const csv = typeof data === 'string' ? data : JSON.stringify(data)
      const blob = new Blob([csv], { type: 'text/csv' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${type}-export-${from || 'all'}.csv`
      a.click()
      URL.revokeObjectURL(url)
      toast.success(`${type} export downloaded`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Export failed')
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
        <p className="text-gray-500 text-sm">Export platform data as CSV</p>
      </div>

      <Card>
        <CardTitle className="mb-4 text-base">Date Range (optional)</CardTitle>
        <div className="grid sm:grid-cols-2 gap-4 max-w-lg">
          <Input label="From" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          <Input label="To" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        </div>
      </Card>

      <div className="grid sm:grid-cols-2 gap-3">
        {EXPORT_TYPES.map(({ type, label, desc }) => (
          <Card key={type}>
            <div className="flex flex-col h-full justify-between gap-4">
              <div>
                <CardTitle className="text-base">{label}</CardTitle>
                <p className="text-xs text-gray-400 mt-1">{desc}</p>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="w-full"
                loading={loading === type}
                onClick={() => handleExport(type)}
              >
                <Download className="h-4 w-4" />
                Export CSV
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
