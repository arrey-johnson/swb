import { cn } from '@/lib/utils'

export const APP_ICON_SRC = '/app-icon.png'

type AppIconSize = 'sm' | 'sidebar' | 'md' | 'lg'

const sizeClasses: Record<AppIconSize, string> = {
  sm: 'h-8 w-8',
  sidebar: 'h-9 w-9',
  md: 'h-14 w-14',
  lg: 'h-28 w-28',
}

interface AppIconProps {
  size?: AppIconSize
  className?: string
}

/** SaveWithBanks app icon — used in headers, auth, feed, and install prompts. */
export function AppIcon({ size = 'sm', className }: AppIconProps) {
  return (
    <img
      src={APP_ICON_SRC}
      alt="SaveWithBanks"
      className={cn(sizeClasses[size], 'rounded-xl object-cover shrink-0', className)}
    />
  )
}

/** @deprecated Use AppIcon — kept for existing imports */
export function BrandMark({ className }: { className?: string }) {
  return <AppIcon size="sm" className={className} />
}
