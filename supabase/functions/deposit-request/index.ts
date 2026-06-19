import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { handleCors, jsonResponse, errorResponse, getServiceClient, getAuthenticatedUser } from '../_shared/cors.ts'

serve(async (req) => {
  const cors = handleCors(req)
  if (cors) return cors

  try {
    const supabase = getServiceClient()
    const user = await getAuthenticatedUser(req, supabase)
    if (!user) return errorResponse('Unauthorized', 401)

    const { goal_id, amount, proof_url } = await req.json()

    if (!goal_id || !amount) {
      return errorResponse('Missing required fields: goal_id, amount')
    }

    const { data: account } = await supabase
      .from('savings_accounts')
      .select('status, balance, reserve_balance')
      .eq('user_id', user.id)
      .single()

    if (account?.status === 'pending') {
      const depositAmount = Number(amount)
      if (!Number.isFinite(depositAmount) || depositAmount < account.reserve_balance) {
        return errorResponse(
          `A minimum deposit of ${account.reserve_balance} FCFA is required to activate your account.`,
          400,
        )
      }
    }

    if (account?.status === 'suspended') {
      return errorResponse('Your account is suspended. Contact support for assistance.', 403)
    }
    if (account?.status === 'closed') {
      return errorResponse('Your account is closed.', 403)
    }

    const { data: existingPending } = await supabase
      .from('deposit_requests')
      .select('id')
      .eq('user_id', user.id)
      .eq('goal_id', goal_id)
      .eq('status', 'pending')
      .maybeSingle()

    if (existingPending) {
      return errorResponse(
        'You already have a pending deposit for this goal. Please wait for admin review.',
        409,
      )
    }

    const { data: settings } = await supabase
      .from('platform_settings')
      .select('value')
      .eq('key', 'deposit_instructions')
      .single()

    const { data: request, error } = await supabase
      .from('deposit_requests')
      .insert({
        user_id: user.id,
        goal_id,
        amount,
        proof_url: proof_url ?? null,
        status: 'pending',
      })
      .select('id')
      .single()

    if (error) return errorResponse(error.message, 400)

    await supabase.from('notifications').insert({
      user_id: user.id,
      title: 'Deposit Request Submitted',
      body: `Your deposit request of ${amount} FCFA is pending admin review.`,
      link_path: '/deposits',
    })

    return jsonResponse({
      request_id: request.id,
      instructions: settings?.value ?? { phone: '654112103', name: 'Melvis-Dalitine' },
      status: 'pending',
    })
  } catch (err) {
    return errorResponse(err instanceof Error ? err.message : 'Internal error', 500)
  }
})
