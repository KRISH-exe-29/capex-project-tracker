import React, { HTMLAttributes } from 'react'
import { cn } from '../../utils/cn'

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  glass?: boolean
  noPadding?: boolean
}

export const Card: React.FC<CardProps> = ({
  children,
  className,
  glass = false,
  noPadding = false,
  ...props
}) => {
  return (
    <div
      className={cn(
        'glass rounded-xl transition-shadow duration-200',
        glass && 'glass-strong',
        !noPadding && 'p-5',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

export const CardHeader: React.FC<HTMLAttributes<HTMLDivElement>> = ({ children, className, ...props }) => {
  return (
    <div
      className={cn('flex items-center justify-between pb-4 mb-4 border-b border-slate-200/70', className)}
      {...props}
    >
      {children}
    </div>
  )
}

export const CardTitle: React.FC<HTMLAttributes<HTMLHeadingElement>> = ({
  children,
  className,
  ...props
}) => {
  return (
    <h3
      className={cn('text-base font-semibold text-[#0F172A] tracking-tight font-heading', className)}
      {...props}
    >
      {children}
    </h3>
  )
}

export const CardDescription: React.FC<HTMLAttributes<HTMLParagraphElement>> = ({
  children,
  className,
  ...props
}) => {
  return (
    <p className={cn('text-xs text-[#64748B] mt-0.5', className)} {...props}>
      {children}
    </p>
  )
}
