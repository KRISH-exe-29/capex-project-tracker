import assert from 'node:assert/strict'
import { closeGapAfter, nextProjectCode, parseProjectCode } from './projectCodes.ts'
import {
  available,
  canAddPayment,
  canApprove,
  canCancelPo,
  canCreatePo,
  canEditPo,
  canRaisePr,
  committed,
  deliveryStatus,
  isSettled,
  openPr,
  paidTotal,
  statusAfterPayments
} from './capexRules.ts'

const task = { id: 'task-1', projectId: 'project-1', budgetAmount: 1_000_000 }
const approved = {
  id: 'pr-1',
  projectId: 'project-1',
  taskId: 'task-1',
  amount: 600_000,
  status: 'Approved' as const,
  requestedBy: 'u-1'
}
const pending = {
  id: 'pr-2',
  projectId: 'project-1',
  taskId: 'task-1',
  amount: 500_000,
  status: 'Pending Approval' as const,
  requestedBy: 'u-2'
}

assert.equal(available(task, [], [approved]), 400_000)
assert.equal(canCreatePo(task, approved, 600_001, [], [approved]).ok, false)
assert.equal(canCreatePo(task, approved, 600_000, [], [approved]).ok, true)
assert.equal(canRaisePr(task, 500_000, 'More work', [], [approved]).ok, false)
assert.equal(canRaisePr(task, 600_000, 'First request', [], []).ok, true)
assert.equal(canRaisePr(task, 600_000, 'Second request', [], [{ ...pending, amount: 600_000 }]).ok, false)
assert.equal(committed(task.id, [{ taskId: task.id, poValueGst: 600_000, status: 'Cancelled' }]), 0)
assert.equal(openPr(task.id, [{ ...approved, status: 'Converted to PO' }]), 0)
const po = { taskId: task.id, poValueGst: 600_000, status: 'PO Issued' }
assert.equal(canEditPo(task, po, 1_000_001, [po], []).ok, false)
assert.equal(canApprove({ requestedBy: 'u-1' }, 'u-1', true).ok, false)
assert.equal(canApprove({ requestedBy: 'u-1' }, 'u-2', true).ok, true)
// Settled POs are locked: no cancelling, no value change (in either direction)
const paid = { taskId: task.id, poValueGst: 1_000_000, status: 'Paid', paidDate: '2026-10-01' }
assert.equal(canCancelPo(paid).ok, false)
assert.equal(canCancelPo({ ...po, invoiceNumber: 'INV-1' }).ok, false)
assert.equal(canCancelPo(po).ok, true)
assert.equal(canEditPo(task, paid, 1, [paid], []).ok, false)
assert.equal(canEditPo(task, { ...po, status: 'Billed' }, 500_000, [po], []).ok, false)
assert.equal(canEditPo(task, po, 500_000, [po], []).ok, true)
// Project codes: CPX-<year>-<nn>, next = highest + 1 in that year
assert.equal(nextProjectCode([], 2026), 'CPX-2026-01')
assert.equal(nextProjectCode(['CPX-2026-01', 'CPX-2026-02', 'CPX-2025-07', 'CPX-100'], 2026), 'CPX-2026-03')
assert.equal(nextProjectCode(['CPX-2026-01', 'CPX-2026-05'], 2026), 'CPX-2026-06')
assert.equal(nextProjectCode(['CPX-2025-09'], 2026), 'CPX-2026-01')
assert.equal(nextProjectCode(Array.from({ length: 99 }, (_, i) => `CPX-2026-${String(i + 1).padStart(2, '0')}`), 2026), 'CPX-2026-100')
assert.deepEqual(parseProjectCode('cpx-2026-07'), { year: 2026, seq: 7 })
assert.equal(parseProjectCode('CPX-100'), null)
// Deleting 06 of 10 and closing the gap: 07..10 become 06..09, other years untouched
const ten = Array.from({ length: 10 }, (_, i) => ({ id: `p${i + 1}`, code: `CPX-2026-${String(i + 1).padStart(2, '0')}` }))
const remaining = [...ten.filter(p => p.code !== 'CPX-2026-06'), { id: 'old', code: 'CPX-2025-08' }]
assert.deepEqual(
  closeGapAfter('CPX-2026-06', remaining).map(r => `${r.from}>${r.to}`),
  ['CPX-2026-07>CPX-2026-06', 'CPX-2026-08>CPX-2026-07', 'CPX-2026-09>CPX-2026-08', 'CPX-2026-10>CPX-2026-09']
)
assert.deepEqual(closeGapAfter('CPX-2026-10', remaining.filter(p => p.code !== 'CPX-2026-10')), [])
// Part payments: PO 2521130018 (₹3,83,50,000 incl. GST) paid in instalments of taxable + 18% GST
const crane = { taskId: task.id, poValueGst: 38_350_000, status: 'PO Issued', payments: [] as { taxableAmount: number; gstAmount: number; reversed?: unknown }[] }
assert.equal(canAddPayment(crane, 6_000_000, 1_080_000).ok, true)
crane.payments.push({ taxableAmount: 6_000_000, gstAmount: 1_080_000 })
assert.equal(paidTotal(crane), 7_080_000)
assert.equal(statusAfterPayments(crane, 'PO Issued'), 'Part Paid')
assert.equal(isSettled(crane), true)
assert.equal(canCancelPo(crane).ok, false)
assert.equal(canAddPayment(crane, 26_500_000, 4_770_001).ok, false) // ₹1 over the balance
assert.equal(canAddPayment(crane, 0, 0).ok, false)
crane.payments.push({ taxableAmount: 26_500_000, gstAmount: 4_770_000 })
assert.equal(statusAfterPayments(crane, 'PO Issued'), 'Paid')
assert.equal(canAddPayment(crane, 1, 0).ok, false)
// Reversed payments stop counting, but the PO value stays locked
crane.payments[1].reversed = { reason: 'Duplicate entry' }
assert.equal(paidTotal(crane), 7_080_000)
assert.equal(statusAfterPayments(crane, 'Billed'), 'Part Paid')
crane.payments[0].reversed = { reason: 'Wrong PO' }
assert.equal(statusAfterPayments(crane, 'Billed'), 'Billed')
assert.equal(isSettled({ ...crane, status: 'Billed' }), true)
assert.equal(canAddPayment({ ...crane, status: 'Cancelled' }, 1, 0).ok, false)
// Master sheet Project Status, derived from POs and stage
assert.equal(deliveryStatus({ id: 'task-x' }, [po]), 'PO to be placed')
assert.equal(deliveryStatus({ id: task.id, stage: 'Dispatched' }, [po]), 'PO placed work in progress')
assert.equal(deliveryStatus({ id: task.id }, [{ ...po, status: 'Cancelled' }]), 'PO to be placed')
assert.equal(deliveryStatus({ id: task.id, stage: 'Project Handed Over' }, [po]), 'Work completed')
console.log('capexRules checks passed')
