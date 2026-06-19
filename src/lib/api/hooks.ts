import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase, invokeFunction } from '@/lib/supabase'
import { queryKeys } from '@/lib/query-keys'
import type {
  Profile,
  SavingsGoal,
  Transaction,
  Notification,
  DashboardMetrics,
  AdminMetrics,
  DepositRequest,
  Withdrawal,
  PenaltySetting,
  PenaltyPreview,
  FinancePost,
  FinancePostComment,
  FinancePostWithMeta,
  DepositInstructions,
} from '@/types/database'

export function useProfile() {
  return useQuery({
    queryKey: queryKeys.profile,
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return null
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()
      if (error) throw error
      return data as Profile
    },
  })
}

export function useDashboardMetrics() {
  return useQuery({
    queryKey: queryKeys.dashboard,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_dashboard_metrics')
      if (error) throw error
      return data as unknown as DashboardMetrics
    },
  })
}

export function useGoals() {
  return useQuery({
    queryKey: queryKeys.goals,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('savings_goals')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) throw error
      return data as SavingsGoal[]
    },
  })
}

export function useGoal(id: string) {
  return useQuery({
    queryKey: queryKeys.goal(id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('savings_goals')
        .select('*')
        .eq('id', id)
        .single()
      if (error) throw error
      return data as SavingsGoal
    },
    enabled: !!id,
  })
}

export function useTransactions(limit?: number, goalId?: string) {
  return useQuery({
    queryKey: goalId
      ? queryKeys.goalTransactions(goalId)
      : limit
        ? [...queryKeys.transactions, limit]
        : queryKeys.transactions,
    queryFn: async () => {
      let q = supabase.from('transactions').select('*').order('created_at', { ascending: false })
      if (goalId) q = q.eq('goal_id', goalId)
      if (limit) q = q.limit(limit)
      const { data, error } = await q
      if (error) throw error
      return data as Transaction[]
    },
  })
}

export function useWithdrawals() {
  return useQuery({
    queryKey: queryKeys.withdrawals,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('withdrawals')
        .select('*, savings_goals(title)')
        .order('created_at', { ascending: false })
      if (error) throw error
      return data as unknown as Withdrawal[]
    },
  })
}

export function useMyDepositRequests() {
  return useQuery({
    queryKey: queryKeys.myDepositRequests,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('deposit_requests')
        .select('*, savings_goals(title)')
        .order('created_at', { ascending: false })
      if (error) throw error
      return data as unknown as DepositRequest[]
    },
  })
}

export function useDepositInstructions() {
  return useQuery({
    queryKey: queryKeys.platformSettings,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('platform_settings')
        .select('value')
        .eq('key', 'deposit_instructions')
        .single()
      if (error) throw error
      return (data?.value ?? { phone: '654112103', name: 'Melvis-Dalitine' }) as unknown as DepositInstructions
    },
    staleTime: 60_000,
  })
}

export function useUpdateProfile() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: { full_name?: string; phone?: string; payout_phone?: string }) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')
      const { error } = await supabase.from('profiles').update(input).eq('id', user.id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.profile }),
  })
}

export function useUpdateGoal() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: {
      goal_id: string
      title: string
      description: string
      target_amount?: number
    }) => {
      const { error } = await supabase.rpc('update_goal', {
        p_goal_id: input.goal_id,
        p_title: input.title,
        p_description: input.description,
        p_target_amount: input.target_amount ?? undefined,
      })
      if (error) throw error
    },
    onSuccess: (_, { goal_id }) => {
      qc.invalidateQueries({ queryKey: queryKeys.goals })
      qc.invalidateQueries({ queryKey: queryKeys.goal(goal_id) })
    },
  })
}

export function useCancelGoal() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (goalId: string) => {
      const { error } = await supabase.rpc('cancel_goal', { p_goal_id: goalId })
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.goals }),
  })
}

export function useMarkAllNotificationsRead() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', user.id)
        .eq('is_read', false)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.notifications })
      qc.invalidateQueries({ queryKey: queryKeys.unreadCount })
    },
  })
}

export function useAdminWithdrawals(pendingOnly = false) {
  return useQuery({
    queryKey: [...queryKeys.adminWithdrawals, pendingOnly],
    queryFn: async () => {
      let q = supabase
        .from('withdrawals')
        .select('*, savings_goals(title), profiles(full_name, email, phone)')
        .order('created_at', { ascending: false })
      if (pendingOnly) q = q.eq('payout_status', 'pending_payout')
      const { data, error } = await q
      if (error) throw error
      return data as unknown as Withdrawal[]
    },
  })
}

export function useMarkWithdrawalPaid() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (withdrawalId: string) => {
      const { error } = await supabase.rpc('mark_withdrawal_paid', {
        p_withdrawal_id: withdrawalId,
      })
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.adminWithdrawals })
      qc.invalidateQueries({ queryKey: queryKeys.withdrawals })
    },
  })
}

