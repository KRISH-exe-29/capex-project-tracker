import React from 'react'
import {
  FolderKanban,
  Layers,
  CheckSquare,
  IndianRupee,
  Clock,
  ArrowUpRight,
  ShieldCheck
} from 'lucide-react'
import { Card } from '../../common/Card'
import { useCapex } from '../../../context/CapexContext'
import { formatINR, getDaysRemaining } from '../../../utils/formatters'

export const KpiCards: React.FC = () => {
  const {
    projects,
    filteredMilestones,
    filteredTasks,
    selectedProjectId
  } = useCapex()

  // Relevant projects based on filter
  const relevantProjects = selectedProjectId === 'all'
    ? projects
    : projects.filter(p => p.id === selectedProjectId)

  const totalApproved = relevantProjects.reduce((sum, p) => sum + p.approvedAmount, 0)
  const totalPO = relevantProjects.reduce((sum, p) => sum + p.poValue, 0)
  const totalBalance = totalApproved - totalPO

  // Upcoming deadlines across milestones & tasks (< 45 days)
  const upcomingDeadlinesCount = filteredTasks.filter(t => {
    const days = getDaysRemaining(t.targetDate)
    return days >= 0 && days <= 45 && t.status !== 'Completed'
  }).length + filteredMilestones.filter(m => {
    const days = getDaysRemaining(m.targetDate)
    return days >= 0 && days <= 45 && m.status !== 'Completed'
  }).length

  const activeProjectsCount = relevantProjects.filter(p => p.status === 'Active').length
  const completedMilestones = filteredMilestones.filter(m => m.status === 'Completed').length
  const completedTasks = filteredTasks.filter(t => t.status === 'Completed').length

  const cards = [
    {
      title: 'Total Projects',
      value: relevantProjects.length,
      subtitle: `${activeProjectsCount} Active • ${relevantProjects.length - activeProjectsCount} Planning`,
      icon: <FolderKanban className="w-4 h-4 text-blue-600" />,
      accentBg: 'bg-blue-50 border-blue-200/80',
      topBorder: 'border-t-2 border-t-blue-600'
    },
    {
      title: 'Total Sections',
      value: filteredMilestones.length,
      subtitle: `${completedMilestones} Done (${filteredMilestones.length > 0 ? Math.round((completedMilestones / filteredMilestones.length) * 100) : 0}%)`,
      icon: <Layers className="w-4 h-4 text-indigo-600" />,
      accentBg: 'bg-indigo-50 border-indigo-200/80',
      topBorder: 'border-t-2 border-t-indigo-600'
    },
    {
      title: 'Total Work Packages',
      value: filteredTasks.length,
      subtitle: `${completedTasks} Closed • ${filteredTasks.length - completedTasks} Pending`,
      icon: <CheckSquare className="w-4 h-4 text-emerald-600" />,
      accentBg: 'bg-emerald-50 border-emerald-200/80',
      topBorder: 'border-t-2 border-t-emerald-600'
    },
    {
      title: 'Approved CAPEX',
      value: formatINR(totalApproved, true),
      subtitle: `Full: ${formatINR(totalApproved)}`,
      icon: <IndianRupee className="w-4 h-4 text-amber-600" />,
      accentBg: 'bg-amber-50 border-amber-200/80',
      topBorder: 'border-t-2 border-t-amber-600',
      isCurrency: true
    },
    {
      title: 'Upcoming Deadlines',
      value: upcomingDeadlinesCount,
      subtitle: 'Target window ≤ 45 days',
      icon: <Clock className="w-4 h-4 text-rose-600" />,
      accentBg: 'bg-rose-50 border-rose-200/80',
      topBorder: 'border-t-2 border-t-rose-600',
      highlight: upcomingDeadlinesCount > 0
    }
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
      {cards.map((card, idx) => (
        <Card
          key={idx}
          noPadding
          className={`p-4 flex flex-col justify-between h-32 hover:shadow-md transition-shadow duration-200 ${card.topBorder}`}
        >
          {/* Card Top: Title */}
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider truncate">
              {card.title}
            </span>
          </div>

          {/* Metric Value */}
          <div className="my-auto">
            <div className="text-2xl font-bold text-[#0F172A] font-heading tracking-tight leading-none">
              {card.value}
            </div>
          </div>

          {/* Card Footer: Subtitle / Progress tag */}
          <div className="pt-2 border-t border-[#F1F5F9] flex items-center justify-between text-[11px] text-[#64748B]">
            <span className="truncate font-medium">{card.subtitle}</span>
            {card.highlight && (
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse shrink-0 ml-1" />
            )}
          </div>
        </Card>
      ))}
    </div>
  )
}
