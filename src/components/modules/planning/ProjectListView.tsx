import React, { useState, useMemo } from 'react'
import {
  Plus,
  Search,
  Filter,
  Edit2,
  Trash2,
  Network,
  CalendarRange,
  Building2,
  AlertTriangle,
  ArrowUpDown,
  ExternalLink
} from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription } from '../../common/Card'
import { Button } from '../../common/Button'
import { StatusBadge } from '../../common/Badge'
import { EmptyState } from '../../common/EmptyState'
import { ProjectModal } from './ProjectModal'
import { useCapex } from '../../../context/CapexContext'
import { Project } from '../../../types/capex'
import { formatINR, formatDate } from '../../../utils/formatters'

export const ProjectListView: React.FC = () => {
  const {
    projects,
    deleteProject,
    setActiveModule,
    setSelectedProjectId
  } = useCapex()

  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [projectToEdit, setProjectToEdit] = useState<Project | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

  // Filtered projects
  const filteredProjects = useMemo(() => {
    return projects.filter(p => {
      const matchesSearch =
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.location && p.location.toLowerCase().includes(searchTerm.toLowerCase()))

      const matchesStatus = statusFilter === 'ALL' || p.status === statusFilter

      return matchesSearch && matchesStatus
    })
  }, [projects, searchTerm, statusFilter])

  const handleEdit = (proj: Project) => {
    setProjectToEdit(proj)
    setIsModalOpen(true)
  }

  const handleCreate = () => {
    setProjectToEdit(null)
    setIsModalOpen(true)
  }

  const handleViewWbs = (projectId: string) => {
    setSelectedProjectId(projectId)
    setActiveModule('planning-wbs')
  }

  const handleViewGantt = (projectId: string) => {
    setSelectedProjectId(projectId)
    setActiveModule('planning-gantt')
  }

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#0F172A] font-heading tracking-tight">
            CAPEX Projects Master
          </h2>
          <p className="text-xs text-[#64748B] mt-0.5">
            Create, track, and manage capital projects, approved expenditure ceilings, and balance commitments.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="primary"
            onClick={handleCreate}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Create CAPEX Project
          </Button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <Card noPadding className="p-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-[#94A3B8] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search by code, project name, location..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-10 pl-9 pr-3 text-xs bg-white text-[#0F172A] border border-[#CBD5E1] rounded-[6px] placeholder:text-[#94A3B8] focus:outline-hidden focus:ring-2 focus:ring-[#2563EB]/25 focus:border-[#2563EB]"
            />
          </div>

          <div className="flex items-center gap-2.5 w-full md:w-auto">
            <Filter className="w-3.5 h-3.5 text-[#64748B] shrink-0" />
            <span className="text-xs text-[#64748B] shrink-0 font-medium">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-10 px-3 text-xs bg-white text-[#0F172A] border border-[#CBD5E1] rounded-[6px] focus:outline-hidden focus:ring-2 focus:ring-[#2563EB]/25 focus:border-[#2563EB] cursor-pointer"
            >
              <option value="ALL">All Statuses ({projects.length})</option>
              <option value="Active">Active</option>
              <option value="Planning">Planning</option>
              <option value="Approved">Approved</option>
              <option value="Under Review">Under Review</option>
              <option value="Completed">Completed</option>
              <option value="Delayed">Delayed</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Projects Table */}
      <Card noPadding className="overflow-hidden">
        {filteredProjects.length === 0 ? (
          <EmptyState
            title="No Projects Found"
            description={
              searchTerm || statusFilter !== 'ALL'
                ? 'No projects match your search criteria. Try modifying your filters.'
                : 'Get started by creating your first CAPEX project.'
            }
            actionLabel="Create Project"
            onAction={handleCreate}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[11px] font-semibold text-[#475569] uppercase tracking-wider sticky top-0 z-10">
                  <th className="py-3 px-4">Code / Project Name</th>
                  <th className="py-3 px-3">Timeline</th>
                  <th className="py-3 px-3">Start Date</th>
                  <th className="py-3 px-3">End Date</th>
                  <th className="py-3 px-3 text-right">Approved Amount</th>
                  <th className="py-3 px-3 text-right">Balance Amount</th>
                  <th className="py-3 px-3 text-center">Status</th>
                  <th className="py-3 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F5F9] text-xs text-[#0F172A]">
                {filteredProjects.map((proj) => {
                  return (
                    <tr
                      key={proj.id}
                      className="hover:bg-[#F8FAFC]/80 transition-colors group"
                    >
                      {/* Code / Name */}
                      <td className="py-3.5 px-4 max-w-xs">
                        <div className="flex items-start gap-2">
                          <span className="font-mono text-[11px] font-bold text-[#2563EB] bg-blue-50 px-1.5 py-0.5 rounded-[4px] shrink-0 border border-blue-200/60">
                            {proj.code}
                          </span>
                          <div>
                            <p className="font-semibold text-[#0F172A] leading-snug">
                              {proj.name}
                            </p>
                            {proj.location && (
                              <p className="text-[11px] text-[#64748B] mt-0.5 truncate">
                                📍 {proj.location}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Timeline */}
                      <td className="py-3.5 px-3 whitespace-nowrap text-[#0F172A] font-medium">
                        {proj.executionTimeline}
                      </td>

                      {/* Start Date */}
                      <td className="py-3.5 px-3 whitespace-nowrap text-[#475569]">
                        {formatDate(proj.startDate || proj.approvedDate)}
                      </td>

                      {/* End Date */}
                      <td className="py-3.5 px-3 whitespace-nowrap text-[#475569]">
                        {formatDate(proj.endDate)}
                      </td>

                      {/* Approved Amount */}
                      <td className="py-3.5 px-3 text-right whitespace-nowrap font-mono font-semibold text-[#0F172A]">
                        {formatINR(proj.approvedAmount)}
                      </td>

                      {/* Balance Amount */}
                      <td className="py-3.5 px-3 text-right whitespace-nowrap font-mono font-bold">
                        <span className={proj.balanceAmount < 0 ? 'text-rose-600' : 'text-emerald-600'}>
                          {formatINR(proj.balanceAmount)}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-3 text-center whitespace-nowrap">
                        <StatusBadge status={proj.status} />
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handleViewWbs(proj.id)}
                            className="p-1.5 text-[#2563EB] hover:bg-blue-50 rounded-[4px] cursor-pointer"
                            title="Open Project WBS"
                          >
                            <Network className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleViewGantt(proj.id)}
                            className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-[4px] cursor-pointer"
                            title="View Gantt Schedule"
                          >
                            <CalendarRange className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleEdit(proj)}
                            className="p-1.5 text-[#64748B] hover:text-[#0F172A] hover:bg-[#F1F5F9] rounded-[4px] cursor-pointer"
                            title="Edit Project"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setConfirmDeleteId(proj.id)}
                            className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-[4px] cursor-pointer"
                            title="Delete Project"
                          >
                            <Trash2 className="w-4 h-4" />
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

      {/* Project Modal */}
      <ProjectModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        projectToEdit={projectToEdit}
      />

      {/* Delete Confirmation Dialog */}
      {confirmDeleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0F172A]/40 backdrop-blur-xs">
          <div className="bg-white rounded-[16px] border border-[#E2E8F0] shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <h3 className="text-base font-bold text-[#0F172A] font-heading">
                Confirm Project Deletion
              </h3>
            </div>
            <p className="text-xs text-[#64748B] leading-relaxed">
              Are you sure you want to delete this project? All associated WBS sections, milestones, tasks, sub-works, and documents will be cascaded and deleted.
            </p>
            <div className="flex justify-end gap-2.5 pt-2">
              <Button variant="outline" size="sm" onClick={() => setConfirmDeleteId(null)}>
                Cancel
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={() => {
                  deleteProject(confirmDeleteId)
                  setConfirmDeleteId(null)
                }}
              >
                Delete Permanently
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
