import React from 'react'
import { cn } from '../../utils/cn'

export interface BadgeProps {
  children: React.ReactNode
  variant?: 
    | 'default'
    | 'success'
    | 'warning'
    | 'danger'
    | 'info'
    | 'outline'
    | 'neutral'
  className?: string
  dot?: boolean
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  className,
  dot = true
}) => {
  const variantStyles = {
    default: 'bg-blue-50 text-blue-700 border-blue-200/80',
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
    warning: 'bg-amber-50 text-amber-700 border-amber-200/80',
    danger: 'bg-rose-50 text-rose-700 border-rose-200/80',
    info: 'bg-sky-50 text-sky-700 border-sky-200/80',
    neutral: 'bg-slate-100 text-slate-700 border-slate-200',
    outline: 'bg-white text-slate-600 border-slate-300'
  }

  const dotColors = {
    default: 'bg-blue-500',
    success: 'bg-[#10B981]',
    warning: 'bg-[#F59E0B]',
    danger: 'bg-[#EF4444]',
    info: 'bg-sky-500',
    neutral: 'bg-slate-400',
    outline: 'bg-slate-400'
  }

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border tracking-tight shrink-0',
        variantStyles[variant],
        className
      )}
    >
      {dot && (
        <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', dotColors[variant])} />
      )}
      {children}
    </span>
  )
}

/**
 * Helper to auto-map common CAPEX status strings to Badge variants
 */
export const StatusBadge: React.FC<{ status: string; className?: string }> = ({ status, className }) => {
  const s = status.toLowerCase()
  let variant: BadgeProps['variant'] = 'default'

  if (s.includes('active') || s.includes('approved') || s.includes('completed') || s.includes('paid')) {
    variant = 'success'
  } else if (s.includes('progress') || s.includes('execution') || s.includes('review') || s.includes('planning')) {
    variant = 'warning'
  } else if (s.includes('delayed') || s.includes('blocked') || s.includes('cancelled') || s.includes('danger')) {
    variant = 'danger'
  } else if (s.includes('billed') || s.includes('issued') || s.includes('verified')) {
    variant = 'info'
  } else {
    variant = 'neutral'
  }

  return <Badge variant={variant} className={className}>{status}</Badge>
}
