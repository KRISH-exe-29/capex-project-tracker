import React, { useMemo, useState } from 'react'
import { ArrowRight, ShieldAlert, ShieldCheck, TriangleAlert, Database } from 'lucide-react'
import { Card } from '../../common/Card'
import { Button } from '../../common/Button'
import { EmptyState } from '../../common/EmptyState'
import { PageHeader, StatCard } from '../../common/PageHeader'
import { StatusBadge } from '../../common/Badge'
import { useCapex } from '../../../context/CapexContext'
import { getExceptions, type CapexException, type ExceptionSeverity } from '../../../utils/exceptions'
import { cn } from '../../../utils/cn'

const SEVERITIES: ExceptionSeverity[] = ['Audit risk', 'Control gap', 'Data quality']

const SEVERITY_HELP: Record<ExceptionSeverity, string> = {
  'Audit risk': 'Money moved outside the controls',
  'Control gap': 'Evidence or approval missing',
  'Data quality': 'Records that will not reconcile'
}

export const ExceptionsView: React.FC = () => {
  const {
    tasks,
    filteredSubWorks,
    filteredPrs,
    filteredTasks,
    documents,
    budgetRevisions,
    openRecord
  } = useCapex()
  const [filter, setFilter] = useState<ExceptionSeverity | 'All'>('All')

  const all = useMemo(
    () =>
      getExceptions({
        tasks: filteredTasks,
        subWorks: filteredSubWorks,
        purchaseRequisitions: filteredPrs,
        documents,
        budgetRevisions: budgetRevisions.filter(revision => filteredTasks.some(task => task.id === revision.taskId))
      }),
    [filteredTasks, filteredSubWorks, filteredPrs, documents, budgetRevisions]
  )

  const count = (severity: ExceptionSeverity) => all.filter(item => item.severity === severity).length
  const shown = filter === 'All' ? all : all.filter(item => item.severity === filter)

  const open = (item: CapexException) => {
    if (item.recordType === 'po') openRecord('procurement-dossier', item.recordId)
    else if (item.recordType === 'pr' || item.recordType === 'revision') openRecord('procurement-pr', item.recordId)
    else openRecord('planning-task', item.recordId)
  }

  const openLabel: Record<CapexException['recordType'], string> = {
    po: 'Open dossier',
    pr: 'Open PR',
    revision: 'Open revision',
    task: 'Open work package'
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Procurement"
        title="Exceptions"
        description="Issues the system found in the current records. These are the questions an auditor will ask; each one links to the record that needs fixing."
        stats={
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <StatCard
              label="Audit risk"
              value={count('Audit risk')}
              hint={SEVERITY_HELP['Audit risk']}
              tone={count('Audit risk') ? 'danger' : 'default'}
              icon={<ShieldAlert className="h-4 w-4" />}
            />
            <StatCard
              label="Control gap"
              value={count('Control gap')}
              hint={SEVERITY_HELP['Control gap']}
              tone={count('Control gap') ? 'warning' : 'default'}
              icon={<TriangleAlert className="h-4 w-4" />}
            />
            <StatCard
              label="Data quality"
              value={count('Data quality')}
              hint={SEVERITY_HELP['Data quality']}
              icon={<Database className="h-4 w-4" />}
            />
          </div>
        }
      />

      <Card noPadding>
        <div className="flex flex-wrap items-center gap-1.5 border-b border-slate-200/70 px-4 py-3">
          {(['All', ...SEVERITIES] as const).map(item => (
            <button
              key={item}
              onClick={() => setFilter(item)}
              className={cn(
                'rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset transition-colors',
                filter === item ? 'bg-blue-600 text-white ring-blue-600' : 'bg-white/70 text-slate-600 ring-slate-200 hover:bg-white'
              )}
            >
              {item} ({item === 'All' ? all.length : count(item)})
            </button>
          ))}
        </div>

        {shown.length === 0 ? (
          <div className="p-5">
            <EmptyState
              icon={<ShieldCheck className="h-6 w-6" />}
              title={all.length ? 'Nothing in this group' : 'No exceptions'}
              description={
                all.length
                  ? 'Pick another severity to see the rest.'
                  : tasks.length
                    ? 'Every PO is within budget, linked to a PR and fully documented.'
                    : 'Exceptions appear here once work packages, PRs and POs are recorded.'
              }
            />
          </div>
        ) : (
          <ul className="divide-y divide-slate-200/70">
            {shown.map(item => (
              <li key={item.id} className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:gap-5">
                <div className="w-28 shrink-0">
                  <StatusBadge status={item.severity} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-slate-900">{item.title}</p>
                  <p className="text-sm text-slate-500">{item.detail}</p>
                  <p className="mono-num mt-0.5 text-xs text-slate-400">{item.reference}</p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  rightIcon={<ArrowRight className="h-3.5 w-3.5" />}
                  onClick={() => open(item)}
                  className="self-start sm:self-center"
                >
                  {openLabel[item.recordType]}
                </Button>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  )
}
