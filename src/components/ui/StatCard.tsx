import { cn, formatFCFA } from '@/lib/utils'

interface StatCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon?: React.ReactNode
  variant?: 'default' | 'primary' | 'success' | 'warning'
  formatAsCurrency?: boolean
}

export function StatCard({
  title,
  value,
  subtitle,
  icon,
  variant = 'default',
  formatAsCurrency = true,
}: StatCardProps) {
  const variants = {
    default: 'bg-white',
    primary: 'bg-gradient-to-br from-primary to-primary-light text-white',
    success: 'bg-success/5 border-success/20',
    warning: 'bg-warning/5 border-warning/20',
  }

  const isFormatted = typeof value === 'string' && value.includes('FCFA')
  const display = isFormatted
    ? value
    : typeof value === 'number'
      ? formatAsCurrency
        ? formatFCFA(value)
        : value.toLocaleString('en-GB')
      : value

  return (
    <div className={cn('rounded-2xl p-5 border border-gray-100 shadow-sm', variants[variant])}>
      <div className="flex items-start justify-between">
        <div>
          <p className={cn('text-sm font-medium', variant === 'primary' ? 'text-white/80' : 'text-gray-500')}>
            {title}
          </p>
          <p className={cn('mt-1 text-2xl font-bold', variant === 'primary' ? 'text-white' : 'text-gray-900')}>
            {display}
          </p>
          {subtitle && (
            <p className={cn('mt-1 text-xs', variant === 'primary' ? 'text-white/70' : 'text-gray-400')}>
              {subtitle}
            </p>
          )}
        </div>
        {icon && (
          <div className={cn(
            'rounded-xl p-2.5',
            variant === 'primary' ? 'bg-white/20' : 'bg-primary/10 text-primary'
          )}>
            {icon}
          </div>
        )}
      </div>
    </div>
  )
}
