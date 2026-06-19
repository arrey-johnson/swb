import { formatDate } from '@/lib/utils'
import type { Transaction } from '@/types/database'

export function downloadCsv(filename: string, rows: string[][]) {
  const csv = rows.map((row) =>
    row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')
  ).join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export function exportTransactionsCsv(
  transactions: Transaction[],
  goalTitles: Map<string, string>
) {
  const rows: string[][] = [
    ['Date', 'Type', 'Amount (FCFA)', 'Goal', 'Description'],
    ...transactions.map((tx) => [
      formatDate(tx.created_at),
      tx.transaction_type,
      String(tx.amount),
      tx.goal_id ? goalTitles.get(tx.goal_id) ?? '' : '',
      tx.description ?? '',
    ]),
  ]
  downloadCsv(`transactions-${new Date().toISOString().slice(0, 10)}.csv`, rows)
}
