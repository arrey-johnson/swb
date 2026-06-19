import { Link, useLocation, Outlet } from 'react-router-dom'
import {
  LayoutDashboard, Inbox, Users, FileText, Sliders, LogOut, BookOpen,
  ArrowUpRight, Settings, ScrollText, Bell, Shield, Menu, X,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/app/AuthProvider'
import { useProfile, useDepositRequests, useAdminWithdrawals } from '@/lib/api/hooks'
import { useAdminRealtimeSync } from '@/lib/hooks/useAdminRealtimeSync'
import { useState } from 'react'

const primaryNav = [
  { to: '/admin', icon: LayoutDashboard, label: 'Dashboard', exact: true },
  { to: '/admin/deposits', icon: Inbox, label: 'Deposits', badge: 'deposits' as const },
  { to: '/admin/withdrawals', icon: ArrowUpRight, label: 'Payouts', badge: 'payouts' as const },
  { to: '/admin/users', icon: Users, label: 'Users' },
]

const secondaryNav = [
  { to: '/admin/feed', icon: BookOpen, label: 'Finance Feed' },
  { to: '/admin/penalties', icon: Sliders, label: 'Penalties' },
  { to: '/admin/reports', icon: FileText, label: 'Reports' },
  { to: '/admin/settings', icon: Settings, label: 'Settings' },
  { to: '/admin/audit', icon: ScrollText, label: 'Audit Log' },
  { to: '/admin/notify', icon: Bell, label: 'Notifications' },
  { to: '/admin/team', icon: Shield, label: 'Team' },
]

function NavLink({
  to, icon: Icon, label, exact, badgeCount, onClick,
}: {
  to: string
  icon: typeof LayoutDashboard
  label: string
  exact?: boolean
  badgeCount?: number
  onClick?: () => void
}) {
  const location = useLocation()
  const active = exact ? location.pathname === to : location.pathname.startsWith(to)

  return (
    <Link
      to={to}
      onClick={onClick}
      className={cn(
        'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors relative',
        active
          ? 'bg-white/10 text-white'
          : 'text-slate-400 hover:text-white hover:bg-white/5'
      )}
    >
      <Icon className="h-5 w-5 shrink-0" />
      <span className="flex-1">{label}</span>
      {badgeCount != null && badgeCount > 0 && (
        <span className="h-5 min-w-5 px-1 rounded-full bg-warning text-slate-900 text-[10px] font-bold flex items-center justify-center">
          {badgeCount > 9 ? '9+' : badgeCount}
        </span>
      )}
    </Link>
  )
}

export function AdminLayout() {
  const location = useLocation()
  const { signOut } = useAuth()
  const { data: profile } = useProfile()
  const { data: pendingDeposits } = useDepositRequests('pending')
  const { data: pendingWithdrawals } = useAdminWithdrawals(true)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  useAdminRealtimeSync()

  const pendingCount = pendingDeposits?.length ?? 0
  const pendingPayoutCount = pendingWithdrawals?.length ?? 0

  const badge = (key?: 'deposits' | 'payouts') => {
    if (key === 'deposits') return pendingCount
    if (key === 'payouts') return pendingPayoutCount
    return 0
  }

  const Sidebar = ({ onNavigate }: { onNavigate?: () => void }) => (
    <div className="flex flex-col h-full">
      <div className="px-4 py-5 border-b border-slate-800">
        <Link to="/admin" className="flex items-center gap-3" onClick={onNavigate}>
          <div className="h-9 w-9 rounded-xl bg-white/10 flex items-center justify-center ring-1 ring-white/20">
            <span className="text-white font-bold text-sm">SW</span>
          </div>
          <div>
            <span className="font-semibold text-white block leading-tight">SaveWithBanks</span>
            <span className="text-[10px] text-slate-400 uppercase tracking-wider">Admin Console</span>
          </div>
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        <p className="px-3 text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2">Operations</p>
        {primaryNav.map((item) => (
          <NavLink
            key={item.to}
            {...item}
            badgeCount={badge(item.badge)}
            onClick={onNavigate}
          />
        ))}
        <p className="px-3 text-[10px] font-semibold text-slate-500 uppercase tracking-wider mt-6 mb-2">Management</p>
        {secondaryNav.map((item) => (
          <NavLink key={item.to} {...item} onClick={onNavigate} />
        ))}
      </nav>

      <div className="px-4 py-4 border-t border-slate-800">
        <p className="text-xs text-slate-400 truncate mb-2">{profile?.full_name}</p>
        <button
          onClick={() => signOut()}
          className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Desktop sidebar */}
      <aside className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-40 lg:flex lg:w-64 lg:flex-col bg-slate-900">
        <Sidebar />
      </aside>

      {/* Mobile header */}
      <header className="sticky top-0 z-40 bg-slate-900 text-white border-b border-slate-800 lg:hidden">
        <div className="px-4 py-3 flex items-center justify-between">
          <Link to="/admin" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-xl bg-white/10 flex items-center justify-center">
              <span className="text-white font-bold text-sm">SW</span>
            </div>
            <span className="font-semibold">Admin</span>
          </Link>
          <button
            type="button"
            onClick={() => setMobileMenuOpen(true)}
            className="p-2 text-slate-400 hover:text-white"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </header>

      {/* Mobile drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileMenuOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-72 bg-slate-900 flex flex-col">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
            <Sidebar onNavigate={() => setMobileMenuOpen(false)} />
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="lg:pl-64">
        <main className="mx-auto max-w-6xl px-4 py-6 pb-24 lg:pb-6">
          <Outlet />
        </main>
      </div>

      {/* Mobile bottom nav */}
      <nav className="fixed bottom-0 inset-x-0 z-40 bg-slate-900 border-t border-slate-800 lg:hidden">
        <div className="flex">
          {primaryNav.map(({ to, icon: Icon, label, exact, badge: b }) => {
            const active = exact ? location.pathname === to : location.pathname.startsWith(to)
            const count = badge(b)
            return (
              <Link
                key={to}
                to={to}
                className={cn(
                  'flex-1 flex flex-col items-center gap-1 py-3 text-[10px] font-medium relative',
                  active ? 'text-white' : 'text-slate-500'
                )}
              >
                <Icon className="h-5 w-5" />
                {label}
                {count > 0 && (
                  <span className="absolute top-1.5 right-1/4 h-4 min-w-4 px-0.5 rounded-full bg-warning text-slate-900 text-[10px] font-bold flex items-center justify-center">
                    {count > 9 ? '9+' : count}
                  </span>
                )}
              </Link>
            )
          })}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(true)}
            className="flex-1 flex flex-col items-center gap-1 py-3 text-[10px] font-medium text-slate-500"
          >
            <Menu className="h-5 w-5" />
            More
          </button>
        </div>
      </nav>
    </div>
  )
}
