import { Search } from 'lucide-react'
import { cn } from '@/utils/cn'

interface SearchBoxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  containerClassName?: string
}

export const SearchBox = ({ containerClassName, className, placeholder = 'Rechercher…', ...props }: SearchBoxProps) => {
  return (
    <div className={cn(
      'relative flex items-center rounded-xl border border-slate-200 bg-white shadow-soft',
      'transition-all duration-200 focus-within:border-teal-400 focus-within:ring-4 focus-within:ring-teal-500/10',
      'h-10 max-w-sm w-full',
      containerClassName,
    )}>
      <Search size={14} className="absolute left-3.5 text-slate-400 pointer-events-none" />
      <input
        {...props}
        placeholder={placeholder}
        className={cn(
          'w-full bg-transparent pl-10 pr-4 font-body text-sm text-slate-900',
          'placeholder:text-slate-400 focus:outline-none',
          className,
        )}
      />
    </div>
  )
}
