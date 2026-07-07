import { cn } from '@/utils/cn'

interface BadgeProps {
  children: React.ReactNode
  className?: string
  dot?: boolean
  size?: 'sm' | 'md'
}

const sizes = {
  sm: 'px-2 py-0.5 text-2xs',
  md: 'px-2.5 py-1 text-xs',
}

export const Badge = ({ children, className, dot, size = 'md' }: BadgeProps) => {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border font-body font-medium',
        'whitespace-nowrap',
        sizes[size],
        // Couleurs par défaut si rien n'est fourni
        !className?.includes('bg-') && 'bg-slate-50 text-slate-700 border-slate-200',
        className
      )}
    >
      {dot && (
        <span className="size-1.5 rounded-full bg-current opacity-80" />
      )}
      {children}
    </span>
  )
}
