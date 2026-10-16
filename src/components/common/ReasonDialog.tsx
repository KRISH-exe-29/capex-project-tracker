import React, { useEffect, useState } from 'react'
import { Modal } from './Modal'
import { Button } from './Button'

interface ReasonDialogProps {
  isOpen: boolean
  title: string
  description: string
  confirmLabel: string
  /** Whether an empty reason is allowed (e.g. approving). */
  optional?: boolean
  tone?: 'primary' | 'danger'
  onConfirm: (reason: string) => void
  onClose: () => void
}

/** Asks for a written reason before a decision that goes into the Activity Log. */
export const ReasonDialog: React.FC<ReasonDialogProps> = ({
  isOpen,
  title,
  description,
  confirmLabel,
  optional = false,
  tone = 'primary',
  onConfirm,
  onClose
}) => {
  const [reason, setReason] = useState('')

  useEffect(() => {
    if (isOpen) setReason('')
  }, [isOpen])

  const submit = (event: React.FormEvent) => {
    event.preventDefault()
    if (!optional && !reason.trim()) return
    onConfirm(reason.trim())
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} subtitle={description} maxWidth="sm">
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label htmlFor="decision-reason" className="field-label">
            Reason{!optional && <span className="ml-1 text-rose-500">*</span>}
          </label>
          <textarea
            id="decision-reason"
            className="field-control"
            rows={3}
            value={reason}
            onChange={event => setReason(event.target.value)}
            placeholder={optional ? 'Optional note for the record' : 'This is saved in the Activity Log'}
            autoFocus
          />
        </div>
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" onClick={onClose}>
            Back
          </Button>
          <Button type="submit" variant={tone} disabled={!optional && !reason.trim()}>
            {confirmLabel}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
