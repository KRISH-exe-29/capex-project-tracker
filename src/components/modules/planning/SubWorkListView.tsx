import React, { useState, useMemo } from 'react'
import { Plus, Search, Filter, Edit2, Trash2, BriefcaseBusiness, IndianRupee } from 'lucide-react'
import { Card } from '../../common/Card'
import { Button } from '../../common/Button'
import { StatusBadge } from '../../common/Badge'
import { EmptyState } from '../../common/EmptyState'
import { SubWorkModal } from './SubWorkModal'
import { useCapex } from '../../../context/CapexContext'
import { SubWork } from '../../../types/capex'
import { formatINR, formatDate } from '../../../utils/formatters'

export const SubWorkListView: React.FC = () => {
  const {
    subWorks,
    tasks,
    projects,
    filteredSubWorks,
    deleteSubWork,
    selectedProjectId
  } = useCapex()

  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [subWorkToEdit, setSubWorkToEdit] = useState<SubWork | null>(null)

  const displayedSubWorks = useMemo(() => {
    return filteredSubWorks.filter(sw => {
      const proj = projects.find(p => p.id === sw.projectId)
      const tsk = tasks.find(t => t.id === sw.taskId)

      const matchesSearch =
        sw.workDescription.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sw.supplierName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sw.bpCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sw.poNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sw.wbsNumber.includes(searchTerm) ||
        (proj && proj.name.toLowerCase().includes(searchTerm.toLowerCase()))

      const matchesStatus = statusFilter === 'ALL' || sw.status === statusFilter
      return matchesSearch && matchesStatus
    })
  }, [filteredSubWorks, searchTerm, statusFilter, projects, tasks])

  const totalPoValue = displayedSubWorks.reduce((acc, curr) => acc + curr.poValueGst, 0)

  const handleEdit = (sw: SubWork) => {
    setSubWorkToEdit(sw)
    setIsModalOpen(true)
  }

  const handleCreate = () => {
    setSubWorkToEdit(null)
    setIsModalOpen(true)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <BriefcaseBusiness className="w-5 h-5 text-amber-600" />
            <h2 className="text-xl font-bold text-[#0F172A] font-heading tracking-tight">
              Sub-work & Procurement Management (Level 5)
            </h2>
          </div>
          <p className="text-xs text-[#64748B] mt-0.5">
            Discrete vendor Purchase Orders, BP codes, PO commitments with GST, and payment settlements.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-amber-50 rounded-[6px] border border-amber-200/80">
            <span className="text-xs text-amber-900 font-medium">Filtered PO Total:</span>
            <span className="text-xs font-mono font-bold text-amber-900">{formatINR(totalPoValue)}</span>
          </div>
          <Button
            variant="primary"
            onClick={handleCreate}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Record Sub-work PO
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
              placeholder="Search by supplier, PO number, BP code, work..."
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
              <option value="ALL">All PO Orders ({filteredSubWorks.length})</option>
              <option value="PO Issued">PO Issued</option>
              <option value="In Execution">In Execution</option>
              <option value="Billed">Billed</option>
              <option value="Paid">Paid</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Table */}
      <Card noPadding className="overflow-hidden">
        {displayedSubWorks.length === 0 ? (
          <EmptyState
            title="No Sub-work Records Found"
            description="No procurement orders match your filter criteria. Record a new sub-work PO to commit capital."
            actionLabel="Record Sub-work PO"
            onAction={handleCreate}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[11px] font-semibold text-[#475569] uppercase tracking-wider sticky top-0 z-10">
                  <th className="py-3 px-4">WBS / Work Description</th>
                  <th className="py-3 px-3">Supplier Name</th>
                  <th className="py-3 px-3">BP Code</th>
                  <th className="py-3 px-3">PO Number</th>
                  <th className="py-3 px-3 text-right">PO Value + GST</th>
                  <th className="py-3 px-3">Target Date</th>
                  <th className="py-3 px-3">Paid Date</th>
                  <th className="py-3 px-3 text-center">Status</th>
                  <th className="py-3 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F5F9] text-xs text-[#0F172A]">
                {displayedSubWorks.map((sw) => {
                  return (
                    <tr key={sw.id} className="hover:bg-[#F8FAFC]/80 transition-colors">
                      {/* WBS & Work Description */}
                      <td className="py-3.5 px-4 max-w-xs">
                        <div className="flex items-start gap-2">
                          <span className="font-mono text-[10px] font-bold text-amber-900 bg-amber-50 px-1.5 py-0.5 rounded-sm shrink-0 border border-amber-200/60">
                            {sw.wbsNumber}
                          </span>
                          <span className="font-semibold text-[#0F172A] leading-snug">
                            {sw.workDescription}
                          </span>
                        </div>
                      </td>

                      {/* Supplier */}
                      <td className="py-3.5 px-3 max-w-[200px] truncate text-[#0F172A] font-medium">
                        {sw.supplierName}
                      </td>

                      {/* BP Code */}
                      <td className="py-3.5 px-3 whitespace-nowrap font-mono text-xs text-[#64748B]">
                        {sw.bpCode}
                      </td>

                      {/* PO Number */}
                      <td className="py-3.5 px-3 whitespace-nowrap font-mono text-xs font-semibold text-[#2563EB]">
                        {sw.poNumber}
                      </td>

                      {/* PO Value + GST */}
                      <td className="py-3.5 px-3 text-right whitespace-nowrap font-mono font-bold text-[#0F172A]">
                        {formatINR(sw.poValueGst)}
                      </td>

                      {/* Target Date */}
                      <td className="py-3.5 px-3 whitespace-nowrap text-[#475569]">
                        {formatDate(sw.targetDate)}
                      </td>

                      {/* Paid Date */}
                      <td className="py-3.5 px-3 whitespace-nowrap text-[#64748B]">
                        {sw.paidDate ? (
                          <span className="text-emerald-700 font-medium">
                            {formatDate(sw.paidDate)}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic">Unsettled</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-3 text-center whitespace-nowrap">
                        <StatusBadge status={sw.status} />
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleEdit(sw)}
                            className="p-1.5 text-[#64748B] hover:text-[#0F172A] hover:bg-[#F1F5F9] rounded-[4px] cursor-pointer"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => deleteSubWork(sw.id)}
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

      <SubWorkModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        subWorkToEdit={subWorkToEdit}
        defaultProjectId={selectedProjectId !== 'all' ? selectedProjectId : undefined}
      />
    </div>
  )
}
