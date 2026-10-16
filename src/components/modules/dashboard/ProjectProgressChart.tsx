import React from 'react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts'
import { Card, CardHeader, CardTitle, CardDescription } from '../../common/Card'
import { useCapex } from '../../../context/CapexContext'
import { TrendingUp, Layers, CheckCircle2, ShieldCheck, ArrowUpRight } from 'lucide-react'

export const ProjectProgressChart: React.FC = () => {
  const { filteredMilestones, filteredTasks } = useCapex()

  // Trend / Incurrence forecast data
  const trendData = [
    { month: 'Jan 26', plannedCr: 2.5, actualCr: 2.1 },
    { month: 'Feb 26', plannedCr: 5.2, actualCr: 4.8 },
    { month: 'Mar 26', plannedCr: 8.9, actualCr: 8.5 },
    { month: 'Apr 26', plannedCr: 13.4, actualCr: 12.0 },
    { month: 'May 26', plannedCr: 18.0, actualCr: 16.5 },
    { month: 'Jun 26', plannedCr: 23.5, actualCr: 21.2 },
    { month: 'Jul 26', plannedCr: 29.0, actualCr: null },
    { month: 'Aug 26', plannedCr: 34.5, actualCr: null },
    { month: 'Sep 26', plannedCr: 41.0, actualCr: null },
    { month: 'Oct 26', plannedCr: 48.0, actualCr: null }
  ]

  // Milestone Progress breakdown
  const milestoneCompletionRate = filteredMilestones.length > 0
    ? Math.round(
        filteredMilestones.reduce((acc, m) => acc + m.progress, 0) /
          filteredMilestones.length
      )
    : 0

  // Task Progress breakdown
  const taskCompletionRate = filteredTasks.length > 0
    ? Math.round(
        filteredTasks.reduce((acc, t) => acc + t.progress, 0) /
          filteredTasks.length
      )
    : 0

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* CAPEX Cash Outflow & Incurrence Trend (2 cols) */}
      <Card noPadding className="lg:col-span-2 flex flex-col justify-between">
        <div className="p-5 border-b border-[#F1F5F9] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-600" />
              <CardTitle>Cumulative CAPEX Cash Outflow Trend & S-Curve</CardTitle>
            </div>
            <CardDescription>
              Planned expenditure baseline vs actual cash drawdowns in ₹ Crores
            </CardDescription>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1.5 font-medium text-[#64748B]">
              <span className="w-3 h-0.5 bg-[#94A3B8] inline-block border-b border-dashed" /> Planned
            </span>
            <span className="flex items-center gap-1.5 font-medium text-blue-700">
              <span className="w-3 h-1 bg-[#2563EB] rounded-full inline-block" /> Actual Drawn
            </span>
          </div>
        </div>

        <div className="h-64 w-full p-4">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={trendData}
              margin={{ top: 10, right: 20, left: 0, bottom: 5 }}
            >
              <defs>
                <linearGradient id="colorPlanned" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#94A3B8" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#94A3B8" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563EB" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#2563EB" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
              <XAxis dataKey="month" stroke="#64748B" fontSize={11} tickLine={false} />
              <YAxis
                stroke="#64748B"
                fontSize={11}
                tickLine={false}
                axisLine={{ stroke: '#E2E8F0' }}
                tickFormatter={(val) => `₹${val}Cr`}
              />
              <Tooltip
                formatter={(val: any, name: any) => [`₹ ${val} Cr`, name === 'plannedCr' ? 'Planned Baseline' : 'Actual Incurred']}
                contentStyle={{ borderRadius: '6px', fontSize: '12px', borderColor: '#E2E8F0', boxShadow: '0 4px 12px rgba(0,0,0,0.06)' }}
              />
              <Area
                type="monotone"
                dataKey="plannedCr"
                stroke="#94A3B8"
                strokeDasharray="4 4"
                fillOpacity={1}
                fill="url(#colorPlanned)"
                strokeWidth={2}
                name="plannedCr"
              />
              <Area
                type="monotone"
                dataKey="actualCr"
                stroke="#2563EB"
                fillOpacity={1}
                fill="url(#colorActual)"
                strokeWidth={2.5}
                name="actualCr"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Bottom S-Curve variance note */}
        <div className="px-5 py-3 border-t border-[#E2E8F0] bg-[#F8FAFC]/70 flex items-center justify-between text-xs text-[#64748B]">
          <span>Cash outflow variance is within authorized $\pm 5\%$ tolerance band.</span>
          <span className="font-semibold text-emerald-700">Audit Status: Cleared</span>
        </div>
      </Card>

      {/* Progress Execution Gauges (1 col) */}
      <Card noPadding className="flex flex-col justify-between">
        <div className="p-5 border-b border-[#F1F5F9]">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-emerald-600" />
            <CardTitle>Execution Progress Metrics</CardTitle>
          </div>
          <CardDescription>
            Aggregated delivery completion index
          </CardDescription>
        </div>

        <div className="p-5 space-y-5">
          {/* Milestone Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold text-[#0F172A]">Milestone Completion</span>
              <span className="font-mono font-bold text-blue-600">{milestoneCompletionRate}%</span>
            </div>
            <div className="w-full bg-[#E2E8F0] h-2.5 rounded-full overflow-hidden">
              <div
                className="bg-blue-600 h-full rounded-full transition-all duration-500"
                style={{ width: `${milestoneCompletionRate}%` }}
              />
            </div>
            <p className="text-[11px] text-[#64748B]">
              {filteredMilestones.filter(m => m.status === 'Completed').length} of {filteredMilestones.length} milestones marked completed
            </p>
          </div>

          {/* Task Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold text-[#0F172A]">Task Execution Index</span>
              <span className="font-mono font-bold text-emerald-600">{taskCompletionRate}%</span>
            </div>
            <div className="w-full bg-[#E2E8F0] h-2.5 rounded-full overflow-hidden">
              <div
                className="bg-[#10B981] h-full rounded-full transition-all duration-500"
                style={{ width: `${taskCompletionRate}%` }}
              />
            </div>
            <p className="text-[11px] text-[#64748B]">
              {filteredTasks.filter(t => t.status === 'Completed').length} of {filteredTasks.length} tasks closed
            </p>
          </div>
        </div>

        {/* Quality & Safety indicator badge */}
        <div className="p-4 border-t border-[#F1F5F9] bg-emerald-50/60">
          <div className="flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-emerald-950">Zero Critical Non-Conformances</p>
              <p className="text-[11px] text-emerald-800 mt-0.5">
                All daily progress reports (DPRs) verified by lead consultants.
              </p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}
