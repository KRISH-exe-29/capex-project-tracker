import React, { useEffect, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { Modal } from '../../common/Modal'
import { Input } from '../../common/Input'
import { Select } from '../../common/Select'
import { Button } from '../../common/Button'
import { DprRecord, DprStatus } from '../../../types/capex'
import { useCapex } from '../../../context/CapexContext'

interface DprModalProps {
  isOpen: boolean
  onClose: () => void
  dprToEdit?: DprRecord | null
}

interface DprFormData {
  reportDate: string
  projectId: string
  taskId: string
  dailyProgress: number
  workDoneToday: string
  manpowerCount: number
  equipmentDeployed: string
  hindrances: string
  submittedBy: string
  status: DprStatus
}

export const DprModal: React.FC<DprModalProps> = ({
  isOpen,
  onClose,
  dprToEdit
}) => {
  const { projects, tasks, addDprRecord, updateDprRecord, selectedProjectId } = useCapex()

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting }
  } = useForm<DprFormData>({
    defaultValues: {
      reportDate: new Date().toISOString().split('T')[0],
      projectId: selectedProjectId !== 'all' ? selectedProjectId : projects[0]?.id || '',
      taskId: '',
      dailyProgress: 3,
      workDoneToday: '',
      manpowerCount: 20,
      equipmentDeployed: '',
      hindrances: '',
      submittedBy: 'Rajesh K. Verma',
      status: 'Submitted'
    }
  })

  const watchProjectId = watch('projectId')

  // Filter tasks by selected project
  const availableTasks = useMemo(() => {
    return tasks.filter(t => t.projectId === watchProjectId)
  }, [tasks, watchProjectId])

  useEffect(() => {
    if (availableTasks.length > 0 && !availableTasks.some(t => t.id === watch('taskId'))) {
      setValue('taskId', availableTasks[0].id)
    }
  }, [watchProjectId, availableTasks, setValue, watch])

  useEffect(() => {
    if (dprToEdit) {
      reset({
        reportDate: dprToEdit.reportDate,
        projectId: dprToEdit.projectId,
        taskId: dprToEdit.taskId,
        dailyProgress: dprToEdit.dailyProgress,
        workDoneToday: dprToEdit.workDoneToday,
        manpowerCount: dprToEdit.manpowerCount,
        equipmentDeployed: dprToEdit.equipmentDeployed,
        hindrances: dprToEdit.hindrances || '',
        submittedBy: dprToEdit.submittedBy,
        status: dprToEdit.status
      })
    } else {
      const pId = selectedProjectId !== 'all' ? selectedProjectId : projects[0]?.id || ''
      const projTasks = tasks.filter(t => t.projectId === pId)
      reset({
        reportDate: new Date().toISOString().split('T')[0],
        projectId: pId,
        taskId: projTasks[0]?.id || '',
        dailyProgress: 4,
        workDoneToday: '',
        manpowerCount: 25,
        equipmentDeployed: '',
        hindrances: '',
        submittedBy: 'Rajesh K. Verma',
        status: 'Submitted'
      })
    }
  }, [dprToEdit, selectedProjectId, projects, tasks, reset, isOpen])

  const onSubmit = (data: DprFormData) => {
    if (dprToEdit) {
      updateDprRecord(dprToEdit.id, {
        ...data,
        dailyProgress: Number(data.dailyProgress),
        manpowerCount: Number(data.manpowerCount)
      })
    } else {
      addDprRecord({
        ...data,
        dailyProgress: Number(data.dailyProgress),
        manpowerCount: Number(data.manpowerCount)
      })
    }
    onClose()
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={dprToEdit ? 'Edit Daily Progress Report' : 'Submit Daily Progress Report (DPR)'}
      subtitle="Log on-site daily execution progress, manpower turnout, and plant equipment."
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Project & Reporting Date */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            label="Project"
            {...register('projectId', { required: 'Project is required' })}
            options={projects.map(p => ({ value: p.id, label: `${p.code} - ${p.name}` }))}
            error={errors.projectId?.message}
            required
          />

          <Input
            label="Reporting Date"
            type="date"
            {...register('reportDate', { required: 'Report date is required' })}
            error={errors.reportDate?.message}
            required
          />
        </div>

        {/* WBS Task Binding */}
        <Select
          label="Execution Task (Level 4 WBS)"
          {...register('taskId', { required: 'Task is required' })}
          options={availableTasks.map(t => ({ value: t.id, label: `${t.wbsNumber} - ${t.name}` }))}
          error={errors.taskId?.message}
          helperText={availableTasks.length === 0 ? 'No tasks available in this project' : undefined}
          required
        />

        {/* Progress & Manpower */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Daily Progress Added (%)"
            type="number"
            min="0"
            max="100"
            {...register('dailyProgress', {
              required: 'Daily progress is required',
              min: { value: 0, message: 'Min is 0%' },
              max: { value: 100, message: 'Max is 100%' }
            })}
            error={errors.dailyProgress?.message}
            required
          />

          <Input
            label="Site Manpower Headcount"
            type="number"
            min="0"
            {...register('manpowerCount', { required: 'Manpower is required' })}
            error={errors.manpowerCount?.message}
            placeholder="e.g. 35"
            required
          />
        </div>

        {/* Work Done Today */}
        <div className="space-y-1.5 text-left">
          <label className="block text-xs font-medium text-[#334155] tracking-tight">
            Work Done Today <span className="text-rose-500">*</span>
          </label>
          <textarea
            {...register('workDoneToday', { required: 'Description of work done is required' })}
            rows={3}
            className="w-full px-3 py-2 text-sm bg-white text-[#0F172A] border border-[#CBD5E1] rounded-[6px] focus:outline-hidden focus:ring-2 focus:ring-[#2563EB]/25 focus:border-[#2563EB]"
            placeholder="Specify completed casting, fabrication, testing or structural placement details..."
          />
          {errors.workDoneToday && (
            <p className="text-xs text-rose-500 font-medium">{errors.workDoneToday.message}</p>
          )}
        </div>

        {/* Equipment & Hindrances */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Major Plant & Equipment Deployed"
            {...register('equipmentDeployed')}
            placeholder="e.g. 50T Crane, 2 Concrete Boom Pumps"
          />

          <Input
            label="Site Hindrances / Bottlenecks"
            {...register('hindrances')}
            placeholder="e.g. Rainfall delay, material supply transit"
          />
        </div>

        {/* Submitter & Verification Status */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Submitted By (Site QA / Engineer)"
            {...register('submittedBy', { required: 'Submitter name is required' })}
            error={errors.submittedBy?.message}
            required
          />

          <Select
            label="Report Status"
            {...register('status', { required: 'Status is required' })}
            options={[
              { value: 'Submitted', label: 'Submitted (Awaiting Check)' },
              { value: 'Verified', label: 'Verified by Consultant' },
              { value: 'Approved', label: 'Approved by Project Director' }
            ]}
            required
          />
        </div>

        <div className="flex justify-end gap-3 pt-3 border-t border-[#F1F5F9]">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={isSubmitting}>
            {dprToEdit ? 'Save Changes' : 'Submit DPR'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
