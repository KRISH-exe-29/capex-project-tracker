import type { BudgetRevision, ProjectDocument, PurchaseRequisition, SubWork, Task } from '../types/capex'
import { available } from './capexRules'
import { formatINR } from './formatters'

export type ExceptionSeverity = 'Audit risk' | 'Control gap' | 'Data quality'
export type ExceptionRecordType = 'po' | 'pr' | 'task' | 'revision'

export interface CapexException {
  id: string
  severity: ExceptionSeverity
  title: string
  detail: string
  recordType: ExceptionRecordType
  recordId: string
  /** Short reference shown on the row, e.g. the PO or PR number. */
  reference: string
}

export interface ExceptionInput {
  tasks: Task[]
  subWorks: SubWork[]
  purchaseRequisitions: PurchaseRequisition[]
  documents: ProjectDocument[]
  budgetRevisions: BudgetRevision[]
}

export const REQUIRED_PO_DOCUMENTS: ProjectDocument['category'][] = ['Capex Proposal', 'Quote Comparison', 'PO Copy']
const STALE_DAYS = 7
const DAY_MS = 86_400_000

/** Documents that count as evidence for a PO: linked to the PO itself or to its PR, and not drafts. */
export function documentsForPo(po: SubWork, documents: ProjectDocument[]): ProjectDocument[] {
  return documents.filter(
    doc =>
      doc.status !== 'Draft' &&
      ((doc.wbsType === 'Sub-work' && doc.wbsRecordId === po.id) ||
        (!!po.prId && doc.wbsType === 'Purchase Requisition' && doc.wbsRecordId === po.prId))
  )
}

const normaliseSupplier = (name: string) =>
  name
    .toLowerCase()
    .replace(/\b(private|pvt|limited|ltd|llp|co|company)\b\.?/g, '')
    .replace(/[^a-z0-9]/g, '')

const ageInDays = (iso: string, now: number) => Math.floor((now - new Date(iso).getTime()) / DAY_MS)

