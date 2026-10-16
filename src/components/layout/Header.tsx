import React from 'react'
import { Building2, ChevronRight, Menu, UserRound } from 'lucide-react'
import { useCapex } from '../../context/CapexContext'
import type { ActiveModule } from '../../types/capex'
import { cn } from '../../utils/cn'

const PAGE_TITLES: Record<ActiveModule, [string, string]> = {
  dashboard: ['Overview', 'Dashboard'],
  'planning-project': ['Planning', 'Projects'],
  'planning-wbs': ['Planning', 'Project WBS'],
  'planning-phase': ['Planning', 'Phases'],
  'planning-part': ['Planning', 'Parts'],
  'planning-milestone': ['Planning', 'Milestones'],
  'planning-section': ['Planning', 'Sections'],
  'planning-task': ['Planning', 'Work Packages'],
  'planning-subwork': ['Planning', 'Purchase Orders'],
  'planning-gantt': ['Planning', 'Gantt Chart'],
  'procurement-pr': ['Procurement', 'Purchase Requisitions'],
  'procurement-dossier': ['Procurement', 'PO Dossier'],
  'procurement-exceptions': ['Procurement', 'Exceptions'],
  'finance-budget': ['Finance', 'Budget'],
  'finance-billing': ['Finance', 'Billing'],
  'operation-team': ['Operation', 'Team'],
  'operation-dpr': ['Operation', 'Daily Progress'],
  document: ['Records', 'Documents'],
  'audit-log': ['Records', 'Activity Log'],
  'access-users': ['Access', 'Users & Roles'],
  'access-roles': ['Access', 'Users & Roles'],
  'access-matrix': ['Access', 'Permission Matrix']
}

const SELECT =
  'h-9 w-full appearance-none rounded-lg border border-slate-200 bg-white/80 pl-8 pr-3 text-xs font-medium text-slate-800 hover:border-slate-300 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20'

export const Header: React.FC = () => {
  const {
    activeModule,
    selectedProjectId,
    setSelectedProjectId,
    projects,
    sidebarCollapsed,
    setMobileNavOpen,
    currentUser,
    setCurrentUserId,
    userPermissions
  } = useCapex()

  const [group, page] = PAGE_TITLES[activeModule] ?? ['Overview', 'Dashboard']

  return (
    <header
      className={cn(
        'glass fixed inset-x-0 top-0 z-20 flex h-16 items-center gap-3 rounded-none border-x-0 border-t-0 border-b border-slate-200/70 px-4 transition-[left] duration-300 sm:px-6',
        sidebarCollapsed ? 'lg:left-[72px]' : 'lg:left-[260px]'
      )}
    >
      <button
        type="button"
        onClick={() => setMobileNavOpen(true)}
        className="-ml-1 rounded-lg p-2 text-slate-600 hover:bg-slate-100 hover:text-slate-900 lg:hidden"
        aria-label="Open navigation"
      >
        <Menu className="h-5 w-5" />
      </button>

      <nav aria-label="Breadcrumb" className="flex min-w-0 items-center gap-1.5 text-sm">
        <span className="hidden text-slate-500 sm:inline">{group}</span>
        <ChevronRight className="hidden h-3.5 w-3.5 shrink-0 text-slate-300 sm:inline" />
        <span className="truncate font-semibold text-slate-900">{page}</span>
      </nav>

      <div className="ml-auto flex min-w-0 items-center gap-2">
        <label className="relative hidden w-56 md:block">
          <span className="sr-only">Project filter</span>
          <Building2 className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
          <select
            value={selectedProjectId}
            onChange={event => setSelectedProjectId(event.target.value)}
            className={SELECT}
          >
            <option value="all">All projects ({projects.length})</option>
            {projects.map(project => (
              <option key={project.id} value={project.id}>
                {project.code} — {project.name}
              </option>
            ))}
          </select>
        </label>

        <label className="relative w-40 sm:w-52" title="Acting as (demo). Real login comes with the server version.">
          <span className="sr-only">Acting as (demo)</span>
          <UserRound className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
          <select
            value={currentUser?.userId}
            onChange={event => setCurrentUserId(event.target.value)}
            className={SELECT}
          >
            {userPermissions
              .filter(user => user.status === 'Active' || user.userId === currentUser?.userId)
              .map(user => (
              <option key={user.userId} value={user.userId}>
                {user.userName} · {user.role}
              </option>
              ))}
          </select>
        </label>
        <span className="hidden rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-800 sm:inline">
          Demo login
        </span>
      </div>
    </header>
  )
}
