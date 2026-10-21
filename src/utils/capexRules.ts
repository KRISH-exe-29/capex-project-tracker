export type RuleResult = { ok: boolean; reason?: string }

type BudgetTask = { id: string; projectId: string; budgetAmount: number }
type RulePr = { id: string; projectId: string; taskId: string; amount: number; status: string }
type RulePayment = { taxableAmount: number; gstAmount: number; reversed?: unknown }
type RulePo = {
  taskId: string
  poValueGst: number
  status: string
  invoiceNumber?: string
  paidDate?: string
  payments?: RulePayment[]
}

const money = (value: number) => Math.round(Number(value) || 0)

/** Once a PO is billed, paid or invoiced its value is real spend: it can no longer shrink, grow or be cancelled. */
export function isSettled(po: RulePo): boolean {
  return (
    po.status === 'Billed' ||
    po.status === 'Part Paid' ||
    po.status === 'Paid' ||
    Boolean(po.invoiceNumber?.trim()) ||
    Boolean(po.paidDate) ||
    // A reversed payment still counts: the value was settled once, so it stays locked.
    Boolean(po.payments?.length)
  )
}

export const paymentTotal = (payment: RulePayment) => money(payment.taxableAmount) + money(payment.gstAmount)

/** Sum of live (not reversed) payments, taxable + GST. */
export function paidTotal(po: RulePo): number {
  return (po.payments ?? []).filter(item => !item.reversed).reduce((sum, item) => sum + paymentTotal(item), 0)
}

/** Status after payments: fully paid → Paid, some paid → Part Paid, none → the status before any payment. */
export function statusAfterPayments<S extends string>(po: RulePo, unpaidStatus: S): S | 'Part Paid' | 'Paid' {
  const paid = paidTotal(po)
  if (paid <= 0) return unpaidStatus
  return paid >= money(po.poValueGst) ? 'Paid' : 'Part Paid'
}

export function canAddPayment(po: RulePo, taxableAmount: number, gstAmount: number): RuleResult {
  if (po.status === 'Cancelled') return { ok: false, reason: 'A cancelled PO cannot be paid.' }
  if (money(taxableAmount) <= 0) return { ok: false, reason: 'Taxable amount must be greater than zero.' }
  if (money(gstAmount) < 0) return { ok: false, reason: 'GST amount cannot be negative.' }
  const balance = money(po.poValueGst) - paidTotal(po)
  if (money(taxableAmount) + money(gstAmount) > balance)
    return { ok: false, reason: `Payment exceeds the PO balance to be paid (₹${balance.toLocaleString('en-IN')}).` }
  return { ok: true }
}

/** Master sheet "Project Status" for a work package. */
export function deliveryStatus(
  task: { id: string; stage?: string },
  subWorks: RulePo[]
): 'PO to be placed' | 'PO placed work in progress' | 'Work completed' {
  if (task.stage === 'Project Handed Over') return 'Work completed'
  return subWorks.some(po => po.taskId === task.id && po.status !== 'Cancelled')
    ? 'PO placed work in progress'
    : 'PO to be placed'
}

export function canCancelPo(po: RulePo): RuleResult {
  if (po.status === 'Cancelled') return { ok: false, reason: 'The PO is already cancelled.' }
  if (isSettled(po)) return { ok: false, reason: 'A billed, invoiced or paid PO cannot be cancelled.' }
  return { ok: true }
}

export function committed(taskId: string, subWorks: RulePo[]): number {
  return subWorks
    .filter(item => item.taskId === taskId && item.status !== 'Cancelled')
    .reduce((sum, item) => sum + money(item.poValueGst), 0)
}

export function openPr(taskId: string, requisitions: RulePr[], excludePrId?: string): number {
  return requisitions
    .filter(
      item =>
        item.taskId === taskId &&
        item.id !== excludePrId &&
        (item.status === 'Pending Approval' || item.status === 'Approved')
    )
    .reduce((sum, item) => sum + money(item.amount), 0)
}

export function available(task: BudgetTask, subWorks: RulePo[], requisitions: RulePr[]): number {
  return money(task.budgetAmount) - committed(task.id, subWorks) - openPr(task.id, requisitions)
}

export function canRaisePr(
  task: BudgetTask,
  amount: number,
  purpose: string,
  subWorks: RulePo[],
  requisitions: RulePr[]
): RuleResult {
  if (money(amount) <= 0) return { ok: false, reason: 'PR amount must be greater than zero.' }
  if (!purpose.trim()) return { ok: false, reason: 'PR purpose is required.' }
  if (money(amount) > available(task, subWorks, requisitions))
    return { ok: false, reason: 'PR exceeds the available budget.' }
  return { ok: true }
}

export function canCreatePo(
  task: BudgetTask,
  pr: RulePr | undefined,
  value: number,
  subWorks: RulePo[],
  requisitions: RulePr[]
): RuleResult {
  if (!pr || pr.status !== 'Approved' || pr.taskId !== task.id || pr.projectId !== task.projectId)
    return { ok: false, reason: 'An approved PR for this work package is required.' }
  const headroom =
    money(task.budgetAmount) - committed(task.id, subWorks) - openPr(task.id, requisitions, pr.id)
  if (money(value) <= 0 || money(value) > Math.min(money(pr.amount), headroom))
    return { ok: false, reason: 'PO value exceeds its PR or budget headroom.' }
  return { ok: true }
}

export function canEditPo(
  task: BudgetTask,
  current: RulePo,
  newValue: number,
  subWorks: RulePo[],
  requisitions: RulePr[]
): RuleResult {
  if (money(newValue) !== money(current.poValueGst) && isSettled(current)) {
    return { ok: false, reason: 'The value of a billed, invoiced or paid PO cannot change.' }
  }
  const limit = money(current.poValueGst) + available(task, subWorks, requisitions)
  if (money(newValue) <= 0 || money(newValue) > limit)
    return { ok: false, reason: 'PO value exceeds the budget ceiling.' }
  return { ok: true }
}

export function canApprove(
  record: { requestedBy: string },
  actorId: string,
  hasFinanceApproval: boolean
): RuleResult {
  if (!hasFinanceApproval) return { ok: false, reason: 'You do not have approval permission.' }
  if (record.requestedBy === actorId)
    return { ok: false, reason: 'Requesters cannot approve their own request.' }
  return { ok: true }
}