export function getExceptions(input: ExceptionInput, now = Date.now()): CapexException[] {
  const { tasks, subWorks, purchaseRequisitions: prs, documents, budgetRevisions } = input
  const items: CapexException[] = []
  const push = (item: Omit<CapexException, 'id'>) =>
    items.push({ ...item, id: `${item.title}:${item.recordId}` })

  // 1. Budget line over its ceiling
  tasks.forEach(task => {
    const left = available(task, subWorks, prs)
    if (left < 0) {
      push({
        severity: 'Audit risk',
        title: 'Work package over budget',
        detail: `POs and open PRs exceed the ${formatINR(task.budgetAmount)} budget by ${formatINR(-left)}.`,
        recordType: 'task',
        recordId: task.id,
        reference: `${task.wbsNumber} ${task.name}`
      })
    }
  })

  const livePos = subWorks.filter(po => po.status !== 'Cancelled')

  livePos.forEach(po => {
    // 4. PO without a PR
    if (!po.prId || !prs.some(pr => pr.id === po.prId)) {
      push({
        severity: 'Audit risk',
        title: 'PO without a purchase requisition',
        detail: 'No approved PR is linked, so the spend was never checked against the budget line.',
        recordType: 'po',
        recordId: po.id,
        reference: po.poNumber
      })
    }

    // 3. Paying someone other than the vendor
    if (po.payeeBpCode && po.bpCode && po.payeeBpCode.trim() !== po.bpCode.trim()) {
      push({
        severity: 'Audit risk',
        title: 'Payee differs from the vendor',
        detail: `Vendor BP ${po.bpCode} (${po.supplierName}); payment goes to BP ${po.payeeBpCode}.`,
        recordType: 'po',
        recordId: po.id,
        reference: po.poNumber
      })
    }

    // 5. Billed or paid without GRN and invoice
    if ((po.status === 'Billed' || po.status === 'Paid') && (!po.grnNumber || !po.invoiceNumber)) {
      const missing = [!po.grnNumber && 'GRN', !po.invoiceNumber && 'invoice'].filter(Boolean).join(' and ')
      push({
        severity: 'Control gap',
        title: `${po.status} without ${missing}`,
        detail: `The PO is marked ${po.status.toLowerCase()} but no ${missing} number is recorded.`,
        recordType: 'po',
        recordId: po.id,
        reference: po.poNumber
      })
    }

    // 6. Required documents
    const categories = new Set(documentsForPo(po, documents).map(doc => doc.category))
    const missingDocs = REQUIRED_PO_DOCUMENTS.filter(category => !categories.has(category))
    if (missingDocs.length) {
      push({
        severity: 'Control gap',
        title: 'PO missing required documents',
        detail: `Not attached: ${missingDocs.join(', ')}.`,
        recordType: 'po',
        recordId: po.id,
        reference: po.poNumber
      })
    }

    // 7. Quote selection without a written reason
    const fewQuotes = (po.quotesCompared ?? 0) < 3
    const notLowest = po.lowestQuoteSelected === false
    if ((fewQuotes || notLowest) && !po.selectionJustification?.trim()) {
      push({
        severity: 'Control gap',
        title: notLowest ? 'Lowest quote not selected, no reason given' : 'Fewer than 3 quotes, no reason given',
        detail: `${po.quotesCompared ?? 0} quote(s) compared. Record why this vendor was chosen.`,
        recordType: 'po',
        recordId: po.id,
        reference: po.poNumber
      })
    }
  })

  // 2. Same PO number used twice
  const byNumber = new Map<string, SubWork[]>()
  livePos.forEach(po => {
    const key = po.poNumber.trim().toUpperCase()
    if (key) byNumber.set(key, [...(byNumber.get(key) ?? []), po])
  })
  byNumber.forEach(group => {
    if (group.length > 1) {
      push({
        severity: 'Data quality',
        title: 'Duplicate PO number',
        detail: `${group.length} POs share this number (${group.map(po => po.supplierName).join(', ')}).`,
        recordType: 'po',
        recordId: group[0].id,
        reference: group[0].poNumber
      })
    }
  })

  // 8. One BP code, several supplier spellings
  const byBp = new Map<string, Set<string>>()
  subWorks.forEach(po => {
    const bp = po.bpCode.trim()
    if (bp) byBp.set(bp, new Set([...(byBp.get(bp) ?? []), po.supplierName.trim()]))
  })
  byBp.forEach((names, bp) => {
    const distinct = new Set([...names].map(normaliseSupplier))
    if (names.size > 1) {
      const po = subWorks.find(item => item.bpCode.trim() === bp)!
      push({
        severity: 'Data quality',
        title: distinct.size > 1 ? 'One BP code, different suppliers' : 'Supplier name spelled differently',
        detail: `BP ${bp}: ${[...names].join(' / ')}.`,
        recordType: 'po',
        recordId: po.id,
        reference: `BP ${bp}`
      })
    }
  })

  // 9. Approvals waiting too long
  prs
    .filter(pr => pr.status === 'Pending Approval' && ageInDays(pr.requestedAt, now) > STALE_DAYS)
    .forEach(pr =>
      push({
        severity: 'Control gap',
        title: `PR waiting over ${STALE_DAYS} days`,
        detail: `Raised ${ageInDays(pr.requestedAt, now)} days ago for ${formatINR(pr.amount)}.`,
        recordType: 'pr',
        recordId: pr.id,
        reference: pr.prNumber
      })
    )
  budgetRevisions
    .filter(revision => revision.status === 'Pending' && ageInDays(revision.requestedAt, now) > STALE_DAYS)
    .forEach(revision => {
      const task = tasks.find(item => item.id === revision.taskId)
      push({
        severity: 'Control gap',
        title: `Budget revision waiting over ${STALE_DAYS} days`,
        detail: `${formatINR(revision.oldBudget)} → ${formatINR(revision.newBudget)}.`,
        recordType: 'revision',
        recordId: revision.id,
        reference: task ? `${task.wbsNumber} ${task.name}` : 'Work package'
      })
    })

  const order: Record<ExceptionSeverity, number> = { 'Audit risk': 0, 'Control gap': 1, 'Data quality': 2 }
  return items.sort((a, b) => order[a.severity] - order[b.severity])
}
