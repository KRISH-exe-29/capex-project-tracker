import React, { useMemo, useState } from 'react'
import { Ban, BriefcaseBusiness, FileSearch, Pencil, Plus } from 'lucide-react'
import { Card } from '../../common/Card'
import { Button } from '../../common/Button'
import { StatusBadge } from '../../common/Badge'
import { EmptyState } from '../../common/EmptyState'
import { PageHeader } from '../../common/PageHeader'
import { FilterSelect, SearchInput, Toolbar } from '../../common/Toolbar'
import { IconButton } from '../../common/IconButton'
import { ReasonDialog } from '../../common/ReasonDialog'
import { SubWorkModal } from './SubWorkModal'
import { useCapex } from '../../../context/CapexContext'
import type { SubWork } from '../../../types/capex'
import { formatDate, formatINR } from '../../../utils/formatters'
import { isSettled } from '../../../utils/capexRules'

const STATUS_OPTIONS = ['ALL', 'PO Issued', 'In Execution', 'Billed', 'Paid', 'Cancelled']

export const SubWorkListView: React.FC = () => {
  const { tasks, projects, purchaseRequisitions, filteredSubWorks, cancelSubWork, hasPermission, openRecord } =
    useCapex()

  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('ALL')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<SubWork | null>(null)
  const [cancelling, setCancelling] = useState<SubWork | null>(null)

  const canCreate = hasPermission('planning', 'create')
  const canEdit = hasPermission('planning', 'edit')
  const canCancel = hasPermission('planning', 'delete')

  const rows = useMemo(() => {
    const needle = search.trim().toLowerCase()
    return filteredSubWorks.filter(po => {
      if (status !== 'ALL' && po.status !== status) return false
      if (!needle) return true
      const project = projects.find(item => item.id === po.projectId)
      return [po.workDescription, po.supplierName, po.bpCode, po.poNumber, po.wbsNumber, project?.name]
        .join(' ')
        .toLowerCase()
        .includes(needle)
    })
  }, [filteredSubWorks, search, status, projects])

  const liveTotal = rows.filter(po => po.status !== 'Cancelled').reduce((sum, po) => sum + po.poValueGst, 0)
  const prNumber = (prId?: string) => purchaseRequisitions.find(pr => pr.id === prId)?.prNumber

  const openCreate = () => {
    setEditing(null)
    setModalOpen(true)
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Planning"
        title="Purchase Orders"
        description="Vendor POs (sub-works). Each PO is created from an approved PR and counts against its work package budget."
        actions={
          canCreate && (
            <Button leftIcon={<Plus className="h-4 w-4" />} onClick={openCreate}>
              Create PO from PR
            </Button>
          )
        }
      />

      <Card noPadding>
        <Toolbar>
          <SearchInput value={search} onChange={setSearch} placeholder="Search supplier, PO number, BP code…" />
          <div className="flex flex-wrap items-center gap-3">
            <FilterSelect
              label="Status"
              value={status}
              onChange={setStatus}
              options={STATUS_OPTIONS.map(item => ({ value: item, label: item === 'ALL' ? 'All' : item }))}
            />
            <span className="text-xs text-slate-500">
              Committed: <span className="mono-num font-semibold text-slate-900">{formatINR(liveTotal)}</span>
            </span>
          </div>
        </Toolbar>

        {rows.length === 0 ? (
          <div className="p-5">
            <EmptyState
              icon={<BriefcaseBusiness className="h-6 w-6" />}
              title={filteredSubWorks.length ? 'No POs match' : 'No purchase orders yet'}
              description={
                filteredSubWorks.length
                  ? 'Change the search or status filter.'
                  : 'POs are created from approved purchase requisitions. Raise and approve a PR first.'
              }
              actionLabel={!filteredSubWorks.length && canCreate ? 'Create PO from PR' : undefined}
              onAction={openCreate}
            />
          </div>
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>PO no.</th>
                  <th>Work description</th>
                  <th>Supplier</th>
                  <th>Work package</th>
                  <th className="num">Value incl. GST</th>
                  <th>Target</th>
                  <th>Status</th>
                  <th className="actions">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(po => {
                  const task = tasks.find(item => item.id === po.taskId)
                  const cancelled = po.status === 'Cancelled'
                  return (
                    <tr key={po.id} className={cancelled ? 'opacity-60' : undefined}>
                      <td>
                        <div className="mono-num font-semibold text-blue-700">{po.poNumber}</div>
                        <div className="mono-num text-xs text-slate-500">{prNumber(po.prId) ?? 'No PR'}</div>
                      </td>
                      <td className="max-w-[260px]">
                        <p className="truncate font-medium text-slate-800" title={po.workDescription}>
                          {po.workDescription}
                        </p>
                        <p className="mono-num text-xs text-slate-400">{po.wbsNumber}</p>
                      </td>
                      <td className="max-w-[200px]">
                        <p className="truncate" title={po.supplierName}>
                          {po.supplierName}
                        </p>
                        <p className="mono-num text-xs text-slate-500">BP {po.bpCode}</p>
                      </td>
                      <td className="max-w-[200px]">
                        <p className="truncate text-slate-600">{task ? `${task.wbsNumber} ${task.name}` : '—'}</p>
                      </td>
                      <td className="num font-semibold text-slate-900">{formatINR(po.poValueGst)}</td>
                      <td className="whitespace-nowrap">{formatDate(po.targetDate)}</td>
                      <td>
                        <StatusBadge status={po.status} />
                      </td>
                      <td className="actions">
                        <div className="flex justify-end gap-1">
                          <IconButton label="Open dossier" onClick={() => openRecord('procurement-dossier', po.id)}>
                            <FileSearch className="h-4 w-4" />
                          </IconButton>
                          {canEdit && (
                            <IconButton
                              label="Edit PO"
                              disabledReason={cancelled ? 'Cancelled POs cannot be edited' : undefined}
                              onClick={() => {
                                setEditing(po)
                                setModalOpen(true)
                              }}
                            >
                              <Pencil className="h-4 w-4" />
                            </IconButton>
                          )}
                          {canCancel && (
                            <IconButton
                              label="Cancel PO"
                              tone="danger"
                              disabledReason={
                                cancelled
                                  ? 'Already cancelled'
                                  : isSettled(po)
                                    ? 'Billed, invoiced or paid POs cannot be cancelled'
                                    : undefined
                              }
                              onClick={() => setCancelling(po)}
                            >
                              <Ban className="h-4 w-4" />
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

      <SubWorkModal isOpen={modalOpen} onClose={() => setModalOpen(false)} subWorkToEdit={editing} />
      <ReasonDialog
        isOpen={cancelling !== null}
        title={`Cancel PO ${cancelling?.poNumber ?? ''}`}
        description="The PO stays on record as cancelled and its value goes back to the work package budget."
        confirmLabel="Cancel PO"
        tone="danger"
        onConfirm={reason => {
          if (cancelling) cancelSubWork(cancelling.id, reason)
          setCancelling(null)
        }}
        onClose={() => setCancelling(null)}
      />
    </div>
  )
}
