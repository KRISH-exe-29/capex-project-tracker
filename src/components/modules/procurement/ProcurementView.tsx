import React, { useState } from 'react'
import { Ban, Check, ClipboardList, FilePlus2, Hourglass, PackagePlus, ShieldAlert, Wallet, X } from 'lucide-react'
import { Card } from '../../common/Card'
import { Button } from '../../common/Button'
import { EmptyState } from '../../common/EmptyState'
import { PageHeader, StatCard, StatGrid } from '../../common/PageHeader'
import { StatusBadge } from '../../common/Badge'
import { ReasonDialog } from '../../common/ReasonDialog'
import { useCapex } from '../../../context/CapexContext'
import type { PurchaseRequisitionStatus } from '../../../types/capex'
import { formatDate, formatINR } from '../../../utils/formatters'
import { cn } from '../../../utils/cn'
import { RaisePrModal } from './RaisePrModal'
import { SubWorkModal } from '../planning/SubWorkModal'

type Tab = 'requisitions' | 'revisions'
type Decision =
  | { kind: 'reject-pr' | 'cancel-pr' | 'approve-pr'; id: string; label: string }
  | { kind: 'approve-revision' | 'reject-revision'; id: string; label: string }

const STATUS_FILTERS: ('All' | PurchaseRequisitionStatus)[] = [
  'All',
  'Pending Approval',
  'Approved',
  'Converted to PO',
  'Rejected',
  'Cancelled'
]

const ageDays = (iso: string) => Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000))

