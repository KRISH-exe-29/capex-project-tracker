import React, { useMemo, useState } from 'react'
import { AlertTriangle, FileSpreadsheet, Pencil, Plus, Trash2 } from 'lucide-react'
import { Card } from '../../common/Card'
import { Button } from '../../common/Button'
import { StatusBadge } from '../../common/Badge'
import { EmptyState } from '../../common/EmptyState'
import { IconButton } from '../../common/IconButton'
import { ConfirmDialog } from '../../common/ConfirmDialog'
import { PageHeader } from '../../common/PageHeader'
import { FilterSelect, SearchInput, Toolbar } from '../../common/Toolbar'
import { DprModal } from './DprModal'
import { useCapex } from '../../../context/CapexContext'
import type { DprRecord } from '../../../types/capex'
import { formatDate } from '../../../utils/formatters'

const STATUSES = ['ALL', 'Submitted', 'Verified', 'Approved']

export const DprView: React.FC = () => {
  const { filteredDpr, tasks, projects, deleteDprRecord, hasPermission } = useCapex()

  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('ALL')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<DprRecord | null>(null)
  const [deleting, setDeleting] = useState<DprRecord | null>(null)

  const canCreate = hasPermission('operation', 'create')
  const canEdit = hasPermission('operation', 'edit')
  const canDelete = hasPermission('operation', 'delete')

  const rows = useMemo(() => {
    const needle = search.trim().toLowerCase()
    return filteredDpr.filter(dpr => {
      if (status !== 'ALL' && dpr.status !== status) return false
      const task = tasks.find(item => item.id === dpr.taskId)
      return !needle || `${dpr.workDoneToday} ${dpr.submittedBy} ${task?.name ?? ''}`.toLowerCase().includes(needle)
    })
  }, [filteredDpr, search, status, tasks])

  const openCreate = () => {
    setEditing(null)
    setModalOpen(true)
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Operation"
        title="Daily Progress"
        description="Site progress reports against work packages: work done, manpower, equipment and hindrances."
        actions={
          canCreate &&
          tasks.length > 0 && (
            <Button leftIcon={<Plus className="h-4 w-4" />} onClick={openCreate}>
              New daily report
            </Button>
          )
        }
      />

      <Card noPadding>
        <Toolbar>
          <SearchInput value={search} onChange={setSearch} placeholder="Search work done, submitter or work package…" />
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
              icon={<FileSpreadsheet className="h-6 w-6" />}
              title={filteredDpr.length ? 'No reports match' : 'No daily reports yet'}
              description={
                filteredDpr.length
                  ? 'Change the search or status filter.'
                  : tasks.length
                    ? 'Log the day’s progress against a work package.'
                    : 'Reports are filed against work packages. Create one first.'
              }
              actionLabel={!filteredDpr.length && tasks.length && canCreate ? 'New daily report' : undefined}
              onAction={openCreate}
            />
          </div>
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Work package</th>
                  <th className="num">Progress</th>
                  <th className="num">Manpower</th>
                  <th>Work done</th>
                  <th>Submitted by</th>
                  <th>Status</th>
                  <th className="actions">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(dpr => {
                  const project = projects.find(item => item.id === dpr.projectId)
                  const task = tasks.find(item => item.id === dpr.taskId)
                  return (
                    <tr key={dpr.id}>
                      <td className="whitespace-nowrap font-medium text-slate-800">{formatDate(dpr.reportDate)}</td>
                      <td className="max-w-[220px]">
                        <p className="truncate font-medium text-slate-800">{task ? `${task.wbsNumber} ${task.name}` : '—'}</p>
                        <p className="truncate text-xs text-slate-500">{project?.code}</p>
                      </td>
                      <td className="num font-semibold text-emerald-700">+{dpr.dailyProgress}%</td>
                      <td className="num">{dpr.manpowerCount}</td>
                      <td className="max-w-[320px]">
                        <p className="line-clamp-2 text-slate-700">{dpr.workDoneToday}</p>
                        {dpr.hindrances && (
                          <p className="mt-1 flex items-center gap-1 truncate text-xs text-amber-700">
                            <AlertTriangle className="h-3 w-3 shrink-0" />
                            {dpr.hindrances}
                          </p>
                        )}
                      </td>
                      <td className="whitespace-nowrap">{dpr.submittedBy}</td>
                      <td>
                        <StatusBadge status={dpr.status} />
                      </td>
                      <td className="actions">
                        <div className="flex justify-end gap-1">
                          {canEdit && (
                            <IconButton
                              label="Edit report"
                              onClick={() => {
                                setEditing(dpr)
                                setModalOpen(true)
                              }}
                            >
                              <Pencil className="h-4 w-4" />
                            </IconButton>
                          )}
                          {canDelete && (
                            <IconButton label="Delete report" tone="danger" onClick={() => setDeleting(dpr)}>
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

      <DprModal isOpen={modalOpen} onClose={() => setModalOpen(false)} dprToEdit={editing} />
      <ConfirmDialog
        isOpen={deleting !== null}
        title="Delete this daily report?"
        message="The report is removed. This is recorded in the Activity Log."
        confirmLabel="Delete report"
        onConfirm={() => deleting && deleteDprRecord(deleting.id)}
        onClose={() => setDeleting(null)}
      />
    </div>
  )
}
