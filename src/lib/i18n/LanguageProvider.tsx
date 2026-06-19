import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { translations, interpolate, type Locale, type TranslationKey } from '@/lib/i18n/translations'

const STORAGE_KEY = 'swb-locale'

interface LanguageContextType {
  locale: Locale
  setLocale: (locale: Locale) => void
  t: (key: TranslationKey, vars?: Record<string, string>) => string
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved === 'en' || saved === 'fr') return saved
    return navigator.language.startsWith('fr') ? 'fr' : 'en'
  })

  const setLocale = (next: Locale) => {
    setLocaleState(next)
    localStorage.setItem(STORAGE_KEY, next)
  }

  useEffect(() => {
    document.documentElement.lang = locale
  }, [locale])

  const t = (key: TranslationKey, vars?: Record<string, string>) => {
    const text = translations[locale][key] ?? translations.en[key] ?? key
    return vars ? interpolate(text, vars) : text
  }

  return (
    <LanguageContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const ctx = useContext(LanguageContext)
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider')
  return ctx
}
