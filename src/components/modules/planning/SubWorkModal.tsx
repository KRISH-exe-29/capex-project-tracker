import React, { useEffect, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { Modal } from '../../common/Modal'
import { Input } from '../../common/Input'
import { Select } from '../../common/Select'
import { Button } from '../../common/Button'
import { SubWork, SubWorkStatus } from '../../../types/capex'
import { useCapex } from '../../../context/CapexContext'

interface SubWorkModalProps {
  isOpen: boolean
  onClose: () => void
  subWorkToEdit?: SubWork | null
  defaultProjectId?: string
  defaultSectionId?: string
  defaultMilestoneId?: string
  defaultTaskId?: string
}

interface SubWorkFormData {
  projectId: string
  sectionId: string
  milestoneId: string
  taskId: string
  wbsNumber: string
  workDescription: string
  supplierName: string
  bpCode: string
  targetDate: string
  poNumber: string
  poValueGst: number
  paidDate: string
  status: SubWorkStatus
}

export const SubWorkModal: React.FC<SubWorkModalProps> = ({
  isOpen,
  onClose,
  subWorkToEdit,
  defaultProjectId,
  defaultSectionId,
  defaultMilestoneId,
  defaultTaskId
}) => {
  const {
    projects,
    sections,
    milestones,
    tasks,
    subWorks,
    addSubWork,
    updateSubWork
  } = useCapex()

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting }
  } = useForm<SubWorkFormData>({
    defaultValues: {
      projectId: defaultProjectId || projects[0]?.id || '',
      sectionId: defaultSectionId || '',
      milestoneId: defaultMilestoneId || '',
      taskId: defaultTaskId || '',
      wbsNumber: '1.1.1.1.1',
      workDescription: '',
      supplierName: '',
      bpCode: '',
      targetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      poNumber: `PO-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      poValueGst: 1000000,
      paidDate: '',
      status: 'In Execution'
    }
  })

  const watchProjectId = watch('projectId')
  const watchSectionId = watch('sectionId')
  const watchMilestoneId = watch('milestoneId')
  const watchTaskId = watch('taskId')

  // Filter sections by project
  const availableSections = useMemo(() => {
    return sections.filter(s => s.projectId === watchProjectId)
  }, [sections, watchProjectId])

  // Filter milestones by section
  const availableMilestones = useMemo(() => {
    return milestones.filter(m => m.sectionId === watchSectionId)
  }, [milestones, watchSectionId])

  // Filter tasks by milestone
  const availableTasks = useMemo(() => {
    return tasks.filter(t => t.milestoneId === watchMilestoneId)
  }, [tasks, watchMilestoneId])

  // Sync cascading dropdowns
  useEffect(() => {
    if (availableSections.length > 0 && !availableSections.some(s => s.id === watchSectionId)) {
      setValue('sectionId', availableSections[0].id)
    }
  }, [watchProjectId, availableSections, watchSectionId, setValue])

  useEffect(() => {
    if (availableMilestones.length > 0 && !availableMilestones.some(m => m.id === watchMilestoneId)) {
      setValue('milestoneId', availableMilestones[0].id)
    }
  }, [watchSectionId, availableMilestones, watchMilestoneId, setValue])

  useEffect(() => {
    if (availableTasks.length > 0 && !availableTasks.some(t => t.id === watchTaskId)) {
      setValue('taskId', availableTasks[0].id)
    }
  }, [watchMilestoneId, availableTasks, watchTaskId, setValue])

  // Auto-generate WBS number when task changes
  useEffect(() => {
    if (!subWorkToEdit && watchTaskId) {
      const parentTask = tasks.find(t => t.id === watchTaskId)
      if (parentTask) {
        const existingSubworks = subWorks.filter(sw => sw.taskId === watchTaskId)
        const nextNum = existingSubworks.length + 1
        setValue('wbsNumber', `${parentTask.wbsNumber}.${nextNum}`)
      }
    }
  }, [watchTaskId, tasks, subWorks, subWorkToEdit, setValue])

  useEffect(() => {
    if (subWorkToEdit) {
      reset({
        projectId: subWorkToEdit.projectId,
        sectionId: subWorkToEdit.sectionId,
        milestoneId: subWorkToEdit.milestoneId,
        taskId: subWorkToEdit.taskId,
        wbsNumber: subWorkToEdit.wbsNumber,
        workDescription: subWorkToEdit.workDescription,
        supplierName: subWorkToEdit.supplierName,
        bpCode: subWorkToEdit.bpCode,
        targetDate: subWorkToEdit.targetDate,
        poNumber: subWorkToEdit.poNumber,
        poValueGst: subWorkToEdit.poValueGst,
        paidDate: subWorkToEdit.paidDate || '',
        status: subWorkToEdit.status
      })
    } else {
      const pId = defaultProjectId || projects[0]?.id || ''
      const secList = sections.filter(s => s.projectId === pId)
      const sId = defaultSectionId || (secList[0]?.id || '')
      const msList = milestones.filter(m => m.sectionId === sId)
      const mId = defaultMilestoneId || (msList[0]?.id || '')
      const tskList = tasks.filter(t => t.milestoneId === mId)
      const tId = defaultTaskId || (tskList[0]?.id || '')

      reset({
        projectId: pId,
        sectionId: sId,
        milestoneId: mId,
        taskId: tId,
        wbsNumber: '1.1.1.1.1',
        workDescription: '',
        supplierName: '',
        bpCode: `BP-${Math.floor(10000 + Math.random() * 90000)}`,
        targetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        poNumber: `PO-2026-${Math.floor(1000 + Math.random() * 9000)}`,
        poValueGst: 1000000,
        paidDate: '',
        status: 'In Execution'
      })
    }
  }, [
    subWorkToEdit,
    defaultProjectId,
    defaultSectionId,
    defaultMilestoneId,
    defaultTaskId,
    projects,
    sections,
    milestones,
    tasks,
    reset,
    isOpen
  ])

  const onSubmit = (data: SubWorkFormData) => {
    if (subWorkToEdit) {
      updateSubWork(subWorkToEdit.id, {
        ...data,
        poValueGst: Number(data.poValueGst)
      })
    } else {
      addSubWork({
        ...data,
        poValueGst: Number(data.poValueGst)
      })
    }
    onClose()
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={subWorkToEdit ? 'Edit Sub-work PO Order' : 'Add Sub-work & PO (Level 5)'}
      subtitle="Sub-work tracks discrete vendor contracts, Purchase Order values, and payment milestones."
      maxWidth="2xl"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Parent WBS Hierarchy Selections */}
        <div className="p-3.5 bg-[#F8FAFC] rounded-[8px] border border-[#E2E8F0] space-y-3">
          <p className="text-[11px] font-semibold text-[#475569] uppercase tracking-wider">
            Parent WBS Hierarchy Binding
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Select
              label="1. Project"
              {...register('projectId', { required: 'Project is required' })}
              options={projects.map(p => ({ value: p.id, label: `${p.code} - ${p.name}` }))}
              disabled={!!subWorkToEdit}
              required
            />

            <Select
              label="1.1 Section"
              {...register('sectionId', { required: 'Section is required' })}
              options={availableSections.map(s => ({ value: s.id, label: `${s.wbsNumber} - ${s.name}` }))}
              disabled={!!subWorkToEdit || availableSections.length === 0}
              required
            />

            <Select
              label="1.1.1 Section"
              {...register('milestoneId', { required: 'Section is required' })}
              options={availableMilestones.map(m => ({ value: m.id, label: `${m.wbsNumber} - ${m.name}` }))}
              disabled={!!subWorkToEdit || availableMilestones.length === 0}
              required
            />

            <Select
              label="1.1.1.1 Work Package"
              {...register('taskId', { required: 'Work Package is required' })}
              options={availableTasks.map(t => ({ value: t.id, label: `${t.wbsNumber} - ${t.name}` }))}
              disabled={!!subWorkToEdit || availableTasks.length === 0}
              required
            />
          </div>
        </div>

        {/* WBS Number & Work Description */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <Input
            label="WBS Identifier"
            {...register('wbsNumber', { required: 'WBS is required' })}
            error={errors.wbsNumber?.message}
            className="font-mono text-xs"
            placeholder="1.1.1.1.1"
            required
          />

          <div className="sm:col-span-3">
            <Input
              label="1. Work Description"
              {...register('workDescription', { required: 'Work description is required' })}
              error={errors.workDescription?.message}
              placeholder="e.g. Thermo-Mechanically Treated (TMT) Rebar Cage Supply"
              required
            />
          </div>
        </div>

        {/* Supplier & BP Code */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="sm:col-span-2">
            <Input
              label="2. Supplier Name"
              {...register('supplierName', { required: 'Supplier name is required' })}
              error={errors.supplierName?.message}
              placeholder="e.g. Tata Steel Rebar Solutions Ltd"
              required
            />
          </div>

          <Input
            label="3. BP Code"
            {...register('bpCode', { required: 'BP code is required' })}
            error={errors.bpCode?.message}
            className="font-mono text-xs"
            placeholder="e.g. BP-50201"
            required
          />
        </div>

        {/* PO Number & PO Value + GST */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="5. PO Number"
            {...register('poNumber', { required: 'PO number is required' })}
            error={errors.poNumber?.message}
            className="font-mono text-xs"
            placeholder="e.g. PO-2026-0211"
            required
          />

          <Input
            label="6. PO Value + GST (₹)"
            type="number"
            {...register('poValueGst', {
              required: 'PO value is required',
              min: { value: 1, message: 'Amount must be greater than 0' }
            })}
            error={errors.poValueGst?.message}
            helperText="Aggregates directly into Project Committed PO"
            required
          />
        </div>

        {/* Target Date, Paid Date & Status */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Input
            label="4. Target Date"
            type="date"
            {...register('targetDate', { required: 'Target date is required' })}
            error={errors.targetDate?.message}
            required
          />

          <Input
            label="7. Paid Date (If settled)"
            type="date"
            {...register('paidDate')}
            helperText="Leave empty if unpaid"
          />

          <Select
            label="8. Status"
            {...register('status', { required: 'Status is required' })}
            options={[
              { value: 'PO Issued', label: 'PO Issued' },
              { value: 'In Execution', label: 'In Execution' },
              { value: 'Billed', label: 'Billed (RA Bill)' },
              { value: 'Paid', label: 'Paid & Closed' },
              { value: 'Cancelled', label: 'Cancelled' }
            ]}
            required
          />
        </div>

        <div className="flex justify-end gap-3 pt-3 border-t border-[#F1F5F9]">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={isSubmitting}>
            {subWorkToEdit ? 'Save Changes' : 'Record Sub-work PO'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
