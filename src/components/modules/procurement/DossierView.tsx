import React, { useMemo, useState } from 'react'
import { AlertTriangle, CheckCircle2, CircleDashed, FileSearch, Paperclip, Pencil } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription } from '../../common/Card'
import { Button } from '../../common/Button'
import { EmptyState } from '../../common/EmptyState'
import { PageHeader } from '../../common/PageHeader'
import { Badge, StatusBadge } from '../../common/Badge'
import { useCapex } from '../../../context/CapexContext'
import type { DocumentCategory, ProjectDocument } from '../../../types/capex'
import { documentsForPo, getExceptions } from '../../../utils/exceptions'
import { committed, openPr } from '../../../utils/capexRules'
import { formatDate, formatINR } from '../../../utils/formatters'
import { cn } from '../../../utils/cn'
import { SubWorkModal } from '../planning/SubWorkModal'
import { DocumentModal } from '../document/DocumentModal'
import { BudgetGauge } from './BudgetGauge'
import { KeyValue } from '../../common/KeyValue'

type StepState = 'done' | 'missing' | 'warning'

interface Step {
  title: string
  state: StepState
  detail: string
  reference?: string
  attach?: DocumentCategory
}

const STEP_ICON: Record<StepState, React.ReactNode> = {
  done: <CheckCircle2 className="h-5 w-5 text-emerald-600" />,
  warning: <AlertTriangle className="h-5 w-5 text-amber-500" />,
  missing: <CircleDashed className="h-5 w-5 text-rose-500" />
}

const docLabel = (docs: ProjectDocument[]) =>
  docs.map(doc => `${doc.name} (${doc.status.toLowerCase()})`).join(', ')

