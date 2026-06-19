import { cn, getGoalStatusColor } from '@/lib/utils'

interface BadgeProps {
  children: React.ReactNode
  className?: string
}

export function Badge({ children, className }: BadgeProps) {
  return (
    <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize', className)}>
      {children}
    </span>
  )
}

export function GoalStatusBadge({ status }: { status: string }) {
  return (
    <Badge className={getGoalStatusColor(status)}>
      {status.replace('_', ' ')}
    </Badge>
  )
}
