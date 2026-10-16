import React, { useMemo, useState } from 'react'
import {
  AlertTriangle,
  BriefcaseBusiness,
  CalendarRange,
  CheckSquare,
  ChevronDown,
  ChevronsLeft,
  ChevronsRight,
  ClipboardList,
  FileSearch,
  FileSpreadsheet,
  FileText,
  Flag,
  FolderKanban,
  History,
  Layers,
  LayoutDashboard,
  Network,
  Receipt,
  ShieldCheck,
  Users2,
  Wallet,
  X
} from 'lucide-react'
import { useCapex } from '../../context/CapexContext'
import type { ActiveModule } from '../../types/capex'
import { getExceptions } from '../../utils/exceptions'
import { cn } from '../../utils/cn'
import { Logo } from './Logo'

interface NavItem {
  id: ActiveModule
  label: string
  icon: React.ReactNode
  badge?: number
  alert?: boolean
}

interface NavGroup {
  title: string
  items: NavItem[]
}

const ICON = 'h-4 w-4'

export const Sidebar: React.FC = () => {
  const {
    activeModule,
    setActiveModule,
    sidebarCollapsed,
    setSidebarCollapsed,
    mobileNavOpen,
    setMobileNavOpen,
    projects,
    filteredTasks,
    filteredSubWorks,
    filteredPrs,
    documents,
    budgetRevisions
  } = useCapex()

  const [closedGroups, setClosedGroups] = useState<Record<string, boolean>>({})

  const exceptionCount = useMemo(
    () =>
      getExceptions({
        tasks: filteredTasks,
        subWorks: filteredSubWorks,
        purchaseRequisitions: filteredPrs,
        documents,
        budgetRevisions: budgetRevisions.filter(revision => filteredTasks.some(task => task.id === revision.taskId))
      }).length,
    [filteredTasks, filteredSubWorks, filteredPrs, documents, budgetRevisions]
  )
  const pendingApprovals =
    filteredPrs.filter(pr => pr.status === 'Pending Approval').length +
    budgetRevisions.filter(
      revision => revision.status === 'Pending' && filteredTasks.some(task => task.id === revision.taskId)
    ).length

  const groups: NavGroup[] = [
    {
      title: 'Overview',
      items: [{ id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className={ICON} /> }]
    },
    {
      title: 'Planning',
      items: [
        { id: 'planning-project', label: 'Projects', icon: <FolderKanban className={ICON} />, badge: projects.length },
        { id: 'planning-wbs', label: 'Project WBS', icon: <Network className={ICON} /> },
        { id: 'planning-section', label: 'Sections', icon: <Layers className={ICON} /> },
        { id: 'planning-task', label: 'Work Packages', icon: <CheckSquare className={ICON} />, badge: filteredTasks.length },
        {
          id: 'planning-subwork',
          label: 'Purchase Orders',
          icon: <BriefcaseBusiness className={ICON} />,
          badge: filteredSubWorks.length
        },
        { id: 'planning-milestone', label: 'Milestones', icon: <Flag className={ICON} /> },
        { id: 'planning-gantt', label: 'Gantt Chart', icon: <CalendarRange className={ICON} /> }
      ]
    },
    {
      title: 'Procurement',
      items: [
        {
          id: 'procurement-pr',
          label: 'Requisitions',
          icon: <ClipboardList className={ICON} />,
          badge: pendingApprovals || undefined,
          alert: pendingApprovals > 0
        },
        { id: 'procurement-dossier', label: 'PO Dossier', icon: <FileSearch className={ICON} /> },
        {
          id: 'procurement-exceptions',
          label: 'Exceptions',
          icon: <AlertTriangle className={ICON} />,
          badge: exceptionCount || undefined,
          alert: exceptionCount > 0
        }
      ]
    },
    {
      title: 'Finance',
      items: [
        { id: 'finance-budget', label: 'Budget', icon: <Wallet className={ICON} /> },
        { id: 'finance-billing', label: 'Billing', icon: <Receipt className={ICON} /> }
      ]
    },
    {
      title: 'Operation',
      items: [
        { id: 'operation-team', label: 'Team', icon: <Users2 className={ICON} /> },
        { id: 'operation-dpr', label: 'Daily Progress', icon: <FileSpreadsheet className={ICON} /> }
      ]
    },
    {
      title: 'Records',
      items: [
        { id: 'document', label: 'Documents', icon: <FileText className={ICON} />, badge: documents.length },
        { id: 'audit-log', label: 'Activity Log', icon: <History className={ICON} /> }
      ]
    },
    {
      title: 'Access',
      items: [
        { id: 'access-users', label: 'Users & Roles', icon: <Users2 className={ICON} /> },
        { id: 'access-matrix', label: 'Permission Matrix', icon: <ShieldCheck className={ICON} /> }
      ]
    }
  ]

  // On small screens the sidebar is an overlay and always shows labels.
  const compact = sidebarCollapsed && !mobileNavOpen

  return (
    <>
      {mobileNavOpen && (
        <div
          className="fixed inset-0 z-30 bg-slate-900/40 backdrop-blur-[2px] lg:hidden"
          onClick={() => setMobileNavOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside
        className={cn(
          'glass-strong fixed inset-y-0 left-0 z-40 flex flex-col border-r border-white/70 transition-[width,transform] duration-300 ease-in-out',
          'w-[260px] lg:translate-x-0',
          mobileNavOpen ? 'translate-x-0' : '-translate-x-full',
          sidebarCollapsed && 'lg:w-[72px]'
        )}
        aria-label="Main navigation"
      >
        {/* Brand row: same 64px height and bottom border as the header */}
        <div
          className={cn(
            'flex h-16 shrink-0 items-center border-b border-slate-200/70',
            compact ? 'justify-center px-2' : 'justify-between px-5'
          )}
        >
          <Logo collapsed={compact} />
          <button
            type="button"
            onClick={() => setMobileNavOpen(false)}
            className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900 lg:hidden"
            aria-label="Close navigation"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-4">
          {groups.map(group => {
            const closed = closedGroups[group.title] && !compact
            return (
              <div key={group.title}>
                {compact ? (
                  group.title !== 'Overview' && <div className="mx-2 mb-2 h-px bg-slate-200/80" />
                ) : (
                  group.title !== 'Overview' && (
                    <button
                      type="button"
                      onClick={() => setClosedGroups(prev => ({ ...prev, [group.title]: !prev[group.title] }))}
                      className="mb-1 flex w-full items-center justify-between rounded-md px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400 hover:text-slate-600"
                      aria-expanded={!closed}
                    >
                      {group.title}
                      <ChevronDown className={cn('h-3.5 w-3.5 transition-transform', closed && '-rotate-90')} />
                    </button>
                  )
                )}

                {!closed && (
                  <ul className="space-y-0.5">
                    {group.items.map(item => {
                      const active = activeModule === item.id
                      return (
                        <li key={item.id}>
                          <button
                            type="button"
                            onClick={() => setActiveModule(item.id)}
                            title={compact ? item.label : undefined}
                            aria-current={active ? 'page' : undefined}
                            className={cn(
                              'group relative flex h-9 w-full items-center gap-3 rounded-lg text-[13px] font-medium transition-colors',
                              compact ? 'justify-center px-0' : 'px-3',
                              active
                                ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/25'
                                : 'text-slate-600 hover:bg-white/80 hover:text-slate-900'
                            )}
                          >
                            {active && !compact && (
                              <span className="absolute -left-3 top-1.5 bottom-1.5 w-1 rounded-r bg-brand-red" />
                            )}
                            <span className={cn('shrink-0', active ? 'text-white' : 'text-slate-400 group-hover:text-slate-700')}>
                              {item.icon}
                            </span>
                            {!compact && <span className="flex-1 truncate text-left">{item.label}</span>}
                            {!compact && item.badge !== undefined && (
                              <span
                                className={cn(
                                  'mono-num min-w-[1.5rem] rounded-full px-1.5 py-0.5 text-center text-[10px] font-semibold',
                                  active
                                    ? 'bg-white/20 text-white'
                                    : item.alert
                                      ? 'bg-rose-100 text-rose-700'
                                      : 'bg-slate-200/80 text-slate-600'
                                )}
                              >
                                {item.badge}
                              </span>
                            )}
                            {compact && item.alert && (
                              <span className="absolute right-2 top-1.5 h-2 w-2 rounded-full bg-rose-500 ring-2 ring-white" />
                            )}
                          </button>
                        </li>
                      )
                    })}
                  </ul>
                )}
              </div>
            )
          })}
        </nav>

        <div className="hidden shrink-0 border-t border-slate-200/70 p-3 lg:block">
          <button
            type="button"
            onClick={() => setSidebarCollapsed(value => !value)}
            className={cn(
              'flex h-9 w-full items-center gap-3 rounded-lg text-[13px] font-medium text-slate-500 hover:bg-white/80 hover:text-slate-900',
              sidebarCollapsed ? 'justify-center' : 'px-3'
            )}
            aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {sidebarCollapsed ? <ChevronsRight className={ICON} /> : <ChevronsLeft className={ICON} />}
            {!sidebarCollapsed && 'Collapse'}
          </button>
        </div>
      </aside>
    </>
  )
}
