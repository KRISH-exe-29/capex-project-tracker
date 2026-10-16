import React from 'react'
import { cn } from '../../utils/cn'

export type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info' | 'outline' | 'neutral' | 'violet'

export interface BadgeProps {
  children: React.ReactNode
  variant?: BadgeVariant
  className?: string
  dot?: boolean
}

const VARIANT_STYLES: Record<BadgeVariant, string> = {
  default: 'bg-blue-50/90 text-blue-700 ring-blue-600/15',
  success: 'bg-emerald-50/90 text-emerald-700 ring-emerald-600/20',
  warning: 'bg-amber-50/90 text-amber-800 ring-amber-600/20',
  danger: 'bg-rose-50/90 text-rose-700 ring-rose-600/20',
  info: 'bg-sky-50/90 text-sky-700 ring-sky-600/20',
  violet: 'bg-violet-50/90 text-violet-700 ring-violet-600/20',
  neutral: 'bg-slate-100/90 text-slate-700 ring-slate-500/15',
  outline: 'bg-white/80 text-slate-600 ring-slate-300'
}

const DOT_STYLES: Record<BadgeVariant, string> = {
  default: 'bg-blue-500',
  success: 'bg-emerald-500',
  warning: 'bg-amber-500',
  danger: 'bg-rose-500',
  info: 'bg-sky-500',
  violet: 'bg-violet-500',
  neutral: 'bg-slate-400',
  outline: 'bg-slate-400'
}

export const Badge: React.FC<BadgeProps> = ({ children, variant = 'default', className, dot = true }) => {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap ring-1 ring-inset shrink-0',
        VARIANT_STYLES[variant],
        className
      )}
    >
      {dot && <span className={cn('h-1.5 w-1.5 shrink-0 rounded-full', DOT_STYLES[variant])} />}
      {children}
    </span>
  )
}

/** Every status, severity and action label used in the app, mapped to one colour. */
const STATUS_VARIANTS: Record<string, BadgeVariant> = {
  // Project
  planning: 'neutral',
  approved: 'success',
  active: 'default',
  'under review': 'warning',
  completed: 'success',
  delayed: 'danger',
  // Milestone / task
  'not started': 'neutral',
  'in progress': 'default',
  pending: 'warning',
  blocked: 'danger',
  // PO
  'po issued': 'info',
  'in execution': 'default',
  billed: 'violet',
  paid: 'success',
  cancelled: 'neutral',
  // PR and revisions
  'pending approval': 'warning',
  rejected: 'danger',
  'converted to po': 'info',
  // DPR / documents / users
  submitted: 'info',
  verified: 'violet',
  draft: 'neutral',
  'on leave': 'warning',
  inactive: 'neutral',
  // Exception severity
  'audit risk': 'danger',
  'control gap': 'warning',
  'data quality': 'neutral',
  // Activity log actions
  create: 'info',
  update: 'neutral',
  delete: 'danger',
  approve: 'success',
  reject: 'danger',
  request: 'warning'
}

export function statusVariant(status: string): BadgeVariant {
  return STATUS_VARIANTS[status.trim().toLowerCase()] ?? 'neutral'
}

export const StatusBadge: React.FC<{ status: string; className?: string }> = ({ status, className }) => {
  return (
    <Badge variant={statusVariant(status)} className={className}>
      {status}
    </Badge>
  )
}