export const DossierView: React.FC = () => {
  const {
    filteredSubWorks,
    subWorks,
    tasks,
    projects,
    purchaseRequisitions,
    budgetRevisions,
    documents,
    auditLog,
    userPermissions,
    hasPermission,
    focusRecordId
  } = useCapex()

  const [poId, setPoId] = useState(() =>
    filteredSubWorks.some(po => po.id === focusRecordId) ? focusRecordId : (filteredSubWorks[0]?.id ?? '')
  )
  const [editOpen, setEditOpen] = useState(false)
  const [attach, setAttach] = useState<DocumentCategory | null>(null)

  const po = subWorks.find(item => item.id === poId) ?? filteredSubWorks[0]
  const pr = purchaseRequisitions.find(item => item.id === po?.prId)
  const task = tasks.find(item => item.id === po?.taskId)
  const project = projects.find(item => item.id === po?.projectId)
  const userName = (userId?: string) => userPermissions.find(user => user.userId === userId)?.userName ?? '—'

  const exceptions = useMemo(
    () =>
      po
        ? getExceptions({ tasks, subWorks, purchaseRequisitions, documents, budgetRevisions }).filter(
            item => item.recordId === po.id || (item.recordType === 'task' && item.recordId === po.taskId)
          )
        : [],
    [po, tasks, subWorks, purchaseRequisitions, documents, budgetRevisions]
  )

  // Stable object so the document form is not reset on every re-render while it is open.
  const attachLink = useMemo(() => {
    if (!attach || !po) return undefined
    const toPr = (attach === 'Capex Proposal' || attach === 'Quote Comparison') && pr
    return {
      type: toPr ? ('Purchase Requisition' as const) : ('Sub-work' as const),
      recordId: toPr ? pr.id : po.id,
      projectId: po.projectId,
      category: attach
    }
  }, [attach, po, pr])

  const history = useMemo(
    () =>
      po
        ? auditLog.filter(entry => entry.entityId === po.id || (pr && entry.entityId === pr.id))
        : [],
    [auditLog, po, pr]
  )

  if (!po) {
    return (
      <div className="space-y-6">
        <PageHeader
          eyebrow="Procurement"
          title="PO Dossier"
          description="Everything an auditor asks about one purchase order, on one page."
        />
        <Card>
          <EmptyState
            icon={<FileSearch className="h-6 w-6" />}
            title="No purchase orders yet"
            description="A dossier appears once a PO is created from an approved PR."
          />
        </Card>
      </div>
    )
  }

  const evidence = documentsForPo(po, documents)
  const byCategory = (category: DocumentCategory) => evidence.filter(doc => doc.category === category)
  const docStep = (title: string, category: DocumentCategory, missingText: string): Step => {
    const docs = byCategory(category)
    return docs.length
      ? { title, state: 'done', detail: docLabel(docs), reference: formatDate(docs[0].uploadDate) }
      : { title, state: 'missing', detail: missingText, attach: category }
  }

  const quoteNeedsReason =
    ((po.quotesCompared ?? 0) < 3 || po.lowestQuoteSelected === false) && !po.selectionJustification?.trim()

  const steps: Step[] = [
    docStep('Capex proposal', 'Capex Proposal', 'The signed capex proposal is not attached.'),
    {
      ...docStep('Quote comparison', 'Quote Comparison', 'The quote comparison sheet is not attached.'),
      ...(quoteNeedsReason && byCategory('Quote Comparison').length
        ? { state: 'warning' as const, detail: 'Attached, but the reason for choosing this vendor is missing.' }
        : {})
    },
    pr
      ? {
          title: 'Purchase requisition',
          state: 'done',
          detail: `${pr.prNumber} for ${formatINR(pr.amount)}, raised by ${userName(pr.requestedBy)}, approved by ${userName(pr.approvedBy)}.`,
          reference: pr.approvedAt ? formatDate(pr.approvedAt.slice(0, 10)) : undefined
        }
      : { title: 'Purchase requisition', state: 'missing', detail: 'No PR is linked to this PO.' },
    {
      ...docStep('Purchase order', 'PO Copy', `PO ${po.poNumber} is recorded, but the PO copy is not attached.`),
      ...(byCategory('PO Copy').length ? {} : { state: 'warning' as const }),
      reference: po.poNumber
    },
    po.grnNumber
      ? {
          title: 'Goods receipt (GRN)',
          state: byCategory('GRN').length ? 'done' : 'warning',
          detail: byCategory('GRN').length ? docLabel(byCategory('GRN')) : 'GRN number recorded; document not attached.',
          reference: `${po.grnNumber}${po.grnDate ? ` · ${formatDate(po.grnDate)}` : ''}`,
          attach: byCategory('GRN').length ? undefined : 'GRN'
        }
      : { title: 'Goods receipt (GRN)', state: 'missing', detail: 'No goods receipt recorded yet.' },
    po.invoiceNumber
      ? {
          title: 'Vendor invoice',
          state: byCategory('Invoice').length ? 'done' : 'warning',
          detail: byCategory('Invoice').length
            ? docLabel(byCategory('Invoice'))
            : 'Invoice number recorded; document not attached.',
          reference: `${po.invoiceNumber}${po.invoiceDate ? ` · ${formatDate(po.invoiceDate)}` : ''}`,
          attach: byCategory('Invoice').length ? undefined : 'Invoice'
        }
      : { title: 'Vendor invoice', state: 'missing', detail: 'No invoice recorded yet.' },
    po.status === 'Paid'
      ? {
          title: 'Payment',
          state: po.payeeBpCode && po.payeeBpCode !== po.bpCode ? 'warning' : 'done',
          detail:
            po.payeeBpCode && po.payeeBpCode !== po.bpCode
              ? `Paid to BP ${po.payeeBpCode}, not the vendor BP ${po.bpCode}.`
              : `Paid to ${po.supplierName} (BP ${po.bpCode}).`,
          reference: po.paidDate ? formatDate(po.paidDate) : undefined
        }
      : {
          title: 'Payment',
          state: 'missing',
          detail: po.status === 'Cancelled' ? 'PO cancelled; no payment due.' : 'Not paid yet.'
        }
  ]

  const doneCount = steps.filter(step => step.state === 'done').length
  const paid = po.status === 'Paid' ? po.poValueGst : 0
  const canEdit = hasPermission('planning', 'edit') && po.status !== 'Cancelled'
  const canAttach = hasPermission('document', 'create')

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Procurement"
        title="PO Dossier"
        description="Everything an auditor asks about one purchase order, on one page: why it was bought, who approved it, the evidence and the money."
        actions={
          canEdit && (
            <Button variant="outline" leftIcon={<Pencil className="h-4 w-4" />} onClick={() => setEditOpen(true)}>
              Edit PO
            </Button>
          )
        }
      />

      <Card className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="w-full lg:max-w-md">
          <label htmlFor="dossier-po" className="field-label">
            Purchase order
          </label>
          <select id="dossier-po" className="field-control" value={po.id} onChange={event => setPoId(event.target.value)}>
            {filteredSubWorks.map(item => (
              <option key={item.id} value={item.id}>
                {item.poNumber} · {item.supplierName} · {formatINR(item.poValueGst)}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={po.status} />
          <Badge variant={doneCount === steps.length ? 'success' : 'warning'}>
            {doneCount} of {steps.length} steps evidenced
          </Badge>
          {exceptions.length > 0 && <Badge variant="danger">{exceptions.length} open exception(s)</Badge>}
        </div>
      </Card>

      <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Document chain</CardTitle>
              <CardDescription>
                {project?.code} · {task ? `${task.wbsNumber} ${task.name}` : 'Work package removed'} · {po.supplierName}
              </CardDescription>
            </div>
          </CardHeader>
          <ol className="relative space-y-0">
            {steps.map((step, index) => (
              <li key={step.title} className="relative flex gap-4 pb-5 last:pb-0">
                {index < steps.length - 1 && (
                  <span className="absolute left-[9px] top-6 bottom-0 w-px bg-slate-200" aria-hidden="true" />
                )}
                <span className="relative z-10 mt-0.5 shrink-0 rounded-full bg-white">{STEP_ICON[step.state]}</span>
                <div className="flex min-w-0 flex-1 flex-col gap-1 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-900">{step.title}</p>
                    <p className={cn('text-sm', step.state === 'missing' ? 'text-rose-600' : 'text-slate-500')}>
                      {step.detail}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    {step.reference && <span className="mono-num text-xs text-slate-500">{step.reference}</span>}
                    {step.attach && canAttach && (
                      <Button
                        size="sm"
                        variant="outline"
                        leftIcon={<Paperclip className="h-3.5 w-3.5" />}
                        onClick={() => setAttach(step.attach!)}
                      >
                        Attach
                      </Button>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Money trail</CardTitle>
            </CardHeader>
            <dl className="space-y-2 text-sm">
              <KeyValue label="Work package budget" value={task ? formatINR(task.budgetAmount) : '—'} />
              <KeyValue label="PR amount" value={pr ? formatINR(pr.amount) : '—'} />
              <KeyValue label="PO value (incl. GST)" value={formatINR(po.poValueGst)} />
              <KeyValue label="Paid" value={formatINR(paid)} />
              <KeyValue
                label="Balance to pay"
                value={formatINR(po.status === 'Cancelled' ? 0 : po.poValueGst - paid)}
                className="border-t border-slate-200 pt-2 font-semibold"
              />
            </dl>
            {task && (
              <div className="mt-5 border-t border-slate-200/70 pt-4">
                <p className="mb-3 text-xs font-semibold uppercase tracking-[0.06em] text-slate-500">
                  Work package ceiling
                </p>
                <BudgetGauge
                  budget={task.budgetAmount}
                  committed={committed(task.id, subWorks)}
                  openPr={openPr(task.id, purchaseRequisitions)}
                />
              </div>
            )}
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Vendor selection</CardTitle>
            </CardHeader>
            <dl className="space-y-2 text-sm">
              <KeyValue label="Quotes compared" value={po.quotesCompared ?? 0} />
              <KeyValue
                label="Lowest quote selected"
                mono={false}
                value={po.lowestQuoteSelected === false ? <Badge variant="warning">No</Badge> : <Badge variant="success">Yes</Badge>}
              />
              <KeyValue label="Vendor BP" value={po.bpCode} />
              <KeyValue
                label="Payee BP"
                value={po.payeeBpCode || po.bpCode}
                valueClass={po.payeeBpCode && po.payeeBpCode !== po.bpCode ? 'text-rose-600' : 'text-slate-900'}
              />
            </dl>
            <div className="mt-4 rounded-lg bg-slate-50/80 p-3 text-sm">
              <p className="text-xs font-semibold text-slate-500">Reason for selection</p>
              <p className={cn('mt-1', quoteNeedsReason ? 'text-rose-600' : 'text-slate-700')}>
                {po.selectionJustification?.trim() || (quoteNeedsReason ? 'Missing. Required for this PO.' : 'Lowest of 3+ quotes; no reason needed.')}
              </p>
            </div>
          </Card>

          {exceptions.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Open exceptions</CardTitle>
              </CardHeader>
              <ul className="space-y-3">
                {exceptions.map(item => (
                  <li key={item.id} className="flex items-start gap-3 text-sm">
                    <StatusBadge status={item.severity} />
                    <div className="min-w-0">
                      <p className="font-medium text-slate-800">{item.title}</p>
                      <p className="text-slate-500">{item.detail}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </div>
      </div>

      <Card noPadding>
        <div className="border-b border-slate-200/70 px-5 py-4">
          <h3 className="font-heading text-base font-semibold text-slate-900">History of this PO and its PR</h3>
          <p className="text-xs text-slate-500">From the Activity Log, newest first.</p>
        </div>
        {history.length === 0 ? (
          <p className="px-5 py-6 text-sm text-slate-500">No recorded activity.</p>
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>When</th>
                  <th>Who</th>
                  <th>Action</th>
                  <th>Record</th>
                  <th>Change</th>
                </tr>
              </thead>
              <tbody>
                {history.map(entry => (
                  <tr key={entry.id}>
                    <td className="mono-num whitespace-nowrap text-xs">{new Date(entry.at).toLocaleString('en-IN')}</td>
                    <td>{entry.userName}</td>
                    <td>
                      <StatusBadge status={entry.action} />
                    </td>
                    <td className="mono-num text-xs">{entry.entityLabel}</td>
                    <td className="text-xs text-slate-600">
                      {entry.before || entry.after ? `${entry.before ?? '—'} → ${entry.after ?? '—'}` : '—'}
                      {entry.reason && <div className="text-slate-500">Reason: {entry.reason}</div>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <SubWorkModal isOpen={editOpen} onClose={() => setEditOpen(false)} subWorkToEdit={po} />
      <DocumentModal
        isOpen={attach !== null}
        onClose={() => setAttach(null)}
        defaultLink={attachLink}
      />
    </div>
  )
}
