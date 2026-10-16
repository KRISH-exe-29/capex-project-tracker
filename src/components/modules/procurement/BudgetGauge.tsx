import React from 'react'
import { formatINR } from '../../../utils/formatters'
import { cn } from '../../../utils/cn'
import { KeyValue } from '../../common/KeyValue'

interface BudgetGaugeProps {
  budget: number
  committed: number
  openPr: number
  /** Amount being requested right now (new PR or PO). */
  request?: number
  requestLabel?: string
}

/**
 * Stacked bar of a work package's ceiling: POs committed, open PRs, the current request, and what is left.
 * The black tick marks the ceiling; anything to its right is over budget.
 */
export const BudgetGauge: React.FC<BudgetGaugeProps> = ({
  budget,
  committed,
  openPr,
  request = 0,
  requestLabel = 'This request'
}) => {
  const available = budget - committed - openPr
  const after = available - request
  const total = Math.max(budget, committed + openPr + request, 1)
  const pct = (value: number) => `${Math.max(0, (value / total) * 100)}%`
  const over = after < 0

  return (
    <div className="space-y-3">
      <div className="relative pt-1">
        <div className="flex h-3 w-full overflow-hidden rounded-full bg-slate-200/80">
          <div className="h-full bg-blue-600" style={{ width: pct(committed) }} />
          <div className="h-full bg-sky-400" style={{ width: pct(openPr) }} />
          <div className={cn('h-full', over ? 'bg-rose-500' : 'bg-emerald-500')} style={{ width: pct(request) }} />
        </div>
        <div
          className="absolute top-0 bottom-[-4px] w-0.5 rounded bg-slate-900"
          style={{ left: `calc(${pct(budget)} - 1px)` }}
          title={`Ceiling ${formatINR(budget)}`}
        />
      </div>

      <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-slate-500">
        <Legend className="bg-blue-600" label="PO committed" />
        <Legend className="bg-sky-400" label="Open PRs" />
        <Legend className={over ? 'bg-rose-500' : 'bg-emerald-500'} label={requestLabel} />
        <span className="inline-flex items-center gap-1.5">
          <span className="h-3 w-0.5 rounded bg-slate-900" />
          Ceiling
        </span>
      </div>

      <dl className="space-y-1.5 text-sm">
        <KeyValue label="Budget (ceiling)" value={formatINR(budget)} />
        <KeyValue label="PO committed" value={`− ${formatINR(committed)}`} />
        <KeyValue label="Open PRs" value={`− ${formatINR(openPr)}`} />
        <KeyValue
          label="Available"
          value={formatINR(available)}
          className="border-t border-slate-200 pt-1.5 font-semibold text-slate-900"
          valueClass={available < 0 ? 'text-rose-600' : 'text-slate-900'}
        />
        {request > 0 && (
          <KeyValue
            label={`After ${requestLabel.replace(/^This /, 'this ')}`}
            value={formatINR(after)}
            className="font-semibold"
            valueClass={over ? 'text-rose-600' : 'text-emerald-700'}
          />
        )}
      </dl>
    </div>
  )
}

const Legend: React.FC<{ className: string; label: string }> = ({ className, label }) => (
  <span className="inline-flex items-center gap-1.5">
    <span className={cn('h-2.5 w-2.5 rounded-sm', className)} />
    {label}
  </span>
)
