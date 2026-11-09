import React from 'react'
import { cn } from '../../lib/utils'

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  options: { value: string; label: string }[]
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, options, ...props }, ref) => {
    return (
      <div className="w-full space-y-1">
        {label && (
          <label className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400">
            {label}
          </label>
        )}
        <select
          ref={ref}
          className={cn(
            'flex h-9 w-full rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs sm:text-sm text-zinc-900 focus:outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500 transition-colors disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:border-zinc-400 dark:focus:ring-zinc-400',
            error && 'border-rose-400 focus:border-rose-500 focus:ring-rose-500',
            className
          )}
          {...props}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value} className="bg-white text-zinc-900 dark:bg-zinc-900 dark:text-zinc-100">
              {opt.label}
            </option>
          ))}
        </select>
        {error && <p className="text-[11px] text-rose-500">{error}</p>}
      </div>
    )
  }
)

Select.displayName = 'Select'
