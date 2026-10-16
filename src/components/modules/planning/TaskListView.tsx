import React, { useState, useMemo } from 'react'
import { Plus, Search, Filter, Edit2, Trash2, CheckSquare } from 'lucide-react'
import { Card } from '../../common/Card'
import { Button } from '../../common/Button'
import { StatusBadge } from '../../common/Badge'
import { EmptyState } from '../../common/EmptyState'
import { TaskModal } from './TaskModal'
import { useCapex } from '../../../context/CapexContext'
import { Task } from '../../../types/capex'
import { formatDate } from '../../../utils/formatters'

export const TaskListView: React.FC = () => {
  const {
    tasks,
    milestones,
    sections,
    projects,
    filteredTasks,
    deleteTask,
    selectedProjectId
  } = useCapex()

  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [taskToEdit, setTaskToEdit] = useState<Task | null>(null)

  const displayedTasks = useMemo(() => {
    return filteredTasks.filter(t => {
      const proj = projects.find(p => p.id === t.projectId)
      const sec = sections.find(s => s.id === t.sectionId)
      const ms = milestones.find(m => m.id === t.milestoneId)

      const matchesSearch =
        t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.wbsNumber.includes(searchTerm) ||
        (proj && proj.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (ms && ms.name.toLowerCase().includes(searchTerm.toLowerCase()))

      const matchesStatus = statusFilter === 'ALL' || t.status === statusFilter
      return matchesSearch && matchesStatus
    })
  }, [filteredTasks, searchTerm, statusFilter, projects, sections, milestones])

  const handleEdit = (task: Task) => {
    setTaskToEdit(task)
    setIsModalOpen(true)
  }

  const handleCreate = () => {
    setTaskToEdit(null)
    setIsModalOpen(true)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <CheckSquare className="w-5 h-5 text-emerald-600" />
            <h2 className="text-xl font-bold text-[#0F172A] font-heading tracking-tight">
              Work Package Management
            </h2>
          </div>
          <p className="text-xs text-[#64748B] mt-0.5">
            Detailed work execution packages mapped to parent projects, sections, and milestones.
          </p>
        </div>

        <Button
          variant="primary"
          onClick={handleCreate}
          leftIcon={<Plus className="w-4 h-4" />}
        >
          Add Work Package
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <Card noPadding className="p-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-[#94A3B8] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search by work package, project..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-10 pl-9 pr-3 text-xs bg-white text-[#0F172A] border border-[#CBD5E1] rounded-[6px] focus:outline-hidden focus:ring-2 focus:ring-[#2563EB]/25 focus:border-[#2563EB]"
            />
          </div>

          <div className="flex items-center gap-2.5 w-full md:w-auto">
            <Filter className="w-3.5 h-3.5 text-[#64748B]" />
            <span className="text-xs text-[#64748B] font-medium">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-10 px-3 text-xs bg-white text-[#0F172A] border border-[#CBD5E1] rounded-[6px] focus:outline-hidden focus:ring-2 focus:ring-[#2563EB]/25 cursor-pointer"
            >
              <option value="ALL">All Work Packages ({filteredTasks.length})</option>
              <option value="Pending">Pending</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
              <option value="Blocked">Blocked</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Table */}
      <Card noPadding className="overflow-hidden">
        {displayedTasks.length === 0 ? (
          <EmptyState
            title="No Work Packages Found"
            description="No work packages match your current filters. Add a new work package to assign engineering scopes."
            actionLabel="Add Work Package"
            onAction={handleCreate}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[11px] font-semibold text-[#475569] uppercase tracking-wider sticky top-0 z-10">
                  <th className="py-3 px-4">WBS / Work Package Name</th>
                  <th className="py-3 px-3">Project</th>
                  <th className="py-3 px-3">Section</th>
                  <th className="py-3 px-3">Start Date</th>
                  <th className="py-3 px-3">Target Date</th>
                  <th className="py-3 px-3">Progress</th>
                  <th className="py-3 px-3 text-center">Status</th>
                  <th className="py-3 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F5F9] text-xs text-[#0F172A]">
                {displayedTasks.map((tsk) => {
                  const proj = projects.find(p => p.id === tsk.projectId)
                  const ms = milestones.find(m => m.id === tsk.milestoneId)

                  return (
                    <tr key={tsk.id} className="hover:bg-[#F8FAFC]/80 transition-colors">
                      <td className="py-3.5 px-4 max-w-xs">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[11px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-sm shrink-0 border border-emerald-200/60">
                            {tsk.wbsNumber}
                          </span>
                          <span className="font-semibold text-[#0F172A] leading-snug">
                            {tsk.name}
                          </span>
                        </div>
                      </td>

                      <td className="py-3.5 px-3">
                        <span className="text-[#334155] font-medium block truncate max-w-[150px]">
                          {proj ? proj.name : '—'}
                        </span>
                        <span className="text-[10px] font-mono text-[#64748B]">
                          {proj ? proj.code : ''}
                        </span>
                      </td>

                      <td className="py-3.5 px-3 text-[#64748B] max-w-[150px] truncate">
                        {ms ? ms.name : '—'}
                      </td>

                      <td className="py-3.5 px-3 text-[#334155] whitespace-nowrap">
                        {formatDate(tsk.startDate)}
                      </td>

                      <td className="py-3.5 px-3 text-[#334155] whitespace-nowrap">
                        {formatDate(tsk.targetDate)}
                      </td>

                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-[#E2E8F0] rounded-full h-1.5 overflow-hidden">
                            <div
                              className="bg-emerald-600 h-1.5 rounded-full"
                              style={{ width: `${tsk.progress}%` }}
                            />
                          </div>
                          <span className="font-mono text-[11px] text-[#475569]">
                            {tsk.progress}%
                          </span>
                        </div>
                      </td>

                      <td className="py-3.5 px-3 text-center whitespace-nowrap">
                        <StatusBadge status={tsk.status} />
                      </td>

                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleEdit(tsk)}
                            className="p-1.5 text-[#64748B] hover:text-[#0F172A] hover:bg-[#F1F5F9] rounded-[4px] cursor-pointer"
                            title="Edit Work Package"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => deleteTask(tsk.id)}
                            className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-[4px] cursor-pointer"
                            title="Delete Work Package"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Modal */}
      <TaskModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        taskToEdit={taskToEdit}
      />
    </div>
  )
}
