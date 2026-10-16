import React, { useState } from 'react'
import {
  LayoutDashboard,
  CalendarRange,
  FolderKanban,
  CheckSquare,
  Network,
  Users2,
  FileSpreadsheet,
  Receipt,
  Wallet,
  FileText,
  ShieldCheck,
  ChevronDown,
  ChevronRight,
  Layers,
  ChevronLeft,
  BriefcaseBusiness,
  Coins
} from 'lucide-react'
import { useCapex } from '../../context/CapexContext'
import { ActiveModule } from '../../types/capex'
import { cn } from '../../utils/cn'

interface NavItem {
  id: ActiveModule
  label: string
  icon: React.ReactNode
  badge?: string | number
}

interface NavSection {
  title: string
  icon: React.ReactNode
  items: NavItem[]
  defaultOpen?: boolean
}

export const Sidebar: React.FC = () => {
  const {
    activeModule,
    setActiveModule,
    sidebarCollapsed,
    setSidebarCollapsed,
    projects,
    tasks,
    subWorks,
    documents
  } = useCapex()

  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    Planning: true,
    Operation: true,
    Finance: true,
    'Access & RBAC': true
  })

  const toggleSection = (section: string) => {
    setOpenSections(prev => ({ ...prev, [section]: !prev[section] }))
  }

  const sections: NavSection[] = [
    {
      title: 'Planning',
      icon: <CalendarRange className="w-4 h-4 text-blue-600" />,
      defaultOpen: true,
      items: [
        { id: 'planning-project', label: 'Project', icon: <FolderKanban className="w-4 h-4" />, badge: projects.length },
        { id: 'planning-wbs', label: 'Project WBS', icon: <Network className="w-4 h-4" /> },
        { id: 'planning-milestone', label: 'Section', icon: <Layers className="w-4 h-4" /> },
        { id: 'planning-task', label: 'Work Package', icon: <CheckSquare className="w-4 h-4" />, badge: tasks.length },
        { id: 'planning-subwork', label: 'Sub-work', icon: <BriefcaseBusiness className="w-4 h-4" />, badge: subWorks.length },
        { id: 'planning-gantt', label: 'Gantt Chart', icon: <CalendarRange className="w-4 h-4" /> },
      ]
    },
    {
      title: 'Operation',
      icon: <Users2 className="w-4 h-4 text-emerald-600" />,
      defaultOpen: true,
      items: [
        { id: 'operation-team', label: 'Team', icon: <Users2 className="w-4 h-4" /> },
        { id: 'operation-dpr', label: 'DPR', icon: <FileSpreadsheet className="w-4 h-4" /> },
      ]
    },
    {
      title: 'Finance',
      icon: <Coins className="w-4 h-4 text-amber-600" />,
      defaultOpen: true,
      items: [
        { id: 'finance-billing', label: 'Billing', icon: <Receipt className="w-4 h-4" /> },
        { id: 'finance-budget', label: 'Budget', icon: <Wallet className="w-4 h-4" /> },
      ]
    },
    {
      title: 'Access & RBAC',
      icon: <ShieldCheck className="w-4 h-4 text-purple-600" />,
      defaultOpen: true,
      items: [
        { id: 'access-users', label: 'User Roles', icon: <Users2 className="w-4 h-4" /> },
        { id: 'access-matrix', label: 'User Matrix', icon: <ShieldCheck className="w-4 h-4" /> },
      ]
    }
  ]

  return (
    <aside
      className={cn(
        'fixed top-0 left-0 h-screen bg-white border-r border-[#E2E8F0] z-30 flex flex-col transition-all duration-300 ease-in-out',
        sidebarCollapsed ? 'w-[72px]' : 'w-[260px]'
      )}
    >
      {/* Navigation Scroll Area */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-4">
        {/* 1. Dashboard (Always top item) */}
        <div className="space-y-1">
          <button
            onClick={() => setActiveModule('dashboard')}
            className={cn(
              'w-full flex items-center gap-3 px-3 py-2.5 rounded-[6px] text-sm font-medium transition-colors cursor-pointer group',
              activeModule === 'dashboard'
                ? 'bg-blue-50 text-blue-700 border border-blue-200/80 shadow-xs'
                : 'text-[#334155] hover:bg-[#F8FAFC] hover:text-[#0F172A]'
            )}
            title={sidebarCollapsed ? 'Dashboard' : undefined}
          >
            <LayoutDashboard className={cn(
              'w-4 h-4 shrink-0',
              activeModule === 'dashboard' ? 'text-blue-600' : 'text-[#64748B] group-hover:text-[#0F172A]'
            )} />
            {!sidebarCollapsed && <span className="truncate">Dashboard</span>}
          </button>
        </div>

        {/* Dynamic Nav Groups: Planning, Operation, Finance */}
        {sections.map(section => {
          const isOpen = openSections[section.title] ?? true
          const hasActiveChild = section.items.some(item => item.id === activeModule)

          return (
            <div key={section.title} className="space-y-1 pt-1">
              {!sidebarCollapsed ? (
                <button
                  type="button"
                  onClick={() => toggleSection(section.title)}
                  className="w-full flex items-center justify-between px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-[#94A3B8] hover:text-[#475569] cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    {section.icon}
                    <span>{section.title}</span>
                  </div>
                  {isOpen ? (
                    <ChevronDown className="w-3 h-3 text-[#94A3B8]" />
                  ) : (
                    <ChevronRight className="w-3 h-3 text-[#94A3B8]" />
                  )}
                </button>
              ) : (
                <div className="h-px bg-[#E2E8F0] my-2 mx-1" />
              )}

              {/* Sub-items */}
              {(isOpen || sidebarCollapsed) && (
                <div className={cn('space-y-0.5', !sidebarCollapsed && 'pl-1.5')}>
                  {section.items.map(item => {
                    const isActive = activeModule === item.id

                    return (
                      <button
                        key={item.id}
                        onClick={() => setActiveModule(item.id)}
                        className={cn(
                          'w-full flex items-center justify-between px-3 py-2 rounded-[6px] text-xs font-medium transition-colors cursor-pointer group',
                          isActive
                            ? 'bg-blue-600 text-white shadow-xs font-semibold'
                            : 'text-[#475569] hover:bg-[#F1F5F9] hover:text-[#0F172A]'
                        )}
                        title={sidebarCollapsed ? item.label : undefined}
                      >
                        <div className="flex items-center gap-2.5 overflow-hidden">
                          <span className={cn(
                            'shrink-0',
                            isActive ? 'text-white' : 'text-[#64748B] group-hover:text-[#0F172A]'
                          )}>
                            {item.icon}
                          </span>
                          {!sidebarCollapsed && (
                            <span className="truncate">{item.label}</span>
                          )}
                        </div>

                        {!sidebarCollapsed && item.badge !== undefined && (
                          <span
                            className={cn(
                              'text-[10px] font-mono px-1.5 py-0.2 rounded-full font-medium',
                              isActive 
                                ? 'bg-blue-800 text-blue-100' 
                                : 'bg-[#E2E8F0] text-[#475569]'
                            )}
                          >
                            {item.badge}
                          </span>
                        )}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}

        {/* 5. Document Management */}
        <div className="space-y-1 pt-1">
          {!sidebarCollapsed && (
            <div className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-[#94A3B8]">
              Repository
            </div>
          )}
          <button
            onClick={() => setActiveModule('document')}
            className={cn(
              'w-full flex items-center justify-between px-3 py-2 rounded-[6px] text-xs font-medium transition-colors cursor-pointer group',
              activeModule === 'document'
                ? 'bg-blue-600 text-white shadow-xs font-semibold'
                : 'text-[#475569] hover:bg-[#F1F5F9] hover:text-[#0F172A]'
            )}
            title={sidebarCollapsed ? 'Documents' : undefined}
          >
            <div className="flex items-center gap-2.5 overflow-hidden">
              <FileText className={cn(
                'w-4 h-4 shrink-0',
                activeModule === 'document' ? 'text-white' : 'text-[#64748B] group-hover:text-[#0F172A]'
              )} />
              {!sidebarCollapsed && <span className="truncate">Document</span>}
            </div>
            {!sidebarCollapsed && (
              <span className={cn(
                'text-[10px] font-mono px-1.5 py-0.2 rounded-full font-medium',
                activeModule === 'document' ? 'bg-blue-800 text-blue-100' : 'bg-[#E2E8F0] text-[#475569]'
              )}>
                {documents.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Sidebar Footer with collapse button for collapsed state */}
      {sidebarCollapsed && (
        <div className="p-3 border-t border-[#E2E8F0] flex justify-center">
          <button
            onClick={() => setSidebarCollapsed(false)}
            className="p-2 rounded-[6px] text-[#64748B] hover:text-[#0F172A] hover:bg-[#F1F5F9] cursor-pointer"
            title="Expand Sidebar"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </aside>
  )
}
