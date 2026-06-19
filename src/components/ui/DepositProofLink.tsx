import { useState, useEffect } from 'react'
import { Image } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useLanguage } from '@/lib/i18n/LanguageProvider'

export function DepositProofLink({ path }: { path: string }) {
  const { t } = useLanguage()
  const [url, setUrl] = useState<string | null>(null)

  useEffect(() => {
    supabase.storage.from('deposit-proofs').createSignedUrl(path, 3600).then(({ data }) => {
      if (data?.signedUrl) setUrl(data.signedUrl)
    })
  }, [path])

  if (!url) {
    return <span className="text-xs text-gray-400">{t('proof.loading')}</span>
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 text-xs text-primary font-medium hover:underline mt-2"
    >
      <Image className="h-3.5 w-3.5" />
      {t('proof.view')}
    </a>
  )
}
