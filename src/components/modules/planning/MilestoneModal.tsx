import React, { useEffect, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { Modal } from '../../common/Modal'
import { Input } from '../../common/Input'
import { Select } from '../../common/Select'
import { Button } from '../../common/Button'
import { Milestone, MilestoneStatus } from '../../../types/capex'
import { useCapex } from '../../../context/CapexContext'

interface MilestoneModalProps {
  isOpen: boolean
  onClose: () => void
  milestoneToEdit?: Milestone | null
  defaultProjectId?: string
  defaultSectionId?: string
}

interface MilestoneFormData {
  projectId: string
  sectionId: string
  wbsNumber: string
  name: string
  startDate: string
  targetDate: string
  status: MilestoneStatus
  progress: number
}

export const MilestoneModal: React.FC<MilestoneModalProps> = ({
  isOpen,
  onClose,
  milestoneToEdit,
  defaultProjectId,
  defaultSectionId
}) => {
  const { projects, sections, milestones, addMilestone, updateMilestone } = useCapex()

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting }
  } = useForm<MilestoneFormData>({
    defaultValues: {
      projectId: defaultProjectId || projects[0]?.id || '',
      sectionId: defaultSectionId || '',
      wbsNumber: '1.1.1',
      name: '',
      startDate: new Date().toISOString().split('T')[0],
      targetDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: 'In Progress',
      progress: 0
    }
  })

  const watchProjectId = watch('projectId')
  const watchSectionId = watch('sectionId')

  // Filter sections by the selected project
  const availableSections = useMemo(() => {
    return sections.filter(s => s.projectId === watchProjectId)
  }, [sections, watchProjectId])

  // When project changes, set default section if current section is not in project
  useEffect(() => {
    if (availableSections.length > 0) {
      const sectionStillValid = availableSections.some(s => s.id === watchSectionId)
      if (!sectionStillValid) {
        setValue('sectionId', availableSections[0].id)
      }
    } else {
      setValue('sectionId', '')
    }
  }, [watchProjectId, availableSections, watchSectionId, setValue])

  // Auto-generate next WBS number when section changes
  useEffect(() => {
    if (!milestoneToEdit && watchSectionId) {
      const parentSection = sections.find(s => s.id === watchSectionId)
      if (parentSection) {
        const existingMilestones = milestones.filter(m => m.sectionId === watchSectionId)
        const nextMsNum = existingMilestones.length + 1
        setValue('wbsNumber', `${parentSection.wbsNumber}.${nextMsNum}`)
      }
    }
  }, [watchSectionId, sections, milestones, milestoneToEdit, setValue])

  useEffect(() => {
    if (milestoneToEdit) {
      reset({
        projectId: milestoneToEdit.projectId,
        sectionId: milestoneToEdit.sectionId,
        wbsNumber: milestoneToEdit.wbsNumber,
        name: milestoneToEdit.name,
        startDate: milestoneToEdit.startDate,
        targetDate: milestoneToEdit.targetDate,
        status: milestoneToEdit.status,
        progress: milestoneToEdit.progress
      })
    } else {
      const initProj = defaultProjectId || projects[0]?.id || ''
      const initSecs = sections.filter(s => s.projectId === initProj)
      reset({
        projectId: initProj,
        sectionId: defaultSectionId || (initSecs[0]?.id || ''),
        wbsNumber: '1.1.1',
        name: '',
        startDate: new Date().toISOString().split('T')[0],
        targetDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        status: 'In Progress',
        progress: 0
      })
    }
  }, [milestoneToEdit, defaultProjectId, defaultSectionId, projects, sections, reset, isOpen])

  const onSubmit = (data: MilestoneFormData) => {
    if (milestoneToEdit) {
      updateMilestone(milestoneToEdit.id, {
        ...data,
        progress: Number(data.progress)
      })
    } else {
      addMilestone({
        ...data,
        progress: Number(data.progress)
      })
    }
    onClose()
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={milestoneToEdit ? 'Edit milestone' : 'Add milestone'}
      subtitle="Milestones are schedule checkpoints inside a section, e.g. foundation complete or crane commissioned."
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Project & Section Selection */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            label="Project"
            {...register('projectId', { required: 'Project is required' })}
            options={projects.map(p => ({ value: p.id, label: `${p.code} - ${p.name}` }))}
            error={errors.projectId?.message}
            disabled={!!milestoneToEdit}
            required
          />

          <Select
            label="Parent Section"
            {...register('sectionId', { required: 'Section is required' })}
            options={availableSections.map(s => ({ value: s.id, label: `${s.wbsNumber} - ${s.name}` }))}
            error={errors.sectionId?.message}
            helperText={availableSections.length === 0 ? 'No sections found for this project' : undefined}
            disabled={!!milestoneToEdit || availableSections.length === 0}
            required
          />
        </div>

        {/* WBS & Name */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Input
            label="WBS Identifier"
            {...register('wbsNumber', { required: 'WBS is required' })}
            error={errors.wbsNumber?.message}
            className="font-mono text-xs"
            placeholder="1.1.1"
            required
          />

          <div className="sm:col-span-2">
            <Input
              label="Milestone name"
              {...register('name', { required: 'Enter a milestone name' })}
              error={errors.name?.message}
              placeholder="e.g. Sub-structure Excavation & Bored Piling"
              required
            />
          </div>
        </div>

        {/* Dates */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Start Date"
            type="date"
            {...register('startDate', { required: 'Start date is required' })}
            error={errors.startDate?.message}
            required
          />

          <Input
            label="Target Date"
            type="date"
            {...register('targetDate', { required: 'Target date is required' })}
            error={errors.targetDate?.message}
            required
          />
        </div>

        {/* Status & Progress */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            label="Status"
            {...register('status', { required: 'Status is required' })}
            options={[
              { value: 'Not Started', label: 'Not Started' },
              { value: 'In Progress', label: 'In Progress' },
              { value: 'Completed', label: 'Completed' },
              { value: 'Delayed', label: 'Delayed' }
            ]}
            required
          />

          <Input
            label="Progress (%)"
            type="number"
            min="0"
            max="100"
            {...register('progress', {
              required: 'Progress is required',
              min: { value: 0, message: 'Min is 0%' },
              max: { value: 100, message: 'Max is 100%' }
            })}
            error={errors.progress?.message}
            required
          />
        </div>

        <div className="flex justify-end gap-3 pt-3 border-t border-slate-200/70">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={isSubmitting}>
            {milestoneToEdit ? 'Save Changes' : 'Schedule Milestone'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