export function useNotifications() {
  return useQuery({
    queryKey: queryKeys.notifications,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50)
      if (error) throw error
      return data as Notification[]
    },
  })
}

export function useUnreadCount() {
  return useQuery({
    queryKey: queryKeys.unreadCount,
    queryFn: async () => {
      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('is_read', false)
      if (error) throw error
      return count ?? 0
    },
  })
}

export function useMarkNotificationRead() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.notifications })
      qc.invalidateQueries({ queryKey: queryKeys.unreadCount })
    },
  })
}

export function useCreateGoal() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: {
      title: string
      description?: string
      target_amount: number
      duration_months: 3 | 6 | 12
    }) => invokeFunction<{ goal_id: string }>('create-goal', input),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.goals }),
  })
}

export function useDepositRequest() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: { goal_id: string; amount: number; proof_url?: string }) =>
      invokeFunction<{ request_id: string; instructions: { phone: string; name: string } }>(
        'deposit-request',
        input
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.depositRequests })
      qc.invalidateQueries({ queryKey: queryKeys.notifications })
    },
  })
}

export function useWithdrawFunds() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: { goal_id: string; amount: number }) =>
      invokeFunction<{ withdrawal_id: string }>('withdraw-funds', input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.goals })
      qc.invalidateQueries({ queryKey: queryKeys.dashboard })
      qc.invalidateQueries({ queryKey: queryKeys.transactions })
      qc.invalidateQueries({ queryKey: queryKeys.withdrawals })
    },
  })
}

export function usePenaltyPreview(goalId: string, amount: number) {
  return useQuery({
    queryKey: ['penalty', goalId, amount],
    queryFn: () =>
      invokeFunction<PenaltyPreview>('calculate-penalty', {
        goal_id: goalId,
        amount,
      }),
    enabled: !!goalId && amount > 0,
  })
}

export function useCompleteGoal() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (goalId: string) =>
      invokeFunction('complete-goal', { goal_id: goalId }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.goals })
      qc.invalidateQueries({ queryKey: queryKeys.dashboard })
    },
  })
}

export function useDepositRequests(status?: string) {
  return useQuery({
    queryKey: [...queryKeys.depositRequests, status],
    queryFn: async () => {
      let q = supabase
        .from('deposit_requests')
        .select('*, savings_goals(title), profiles(full_name, email)')
        .order('created_at', { ascending: false })
      if (status) q = q.eq('status', status as 'pending' | 'approved' | 'rejected')
      const { data, error } = await q
      if (error) throw error
      return data as unknown as DepositRequest[]
    },
  })
}

export function useApproveDeposit() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (requestId: string) =>
      invokeFunction('approve-deposit', { request_id: requestId }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.depositRequests })
      qc.invalidateQueries({ queryKey: queryKeys.adminMetrics })
    },
  })
}

export function useRejectDeposit() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ requestId, reason }: { requestId: string; reason: string }) =>
      invokeFunction('reject-deposit', { request_id: requestId, reason }),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.depositRequests }),
  })
}

export function useAdminMetrics() {
  return useQuery({
    queryKey: queryKeys.adminMetrics,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_admin_metrics')
      if (error) throw error
      return data as unknown as AdminMetrics
    },
  })
}

export function useAdminUsers(search?: string) {
  return useQuery({
    queryKey: [...queryKeys.adminUsers, search],
    queryFn: async () => {
      let q = supabase.from('profiles').select('*').eq('role', 'saver')
      if (search) q = q.or(`full_name.ilike.%${search}%,email.ilike.%${search}%`)
      const { data, error } = await q.order('created_at', { ascending: false })
      if (error) throw error
      return data as Profile[]
    },
  })
}

export function usePenaltySettings() {
  return useQuery({
    queryKey: queryKeys.penaltySettings,
    queryFn: async () => {
      const { data, error } = await supabase.from('penalty_settings').select('*').order('duration_months')
      if (error) throw error
      return data as PenaltySetting[]
    },
  })
}

export function useUpdatePenalty() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, percentage }: { id: string; percentage: number }) => {
      const { error } = await supabase
        .from('penalty_settings')
        .update({ percentage })
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.penaltySettings }),
  })
}

export function useAcceptTerms() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')
      const { error } = await supabase
        .from('profiles')
        .update({ terms_accepted_at: new Date().toISOString() })
        .eq('id', user.id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.profile }),
  })
}

export function useCompleteOnboarding() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')
      const { error } = await supabase
        .from('profiles')
        .update({ onboarding_completed: true })
        .eq('id', user.id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.profile }),
  })
}

async function getCurrentUserId() {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')
  return user.id
}

