export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type UserRole = 'saver' | 'admin'
export type AccountStatus = 'pending' | 'active' | 'suspended' | 'closed'
export type GoalStatus = 'active' | 'matured' | 'completed' | 'withdrawn_early' | 'cancelled'
export type PayoutStatus = 'pending_payout' | 'paid'
export type TransactionType = 'deposit' | 'withdrawal' | 'penalty' | 'adjustment' | 'refund'
export type DepositRequestStatus = 'pending' | 'approved' | 'rejected'
export type DisciplineLevel = 'bronze' | 'silver' | 'gold' | 'platinum'

export interface Profile {
  id: string
  full_name: string
  phone: string
  email: string
  role: UserRole
  phone_verified: boolean
  payout_phone: string | null
  terms_accepted_at: string | null
  onboarding_completed: boolean
  created_at: string
  updated_at: string
}

export interface SavingsAccount {
  id: string
  user_id: string
  balance: number
  reserve_balance: number
  status: AccountStatus
  created_at: string
}

export interface SavingsGoal {
  id: string
  user_id: string
  title: string
  description: string | null
  target_amount: number
  current_amount: number
  duration_months: 3 | 6 | 12
  start_date: string
  maturity_date: string
  status: GoalStatus
  created_at: string
}

export interface Transaction {
  id: string
  user_id: string
  goal_id: string | null
  amount: number
  transaction_type: TransactionType
  description: string | null
  created_at: string
}

export interface DepositRequest {
  id: string
  user_id: string
  goal_id: string
  amount: number
  proof_url: string | null
  status: DepositRequestStatus
  rejection_reason: string | null
  reviewed_by: string | null
  reviewed_at: string | null
  created_at: string
  savings_goals?: Pick<SavingsGoal, 'title'> | SavingsGoal
  profiles?: Profile
}

export interface Withdrawal {
  id: string
  user_id: string
  goal_id: string
  amount: number
  penalty_amount: number
  net_amount: number
  is_early: boolean
  payout_phone: string | null
  payout_status: PayoutStatus
  payout_reference: string | null
  paid_at: string | null
  created_at: string
  savings_goals?: Pick<SavingsGoal, 'title'>
  profiles?: Pick<Profile, 'full_name' | 'email' | 'phone'>
}

export interface AuditLog {
  id: string
  actor_id: string | null
  action: string
  metadata: Record<string, unknown>
  created_at: string
  profiles?: Pick<Profile, 'full_name' | 'email'>
}

export interface AdminUserDetail {
  profile: Profile
  account: SavingsAccount
  discipline: DisciplineScore | null
  goals_count: number
  active_goals: number
  total_deposited: number
  pending_deposits: number
  pending_payouts: number
}

export interface Notification {
  id: string
  user_id: string
  title: string
  body: string
  is_read: boolean
  link_path: string | null
  created_at: string
}

export interface DepositInstructions {
  phone: string
  name: string
}

export interface PlatformSetting {
  key: string
  value: DepositInstructions
}

export interface PenaltySetting {
  id: string
  duration_months: 3 | 6 | 12
  percentage: number
}

export interface DisciplineScore {
  id: string
  user_id: string
  points: number
  level: DisciplineLevel
}

export interface DashboardMetrics {
  account_balance: number
  reserve_balance: number
  account_status: AccountStatus
  is_active: boolean
  activation_required: boolean
  activation_remaining: number
  max_withdrawable: number
  total_locked: number
  active_goals: number
  completed_goals: number
  next_maturity: string | null
  discipline_points: number
  discipline_level: string
}

export interface AdminMetrics {
  total_users: number
  total_savings: number
  total_deposits: number
  total_withdrawals: number
  total_penalties: number
  active_goals: number
  matured_goals: number
  pending_deposits: number
  pending_payouts: number
  new_users_week: number
  new_users_month: number
  deposits_this_week: number
  withdrawals_this_week: number
  oldest_pending_deposit_hours: number
  suspended_accounts: number
}

export interface PenaltyPreview {
  penalty_amount: number
  penalty_percentage: number
  is_early: boolean
  net_amount: number
}

export interface FinancePost {
  id: string
  author_id: string
  title: string
  content: string
  is_published: boolean
  created_at: string
  updated_at: string
  profiles?: Pick<Profile, 'full_name'>
}

export interface FinancePostComment {
  id: string
  post_id: string
  user_id: string
  body: string
  created_at: string
  profiles?: Pick<Profile, 'full_name'>
}

export interface FinancePostLike {
  post_id: string
  user_id: string
  created_at: string
}

export interface FinancePostSave {
  post_id: string
  user_id: string
  created_at: string
}

export interface FinancePostWithMeta extends FinancePost {
  like_count: number
  comment_count: number
  liked_by_me: boolean
  saved_by_me: boolean
}
