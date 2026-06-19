import { useEffect, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ModalProps {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
  className?: string
  /** Bottom sheet on mobile (default). Use "center" for always-centered dialogs. */
  placement?: 'sheet' | 'center'
}

export function Modal({
  open,
  onClose,
  title,
  children,
  className,
  placement = 'sheet',
}: ModalProps) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  if (!open) return null

  const isSheet = placement === 'sheet'

  return createPortal(
    <div
      className={cn(
        'fixed inset-0 z-[200] flex justify-center p-0 sm:p-4',
        isSheet ? 'items-end sm:items-center' : 'items-center'
      )}
    >
      <div className="absolute inset-0 bg-black/50" onClick={onClose} aria-hidden />
      <div
        className={cn(
          'relative w-full max-w-lg bg-white shadow-xl max-h-[85vh] overflow-y-auto',
          isSheet
            ? 'rounded-t-2xl sm:rounded-2xl pb-[env(safe-area-inset-bottom)]'
            : 'rounded-2xl m-4',
          className
        )}
        role="dialog"
        aria-modal
        aria-labelledby="modal-title"
      >
        {isSheet && (
          <div className="flex justify-center pt-3 pb-1 sm:hidden">
            <div className="h-1 w-10 rounded-full bg-gray-300" aria-hidden />
          </div>
        )}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 sticky top-0 bg-white">
          <h2 id="modal-title" className="text-lg font-semibold text-gray-900">{title}</h2>
          <button type="button" onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 rounded-lg">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="p-5 pb-6">{children}</div>
      </div>
    </div>,
    document.body
  )
}
