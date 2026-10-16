import React, { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { Modal } from '../../common/Modal'
import { Input } from '../../common/Input'
import { Select } from '../../common/Select'
import { Button } from '../../common/Button'
import { ProjectPhase, ProjectStatus } from '../../../types/capex'
import { useCapex } from '../../../context/CapexContext'

interface PhaseModalProps {
  isOpen: boolean
  onClose: () => void
  phaseToEdit?: ProjectPhase | null
  defaultProjectId?: string
}

interface PhaseFormData {
  projectId: string
  wbsNumber: string
  name: string
  budgetAmount: number
  capexApprovalDate: string
  startDate: string
  endDate: string
  status: ProjectStatus
  description: string
}

export const PhaseModal: React.FC<PhaseModalProps> = ({
  isOpen,
  onClose,
  phaseToEdit,
  defaultProjectId
}) => {
  const { projects, phases, addPhase, updatePhase } = useCapex()

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting }
  } = useForm<PhaseFormData>({
    defaultValues: {
      projectId: defaultProjectId || projects[0]?.id || '',
      wbsNumber: '1.1',
      name: '',
      budgetAmount: 1350000000,
      capexApprovalDate: new Date().toISOString().split('T')[0],
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: 'Active',
      description: ''
    }
  })

  const watchProjectId = watch('projectId')

  // Auto-generate next Phase WBS number when project changes
  useEffect(() => {
    if (!phaseToEdit && watchProjectId) {
      const projIndex = projects.findIndex(p => p.id === watchProjectId)
      const projNum = projIndex >= 0 ? projIndex + 1 : 1
      const existingPhases = phases.filter(ph => ph.projectId === watchProjectId)
      const nextPhaseNum = existingPhases.length + 1
      setValue('wbsNumber', `${projNum}.${nextPhaseNum}`)
    }
  }, [watchProjectId, projects, phases, phaseToEdit, setValue])

  useEffect(() => {
    if (phaseToEdit) {
      reset({
        projectId: phaseToEdit.projectId,
        wbsNumber: phaseToEdit.wbsNumber,
        name: phaseToEdit.name,
        budgetAmount: phaseToEdit.budgetAmount,
        capexApprovalDate: phaseToEdit.capexApprovalDate,
        startDate: phaseToEdit.startDate || '',
        endDate: phaseToEdit.endDate || '',
        status: phaseToEdit.status,
        description: phaseToEdit.description || ''
      })
    } else {
      reset({
        projectId: defaultProjectId || projects[0]?.id || '',
        wbsNumber: '1.1',
        name: '',
        budgetAmount: 1350000000,
        capexApprovalDate: new Date().toISOString().split('T')[0],
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        status: 'Active',
        description: ''
      })
    }
  }, [phaseToEdit, defaultProjectId, projects, reset, isOpen])

  const onSubmit = (data: PhaseFormData) => {
    if (phaseToEdit) {
      updatePhase(phaseToEdit.id, {
        ...data,
        budgetAmount: Number(data.budgetAmount)
      })
    } else {
      addPhase({
        ...data,
        budgetAmount: Number(data.budgetAmount)
      })
    }
    onClose()
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={phaseToEdit ? 'Edit Project Phase' : 'Add Project Phase (Level 2)'}
      subtitle="Define capital execution phases and split approved budget ceilings (e.g. Phase I: 135 Cr, Phase II: 365 Cr)."
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Select
          label="Parent Project (Level 1)"
          {...register('projectId', { required: 'Parent project is required' })}
          options={projects.map(p => ({ value: p.id, label: `${p.code} - ${p.name}` }))}
          error={errors.projectId?.message}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="WBS Identifier"
            {...register('wbsNumber', { required: 'WBS number is required' })}
            error={errors.wbsNumber?.message}
            placeholder="e.g. 1.1, 1.2"
          />

          <Input
            label="Phase Name"
            {...register('name', { required: 'Phase name is required' })}
            error={errors.name?.message}
            placeholder="e.g. Phase I"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Phase Allocated Budget (₹)"
            type="number"
            {...register('budgetAmount', {
              required: 'Allocated budget is required',
              min: { value: 1, message: 'Amount must be greater than 0' }
            })}
            error={errors.budgetAmount?.message}
            placeholder="e.g. 1350000000"
          />

          <Input
            label="CAPEX Approval Date"
            type="date"
            {...register('capexApprovalDate', { required: 'CAPEX approval date is required' })}
            error={errors.capexApprovalDate?.message}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Start Date"
            type="date"
            {...register('startDate')}
            error={errors.startDate?.message}
          />

          <Input
            label="Target End Date"
            type="date"
            {...register('endDate')}
            error={errors.endDate?.message}
          />
        </div>

        <Select
          label="Phase Status"
          {...register('status', { required: 'Status is required' })}
          options={[
            { value: 'Active', label: 'Active' },
            { value: 'Planning', label: 'Planning' },
            { value: 'Approved', label: 'Approved' },
            { value: 'Completed', label: 'Completed' },
            { value: 'Delayed', label: 'Delayed' }
          ]}
          error={errors.status?.message}
        />

        <div>
          <label className="block text-xs font-semibold text-[#0F172A] mb-1.5 uppercase tracking-wider">
            Scope & Notes (Optional)
          </label>
          <textarea
            {...register('description')}
            rows={3}
            placeholder="Key equipment scope, facility components, or statutory conditions..."
            className="w-full text-xs p-3 bg-white text-[#0F172A] border border-[#CBD5E1] rounded-[6px] focus:outline-hidden focus:ring-2 focus:ring-[#2563EB]/25 focus:border-[#2563EB]"
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#E2E8F0]">
          <Button variant="outline" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" disabled={isSubmitting}>
            {phaseToEdit ? 'Save Changes' : 'Create Phase'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
