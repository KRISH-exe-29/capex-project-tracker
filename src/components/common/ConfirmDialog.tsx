import React from 'react'
import { AlertTriangle } from 'lucide-react'
import { Modal } from './Modal'
import { Button } from './Button'

interface ConfirmDialogProps {
  isOpen: boolean
  title: string
  message: React.ReactNode
  confirmLabel: string
  onConfirm: () => void
  onClose: () => void
}

/** Confirmation step for destructive actions. */
export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({ isOpen, title, message, confirmLabel, onConfirm, onClose }) => (
  <Modal isOpen={isOpen} onClose={onClose} title={title} maxWidth="sm">
    <div className="flex items-start gap-3">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-rose-50 text-rose-600">
        <AlertTriangle className="h-5 w-5" />
      </span>
      <div className="text-sm text-slate-600">{message}</div>
    </div>
    <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
      <Button variant="outline" onClick={onClose}>
        Keep it
      </Button>
      <Button
        variant="danger"
        onClick={() => {
          onConfirm()
          onClose()
        }}
      >
        {confirmLabel}
      </Button>
    </div>
  </Modal>
)
