import React, { useMemo, useState } from 'react'
import { Flag, Pencil, Plus, Trash2 } from 'lucide-react'
import { Card } from '../../common/Card'
import { Button } from '../../common/Button'
import { StatusBadge } from '../../common/Badge'
import { EmptyState } from '../../common/EmptyState'
import { PageHeader } from '../../common/PageHeader'
import { FilterSelect, SearchInput, Toolbar } from '../../common/Toolbar'
import { IconButton } from '../../common/IconButton'
import { ConfirmDialog } from '../../common/ConfirmDialog'
import { MilestoneModal } from './MilestoneModal'
import { useCapex } from '../../../context/CapexContext'
import type { Milestone } from '../../../types/capex'
import { formatDate, getDaysRemaining } from '../../../utils/formatters'

const STATUSES = ['ALL', 'Not Started', 'In Progress', 'Completed', 'Delayed']

export const MilestoneListView: React.FC = () => {
  const { sections, projects, filteredMilestones, deleteMilestone, hasPermission } = useCapex()

  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('ALL')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Milestone | null>(null)
  const [deleting, setDeleting] = useState<Milestone | null>(null)

  const canCreate = hasPermission('planning', 'create')
  const canEdit = hasPermission('planning', 'edit')
  const canDelete = hasPermission('planning', 'delete')

  const rows = useMemo(() => {
    const needle = search.trim().toLowerCase()
    return filteredMilestones.filter(milestone => {
      if (status !== 'ALL' && milestone.status !== status) return false
      const section = sections.find(item => item.id === milestone.sectionId)
      return !needle || `${milestone.wbsNumber} ${milestone.name} ${section?.name ?? ''}`.toLowerCase().includes(needle)
    })
  }, [filteredMilestones, search, status, sections])

  const openCreate = () => {
    setEditing(null)
    setModalOpen(true)
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Planning"
        title="Milestones"
        description="Schedule checkpoints inside sections. Open milestones also show on the dashboard."
        actions={
          canCreate &&
          sections.length > 0 && (
            <Button leftIcon={<Plus className="h-4 w-4" />} onClick={openCreate}>
              New milestone
            </Button>
          )
        }
      />

      <Card noPadding>
        <Toolbar>
          <SearchInput value={search} onChange={setSearch} placeholder="Search milestone, WBS number or section…" />
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
              icon={<Flag className="h-6 w-6" />}
              title={filteredMilestones.length ? 'No milestones match' : 'No milestones yet'}
              description={
                filteredMilestones.length
                  ? 'Change the search or status filter.'
                  : sections.length
                    ? 'Add schedule checkpoints under a section.'
                    : 'Create a section first.'
              }
              actionLabel={!filteredMilestones.length && sections.length && canCreate ? 'New milestone' : undefined}
              onAction={openCreate}
            />
          </div>
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Milestone</th>
                  <th>Section</th>
                  <th>Start</th>
                  <th>Target</th>
                  <th>Progress</th>
                  <th>Status</th>
                  <th className="actions">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(milestone => {
                  const project = projects.find(item => item.id === milestone.projectId)
                  const section = sections.find(item => item.id === milestone.sectionId)
                  const days = getDaysRemaining(milestone.targetDate)
                  const late = days < 0 && milestone.status !== 'Completed'
                  return (
                    <tr key={milestone.id}>
                      <td className="max-w-[300px]">
                        <div className="flex items-start gap-2">
                          <span className="mono-num shrink-0 rounded bg-indigo-50 px-1.5 py-0.5 text-[11px] font-semibold text-indigo-700 ring-1 ring-inset ring-indigo-200">
                            {milestone.wbsNumber}
                          </span>
                          <div className="min-w-0">
                            <p className="truncate font-semibold text-slate-900">{milestone.name}</p>
                            <p className="text-xs text-slate-500">{project?.code}</p>
                          </div>
                        </div>
                      </td>
                      <td className="max-w-[180px] truncate">{section?.name ?? '—'}</td>
                      <td className="whitespace-nowrap">{formatDate(milestone.startDate)}</td>
                      <td className="whitespace-nowrap">
                        <div>{formatDate(milestone.targetDate)}</div>
                        {late && <div className="text-xs font-medium text-rose-600">{-days} days late</div>}
                      </td>
                      <td>
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-20 overflow-hidden rounded-full bg-slate-200">
                            <div className="h-full rounded-full bg-indigo-600" style={{ width: `${milestone.progress}%` }} />
                          </div>
                          <span className="mono-num text-xs text-slate-600">{milestone.progress}%</span>
                        </div>
                      </td>
                      <td>
                        <StatusBadge status={milestone.status} />
                      </td>
                      <td className="actions">
                        <div className="flex justify-end gap-1">
                          {canEdit && (
                            <IconButton
                              label="Edit milestone"
                              onClick={() => {
                                setEditing(milestone)
                                setModalOpen(true)
                              }}
                            >
                              <Pencil className="h-4 w-4" />
                            </IconButton>
                          )}
                          {canDelete && (
                            <IconButton label="Delete milestone" tone="danger" onClick={() => setDeleting(milestone)}>
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

      <MilestoneModal isOpen={modalOpen} onClose={() => setModalOpen(false)} milestoneToEdit={editing} />
      <ConfirmDialog
        isOpen={deleting !== null}
        title={`Delete milestone ${deleting?.name ?? ''}?`}
        message="The milestone is removed from the schedule. This is recorded in the Activity Log."
        confirmLabel="Delete milestone"
        onConfirm={() => deleting && deleteMilestone(deleting.id)}
        onClose={() => setDeleting(null)}
      />
    </div>
  )
}
