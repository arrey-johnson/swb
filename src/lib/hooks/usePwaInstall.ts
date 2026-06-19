import { useState, useEffect, useCallback } from 'react'

export interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

function isStandaloneMode() {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  )
}

function isIosDevice() {
  return /iPad|iPhone|iPod/.test(navigator.userAgent)
}

function isMobileDevice() {
  return /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent)
}

function isAndroidDevice() {
  return /Android/i.test(navigator.userAgent)
}

const DISMISS_KEY = 'swb-pwa-dismissed'

export function usePwaInstall() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null)
  const [dismissed, setDismissed] = useState(() => localStorage.getItem(DISMISS_KEY) === '1')
  const [standalone, setStandalone] = useState(isStandaloneMode)

  useEffect(() => {
    const mq = window.matchMedia('(display-mode: standalone)')
    const onChange = () => setStandalone(isStandaloneMode())
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault()
      setDeferred(e as BeforeInstallPromptEvent)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const dismiss = useCallback(() => {
    localStorage.setItem(DISMISS_KEY, '1')
    setDismissed(true)
  }, [])

  const install = useCallback(async () => {
    if (!deferred) return false
    await deferred.prompt()
    const { outcome } = await deferred.userChoice
    if (outcome === 'accepted') {
      setDeferred(null)
      return true
    }
    return false
  }, [deferred])

  const isIos = isIosDevice()
  const isAndroid = isAndroidDevice()
  const isMobile = isMobileDevice()
  const canNativeInstall = !!deferred
  const showIosGuide = isIos && !standalone && isMobile
  const showAndroidGuide = isAndroid && !standalone && isMobile && !canNativeInstall
  const canShowInstall = canNativeInstall || showIosGuide || showAndroidGuide
  const showPrompt = !standalone && isMobile && !dismissed && canShowInstall

  return {
    standalone,
    isIos,
    isAndroid,
    isMobile,
    canNativeInstall,
    showIosGuide,
    showAndroidGuide,
    canShowInstall,
    showPrompt,
    dismiss,
    install,
  }
}
