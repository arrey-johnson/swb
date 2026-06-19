import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { handleCors, jsonResponse, errorResponse, getServiceClient, getAuthenticatedUser, requireAdmin, logAudit } from '../_shared/cors.ts'

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

    const { request_id, reason } = await req.json()
    if (!request_id) return errorResponse('Missing request_id')

    const { error } = await supabase.rpc('reject_deposit', {
      p_request_id: request_id,
      p_reason: reason ?? 'Rejected by admin',
    })

    if (error) return errorResponse(error.message, 400)

    const { data: depositReq } = await supabase
      .from('deposit_requests')
      .select('user_id, amount')
      .eq('id', request_id)
      .single()

    if (depositReq) {
      await supabase.from('notifications').insert({
        user_id: depositReq.user_id,
        title: 'Deposit Request Rejected',
        body: `Your deposit request of ${depositReq.amount} FCFA was rejected. Reason: ${reason ?? 'Not specified'}`,
        link_path: '/deposits',
      })
    }

    await logAudit(supabase, user.id, 'reject_deposit', { request_id, reason })

    return jsonResponse({ success: true })
  } catch (err) {
    return errorResponse(err instanceof Error ? err.message : 'Internal error', 500)
  }
})
