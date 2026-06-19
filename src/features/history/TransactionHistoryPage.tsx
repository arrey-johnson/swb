import { Link } from 'react-router-dom'
import { useState, useMemo } from 'react'
import { Download } from 'lucide-react'
import { useTransactions, useGoals } from '@/lib/api/hooks'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { formatFCFA, formatDate, cn } from '@/lib/utils'
import { exportTransactionsCsv } from '@/lib/export'
import { useLanguage } from '@/lib/i18n/LanguageProvider'
import type { TransactionType } from '@/types/database'

const TYPE_FILTERS: TransactionType[] = ['deposit', 'withdrawal', 'penalty']

export default function TransactionHistoryPage() {
  const { data: transactions, isLoading } = useTransactions()
  const { data: goals } = useGoals()
  const { t } = useLanguage()
  const [filter, setFilter] = useState<TransactionType | 'all'>('all')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')

  const goalMap = new Map(goals?.map((g) => [g.id, g.title]) ?? [])

  const filtered = useMemo(() => {
    let list = transactions ?? []
    if (filter !== 'all') list = list.filter((tx) => tx.transaction_type === filter)
    if (fromDate) {
      const from = new Date(fromDate)
      list = list.filter((tx) => new Date(tx.created_at) >= from)
    }
    if (toDate) {
      const to = new Date(toDate)
      to.setHours(23, 59, 59, 999)
      list = list.filter((tx) => new Date(tx.created_at) <= to)
    }
    return list
  }, [transactions, filter, fromDate, toDate])

  const handleExport = () => {
    if (filtered.length) exportTransactionsCsv(filtered, goalMap)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex gap-2 overflow-x-auto pb-1 flex-1">
          <button
            type="button"
            onClick={() => setFilter('all')}
            className={cn(
              'shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors',
              filter === 'all' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600'
            )}
          >
            {t('history.all')}
          </button>
          {TYPE_FILTERS.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={cn(
                'shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors capitalize',
                filter === f ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600'
              )}
            >
              {f}
            </button>
          ))}
        </div>
        <Button size="sm" variant="outline" onClick={handleExport} disabled={!filtered.length}>
          <Download className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Input
          id="from"
          label={t('history.from')}
          type="date"
          value={fromDate}
          onChange={(e) => setFromDate(e.target.value)}
        />
        <Input
          id="to"
          label={t('history.to')}
          type="date"
          value={toDate}
          onChange={(e) => setToDate(e.target.value)}
        />
      </div>
      {(fromDate || toDate) && (
        <button
          type="button"
          className="text-xs text-primary font-medium"
          onClick={() => { setFromDate(''); setToDate('') }}
        >
          {t('history.clearDates')}
        </button>
      )}

      {isLoading ? (
        <div className="flex justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      ) : filtered.length > 0 ? (
        <div className="space-y-2">
          {filtered.map((tx) => (
            <Card key={tx.id} className="flex items-center justify-between py-3">
              <div>
                <p className="text-sm font-medium capitalize">{tx.transaction_type}</p>
                {tx.description && (
                  <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{tx.description}</p>
                )}
                {tx.goal_id && goalMap.has(tx.goal_id) && (
                  <Link to={`/goals/${tx.goal_id}`} className="text-xs text-primary hover:underline">
                    {goalMap.get(tx.goal_id)}
                  </Link>
                )}
                <p className="text-xs text-gray-400 mt-1">{formatDate(tx.created_at)}</p>
              </div>
              <span
                className={cn(
                  'text-sm font-semibold shrink-0',
                  tx.transaction_type === 'deposit' ? 'text-success' : 'text-gray-900'
                )}
              >
                {tx.transaction_type === 'deposit' ? '+' : '−'}
                {formatFCFA(tx.amount)}
              </span>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="text-center py-12 text-gray-400 text-sm">{t('history.noResults')}</Card>
      )}
    </div>
  )
}
