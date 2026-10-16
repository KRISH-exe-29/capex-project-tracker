import React from 'react'
import { Card, CardHeader, CardTitle, CardDescription } from '../../common/Card'
import { StatusBadge } from '../../common/Badge'
import { useCapex } from '../../../context/CapexContext'
import { formatDate, getDaysRemaining } from '../../../utils/formatters'
import { Clock, ArrowRight, CheckCircle2, Calendar } from 'lucide-react'

export const UpcomingDeadlines: React.FC = () => {
  const { filteredMilestones, filteredTasks, projects, setActiveModule } = useCapex()

  // Collect pending milestones and tasks
  const items = [
    ...filteredMilestones
      .filter(m => m.status !== 'Completed')
      .map(m => {
        const proj = projects.find(p => p.id === m.projectId)
        const days = getDaysRemaining(m.targetDate)
        return {
          id: m.id,
          name: m.name,
          type: 'Section' as const,
          wbsNumber: m.wbsNumber,
          targetDate: m.targetDate,
          days,
          status: m.status,
          projectName: proj ? proj.name : 'Unknown',
          progress: m.progress,
          targetModule: 'planning-milestone' as const
        }
      }),
    ...filteredTasks
      .filter(t => t.status !== 'Completed')
      .map(t => {
        const proj = projects.find(p => p.id === t.projectId)
        const days = getDaysRemaining(t.targetDate)
        return {
          id: t.id,
          name: t.name,
          type: 'Work Package' as const,
          wbsNumber: t.wbsNumber,
          targetDate: t.targetDate,
          days,
          status: t.status,
          projectName: proj ? proj.name : 'Unknown',
          progress: t.progress,
          targetModule: 'planning-task' as const
        }
      })
  ].sort((a, b) => a.days - b.days)

  return (
    <Card noPadding className="overflow-hidden">
      <div className="p-5 border-b border-[#F1F5F9] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-rose-600" />
            <CardTitle>Upcoming Delivery Deadlines & Schedule Proximity</CardTitle>
          </div>
          <CardDescription>
            Sections and work packages sorted by earliest delivery dates with computed proximity days
          </CardDescription>
        </div>

        <span className="text-xs font-semibold text-[#64748B] bg-slate-100 px-2.5 py-1 rounded-[6px]">
          {items.length} Active Targets
        </span>
      </div>

      <div className="divide-y divide-[#F1F5F9]">
        {items.length === 0 ? (
          <div className="py-12 text-center text-xs text-[#94A3B8]">
            <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-500 mb-2 opacity-80" />
            <p className="font-semibold text-[#0F172A] text-sm">All milestones & tasks completed!</p>
            <p className="text-[#64748B] mt-0.5">No overdue or pending target dates in current portfolio.</p>
          </div>
        ) : (
          items.slice(0, 6).map((item) => {
            const isOverdue = item.days < 0
            const isCritical = item.days >= 0 && item.days <= 14

            return (
              <div
                key={`${item.type}-${item.id}`}
                className="py-3 px-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[#F8FAFC] transition-colors"
              >
                {/* Item Details */}
                <div className="space-y-1 overflow-hidden min-w-0 max-w-lg">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[11px] font-bold text-[#2563EB] bg-blue-50 px-1.5 py-0.5 rounded-[4px] shrink-0 border border-blue-200/60">
                      {item.wbsNumber}
                    </span>
                    <span className="text-[10px] uppercase font-bold text-[#64748B] tracking-wider px-1.5 py-0.5 rounded-xs bg-slate-100 shrink-0">
                      {item.type}
                    </span>
                    <p className="text-xs font-semibold text-[#0F172A] truncate">
                      {item.name}
                    </p>
                  </div>
                  <p className="text-[11px] text-[#64748B] truncate pl-0.5">
                    Project: <span className="text-[#334155] font-medium">{item.projectName}</span>
                  </p>
                </div>

                {/* Progress bar, Date & Status */}
                <div className="flex items-center gap-4 shrink-0 self-end sm:self-center">
                  <div className="hidden md:flex items-center gap-2 w-28">
                    <div className="w-full bg-[#E2E8F0] h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-blue-600 h-full rounded-full"
                        style={{ width: `${item.progress}%` }}
                      />
                    </div>
                    <span className="font-mono text-[11px] text-[#64748B]">{item.progress}%</span>
                  </div>

                  <div className="text-right whitespace-nowrap">
                    <p className="text-xs font-semibold text-[#0F172A] flex items-center gap-1 justify-end">
                      <Calendar className="w-3 h-3 text-[#94A3B8]" />
                      {formatDate(item.targetDate)}
                    </p>
                    <p
                      className={`text-[10px] font-bold ${
                        isOverdue
                          ? 'text-rose-600'
                          : isCritical
                          ? 'text-amber-600'
                          : 'text-[#64748B]'
                      }`}
                    >
                      {isOverdue
                        ? `${Math.abs(item.days)}d overdue`
                        : item.days === 0
                        ? 'Due today'
                        : `${item.days}d remaining`}
                    </p>
                  </div>

                  <StatusBadge status={item.status} className="text-[10px]" />

                  <button
                    onClick={() => setActiveModule(item.targetModule)}
                    className="p-1.5 rounded-[6px] hover:bg-[#E2E8F0] text-[#64748B] hover:text-[#0F172A] cursor-pointer transition-colors"
                    title={`View in ${item.type}`}
                  >
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )
          })
        )}
      </div>
    </Card>
  )
}
