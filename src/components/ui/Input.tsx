import { cn } from '@/utils/cn'
import { forwardRef } from 'react'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
  icon?: React.ReactNode
  iconRight?: React.ReactNode
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, icon, iconRight, className, id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-')

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="font-medical text-xs font-medium text-slate-600 tracking-wide"
          >
            {label}
          </label>
        )}
        <div className="relative flex items-center group">
          {icon && (
            <span className="pointer-events-none absolute left-3 text-slate-400 transition-colors group-focus-within:text-teal-600">
              {icon}
            </span>
          )}
          <input
            ref={ref}
            id={inputId}
            className={cn(
              'w-full rounded-xl border bg-white font-body text-sm text-slate-900',
              'placeholder:text-slate-400 focus:outline-none transition-all duration-200',
              'focus:ring-4 focus:ring-teal-500/10 shadow-soft',
              error
                ? 'border-rose-300 focus:border-rose-400 focus:ring-rose-500/10'
                : 'border-slate-200 hover:border-slate-300 focus:border-teal-500',
              icon ? 'pl-10' : 'pl-4',
              iconRight ? 'pr-10' : 'pr-4',
              'py-2.5',
              className
            )}
            {...props}
          />
          {iconRight && (
            <span className="absolute right-3 text-slate-400 transition-colors group-focus-within:text-teal-600">
              {iconRight}
            </span>
          )}
        </div>
        {error && <p className="text-xs text-rose-600 font-body flex items-center gap-1">{error}</p>}
        {hint && !error && <p className="text-xs text-slate-500 font-body">{hint}</p>}
      </div>
    )
  }
)

Input.displayName = 'Input'
