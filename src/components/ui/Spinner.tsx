import { Loader2 } from 'lucide-react'
import { cn } from '@/utils/cn'

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
  fullPage?: boolean
}

const sizes = { sm: 16, md: 24, lg: 40 }

export const Spinner = ({ size = 'md', className, fullPage }: SpinnerProps) => {
  if (fullPage) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/70 backdrop-blur-sm">
        <div className="flex flex-col items-center gap-3">
          <Loader2 size={36} className="animate-spin text-teal-600" />
          <p className="text-xs font-medical text-slate-500 uppercase tracking-widest">
            Chargement
          </p>
        </div>
      </div>
    )
  }

  return (
    <Loader2
      size={sizes[size]}
      className={cn('animate-spin text-teal-600', className)}
    />
  )
}
