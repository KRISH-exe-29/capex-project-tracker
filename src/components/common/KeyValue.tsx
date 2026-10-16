import React from 'react'
import { cn } from '../../utils/cn'

/** One label/value row in a summary list; the value is right-aligned in the number font. */
export const KeyValue: React.FC<{
  label: React.ReactNode
  value: React.ReactNode
  className?: string
  valueClass?: string
  mono?: boolean
}> = ({ label, value, className, valueClass = 'text-slate-900', mono = true }) => (
  <div className={cn('flex items-baseline justify-between gap-6', className)}>
    <dt className="text-slate-500">{label}</dt>
    <dd className={cn('text-right', mono && 'mono-num', valueClass)}>{value}</dd>
  </div>
)
