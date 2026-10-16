import React, { InputHTMLAttributes, forwardRef } from 'react'
import { cn } from '../../utils/cn'

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helperText?: string
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

export const Input = forwardRef<HTMLInputElement, InputProps>(({
  className,
  label,
  error,
  helperText,
  leftIcon,
  rightIcon,
  id,
  type = 'text',
  ...props
}, ref) => {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined)

  return (
    <div className="w-full space-y-1.5 text-left">
      {label && (
        <label 
          htmlFor={inputId} 
          className="block text-xs font-medium text-[#334155] tracking-tight"
        >
          {label}
          {props.required && <span className="text-[#EF4444] ml-1">*</span>}
        </label>
      )}

      <div className="relative flex items-center">
        {leftIcon && (
          <div className="absolute left-3 text-[#94A3B8] pointer-events-none flex items-center">
            {leftIcon}
          </div>
        )}

        <input
          ref={ref}
          id={inputId}
          type={type}
          className={cn(
            'w-full h-10 px-3 py-2 text-sm bg-white text-[#0F172A] border rounded-lg placeholder:text-[#94A3B8] transition-colors',
            'focus:outline-hidden focus:ring-2 focus:ring-[#2563EB]/25 focus:border-[#2563EB]',
            leftIcon ? 'pl-9' : 'pl-3',
            rightIcon ? 'pr-9' : 'pr-3',
            error ? 'border-[#EF4444] focus:ring-[#EF4444]/25 focus:border-[#EF4444]' : 'border-[#CBD5E1] hover:border-[#94A3B8]',
            'disabled:bg-[#F8FAFC] disabled:text-[#94A3B8] disabled:cursor-not-allowed',
            className
          )}
          {...props}
        />

        {rightIcon && (
          <div className="absolute right-3 text-[#94A3B8] pointer-events-none flex items-center">
            {rightIcon}
          </div>
        )}
      </div>

      {error ? (
        <p className="text-xs text-[#EF4444] font-medium tracking-tight">{error}</p>
      ) : helperText ? (
        <p className="text-xs text-[#64748B]">{helperText}</p>
      ) : null}
    </div>
  )
})

Input.displayName = 'Input'
