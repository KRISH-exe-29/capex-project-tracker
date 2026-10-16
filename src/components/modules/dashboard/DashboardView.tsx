import React from 'react'
import { KpiCards } from './KpiCards'
import { FinancialCharts } from './FinancialCharts'
import { ProjectProgressChart } from './ProjectProgressChart'
import { UpcomingDeadlines } from './UpcomingDeadlines'
import { useCapex } from '../../../context/CapexContext'
import { Button } from '../../common/Button'
import { StatusBadge } from '../../common/Badge'
import { Plus, Download, Building2, Calendar, MapPin, X } from 'lucide-react'
import { formatDate, formatINR } from '../../../utils/formatters'

export const DashboardView: React.FC = () => {
  const {
    setActiveModule,
    selectedProjectId,
    setSelectedProjectId,
    projects,
    addToast
  } = useCapex()

  const currentProject = projects.find(p => p.id === selectedProjectId)

  const handleExportDashboard = () => {
    addToast('Executive CAPEX Portfolio Report generated and downloaded.', 'success')
  }

  return (
    <div className="space-y-6">
      {/* Top Action Bar */}
      <div className="flex items-center justify-between">
        {currentProject ? (
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-[4px] bg-blue-100 text-blue-800 border border-blue-200">
              {currentProject.code}
            </span>
            <span className="text-sm font-bold text-[#0F172A]">{currentProject.name}</span>
            <StatusBadge status={currentProject.status} />
            <button
              onClick={() => setSelectedProjectId('all')}
              className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 hover:underline cursor-pointer ml-1"
              title="Clear filter to view all projects"
            >
              <X className="w-3.5 h-3.5" />
              <span>Show All</span>
            </button>
          </div>
        ) : (
          <div />
        )}

        <Button
          variant="primary"
          size="sm"
          onClick={() => setActiveModule('planning-project')}
          className="h-9 px-3.5 text-xs font-semibold shadow-xs"
          leftIcon={<Plus className="w-3.5 h-3.5" />}
        >
          New Project
        </Button>
      </div>

      {/* 1. KPI Metric Cards */}
      <KpiCards />

      {/* 2. Financial Bar Chart & Portfolio Status Donut */}
      <FinancialCharts />

      {/* 3. S-Curve Progress Trend */}
      <ProjectProgressChart />

      {/* 4. Upcoming Critical Deadlines */}
      <UpcomingDeadlines />
    </div>
  )
}
