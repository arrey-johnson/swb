import { cn } from '@/lib/utils'
import { APP_ICON_SRC } from '@/components/brand/BrandMark'
import { SPLASH_GRADIENT } from '@/lib/splash'

interface SplashScreenProps {
  className?: string
  /** Logo size in pixels — defaults to 128 for auth boot, 112 for inline guards */
  logoSize?: number
}

/** Branded full-screen splash — matches native/HTML PWA startup screens. */
export function SplashScreen({ className, logoSize = 128 }: SplashScreenProps) {
  return (
    <div
      className={cn(
        'min-h-dvh w-full flex items-center justify-center overflow-hidden safe-area-pt safe-area-pb safe-area-px',
        className
      )}
      style={{ background: SPLASH_GRADIENT }}
      role="status"
      aria-label="Loading SaveWithBanks"
    >
      <img
        src={APP_ICON_SRC}
        alt=""
        width={logoSize}
        height={logoSize}
        className="rounded-2xl object-cover shrink-0 animate-pulse"
        aria-hidden="true"
      />
    </div>
  )
}
