import assert from 'node:assert/strict'
import { available, canApprove, canCancelPo, canCreatePo, canEditPo, canRaisePr, committed, openPr } from './capexRules.ts'

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
console.log('capexRules checks passed')
