import { Link, Outlet, useLocation } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { useLanguage } from '@/lib/i18n/LanguageProvider'

const tabs = [
  { to: '/history/transactions', labelKey: 'history.transactions' as const },
  { to: '/history/withdrawals', labelKey: 'history.withdrawals' as const },
]

export default function HistoryLayoutPage() {
  const location = useLocation()
  const { t } = useLanguage()

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{t('history.title')}</h1>
      </div>
      <div className="flex rounded-xl bg-gray-100 p-1">
        {tabs.map(({ to, labelKey }) => (
          <Link
            key={to}
            to={to}
            className={cn(
              'flex-1 py-2 text-sm font-medium rounded-lg text-center transition-colors',
              location.pathname === to ? 'bg-white text-primary shadow-sm' : 'text-gray-500'
            )}
          >
            {t(labelKey)}
          </Link>
        ))}
      </div>
      <Outlet />
    </div>
  )
}
