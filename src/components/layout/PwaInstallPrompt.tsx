import { useState, useEffect } from 'react'
import { Download, X } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useLanguage } from '@/lib/i18n/LanguageProvider'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export function PwaInstallPrompt() {
  const { t } = useLanguage()
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null)
  const [dismissed, setDismissed] = useState(() =>
    localStorage.getItem('swb-pwa-dismissed') === '1'
  )

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault()
      setDeferred(e as BeforeInstallPromptEvent)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  if (dismissed || !deferred) return null

  const install = async () => {
    await deferred.prompt()
    const { outcome } = await deferred.userChoice
    if (outcome === 'accepted') setDeferred(null)
  }

  const dismiss = () => {
    localStorage.setItem('swb-pwa-dismissed', '1')
    setDismissed(true)
  }

  return (
    <div className="fixed bottom-20 inset-x-0 z-50 px-4 pointer-events-none">
      <div className="mx-auto max-w-lg pointer-events-auto rounded-2xl bg-slate-900 text-white p-4 shadow-xl flex gap-3 items-start">
        <Download className="h-5 w-5 shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm">{t('pwa.title')}</p>
          <p className="text-xs text-slate-300 mt-0.5">{t('pwa.body')}</p>
          <div className="flex gap-2 mt-3">
            <Button size="sm" onClick={install}>{t('pwa.install')}</Button>
            <Button size="sm" variant="ghost" className="text-slate-300" onClick={dismiss}>
              {t('pwa.dismiss')}
            </Button>
          </div>
        </div>
        <button type="button" onClick={dismiss} className="text-slate-400 hover:text-white p-1">
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
