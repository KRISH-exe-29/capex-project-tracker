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
        'rounded-[8px] border border-[#E2E8F0] transition-shadow duration-200',
        glass 
          ? 'bg-white/90 backdrop-blur-md shadow-xs' 
          : 'bg-[#FFFFFF] shadow-[0_1px_3px_0_rgba(15,23,42,0.06),0_1px_2px_-1px_rgba(15,23,42,0.04)]',
        !noPadding && 'p-5',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

export const CardHeader: React.FC<HTMLAttributes<HTMLDivElement>> = ({
  children,
  className,
  ...props
}) => {
  return (
    <div
      className={cn('flex items-center justify-between pb-3.5 mb-4 border-b border-[#F1F5F9]', className)}
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
    <p
      className={cn('text-xs text-[#64748B] mt-0.5', className)}
      {...props}
    >
      {children}
    </p>
  )
}
