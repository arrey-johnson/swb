/** Shared splash screen styling — keep in sync with index.html inline splash + generate-splash.py colors */

export const SPLASH_BG = '#120828'
export const SPLASH_GRADIENT =
  'radial-gradient(ellipse at center, #2a1060 0%, #120828 65%)'

export function dismissHtmlSplash() {
  const el = document.getElementById('html-splash')
  if (!el) return
  el.classList.add('html-splash--hide')
  window.setTimeout(() => el.remove(), 280)
}