export function useFinancePosts(savedOnly = false) {
  return useQuery({
    queryKey: queryKeys.financePosts(savedOnly),
    queryFn: async () => {
      const userId = await getCurrentUserId()

      let postIds: string[] | null = null
      if (savedOnly) {
        const { data: saves, error: savesError } = await supabase
          .from('finance_post_saves')
          .select('post_id')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
        if (savesError) throw savesError
        postIds = saves?.map((s) => s.post_id) ?? []
        if (postIds.length === 0) return [] as FinancePostWithMeta[]
      }

      let query = supabase
        .from('finance_posts')
        .select('*')
        .eq('is_published', true)
        .order('created_at', { ascending: false })

      if (postIds) {
        query = query.in('id', postIds)
      }

      const { data: posts, error } = await query
      if (error) throw error
      if (!posts?.length) return [] as FinancePostWithMeta[]

      const ids = posts.map((p) => p.id)

      const [{ data: likes }, { data: comments }, { data: myLikes }, { data: mySaves }] = await Promise.all([
        supabase.from('finance_post_likes').select('post_id').in('post_id', ids),
        supabase.from('finance_post_comments').select('post_id').in('post_id', ids),
        supabase.from('finance_post_likes').select('post_id').eq('user_id', userId).in('post_id', ids),
        supabase.from('finance_post_saves').select('post_id').eq('user_id', userId).in('post_id', ids),
      ])

      const likeCounts = new Map<string, number>()
      likes?.forEach((l) => likeCounts.set(l.post_id, (likeCounts.get(l.post_id) ?? 0) + 1))
      const commentCounts = new Map<string, number>()
      comments?.forEach((c) => commentCounts.set(c.post_id, (commentCounts.get(c.post_id) ?? 0) + 1))
      const myLikeSet = new Set(myLikes?.map((l) => l.post_id))
      const mySaveSet = new Set(mySaves?.map((s) => s.post_id))

      const enriched = posts.map((post) => ({
        ...post,
        like_count: likeCounts.get(post.id) ?? 0,
        comment_count: commentCounts.get(post.id) ?? 0,
        liked_by_me: myLikeSet.has(post.id),
        saved_by_me: mySaveSet.has(post.id),
      })) as FinancePostWithMeta[]

      if (savedOnly && postIds) {
        const order = new Map(postIds.map((id, i) => [id, i]))
        enriched.sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0))
      }

      return enriched
    },
  })
}

export function useFinanceComments(postId: string) {
  return useQuery({
    queryKey: queryKeys.financeComments(postId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('finance_post_comments')
        .select('*')
        .eq('post_id', postId)
        .order('created_at', { ascending: true })
      if (error) throw error
      return data as FinancePostComment[]
    },
    enabled: !!postId,
  })
}

export function useToggleFinanceLike() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ postId, liked }: { postId: string; liked: boolean }) => {
      const userId = await getCurrentUserId()
      if (liked) {
        const { error } = await supabase
          .from('finance_post_likes')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', userId)
        if (error) throw error
      } else {
        const { error } = await supabase
          .from('finance_post_likes')
          .insert({ post_id: postId, user_id: userId })
        if (error) throw error
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['finance-posts'] })
    },
  })
}

export function useToggleFinanceSave() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ postId, saved }: { postId: string; saved: boolean }) => {
      const userId = await getCurrentUserId()
      if (saved) {
        const { error } = await supabase
          .from('finance_post_saves')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', userId)
        if (error) throw error
      } else {
        const { error } = await supabase
          .from('finance_post_saves')
          .insert({ post_id: postId, user_id: userId })
        if (error) throw error
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['finance-posts'] })
    },
  })
}

export function useAddFinanceComment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ postId, body }: { postId: string; body: string }) => {
      const userId = await getCurrentUserId()
      const { error } = await supabase
        .from('finance_post_comments')
        .insert({ post_id: postId, user_id: userId, body })
      if (error) throw error
    },
    onSuccess: (_, { postId }) => {
      qc.invalidateQueries({ queryKey: queryKeys.financeComments(postId) })
      qc.invalidateQueries({ queryKey: ['finance-posts'] })
    },
  })
}

export function useAdminFinancePosts() {
  return useQuery({
    queryKey: queryKeys.adminFinancePosts,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('finance_posts')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) throw error
      return data as FinancePost[]
    },
  })
}

export function useCreateFinancePost() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: { title: string; content: string; is_published?: boolean }) => {
      const userId = await getCurrentUserId()
      const { data, error } = await supabase
        .from('finance_posts')
        .insert({
          author_id: userId,
          title: input.title,
          content: input.content,
          is_published: input.is_published ?? true,
        })
        .select('id')
        .single()
      if (error) throw error
      return data.id as string
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.adminFinancePosts }),
  })
}

export function useUpdateFinancePost() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: {
      id: string
      title?: string
      content?: string
      is_published?: boolean
    }) => {
      const { id, ...updates } = input
      const { error } = await supabase.from('finance_posts').update(updates).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.adminFinancePosts })
      qc.invalidateQueries({ queryKey: ['finance-posts'] })
    },
  })
}

export function useDeleteFinancePost() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('finance_posts').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.adminFinancePosts })
      qc.invalidateQueries({ queryKey: ['finance-posts'] })
    },
  })
}
