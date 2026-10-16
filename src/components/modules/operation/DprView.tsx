import React, { useState, useMemo } from 'react'
import { Plus, Search, Filter, Edit2, Trash2, FileSpreadsheet, HardHat, Calendar, CheckCircle2 } from 'lucide-react'
import { Card } from '../../common/Card'
import { Button } from '../../common/Button'
import { StatusBadge } from '../../common/Badge'
import { EmptyState } from '../../common/EmptyState'
import { DprModal } from './DprModal'
import { useCapex } from '../../../context/CapexContext'
import { DprRecord } from '../../../types/capex'
import { formatDate } from '../../../utils/formatters'

export const DprView: React.FC = () => {
  const {
    dprRecords,
    filteredDpr,
    tasks,
    projects,
    deleteDprRecord,
    selectedProjectId
  } = useCapex()

  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [dprToEdit, setDprToEdit] = useState<DprRecord | null>(null)

  const displayedDpr = useMemo(() => {
    return filteredDpr.filter(d => {
      const proj = projects.find(p => p.id === d.projectId)
      const tsk = tasks.find(t => t.id === d.taskId)

      const matchesSearch =
        d.workDoneToday.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.submittedBy.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (proj && proj.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (tsk && tsk.name.toLowerCase().includes(searchTerm.toLowerCase()))

      const matchesStatus = statusFilter === 'ALL' || d.status === statusFilter
      return matchesSearch && matchesStatus
    })
  }, [filteredDpr, searchTerm, statusFilter, projects, tasks])

  const handleEdit = (dpr: DprRecord) => {
    setDprToEdit(dpr)
    setIsModalOpen(true)
  }

  const handleCreate = () => {
    setDprToEdit(null)
    setIsModalOpen(true)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
            <h2 className="text-xl font-bold text-[#0F172A] font-heading tracking-tight">
              Daily Progress Reports (DPR)
            </h2>
          </div>
          <p className="text-xs text-[#64748B] mt-0.5">
            Site progress logs, manpower deployment, equipment allocation, and hindrance tracking against WBS tasks.
          </p>
        </div>

        <Button
          variant="primary"
          onClick={handleCreate}
          leftIcon={<Plus className="w-4 h-4" />}
        >
          Submit Daily Report
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <Card noPadding className="p-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-[#94A3B8] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search by work done, submitter, task..."
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
              <option value="ALL">All Reports ({filteredDpr.length})</option>
              <option value="Submitted">Submitted</option>
              <option value="Verified">Verified</option>
              <option value="Approved">Approved</option>
            </select>
          </div>
        </div>
      </Card>

      {/* DPR Table */}
      <Card noPadding className="overflow-hidden">
        {displayedDpr.length === 0 ? (
          <EmptyState
            title="No DPR Records Found"
            description="No progress reports match the filter criteria. Submit a daily site report to track progress."
            actionLabel="Submit DPR"
            onAction={handleCreate}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[11px] font-semibold text-[#475569] uppercase tracking-wider sticky top-0 z-10">
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-3">Project & WBS Task</th>
                  <th className="py-3 px-3">Progress Added</th>
                  <th className="py-3 px-3">Manpower</th>
                  <th className="py-3 px-4">Work Done Today</th>
                  <th className="py-3 px-3">Submitted By</th>
                  <th className="py-3 px-3 text-center">Status</th>
                  <th className="py-3 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F5F9] text-xs text-[#0F172A]">
                {displayedDpr.map((dpr) => {
                  const proj = projects.find(p => p.id === dpr.projectId)
                  const tsk = tasks.find(t => t.id === dpr.taskId)

                  return (
                    <tr key={dpr.id} className="hover:bg-[#F8FAFC]/80 transition-colors">
                      {/* Date */}
                      <td className="py-3.5 px-4 whitespace-nowrap font-medium text-[#0F172A]">
                        {formatDate(dpr.reportDate)}
                      </td>

                      {/* Project & Task */}
                      <td className="py-3.5 px-3 max-w-[220px]">
                        <p className="font-semibold text-[#0F172A] truncate">
                          {tsk ? `${tsk.wbsNumber} - ${tsk.name}` : 'General Site Work'}
                        </p>
                        <p className="text-[10px] text-[#64748B] truncate mt-0.5">
                          {proj ? proj.name : 'Unknown Project'}
                        </p>
                      </td>

                      {/* Progress Added */}
                      <td className="py-3.5 px-3 whitespace-nowrap font-mono font-bold text-emerald-600">
                        +{dpr.dailyProgress}%
                      </td>

                      {/* Manpower */}
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 font-mono text-xs text-[#334155] bg-slate-100 px-2 py-0.5 rounded-[4px]">
                          <HardHat className="w-3 h-3 text-[#64748B]" />
                          {dpr.manpowerCount} Pax
                        </span>
                      </td>

                      {/* Work summary */}
                      <td className="py-3.5 px-4 max-w-sm">
                        <p className="text-[#334155] line-clamp-2 leading-relaxed">
                          {dpr.workDoneToday}
                        </p>
                        {dpr.hindrances && (
                          <p className="text-[10px] text-amber-700 mt-1 line-clamp-1 italic">
                            ⚠️ Hindrance: {dpr.hindrances}
                          </p>
                        )}
                      </td>

                      {/* Submitted By */}
                      <td className="py-3.5 px-3 whitespace-nowrap text-[#64748B]">
                        {dpr.submittedBy}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-3 text-center whitespace-nowrap">
                        <StatusBadge status={dpr.status} />
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleEdit(dpr)}
                            className="p-1.5 text-[#64748B] hover:text-[#0F172A] hover:bg-[#F1F5F9] rounded-[4px] cursor-pointer"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => deleteDprRecord(dpr.id)}
                            className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-[4px] cursor-pointer"
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

      <DprModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        dprToEdit={dprToEdit}
      />
    </div>
  )
}
