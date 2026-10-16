import React, { useEffect, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { Modal } from '../../common/Modal'
import { Input } from '../../common/Input'
import { Select } from '../../common/Select'
import { Button } from '../../common/Button'
import { Task, TaskStatus } from '../../../types/capex'
import { useCapex } from '../../../context/CapexContext'

interface TaskModalProps {
  isOpen: boolean
  onClose: () => void
  taskToEdit?: Task | null
  defaultProjectId?: string
  defaultSectionId?: string
  defaultMilestoneId?: string
}

interface TaskFormData {
  projectId: string
  sectionId: string
  milestoneId: string
  wbsNumber: string
  name: string
  startDate: string
  targetDate: string
  status: TaskStatus
  progress: number
}

export const TaskModal: React.FC<TaskModalProps> = ({
  isOpen,
  onClose,
  taskToEdit,
  defaultProjectId,
  defaultSectionId,
  defaultMilestoneId
}) => {
  const { projects, sections, milestones, tasks, addTask, updateTask } = useCapex()

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting }
  } = useForm<TaskFormData>({
    defaultValues: {
      projectId: defaultProjectId || projects[0]?.id || '',
      sectionId: defaultSectionId || '',
      milestoneId: defaultMilestoneId || '',
      wbsNumber: '1.1.1.1',
      name: '',
      startDate: new Date().toISOString().split('T')[0],
      targetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: 'In Progress',
      progress: 0
    }
  })

  const watchProjectId = watch('projectId')
  const watchSectionId = watch('sectionId')
  const watchMilestoneId = watch('milestoneId')

  // Filter sections by project
  const availableSections = useMemo(() => {
    return sections.filter(s => s.projectId === watchProjectId)
  }, [sections, watchProjectId])

  // Filter milestones by section
  const availableMilestones = useMemo(() => {
    return milestones.filter(m => m.sectionId === watchSectionId)
  }, [milestones, watchSectionId])

  // Sync section if invalid
  useEffect(() => {
    if (availableSections.length > 0) {
      const isValid = availableSections.some(s => s.id === watchSectionId)
      if (!isValid) {
        setValue('sectionId', availableSections[0].id)
      }
    } else {
      setValue('sectionId', '')
    }
  }, [watchProjectId, availableSections, watchSectionId, setValue])

  // Sync milestone if invalid
  useEffect(() => {
    if (availableMilestones.length > 0) {
      const isValid = availableMilestones.some(m => m.id === watchMilestoneId)
      if (!isValid) {
        setValue('milestoneId', availableMilestones[0].id)
      }
    } else {
      setValue('milestoneId', '')
    }
  }, [watchSectionId, availableMilestones, watchMilestoneId, setValue])

  // Auto-generate WBS number when milestone changes
  useEffect(() => {
    if (!taskToEdit && watchMilestoneId) {
      const parentMs = milestones.find(m => m.id === watchMilestoneId)
      if (parentMs) {
        const existingTasks = tasks.filter(t => t.milestoneId === watchMilestoneId)
        const nextNum = existingTasks.length + 1
        setValue('wbsNumber', `${parentMs.wbsNumber}.${nextNum}`)
      }
    }
  }, [watchMilestoneId, milestones, tasks, taskToEdit, setValue])

  useEffect(() => {
    if (taskToEdit) {
      reset({
        projectId: taskToEdit.projectId,
        sectionId: taskToEdit.sectionId,
        milestoneId: taskToEdit.milestoneId,
        wbsNumber: taskToEdit.wbsNumber,
        name: taskToEdit.name,
        startDate: taskToEdit.startDate,
        targetDate: taskToEdit.targetDate,
        status: taskToEdit.status,
        progress: taskToEdit.progress
      })
    } else {
      const pId = defaultProjectId || projects[0]?.id || ''
      const secList = sections.filter(s => s.projectId === pId)
      const sId = defaultSectionId || (secList[0]?.id || '')
      const msList = milestones.filter(m => m.sectionId === sId)
      const mId = defaultMilestoneId || (msList[0]?.id || '')

      reset({
        projectId: pId,
        sectionId: sId,
        milestoneId: mId,
        wbsNumber: '1.1.1.1',
        name: '',
        startDate: new Date().toISOString().split('T')[0],
        targetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        status: 'In Progress',
        progress: 0
      })
    }
  }, [taskToEdit, defaultProjectId, defaultSectionId, defaultMilestoneId, projects, sections, milestones, reset, isOpen])

  const onSubmit = (data: TaskFormData) => {
    if (taskToEdit) {
      updateTask(taskToEdit.id, {
        ...data,
        progress: Number(data.progress)
      })
    } else {
      addTask({
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
      title={taskToEdit ? 'Edit Work Package' : 'Add Work Package (Level 4)'}
      subtitle="Work packages represent actionable engineering, civil, or erection scopes."
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Project & Section */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            label="Project"
            {...register('projectId', { required: 'Project is required' })}
            options={projects.map(p => ({ value: p.id, label: `${p.code} - ${p.name}` }))}
            error={errors.projectId?.message}
            disabled={!!taskToEdit}
            required
          />

          <Select
            label="Parent Section"
            {...register('sectionId', { required: 'Section is required' })}
            options={availableSections.map(s => ({ value: s.id, label: `${s.wbsNumber} - ${s.name}` }))}
            error={errors.sectionId?.message}
            disabled={!!taskToEdit || availableSections.length === 0}
            required
          />
        </div>

        {/* Section (Milestone Gate) */}
        <Select
          label="Section"
          {...register('milestoneId', { required: 'Section is required' })}
          options={availableMilestones.map(m => ({ value: m.id, label: `${m.wbsNumber} - ${m.name}` }))}
          error={errors.milestoneId?.message}
          helperText={availableMilestones.length === 0 ? 'No sections found in this project' : undefined}
          disabled={!!taskToEdit || availableMilestones.length === 0}
          required
        />

        {/* WBS & Name */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Input
            label="WBS Identifier"
            {...register('wbsNumber', { required: 'WBS is required' })}
            error={errors.wbsNumber?.message}
            className="font-mono text-xs"
            placeholder="1.1.1.1"
            required
          />

          <div className="sm:col-span-2">
            <Input
              label="Work Package Name"
              {...register('name', { required: 'Work package name is required' })}
              error={errors.name?.message}
              placeholder="e.g. Cast-in-situ Bored Piling (600mm dia)"
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
            label="Task Status"
            {...register('status', { required: 'Status is required' })}
            options={[
              { value: 'Pending', label: 'Pending' },
              { value: 'In Progress', label: 'In Progress' },
              { value: 'Completed', label: 'Completed' },
              { value: 'Blocked', label: 'Blocked' }
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

        <div className="flex justify-end gap-3 pt-3 border-t border-[#F1F5F9]">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={isSubmitting}>
            {taskToEdit ? 'Save Changes' : 'Create Task'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
