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
  AuditLog,
  AdminUserDetail,
  AccountStatus,
  UserRole,
  TransactionType,
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
        .select('*, savings_goals(title), profiles!withdrawals_user_id_fkey(full_name, email, phone)')
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
    mutationFn: async ({ withdrawalId, payoutReference }: { withdrawalId: string; payoutReference?: string }) => {
      const { error } = await supabase.rpc('mark_withdrawal_paid', {
        p_withdrawal_id: withdrawalId,
        p_payout_reference: payoutReference ?? undefined,
      })
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.adminWithdrawals })
      qc.invalidateQueries({ queryKey: queryKeys.withdrawals })
      qc.invalidateQueries({ queryKey: queryKeys.adminMetrics })
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
        .select('*, savings_goals(title), profiles!deposit_requests_user_id_fkey(full_name, email)')
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
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.depositRequests })
      qc.invalidateQueries({ queryKey: queryKeys.adminMetrics })
    },
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

export function useAdminUsers(search?: string, page = 1, pageSize = 20, includeAdmins = false) {
  return useQuery({
    queryKey: [...queryKeys.adminUsers, search, page, pageSize, includeAdmins],
    queryFn: async () => {
      const from = (page - 1) * pageSize
      const to = from + pageSize - 1
      let q = supabase.from('profiles').select('*', { count: 'exact' })
      if (!includeAdmins) q = q.eq('role', 'saver')
      if (search) q = q.or(`full_name.ilike.%${search}%,email.ilike.%${search}%`)
      const { data, error, count } = await q.order('created_at', { ascending: false }).range(from, to)
      if (error) throw error
      return { users: data as Profile[], total: count ?? 0 }
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

// ─── Admin extended hooks ───────────────────────────────────────────────────

export function useAdminUserDetail(userId: string) {
  return useQuery({
    queryKey: queryKeys.adminUserDetail(userId),
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_admin_user_detail', { p_user_id: userId })
      if (error) throw error
      return data as unknown as AdminUserDetail
    },
    enabled: !!userId,
  })
}

export function useAdminUserGoals(userId: string) {
  return useQuery({
    queryKey: queryKeys.adminUserGoals(userId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('savings_goals')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data as SavingsGoal[]
    },
    enabled: !!userId,
  })
}

export function useAdminUserTransactions(userId: string, limit = 20) {
  return useQuery({
    queryKey: queryKeys.adminUserTransactions(userId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('transactions')
        .select('*, savings_goals(title)')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit)
      if (error) throw error
      return data as Transaction[]
    },
    enabled: !!userId,
  })
}

export function useAdminUpdateAccountStatus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: { userId: string; status: AccountStatus; reason?: string }) => {
      const { error } = await supabase.rpc('admin_update_account_status', {
        p_user_id: input.userId,
        p_status: input.status,
        p_reason: input.reason ?? undefined,
      })
      if (error) throw error
    },
    onSuccess: (_, { userId }) => {
      qc.invalidateQueries({ queryKey: queryKeys.adminUserDetail(userId) })
      qc.invalidateQueries({ queryKey: queryKeys.adminUsers })
      qc.invalidateQueries({ queryKey: queryKeys.adminMetrics })
      qc.invalidateQueries({ queryKey: queryKeys.auditLogs })
    },
  })
}

export function useAdminCreditBalance() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: {
      userId: string
      amount: number
      type: Extract<TransactionType, 'adjustment' | 'refund'>
      reason: string
      goalId?: string
    }) => {
      const { error } = await supabase.rpc('admin_credit_balance', {
        p_user_id: input.userId,
        p_amount: input.amount,
        p_type: input.type,
        p_reason: input.reason,
        p_goal_id: input.goalId ?? undefined,
      })
      if (error) throw error
    },
    onSuccess: (_, { userId }) => {
      qc.invalidateQueries({ queryKey: queryKeys.adminUserDetail(userId) })
      qc.invalidateQueries({ queryKey: queryKeys.adminUserGoals(userId) })
      qc.invalidateQueries({ queryKey: queryKeys.adminUserTransactions(userId) })
      qc.invalidateQueries({ queryKey: queryKeys.adminMetrics })
    },
  })
}

export function useAdminDebitBalance() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: { userId: string; amount: number; reason: string; goalId?: string }) => {
      const { error } = await supabase.rpc('admin_debit_balance', {
        p_user_id: input.userId,
        p_amount: input.amount,
        p_reason: input.reason,
        p_goal_id: input.goalId ?? undefined,
      })
      if (error) throw error
    },
    onSuccess: (_, { userId }) => {
      qc.invalidateQueries({ queryKey: queryKeys.adminUserDetail(userId) })
      qc.invalidateQueries({ queryKey: queryKeys.adminUserGoals(userId) })
      qc.invalidateQueries({ queryKey: queryKeys.adminUserTransactions(userId) })
      qc.invalidateQueries({ queryKey: queryKeys.adminMetrics })
    },
  })
}

