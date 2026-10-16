import React, { useMemo } from 'react'
import { AlertTriangle, Download, Wallet } from 'lucide-react'
import { Card, CardDescription, CardTitle } from '../../common/Card'
import { Button } from '../../common/Button'
import { StatusBadge } from '../../common/Badge'
import { EmptyState } from '../../common/EmptyState'
import { PageHeader, StatCard, StatGrid } from '../../common/PageHeader'
import { useCapex } from '../../../context/CapexContext'
import { committed, openPr } from '../../../utils/capexRules'
import { downloadCsv } from '../../../utils/csv'
import { formatINR } from '../../../utils/formatters'
import { cn } from '../../../utils/cn'

interface Line {
  name: string
  wbs: string
  budget: number
  po: number
  pr: number
}

const left = (line: Pick<Line, 'budget' | 'po' | 'pr'>) => line.budget - line.po - line.pr

const MoneyBar: React.FC<{ budget: number; po: number; pr: number }> = ({ budget, po, pr }) => {
  const total = Math.max(budget, po + pr, 1)
  return (
    <div className="flex h-2 w-full overflow-hidden rounded-full bg-slate-200/80">
      <div className="h-full bg-blue-600" style={{ width: `${(po / total) * 100}%` }} />
      <div className="h-full bg-sky-400" style={{ width: `${(pr / total) * 100}%` }} />
      {po + pr > budget && <div className="h-full bg-rose-500" style={{ width: `${((po + pr - budget) / total) * 100}%` }} />}
    </div>
  )
}

