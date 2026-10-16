import React, { useMemo, useState } from 'react'
import { CheckSquare, ClipboardList, Pencil, Plus, Trash2 } from 'lucide-react'
import { Card } from '../../common/Card'
import { Button } from '../../common/Button'
import { StatusBadge } from '../../common/Badge'
import { EmptyState } from '../../common/EmptyState'
import { PageHeader, StatCard, StatGrid } from '../../common/PageHeader'
import { FilterSelect, SearchInput, Toolbar } from '../../common/Toolbar'
import { IconButton } from '../../common/IconButton'
import { ConfirmDialog } from '../../common/ConfirmDialog'
import { TaskModal } from './TaskModal'
import { RaisePrModal } from '../procurement/RaisePrModal'
import { useCapex } from '../../../context/CapexContext'
import type { Task } from '../../../types/capex'
import { committed, openPr } from '../../../utils/capexRules'
import { formatDate, formatINR } from '../../../utils/formatters'
import { cn } from '../../../utils/cn'

const STATUSES = ['ALL', 'Pending', 'In Progress', 'Completed', 'Blocked']

export const TaskListView: React.FC = () => {
  const {
    projects,
    sections,
    filteredTasks,
    subWorks,
    purchaseRequisitions,
    deleteTask,
    hasPermission,
    hasFinancialRecords,
    focusRecordId
  } = useCapex()

  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('ALL')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Task | null>(null)
  const [deleting, setDeleting] = useState<Task | null>(null)
  const [prTaskId, setPrTaskId] = useState<string | null>(null)

  const canCreate = hasPermission('planning', 'create')
  const canEdit = hasPermission('planning', 'edit')
  const canDelete = hasPermission('planning', 'delete')

  const ledger = useMemo(
    () =>
      filteredTasks.map(task => {
        const po = committed(task.id, subWorks)
        const pr = openPr(task.id, purchaseRequisitions)
        return { task, po, pr, left: task.budgetAmount - po - pr }
      }),
    [filteredTasks, subWorks, purchaseRequisitions]
  )

  const rows = ledger.filter(({ task }) => {
    if (status !== 'ALL' && task.status !== status) return false
    const needle = search.trim().toLowerCase()
    if (!needle) return true
    const section = sections.find(item => item.id === task.sectionId)
    return `${task.wbsNumber} ${task.name} ${section?.name ?? ''}`.toLowerCase().includes(needle)
  })

  const totals = ledger.reduce(
    (sum, row) => ({ budget: sum.budget + row.task.budgetAmount, po: sum.po + row.po, pr: sum.pr + row.pr }),
    { budget: 0, po: 0, pr: 0 }
  )
  const overCount = ledger.filter(row => row.left < 0).length

  const openCreate = () => {
    setEditing(null)
    setModalOpen(true)
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Planning"
        title="Work Packages"
        description="Each work package is a budget line with a hard ceiling. Available = budget − PO committed − open PRs."
        actions={
          canCreate && (
            <Button leftIcon={<Plus className="h-4 w-4" />} onClick={openCreate}>
              New work package
            </Button>
          )
        }
        stats={
          ledger.length > 0 && (
            <StatGrid>
              <StatCard label="Total budget" value={formatINR(totals.budget, true)} hint={`${ledger.length} work packages`} />
              <StatCard label="PO committed" value={formatINR(totals.po, true)} tone="success" />
              <StatCard label="Open PRs" value={formatINR(totals.pr, true)} tone="warning" />
              <StatCard
                label="Available"
                value={formatINR(totals.budget - totals.po - totals.pr, true)}
                hint={overCount ? `${overCount} over budget` : 'No line over budget'}
                tone={overCount ? 'danger' : 'default'}
              />
            </StatGrid>
          )
        }
      />

      <Card noPadding>
        <Toolbar>
          <SearchInput value={search} onChange={setSearch} placeholder="Search WBS number, name or section…" />
          <FilterSelect
            label="Status"
            value={status}
            onChange={setStatus}
            options={STATUSES.map(item => ({ value: item, label: item === 'ALL' ? 'All' : item }))}
          />
        </Toolbar>

        {rows.length === 0 ? (
          <div className="p-5">
            <EmptyState
              icon={<CheckSquare className="h-6 w-6" />}
              title={ledger.length ? 'No work packages match' : 'No work packages yet'}
              description={
                ledger.length
                  ? 'Change the search or status filter.'
                  : sections.length
                    ? 'Add a work package under a section and give it a budget. PRs are raised against it.'
                    : 'Create a project and a section first (Planning → Project WBS).'
              }
              actionLabel={!ledger.length && sections.length && canCreate ? 'New work package' : undefined}
              onAction={openCreate}
            />
          </div>
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Work package</th>
                  <th>Section</th>
                  <th className="num">Budget</th>
                  <th className="num">PO committed</th>
                  <th className="num">Open PRs</th>
                  <th className="num">Available</th>
                  <th>Status</th>
                  <th className="actions">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(({ task, po, pr, left }) => {
                  const project = projects.find(item => item.id === task.projectId)
                  const section = sections.find(item => item.id === task.sectionId)
                  const used = task.budgetAmount > 0 ? Math.min(100, ((po + pr) / task.budgetAmount) * 100) : 0
                  return (
                    <tr key={task.id} className={cn(focusRecordId === task.id && 'bg-blue-50/70')}>
                      <td className="max-w-[280px]">
                        <div className="flex items-start gap-2">
                          <span className="mono-num shrink-0 rounded bg-emerald-50 px-1.5 py-0.5 text-[11px] font-semibold text-emerald-800 ring-1 ring-inset ring-emerald-200">
                            {task.wbsNumber}
                          </span>
                          <div className="min-w-0">
                            <p className="truncate font-semibold text-slate-900">{task.name}</p>
                            <p className="truncate text-xs text-slate-500">{project?.code}</p>
                          </div>
                        </div>
                      </td>
                      <td className="max-w-[160px] truncate">{section?.name ?? '—'}</td>
                      <td className="num font-semibold text-slate-900">{formatINR(task.budgetAmount)}</td>
                      <td className="num">{formatINR(po)}</td>
                      <td className="num">{formatINR(pr)}</td>
                      <td className="num">
                        <span className={cn('font-semibold', left < 0 ? 'text-rose-600' : 'text-emerald-700')}>
                          {formatINR(left)}
                        </span>
                        <div className="mt-1 ml-auto h-1 w-24 overflow-hidden rounded-full bg-slate-200">
                          <div
                            className={cn('h-full rounded-full', left < 0 ? 'bg-rose-500' : 'bg-blue-600')}
                            style={{ width: `${used}%` }}
                          />
                        </div>
                      </td>
                      <td>
                        <StatusBadge status={task.status} />
                        <div className="mono-num mt-1 text-[11px] text-slate-500">
                          {task.progress ?? 0}% · due {formatDate(task.targetDate)}
                        </div>
                      </td>
                      <td className="actions">
                        <div className="flex justify-end gap-1">
                          {canCreate && (
                            <IconButton label="Raise PR" onClick={() => setPrTaskId(task.id)}>
                              <ClipboardList className="h-4 w-4" />
                            </IconButton>
                          )}
                          {canEdit && (
                            <IconButton
                              label="Edit work package"
                              onClick={() => {
                                setEditing(task)
                                setModalOpen(true)
                              }}
                            >
                              <Pencil className="h-4 w-4" />
                            </IconButton>
                          )}
                          {canDelete && (
                            <IconButton
                              label="Delete work package"
                              tone="danger"
                              disabledReason={
                                hasFinancialRecords(item => item.id === task.id)
                                  ? 'Has PRs or POs, so it cannot be deleted'
                                  : undefined
                              }
                              onClick={() => setDeleting(task)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </IconButton>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <TaskModal isOpen={modalOpen} onClose={() => setModalOpen(false)} taskToEdit={editing} />
      <RaisePrModal isOpen={prTaskId !== null} onClose={() => setPrTaskId(null)} defaultTaskId={prTaskId ?? undefined} />
      <ConfirmDialog
        isOpen={deleting !== null}
        title={`Delete ${deleting?.wbsNumber ?? ''} ${deleting?.name ?? ''}?`}
        message="The work package and its budget line are removed. This is recorded in the Activity Log."
        confirmLabel="Delete work package"
        onConfirm={() => deleting && deleteTask(deleting.id)}
        onClose={() => setDeleting(null)}
      />
    </div>
  )
}