export function useAdminUpdateUserRole() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: { userId: string; role: UserRole }) => {
      const { error } = await supabase.rpc('admin_update_user_role', {
        p_user_id: input.userId,
        p_role: input.role,
      })
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.adminUsers })
      qc.invalidateQueries({ queryKey: queryKeys.adminTeam })
    },
  })
}

export function useAdminVerifyPhone() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: { userId: string; verified: boolean }) => {
      const { error } = await supabase.rpc('admin_verify_phone', {
        p_user_id: input.userId,
        p_verified: input.verified,
      })
      if (error) throw error
    },
    onSuccess: (_, { userId }) => {
      qc.invalidateQueries({ queryKey: queryKeys.adminUserDetail(userId) })
    },
  })
}

export function useUpdatePlatformSettings() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (value: DepositInstructions) => {
      const { error } = await supabase
        .from('platform_settings')
        .upsert({ key: 'deposit_instructions', value: { phone: value.phone, name: value.name } })
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.platformSettings })
    },
  })
}

export function useAuditLogs(action?: string, page = 1, pageSize = 30) {
  return useQuery({
    queryKey: [...queryKeys.auditLogs, action, page, pageSize],
    queryFn: async () => {
      const from = (page - 1) * pageSize
      const to = from + pageSize - 1
      let q = supabase
        .from('audit_logs')
        .select('*, profiles!audit_logs_actor_id_fkey(full_name, email)', { count: 'exact' })
        .order('created_at', { ascending: false })
      if (action) q = q.eq('action', action)
      const { data, error, count } = await q.range(from, to)
      if (error) throw error
      return { logs: data as AuditLog[], total: count ?? 0 }
    },
  })
}

export function useAdminTeam() {
  return useQuery({
    queryKey: queryKeys.adminTeam,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'admin')
        .order('created_at', { ascending: false })
      if (error) throw error
      return data as Profile[]
    },
  })
}

export function useSendAdminNotification() {
  return useMutation({
    mutationFn: (input: { user_id: string; title: string; body: string; link_path?: string }) =>
      invokeFunction<{ notification_id: string }>('send-notification', input),
  })
}

export function useAdminFinanceComments(postId: string) {
  return useQuery({
    queryKey: queryKeys.adminFinanceComments(postId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('finance_post_comments')
        .select('*, profiles!finance_post_comments_user_id_fkey(full_name, email)')
        .eq('post_id', postId)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data as FinancePostComment[]
    },
    enabled: !!postId,
  })
}

export function useDeleteFinanceComment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, postId }: { id: string; postId: string }) => {
      const { error } = await supabase.from('finance_post_comments').delete().eq('id', id)
      if (error) throw error
      return postId
    },
    onSuccess: (postId) => {
      qc.invalidateQueries({ queryKey: queryKeys.adminFinanceComments(postId) })
      qc.invalidateQueries({ queryKey: ['finance-posts'] })
    },
  })
}

export function useDepositRequestsPaginated(status?: string, page = 1, pageSize = 20) {
  return useQuery({
    queryKey: [...queryKeys.depositRequests, status, page, pageSize],
    queryFn: async () => {
      const from = (page - 1) * pageSize
      const to = from + pageSize - 1
      let q = supabase
        .from('deposit_requests')
        .select('*, savings_goals(title), profiles!deposit_requests_user_id_fkey(full_name, email)', { count: 'exact' })
        .order('created_at', { ascending: false })
      if (status) q = q.eq('status', status as 'pending' | 'approved' | 'rejected')
      const { data, error, count } = await q.range(from, to)
      if (error) throw error
      return { requests: data as DepositRequest[], total: count ?? 0 }
    },
  })
}

export function useAdminWithdrawalsPaginated(pendingOnly = false, page = 1, pageSize = 20) {
  return useQuery({
    queryKey: [...queryKeys.adminWithdrawals, pendingOnly, page, pageSize],
    queryFn: async () => {
      const from = (page - 1) * pageSize
      const to = from + pageSize - 1
      let q = supabase
        .from('withdrawals')
        .select('*, savings_goals(title), profiles(full_name, email, phone)', { count: 'exact' })
        .order('created_at', { ascending: false })
      if (pendingOnly) q = q.eq('payout_status', 'pending_payout')
      const { data, error, count } = await q.range(from, to)
      if (error) throw error
      return { withdrawals: data as Withdrawal[], total: count ?? 0 }
    },
  })
}
