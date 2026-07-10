import { Pill, Clock, QrCode } from 'lucide-react'
import { cn } from '@/utils/cn'

const STEPS = [
  {
    icon: Pill,
    title: 'Choisissez',
    desc: 'Parcourez le catalogue et sélectionnez vos médicaments.',
  },
  {
    icon: Clock,
    title: 'Validation',
    desc: 'Un pharmacien vérifie et prépare votre commande.',
  },
  {
    icon: QrCode,
    title: 'Retrait',
    desc: 'Présentez votre QR code en pharmacie pour récupérer.',
  },
] as const

interface HowItWorksStripProps {
  variant?: 'client' | 'default'
  className?: string
}

export const HowItWorksStrip = ({ variant = 'client', className }: HowItWorksStripProps) => {
  const accent = variant === 'client'
    ? { chip: 'bg-emerald-50 text-emerald-700 ring-emerald-200', title: 'text-emerald-900' }
    : { chip: 'bg-teal-50 text-teal-700 ring-teal-200', title: 'text-teal-900' }

  return (
    <div className={cn('grid grid-cols-1 sm:grid-cols-3 gap-3', className)}>
      {STEPS.map((step, i) => {
        const Icon = step.icon
        return (
          <div
            key={step.title}
            className="relative rounded-2xl border border-slate-200/80 bg-white/80 p-4 shadow-soft"
          >
            <span className="absolute top-3 right-3 font-mono text-2xs font-bold text-slate-300">
              {String(i + 1).padStart(2, '0')}
            </span>
            <div className={cn('inline-flex h-9 w-9 items-center justify-center rounded-xl ring-1 ring-inset', accent.chip)}>
              <Icon size={16} />
            </div>
            <p className={cn('mt-3 font-display text-sm font-bold', accent.title)}>{step.title}</p>
            <p className="mt-1 font-body text-xs text-slate-500 leading-relaxed">{step.desc}</p>
          </div>
        )
      })}
    </div>
  )
}
