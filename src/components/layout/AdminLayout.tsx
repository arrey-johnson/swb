import { Link, useLocation, Outlet } from 'react-router-dom'
import { LayoutDashboard, Inbox, Users, FileText, Sliders, LogOut, BookOpen, ArrowUpRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/app/AuthProvider'
import { useProfile, useDepositRequests, useAdminWithdrawals } from '@/lib/api/hooks'

const adminNav = [
  { to: '/admin', icon: LayoutDashboard, label: 'Dashboard', exact: true },
  { to: '/admin/deposits', icon: Inbox, label: 'Deposits' },
  { to: '/admin/withdrawals', icon: ArrowUpRight, label: 'Payouts' },
  { to: '/admin/feed', icon: BookOpen, label: 'Feed' },
  { to: '/admin/users', icon: Users, label: 'Users' },
  { to: '/admin/penalties', icon: Sliders, label: 'Penalties' },
  { to: '/admin/reports', icon: FileText, label: 'Reports' },
]

export function AdminLayout() {
  const location = useLocation()
  const { signOut } = useAuth()
  const { data: profile } = useProfile()
  const { data: pendingDeposits } = useDepositRequests('pending')
  const { data: pendingWithdrawals } = useAdminWithdrawals(true)
  const pendingCount = pendingDeposits?.length ?? 0
  const pendingPayoutCount = pendingWithdrawals?.length ?? 0

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <header className="sticky top-0 z-40 bg-slate-900 text-white border-b border-slate-800">
        <div className="mx-auto max-w-lg px-4 py-3 flex items-center justify-between">
          <Link to="/admin" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-xl bg-white/10 flex items-center justify-center ring-1 ring-white/20">
              <span className="text-white font-bold text-sm">SW</span>
            </div>
            <div>
              <span className="font-semibold text-white block leading-tight">SaveWithBanks</span>
              <span className="text-[10px] text-slate-400 uppercase tracking-wider">Admin</span>
            </div>
          </Link>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 hidden sm:block truncate max-w-[120px]">
              {profile?.full_name}
            </span>
            <button
              onClick={() => signOut()}
              className="p-2 text-slate-400 hover:text-white rounded-lg transition-colors"
              aria-label="Sign out"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-lg px-4 py-6"><Outlet /></main>

      <nav className="fixed bottom-0 inset-x-0 z-40 bg-slate-900 border-t border-slate-800">
        <div className="mx-auto max-w-lg flex">
          {adminNav.map(({ to, icon: Icon, label, exact }) => {
            const active = exact
              ? location.pathname === to
              : location.pathname.startsWith(to)
            const isDeposits = to === '/admin/deposits'
            const isPayouts = to === '/admin/withdrawals'
            const badgeCount = isDeposits ? pendingCount : isPayouts ? pendingPayoutCount : 0
            return (
              <Link
                key={to}
                to={to}
                className={cn(
                  'flex-1 flex flex-col items-center gap-1 py-3 text-[10px] font-medium transition-colors relative',
                  active ? 'text-white' : 'text-slate-500 hover:text-slate-300'
                )}
              >
                <Icon className="h-5 w-5" />
                {label}
                {badgeCount > 0 && (
                  <span className="absolute top-2 right-1/4 h-4 min-w-4 px-0.5 rounded-full bg-warning text-slate-900 text-[10px] font-bold flex items-center justify-center">
                    {badgeCount > 9 ? '9+' : badgeCount}
                  </span>
                )}
              </Link>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
