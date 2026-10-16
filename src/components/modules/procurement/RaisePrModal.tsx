import React, { useEffect, useMemo, useState } from 'react'
import { AlertTriangle, CheckCircle2 } from 'lucide-react'
import { Modal } from '../../common/Modal'
import { Button } from '../../common/Button'
import { Select } from '../../common/Select'
import { Input } from '../../common/Input'
import { useCapex } from '../../../context/CapexContext'
import { committed, openPr } from '../../../utils/capexRules'
import { formatINR } from '../../../utils/formatters'
import { BudgetGauge } from './BudgetGauge'

interface RaisePrModalProps {
  isOpen: boolean
  onClose: () => void
  defaultTaskId?: string
}

/**
 * Raise a PR against a work package. The gauge shows the ceiling live; anything above what is left is
 * blocked here, and the user can ask for a budget revision instead.
 */
export const RaisePrModal: React.FC<RaisePrModalProps> = ({ isOpen, onClose, defaultTaskId }) => {
  const {
    projects,
    tasks,
    subWorks,
    purchaseRequisitions,
    budgetRevisions,
    selectedProjectId,
    raisePr,
    requestBudgetRevision
  } = useCapex()

  const [projectId, setProjectId] = useState('')
  const [taskId, setTaskId] = useState('')
  const [amount, setAmount] = useState('')
  const [purpose, setPurpose] = useState('')
  const [revisionReason, setRevisionReason] = useState('')
  const [newCeiling, setNewCeiling] = useState('')

  const projectTasks = useMemo(() => tasks.filter(task => task.projectId === projectId), [tasks, projectId])
  const task = tasks.find(item => item.id === taskId)

  useEffect(() => {
    if (!isOpen) return
    const preset = tasks.find(item => item.id === defaultTaskId)
    const firstProject =
      preset?.projectId ?? (selectedProjectId !== 'all' ? selectedProjectId : projects[0]?.id) ?? ''
    setProjectId(firstProject)
    setTaskId(preset?.id ?? tasks.find(item => item.projectId === firstProject)?.id ?? '')
    setAmount('')
    setPurpose('')
    setRevisionReason('')
    setNewCeiling('')
  }, [isOpen, defaultTaskId, selectedProjectId, projects, tasks])

  const value = Math.round(Number(amount) || 0)
  const taskCommitted = task ? committed(task.id, subWorks) : 0
  const taskOpen = task ? openPr(task.id, purchaseRequisitions) : 0
  const available = task ? task.budgetAmount - taskCommitted - taskOpen : 0
  const blocked = Boolean(task) && value > available
  const shortfall = value - available
  const revisionPending = budgetRevisions.some(item => item.taskId === taskId && item.status === 'Pending')
  const suggestedCeiling = task ? task.budgetAmount + Math.max(shortfall, 0) : 0

  const changeProject = (nextProjectId: string) => {
    setProjectId(nextProjectId)
    setTaskId(tasks.find(item => item.projectId === nextProjectId)?.id ?? '')
  }

  const submitPr = (event: React.FormEvent) => {
    event.preventDefault()
    if (!task || value <= 0 || !purpose.trim()) return
    if (raisePr({ projectId: task.projectId, taskId: task.id, amount: value, purpose })) onClose()
  }

  const submitRevision = () => {
    if (!task) return
    const ceiling = Math.round(Number(newCeiling) || suggestedCeiling)
    const reason = revisionReason.trim() || purpose.trim()
    if (requestBudgetRevision(task.id, ceiling, reason)) onClose()
  }

  if (!tasks.length) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title="Raise purchase requisition" maxWidth="md">
        <p className="text-sm text-slate-600">
          A PR is raised against a work package budget. Create a project and a work package with a budget under
          Planning first.
        </p>
        <div className="mt-5 flex justify-end">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </Modal>
    )
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Raise purchase requisition"
      subtitle="The PR reserves money on the work package until it is approved and turned into a PO."
      maxWidth="xl"
    >
      <form onSubmit={submitPr} className="space-y-5">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Select
            label="Project"
            value={projectId}
            onChange={event => changeProject(event.target.value)}
            options={projects.map(project => ({ value: project.id, label: `${project.code} — ${project.name}` }))}
            required
          />
          <Select
            label="Work package (budget line)"
            value={taskId}
            onChange={event => setTaskId(event.target.value)}
            options={
              projectTasks.length
                ? projectTasks.map(item => ({ value: item.id, label: `${item.wbsNumber} ${item.name}` }))
                : [{ value: '', label: 'No work packages in this project' }]
            }
            disabled={!projectTasks.length}
            required
          />
        </div>

        {task && (
          <div className="rounded-xl border border-slate-200/80 bg-white/60 p-4">
            <BudgetGauge
              budget={task.budgetAmount}
              committed={taskCommitted}
              openPr={taskOpen}
              request={value}
              requestLabel="This PR"
            />
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Input
            label="Amount incl. GST (₹)"
            type="number"
            inputMode="numeric"
            min={1}
            value={amount}
            onChange={event => setAmount(event.target.value)}
            placeholder="e.g. 500000"
            required
          />
          <div className="sm:col-span-2">
            <Input
              label="Purpose"
              value={purpose}
              onChange={event => setPurpose(event.target.value)}
              placeholder="What is being bought and why"
              required
            />
          </div>
        </div>

        {task && value > 0 && !blocked && (
          <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50/80 p-3.5 text-sm text-emerald-900">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
            <p>Within the budget. {formatINR(available - value)} will be left on this work package.</p>
          </div>
        )}

        {blocked && (
          <div className="space-y-4 rounded-xl border border-rose-200 bg-rose-50/80 p-4">
            <div className="flex items-start gap-3 text-sm text-rose-900">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <p>
                <strong>Blocked.</strong> This PR is {formatINR(shortfall)} more than what is left on the work package.
                To go ahead, ask for a budget revision. An approver with finance rights decides, and the decision is
                logged.
              </p>
            </div>
            {revisionPending ? (
              <p className="text-sm text-rose-900">A budget revision for this work package is already waiting for approval.</p>
            ) : (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <Input
                  label="New ceiling (₹)"
                  type="number"
                  value={newCeiling}
                  onChange={event => setNewCeiling(event.target.value)}
                  placeholder={String(suggestedCeiling)}
                />
                <div className="sm:col-span-2">
                  <Input
                    label="Reason for the revision"
                    value={revisionReason}
                    onChange={event => setRevisionReason(event.target.value)}
                    placeholder={purpose || 'Why the budget needs to go up'}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        <div className="flex flex-col-reverse gap-2 border-t border-slate-200/70 pt-4 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          {/* Submitting while blocked is refused by the context and recorded as a blocked attempt. */}
          <Button
            type="submit"
            variant={blocked ? 'outline' : 'primary'}
            disabled={!task || value <= 0 || !purpose.trim()}
          >
            Raise PR
          </Button>
          {blocked && (
            <Button
              type="button"
              onClick={submitRevision}
              disabled={revisionPending || !(revisionReason.trim() || purpose.trim())}
            >
              Request budget revision
            </Button>
          )}
        </div>
      </form>
    </Modal>
  )
}
