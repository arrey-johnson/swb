import { Link, useLocation, Outlet } from 'react-router-dom'
import { Home, Target, Wallet, History, User, LogOut, Bell, HelpCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/app/AuthProvider'
import { useUnreadCount } from '@/lib/api/hooks'
import { useRealtimeSync } from '@/lib/hooks/useRealtimeSync'
import { AccountStatusBanner } from '@/components/layout/AccountStatusBanner'
import { PwaInstallButton } from '@/components/layout/PwaInstallPrompt'
import { useLanguage } from '@/lib/i18n/LanguageProvider'

export function AppLayout() {
  const location = useLocation()
  const { signOut } = useAuth()
  const { data: unread } = useUnreadCount()
  const { t } = useLanguage()
  useRealtimeSync()

  const hideStatusBanner = location.pathname.endsWith('/deposit')

  const saverNav = [
    { to: '/dashboard', icon: Home, label: t('nav.home') },
    { to: '/goals', icon: Target, label: t('nav.goals') },
    { to: '/deposits', icon: Wallet, label: t('nav.deposits') },
    { to: '/history/transactions', icon: History, label: t('nav.history') },
    { to: '/profile', icon: User, label: t('nav.profile') },
  ]

  return (
    <div className="min-h-dvh bg-gray-50 pb-bottom-nav safe-area-px">
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-lg border-b border-gray-100 safe-area-pt">
        <div className="mx-auto max-w-lg px-4 py-3 flex items-center justify-between">
          <Link to="/dashboard" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-primary to-primary-light flex items-center justify-center">
              <span className="text-white font-bold text-sm">SW</span>
            </div>
            <span className="font-semibold text-gray-900">SaveWithBanks</span>
          </Link>
          <div className="flex items-center gap-1">
            <PwaInstallButton />
            <Link
              to="/help"
              className="p-2 text-gray-500 hover:text-primary rounded-lg transition-colors"
              aria-label={t('nav.help')}
            >
              <HelpCircle className="h-5 w-5" />
            </Link>
            <Link
              to="/notifications"
              className="relative p-2 text-gray-500 hover:text-primary rounded-lg transition-colors"
              aria-label="Notifications"
            >
              <Bell className="h-5 w-5" />
              {unread && unread > 0 ? (
                <span className="absolute top-1 right-1 h-4 min-w-4 px-0.5 rounded-full bg-danger text-white text-[10px] font-bold flex items-center justify-center">
                  {unread > 9 ? '9+' : unread}
                </span>
              ) : null}
            </Link>
            <button
              onClick={() => signOut()}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg"
              aria-label="Sign out"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-lg px-4 py-6">
        {!hideStatusBanner && <AccountStatusBanner />}
        <Outlet />
      </main>

      <nav className="fixed bottom-0 inset-x-0 z-40 bg-white border-t border-gray-100 safe-area-pb safe-area-px">
        <div className="mx-auto max-w-lg flex">
          {saverNav.map(({ to, icon: Icon, label }) => {
            const active =
              to === '/history/transactions'
                ? location.pathname.startsWith('/history')
                : location.pathname.startsWith(to)
            return (
              <Link
                key={to}
                to={to}
                className={cn(
                  'flex-1 flex flex-col items-center gap-0.5 py-2.5 text-[10px] font-medium transition-colors',
                  active ? 'text-primary' : 'text-gray-400'
                )}
              >
                <Icon className="h-5 w-5" />
                {label}
              </Link>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
