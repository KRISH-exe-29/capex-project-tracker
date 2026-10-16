import React from 'react'
import { Search } from 'lucide-react'
import { cn } from '../../utils/cn'

/** Search and filters row at the top of a list card. */
export const Toolbar: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
  <div
    className={cn(
      'flex flex-col gap-3 border-b border-slate-200/70 px-4 py-3 md:flex-row md:items-center md:justify-between',
      className
    )}
  >
    {children}
  </div>
)

export const SearchInput: React.FC<{
  value: string
  onChange: (value: string) => void
  placeholder: string
  label?: string
}> = ({ value, onChange, placeholder, label = 'Search' }) => (
  <label className="relative block w-full md:max-w-sm">
    <span className="sr-only">{label}</span>
    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
    <input
      type="search"
      value={value}
      onChange={event => onChange(event.target.value)}
      placeholder={placeholder}
      className="field-control h-9 pl-9 text-[13px]"
    />
  </label>
)

export const FilterSelect: React.FC<{
  label: string
  value: string
  onChange: (value: string) => void
  options: { value: string; label: string }[]
}> = ({ label, value, onChange, options }) => (
  <label className="flex items-center gap-2 text-xs font-medium text-slate-500">
    <span className="whitespace-nowrap">{label}</span>
    <select
      value={value}
      onChange={event => onChange(event.target.value)}
      className="field-control h-9 w-auto min-w-[9rem] pr-8 text-[13px]"
    >
      {options.map(option => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  </label>
)
