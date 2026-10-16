import React, { ButtonHTMLAttributes, forwardRef } from 'react'
import { cn } from '../../utils/cn'
import { Loader2 } from 'lucide-react'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  isLoading?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(({
  className,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  children,
  disabled,
  ...props
}, ref) => {
  const baseStyles = 'inline-flex items-center justify-center font-medium transition-all duration-150 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-offset-1 select-none disabled:opacity-50 disabled:pointer-events-none active:scale-[0.99] cursor-pointer'

  const variants = {
    primary: 'bg-[#2563EB] hover:bg-[#1D4ED8] text-white shadow-xs focus:ring-[#2563EB]/40 border border-[#1D4ED8]',
    secondary: 'bg-[#F1F5F9] hover:bg-[#E2E8F0] text-[#0F172A] border border-[#CBD5E1] focus:ring-[#64748B]/30',
    outline: 'bg-white hover:bg-[#F8FAFC] text-[#0F172A] border border-[#E2E8F0] shadow-xs focus:ring-[#2563EB]/30',
    ghost: 'hover:bg-[#F1F5F9] text-[#475569] hover:text-[#0F172A] focus:ring-[#64748B]/20',
    danger: 'bg-[#EF4444] hover:bg-[#DC2626] text-white shadow-xs focus:ring-[#EF4444]/40 border border-[#DC2626]'
  }

  // 40px standard button height for 'md'
  const sizes = {
    sm: 'h-8 px-3 text-xs gap-1.5',
    md: 'h-10 px-4 text-sm gap-2',
    lg: 'h-11 px-5 text-base gap-2.5'
  }

  return (
    <button
      ref={ref}
      disabled={disabled || isLoading}
      className={cn(baseStyles, variants[variant], sizes[size], className)}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin shrink-0 text-current" />
      ) : leftIcon ? (
        <span className="shrink-0">{leftIcon}</span>
      ) : null}
      
      {children}

      {!isLoading && rightIcon && (
        <span className="shrink-0">{rightIcon}</span>
      )}
    </button>
  )
})

Button.displayName = 'Button'
