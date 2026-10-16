import React, { useEffect, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { Modal } from '../../common/Modal'
import { Input } from '../../common/Input'
import { Select } from '../../common/Select'
import { Button } from '../../common/Button'
import type { Task, TaskStatus } from '../../../types/capex'
import { useCapex } from '../../../context/CapexContext'

interface TaskModalProps {
  isOpen: boolean
  onClose: () => void
  taskToEdit?: Task | null
  defaultProjectId?: string
  defaultSectionId?: string
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
  budgetAmount: number
}

const inDays = (days: number) => new Date(Date.now() + days * 86_400_000).toISOString().slice(0, 10)

export const TaskModal: React.FC<TaskModalProps> = ({ isOpen, onClose, taskToEdit, defaultProjectId, defaultSectionId }) => {
  const { projects, sections, milestones, tasks, addTask, updateTask, hasFinancialRecords, selectedProjectId } = useCapex()

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors }
  } = useForm<TaskFormData>()

  const projectId = watch('projectId')
  const sectionId = watch('sectionId')
  const projectSections = useMemo(() => sections.filter(item => item.projectId === projectId), [sections, projectId])
  const sectionMilestones = useMemo(() => milestones.filter(item => item.sectionId === sectionId), [milestones, sectionId])

  const budgetLocked = Boolean(taskToEdit && hasFinancialRecords(task => task.id === taskToEdit.id))

  const nextWbs = (section?: { id: string; wbsNumber: string }) =>
    section ? `${section.wbsNumber}.${tasks.filter(task => task.sectionId === section.id).length + 1}` : ''

  useEffect(() => {
    if (!isOpen) return
    if (taskToEdit) {
      reset({
        projectId: taskToEdit.projectId,
        sectionId: taskToEdit.sectionId,
        milestoneId: taskToEdit.milestoneId ?? '',
        wbsNumber: taskToEdit.wbsNumber,
        name: taskToEdit.name,
        startDate: taskToEdit.startDate,
        targetDate: taskToEdit.targetDate,
        status: taskToEdit.status,
        progress: taskToEdit.progress,
        budgetAmount: taskToEdit.budgetAmount
      })
      return
    }
    const preset = sections.find(item => item.id === defaultSectionId)
    const firstProject =
      preset?.projectId ?? defaultProjectId ?? (selectedProjectId !== 'all' ? selectedProjectId : projects[0]?.id) ?? ''
    const section = preset ?? sections.find(item => item.projectId === firstProject)
    reset({
      projectId: firstProject,
      sectionId: section?.id ?? '',
      milestoneId: '',
      wbsNumber: nextWbs(section),
      name: '',
      startDate: inDays(0),
      targetDate: inDays(90),
      status: 'Pending',
      progress: 0,
      budgetAmount: 0
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, taskToEdit, defaultProjectId, defaultSectionId])

  const changeProject = (value: string) => {
    setValue('projectId', value)
    const section = sections.find(item => item.projectId === value)
    setValue('sectionId', section?.id ?? '')
    setValue('milestoneId', '')
    if (!taskToEdit) setValue('wbsNumber', nextWbs(section))
  }

  const changeSection = (value: string) => {
    setValue('sectionId', value)
    setValue('milestoneId', '')
    if (!taskToEdit) setValue('wbsNumber', nextWbs(sections.find(item => item.id === value)))
  }

  const onSubmit = (data: TaskFormData) => {
    const values = {
      ...data,
      milestoneId: data.milestoneId || '',
      progress: Number(data.progress) || 0,
      budgetAmount: Number(data.budgetAmount)
    }
    if (taskToEdit) {
      // Disabled inputs come back undefined; never send them as changes.
      const { projectId, sectionId, budgetAmount, ...rest } = values
      if (updateTask(taskToEdit.id, budgetLocked ? rest : { ...rest, projectId, sectionId, budgetAmount })) onClose()
    } else if (addTask(values)) {
      onClose()
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={taskToEdit ? `Edit ${taskToEdit.wbsNumber} ${taskToEdit.name}` : 'New work package'}
      subtitle="A work package is a budget line. PRs raised against it cannot exceed its budget ceiling."
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Select
            label="Project"
            {...register('projectId', { required: 'Choose a project' })}
            onChange={event => changeProject(event.target.value)}
            options={projects.map(project => ({ value: project.id, label: `${project.code} — ${project.name}` }))}
            error={errors.projectId?.message}
            disabled={budgetLocked}
            required
          />
          <Select
            label="Section"
            {...register('sectionId', { required: 'Choose a section' })}
            onChange={event => changeSection(event.target.value)}
            options={
              projectSections.length
                ? projectSections.map(section => ({ value: section.id, label: `${section.wbsNumber} ${section.name}` }))
                : [{ value: '', label: 'No sections in this project' }]
            }
            error={errors.sectionId?.message}
            disabled={budgetLocked || !projectSections.length}
            required
          />
          <Input
            label="WBS number"
            {...register('wbsNumber', { required: 'Enter the WBS number' })}
            error={errors.wbsNumber?.message}
            className="font-mono"
            required
          />
          <Input
            label="Work package name"
            {...register('name', { required: 'Enter a name' })}
            error={errors.name?.message}
            placeholder="e.g. 200T EOT crane"
            required
          />
          <div className="sm:col-span-2">
            <Input
              label="Budget ceiling incl. GST (₹)"
              type="number"
              inputMode="numeric"
              min={1}
              {...register('budgetAmount', {
                required: 'Enter the budget',
                min: { value: 1, message: 'Must be more than zero' }
              })}
              error={errors.budgetAmount?.message}
              helperText={
                budgetLocked
                  ? 'Locked: this work package has PRs or POs. Raise a budget revision to change it.'
                  : 'The hard limit for PRs and POs on this line.'
              }
              disabled={budgetLocked}
              required
            />
          </div>
          <Input
            label="Start date"
            type="date"
            {...register('startDate', { required: 'Choose a date' })}
            error={errors.startDate?.message}
            required
          />
          <Input
            label="Target date"
            type="date"
            {...register('targetDate', {
              required: 'Choose a date',
              validate: (value, form) => !form.startDate || value >= form.startDate || 'Must be on or after the start date'
            })}
            error={errors.targetDate?.message}
            required
          />
          <Select
            label="Milestone (optional)"
            {...register('milestoneId')}
            options={[
              { value: '', label: 'None' },
              ...sectionMilestones.map(item => ({ value: item.id, label: `${item.wbsNumber} ${item.name}` }))
            ]}
          />
          <Select
            label="Status"
            {...register('status')}
            options={['Pending', 'In Progress', 'Completed', 'Blocked'].map(item => ({ value: item, label: item }))}
          />
          <Input
            label="Progress (%)"
            type="number"
            min={0}
            max={100}
            {...register('progress', {
              min: { value: 0, message: 'Between 0 and 100' },
              max: { value: 100, message: 'Between 0 and 100' }
            })}
            error={errors.progress?.message}
          />
        </div>

        <div className="flex flex-col-reverse gap-2 border-t border-slate-200/70 pt-4 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={!projectSections.length}>
            {taskToEdit ? 'Save changes' : 'Create work package'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
