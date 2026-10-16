import React from 'react'
import { cn } from '../../utils/cn'

interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  label: string
  tone?: 'default' | 'danger'
  /** When set, the button is disabled and this text explains why (shown as a tooltip). */
  disabledReason?: string
}

/** Square row-action button with an accessible label and a tooltip. */
export const IconButton: React.FC<IconButtonProps> = ({
  label,
  tone = 'default',
  disabledReason,
  className,
  children,
  ...props
}) => (
  <button
    type="button"
    aria-label={label}
    title={disabledReason ?? label}
    disabled={Boolean(disabledReason) || props.disabled}
    className={cn(
      'inline-flex h-8 w-8 items-center justify-center rounded-lg transition-colors disabled:cursor-not-allowed disabled:opacity-40',
      tone === 'danger'
        ? 'text-rose-500 hover:bg-rose-50 hover:text-rose-700 disabled:hover:bg-transparent'
        : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900 disabled:hover:bg-transparent',
      className
    )}
    {...props}
  >
    {children}
  </button>
)
