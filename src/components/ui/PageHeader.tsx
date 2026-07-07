import { motion } from 'framer-motion'

interface PageHeaderProps {
  title: string
  subtitle?: string
  actions?: React.ReactNode
  icon?: React.ReactNode
}

export const PageHeader = ({ title, subtitle, actions, icon }: PageHeaderProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="flex items-start justify-between gap-4 mb-6"
    >
      <div className="flex items-center gap-4">
        {icon && (
          <div className="flex-shrink-0 rounded-2xl bg-teal-50 ring-1 ring-inset ring-teal-200/60 p-3 text-teal-700 shadow-soft">
            {icon}
          </div>
        )}
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900 tracking-tightest leading-tight">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-1 font-body text-sm text-slate-500">{subtitle}</p>
          )}
        </div>
      </div>
      {actions && (
        <div className="flex-shrink-0 flex items-center gap-2">
          {actions}
        </div>
      )}
    </motion.div>
  )
}
