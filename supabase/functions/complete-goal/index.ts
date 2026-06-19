import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { handleCors, jsonResponse, errorResponse, getServiceClient, getAuthenticatedUser } from '../_shared/cors.ts'

serve(async (req) => {
  const cors = handleCors(req)
  if (cors) return cors

  try {
    const supabase = getServiceClient()
    const user = await getAuthenticatedUser(req, supabase)
    if (!user) return errorResponse('Unauthorized', 401)

    const { goal_id } = await req.json()
    if (!goal_id) return errorResponse('Missing goal_id')

    const { error } = await supabase.rpc('complete_goal', {
      p_goal_id: goal_id,
      p_user_id: user.id,
    })

    if (error) return errorResponse(error.message, 400)
    return jsonResponse({ success: true })
  } catch (err) {
    return errorResponse(err instanceof Error ? err.message : 'Internal error', 500)
  }
})
