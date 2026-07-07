import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle, AlertCircle, Info, X, AlertTriangle } from 'lucide-react'
import { Observable } from '@/core'
import { useObservable } from '@/adapters/react'
import { cn } from '@/utils/cn'

type ToastType = 'success' | 'error' | 'info' | 'warning'

interface Toast {
  id: string
  type: ToastType
  message: string
  duration?: number
}

// Store réactif framework-agnostique (mêmes primitives que core/stores/Observable).
const toastStore = new Observable<{ toasts: Toast[] }>({ toasts: [] })

const addToast = (t: Omit<Toast, 'id'>) => {
  const id = Math.random().toString(36).slice(2)
  toastStore.setState((s) => ({ toasts: [...s.toasts, { ...t, id }] }))
  const dur = t.duration ?? 4000
  if (dur > 0) {
    setTimeout(() => removeToast(id), dur)
  }
}

const removeToast = (id: string) => {
  toastStore.setState((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }))
}

export const toast = {
  success: (message: string) => addToast({ type: 'success', message }),
  error:   (message: string) => addToast({ type: 'error',   message }),
  info:    (message: string) => addToast({ type: 'info',    message }),
  warning: (message: string) => addToast({ type: 'warning', message }),
}

const icons: Record<ToastType, React.ReactNode> = {
  success: <CheckCircle size={16} />,
  error:   <AlertCircle size={16} />,
  info:    <Info size={16} />,
  warning: <AlertTriangle size={16} />,
}

const styles: Record<ToastType, { ring: string; icon: string; bar: string }> = {
  success: { ring: 'ring-emerald-200/70', icon: 'text-emerald-600',  bar: 'bg-emerald-500' },
  error:   { ring: 'ring-rose-200/70',    icon: 'text-rose-600',     bar: 'bg-rose-500' },
  info:    { ring: 'ring-teal-200/70',    icon: 'text-teal-700',     bar: 'bg-teal-600' },
  warning: { ring: 'ring-amber-200/70',   icon: 'text-amber-600',    bar: 'bg-amber-500' },
}

export const ToastContainer = () => {
  const { toasts } = useObservable(toastStore)

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      <AnimatePresence mode="popLayout">
        {toasts.map((t) => {
          const s = styles[t.type]
          return (
            <motion.div
              key={t.id}
              layout
              initial={{ opacity: 0, x: 60, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 60, scale: 0.95 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className={cn(
                'pointer-events-auto relative flex items-start gap-3 rounded-xl pl-4 pr-3 py-3',
                'bg-white border border-slate-200 shadow-card ring-1 ring-inset',
                'font-body text-sm text-slate-800 overflow-hidden',
                s.ring
              )}
            >
              <span className={cn('absolute left-0 top-0 bottom-0 w-1', s.bar)} />
              <span className={cn('mt-0.5 flex-shrink-0', s.icon)}>{icons[t.type]}</span>
              <p className="flex-1 leading-snug">{t.message}</p>
              <button
                onClick={() => removeToast(t.id)}
                aria-label="Fermer"
                className="flex-shrink-0 rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
              >
                <X size={13} />
              </button>
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
}
