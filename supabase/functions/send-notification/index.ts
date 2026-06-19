import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { handleCors, jsonResponse, errorResponse, getServiceClient, getAuthenticatedUser, requireAdmin, logAudit } from '../_shared/cors.ts'

serve(async (req) => {
  const cors = handleCors(req)
  if (cors) return cors

  try {
    const supabase = getServiceClient()
    const user = await getAuthenticatedUser(req, supabase)
    if (!user) return errorResponse('Unauthorized', 401)

    const { user_id, title, body, link_path } = await req.json()
    const targetUserId = user_id ?? user.id

    if (targetUserId !== user.id) {
      if (!(await requireAdmin(supabase, user.id))) {
        return errorResponse('Forbidden', 403)
      }
    }

    if (!title?.trim() || !body?.trim()) {
      return errorResponse('Title and body are required')
    }

    const { data, error } = await supabase
      .from('notifications')
      .insert({
        user_id: targetUserId,
        title: title.trim(),
        body: body.trim(),
        link_path: link_path?.trim() || null,
      })
      .select('id')
      .single()

    if (error) return errorResponse(error.message, 400)

    if (targetUserId !== user.id) {
      await logAudit(supabase, user.id, 'send_notification', {
        target_user_id: targetUserId,
        title: title.trim(),
      })
    }

    return jsonResponse({ notification_id: data.id })
  } catch (err) {
    return errorResponse(err instanceof Error ? err.message : 'Internal error', 500)
  }
})
