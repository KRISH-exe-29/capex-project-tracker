import React, { useMemo, useState } from 'react'
import { FileText, Info, Pencil, Plus, Trash2 } from 'lucide-react'
import { Card } from '../../common/Card'
import { Button } from '../../common/Button'
import { StatusBadge } from '../../common/Badge'
import { EmptyState } from '../../common/EmptyState'
import { IconButton } from '../../common/IconButton'
import { ConfirmDialog } from '../../common/ConfirmDialog'
import { PageHeader } from '../../common/PageHeader'
import { FilterSelect, SearchInput, Toolbar } from '../../common/Toolbar'
import { DocumentModal } from './DocumentModal'
import { useCapex } from '../../../context/CapexContext'
import type { DocumentCategory, ProjectDocument } from '../../../types/capex'
import { formatDate } from '../../../utils/formatters'

const CATEGORIES: DocumentCategory[] = [
  'Capex Proposal',
  'Quote Comparison',
  'Purchase Requisition',
  'PO Copy',
  'GRN',
  'Invoice',
  'Approval Note',
  'Vendor Contract',
  'Technical Drawing',
  'Inspection Report'
]

export const DocumentView: React.FC = () => {
  const {
    filteredDocuments,
    projects,
    tasks,
    purchaseRequisitions,
    subWorks,
    deleteDocument,
    hasPermission,
    openRecord
  } = useCapex()

  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('ALL')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<ProjectDocument | null>(null)
  const [deleting, setDeleting] = useState<ProjectDocument | null>(null)

  const canCreate = hasPermission('document', 'create')
  const canEdit = hasPermission('document', 'edit')
  const canDelete = hasPermission('document', 'delete')

  const linkLabel = (doc: ProjectDocument): { text: string; open?: () => void } => {
    if (doc.wbsType === 'Sub-work') {
      const po = subWorks.find(item => item.id === doc.wbsRecordId)
      return po
        ? { text: `PO ${po.poNumber}`, open: () => openRecord('procurement-dossier', po.id) }
        : { text: 'PO (removed)' }
    }
    if (doc.wbsType === 'Purchase Requisition') {
      const pr = purchaseRequisitions.find(item => item.id === doc.wbsRecordId)
      return pr ? { text: pr.prNumber, open: () => openRecord('procurement-pr', pr.id) } : { text: 'PR (removed)' }
    }
    if (doc.wbsType === 'Task') {
      const task = tasks.find(item => item.id === doc.wbsRecordId)
      return { text: task ? `${task.wbsNumber} ${task.name}` : 'Work package (removed)' }
    }
    return { text: 'Project' }
  }

  const rows = useMemo(() => {
    const needle = search.trim().toLowerCase()
    return filteredDocuments.filter(doc => {
      if (category !== 'ALL' && doc.category !== category) return false
      return !needle || `${doc.name} ${doc.uploadedBy} ${doc.category}`.toLowerCase().includes(needle)
    })
  }, [filteredDocuments, search, category])

  const openCreate = () => {
    setEditing(null)
    setModalOpen(true)
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Records"
        title="Documents"
        description="Capex proposals, quote comparisons, PO copies, GRNs and invoices, each linked to the PR or PO it supports."
        actions={
          canCreate &&
          projects.length > 0 && (
            <Button leftIcon={<Plus className="h-4 w-4" />} onClick={openCreate}>
              Add document
            </Button>
          )
        }
      />

      <div className="flex items-start gap-3 rounded-xl border border-sky-200 bg-sky-50/80 px-4 py-3 text-sm text-sky-900">
        <Info className="mt-0.5 h-4 w-4 shrink-0" />
        <p>This version stores the document register (name, type, link, status), not the file itself. Keep the file in its usual location until the server version adds file storage.</p>
      </div>

      <Card noPadding>
        <Toolbar>
          <SearchInput value={search} onChange={setSearch} placeholder="Search document name, category or uploader…" />
          <FilterSelect
            label="Category"
            value={category}
            onChange={setCategory}
            options={[{ value: 'ALL', label: 'All' }, ...CATEGORIES.map(item => ({ value: item, label: item }))]}
          />
        </Toolbar>

        {rows.length === 0 ? (
          <div className="p-5">
            <EmptyState
              icon={<FileText className="h-6 w-6" />}
              title={filteredDocuments.length ? 'No documents match' : 'No documents yet'}
              description={
                filteredDocuments.length
                  ? 'Change the search or category filter.'
                  : 'Register the capex proposal, quote comparison and PO copy for each purchase order.'
              }
              actionLabel={!filteredDocuments.length && projects.length && canCreate ? 'Add document' : undefined}
              onAction={openCreate}
            />
          </div>
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Document</th>
                  <th>Category</th>
                  <th>Linked to</th>
                  <th>Uploaded</th>
                  <th>Status</th>
                  <th className="actions">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(doc => {
                  const link = linkLabel(doc)
                  const project = projects.find(item => item.id === doc.projectId)
                  return (
                    <tr key={doc.id}>
                      <td className="max-w-[300px]">
                        <div className="flex items-start gap-2.5">
                          <span className="mono-num shrink-0 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600">
                            {doc.fileType}
                          </span>
                          <div className="min-w-0">
                            <p className="truncate font-medium text-slate-900">{doc.name}</p>
                            <p className="text-xs text-slate-500">
                              {project?.code} · {doc.fileSize}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="whitespace-nowrap">{doc.category}</td>
                      <td className="max-w-[200px]">
                        {link.open ? (
                          <button onClick={link.open} className="mono-num truncate text-xs font-medium text-blue-700 hover:underline">
                            {link.text}
                          </button>
                        ) : (
                          <span className="truncate text-xs text-slate-600">{link.text}</span>
                        )}
                      </td>
                      <td className="whitespace-nowrap">
                        <div>{formatDate(doc.uploadDate)}</div>
                        <div className="text-xs text-slate-500">{doc.uploadedBy}</div>
                      </td>
                      <td>
                        <StatusBadge status={doc.status} />
                      </td>
                      <td className="actions">
                        <div className="flex justify-end gap-1">
                          {canEdit && (
                            <IconButton
                              label="Edit document"
                              onClick={() => {
                                setEditing(doc)
                                setModalOpen(true)
                              }}
                            >
                              <Pencil className="h-4 w-4" />
                            </IconButton>
                          )}
                          {canDelete && (
                            <IconButton label="Delete document" tone="danger" onClick={() => setDeleting(doc)}>
                              <Trash2 className="h-4 w-4" />
                            </IconButton>
                          )}
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

      <DocumentModal isOpen={modalOpen} onClose={() => setModalOpen(false)} docToEdit={editing} />
      <ConfirmDialog
        isOpen={deleting !== null}
        title={`Delete ${deleting?.name ?? 'document'}?`}
        message="The document is removed from the register and stops counting as evidence for its PR or PO. This is recorded in the Activity Log."
        confirmLabel="Delete document"
        onConfirm={() => deleting && deleteDocument(deleting.id)}
        onClose={() => setDeleting(null)}
      />
    </div>
  )
}
