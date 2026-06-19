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

    const { request_id } = await req.json()
    if (!request_id) return errorResponse('Missing request_id')

    const { data: depositReq, error: fetchError } = await supabase
      .from('deposit_requests')
      .select('*')
      .eq('id', request_id)
      .eq('status', 'pending')
      .single()

    if (fetchError || !depositReq) {
      return errorResponse('Deposit request not found or already processed', 404)
    }

    const { data: txId, error } = await supabase.rpc('deposit_funds', {
      p_user_id: depositReq.user_id,
      p_goal_id: depositReq.goal_id,
      p_amount: depositReq.amount,
      p_deposit_request_id: depositReq.id,
    })

    if (error) return errorResponse(error.message, 400)

    await supabase
      .from('deposit_requests')
      .update({ reviewed_by: user.id })
      .eq('id', request_id)

    await logAudit(supabase, user.id, 'approve_deposit', {
      request_id,
      amount: depositReq.amount,
      user_id: depositReq.user_id,
    })

    return jsonResponse({ success: true, transaction_id: txId })
  } catch (err) {
    return errorResponse(err instanceof Error ? err.message : 'Internal error', 500)
  }
})
