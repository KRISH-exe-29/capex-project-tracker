import React, { SelectHTMLAttributes, forwardRef } from 'react'
import { cn } from '../../utils/cn'
import { ChevronDown } from 'lucide-react'

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  helperText?: string
  options?: { value: string | number; label: string }[]
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(({
  className,
  label,
  error,
  helperText,
  options,
  children,
  id,
  ...props
}, ref) => {
  const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined)

  return (
    <div className="w-full space-y-1.5 text-left">
      {label && (
        <label 
          htmlFor={selectId} 
          className="block text-xs font-medium text-[#334155] tracking-tight"
        >
          {label}
          {props.required && <span className="text-[#EF4444] ml-1">*</span>}
        </label>
      )}

      <div className="relative flex items-center">
        <select
          ref={ref}
          id={selectId}
          className={cn(
            'w-full h-10 pl-3 pr-9 py-2 text-sm bg-white text-[#0F172A] border rounded-lg transition-colors appearance-none cursor-pointer',
            'focus:outline-hidden focus:ring-2 focus:ring-[#2563EB]/25 focus:border-[#2563EB]',
            error ? 'border-[#EF4444] focus:ring-[#EF4444]/25 focus:border-[#EF4444]' : 'border-[#CBD5E1] hover:border-[#94A3B8]',
            'disabled:bg-[#F8FAFC] disabled:text-[#94A3B8] disabled:cursor-not-allowed',
            className
          )}
          {...props}
        >
          {options ? (
            options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))
          ) : (
            children
          )}
        </select>

        <div className="absolute right-3 text-[#64748B] pointer-events-none flex items-center">
          <ChevronDown className="w-4 h-4" />
        </div>
      </div>

      {error ? (
        <p className="text-xs text-[#EF4444] font-medium tracking-tight">{error}</p>
      ) : helperText ? (
        <p className="text-xs text-[#64748B]">{helperText}</p>
      ) : null}
    </div>
  )
})

Select.displayName = 'Select'
