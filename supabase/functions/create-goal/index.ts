import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { handleCors, jsonResponse, errorResponse, getServiceClient, getAuthenticatedUser } from '../_shared/cors.ts'

serve(async (req) => {
  const cors = handleCors(req)
  if (cors) return cors

  try {
    const supabase = getServiceClient()
    const user = await getAuthenticatedUser(req, supabase)
    if (!user) return errorResponse('Unauthorized', 401)

    const { title, description, target_amount, duration_months } = await req.json()

    if (!title || !target_amount || !duration_months) {
      return errorResponse('Missing required fields')
    }

    const { data, error } = await supabase.rpc('create_goal', {
      p_user_id: user.id,
      p_title: title,
      p_description: description ?? '',
      p_target_amount: target_amount,
      p_duration_months: duration_months,
    })

    if (error) return errorResponse(error.message, 400)
    return jsonResponse({ goal_id: data })
  } catch (err) {
    return errorResponse(err instanceof Error ? err.message : 'Internal error', 500)
  }
})
