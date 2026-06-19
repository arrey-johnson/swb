import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { handleCors, jsonResponse, errorResponse, getServiceClient, getAuthenticatedUser } from '../_shared/cors.ts'

serve(async (req) => {
  const cors = handleCors(req)
  if (cors) return cors

  try {
    const supabase = getServiceClient()
    const user = await getAuthenticatedUser(req, supabase)
    if (!user) return errorResponse('Unauthorized', 401)

    const { user_id, title, body } = await req.json()
    const targetUserId = user_id ?? user.id

    if (targetUserId !== user.id) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()
      if (profile?.role !== 'admin') return errorResponse('Forbidden', 403)
    }

    const { data, error } = await supabase
      .from('notifications')
      .insert({ user_id: targetUserId, title, body })
      .select('id')
      .single()

    if (error) return errorResponse(error.message, 400)
    return jsonResponse({ notification_id: data.id })
  } catch (err) {
    return errorResponse(err instanceof Error ? err.message : 'Internal error', 500)
  }
})
