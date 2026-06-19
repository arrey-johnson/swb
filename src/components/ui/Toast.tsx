import { createContext, useCallback, useContext, useState, type ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { CheckCircle, AlertCircle, X } from 'lucide-react'

type ToastType = 'success' | 'error' | 'info'

interface Toast {
  id: number
  message: string
  type: ToastType
}

interface ToastContextValue {
  toast: (message: string, type?: ToastType) => void
  success: (message: string) => void
  error: (message: string) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

let toastId = 0

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const addToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = ++toastId
    setToasts((prev) => [...prev, { id, message, type }])
    setTimeout(() => dismiss(id), 4000)
  }, [dismiss])

  const value: ToastContextValue = {
    toast: addToast,
    success: (m) => addToast(m, 'success'),
    error: (m) => addToast(m, 'error'),
  }

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={cn(
              'pointer-events-auto flex items-start gap-3 rounded-xl px-4 py-3 shadow-lg border text-sm animate-in slide-in-from-right',
              t.type === 'success' && 'bg-white border-success/30 text-gray-800',
              t.type === 'error' && 'bg-white border-danger/30 text-gray-800',
              t.type === 'info' && 'bg-white border-gray-200 text-gray-800'
            )}
          >
            {t.type === 'success' && <CheckCircle className="h-5 w-5 text-success shrink-0" />}
            {t.type === 'error' && <AlertCircle className="h-5 w-5 text-danger shrink-0" />}
            <p className="flex-1">{t.message}</p>
            <button type="button" onClick={() => dismiss(t.id)} className="text-gray-400 hover:text-gray-600">
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}
