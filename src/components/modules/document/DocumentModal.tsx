import React, { useEffect, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { Paperclip } from 'lucide-react'
import { Button } from '../../common/Button'
import { Input } from '../../common/Input'
import { Modal } from '../../common/Modal'
import { Select } from '../../common/Select'
import type { DocumentCategory, ProjectDocument } from '../../../types/capex'
import { useCapex } from '../../../context/CapexContext'
import { formatINR } from '../../../utils/formatters'

type LinkType = 'Project' | 'Task' | 'Purchase Requisition' | 'Sub-work'

interface DocumentModalProps {
  isOpen: boolean
  onClose: () => void
  docToEdit?: ProjectDocument | null
  /** Pre-fill a link, e.g. "attach to this PO" from the dossier. */
  defaultLink?: { type: LinkType; recordId: string; projectId: string; category?: DocumentCategory }
}

interface DocumentFormData {
  name: string
  projectId: string
  wbsType: LinkType
  wbsRecordId: string
  category: DocumentCategory
  fileSize: string
  fileType: string
  uploadedBy: string
  status: 'Approved' | 'Under Review' | 'Draft'
}

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

const LINK_TYPES: { value: LinkType; label: string }[] = [
  { value: 'Project', label: 'Project' },
  { value: 'Task', label: 'Work package' },
  { value: 'Purchase Requisition', label: 'Purchase requisition' },
  { value: 'Sub-work', label: 'Purchase order' }
]

const readableSize = (bytes: number) =>
  bytes >= 1_048_576 ? `${(bytes / 1_048_576).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`

export const DocumentModal: React.FC<DocumentModalProps> = ({ isOpen, onClose, docToEdit, defaultLink }) => {
  const {
    addDocument,
    updateDocument,
    projects,
    tasks,
    purchaseRequisitions,
    subWorks,
    selectedProjectId,
    currentUser
  } = useCapex()

  const {
    formState: { errors },
    handleSubmit,
    register,
    reset,
    setValue,
    watch
  } = useForm<DocumentFormData>()

  const projectId = watch('projectId')
  const wbsType = watch('wbsType')

  const records = useMemo(() => {
    if (wbsType === 'Task') {
      return tasks
        .filter(task => task.projectId === projectId)
        .map(task => ({ value: task.id, label: `${task.wbsNumber} ${task.name}` }))
    }
    if (wbsType === 'Purchase Requisition') {
      return purchaseRequisitions
        .filter(pr => pr.projectId === projectId)
        .map(pr => ({ value: pr.id, label: `${pr.prNumber} · ${formatINR(pr.amount)}` }))
    }
    if (wbsType === 'Sub-work') {
      return subWorks
        .filter(po => po.projectId === projectId)
        .map(po => ({ value: po.id, label: `${po.poNumber} · ${po.supplierName}` }))
    }
    return []
  }, [projectId, purchaseRequisitions, subWorks, tasks, wbsType])

  useEffect(() => {
    if (!isOpen) return
    const linkType: LinkType =
      docToEdit && ['Task', 'Purchase Requisition', 'Sub-work'].includes(docToEdit.wbsType)
        ? (docToEdit.wbsType as LinkType)
        : (defaultLink?.type ?? 'Project')
    reset({
      name: docToEdit?.name ?? '',
      projectId:
        docToEdit?.projectId ??
        defaultLink?.projectId ??
        (selectedProjectId === 'all' ? (projects[0]?.id ?? '') : selectedProjectId),
      wbsType: linkType,
      wbsRecordId: docToEdit?.wbsRecordId ?? defaultLink?.recordId ?? '',
      category: docToEdit?.category ?? defaultLink?.category ?? 'Capex Proposal',
      fileSize: docToEdit?.fileSize ?? '',
      fileType: docToEdit?.fileType ?? 'PDF',
      uploadedBy: docToEdit?.uploadedBy ?? currentUser?.userName ?? '',
      status: docToEdit?.status ?? 'Approved'
    })
  }, [docToEdit, defaultLink, isOpen, projects, reset, selectedProjectId, currentUser])

  const pickFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    setValue('name', file.name.replace(/\.[^.]+$/, ''), { shouldValidate: true })
    setValue('fileType', (file.name.split('.').pop() ?? 'FILE').toUpperCase(), { shouldValidate: true })
    setValue('fileSize', readableSize(file.size), { shouldValidate: true })
  }

  const submit = (data: DocumentFormData) => {
    const document = { ...data, wbsRecordId: data.wbsType === 'Project' ? undefined : data.wbsRecordId }
    if (docToEdit) updateDocument(docToEdit.id, document)
    else addDocument(document)
    onClose()
  }

  if (!projects.length) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title="Add document" maxWidth="md">
        <p className="text-sm text-slate-600">Documents belong to a project. Create a project first.</p>
        <div className="mt-5 flex justify-end">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </Modal>
    )
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={docToEdit ? 'Edit document' : 'Add document'}
      subtitle="Link each document to the exact PR or PO it supports, so the dossier can find it."
    >
      <form onSubmit={handleSubmit(submit)} className="space-y-5">
        {!docToEdit && (
          <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-slate-300 bg-white/60 px-4 py-3 text-sm text-slate-600 hover:border-blue-400 hover:bg-blue-50/40">
            <Paperclip className="h-4 w-4 shrink-0 text-slate-400" />
            <span>
              <span className="font-medium text-blue-700">Choose a file</span> to fill in its name, type and size.
              Only these details are stored in this version.
            </span>
            <input type="file" className="sr-only" onChange={pickFile} />
          </label>
        )}

        <Input
          label="Document name"
          {...register('name', { required: 'Enter a document name' })}
          error={errors.name?.message}
          required
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Select
            label="Project"
            {...register('projectId', { required: 'Choose a project' })}
            options={projects.map(project => ({ value: project.id, label: `${project.code} — ${project.name}` }))}
            error={errors.projectId?.message}
            required
          />
          <Select label="Attach to" {...register('wbsType')} options={LINK_TYPES} />
          {wbsType && wbsType !== 'Project' && (
            <div className="sm:col-span-2">
              <Select
                label="Record"
                {...register('wbsRecordId', { required: 'Choose the record this document supports' })}
                options={records.length ? records : [{ value: '', label: 'No records of this type in the project' }]}
                error={errors.wbsRecordId?.message}
                required
              />
            </div>
          )}
          <Select
            label="Category"
            {...register('category')}
            options={CATEGORIES.map(category => ({ value: category, label: category }))}
          />
          <Select
            label="Status"
            {...register('status')}
            options={['Approved', 'Under Review', 'Draft'].map(status => ({ value: status, label: status }))}
            helperText="Drafts do not count as evidence"
          />
          <Input
            label="File type"
            {...register('fileType', { required: 'Enter the file type' })}
            error={errors.fileType?.message}
            required
          />
          <Input
            label="File size"
            {...register('fileSize', { required: 'Enter the file size' })}
            error={errors.fileSize?.message}
            placeholder="e.g. 2.4 MB"
            required
          />
          <div className="sm:col-span-2">
            <Input
              label="Uploaded by"
              {...register('uploadedBy', { required: 'Enter who uploaded it' })}
              error={errors.uploadedBy?.message}
              required
            />
          </div>
        </div>

        <div className="flex flex-col-reverse gap-2 border-t border-slate-200/70 pt-4 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit">{docToEdit ? 'Save changes' : 'Add document'}</Button>
        </div>
      </form>
    </Modal>
  )
}
