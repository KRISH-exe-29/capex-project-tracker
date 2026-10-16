import React from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts'
import { Card, CardTitle, CardDescription } from '../../common/Card'
import { useCapex } from '../../../context/CapexContext'
import { formatINR } from '../../../utils/formatters'
import { PieChart as PieIcon, BarChart3 } from 'lucide-react'

export const FinancialCharts: React.FC = () => {
  const { projects, selectedProjectId } = useCapex()

  const relevantProjects = selectedProjectId === 'all'
    ? projects
    : projects.filter(p => p.id === selectedProjectId)

  // Data for Budget Summary Bar Chart (in Crores ₹ for readable charts)
  const budgetChartData = relevantProjects.map(p => ({
    name: p.code,
    fullName: p.name,
    approvedCr: Number((p.approvedAmount / 10000000).toFixed(2)),
    estimatedCr: Number((p.estimatedCost / 10000000).toFixed(2)),
    poValueCr: Number((p.poValue / 10000000).toFixed(2)),
    balanceCr: Number((p.balanceAmount / 10000000).toFixed(2)),
    // Raw for tooltips
    rawApproved: p.approvedAmount,
    rawEstimated: p.estimatedCost,
    rawPO: p.poValue,
    rawBalance: p.balanceAmount
  }))

  // Aggregated totals for bottom summary bar
  const totalApproved = relevantProjects.reduce((s, p) => s + p.approvedAmount, 0)
  const totalEstimated = relevantProjects.reduce((s, p) => s + p.estimatedCost, 0)
  const totalPO = relevantProjects.reduce((s, p) => s + p.poValue, 0)
  const totalBalance = totalApproved - totalPO

  // Status counts for Donut Chart
  const statusCounts = relevantProjects.reduce((acc, curr) => {
    acc[curr.status] = (acc[curr.status] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const pieData = Object.entries(statusCounts).map(([status, count]) => ({
    name: status,
    value: count
  }))

  const STATUS_COLORS: Record<string, string> = {
    Active: '#2563EB',
    Planning: '#F59E0B',
    Completed: '#10B981',
    Delayed: '#EF4444',
    'Under Review': '#8B5CF6'
  }

  // Custom Tooltip for Budget Chart
  const renderBarTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const item = budgetChartData.find(d => d.name === label)
      return (
        <div className="bg-white/95 backdrop-blur-md p-3.5 rounded-lg border border-slate-200 shadow-xl text-xs space-y-1.5 min-w-[200px]">
          <p className="font-bold text-[#0F172A] border-b border-slate-200/70 pb-1">
            {label} — {item?.fullName}
          </p>
          <div className="space-y-1 pt-0.5">
            <div className="flex justify-between items-center text-blue-700">
              <span className="font-medium">1. Approved:</span>
              <span className="font-mono font-bold">{formatINR(item?.rawApproved || 0)}</span>
            </div>
            <div className="flex justify-between items-center text-indigo-700">
              <span className="font-medium">2. Estimated:</span>
              <span className="font-mono font-bold">{formatINR(item?.rawEstimated || 0)}</span>
            </div>
            <div className="flex justify-between items-center text-amber-700">
              <span className="font-medium">3. PO Committed:</span>
              <span className="font-mono font-bold">{formatINR(item?.rawPO || 0)}</span>
            </div>
            <div className="flex justify-between items-center text-emerald-700 border-t border-slate-200/70 pt-1">
              <span className="font-medium">4. Available Balance:</span>
              <span className="font-mono font-bold">{formatINR(item?.rawBalance || 0)}</span>
            </div>
          </div>
        </div>
      )
    }
    return null
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* 1. Left Card: Budget vs PO Commitment vs Balance Summary (2 cols) */}
      <Card noPadding className="lg:col-span-2 flex flex-col justify-between">
        <div className="p-5 border-b border-slate-200/70 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-blue-600" />
              <CardTitle>Budget vs PO Commitment vs Balance Summary</CardTitle>
            </div>
            <CardDescription>
              CAPEX breakdown by project in Crores (₹ Cr). Values aggregated dynamically from WBS sub-work procurement orders.
            </CardDescription>
          </div>

          {/* Clean Manual Legend with strict ordering */}
          <div className="flex flex-wrap items-center gap-3 text-[11px] font-medium pt-1 sm:pt-0">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-xs bg-[#2563EB]" />
              <span className="text-[#334155]">Approved</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-xs bg-[#6366F1]" />
              <span className="text-[#334155]">Estimated</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-xs bg-[#F59E0B]" />
              <span className="text-[#334155]">PO Committed</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-xs bg-[#10B981]" />
              <span className="text-[#334155]">Balance</span>
            </div>
          </div>
        </div>

        {/* Chart Canvas */}
        <div className="h-64 w-full p-4">
          {budgetChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={budgetChartData}
                margin={{ top: 10, right: 20, left: 0, bottom: 5 }}
                barSize={budgetChartData.length <= 2 ? 26 : 18}
                barGap={4}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                <XAxis
                  dataKey="name"
                  stroke="#64748B"
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: '#E2E8F0' }}
                />
                <YAxis
                  stroke="#64748B"
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: '#E2E8F0' }}
                  tickFormatter={(val) => `₹${val}Cr`}
                />
                <Tooltip content={renderBarTooltip} />
                <Bar dataKey="approvedCr" name="Approved" fill="#2563EB" radius={[4, 4, 0, 0]} />
                <Bar dataKey="estimatedCr" name="Estimated" fill="#6366F1" radius={[4, 4, 0, 0]} />
                <Bar dataKey="poValueCr" name="PO Value" fill="#F59E0B" radius={[4, 4, 0, 0]} />
                <Bar dataKey="balanceCr" name="Balance" fill="#10B981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-xs text-[#94A3B8]">
              No financial data available for selected filter
            </div>
          )}
        </div>

        {/* Bottom Financial Reconciliation Ribbon */}
        <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-y sm:divide-y-0 divide-[#E2E8F0] border-t border-[#E2E8F0] bg-[#F8FAFC]/70 text-xs">
          <div className="p-3">
            <span className="text-[11px] text-[#64748B] block">Total Approved</span>
            <span className="font-mono font-bold text-[#0F172A] text-xs">
              {formatINR(totalApproved)}
            </span>
          </div>
          <div className="p-3">
            <span className="text-[11px] text-[#64748B] block">Total Estimated</span>
            <span className="font-mono font-bold text-indigo-700 text-xs">
              {formatINR(totalEstimated)}
            </span>
          </div>
          <div className="p-3">
            <span className="text-[11px] text-[#64748B] block">PO Committed</span>
            <span className="font-mono font-bold text-amber-700 text-xs">
              {formatINR(totalPO)}
            </span>
          </div>
          <div className="p-3">
            <span className="text-[11px] text-[#64748B] block">Available Buffer</span>
            <span className={`font-mono font-bold text-xs ${totalBalance < 0 ? 'text-rose-600' : 'text-emerald-700'}`}>
              {formatINR(totalBalance)}
            </span>
          </div>
        </div>
      </Card>

      {/* 2. Right Card: Portfolio Status Distribution (1 col) */}
      <Card noPadding className="flex flex-col justify-between">
        <div className="p-5 border-b border-slate-200/70">
          <div className="flex items-center gap-2">
            <PieIcon className="w-4 h-4 text-purple-600" />
            <CardTitle>Portfolio Status Distribution</CardTitle>
          </div>
          <CardDescription>
            Lifecycle breakdown across active project records
          </CardDescription>
        </div>

        {/* Donut Chart with Center Metric */}
        <div className="p-4 flex flex-col items-center justify-center">
          {pieData.length > 0 ? (
            <div className="relative w-full h-44 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={72}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={STATUS_COLORS[entry.name] || '#94A3B8'}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: any, name: any) => [`${value} Project(s)`, name]}
                    contentStyle={{ borderRadius: '6px', fontSize: '12px', borderColor: '#E2E8F0' }}
                  />
                </PieChart>
              </ResponsiveContainer>

              {/* Centered Donut Summary Count */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-2xl font-bold font-heading text-[#0F172A] leading-none">
                  {relevantProjects.length}
                </span>
                <span className="text-[10px] font-semibold text-[#64748B] uppercase tracking-wider mt-0.5">
                  {relevantProjects.length === 1 ? 'Project' : 'Projects'}
                </span>
              </div>
            </div>
          ) : (
            <div className="h-44 flex items-center justify-center text-xs text-[#94A3B8]">
              No projects recorded
            </div>
          )}
        </div>

        {/* Itemized Status Breakdown List */}
        <div className="p-4 pt-0 border-t border-slate-200/70 space-y-2.5">
          {['Active', 'Planning', 'Completed', 'Delayed'].map((statusKey) => {
            const count = statusCounts[statusKey] || 0
            const percentage = relevantProjects.length > 0
              ? Math.round((count / relevantProjects.length) * 100)
              : 0

            return (
              <div key={statusKey} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: STATUS_COLORS[statusKey] || '#94A3B8' }}
                  />
                  <span className="text-[#334155] font-medium">{statusKey}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-mono text-xs font-semibold text-[#0F172A]">
                    {count}
                  </span>
                  <span className="text-[11px] font-mono text-[#64748B] w-10 text-right">
                    {percentage}%
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </Card>
    </div>
  )
}