export const BudgetView: React.FC = () => {
  const { projects, phases, sections, tasks, subWorks, purchaseRequisitions, selectedProjectId, hasPermission, addToast } =
    useCapex()

  const scope = selectedProjectId === 'all' ? projects : projects.filter(project => project.id === selectedProjectId)

  const report = useMemo(
    () =>
      scope.map(project => {
        const projectTasks = tasks.filter(task => task.projectId === project.id)
        const sectionLines: Line[] = sections
          .filter(section => section.projectId === project.id)
          .map(section => {
            const sectionTasks = projectTasks.filter(task => task.sectionId === section.id)
            return {
              name: section.name,
              wbs: section.wbsNumber,
              budget: sectionTasks.reduce((sum, task) => sum + task.budgetAmount, 0),
              po: sectionTasks.reduce((sum, task) => sum + committed(task.id, subWorks), 0),
              pr: sectionTasks.reduce((sum, task) => sum + openPr(task.id, purchaseRequisitions), 0)
            }
          })
        const allocated = projectTasks.reduce((sum, task) => sum + task.budgetAmount, 0)
        const po = sectionLines.reduce((sum, line) => sum + line.po, 0)
        const pr = sectionLines.reduce((sum, line) => sum + line.pr, 0)
        const phaseTotal = phases.filter(phase => phase.projectId === project.id).reduce((sum, phase) => sum + phase.budgetAmount, 0)
        return { project, sectionLines, allocated, po, pr, phaseTotal }
      }),
    [scope, tasks, sections, phases, subWorks, purchaseRequisitions]
  )

  const totals = report.reduce(
    (sum, row) => ({
      approved: sum.approved + row.project.approvedAmount,
      allocated: sum.allocated + row.allocated,
      po: sum.po + row.po,
      pr: sum.pr + row.pr
    }),
    { approved: 0, allocated: 0, po: 0, pr: 0 }
  )

  const exportCsv = () => {
    const rows: unknown[][] = []
    report.forEach(({ project, sectionLines }) =>
      sectionLines.forEach(line => rows.push([project.code, project.name, line.wbs, line.name, line.budget, line.po, line.pr, left(line)]))
    )
    downloadCsv(
      `capex-budget-${new Date().toISOString().slice(0, 10)}.csv`,
      ['Project code', 'Project', 'Section WBS', 'Section', 'Budget (₹)', 'PO committed (₹)', 'Open PRs (₹)', 'Available (₹)'],
      rows
    )
    addToast(`Exported ${rows.length} section rows.`, 'info')
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Finance"
        title="Budget"
        description="Approved capex against what is allocated to work packages, committed through POs and reserved by open PRs."
        actions={
          hasPermission('finance', 'export') &&
          report.length > 0 && (
            <Button variant="outline" leftIcon={<Download className="h-4 w-4" />} onClick={exportCsv}>
              Export CSV
            </Button>
          )
        }
        stats={
          report.length > 0 && (
            <StatGrid>
              <StatCard label="Approved capex" value={formatINR(totals.approved, true)} />
              <StatCard
                label="Allocated to work packages"
                value={formatINR(totals.allocated, true)}
                hint={totals.allocated > totals.approved ? 'More than approved' : `${formatINR(totals.approved - totals.allocated, true)} unallocated`}
                tone={totals.allocated > totals.approved ? 'danger' : 'default'}
              />
              <StatCard label="PO committed" value={formatINR(totals.po, true)} tone="success" />
              <StatCard
                label="Available"
                value={formatINR(totals.allocated - totals.po - totals.pr, true)}
                hint={`after ${formatINR(totals.pr, true)} of open PRs`}
              />
            </StatGrid>
          )
        }
      />

      {report.length === 0 ? (
        <Card>
          <EmptyState
            icon={<Wallet className="h-6 w-6" />}
            title="No budget to show"
            description="Budgets appear once a project has work packages with budget ceilings."
          />
        </Card>
      ) : (
        report.map(({ project, sectionLines, allocated, po, pr, phaseTotal }) => {
          const overAllocated = allocated > project.approvedAmount
          const phasesOver = phaseTotal > project.approvedAmount
          return (
            <Card key={project.id} noPadding>
              <div className="flex flex-col gap-4 border-b border-slate-200/70 p-5 lg:flex-row lg:items-center lg:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="mono-num rounded bg-blue-50 px-1.5 py-0.5 text-[11px] font-semibold text-blue-700 ring-1 ring-inset ring-blue-200">
                      {project.code}
                    </span>
                    <CardTitle>{project.name}</CardTitle>
                    <StatusBadge status={project.status} />
                  </div>
                  <CardDescription>Approved {formatINR(project.approvedAmount)}</CardDescription>
                </div>
                <dl className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm sm:grid-cols-4">
                  {[
                    ['Allocated', allocated],
                    ['Committed', po],
                    ['Open PRs', pr],
                    ['Available', allocated - po - pr]
                  ].map(([label, value]) => (
                    <div key={label as string}>
                      <dt className="text-[11px] text-slate-500">{label}</dt>
                      <dd className="mono-num font-semibold text-slate-900">{formatINR(value as number, true)}</dd>
                    </div>
                  ))}
                </dl>
              </div>

              {(overAllocated || phasesOver) && (
                <div className="flex items-start gap-2 border-b border-rose-200/70 bg-rose-50/70 px-5 py-3 text-sm text-rose-800">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                  <p>
                    {overAllocated &&
                      `Work package budgets (${formatINR(allocated)}) exceed the approved ${formatINR(project.approvedAmount)}. `}
                    {phasesOver && `Phase budgets add up to ${formatINR(phaseTotal)}, more than approved.`}
                  </p>
                </div>
              )}

              {sectionLines.length === 0 ? (
                <p className="px-5 py-6 text-sm text-slate-500">No sections in this project yet.</p>
              ) : (
                <div className="table-wrap">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Section</th>
                        <th className="num">Budget</th>
                        <th className="num">PO committed</th>
                        <th className="num">Open PRs</th>
                        <th className="num">Available</th>
                        <th className="w-48">Used</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sectionLines.map(line => (
                        <tr key={line.wbs + line.name}>
                          <td>
                            <span className="mono-num mr-2 text-xs text-slate-500">{line.wbs}</span>
                            <span className="font-medium text-slate-800">{line.name}</span>
                          </td>
                          <td className="num font-semibold text-slate-900">{formatINR(line.budget)}</td>
                          <td className="num">{formatINR(line.po)}</td>
                          <td className="num">{formatINR(line.pr)}</td>
                          <td className={cn('num font-semibold', left(line) < 0 ? 'text-rose-600' : 'text-emerald-700')}>
                            {formatINR(left(line))}
                          </td>
                          <td>
                            <MoneyBar budget={line.budget} po={line.po} pr={line.pr} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          )
        })
      )}
    </div>
  )
}
