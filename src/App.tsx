import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from '@/app/AuthProvider'
import { ProtectedRoute, PublicRoute } from '@/app/ProtectedRoute'
import { OnboardingGuard } from '@/app/OnboardingGuard'
import { AdminRoute } from '@/app/AdminRoute'
import { SaverRoute } from '@/app/SaverRoute'
import { RoleRedirect } from '@/app/RoleRedirect'
import { AppLayout } from '@/components/layout/AppLayout'
import { AdminLayout } from '@/components/layout/AdminLayout'
import { OfflineBanner } from '@/components/layout/OfflineBanner'
import { LanguageProvider } from '@/lib/i18n/LanguageProvider'

import LoginPage from '@/features/auth/LoginPage'
import RegisterPage from '@/features/auth/RegisterPage'
import ForgotPasswordPage from '@/features/auth/ForgotPasswordPage'
import ResetPasswordPage from '@/features/auth/ResetPasswordPage'
import VerifyEmailPage from '@/features/onboarding/VerifyEmailPage'
import TermsPage from '@/features/onboarding/TermsPage'
import FirstGoalPage from '@/features/onboarding/FirstGoalPage'
import FundGoalPage from '@/features/onboarding/FundGoalPage'
import DashboardPage from '@/features/dashboard/DashboardPage'
import GoalsPage from '@/features/goals/GoalsPage'
import NewGoalPage from '@/features/goals/NewGoalPage'
import GoalDetailPage from '@/features/goals/GoalDetailPage'
import EditGoalPage from '@/features/goals/EditGoalPage'
import DepositPage from '@/features/deposits/DepositPage'
import MyDepositsPage from '@/features/deposits/MyDepositsPage'
import WithdrawPage from '@/features/withdrawals/WithdrawPage'
import TransactionHistoryPage from '@/features/history/TransactionHistoryPage'
import WithdrawalHistoryPage from '@/features/history/WithdrawalHistoryPage'
import HistoryLayoutPage from '@/features/history/HistoryLayoutPage'
import HelpPage from '@/features/help/HelpPage'
import NotificationsPage from '@/features/notifications/NotificationsPage'
import FinanceFeedPage from '@/features/feed/FinanceFeedPage'
import ProfilePage from '@/features/profile/ProfilePage'
import AdminDashboardPage from '@/features/admin/AdminDashboardPage'
import AdminUsersPage from '@/features/admin/AdminUsersPage'
import AdminDepositsPage from '@/features/admin/AdminDepositsPage'
import AdminPenaltiesPage from '@/features/admin/AdminPenaltiesPage'
import AdminReportsPage from '@/features/admin/AdminReportsPage'
import AdminFinanceFeedPage from '@/features/admin/AdminFinanceFeedPage'
import AdminWithdrawalsPage from '@/features/admin/AdminWithdrawalsPage'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 10_000, retry: 1 },
  },
})

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
      <AuthProvider>
        <OfflineBanner />
        <BrowserRouter>
          <Routes>
            <Route path="/reset-password" element={<ResetPasswordPage />} />

            <Route element={<PublicRoute />}>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            </Route>

            <Route element={<ProtectedRoute />}>
              <Route path="/" element={<RoleRedirect />} />

              <Route element={<AdminRoute />}>
                <Route element={<AdminLayout />}>
                  <Route path="/admin" element={<AdminDashboardPage />} />
                  <Route path="/admin/users" element={<AdminUsersPage />} />
                  <Route path="/admin/deposits" element={<AdminDepositsPage />} />
                  <Route path="/admin/withdrawals" element={<AdminWithdrawalsPage />} />
                  <Route path="/admin/penalties" element={<AdminPenaltiesPage />} />
                  <Route path="/admin/feed" element={<AdminFinanceFeedPage />} />
                  <Route path="/admin/reports" element={<AdminReportsPage />} />
                </Route>
              </Route>

              <Route element={<SaverRoute />}>
                <Route path="/onboarding/verify" element={<VerifyEmailPage />} />
                <Route path="/onboarding/terms" element={<TermsPage />} />
                <Route path="/onboarding/first-goal" element={<FirstGoalPage />} />
                <Route path="/onboarding/fund" element={<FundGoalPage />} />

                <Route element={<OnboardingGuard />}>
                  <Route element={<AppLayout />}>
                    <Route path="/dashboard" element={<DashboardPage />} />
                    <Route path="/goals" element={<GoalsPage />} />
                    <Route path="/goals/new" element={<NewGoalPage />} />
                    <Route path="/goals/:id" element={<GoalDetailPage />} />
                    <Route path="/goals/:id/edit" element={<EditGoalPage />} />
                    <Route path="/goals/:id/deposit" element={<DepositPage />} />
                    <Route path="/goals/:id/withdraw" element={<WithdrawPage />} />
                    <Route path="/deposits" element={<MyDepositsPage />} />
                    <Route path="/history" element={<HistoryLayoutPage />}>
                      <Route path="transactions" element={<TransactionHistoryPage />} />
                      <Route path="withdrawals" element={<WithdrawalHistoryPage />} />
                    </Route>
                    <Route path="/help" element={<HelpPage />} />
                    <Route path="/feed" element={<FinanceFeedPage />} />
                    <Route path="/notifications" element={<NotificationsPage />} />
                    <Route path="/profile" element={<ProfilePage />} />
                  </Route>
                </Route>
              </Route>
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
      </LanguageProvider>
    </QueryClientProvider>
  )
}
