import { Download, X, Share, Plus, MoreVertical } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { useLanguage } from '@/lib/i18n/LanguageProvider'
import { usePwaInstall } from '@/lib/hooks/usePwaInstall'
import { AppIcon } from '@/components/brand/BrandMark'
import { useState } from 'react'
import { cn } from '@/lib/utils'

type BottomOffset = 'auth' | 'nav'

function IosInstallModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useLanguage()
  return (
    <Modal open={open} onClose={onClose} title={t('pwa.iosTitle')}>
      <div className="space-y-4 text-sm text-gray-600">
        <p>{t('pwa.iosBody')}</p>
        <ol className="space-y-3">
          <li className="flex items-start gap-3">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-xs">1</span>
            <span className="pt-1">{t('pwa.iosStep1')} <Share className="inline h-4 w-4 text-primary" /></span>
          </li>
          <li className="flex items-start gap-3">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-xs">2</span>
            <span className="pt-1">{t('pwa.iosStep2')} <Plus className="inline h-4 w-4 text-primary" /></span>
          </li>
          <li className="flex items-start gap-3">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-xs">3</span>
            <span className="pt-1">{t('pwa.iosStep3')}</span>
          </li>
        </ol>
        <Button className="w-full" onClick={onClose}>{t('pwa.gotIt')}</Button>
      </div>
    </Modal>
  )
}

function AndroidInstallModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useLanguage()
  return (
    <Modal open={open} onClose={onClose} title={t('pwa.androidTitle')}>
      <div className="space-y-4 text-sm text-gray-600">
        <p>{t('pwa.androidBody')}</p>
        <ol className="space-y-3">
          <li className="flex items-start gap-3">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-xs">1</span>
            <span className="pt-1">{t('pwa.androidStep1')} <MoreVertical className="inline h-4 w-4 text-primary" /></span>
          </li>
          <li className="flex items-start gap-3">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-xs">2</span>
            <span className="pt-1">{t('pwa.androidStep2')}</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-xs">3</span>
            <span className="pt-1">{t('pwa.androidStep3')}</span>
          </li>
        </ol>
        <Button className="w-full" onClick={onClose}>{t('pwa.gotIt')}</Button>
      </div>
    </Modal>
  )
}

export function PwaInstallPrompt({ bottomOffset = 'nav' }: { bottomOffset?: BottomOffset }) {
  const { t } = useLanguage()
  const { showPrompt, showIosGuide, showAndroidGuide, canNativeInstall, dismiss, install } = usePwaInstall()
  const [iosModal, setIosModal] = useState(false)
  const [androidModal, setAndroidModal] = useState(false)

  if (!showPrompt) return null

  const handleInstall = async () => {
    if (showIosGuide && !canNativeInstall) {
      setIosModal(true)
      return
    }
    if (showAndroidGuide) {
      setAndroidModal(true)
      return
    }
    await install()
  }

  const bottomClass = bottomOffset === 'auth' ? 'bottom-safe-6' : 'bottom-above-nav'

  return (
    <>
      <div className={cn('fixed inset-x-0 z-50 px-4 pointer-events-none safe-area-px', bottomClass)}>
        <div className="mx-auto max-w-lg pointer-events-auto rounded-2xl bg-gradient-to-r from-primary to-primary-light text-white p-4 shadow-xl flex gap-3 items-start border border-white/10">
          <AppIcon size="md" className="shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm">{t('pwa.title')}</p>
            <p className="text-xs text-white/80 mt-0.5">{t('pwa.body')}</p>
            <div className="flex gap-2 mt-3">
              <Button
                size="sm"
                className="bg-white text-primary hover:bg-white/90"
                onClick={handleInstall}
              >
                {canNativeInstall ? t('pwa.install') : t('pwa.howTo')}
              </Button>
              <Button size="sm" variant="ghost" className="text-white/80 hover:text-white" onClick={dismiss}>
                {t('pwa.dismiss')}
              </Button>
            </div>
          </div>
          <button type="button" onClick={dismiss} className="text-white/60 hover:text-white p-1" aria-label="Dismiss">
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      <IosInstallModal open={iosModal} onClose={() => setIosModal(false)} />
      <AndroidInstallModal open={androidModal} onClose={() => setAndroidModal(false)} />
    </>
  )
}

/** Compact install button for headers — visible on mobile when installable */
export function PwaInstallButton() {
  const { t } = useLanguage()
  const { standalone, isMobile, canShowInstall, showIosGuide, showAndroidGuide, canNativeInstall, install } = usePwaInstall()
  const [iosModal, setIosModal] = useState(false)
  const [androidModal, setAndroidModal] = useState(false)

  if (standalone || !isMobile || !canShowInstall) return null

  const handleClick = async () => {
    if (showIosGuide && !canNativeInstall) {
      setIosModal(true)
      return
    }
    if (showAndroidGuide) {
      setAndroidModal(true)
      return
    }
    await install()
  }

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        className="flex items-center gap-1.5 rounded-full bg-primary/10 text-primary px-2.5 py-1.5 text-xs font-semibold hover:bg-primary/15 transition-colors shrink-0"
        aria-label={t('pwa.install')}
      >
        <Download className="h-3.5 w-3.5" />
        <span>{t('pwa.installShort')}</span>
      </button>

      <IosInstallModal open={iosModal} onClose={() => setIosModal(false)} />
      <AndroidInstallModal open={androidModal} onClose={() => setAndroidModal(false)} />
    </>
  )
}
