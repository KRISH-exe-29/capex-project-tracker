import React from 'react'
import { FolderX } from 'lucide-react'
import { Button } from './Button'

export interface EmptyStateProps {
  title: string
  description: string
  icon?: React.ReactNode
  actionLabel?: string
  onAction?: () => void
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  icon,
  actionLabel,
  onAction
}) => {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center rounded-[8px] border border-dashed border-[#CBD5E1] bg-[#F8FAFC]/50">
      <div className="w-12 h-12 rounded-full bg-blue-50 text-[#2563EB] flex items-center justify-center mb-3 shadow-xs">
        {icon || <FolderX className="w-6 h-6" />}
      </div>
      <h4 className="text-base font-semibold text-[#0F172A] font-heading">{title}</h4>
      <p className="text-sm text-[#64748B] max-w-sm mt-1 mb-4">{description}</p>
      {actionLabel && onAction && (
        <Button variant="primary" size="sm" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  )
}