export const ProcurementView: React.FC = () => {
  const {
    projects,
    tasks,
    filteredPrs,
    budgetRevisions,
    auditLog,
    userPermissions,
    currentUser,
    hasPermission,
    focusRecordId,
    decidePr,
    cancelPr,
    decideBudgetRevision,
    selectedProjectId
  } = useCapex()

  const [tab, setTab] = useState<Tab>(() =>
    budgetRevisions.some(revision => revision.id === focusRecordId) ? 'revisions' : 'requisitions'
  )
  const [statusFilter, setStatusFilter] = useState<(typeof STATUS_FILTERS)[number]>('All')
  const [raiseOpen, setRaiseOpen] = useState(false)
  const [poFromPrId, setPoFromPrId] = useState<string | null>(null)
  const [decision, setDecision] = useState<Decision | null>(null)

  const canCreate = hasPermission('planning', 'create')
  const canApprove = hasPermission('finance', 'approve')

  const userName = (userId?: string) => userPermissions.find(user => user.userId === userId)?.userName ?? '—'
  const taskOf = (taskId: string) => tasks.find(task => task.id === taskId)
  const projectOf = (projectId: string) => projects.find(project => project.id === projectId)

  const revisions = budgetRevisions.filter(
    revision => selectedProjectId === 'all' || taskOf(revision.taskId)?.projectId === selectedProjectId
  )

  const rows = filteredPrs.filter(pr => statusFilter === 'All' || pr.status === statusFilter)
  const openValue = filteredPrs
    .filter(pr => pr.status === 'Pending Approval' || pr.status === 'Approved')
    .reduce((sum, pr) => sum + pr.amount, 0)
  const pendingCount =
    filteredPrs.filter(pr => pr.status === 'Pending Approval').length +
    revisions.filter(revision => revision.status === 'Pending').length
  const readyForPo = filteredPrs.filter(pr => pr.status === 'Approved').length
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()
  const blockedThisMonth = auditLog.filter(
    entry => entry.action === 'blocked' && entry.entityType === 'PR' && entry.at >= monthStart
  ).length

  const confirmDecision = (reason: string) => {
    if (!decision) return
    let done = false
    switch (decision.kind) {
      case 'approve-pr':
        done = decidePr(decision.id, true, reason)
        break
      case 'reject-pr':
        done = decidePr(decision.id, false, reason)
        break
      case 'cancel-pr':
        done = cancelPr(decision.id, reason)
        break
      case 'approve-revision':
        done = decideBudgetRevision(decision.id, true, reason)
        break
      case 'reject-revision':
        done = decideBudgetRevision(decision.id, false, reason)
        break
    }
    if (done) setDecision(null)
  }

  const dialogCopy: Record<Decision['kind'], { title: string; confirm: string; optional: boolean; danger: boolean }> = {
    'approve-pr': { title: 'Approve PR', confirm: 'Approve', optional: true, danger: false },
    'reject-pr': { title: 'Reject PR', confirm: 'Reject PR', optional: false, danger: true },
    'cancel-pr': { title: 'Cancel PR', confirm: 'Cancel PR', optional: false, danger: true },
    'approve-revision': { title: 'Approve budget revision', confirm: 'Approve', optional: true, danger: false },
    'reject-revision': { title: 'Reject budget revision', confirm: 'Reject', optional: false, danger: true }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Procurement"
        title="Purchase Requisitions"
        description="Every purchase starts here. A PR can only use what is left on its work package budget; going over needs an approved budget revision."
        actions={
          canCreate && (
            <Button leftIcon={<FilePlus2 className="h-4 w-4" />} onClick={() => setRaiseOpen(true)}>
              Raise PR
            </Button>
          )
        }
        stats={
          <StatGrid>
            <StatCard label="Open PR value" value={formatINR(openValue, true)} hint="Pending and approved" icon={<Wallet className="h-4 w-4" />} />
            <StatCard
              label="Waiting for approval"
              value={pendingCount}
              hint="PRs and budget revisions"
              tone={pendingCount ? 'warning' : 'default'}
              icon={<Hourglass className="h-4 w-4" />}
            />
            <StatCard label="Ready for PO" value={readyForPo} hint="Approved, no PO yet" tone="success" icon={<PackagePlus className="h-4 w-4" />} />
            <StatCard
              label="Blocked this month"
              value={blockedThisMonth}
              hint="PRs refused by the budget limit"
              tone={blockedThisMonth ? 'danger' : 'default'}
              icon={<ShieldAlert className="h-4 w-4" />}
            />
          </StatGrid>
        }
      />

      <Card noPadding>
        <div className="flex flex-col gap-3 border-b border-slate-200/70 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-1 rounded-lg bg-slate-100/80 p-1" role="tablist">
            {(['requisitions', 'revisions'] as Tab[]).map(item => (
              <button
                key={item}
                role="tab"
                aria-selected={tab === item}
                onClick={() => setTab(item)}
                className={cn(
                  'rounded-md px-3 py-1.5 text-xs font-semibold transition-colors',
                  tab === item ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                )}
              >
                {item === 'requisitions' ? `Requisitions (${filteredPrs.length})` : `Budget revisions (${revisions.length})`}
              </button>
            ))}
          </div>
          {tab === 'requisitions' && (
            <div className="flex flex-wrap gap-1.5">
              {STATUS_FILTERS.map(status => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={cn(
                    'rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset transition-colors',
                    statusFilter === status
                      ? 'bg-blue-600 text-white ring-blue-600'
                      : 'bg-white/70 text-slate-600 ring-slate-200 hover:bg-white'
                  )}
                >
                  {status}
                </button>
              ))}
            </div>
          )}
        </div>

        {tab === 'requisitions' ? (
          rows.length === 0 ? (
            <div className="p-5">
              <EmptyState
                icon={<ClipboardList className="h-6 w-6" />}
                title={filteredPrs.length ? 'No PRs with this status' : 'No purchase requisitions yet'}
                description={
                  filteredPrs.length
                    ? 'Pick another status filter to see more.'
                    : 'Raise the first PR against a work package budget. It will wait here for approval.'
                }
                actionLabel={!filteredPrs.length && canCreate ? 'Raise PR' : undefined}
                onAction={() => setRaiseOpen(true)}
              />
            </div>
          ) : (
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>PR no.</th>
                    <th>Work package</th>
                    <th>Purpose</th>
                    <th className="num">Amount</th>
                    <th>Status</th>
                    <th>Raised by</th>
                    <th className="num">Age</th>
                    <th className="actions">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map(pr => {
                    const task = taskOf(pr.taskId)
                    const mine = pr.requestedBy === currentUser?.userId
                    const pending = pr.status === 'Pending Approval'
                    return (
                      <tr key={pr.id} className={cn(focusRecordId === pr.id && 'bg-blue-50/70')}>
                        <td className="mono-num font-medium text-slate-900">{pr.prNumber}</td>
                        <td>
                          <div className="font-medium text-slate-800">{task ? `${task.wbsNumber} ${task.name}` : '—'}</div>
                          <div className="text-xs text-slate-500">{projectOf(pr.projectId)?.code}</div>
                        </td>
                        <td className="max-w-[260px]">
                          <p className="truncate" title={pr.purpose}>
                            {pr.purpose}
                          </p>
                          {pr.rejectionReason && (
                            <p className="truncate text-xs text-rose-600" title={pr.rejectionReason}>
                              {pr.rejectionReason}
                            </p>
                          )}
                        </td>
                        <td className="num font-medium text-slate-900">{formatINR(pr.amount)}</td>
                        <td>
                          <StatusBadge status={pr.status} />
                        </td>
                        <td>
                          <div>{userName(pr.requestedBy)}</div>
                          <div className="text-xs text-slate-500">{formatDate(pr.requestedAt.slice(0, 10))}</div>
                        </td>
                        <td className="num">{pending ? `${ageDays(pr.requestedAt)} d` : '—'}</td>
                        <td className="actions">
                          <div className="flex justify-end gap-1.5">
                            {pending && canApprove && !mine && (
                              <>
                                <Button
                                  size="sm"
                                  leftIcon={<Check className="h-3.5 w-3.5" />}
                                  onClick={() => setDecision({ kind: 'approve-pr', id: pr.id, label: pr.prNumber })}
                                >
                                  Approve
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  leftIcon={<X className="h-3.5 w-3.5" />}
                                  onClick={() => setDecision({ kind: 'reject-pr', id: pr.id, label: pr.prNumber })}
                                >
                                  Reject
                                </Button>
                              </>
                            )}
                            {pending && canApprove && mine && (
                              <span className="self-center text-xs text-slate-400">Needs another approver</span>
                            )}
                            {pr.status === 'Approved' && canCreate && (
                              <Button
                                size="sm"
                                leftIcon={<PackagePlus className="h-3.5 w-3.5" />}
                                onClick={() => setPoFromPrId(pr.id)}
                              >
                                Create PO
                              </Button>
                            )}
                            {(pending || pr.status === 'Approved') && mine && canCreate && (
                              <Button
                                size="sm"
                                variant="ghost"
                                leftIcon={<Ban className="h-3.5 w-3.5" />}
                                onClick={() => setDecision({ kind: 'cancel-pr', id: pr.id, label: pr.prNumber })}
                              >
                                Cancel
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )
        ) : revisions.length === 0 ? (
          <div className="p-5">
            <EmptyState
              title="No budget revisions"
              description="When a PR is blocked by the budget limit, a revision request appears here for an approver."
            />
          </div>
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Work package</th>
                  <th className="num">Current ceiling</th>
                  <th className="num">Requested</th>
                  <th className="num">Increase</th>
                  <th>Reason</th>
                  <th>Status</th>
                  <th>Requested by</th>
                  <th className="actions">Actions</th>
                </tr>
              </thead>
              <tbody>
                {revisions.map(revision => {
                  const task = taskOf(revision.taskId)
                  const mine = revision.requestedBy === currentUser?.userId
                  const pending = revision.status === 'Pending'
                  return (
                    <tr key={revision.id} className={cn(focusRecordId === revision.id && 'bg-blue-50/70')}>
                      <td className="font-medium text-slate-800">{task ? `${task.wbsNumber} ${task.name}` : '—'}</td>
                      <td className="num">{formatINR(revision.oldBudget)}</td>
                      <td className="num font-medium text-slate-900">{formatINR(revision.newBudget)}</td>
                      <td className="num text-amber-700">+ {formatINR(revision.newBudget - revision.oldBudget)}</td>
                      <td className="max-w-[260px]">
                        <p className="truncate" title={revision.reason}>
                          {revision.reason}
                        </p>
                        {revision.decisionNote && (
                          <p className="truncate text-xs text-slate-500" title={revision.decisionNote}>
                            Note: {revision.decisionNote}
                          </p>
                        )}
                      </td>
                      <td>
                        <StatusBadge status={revision.status} />
                      </td>
                      <td>
                        <div>{userName(revision.requestedBy)}</div>
                        <div className="text-xs text-slate-500">{formatDate(revision.requestedAt.slice(0, 10))}</div>
                      </td>
                      <td className="actions">
                        {pending && canApprove && !mine ? (
                          <div className="flex justify-end gap-1.5">
                            <Button
                              size="sm"
                              onClick={() =>
                                setDecision({ kind: 'approve-revision', id: revision.id, label: task?.name ?? '' })
                              }
                            >
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                setDecision({ kind: 'reject-revision', id: revision.id, label: task?.name ?? '' })
                              }
                            >
                              Reject
                            </Button>
                          </div>
                        ) : pending && mine ? (
                          <span className="text-xs text-slate-400">Needs another approver</span>
                        ) : (
                          <span className="text-xs text-slate-400">{userName(revision.decidedBy)}</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <RaisePrModal isOpen={raiseOpen} onClose={() => setRaiseOpen(false)} />
      <SubWorkModal isOpen={poFromPrId !== null} onClose={() => setPoFromPrId(null)} defaultPrId={poFromPrId ?? undefined} />
      {decision && (
        <ReasonDialog
          isOpen
          title={`${dialogCopy[decision.kind].title}: ${decision.label}`}
          description="Your decision and reason are saved in the Activity Log."
          confirmLabel={dialogCopy[decision.kind].confirm}
          optional={dialogCopy[decision.kind].optional}
          tone={dialogCopy[decision.kind].danger ? 'danger' : 'primary'}
          onConfirm={confirmDecision}
          onClose={() => setDecision(null)}
        />
      )}
    </div>
  )
}
