import React, { useState, useMemo } from 'react'
import {
  Plus,
  Search,
  Filter,
  Download,
  Eye,
  Trash2,
  Edit2
} from 'lucide-react'
import { Card } from '../../common/Card'
import { Button } from '../../common/Button'
import { StatusBadge } from '../../common/Badge'
import { EmptyState } from '../../common/EmptyState'
import { DocumentModal } from './DocumentModal'
import { DocumentPreviewModal } from './DocumentPreviewModal'
import { useCapex } from '../../../context/CapexContext'
import { ProjectDocument } from '../../../types/capex'
import { formatDate } from '../../../utils/formatters'

export const DocumentView: React.FC = () => {
  const {
    documents,
    filteredDocuments,
    projects,
    deleteDocument,
    selectedProjectId,
    addToast
  } = useCapex()

  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('ALL')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [docToEdit, setDocToEdit] = useState<ProjectDocument | null>(null)
  const [previewDoc, setPreviewDoc] = useState<ProjectDocument | null>(null)

  const displayedDocs = useMemo(() => {
    return filteredDocuments.filter(d => {
      const proj = projects.find(p => p.id === d.projectId)
      const matchesSearch =
        d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.uploadedBy.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (proj && proj.name.toLowerCase().includes(searchTerm.toLowerCase()))

      const matchesCat = categoryFilter === 'ALL' || d.category === categoryFilter
      return matchesSearch && matchesCat
    })
  }, [filteredDocuments, searchTerm, categoryFilter, projects])

  const handleCreate = () => {
    setDocToEdit(null)
    setIsModalOpen(true)
  }

  const handleEdit = (doc: ProjectDocument) => {
    setDocToEdit(doc)
    setIsModalOpen(true)
  }

  const handleDownload = (doc: ProjectDocument) => {
    addToast(`Downloading "${doc.name}" (${doc.fileSize})...`, 'info')
  }

  return (
    <div className="space-y-6">
      {/* Header Action */}
      <div className="flex justify-end">
        <Button
          variant="primary"
          onClick={handleCreate}
          leftIcon={<Plus className="w-4 h-4" />}
        >
          Upload Document
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <Card noPadding className="p-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-[#94A3B8] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search by file name, author, or project..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-10 pl-9 pr-3 text-xs bg-white text-[#0F172A] border border-[#CBD5E1] rounded-[6px] focus:outline-hidden focus:ring-2 focus:ring-[#2563EB]/25 focus:border-[#2563EB]"
            />
          </div>

          <div className="flex items-center gap-2.5 w-full md:w-auto">
            <Filter className="w-3.5 h-3.5 text-[#64748B]" />
            <span className="text-xs text-[#64748B] font-medium">Category:</span>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="h-10 px-3 text-xs bg-white text-[#0F172A] border border-[#CBD5E1] rounded-[6px] focus:outline-hidden focus:ring-2 focus:ring-[#2563EB]/25 cursor-pointer"
            >
              <option value="ALL">All Categories ({filteredDocuments.length})</option>
              <option value="Approval Note">Approval Notes</option>
              <option value="Vendor Contract">Vendor Contracts</option>
              <option value="PO Copy">PO Copies</option>
              <option value="Technical Drawing">Technical Drawings</option>
              <option value="Invoice">Invoices / RA Bills</option>
              <option value="Inspection Report">Inspection Reports</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Table */}
      <Card noPadding className="overflow-hidden">
        {displayedDocs.length === 0 ? (
          <EmptyState
            title="No Documents Found"
            description="No documents match your filter. Upload engineering drawings, approval notes, or vendor POs."
            actionLabel="Upload Document"
            onAction={handleCreate}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[11px] font-semibold text-[#475569] uppercase tracking-wider sticky top-0 z-10">
                  <th className="py-3 px-4">Document Title</th>
                  <th className="py-3 px-3">Project Association</th>
                  <th className="py-3 px-3">Category</th>
                  <th className="py-3 px-3">WBS Tier</th>
                  <th className="py-3 px-3">Format / Size</th>
                  <th className="py-3 px-3">Uploaded Date</th>
                  <th className="py-3 px-3 text-center">Status</th>
                  <th className="py-3 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F5F9] text-xs text-[#0F172A]">
                {displayedDocs.map((doc) => {
                  const proj = projects.find(p => p.id === doc.projectId)

                  return (
                    <tr key={doc.id} className="hover:bg-[#F8FAFC]/80 transition-colors">
                      {/* Name */}
                      <td className="py-3.5 px-4 max-w-sm">
                        <div className="flex items-center gap-2.5">
                          <span className="w-8 h-8 rounded-md bg-blue-50 text-blue-700 font-bold text-[10px] flex items-center justify-center shrink-0 border border-blue-200">
                            {doc.fileType}
                          </span>
                          <div className="truncate">
                            <p className="font-semibold text-[#0F172A] truncate">
                              {doc.name}
                            </p>
                            <p className="text-[11px] text-[#64748B]">
                              by {doc.uploadedBy}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Project */}
                      <td className="py-3.5 px-3 max-w-[200px] truncate text-[#475569]">
                        {proj ? proj.name : 'All Projects'}
                      </td>

                      {/* Category */}
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <span className="text-[11px] font-medium text-[#334155] bg-slate-100 px-2 py-0.5 rounded-[4px] border border-slate-200">
                          {doc.category}
                        </span>
                      </td>

                      {/* WBS Tier */}
                      <td className="py-3.5 px-3 whitespace-nowrap text-[#64748B]">
                        {doc.wbsType}
                      </td>

                      {/* Size */}
                      <td className="py-3.5 px-3 whitespace-nowrap font-mono text-xs text-[#64748B]">
                        {doc.fileSize}
                      </td>

                      {/* Date */}
                      <td className="py-3.5 px-3 whitespace-nowrap text-[#64748B]">
                        {formatDate(doc.uploadDate)}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-3 text-center whitespace-nowrap">
                        <StatusBadge status={doc.status} />
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => setPreviewDoc(doc)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-[4px] cursor-pointer"
                            title="Preview Document"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDownload(doc)}
                            className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-[4px] cursor-pointer"
                            title="Download Document"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleEdit(doc)}
                            className="p-1.5 text-[#64748B] hover:text-[#0F172A] hover:bg-[#F1F5F9] rounded-[4px] cursor-pointer"
                            title="Edit Metadata"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => deleteDocument(doc.id)}
                            className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-[4px] cursor-pointer"
                            title="Delete Document"
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

      {/* Upload/Edit Modal */}
      <DocumentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        docToEdit={docToEdit}
      />

      {/* Preview Modal */}
      <DocumentPreviewModal
        isOpen={!!previewDoc}
        onClose={() => setPreviewDoc(null)}
        doc={previewDoc}
        onDownload={handleDownload}
      />
    </div>
  )
}
