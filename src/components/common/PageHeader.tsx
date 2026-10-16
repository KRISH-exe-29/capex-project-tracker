import React from 'react'

export interface PageHeaderProps {
  title: string
  description: string
  /** Small label above the title, e.g. the sidebar group the page lives in. */
  eyebrow?: string
  actions?: React.ReactNode
  /** Optional KPI row rendered under the title. */
  stats?: React.ReactNode
}

export const PageHeader: React.FC<PageHeaderProps> = ({ title, description, eyebrow, actions, stats }) => {
  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          {eyebrow && (
            <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">{eyebrow}</p>
          )}
          <h1 className="font-heading text-2xl font-bold tracking-tight text-slate-900">{title}</h1>
          <p className="mt-1 max-w-3xl text-sm text-slate-500">{description}</p>
        </div>
        {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
      </div>
      {stats}
    </div>
  )
}

export interface StatCardProps {
  label: string
  value: React.ReactNode
  hint?: React.ReactNode
  icon?: React.ReactNode
  tone?: 'default' | 'success' | 'warning' | 'danger'
}

const TONES: Record<NonNullable<StatCardProps['tone']>, string> = {
  default: 'bg-blue-50 text-blue-600',
  success: 'bg-emerald-50 text-emerald-600',
  warning: 'bg-amber-50 text-amber-600',
  danger: 'bg-rose-50 text-rose-600'
}

/** KPI tile: equal height in a grid, label on top, value in mono. */
export const StatCard: React.FC<StatCardProps> = ({ label, value, hint, icon, tone = 'default' }) => {
  return (
    <div className="glass flex h-full min-w-0 items-start justify-between gap-3 rounded-xl p-3.5 sm:p-4">
      <div className="min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-slate-500">{label}</p>
        <p className="mt-1.5 truncate font-heading text-xl font-semibold sm:text-2xl tabular-nums tracking-tight text-slate-900">{value}</p>
        {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
      </div>
      {icon && (
        <span className={`hidden h-9 w-9 sm:flex shrink-0 items-center justify-center rounded-lg ${TONES[tone]}`}>{icon}</span>
      )}
    </div>
  )
}

export const StatGrid: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">{children}</div>
)
