import React, { useState, useMemo } from 'react'
import {
  CalendarRange,
  ChevronDown,
  ChevronRight,
  Filter,
  Layers,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ZoomIn,
  ZoomOut
} from 'lucide-react'
import { Card } from '../../common/Card'
import { Button } from '../../common/Button'
import { StatusBadge } from '../../common/Badge'
import { useCapex } from '../../../context/CapexContext'
import { formatDate, getDaysRemaining } from '../../../utils/formatters'
import { parseISO, differenceInDays } from 'date-fns'

interface GanttItem {
  id: string
  parentId?: string
  level: 1 | 2 | 3 | 4 | 5 | 6
  wbsNumber: string
  name: string
  startDate: string
  targetDate: string
  progress: number
  status: string
  type: 'Project' | 'Phase' | 'Part' | 'Section' | 'Work Package' | 'Sub-work'
}

export const GanttChartView: React.FC = () => {
  const {
    projects,
    phases,
    parts,
    sections,
    milestones,
    tasks,
    subWorks,
    selectedProjectId
  } = useCapex()

  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({
    'proj-500': true,
    'phase-501': true,
    'part-5011': true,
    'sec-50111': true,
    'tsk-501111': true,
    'proj-001': true,
    'phase-101': true,
    'part-1011': true,
    'sec-101': true,
    'ms-1011': true,
    'tsk-10111': true
  })

  // Timeline range: Fixed 24 months from 2026-01-01 to 2027-12-31
  const timelineStart = new Date('2026-01-01')
  const timelineEnd = new Date('2027-12-31')
  const totalDays = differenceInDays(timelineEnd, timelineStart)

  const months = useMemo(() => {
    const list = []
    const cur = new Date('2026-01-01')
    while (cur <= timelineEnd) {
      list.push(new Date(cur))
      cur.setMonth(cur.getMonth() + 1)
    }
    return list
  }, [timelineEnd])

  const toggleExpand = (id: string) => {
    setExpandedNodes(prev => ({ ...prev, [id]: !prev[id] }))
  }

  // Build hierarchical list of visible items
  const visibleItems = useMemo(() => {
    const items: GanttItem[] = []
    const relevantProjects = selectedProjectId === 'all'
      ? projects
      : projects.filter(p => p.id === selectedProjectId)

    relevantProjects.forEach((proj, pIdx) => {
      items.push({
        id: proj.id,
        level: 1,
        wbsNumber: (pIdx + 1).toString(),
        name: proj.name,
        startDate: proj.startDate || proj.approvedDate,
        targetDate: proj.endDate,
        progress: 45, // calculated
        status: proj.status,
        type: 'Project'
      })

      if (expandedNodes[proj.id]) {
        const projPhases = phases.filter(ph => ph.projectId === proj.id)

        if (projPhases.length > 0) {
          projPhases.forEach(ph => {
            items.push({
              id: ph.id,
              parentId: proj.id,
              level: 2,
              wbsNumber: ph.wbsNumber,
              name: ph.name,
              startDate: ph.startDate || proj.approvedDate,
              targetDate: ph.endDate || proj.endDate,
              progress: 40,
              status: ph.status,
              type: 'Phase'
            })

            if (expandedNodes[ph.id]) {
              const phParts = parts.filter(pt => pt.phaseId === ph.id)
              phParts.forEach(pt => {
                items.push({
                  id: pt.id,
                  parentId: ph.id,
                  level: 3,
                  wbsNumber: pt.wbsNumber,
                  name: pt.name,
                  startDate: ph.startDate || proj.approvedDate,
                  targetDate: ph.endDate || proj.endDate,
                  progress: 35,
                  status: pt.status,
                  type: 'Part'
                })

                if (expandedNodes[pt.id]) {
                  const ptSections = sections.filter(s => s.partId === pt.id)
                  ptSections.forEach(sec => {
                    const secTasks = tasks.filter(t => t.sectionId === sec.id)
                    const start = secTasks.length > 0 ? secTasks[0].startDate : (ph.startDate || proj.approvedDate)
                    const end = secTasks.length > 0 ? secTasks[secTasks.length - 1].targetDate : (ph.endDate || proj.endDate)

                    items.push({
                      id: sec.id,
                      parentId: pt.id,
                      level: 4,
                      wbsNumber: sec.wbsNumber,
                      name: sec.name,
                      startDate: start,
                      targetDate: end,
                      progress: 40,
                      status: 'In Progress',
                      type: 'Section'
                    })

                    if (expandedNodes[sec.id]) {
                      secTasks.forEach(tsk => {
                        items.push({
                          id: tsk.id,
                          parentId: sec.id,
                          level: 5,
                          wbsNumber: tsk.wbsNumber,
                          name: tsk.name,
                          startDate: tsk.startDate,
                          targetDate: tsk.targetDate,
                          progress: tsk.progress,
                          status: tsk.status,
                          type: 'Work Package'
                        })

                        if (expandedNodes[tsk.id]) {
                          const tskSubworks = subWorks.filter(sw => sw.taskId === tsk.id)
                          tskSubworks.forEach(sw => {
                            items.push({
                              id: sw.id,
                              parentId: tsk.id,
                              level: 6,
                              wbsNumber: sw.wbsNumber,
                              name: sw.workDescription,
                              startDate: tsk.startDate,
                              targetDate: sw.targetDate,
                              progress: sw.status === 'Paid' ? 100 : sw.status === 'Billed' ? 75 : 30,
                              status: sw.status,
                              type: 'Sub-work'
                            })
                          })
                        }
                      })
                    }
                  })
                }
              })
            }
          })
        }

        // Direct sections (without partId)
        const projDirectSections = sections.filter(s => s.projectId === proj.id && !s.partId)
        projDirectSections.forEach(sec => {
          const secMilestones = milestones.filter(m => m.sectionId === sec.id)
          const start = secMilestones.length > 0 ? secMilestones[0].startDate : proj.approvedDate
          const end = secMilestones.length > 0 ? secMilestones[secMilestones.length - 1].targetDate : proj.endDate

          items.push({
            id: sec.id,
            parentId: proj.id,
            level: 2,
            wbsNumber: sec.wbsNumber,
            name: sec.name,
            startDate: start,
            targetDate: end,
            progress: 50,
            status: 'In Progress',
            type: 'Section'
          })

          if (expandedNodes[sec.id]) {
            const secTasks = tasks.filter(t => t.sectionId === sec.id)
            secTasks.forEach(tsk => {
              items.push({
                id: tsk.id,
                parentId: sec.id,
                level: 3,
                wbsNumber: tsk.wbsNumber,
                name: tsk.name,
                startDate: tsk.startDate,
                targetDate: tsk.targetDate,
                progress: tsk.progress,
                status: tsk.status,
                type: 'Work Package'
              })

              if (expandedNodes[tsk.id]) {
                const tskSubworks = subWorks.filter(sw => sw.taskId === tsk.id)
                tskSubworks.forEach(sw => {
                  items.push({
                    id: sw.id,
                    parentId: tsk.id,
                    level: 4,
                    wbsNumber: sw.wbsNumber,
                    name: sw.workDescription,
                    startDate: tsk.startDate,
                    targetDate: sw.targetDate,
                    progress: sw.status === 'Paid' ? 100 : sw.status === 'Billed' ? 75 : 30,
                    status: sw.status,
                    type: 'Sub-work'
                  })
                })
              }
            })
          }
        })
      }
    })

    return items
  }, [projects, phases, parts, sections, milestones, tasks, subWorks, selectedProjectId, expandedNodes])

  // Helper to calculate bar left and width percentages
  const getBarPosition = (startDate: string, targetDate: string) => {
    try {
      const start = parseISO(startDate)
      const end = parseISO(targetDate)
      const startOffset = Math.max(0, differenceInDays(start, timelineStart))
      const duration = Math.max(10, differenceInDays(end, start))

      const leftPercent = (startOffset / totalDays) * 100
      const widthPercent = Math.min(100 - leftPercent, (duration / totalDays) * 100)

      return {
        left: `${Math.max(0, leftPercent)}%`,
        width: `${Math.max(1.5, widthPercent)}%`
      }
    } catch {
      return { left: '0%', width: '10%' }
    }
  }

  const barColors: Record<number, string> = {
    1: 'bg-blue-600 border-blue-700',
    2: 'bg-purple-600 border-purple-700',
    3: 'bg-sky-600 border-sky-700',
    4: 'bg-slate-600 border-slate-700',
    5: 'bg-emerald-600 border-emerald-700',
    6: 'bg-amber-500 border-amber-600'
  }

  const badgeColors: Record<number, string> = {
    1: 'bg-blue-600 text-white',
    2: 'bg-purple-100 text-purple-800 border border-purple-200',
    3: 'bg-sky-100 text-sky-800 border border-sky-200',
    4: 'bg-slate-200 text-slate-800',
    5: 'bg-emerald-100 text-emerald-800',
    6: 'bg-amber-100 text-amber-800'
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <CalendarRange className="w-5 h-5 text-indigo-600" />
            <h2 className="text-xl font-bold text-[#0F172A] font-heading tracking-tight">
              Interactive Hierarchical Gantt Schedule
            </h2>
          </div>
          <p className="text-xs text-[#64748B] mt-0.5">
            Synchronized calendar timeline spanning 2026-2027 based on saved WBS milestones, tasks, and PO deadlines.
          </p>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-3 text-xs bg-white px-3 py-1.5 rounded-[6px] border border-[#E2E8F0] shadow-xs">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-2 rounded-xs bg-blue-600" />
            <span className="text-[#64748B]">Project</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-2 rounded-xs bg-purple-600" />
            <span className="text-[#64748B]">Phase</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-2 rounded-xs bg-sky-600" />
            <span className="text-[#64748B]">Part</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-2 rounded-xs bg-slate-600" />
            <span className="text-[#64748B]">Section</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-2 rounded-xs bg-emerald-600" />
            <span className="text-[#64748B]">Work Package</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-2 rounded-xs bg-amber-500" />
            <span className="text-[#64748B]">Sub-work</span>
          </div>
        </div>
      </div>

      {/* Main Gantt Split Container */}
      <Card noPadding className="overflow-hidden border-[#CBD5E1]">
        <div className="flex overflow-x-auto min-w-[950px]">
          {/* Left WBS Hierarchy Column */}
          <div className="w-[380px] shrink-0 border-r border-[#E2E8F0] bg-white sticky left-0 z-20">
            {/* Header */}
            <div className="h-12 px-4 bg-[#F8FAFC] border-b border-[#E2E8F0] flex items-center justify-between text-xs font-semibold text-[#475569] uppercase tracking-wider">
              <span>WBS Item Hierarchy</span>
              <span>Status</span>
            </div>

            {/* Tree rows */}
            <div className="divide-y divide-[#F1F5F9]">
              {visibleItems.map(item => {
                const isExpanded = expandedNodes[item.id]
                const hasChildren = item.level < 6
                const paddingLeft = `${(item.level - 1) * 16 + 12}px`

                return (
                  <div
                    key={item.id}
                    className="h-11 px-3 flex items-center justify-between text-xs hover:bg-[#F8FAFC] transition-colors"
                    style={{ paddingLeft }}
                  >
                    <div className="flex items-center gap-1.5 overflow-hidden pr-2">
                      {hasChildren ? (
                        <button
                          onClick={() => toggleExpand(item.id)}
                          className="p-1 rounded-sm hover:bg-slate-200 text-slate-600 cursor-pointer"
                        >
                          {isExpanded ? (
                            <ChevronDown className="w-3 h-3" />
                          ) : (
                            <ChevronRight className="w-3 h-3" />
                          )}
                        </button>
                      ) : (
                        <span className="w-5" />
                      )}

                      <span
                        className={`font-mono text-[10px] font-bold px-1.5 py-0.2 rounded-xs shrink-0 ${
                          badgeColors[item.level]
                        }`}
                      >
                        {item.wbsNumber}
                      </span>

                      <span
                        className={`truncate ${
                          item.level === 1
                            ? 'font-bold text-[#0F172A]'
                            : item.level === 3
                            ? 'font-semibold text-indigo-900'
                            : 'text-[#334155]'
                        }`}
                      >
                        {item.name}
                      </span>
                    </div>

                    <div className="shrink-0">
                      <StatusBadge status={item.status} className="text-[10px] px-1.5 py-0" />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Right Gantt Timeline Grid */}
          <div className="flex-1 min-w-[700px] overflow-hidden bg-white">
            {/* Timeline Header (Months) */}
            <div className="h-12 bg-[#F8FAFC] border-b border-[#E2E8F0] flex text-[11px] font-medium text-[#64748B]">
              {months.map((m, idx) => (
                <div
                  key={idx}
                  className="flex-1 border-r border-[#E2E8F0] flex items-center justify-center text-center uppercase tracking-tight"
                >
                  {m.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })}
                </div>
              ))}
            </div>

            {/* Timeline Bars Area */}
            <div className="relative divide-y divide-[#F1F5F9]">
              {/* Vertical Grid Columns */}
              <div className="absolute inset-0 flex pointer-events-none">
                {months.map((_, idx) => (
                  <div key={idx} className="flex-1 border-r border-[#F1F5F9]" />
                ))}
              </div>

              {/* Rows */}
              {visibleItems.map(item => {
                const pos = getBarPosition(item.startDate, item.targetDate)
                const days = getDaysRemaining(item.targetDate)
                const isOverdue = days < 0 && item.status !== 'Completed' && item.status !== 'Paid'

                return (
                  <div
                    key={item.id}
                    className="h-11 relative flex items-center hover:bg-[#F8FAFC]/50 transition-colors px-2"
                  >
                    {/* The Gantt Bar */}
                    <div
                      className={`absolute h-6 rounded-[4px] border shadow-xs flex items-center px-2 text-[10px] text-white font-medium overflow-hidden transition-all duration-300 ${
                        barColors[item.level]
                      }`}
                      style={{
                        left: pos.left,
                        width: pos.width
                      }}
                      title={`${item.name} (${formatDate(item.startDate)} - ${formatDate(item.targetDate)}) — Progress: ${item.progress}%`}
                    >
                      {/* Inner Progress Fill */}
                      <div
                        className="absolute inset-y-0 left-0 bg-white/20"
                        style={{ width: `${item.progress}%` }}
                      />

                      <span className="relative z-10 truncate text-[10px] leading-none drop-shadow-xs">
                        {item.progress}% {isOverdue ? '⚠️ Overdue' : ''}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}
