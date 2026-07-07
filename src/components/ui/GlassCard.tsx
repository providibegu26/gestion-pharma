import { motion } from 'framer-motion'
import { cn } from '@/utils/cn'

interface GlassCardProps {
  children: React.ReactNode
  className?: string
  hover?: boolean
  onClick?: () => void
  delay?: number
  variant?: 'glass' | 'solid' | 'sand'
}

const variants = {
  glass: 'bg-white/75 backdrop-blur-xl border border-slate-200/60 shadow-glass',
  solid: 'bg-white border border-slate-200/70 shadow-card',
  sand:  'bg-sand-soft border border-sand-200/60 shadow-card',
}

export const GlassCard = ({
  children,
  className,
  hover = false,
  onClick,
  delay = 0,
  variant = 'solid',
}: GlassCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1], delay }}
      whileHover={hover ? { y: -2 } : undefined}
      onClick={onClick}
      className={cn(
        'relative rounded-2xl overflow-hidden',
        variants[variant],
        hover && 'cursor-pointer transition-shadow duration-300 hover:shadow-card-hover',
        className
      )}
    >
      {/* Surbrillance haute subtile */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/80 to-transparent" />
      {children}
    </motion.div>
  )
}
