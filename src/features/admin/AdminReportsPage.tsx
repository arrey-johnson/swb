import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Download } from 'lucide-react'

export default function AdminReportsPage() {
  const [loading, setLoading] = useState<string | null>(null)

  const handleExport = async (type: 'transactions' | 'withdrawals') => {
    setLoading(type)
    try {
      const { data, error } = await supabase.functions.invoke('export-report', {
        body: { type },
      })
      if (error) throw error

      const blob = new Blob([typeof data === 'string' ? data : JSON.stringify(data)], { type: 'text/csv' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${type}-export.csv`
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Export failed:', err)
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
        <p className="text-gray-500 text-sm">Export platform data</p>
      </div>

      <div className="space-y-3">
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">Transactions</CardTitle>
              <p className="text-xs text-gray-400">All deposit, withdrawal, and penalty records</p>
            </div>
            <Button
              size="sm"
              variant="outline"
              loading={loading === 'transactions'}
              onClick={() => handleExport('transactions')}
            >
              <Download className="h-4 w-4" />
              Export CSV
            </Button>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">Withdrawals</CardTitle>
              <p className="text-xs text-gray-400">All withdrawal records with penalty details</p>
            </div>
            <Button
              size="sm"
              variant="outline"
              loading={loading === 'withdrawals'}
              onClick={() => handleExport('withdrawals')}
            >
              <Download className="h-4 w-4" />
              Export CSV
            </Button>
          </div>
        </Card>
      </div>
    </div>
  )
}
