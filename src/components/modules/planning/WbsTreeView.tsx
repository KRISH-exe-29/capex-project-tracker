import React, { useState } from 'react'
import {
  ChevronRight,
  ChevronDown,
  Plus,
  Edit2,
  Trash2,
  Network,
  FolderKanban,
  Layers,
  CheckSquare,
  BriefcaseBusiness,
  Building2,
  Filter,
  Search,
  ExternalLink,
  Calendar,
  Layers2
} from 'lucide-react'
import { Card } from '../../common/Card'
import { Button } from '../../common/Button'
import { StatusBadge } from '../../common/Badge'
import { PhaseModal } from './PhaseModal'
import { PartModal } from './PartModal'
import { SectionModal } from './SectionModal'
import { MilestoneModal } from './MilestoneModal'
import { TaskModal } from './TaskModal'
import { SubWorkModal } from './SubWorkModal'
import { useCapex } from '../../../context/CapexContext'
import { formatINR, formatDate } from '../../../utils/formatters'
import { ProjectPhase, ProjectPart, Section, Milestone, Task, SubWork } from '../../../types/capex'

export const WbsTreeView: React.FC = () => {
  const {
    projects,
    phases,
    parts,
    sections,
    milestones,
    tasks,
    subWorks,
    selectedProjectId,
    deletePhase,
    deletePart,
    deleteSection,
    deleteMilestone,
    deleteTask,
    deleteSubWork
  } = useCapex()

  // Track expanded state of nodes
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

  const [searchTerm, setSearchTerm] = useState('')

  // Modals state
  const [isPhaseModalOpen, setIsPhaseModalOpen] = useState(false)
  const [phaseToEdit, setPhaseToEdit] = useState<ProjectPhase | null>(null)
  const [phaseDefaultProj, setPhaseDefaultProj] = useState<string>('')

  const [isPartModalOpen, setIsPartModalOpen] = useState(false)
  const [partToEdit, setPartToEdit] = useState<ProjectPart | null>(null)
  const [partDefaultProj, setPartDefaultProj] = useState<string>('')
  const [partDefaultPhase, setPartDefaultPhase] = useState<string>('')

  const [isSecModalOpen, setIsSecModalOpen] = useState(false)
  const [secToEdit, setSecToEdit] = useState<Section | null>(null)
  const [secDefaultProj, setSecDefaultProj] = useState<string>('')
  const [secDefaultPart, setSecDefaultPart] = useState<string>('')

  const [isMsModalOpen, setIsMsModalOpen] = useState(false)
  const [msToEdit, setMsToEdit] = useState<Milestone | null>(null)
  const [msDefaultProj, setMsDefaultProj] = useState<string>('')
  const [msDefaultSec, setMsDefaultSec] = useState<string>('')

  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false)
  const [taskToEdit, setTaskToEdit] = useState<Task | null>(null)
  const [taskDefaultProj, setTaskDefaultProj] = useState<string>('')
  const [taskDefaultSec, setTaskDefaultSec] = useState<string>('')
  const [taskDefaultMs, setTaskDefaultMs] = useState<string>('')

  const [isSubModalOpen, setIsSubModalOpen] = useState(false)
  const [subToEdit, setSubToEdit] = useState<SubWork | null>(null)
  const [subDefaultProj, setSubDefaultProj] = useState<string>('')
  const [subDefaultSec, setSubDefaultSec] = useState<string>('')
  const [subDefaultMs, setSubDefaultMs] = useState<string>('')
  const [subDefaultTask, setSubDefaultTask] = useState<string>('')

  const toggleExpand = (nodeId: string) => {
    setExpandedNodes(prev => ({ ...prev, [nodeId]: !prev[nodeId] }))
  }

  const relevantProjects = selectedProjectId === 'all'
    ? projects
    : projects.filter(p => p.id === selectedProjectId)

  return (
    <div className="space-y-6">
      {/* Filter and Search Bar */}
      <Card noPadding className="p-4">
        <div className="relative w-full max-w-sm">
          <Search className="w-4 h-4 text-[#94A3B8] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Filter WBS items or numbers (e.g. 1.1, Civil)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-10 pl-9 pr-3 text-xs bg-white text-[#0F172A] border border-[#CBD5E1] rounded-[6px] focus:outline-hidden focus:ring-2 focus:ring-[#2563EB]/25 focus:border-[#2563EB]"
          />
        </div>
      </Card>

      {/* WBS Tree Container */}
      <div className="space-y-4">
        {relevantProjects.map((proj, projIndex) => {
          const isProjExpanded = expandedNodes[proj.id] ?? true
          const projPhases = phases.filter(ph => ph.projectId === proj.id)
          const projDirectSections = sections.filter(s => s.projectId === proj.id && !s.partId)
          const projNum = (projIndex + 1).toString()

          return (
            <Card key={proj.id} noPadding className="overflow-hidden border-[#CBD5E1]">
              {/* Level 1: Project Header Row */}
              <div className="p-3.5 bg-blue-50/70 border-b border-blue-200 flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => toggleExpand(proj.id)}
                    className="p-1 rounded-sm hover:bg-blue-100 text-blue-800 cursor-pointer"
                  >
                    {isProjExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                  </button>

                  <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-sm bg-blue-600 text-white shadow-xs">
                    {projNum}
                  </span>

                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-[#0F172A] font-heading">
                        {proj.name}
                      </h3>
                      <StatusBadge status={proj.status} />
                    </div>
                    <p className="text-[11px] text-[#64748B]">
                      Overall Approved: <strong className="font-mono text-blue-700">{formatINR(proj.approvedAmount)}</strong> | PO Committed:{' '}
                      <strong className="font-mono text-[#0F172A]">{formatINR(proj.poValue)}</strong> | Timeline:{' '}
                      {proj.executionTimeline}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="primary"
                    size="sm"
                    className="h-8 text-xs"
                    leftIcon={<Plus className="w-3.5 h-3.5" />}
                    onClick={() => {
                      setPhaseToEdit(null)
                      setPhaseDefaultProj(proj.id)
                      setIsPhaseModalOpen(true)
                    }}
                  >
                    Add Phase
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs bg-white"
                    leftIcon={<Plus className="w-3.5 h-3.5 text-blue-600" />}
                    onClick={() => {
                      setSecToEdit(null)
                      setSecDefaultProj(proj.id)
                      setSecDefaultPart('')
                      setIsSecModalOpen(true)
                    }}
                  >
                    Add Section
                  </Button>
                </div>
              </div>

              {/* Tree Content */}
              {isProjExpanded && (
                <div className="divide-y divide-[#F1F5F9]">
                  {projPhases.length === 0 && projDirectSections.length === 0 ? (
                    <div className="p-4 text-center text-xs text-[#94A3B8] italic">
                      No WBS phases or sections created for this project yet. Click &quot;Add Phase&quot; to define Level 2.
                    </div>
                  ) : null}

                  {/* Level 2: Project Phases */}
                  {projPhases.map((phase) => {
                    const isPhaseExpanded = expandedNodes[phase.id] ?? true
                    const phaseParts = parts.filter(pt => pt.phaseId === phase.id)

                    return (
                      <div key={phase.id} className="bg-slate-50/50">
                        {/* Phase Row (Level 2) */}
                        <div className="py-2.5 px-4 pl-6 flex items-center justify-between hover:bg-purple-50/40 transition-colors gap-2 border-b border-[#F1F5F9]">
                          <div className="flex items-center gap-2.5 overflow-hidden">
                            <button
                              onClick={() => toggleExpand(phase.id)}
                              className="p-1 rounded-sm hover:bg-purple-100 text-purple-700 cursor-pointer"
                            >
                              {isPhaseExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                            </button>

                            <span className="font-mono text-xs font-bold px-1.5 py-0.5 rounded-sm bg-purple-100 text-purple-800 border border-purple-200">
                              {phase.wbsNumber}
                            </span>

                            <div className="truncate flex items-center gap-2">
                              <span className="text-xs font-bold text-[#0F172A]">
                                {phase.name}
                              </span>
                              <span className="font-mono text-xs font-semibold text-purple-800 bg-purple-50 px-2 py-0.5 rounded-sm border border-purple-200">
                                {formatINR(phase.budgetAmount)}
                              </span>
                              <span className="text-[11px] text-[#64748B] hidden sm:inline">
                                (CAPEX Approved: {formatDate(phase.capexApprovalDate)})
                              </span>
                            </div>

                            <StatusBadge status={phase.status} />
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 text-[11px] px-2 text-purple-700 hover:bg-purple-50"
                              leftIcon={<Plus className="w-3 h-3 text-purple-600" />}
                              onClick={() => {
                                setPartToEdit(null)
                                setPartDefaultProj(proj.id)
                                setPartDefaultPhase(phase.id)
                                setIsPartModalOpen(true)
                              }}
                            >
                              Add Part
                            </Button>
                            <button
                              onClick={() => {
                                setPhaseToEdit(phase)
                                setIsPhaseModalOpen(true)
                              }}
                              className="p-1 text-[#64748B] hover:text-[#0F172A] cursor-pointer"
                              title="Edit Phase"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => deletePhase(phase.id)}
                              className="p-1 text-rose-500 hover:text-rose-700 cursor-pointer"
                              title="Delete Phase"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Level 3: Parts under Phase */}
                        {isPhaseExpanded && (
                          <div className="divide-y divide-[#F1F5F9] bg-white">
                            {phaseParts.map((part) => {
                              const isPartExpanded = expandedNodes[part.id] ?? true
                              const partSections = sections.filter(s => s.partId === part.id)

                              return (
                                <div key={part.id}>
                                  {/* Part Row (Level 3) */}
                                  <div className="py-2.5 px-4 pl-12 flex items-center justify-between hover:bg-sky-50/30 transition-colors gap-2 border-b border-[#F1F5F9]">
                                    <div className="flex items-center gap-2.5 overflow-hidden">
                                      <button
                                        onClick={() => toggleExpand(part.id)}
                                        className="p-1 rounded-sm hover:bg-sky-100 text-sky-700 cursor-pointer"
                                      >
                                        {isPartExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                                      </button>

                                      <span className="font-mono text-xs font-bold px-1.5 py-0.5 rounded-sm bg-sky-100 text-sky-800 border border-sky-200">
                                        {part.wbsNumber}
                                      </span>

                                      <div className="truncate flex items-center gap-2">
                                        <span className="text-xs font-bold text-[#0F172A]">
                                          {part.name}
                                        </span>
                                        <span className="font-mono text-xs font-semibold text-sky-800 bg-sky-50 px-2 py-0.5 rounded-sm border border-sky-200">
                                          {formatINR(part.budgetAmount)}
                                        </span>
                                      </div>

                                      <StatusBadge status={part.status} />
                                    </div>

                                    <div className="flex items-center gap-2 shrink-0">
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-7 text-[11px] px-2 text-indigo-700 hover:bg-indigo-50"
                                        leftIcon={<Plus className="w-3 h-3 text-indigo-600" />}
                                        onClick={() => {
                                          setSecToEdit(null)
                                          setSecDefaultProj(proj.id)
                                          setSecDefaultPart(part.id)
                                          setIsSecModalOpen(true)
                                        }}
                                      >
                                        Add Section
                                      </Button>
                                      <button
                                        onClick={() => {
                                          setPartToEdit(part)
                                          setIsPartModalOpen(true)
                                        }}
                                        className="p-1 text-[#64748B] hover:text-[#0F172A] cursor-pointer"
                                        title="Edit Part"
                                      >
                                        <Edit2 className="w-3.5 h-3.5" />
                                      </button>
                                      <button
                                        onClick={() => deletePart(part.id)}
                                        className="p-1 text-rose-500 hover:text-rose-700 cursor-pointer"
                                        title="Delete Part"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  </div>

                                  {/* Level 4: Sections under Part */}
                                  {isPartExpanded && (
                                    <div className="divide-y divide-[#F1F5F9] bg-[#F8FAFC]/50">
                                      {partSections.map((sec) => {
                                        const isSecExpanded = expandedNodes[sec.id] ?? true
                                        const secTasks = tasks.filter(t => t.sectionId === sec.id)

                                        return (
                                          <div key={sec.id}>
                                            {/* Section Row */}
                                            <div className="py-2.5 px-4 pl-18 flex items-center justify-between hover:bg-slate-100/60 transition-colors gap-2">
                                              <div className="flex items-center gap-2.5 overflow-hidden">
                                                <button
                                                  onClick={() => toggleExpand(sec.id)}
                                                  className="p-1 rounded-sm hover:bg-slate-200 text-slate-700 cursor-pointer"
                                                >
                                                  {isSecExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                                                </button>

                                                <span className="font-mono text-xs font-bold px-1.5 py-0.5 rounded-sm bg-slate-200 text-slate-800">
                                                  {sec.wbsNumber}
                                                </span>

                                                <div className="truncate">
                                                  <span className="text-xs font-bold text-[#0F172A]">
                                                    {sec.name}
                                                  </span>
                                                  {sec.description && (
                                                    <span className="text-[11px] text-[#64748B] ml-2 hidden sm:inline truncate">
                                                      — {sec.description}
                                                    </span>
                                                  )}
                                                </div>
                                              </div>

                                              <div className="flex items-center gap-2 shrink-0">
                                                <Button
                                                  variant="outline"
                                                  size="sm"
                                                  className="h-7 text-[11px] px-2"
                                                  leftIcon={<Plus className="w-3 h-3 text-emerald-600" />}
                                                  onClick={() => {
                                                    setTaskToEdit(null)
                                                    setTaskDefaultProj(proj.id)
                                                    setTaskDefaultSec(sec.id)
                                                    setTaskDefaultMs('')
                                                    setIsTaskModalOpen(true)
                                                  }}
                                                >
                                                  Add Work Package
                                                </Button>
                                                <button
                                                  onClick={() => {
                                                    setSecToEdit(sec)
                                                    setIsSecModalOpen(true)
                                                  }}
                                                  className="p-1 text-[#64748B] hover:text-[#0F172A] cursor-pointer"
                                                >
                                                  <Edit2 className="w-3.5 h-3.5" />
                                                </button>
                                                <button
                                                  onClick={() => deleteSection(sec.id)}
                                                  className="p-1 text-rose-500 hover:text-rose-700 cursor-pointer"
                                                >
                                                  <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                              </div>
                                            </div>

                                            {/* Level 5: Work Packages */}
                                            {isSecExpanded && (
                                              <div className="divide-y divide-[#F1F5F9] bg-white">
                                                {secTasks.map((tsk) => {
                                                  const isTaskExpanded = expandedNodes[tsk.id] ?? true
                                                  const taskSubworks = subWorks.filter(sw => sw.taskId === tsk.id)

                                                  return (
                                                    <div key={tsk.id}>
                                                      {/* Work Package Row */}
                                                      <div className="py-2 px-4 pl-24 flex items-center justify-between hover:bg-emerald-50/30 transition-colors gap-2">
                                                        <div className="flex items-center gap-2 overflow-hidden">
                                                          <button
                                                            onClick={() => toggleExpand(tsk.id)}
                                                            className="p-1 rounded-sm hover:bg-emerald-100 text-emerald-700 cursor-pointer"
                                                          >
                                                            {isTaskExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                                                          </button>

                                                          <span className="font-mono text-[11px] font-bold px-1.5 py-0.5 rounded-sm bg-emerald-100 text-emerald-800">
                                                            {tsk.wbsNumber}
                                                          </span>

                                                          <span className="text-xs font-semibold text-[#0F172A] truncate">
                                                            {tsk.name}
                                                          </span>

                                                          <StatusBadge status={tsk.status} />
                                                        </div>

                                                        <div className="flex items-center gap-2 shrink-0">
                                                          <span className="text-[11px] font-mono text-emerald-700 font-semibold hidden sm:inline">
                                                            {tsk.progress}%
                                                          </span>

                                                          <Button
                                                            variant="outline"
                                                            size="sm"
                                                            className="h-6 text-[10px] px-2 text-amber-800 hover:bg-amber-50"
                                                            leftIcon={<Plus className="w-3 h-3 text-amber-600" />}
                                                            onClick={() => {
                                                              setSubToEdit(null)
                                                              setSubDefaultProj(proj.id)
                                                              setSubDefaultSec(sec.id)
                                                              setSubDefaultMs('')
                                                              setSubDefaultTask(tsk.id)
                                                              setIsSubModalOpen(true)
                                                            }}
                                                          >
                                                            Add Sub-work
                                                          </Button>

                                                          <button
                                                            onClick={() => {
                                                              setTaskToEdit(tsk)
                                                              setIsTaskModalOpen(true)
                                                            }}
                                                            className="p-1 text-[#64748B] hover:text-[#0F172A] cursor-pointer"
                                                          >
                                                            <Edit2 className="w-3 h-3" />
                                                          </button>
                                                          <button
                                                            onClick={() => deleteTask(tsk.id)}
                                                            className="p-1 text-rose-500 hover:text-rose-700 cursor-pointer"
                                                          >
                                                            <Trash2 className="w-3 h-3" />
                                                          </button>
                                                        </div>
                                                      </div>

                                                      {/* Level 6: Sub-works */}
                                                      {isTaskExpanded && (
                                                        <div className="divide-y divide-[#F1F5F9] bg-[#FFFBEB]/30">
                                                          {taskSubworks.map((sw) => (
                                                            <div
                                                              key={sw.id}
                                                              className="py-2 px-4 pl-32 flex items-center justify-between hover:bg-amber-100/30 transition-colors gap-2 text-xs"
                                                            >
                                                              <div className="flex items-center gap-2 overflow-hidden">
                                                                <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded-sm bg-amber-100 text-amber-900">
                                                                  {sw.wbsNumber}
                                                                </span>

                                                                <span className="text-xs text-[#0F172A] font-medium truncate">
                                                                  {sw.workDescription}
                                                                </span>

                                                                <span className="text-[11px] font-mono text-[#64748B]">
                                                                  PO: {sw.poNumber}
                                                                </span>

                                                                <span className="text-[11px] text-[#475569] hidden md:inline">
                                                                  ({sw.supplierName} • {sw.bpCode})
                                                                </span>
                                                              </div>

                                                              <div className="flex items-center gap-3 shrink-0">
                                                                <span className="font-mono font-bold text-blue-700">
                                                                  {formatINR(sw.poValueGst)}
                                                                </span>

                                                                <StatusBadge status={sw.status} />

                                                                <button
                                                                  onClick={() => {
                                                                    setSubToEdit(sw)
                                                                    setIsSubModalOpen(true)
                                                                  }}
                                                                  className="p-1 text-[#64748B] hover:text-[#0F172A] cursor-pointer"
                                                                >
                                                                  <Edit2 className="w-3 h-3" />
                                                                </button>
                                                                <button
                                                                  onClick={() => deleteSubWork(sw.id)}
                                                                  className="p-1 text-rose-500 hover:text-rose-700 cursor-pointer"
                                                                >
                                                                  <Trash2 className="w-3 h-3" />
                                                                </button>
                                                              </div>
                                                            </div>
                                                          ))}
                                                        </div>
                                                      )}
                                                    </div>
                                                  )
                                                })}
                                              </div>
                                            )}
                                          </div>
                                        )
                                      })}
                                    </div>
                                  )}
                                </div>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    )
                  })}

                  {/* Direct Project Sections (if any without partId) */}
                  {projDirectSections.map((sec) => {
                    const isSecExpanded = expandedNodes[sec.id] ?? true
                    const secTasks = tasks.filter(t => t.sectionId === sec.id)

                    return (
                      <div key={sec.id} className="bg-white">
                        <div className="py-2.5 px-4 pl-8 flex items-center justify-between hover:bg-[#F8FAFC] transition-colors gap-2">
                          <div className="flex items-center gap-2.5 overflow-hidden">
                            <button
                              onClick={() => toggleExpand(sec.id)}
                              className="p-1 rounded-sm hover:bg-slate-200 text-slate-700 cursor-pointer"
                            >
                              {isSecExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                            </button>

                            <span className="font-mono text-xs font-bold px-1.5 py-0.5 rounded-sm bg-slate-200 text-slate-800">
                              {sec.wbsNumber}
                            </span>

                            <div className="truncate">
                              <span className="text-xs font-semibold text-[#0F172A]">
                                {sec.name}
                              </span>
                              {sec.description && (
                                <span className="text-[11px] text-[#64748B] ml-2 hidden sm:inline truncate">
                                  — {sec.description}
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 text-[11px] px-2"
                              leftIcon={<Plus className="w-3 h-3 text-emerald-600" />}
                              onClick={() => {
                                setTaskToEdit(null)
                                setTaskDefaultProj(proj.id)
                                setTaskDefaultSec(sec.id)
                                setTaskDefaultMs('')
                                setIsTaskModalOpen(true)
                              }}
                            >
                              Add Work Package
                            </Button>
                            <button
                              onClick={() => {
                                setSecToEdit(sec)
                                setIsSecModalOpen(true)
                              }}
                              className="p-1 text-[#64748B] hover:text-[#0F172A] cursor-pointer"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => deleteSection(sec.id)}
                              className="p-1 text-rose-500 hover:text-rose-700 cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Direct Tasks under Section */}
                        {isSecExpanded && (
                          <div className="divide-y divide-[#F1F5F9] bg-white">
                            {secTasks.map((tsk) => {
                              const isTaskExpanded = expandedNodes[tsk.id] ?? true
                              const taskSubworks = subWorks.filter(sw => sw.taskId === tsk.id)

                              return (
                                <div key={tsk.id}>
                                  <div className="py-2 px-4 pl-16 flex items-center justify-between hover:bg-emerald-50/30 transition-colors gap-2">
                                    <div className="flex items-center gap-2 overflow-hidden">
                                      <button
                                        onClick={() => toggleExpand(tsk.id)}
                                        className="p-1 rounded-sm hover:bg-emerald-100 text-emerald-700 cursor-pointer"
                                      >
                                        {isTaskExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                                      </button>
                                      <span className="font-mono text-[11px] font-bold px-1.5 py-0.5 rounded-sm bg-emerald-100 text-emerald-800">
                                        {tsk.wbsNumber}
                                      </span>
                                      <span className="text-xs font-semibold text-[#0F172A] truncate">
                                        {tsk.name}
                                      </span>
                                      <StatusBadge status={tsk.status} />
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-6 text-[10px] px-2 text-amber-800 hover:bg-amber-50"
                                        leftIcon={<Plus className="w-3 h-3 text-amber-600" />}
                                        onClick={() => {
                                          setSubToEdit(null)
                                          setSubDefaultProj(proj.id)
                                          setSubDefaultSec(sec.id)
                                          setSubDefaultMs('')
                                          setSubDefaultTask(tsk.id)
                                          setIsSubModalOpen(true)
                                        }}
                                      >
                                        Add Sub-work
                                      </Button>
                                    </div>
                                  </div>

                                  {isTaskExpanded && (
                                    <div className="divide-y divide-[#F1F5F9] bg-[#FFFBEB]/30">
                                      {taskSubworks.map((sw) => (
                                        <div
                                          key={sw.id}
                                          className="py-2 px-4 pl-24 flex items-center justify-between hover:bg-amber-100/30 transition-colors gap-2 text-xs"
                                        >
                                          <div className="flex items-center gap-2 overflow-hidden">
                                            <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded-sm bg-amber-100 text-amber-900">
                                              {sw.wbsNumber}
                                            </span>
                                            <span className="text-xs text-[#0F172A] font-medium truncate">
                                              {sw.workDescription}
                                            </span>
                                          </div>
                                          <div className="flex items-center gap-3 shrink-0">
                                            <span className="font-mono font-bold text-blue-700">
                                              {formatINR(sw.poValueGst)}
                                            </span>
                                            <StatusBadge status={sw.status} />
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </Card>
          )
        })}
      </div>

      {/* Modals */}
      <PhaseModal
        isOpen={isPhaseModalOpen}
        onClose={() => setIsPhaseModalOpen(false)}
        phaseToEdit={phaseToEdit}
        defaultProjectId={phaseDefaultProj}
      />

      <PartModal
        isOpen={isPartModalOpen}
        onClose={() => setIsPartModalOpen(false)}
        partToEdit={partToEdit}
        defaultProjectId={partDefaultProj}
        defaultPhaseId={partDefaultPhase}
      />

      <SectionModal
        isOpen={isSecModalOpen}
        onClose={() => setIsSecModalOpen(false)}
        sectionToEdit={secToEdit}
        defaultProjectId={secDefaultProj}
        defaultPartId={secDefaultPart}
      />

      <MilestoneModal
        isOpen={isMsModalOpen}
        onClose={() => setIsMsModalOpen(false)}
        milestoneToEdit={msToEdit}
        defaultProjectId={msDefaultProj}
        defaultSectionId={msDefaultSec}
      />

      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        taskToEdit={taskToEdit}
        defaultProjectId={taskDefaultProj}
        defaultSectionId={taskDefaultSec}
        defaultMilestoneId={taskDefaultMs}
      />

      <SubWorkModal
        isOpen={isSubModalOpen}
        onClose={() => setIsSubModalOpen(false)}
        subWorkToEdit={subToEdit}
        defaultProjectId={subDefaultProj}
        defaultSectionId={subDefaultSec}
        defaultMilestoneId={subDefaultMs}
        defaultTaskId={subDefaultTask}
      />
    </div>
  )
}
