import { Check, Clock, PackageCheck, ShoppingBag, XCircle } from 'lucide-react'
import { cn } from '@/utils/cn'
import type { StatutCommande } from '@/core'

const STEPS = [
  { key: 'commande', label: 'Commande', icon: ShoppingBag },
  { key: 'validation', label: 'Validation', icon: Clock },
  { key: 'prete', label: 'Prête', icon: PackageCheck },
  { key: 'retiree', label: 'Retirée', icon: Check },
] as const

const stepIndex = (statut: StatutCommande): number => {
  switch (statut) {
    case 'EN_ATTENTE': return 1
    case 'PRETE':      return 2
    case 'RETIREE':    return 3
    case 'REFUSEE':    return -1
    default:           return 0
  }
}

interface OrderStatusStepperProps {
  statut: StatutCommande
  compact?: boolean
  accent?: 'teal' | 'emerald'
}

export const OrderStatusStepper = ({ statut, compact = false, accent = 'teal' }: OrderStatusStepperProps) => {
  const current = stepIndex(statut)
  const activeRing = accent === 'emerald' ? 'ring-emerald-200 bg-emerald-600' : 'ring-teal-200 bg-teal-600'
  const activeText = accent === 'emerald' ? 'text-emerald-700' : 'text-teal-700'
  const doneBg = accent === 'emerald' ? 'bg-emerald-100 text-emerald-700 ring-emerald-200' : 'bg-teal-100 text-teal-700 ring-teal-200'
  const lineDone = accent === 'emerald' ? 'bg-emerald-300' : 'bg-teal-300'

  if (statut === 'REFUSEE') {
    return (
      <div className={cn(
        'flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3',
        compact ? 'py-1.5' : 'py-2.5',
      )}>
        <XCircle size={compact ? 14 : 16} className="text-rose-600 flex-shrink-0" />
        <p className="font-body text-xs font-semibold text-rose-800">Commande refusée</p>
      </div>
    )
  }

  return (
    <div className={cn('flex items-center', compact ? 'gap-0' : 'gap-1')}>
      {STEPS.map((step, i) => {
        const done = i < current
        const active = i === current
        const Icon = step.icon
        return (
          <div key={step.key} className="flex items-center flex-1 min-w-0">
            <div className={cn('flex flex-col items-center flex-1 min-w-0', compact && 'gap-0.5')}>
              <div className={cn(
                'flex items-center justify-center rounded-full ring-2 transition-colors',
                compact ? 'h-6 w-6' : 'h-8 w-8',
                done ? doneBg : active ? `${activeRing} text-white` : 'bg-slate-100 text-slate-400 ring-slate-200',
              )}>
                <Icon size={compact ? 11 : 13} />
              </div>
              {!compact && (
                <p className={cn(
                  'mt-1.5 font-body text-2xs font-medium text-center truncate w-full',
                  active ? activeText : done ? 'text-slate-600' : 'text-slate-400',
                )}>
                  {step.label}
                </p>
              )}
            </div>
            {i < STEPS.length - 1 && (
              <div className={cn(
                'flex-shrink-0 rounded-full transition-colors',
                compact ? 'h-0.5 w-3 mx-0.5' : 'h-0.5 w-full mx-1 mb-4',
                i < current ? lineDone : 'bg-slate-200',
              )} />
            )}
          </div>
        )
      })}
    </div>
  )
}
