import React, { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { Modal } from '../../common/Modal'
import { Input } from '../../common/Input'
import { Select } from '../../common/Select'
import { Button } from '../../common/Button'
import { ProjectDocument, DocumentCategory } from '../../../types/capex'
import { useCapex } from '../../../context/CapexContext'

interface DocumentModalProps {
  isOpen: boolean
  onClose: () => void
  docToEdit?: ProjectDocument | null
}

interface DocumentFormData {
  name: string
  projectId: string
  wbsType: 'Project' | 'Section' | 'Milestone' | 'Task' | 'Sub-work'
  category: DocumentCategory
  fileSize: string
  fileType: string
  uploadedBy: string
  status: 'Approved' | 'Under Review' | 'Draft'
}

export const DocumentModal: React.FC<DocumentModalProps> = ({
  isOpen,
  onClose,
  docToEdit
}) => {
  const { projects, addDocument, updateDocument, selectedProjectId } = useCapex()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<DocumentFormData>({
    defaultValues: {
      name: '',
      projectId: selectedProjectId !== 'all' ? selectedProjectId : projects[0]?.id || '',
      wbsType: 'Project',
      category: 'Technical Drawing',
      fileSize: '3.2 MB',
      fileType: 'PDF',
      uploadedBy: 'Rajesh K. Verma',
      status: 'Approved'
    }
  })

  useEffect(() => {
    if (docToEdit) {
      reset({
        name: docToEdit.name,
        projectId: docToEdit.projectId,
        wbsType: docToEdit.wbsType,
        category: docToEdit.category,
        fileSize: docToEdit.fileSize,
        fileType: docToEdit.fileType,
        uploadedBy: docToEdit.uploadedBy,
        status: docToEdit.status
      })
    } else {
      reset({
        name: '',
        projectId: selectedProjectId !== 'all' ? selectedProjectId : projects[0]?.id || '',
        wbsType: 'Project',
        category: 'Technical Drawing',
        fileSize: '3.2 MB',
        fileType: 'PDF',
        uploadedBy: 'Rajesh K. Verma',
        status: 'Approved'
      })
    }
  }, [docToEdit, selectedProjectId, projects, reset, isOpen])

  const onSubmit = (data: DocumentFormData) => {
    if (docToEdit) {
      updateDocument(docToEdit.id, data)
    } else {
      addDocument(data)
    }
    onClose()
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={docToEdit ? 'Edit Document Metadata' : 'Upload Project Document'}
      subtitle="Associate engineering drawings, contracts, or inspection certificates with WBS records."
      maxWidth="md"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="Document File Name"
          {...register('name', { required: 'Document name is required' })}
          error={errors.name?.message}
          placeholder="e.g. Master Structural General Arrangement.dwg"
          required
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            label="Associated Project"
            {...register('projectId', { required: 'Project is required' })}
            options={projects.map(p => ({ value: p.id, label: `${p.code} - ${p.name}` }))}
            required
          />

          <Select
            label="WBS Scope Tier"
            {...register('wbsType', { required: 'WBS tier is required' })}
            options={[
              { value: 'Project', label: 'Level 1: Project-wide' },
              { value: 'Section', label: 'Level 2: Section Package' },
              { value: 'Milestone', label: 'Level 3: Milestone Gate' },
              { value: 'Task', label: 'Level 4: Task' },
              { value: 'Sub-work', label: 'Level 5: Sub-work PO' }
            ]}
            required
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            label="Document Category"
            {...register('category', { required: 'Category is required' })}
            options={[
              { value: 'Approval Note', label: 'Approval Note (Board Sanction)' },
              { value: 'Vendor Contract', label: 'Vendor Contract' },
              { value: 'PO Copy', label: 'PO Copy' },
              { value: 'Technical Drawing', label: 'Technical Drawing (GFC/GA)' },
              { value: 'Invoice', label: 'Invoice / RA Bill' },
              { value: 'Inspection Report', label: 'Inspection Report / QA' }
            ]}
            required
          />

          <Select
            label="File Format Type"
            {...register('fileType', { required: 'File type is required' })}
            options={[
              { value: 'PDF', label: 'PDF Document (.pdf)' },
              { value: 'DWG', label: 'AutoCAD CAD (.dwg)' },
              { value: 'XLSX', label: 'Excel Spreadsheet (.xlsx)' },
              { value: 'DOCX', label: 'Word Document (.docx)' },
              { value: 'ZIP', label: 'Archive Package (.zip)' }
            ]}
            required
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Uploaded By"
            {...register('uploadedBy', { required: 'Uploaded by is required' })}
            error={errors.uploadedBy?.message}
            required
          />

          <Select
            label="Verification Status"
            {...register('status', { required: 'Status is required' })}
            options={[
              { value: 'Approved', label: 'Approved (Issued for Construction)' },
              { value: 'Under Review', label: 'Under Review' },
              { value: 'Draft', label: 'Draft' }
            ]}
            required
          />
        </div>

        <div className="flex justify-end gap-3 pt-3 border-t border-[#F1F5F9]">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={isSubmitting}>
            {docToEdit ? 'Save Changes' : 'Upload Document'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
