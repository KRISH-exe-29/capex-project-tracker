import React, { useState, useMemo } from 'react'
import {
  Wallet,
  AlertTriangle,
  TrendingUp,
  Download,
  Building2,
  ChevronDown,
  ChevronRight,
  ShieldCheck,
  Coins,
  Receipt,
  Scale
} from 'lucide-react'
import { Card } from '../../common/Card'
import { Button } from '../../common/Button'
import { StatusBadge } from '../../common/Badge'
import { useCapex } from '../../../context/CapexContext'
import { formatINR, formatDate } from '../../../utils/formatters'

export const BudgetView: React.FC = () => {
  const { projects, phases, parts, sections, subWorks, selectedProjectId, addToast } = useCapex()
  const [expandedProjects, setExpandedProjects] = useState<Record<string, boolean>>({
    'proj-500': true,
    'proj-001': true,
    'proj-002': true
  })

  const toggleProject = (id: string) => {
    setExpandedProjects(prev => ({ ...prev, [id]: !prev[id] }))
  }

  const relevantProjects = useMemo(() => {
    return selectedProjectId === 'all'
      ? projects
      : projects.filter(p => p.id === selectedProjectId)
  }, [projects, selectedProjectId])

  // Portfolio Totals
  const totalApproved = relevantProjects.reduce((s, p) => s + p.approvedAmount, 0)
  const totalEstimated = relevantProjects.reduce((s, p) => s + p.estimatedCost, 0)
  const totalPO = relevantProjects.reduce((s, p) => s + p.poValue, 0)
  const totalBalance = totalApproved - totalPO
  const totalBudgetVariance = totalEstimated - totalApproved

  const handleExportFinance = () => {
    addToast('CAPEX Budget Variance & Reconciliation Sheet exported to CSV.', 'success')
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-200">
              <Wallet className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-[#0F172A] font-heading tracking-tight">
                Finance — Capital Budget & Cost Variance Tracking
              </h2>
              <p className="text-xs text-[#64748B] mt-0.5">
                Explicit budget reconciliation adhering to statutory variance formulas with parent-level sub-work PO aggregation.
              </p>
            </div>
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={handleExportFinance}
          leftIcon={<Download className="w-3.5 h-3.5 text-[#2563EB]" />}
        >
          Export Financial Report
        </Button>
      </div>

      {/* Summary KPI Cards - Pure Black Values, No Icons, No Subtitles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Approved CAPEX */}
        <div className="bg-white p-5 rounded-[8px] border border-[#E2E8F0] shadow-xs">
          <span className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider block">
            Total Approved CAPEX
          </span>
          <h3 className="text-2xl font-bold font-mono text-black mt-2 tracking-tight">
            {formatINR(totalApproved)}
          </h3>
        </div>

        {/* KPI 2: Total Estimated Cost */}
        <div className="bg-white p-5 rounded-[8px] border border-[#E2E8F0] shadow-xs">
          <span className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider block">
            Total Estimated Cost
          </span>
          <h3 className="text-2xl font-bold font-mono text-black mt-2 tracking-tight">
            {formatINR(totalEstimated)}
          </h3>
        </div>

        {/* KPI 3: Committed PO Value */}
        <div className="bg-white p-5 rounded-[8px] border border-[#E2E8F0] shadow-xs">
          <span className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider block">
            Committed PO Value
          </span>
          <h3 className="text-2xl font-bold font-mono text-black mt-2 tracking-tight">
            {formatINR(totalPO)}
          </h3>
        </div>

        {/* KPI 4: Available Balance */}
        <div className="bg-white p-5 rounded-[8px] border border-[#E2E8F0] shadow-xs">
          <span className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider block">
            Available Balance
          </span>
          <h3 className="text-2xl font-bold font-mono text-black mt-2 tracking-tight">
            {formatINR(totalBalance)}
          </h3>
        </div>
      </div>

      {/* Project Financial Breakdown Tables */}
      <div className="space-y-4">
        {relevantProjects.map(proj => {
          const projPhases = phases.filter(ph => ph.projectId === proj.id)
          const projSubworks = subWorks.filter(sw => sw.projectId === proj.id)
          const budgetVariance = proj.estimatedCost - proj.approvedAmount
          const poVariance = proj.poValue - proj.approvedAmount
          const hasBudgetOverrun = budgetVariance > 0
          const hasPoOverrun = poVariance > 0
          const isExpanded = expandedProjects[proj.id] ?? true

          return (
            <div key={proj.id} className="bg-white rounded-[10px] border border-[#E2E8F0] shadow-xs overflow-hidden">
              {/* Project Card Header */}
              <div className="p-4 bg-[#F8FAFC] border-b border-[#E2E8F0] flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => toggleProject(proj.id)}
                    className="p-1.5 rounded-[6px] hover:bg-slate-200 text-[#475569] transition-colors cursor-pointer"
                    title={isExpanded ? 'Collapse project details' : 'Expand project details'}
                  >
                    {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                  </button>

                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-[4px] border border-blue-200/60">
                      {proj.code}
                    </span>
                    <h3 className="text-sm font-bold text-[#0F172A] font-heading">
                      {proj.name}
                    </h3>
                    <StatusBadge status={proj.status} />
                  </div>
                </div>

                <div className="flex items-center gap-3 text-xs text-[#64748B]">
                  <span>
                    Timeline: <strong className="text-[#0F172A]">{proj.executionTimeline}</strong> ({formatDate(proj.startDate || proj.approvedDate)} → {formatDate(proj.endDate)})
                  </span>
                </div>
              </div>

              {/* Overrun Warning Banner if applicable */}
              {(hasBudgetOverrun || hasPoOverrun) && (
                <div className="px-4 py-2.5 bg-rose-50/80 border-b border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>
                    {hasBudgetOverrun && hasPoOverrun
                      ? 'CRITICAL WARNING: Estimated Cost and PO Commitment both exceed Approved Budget Ceiling!'
                      : hasBudgetOverrun
                      ? `Budget Variance Alert: Estimated Cost exceeds Approved Amount by ${formatINR(budgetVariance)}`
                      : `Commitment Variance Alert: PO Value exceeds Approved Amount by ${formatINR(poVariance)}`}
                  </span>
                </div>
              )}

              {/* Project Financial Summary Bar with clean aligned cards */}
              <div className="grid grid-cols-2 sm:grid-cols-5 divide-x divide-y sm:divide-y-0 divide-[#E2E8F0] bg-white text-xs border-b border-[#E2E8F0]">
                <div className="p-3.5">
                  <span className="text-[#64748B] text-[11px] font-medium block">Approved Amount</span>
                  <span className="font-mono font-bold text-[#0F172A] text-sm mt-0.5 block">
                    {formatINR(proj.approvedAmount)}
                  </span>
                </div>

                <div className="p-3.5">
                  <span className="text-[#64748B] text-[11px] font-medium block">Estimated Cost</span>
                  <span className="font-mono font-bold text-indigo-700 text-sm mt-0.5 block">
                    {formatINR(proj.estimatedCost)}
                  </span>
                </div>

                <div className="p-3.5">
                  <span className="text-[#64748B] text-[11px] font-medium block">Total PO Value</span>
                  <span className="font-mono font-bold text-amber-700 text-sm mt-0.5 block">
                    {formatINR(proj.poValue)}
                  </span>
                </div>

                <div className="p-3.5">
                  <span className="text-[#64748B] text-[11px] font-medium block">Balance Amount</span>
                  <span className={`font-mono font-bold text-sm mt-0.5 block ${proj.balanceAmount < 0 ? 'text-rose-600' : 'text-emerald-700'}`}>
                    {formatINR(proj.balanceAmount)}
                  </span>
                </div>

                <div className="p-3.5 col-span-2 sm:col-span-1">
                  <span className="text-[#64748B] text-[11px] font-medium block">Budget Variance</span>
                  <span className={`font-mono font-bold text-sm mt-0.5 block ${budgetVariance > 0 ? 'text-rose-600' : 'text-emerald-700'}`}>
                    {budgetVariance > 0 ? `+${formatINR(budgetVariance)}` : formatINR(budgetVariance)}
                  </span>
                </div>
              </div>

              {/* Phase & Part Budget Allocation Breakdown */}
              {isExpanded && projPhases.length > 0 && (
                <div className="border-b border-[#E2E8F0] p-4 bg-slate-50/40">
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-semibold text-[#0F172A] text-xs uppercase tracking-wider flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                      Phase &amp; Part Capital Allocation Breakdown
                    </span>
                    <span className="text-[11px] text-[#64748B]">
                      Overall Approved Budget Ceiling: <strong className="font-mono text-[#0F172A]">{formatINR(proj.approvedAmount)}</strong>
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {projPhases.map(ph => {
                      const phParts = parts.filter(pt => pt.phaseId === ph.id)
                      const phPct = Math.round((ph.budgetAmount / proj.approvedAmount) * 100)

                      return (
                        <div key={ph.id} className="bg-white p-3.5 rounded-[8px] border border-purple-200 shadow-xs">
                          <div className="flex items-center justify-between pb-2 border-b border-purple-100">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-[11px] font-bold px-1.5 py-0.5 rounded-sm bg-purple-100 text-purple-800">
                                {ph.wbsNumber}
                              </span>
                              <span className="font-bold text-xs text-[#0F172A]">{ph.name}</span>
                            </div>
                            <span className="font-mono font-bold text-xs text-purple-800">
                              {formatINR(ph.budgetAmount)} <span className="text-[10px] text-[#64748B] font-normal">({phPct}%)</span>
                            </span>
                          </div>

                          <div className="mt-2 text-[11px] text-[#64748B]">
                            CAPEX Approval Date: <strong className="text-[#0F172A]">{formatDate(ph.capexApprovalDate)}</strong>
                          </div>

                          {phParts.length > 0 && (
                            <div className="mt-3 space-y-2">
                              <span className="text-[10px] font-semibold text-[#64748B] uppercase tracking-wider block">
                                Parts Allocation:
                              </span>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {phParts.map(pt => {
                                  const ptSections = sections.filter(s => s.partId === pt.id)
                                  return (
                                    <div key={pt.id} className="bg-sky-50/50 p-2.5 rounded-[6px] border border-sky-200/80">
                                      <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-1.5">
                                          <span className="font-mono text-[10px] font-bold px-1 py-0.2 bg-sky-100 text-sky-800 rounded-xs">
                                            {pt.wbsNumber}
                                          </span>
                                          <span className="font-semibold text-[11px] text-[#0F172A]">{pt.name}</span>
                                        </div>
                                        <span className="font-mono font-bold text-[11px] text-sky-800">
                                          {formatINR(pt.budgetAmount)}
                                        </span>
                                      </div>

                                      {ptSections.length > 0 && (
                                        <div className="flex items-center gap-1 mt-1.5 flex-wrap">
                                          {ptSections.map(s => (
                                            <span key={s.id} className="text-[10px] bg-white px-1.5 py-0.5 rounded-xs border border-slate-200 text-[#334155]">
                                              {s.name}
                                            </span>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  )
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Sub-work Table (Level 5 Breakdown) */}
              {isExpanded && (
                <div>
                  <div className="bg-[#F8FAFC] px-4 py-2.5 border-b border-[#E2E8F0] flex items-center justify-between text-xs">
                    <span className="font-semibold text-[#475569] uppercase tracking-wider text-[11px]">
                      Sub-work PO Orders Feeding Project PO Commitment ({projSubworks.length})
                    </span>
                    <span className="text-[#64748B] font-mono text-[11px]">
                      Sub-total: <strong className="text-[#0F172A]">{formatINR(proj.poValue)}</strong>
                    </span>
                  </div>

                  {projSubworks.length === 0 ? (
                    <div className="p-4 text-center text-xs text-[#94A3B8] italic">
                      No purchase orders recorded for this project yet. Add sub-work items in Planning to track PO commitments.
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="bg-white border-b border-[#F1F5F9] text-[10px] font-semibold text-[#64748B] uppercase tracking-wider">
                            <th className="py-2.5 px-4">WBS / Work Description</th>
                            <th className="py-2.5 px-3">Supplier Name</th>
                            <th className="py-2.5 px-3">BP Code</th>
                            <th className="py-2.5 px-3">PO Number</th>
                            <th className="py-2.5 px-3 text-right">PO Value + GST</th>
                            <th className="py-2.5 px-3">Target Date</th>
                            <th className="py-2.5 px-3">Paid Date</th>
                            <th className="py-2.5 px-3 text-center">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#F1F5F9]">
                          {projSubworks.map(sw => (
                            <tr key={sw.id} className="hover:bg-[#F8FAFC] transition-colors">
                              <td className="py-2.5 px-4 max-w-xs">
                                <div className="flex items-center gap-1.5">
                                  <span className="font-mono text-[10px] font-bold text-amber-900 bg-amber-50 px-1 py-0.5 rounded-xs border border-amber-200/60">
                                    {sw.wbsNumber}
                                  </span>
                                  <span className="font-medium text-[#0F172A] truncate">
                                    {sw.workDescription}
                                  </span>
                                </div>
                              </td>

                              <td className="py-2.5 px-3 text-[#334155]">{sw.supplierName}</td>
                              <td className="py-2.5 px-3 font-mono text-[#64748B]">{sw.bpCode}</td>
                              <td className="py-2.5 px-3 font-mono text-blue-600 font-medium">{sw.poNumber}</td>
                              <td className="py-2.5 px-3 text-right font-mono font-bold text-[#0F172A]">
                                {formatINR(sw.poValueGst)}
                              </td>
                              <td className="py-2.5 px-3 text-[#64748B]">{formatDate(sw.targetDate)}</td>
                              <td className="py-2.5 px-3 text-[#64748B]">
                                {sw.paidDate ? (
                                  <span className="text-emerald-700 font-medium">{formatDate(sw.paidDate)}</span>
                                ) : (
                                  <span className="text-slate-400 italic">Unpaid</span>
                                )}
                              </td>
                              <td className="py-2.5 px-3 text-center">
                                <StatusBadge status={sw.status} className="text-[10px] px-1.5 py-0" />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
