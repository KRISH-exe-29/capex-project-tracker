import React, { useMemo } from 'react'
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { TrendingUp, Layers } from 'lucide-react'
import { Card, CardDescription, CardTitle } from '../../common/Card'
import { useCapex } from '../../../context/CapexContext'
import { formatINR } from '../../../utils/formatters'

const monthKey = (iso: string) => iso.slice(0, 7)
const monthLabel = (key: string) =>
  new Date(`${key}-01T00:00:00`).toLocaleString('en-IN', { month: 'short', year: '2-digit' })

/**
 * Cumulative PO commitments (by PO target date) against cumulative payments (by paid date).
 * Built only from recorded POs; nothing is estimated.
 */
export const ProjectProgressChart: React.FC = () => {
  const { filteredSubWorks, filteredTasks } = useCapex()

  const trend = useMemo(() => {
    const live = filteredSubWorks.filter(po => po.status !== 'Cancelled')
    const committedByMonth = new Map<string, number>()
    const paidByMonth = new Map<string, number>()
    live.forEach(po => {
      if (po.targetDate) {
        const key = monthKey(po.targetDate)
        committedByMonth.set(key, (committedByMonth.get(key) ?? 0) + po.poValueGst)
      }
      if (po.status === 'Paid' && po.paidDate) {
        const key = monthKey(po.paidDate)
        paidByMonth.set(key, (paidByMonth.get(key) ?? 0) + po.poValueGst)
      }
    })
    const months = [...new Set([...committedByMonth.keys(), ...paidByMonth.keys()])].sort()
    let committed = 0
    let paid = 0
    return months.map(key => {
      committed += committedByMonth.get(key) ?? 0
      paid += paidByMonth.get(key) ?? 0
      return { month: monthLabel(key), committed, paid }
    })
  }, [filteredSubWorks])

  const taskProgress = filteredTasks.length
    ? Math.round(filteredTasks.reduce((sum, task) => sum + (task.progress || 0), 0) / filteredTasks.length)
    : 0
  const completedTasks = filteredTasks.filter(task => task.status === 'Completed').length
  const blockedTasks = filteredTasks.filter(task => task.status === 'Blocked').length

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <Card noPadding className="flex flex-col lg:col-span-2">
        <div className="flex flex-col gap-2 border-b border-slate-200/70 p-5 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-blue-600" />
              <CardTitle>Commitments and payments over time</CardTitle>
            </div>
            <CardDescription>Cumulative PO value by target date, and cumulative payments by paid date.</CardDescription>
          </div>
          <div className="flex items-center gap-4 text-xs text-slate-500">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm bg-blue-600" /> PO committed
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm bg-emerald-500" /> Paid
            </span>
          </div>
        </div>

        {trend.length === 0 ? (
          <div className="flex h-64 items-center justify-center p-6 text-center text-sm text-slate-500">
            The trend appears once POs with target or paid dates are recorded.
          </div>
        ) : (
          <div className="h-64 w-full p-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trend} margin={{ top: 10, right: 16, left: 8, bottom: 0 }}>
                <defs>
                  <linearGradient id="fillCommitted" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563EB" stopOpacity={0.28} />
                    <stop offset="95%" stopColor="#2563EB" stopOpacity={0.02} />
                  </linearGradient>
                  <linearGradient id="fillPaid" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                <XAxis dataKey="month" stroke="#64748B" fontSize={11} tickLine={false} />
                <YAxis
                  stroke="#64748B"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  width={72}
                  tickFormatter={value => formatINR(Number(value), true)}
                />
                <Tooltip
                  formatter={(value, name) => [formatINR(Number(value)), name === 'committed' ? 'PO committed' : 'Paid']}
                  contentStyle={{ borderRadius: 8, fontSize: 12, borderColor: '#E2E8F0' }}
                />
                <Area type="monotone" dataKey="committed" stroke="#2563EB" strokeWidth={2} fill="url(#fillCommitted)" />
                <Area type="monotone" dataKey="paid" stroke="#10B981" strokeWidth={2} fill="url(#fillPaid)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </Card>

      <Card noPadding className="flex flex-col">
        <div className="border-b border-slate-200/70 p-5">
          <div className="flex items-center gap-2">
            <Layers className="h-4 w-4 text-emerald-600" />
            <CardTitle>Work package progress</CardTitle>
          </div>
          <CardDescription>Average progress reported on work packages.</CardDescription>
        </div>
        <div className="space-y-5 p-5">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-slate-800">Average progress</span>
              <span className="mono-num font-semibold text-blue-700">{taskProgress}%</span>
            </div>
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-200/80">
              <div className="h-full rounded-full bg-blue-600 transition-all" style={{ width: `${taskProgress}%` }} />
            </div>
          </div>
          <dl className="grid grid-cols-3 gap-3 text-center">
            <div className="rounded-lg bg-slate-50/80 p-3">
              <dt className="text-[11px] text-slate-500">Total</dt>
              <dd className="mono-num text-lg font-semibold text-slate-900">{filteredTasks.length}</dd>
            </div>
            <div className="rounded-lg bg-emerald-50/80 p-3">
              <dt className="text-[11px] text-emerald-700">Completed</dt>
              <dd className="mono-num text-lg font-semibold text-emerald-800">{completedTasks}</dd>
            </div>
            <div className="rounded-lg bg-rose-50/80 p-3">
              <dt className="text-[11px] text-rose-700">Blocked</dt>
              <dd className="mono-num text-lg font-semibold text-rose-800">{blockedTasks}</dd>
            </div>
          </dl>
        </div>
      </Card>
    </div>
  )
}
