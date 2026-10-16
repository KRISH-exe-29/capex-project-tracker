import React, { useState, useMemo } from 'react'
import {
  CalendarRange,
  ChevronDown,
  ChevronRight
} from 'lucide-react'
import { PageHeader } from '../../common/PageHeader'
import { EmptyState } from '../../common/EmptyState'
import { Card } from '../../common/Card'
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

  // Everything starts expanded; the map only records nodes the user collapsed.
  const [collapsedNodes, setCollapsedNodes] = useState<Record<string, boolean>>({})
  const isExpanded = (id: string) => !collapsedNodes[id]

  // Timeline spans the earliest start to the latest target date in the data, whole months, at least 12.
  const { timelineStart, timelineEnd, months } = useMemo(() => {
    const dates = [
      ...projects.flatMap(p => [p.startDate || p.approvedDate, p.endDate]),
      ...tasks.flatMap(t => [t.startDate, t.targetDate]),
      ...subWorks.map(sw => sw.targetDate)
    ]
      .filter(Boolean)
      .map(value => parseISO(value as string))
      .filter(date => !Number.isNaN(date.getTime()))
    const now = new Date()
    const min = dates.length ? new Date(Math.min(...dates.map(date => date.getTime()))) : now
    const max = dates.length ? new Date(Math.max(...dates.map(date => date.getTime()))) : now
    const start = new Date(min.getFullYear(), min.getMonth(), 1)
    const end = new Date(max.getFullYear(), max.getMonth() + 1, 0)
    if ((end.getFullYear() - start.getFullYear()) * 12 + end.getMonth() - start.getMonth() < 11) {
      end.setTime(new Date(start.getFullYear(), start.getMonth() + 12, 0).getTime())
    }
    const list: Date[] = []
    const cursor = new Date(start)
    while (cursor <= end) {
      list.push(new Date(cursor))
      cursor.setMonth(cursor.getMonth() + 1)
    }
    return { timelineStart: start, timelineEnd: end, months: list }
  }, [projects, tasks, subWorks])
  const totalDays = Math.max(1, differenceInDays(timelineEnd, timelineStart))

  const toggleExpand = (id: string) => {
    setCollapsedNodes(prev => ({ ...prev, [id]: !prev[id] }))
  }

  // Progress of a branch = average reported progress of its work packages (0 when it has none).
  const avgProgress = (match: (task: (typeof tasks)[number]) => boolean) => {
    const list = tasks.filter(match)
    return list.length ? Math.round(list.reduce((sum, task) => sum + (task.progress || 0), 0) / list.length) : 0
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
        progress: avgProgress(task => task.projectId === proj.id),
        status: proj.status,
        type: 'Project'
      })

      if (isExpanded(proj.id)) {
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
              progress: avgProgress(task => task.phaseId === ph.id),
              status: ph.status,
              type: 'Phase'
            })

            if (isExpanded(ph.id)) {
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
                  progress: avgProgress(task => task.partId === pt.id),
                  status: pt.status,
                  type: 'Part'
                })

                if (isExpanded(pt.id)) {
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
                      progress: avgProgress(task => task.sectionId === sec.id),
                      status: 'In Progress',
                      type: 'Section'
                    })

                    if (isExpanded(sec.id)) {
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

                        if (isExpanded(tsk.id)) {
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
                              progress: sw.status === 'Paid' ? 100 : 0,
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
            progress: avgProgress(task => task.sectionId === sec.id),
            status: 'In Progress',
            type: 'Section'
          })

          if (isExpanded(sec.id)) {
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

              if (isExpanded(tsk.id)) {
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
                    progress: sw.status === 'Paid' ? 100 : 0,
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
  }, [projects, phases, parts, sections, milestones, tasks, subWorks, selectedProjectId, collapsedNodes])

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
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <PageHeader
          eyebrow="Planning"
          title="Gantt Chart"
          description="Timeline of projects, sections, work packages and PO target dates. Progress is the average reported on work packages."
        />
        {/* Legend */}
        <div className="glass flex flex-wrap items-center gap-3 rounded-lg px-3 py-2 text-xs">
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

      {visibleItems.length === 0 && (
        <Card>
          <EmptyState
            icon={<CalendarRange className="h-6 w-6" />}
            title="Nothing to schedule yet"
            description="The chart fills in once projects and work packages with dates exist."
          />
        </Card>
      )}

      {/* Main Gantt Split Container */}
      <Card noPadding className={visibleItems.length ? 'overflow-hidden' : 'hidden'}>
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
                const open = isExpanded(item.id)
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
                          {open ? (
                            <ChevronDown className="w-3 h-3" />
                          ) : (
                            <ChevronRight className="w-3 h-3" />
                          )}
                        </button>
                      ) : (
                        <span className="w-5" />
                      )}

                      <span
                        className={`font-mono text-[10px] font-bold px-1.5 py-0.5 rounded-xs shrink-0 ${
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
                  <div key={idx} className="flex-1 border-r border-slate-200/70" />
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
                      className={`absolute h-6 rounded border shadow-xs flex items-center px-2 text-[10px] text-white font-medium overflow-hidden transition-all duration-300 ${
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
                        {item.progress}%{isOverdue ? ' · overdue' : ''}
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
