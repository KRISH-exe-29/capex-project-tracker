import React, { useMemo, useState } from 'react'
import {
  AlertTriangle,
  ArrowRight,
  BadgeIndianRupee,
  ClipboardList,
  FolderKanban,
  Hourglass,
  Network,
  PackagePlus,
  Plus,
  Wallet
} from 'lucide-react'
import { FinancialCharts } from './FinancialCharts'
import { ProjectProgressChart } from './ProjectProgressChart'
import { UpcomingDeadlines } from './UpcomingDeadlines'
import { useCapex } from '../../../context/CapexContext'
import { Button } from '../../common/Button'
import { Card } from '../../common/Card'
import { PageHeader, StatCard, StatGrid } from '../../common/PageHeader'
import { ProjectModal } from '../planning/ProjectModal'
import { getExceptions } from '../../../utils/exceptions'
import { formatINR } from '../../../utils/formatters'
import { paidTotal } from '../../../utils/capexRules'
import type { ActiveModule } from '../../../types/capex'

const STEPS: { title: string; text: string; module: ActiveModule; icon: React.ReactNode }[] = [
  {
    title: 'Create the project',
    text: 'Code, approved capex amount and timeline.',
    module: 'planning-project',
    icon: <FolderKanban className="h-5 w-5" />
  },
  {
    title: 'Build the WBS',
    text: 'Phases, sections and work packages, each with a budget ceiling.',
    module: 'planning-wbs',
    icon: <Network className="h-5 w-5" />
  },
  {
    title: 'Raise and approve PRs',
    text: 'A PR can only use what is left on its work package.',
    module: 'procurement-pr',
    icon: <ClipboardList className="h-5 w-5" />
  },
  {
    title: 'Create POs and attach evidence',
    text: 'Each PO comes from an approved PR and gets its own dossier.',
    module: 'procurement-dossier',
    icon: <PackagePlus className="h-5 w-5" />
  }
]

export const DashboardView: React.FC = () => {
  const {
    projects,
    tasks,
    filteredTasks,
    filteredSubWorks,
    filteredPrs,
    purchaseRequisitions,
    subWorks,
    documents,
    budgetRevisions,
    selectedProjectId,
    hasPermission,
    setActiveModule
  } = useCapex()
  const [projectModal, setProjectModal] = useState(false)

  const scope = selectedProjectId === 'all' ? projects : projects.filter(project => project.id === selectedProjectId)
  const approved = scope.reduce((sum, project) => sum + project.approvedAmount, 0)
  const allocated = filteredTasks.reduce((sum, task) => sum + task.budgetAmount, 0)
  const committed = filteredSubWorks
    .filter(po => po.status !== 'Cancelled')
    .reduce((sum, po) => sum + po.poValueGst, 0)
  const paid = filteredSubWorks.reduce((sum, po) => sum + paidTotal(po), 0)
  const openPrValue = filteredPrs
    .filter(pr => pr.status === 'Pending Approval' || pr.status === 'Approved')
    .reduce((sum, pr) => sum + pr.amount, 0)
  const pending =
    filteredPrs.filter(pr => pr.status === 'Pending Approval').length +
    budgetRevisions.filter(
      revision => revision.status === 'Pending' && filteredTasks.some(task => task.id === revision.taskId)
    ).length

  const exceptionCount = useMemo(
    () =>
      getExceptions({
        tasks: selectedProjectId === 'all' ? tasks : filteredTasks,
        subWorks: selectedProjectId === 'all' ? subWorks : filteredSubWorks,
        purchaseRequisitions: selectedProjectId === 'all' ? purchaseRequisitions : filteredPrs,
        documents,
        budgetRevisions
      }).length,
    [selectedProjectId, tasks, filteredTasks, subWorks, filteredSubWorks, purchaseRequisitions, filteredPrs, documents, budgetRevisions]
  )

  const pct = (part: number, whole: number) => (whole > 0 ? `${Math.round((part / whole) * 100)}%` : '—')
  const canCreate = hasPermission('planning', 'create')

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Overview"
        title="Capex Dashboard"
        description="Approved capex, what is committed through POs, what is reserved by open PRs, and what needs attention."
        actions={
          canCreate && (
            <Button leftIcon={<Plus className="h-4 w-4" />} onClick={() => setProjectModal(true)}>
              New project
            </Button>
          )
        }
      />

      {projects.length === 0 ? (
        <Card className="p-6 sm:p-8">
          <h2 className="font-heading text-lg font-semibold text-slate-900">Set up your first capex project</h2>
          <p className="mt-1 max-w-2xl text-sm text-slate-500">
            The workspace is empty. Follow these four steps; every action is recorded in the Activity Log.
          </p>
          <ol className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            {STEPS.map((step, index) => (
              <li key={step.title}>
                <button
                  type="button"
                  onClick={() => (index === 0 && canCreate ? setProjectModal(true) : setActiveModule(step.module))}
                  className="group flex h-full w-full flex-col gap-3 rounded-xl border border-slate-200/80 bg-white/70 p-4 text-left transition hover:border-blue-300 hover:bg-white hover:shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                      {step.icon}
                    </span>
                    <span className="mono-num text-xs font-semibold text-slate-400">Step {index + 1}</span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{step.title}</p>
                    <p className="mt-0.5 text-xs text-slate-500">{step.text}</p>
                  </div>
                  <span className="mt-auto inline-flex items-center gap-1 text-xs font-medium text-blue-700">
                    Open <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </button>
              </li>
            ))}
          </ol>
        </Card>
      ) : (
        <>
          <StatGrid>
            <StatCard
              label="Approved capex"
              value={formatINR(approved, true)}
              hint={`${formatINR(allocated, true)} allocated to work packages`}
              icon={<BadgeIndianRupee className="h-4 w-4" />}
            />
            <StatCard
              label="PO committed"
              value={formatINR(committed, true)}
              hint={`${pct(committed, approved)} of approved · ${formatINR(paid, true)} paid`}
              icon={<Wallet className="h-4 w-4" />}
              tone="success"
            />
            <StatCard
              label="Open PRs"
              value={formatINR(openPrValue, true)}
              hint={`${pending} waiting for approval`}
              icon={<Hourglass className="h-4 w-4" />}
              tone={pending ? 'warning' : 'default'}
            />
            <StatCard
              label="Exceptions"
              value={exceptionCount}
              hint={exceptionCount ? 'Open the register to resolve' : 'Nothing flagged'}
              icon={<AlertTriangle className="h-4 w-4" />}
              tone={exceptionCount ? 'danger' : 'default'}
            />
          </StatGrid>

          <FinancialCharts />
          <ProjectProgressChart />
          <UpcomingDeadlines />
        </>
      )}

      <ProjectModal isOpen={projectModal} onClose={() => setProjectModal(false)} />
    </div>
  )
}
