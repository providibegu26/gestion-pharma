import { cn } from '@/utils/cn'
import { forwardRef } from 'react'
import { ChevronDown } from 'lucide-react'

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  options: { value: string; label: string }[]
  placeholder?: string
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, options, placeholder, className, id, ...props }, ref) => {
    const selectId = id ?? label?.toLowerCase().replace(/\s+/g, '-')

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={selectId}
            className="font-medical text-xs font-medium text-slate-600 tracking-wide"
          >
            {label}
          </label>
        )}
        <div className="relative">
          <select
            ref={ref}
            id={selectId}
            className={cn(
              'w-full appearance-none rounded-xl border bg-white font-body text-sm text-slate-900',
              'pl-4 pr-10 py-2.5 focus:outline-none transition-all duration-200',
              'focus:ring-4 focus:ring-teal-500/10 shadow-soft cursor-pointer',
              error
                ? 'border-rose-300 focus:border-rose-400 focus:ring-rose-500/10'
                : 'border-slate-200 hover:border-slate-300 focus:border-teal-500',
              className
            )}
            {...props}
          >
            {placeholder && (
              <option value="" disabled>{placeholder}</option>
            )}
            {options.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <ChevronDown
            size={15}
            className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
        </div>
        {error && <p className="text-xs text-rose-600 font-body">{error}</p>}
      </div>
    )
  }
)

Select.displayName = 'Select'
