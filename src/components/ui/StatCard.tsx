import { motion } from 'framer-motion'
import { cn } from '@/utils/cn'

interface StatCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon: React.ReactNode
  trend?: { value: number; label: string }
  color?: 'teal' | 'cyan' | 'sand' | 'violet' | 'amber' | 'emerald' | 'rose'
  delay?: number
}

const palette = {
  teal:    { chip: 'bg-teal-50    text-teal-700    ring-teal-200/70',    accent: 'from-teal-500/8 to-transparent' },
  cyan:    { chip: 'bg-cyan-50    text-cyan-700    ring-cyan-200/70',    accent: 'from-cyan-500/8 to-transparent' },
  sand:    { chip: 'bg-sand-50    text-sand-700    ring-sand-200/70',    accent: 'from-sand-400/8 to-transparent' },
  violet:  { chip: 'bg-violet-50  text-violet-700  ring-violet-200/70',  accent: 'from-violet-500/8 to-transparent' },
  amber:   { chip: 'bg-amber-50   text-amber-700   ring-amber-200/70',   accent: 'from-amber-500/8 to-transparent' },
  emerald: { chip: 'bg-emerald-50 text-emerald-700 ring-emerald-200/70', accent: 'from-emerald-500/8 to-transparent' },
  rose:    { chip: 'bg-rose-50    text-rose-700    ring-rose-200/70',    accent: 'from-rose-500/8 to-transparent' },
}

export const StatCard = ({
  title,
  value,
  subtitle,
  icon,
  trend,
  color = 'teal',
  delay = 0,
}: StatCardProps) => {
  const c = palette[color]

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1], delay }}
      whileHover={{ y: -2 }}
      className="relative rounded-2xl border border-slate-200/70 bg-white p-5 shadow-card overflow-hidden transition-shadow hover:shadow-card-hover"
    >
      {/* Accent radial subtil */}
      <div
        className={cn(
          'pointer-events-none absolute -top-12 -right-12 h-32 w-32 rounded-full bg-gradient-radial blur-2xl opacity-70',
          c.accent
        )}
        style={{ background: `radial-gradient(circle, var(--tw-gradient-from), var(--tw-gradient-to))` }}
      />
      {/* Surbrillance haute */}
      <div className="pointer-events-none absolute inset-x-4 top-0 h-px bg-gradient-to-r from-transparent via-slate-300/40 to-transparent" />

      <div className="relative flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <p className="font-medical text-2xs font-semibold text-slate-500 uppercase tracking-widest">
            {title}
          </p>
          <p className="mt-2 font-mono text-3xl font-bold text-slate-900 tracking-tighter leading-none">
            {value}
          </p>
          {subtitle && (
            <p className="mt-1.5 text-xs text-slate-500 font-body">{subtitle}</p>
          )}
          {trend && (
            <div className={cn(
              'mt-3 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-2xs font-medium font-body',
              trend.value >= 0
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
                : 'bg-rose-50 text-rose-700 border border-rose-200/60'
            )}>
              <span>{trend.value >= 0 ? '↑' : '↓'}</span>
              <span>{Math.abs(trend.value)}% {trend.label}</span>
            </div>
          )}
        </div>
        <div className={cn(
          'flex-shrink-0 rounded-xl p-3 ring-1 ring-inset',
          c.chip
        )}>
          {icon}
        </div>
      </div>
    </motion.div>
  )
}
