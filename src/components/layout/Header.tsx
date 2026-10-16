import React from 'react'
import {
  Menu,
  RotateCcw,
  Bell,
  IndianRupee,
  Layers,
  Building2,
  ChevronRight
} from 'lucide-react'
import { useCapex } from '../../context/CapexContext'
import { Button } from '../common/Button'
import { cn } from '../../utils/cn'

export const Header: React.FC = () => {
  const {
    activeModule,
    selectedProjectId,
    setSelectedProjectId,
    projects,
    sidebarCollapsed,
    setSidebarCollapsed,
    resetToSampleData
  } = useCapex()

  // Generate breadcrumb text
  const getBreadcrumb = () => {
    switch (activeModule) {
      case 'dashboard':
        return { section: 'Analytics', page: 'Dashboard & KPI Metrics' }
      case 'planning-project':
        return { section: 'Planning', page: 'Projects Master' }
      case 'planning-wbs':
        return { section: 'Planning', page: 'Work Breakdown Structure (WBS)' }
      case 'planning-milestone':
        return { section: 'Planning', page: 'Milestone Tracking' }
      case 'planning-task':
        return { section: 'Planning', page: 'Task Management' }
      case 'planning-subwork':
        return { section: 'Planning', page: 'Sub-work & Procurement' }
      case 'planning-gantt':
        return { section: 'Planning', page: 'Gantt Schedule' }
      case 'operation-team':
        return { section: 'Operation', page: 'Team Allocation' }
      case 'operation-dpr':
        return { section: 'Operation', page: 'Daily Progress Report (DPR)' }
      case 'finance-budget':
        return { section: 'Finance', page: 'Budget & Cost Variance' }
      case 'finance-billing':
        return { section: 'Finance', page: 'Billing & Payments' }
      case 'document':
        return { section: 'Repository', page: 'Project Documents' }
      case 'access-matrix':
        return { section: 'Security', page: 'User Access Matrix' }
      case 'access-roles':
        return { section: 'Security', page: 'Roles & Permissions' }
      default:
        return { section: 'Overview', page: 'Executive Dashboard' }
    }
  }

  const breadcrumb = getBreadcrumb()
  const selectedProject = projects.find(p => p.id === selectedProjectId)

  return (
    <header
      className={cn(
        'fixed top-0 right-0 h-16 bg-white/95 backdrop-blur-md border-b border-[#E2E8F0] z-20 transition-all duration-300 ease-in-out px-4 sm:px-6 flex items-center justify-between',
        sidebarCollapsed ? 'left-[72px]' : 'left-[260px]'
      )}
    >
      {/* Left: Mobile trigger & Breadcrumbs */}
      <div className="flex items-center gap-3 sm:gap-4 overflow-hidden">
        <button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className="p-1.5 rounded-[6px] text-[#64748B] hover:text-[#0F172A] hover:bg-[#F1F5F9] cursor-pointer lg:hidden"
          title="Toggle Navigation"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-[#64748B] font-medium hidden sm:inline">
            {breadcrumb.section}
          </span>
          <ChevronRight className="w-3.5 h-3.5 text-[#CBD5E1] hidden sm:inline" />
          <span className="font-semibold text-[#0F172A] tracking-tight">
            {breadcrumb.page}
          </span>

          {selectedProject && (
            <span className="ml-2 px-2 py-0.5 rounded-full text-[11px] font-mono font-medium bg-blue-50 text-blue-700 border border-blue-200/80 truncate max-w-[200px]">
              Filter: {selectedProject.code} — {selectedProject.name}
            </span>
          )}
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {/* Global Project Switcher Dropdown */}
        <div className="relative flex items-center">
          <Building2 className="w-3.5 h-3.5 text-[#64748B] absolute left-2.5 pointer-events-none" />
          <select
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            className="h-9 pl-8 pr-7 text-xs font-medium bg-[#F8FAFC] border border-[#CBD5E1] rounded-[6px] text-[#0F172A] hover:border-[#94A3B8] focus:outline-hidden focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] cursor-pointer max-w-[190px] sm:max-w-[220px] truncate transition-colors"
          >
            <option value="all">All Projects ({projects.length})</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.code} — {p.name}
              </option>
            ))}
          </select>
        </div>
      </div>
    </header>
  )
}
