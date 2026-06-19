import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { handleCors, errorResponse, getServiceClient, getAuthenticatedUser, requireAdmin } from '../_shared/cors.ts'

serve(async (req) => {
  const cors = handleCors(req)
  if (cors) return cors

  try {
    const supabase = getServiceClient()
    const user = await getAuthenticatedUser(req, supabase)
    if (!user) return errorResponse('Unauthorized', 401)

    if (!(await requireAdmin(supabase, user.id))) {
      return errorResponse('Forbidden', 403)
    }

    const { type, from, to, limit = 5000, offset = 0 } = await req.json()

    const maxLimit = Math.min(Number(limit) || 5000, 10000)
    const rangeEnd = (Number(offset) || 0) + maxLimit - 1

    let data: unknown[] = []

    if (type === 'transactions') {
      let q = supabase
        .from('transactions')
        .select('*, profiles(full_name, email), savings_goals(title)')
        .order('created_at', { ascending: false })
        .range(Number(offset) || 0, rangeEnd)
      if (from) q = q.gte('created_at', from)
      if (to) q = q.lte('created_at', to)
      const res = await q
      data = res.data ?? []
    } else if (type === 'withdrawals') {
      let q = supabase
        .from('withdrawals')
        .select('*, profiles(full_name, email), savings_goals(title)')
        .order('created_at', { ascending: false })
        .range(Number(offset) || 0, rangeEnd)
      if (from) q = q.gte('created_at', from)
      if (to) q = q.lte('created_at', to)
      const res = await q
      data = res.data ?? []
    } else if (type === 'deposits') {
      let q = supabase
        .from('deposit_requests')
        .select('*, profiles(full_name, email), savings_goals(title)')
        .order('created_at', { ascending: false })
        .range(Number(offset) || 0, rangeEnd)
      if (from) q = q.gte('created_at', from)
      if (to) q = q.lte('created_at', to)
      const res = await q
      data = res.data ?? []
    } else if (type === 'users') {
      let q = supabase
        .from('profiles')
        .select('*, savings_accounts(balance, status)')
        .eq('role', 'saver')
        .order('created_at', { ascending: false })
        .range(Number(offset) || 0, rangeEnd)
      if (from) q = q.gte('created_at', from)
      if (to) q = q.lte('created_at', to)
      const res = await q
      data = res.data ?? []
    } else {
      return errorResponse('Invalid export type')
    }

    const csv = convertToCSV(data as Record<string, unknown>[])
    return new Response(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${type}-export.csv"`,
        'Access-Control-Allow-Origin': '*',
      },
    })
  } catch (err) {
    return errorResponse(err instanceof Error ? err.message : 'Internal error', 500)
  }
})

function convertToCSV(rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return ''
  const flat = rows.map((row) => flattenObject(row))
  const headers = [...new Set(flat.flatMap((r) => Object.keys(r)))]
  const lines = [
    headers.join(','),
    ...flat.map((row) =>
      headers.map((h) => JSON.stringify(row[h] ?? '')).join(',')
    ),
  ]
  return lines.join('\n')
}

function flattenObject(obj: Record<string, unknown>, prefix = ''): Record<string, unknown> {
  const result: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(obj)) {
    const newKey = prefix ? `${prefix}_${key}` : key
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      Object.assign(result, flattenObject(value as Record<string, unknown>, newKey))
    } else {
      result[newKey] = value
    }
  }
  return result
}
