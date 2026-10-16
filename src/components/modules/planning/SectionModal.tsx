import React, { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { Modal } from '../../common/Modal'
import { Input } from '../../common/Input'
import { Select } from '../../common/Select'
import { Button } from '../../common/Button'
import { Section } from '../../../types/capex'
import { useCapex } from '../../../context/CapexContext'

interface SectionModalProps {
  isOpen: boolean
  onClose: () => void
  sectionToEdit?: Section | null
  defaultProjectId?: string
  defaultPartId?: string
}

interface SectionFormData {
  projectId: string
  partId?: string
  wbsNumber: string
  name: string
  description: string
}

export const SectionModal: React.FC<SectionModalProps> = ({
  isOpen,
  onClose,
  sectionToEdit,
  defaultProjectId,
  defaultPartId
}) => {
  const { projects, phases, parts, sections, addSection, updateSection } = useCapex()

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting }
  } = useForm<SectionFormData>({
    defaultValues: {
      projectId: defaultProjectId || projects[0]?.id || '',
      partId: defaultPartId || '',
      wbsNumber: '1.1.1.1',
      name: '',
      description: ''
    }
  })

  const watchProjectId = watch('projectId')
  const watchPartId = watch('partId')

  const availableParts = parts.filter(pt => pt.projectId === watchProjectId)

  // Auto-generate next WBS number when project or part changes
  useEffect(() => {
    if (!sectionToEdit) {
      if (watchPartId) {
        const parentPart = parts.find(p => p.id === watchPartId)
        const baseNum = parentPart ? parentPart.wbsNumber : '1.1.1'
        const existingSections = sections.filter(s => s.partId === watchPartId)
        setValue('wbsNumber', `${baseNum}.${existingSections.length + 1}`)
      } else if (watchProjectId) {
        const projIndex = projects.findIndex(p => p.id === watchProjectId)
        const projNum = projIndex >= 0 ? projIndex + 1 : 1
        const existingSections = sections.filter(s => s.projectId === watchProjectId && !s.partId)
        setValue('wbsNumber', `${projNum}.${existingSections.length + 1}`)
      }
    }
  }, [watchProjectId, watchPartId, projects, parts, sections, sectionToEdit, setValue])

  useEffect(() => {
    if (sectionToEdit) {
      reset({
        projectId: sectionToEdit.projectId,
        partId: sectionToEdit.partId || '',
        wbsNumber: sectionToEdit.wbsNumber,
        name: sectionToEdit.name,
        description: sectionToEdit.description || ''
      })
    } else {
      reset({
        projectId: defaultProjectId || projects[0]?.id || '',
        partId: defaultPartId || '',
        wbsNumber: '1.1.1.1',
        name: '',
        description: ''
      })
    }
  }, [sectionToEdit, defaultProjectId, defaultPartId, projects, reset, isOpen])

  const onSubmit = (data: SectionFormData) => {
    if (sectionToEdit) {
      updateSection(sectionToEdit.id, data)
    } else {
      addSection(data)
    }
    onClose()
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={sectionToEdit ? 'Edit Section' : 'Add Section (Level 4)'}
      subtitle="Sections define engineering domains like Civil, MEP, or Winding under project parts."
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Select
          label="Parent Project (Level 1)"
          {...register('projectId', { required: 'Parent project is required' })}
          options={projects.map(p => ({ value: p.id, label: `${p.code} - ${p.name}` }))}
          error={errors.projectId?.message}
          disabled={!!sectionToEdit}
          required
        />

        {availableParts.length > 0 && (
          <Select
            label="Parent Part (Level 3)"
            {...register('partId')}
            options={[
              { value: '', label: '-- None (Direct Project Section) --' },
              ...availableParts.map(pt => ({
                value: pt.id,
                label: `${pt.wbsNumber} - ${pt.name}`
              }))
            ]}
          />
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Input
            label="WBS Identifier (e.g. 1.1)"
            {...register('wbsNumber', { required: 'WBS Number is required' })}
            error={errors.wbsNumber?.message}
            className="font-mono"
            required
          />

          <div className="sm:col-span-2">
            <Input
              label="Section Package Name"
              {...register('name', { required: 'Section name is required' })}
              error={errors.name?.message}
              placeholder="e.g. Civil Foundations & Structural Superstructure"
              required
            />
          </div>
        </div>

        <div className="space-y-1.5 text-left">
          <label className="block text-xs font-medium text-[#334155] tracking-tight">
            Package Scope / Deliverables
          </label>
          <textarea
            {...register('description')}
            rows={3}
            className="w-full px-3 py-2 text-sm bg-white text-[#0F172A] border border-[#CBD5E1] rounded-[6px] focus:outline-hidden focus:ring-2 focus:ring-[#2563EB]/25 focus:border-[#2563EB]"
            placeholder="Specific deliverables and technical parameters for this section package..."
          />
        </div>

        <div className="flex justify-end gap-3 pt-3 border-t border-[#F1F5F9]">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={isSubmitting}>
            {sectionToEdit ? 'Save Changes' : 'Create Section'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
