import React, { useState, useMemo } from 'react'
import { Plus, Search, Filter, Edit2, Trash2, Layers, CheckCircle2 } from 'lucide-react'
import { Card } from '../../common/Card'
import { Button } from '../../common/Button'
import { StatusBadge } from '../../common/Badge'
import { EmptyState } from '../../common/EmptyState'
import { MilestoneModal } from './MilestoneModal'
import { useCapex } from '../../../context/CapexContext'
import { Milestone } from '../../../types/capex'
import { formatDate } from '../../../utils/formatters'

export const MilestoneListView: React.FC = () => {
  const {
    milestones,
    sections,
    projects,
    filteredMilestones,
    deleteMilestone,
    selectedProjectId
  } = useCapex()

  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [milestoneToEdit, setMilestoneToEdit] = useState<Milestone | null>(null)

  const displayedMilestones = useMemo(() => {
    return filteredMilestones.filter(m => {
      const proj = projects.find(p => p.id === m.projectId)
      const sec = sections.find(s => s.id === m.sectionId)
      const matchesSearch =
        m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.wbsNumber.includes(searchTerm) ||
        (proj && proj.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (sec && sec.name.toLowerCase().includes(searchTerm.toLowerCase()))

      const matchesStatus = statusFilter === 'ALL' || m.status === statusFilter
      return matchesSearch && matchesStatus
    })
  }, [filteredMilestones, searchTerm, statusFilter, projects, sections])

  const handleEdit = (ms: Milestone) => {
    setMilestoneToEdit(ms)
    setIsModalOpen(true)
  }

  const handleCreate = () => {
    setMilestoneToEdit(null)
    setIsModalOpen(true)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-indigo-600" />
            <h2 className="text-xl font-bold text-[#0F172A] font-heading tracking-tight">
              Section Management
            </h2>
          </div>
          <p className="text-xs text-[#64748B] mt-0.5">
            Key delivery gates, site readiness sections, and target completion deadlines.
          </p>
        </div>

        <Button
          variant="primary"
          onClick={handleCreate}
          leftIcon={<Plus className="w-4 h-4" />}
        >
          Add Section
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <Card noPadding className="p-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-[#94A3B8] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search by section, project..."
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
              <option value="ALL">All Sections ({filteredMilestones.length})</option>
              <option value="Not Started">Not Started</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
              <option value="Delayed">Delayed</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Table */}
      <Card noPadding className="overflow-hidden">
        {displayedMilestones.length === 0 ? (
          <EmptyState
            title="No Sections Found"
            description="No sections match your current filters. Add a new section to track delivery gates."
            actionLabel="Add Section"
            onAction={handleCreate}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[11px] font-semibold text-[#475569] uppercase tracking-wider sticky top-0 z-10">
                  <th className="py-3 px-4">WBS / Section Name</th>
                  <th className="py-3 px-3">Project</th>
                  <th className="py-3 px-3">Parent Section</th>
                  <th className="py-3 px-3">Start Date</th>
                  <th className="py-3 px-3">Target Date</th>
                  <th className="py-3 px-3">Progress</th>
                  <th className="py-3 px-3 text-center">Status</th>
                  <th className="py-3 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F5F9] text-xs text-[#0F172A]">
                {displayedMilestones.map((ms) => {
                  const proj = projects.find(p => p.id === ms.projectId)
                  const sec = sections.find(s => s.id === ms.sectionId)

                  return (
                    <tr key={ms.id} className="hover:bg-[#F8FAFC]/80 transition-colors">
                      <td className="py-3.5 px-4 max-w-xs">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[11px] font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded-sm shrink-0 border border-indigo-200/60">
                            {ms.wbsNumber}
                          </span>
                          <span className="font-semibold text-[#0F172A] leading-snug">
                            {ms.name}
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
                        {sec ? sec.name : '—'}
                      </td>

                      <td className="py-3.5 px-3 text-[#334155] whitespace-nowrap">
                        {formatDate(ms.startDate)}
                      </td>

                      <td className="py-3.5 px-3 text-[#334155] whitespace-nowrap">
                        {formatDate(ms.targetDate)}
                      </td>

                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-[#E2E8F0] rounded-full h-1.5 overflow-hidden">
                            <div
                              className="bg-indigo-600 h-1.5 rounded-full"
                              style={{ width: `${ms.progress}%` }}
                            />
                          </div>
                          <span className="font-mono text-[11px] text-[#475569]">
                            {ms.progress}%
                          </span>
                        </div>
                      </td>

                      <td className="py-3.5 px-3 text-center whitespace-nowrap">
                        <StatusBadge status={ms.status} />
                      </td>

                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleEdit(ms)}
                            className="p-1.5 text-[#64748B] hover:text-[#0F172A] hover:bg-[#F1F5F9] rounded-[4px] cursor-pointer"
                            title="Edit Section"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => deleteMilestone(ms.id)}
                            className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-[4px] cursor-pointer"
                            title="Delete Section"
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
      <MilestoneModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        milestoneToEdit={milestoneToEdit}
      />
    </div>
  )
}
