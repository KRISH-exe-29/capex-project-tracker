import React, { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { Modal } from '../../common/Modal'
import { Input } from '../../common/Input'
import { Select } from '../../common/Select'
import { Button } from '../../common/Button'
import { ProjectPart, ProjectStatus } from '../../../types/capex'
import { useCapex } from '../../../context/CapexContext'

interface PartModalProps {
  isOpen: boolean
  onClose: () => void
  partToEdit?: ProjectPart | null
  defaultProjectId?: string
  defaultPhaseId?: string
}

interface PartFormData {
  projectId: string
  phaseId: string
  wbsNumber: string
  name: string
  budgetAmount: number
  status: ProjectStatus
  description: string
}

export const PartModal: React.FC<PartModalProps> = ({
  isOpen,
  onClose,
  partToEdit,
  defaultProjectId,
  defaultPhaseId
}) => {
  const { projects, phases, parts, addPart, updatePart } = useCapex()

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting }
  } = useForm<PartFormData>({
    defaultValues: {
      projectId: defaultProjectId || projects[0]?.id || '',
      phaseId: defaultPhaseId || '',
      wbsNumber: '1.1.1',
      name: '',
      budgetAmount: 1000000000,
      status: 'Active',
      description: ''
    }
  })

  const watchProjectId = watch('projectId')
  const watchPhaseId = watch('phaseId')

  // Filter available phases by project
  const availablePhases = phases.filter(ph => ph.projectId === watchProjectId)

  // Auto-select first phase if current phase does not belong to project
  useEffect(() => {
    if (availablePhases.length > 0 && (!watchPhaseId || !availablePhases.some(ph => ph.id === watchPhaseId))) {
      setValue('phaseId', defaultPhaseId || availablePhases[0].id)
    }
  }, [watchProjectId, availablePhases, watchPhaseId, defaultPhaseId, setValue])

  // Auto-generate next Part WBS number when phase changes
  useEffect(() => {
    if (!partToEdit && watchPhaseId) {
      const parentPhase = phases.find(ph => ph.id === watchPhaseId)
      const existingParts = parts.filter(pt => pt.phaseId === watchPhaseId)
      const baseNum = parentPhase ? parentPhase.wbsNumber : '1.1'
      setValue('wbsNumber', `${baseNum}.${existingParts.length + 1}`)
    }
  }, [watchPhaseId, phases, parts, partToEdit, setValue])

  useEffect(() => {
    if (partToEdit) {
      reset({
        projectId: partToEdit.projectId,
        phaseId: partToEdit.phaseId,
        wbsNumber: partToEdit.wbsNumber,
        name: partToEdit.name,
        budgetAmount: partToEdit.budgetAmount,
        status: partToEdit.status,
        description: partToEdit.description || ''
      })
    } else {
      const initPhaseId = defaultPhaseId || availablePhases[0]?.id || ''
      const parentPhase = phases.find(ph => ph.id === initPhaseId)
      const existingParts = parts.filter(pt => pt.phaseId === initPhaseId)
      const baseNum = parentPhase ? parentPhase.wbsNumber : '1.1'

      reset({
        projectId: defaultProjectId || projects[0]?.id || '',
        phaseId: initPhaseId,
        wbsNumber: `${baseNum}.${existingParts.length + 1}`,
        name: '',
        budgetAmount: 1000000000,
        status: 'Active',
        description: ''
      })
    }
  }, [partToEdit, defaultProjectId, defaultPhaseId, projects, phases, reset, isOpen])

  const onSubmit = (data: PartFormData) => {
    if (partToEdit) {
      updatePart(partToEdit.id, {
        ...data,
        budgetAmount: Number(data.budgetAmount)
      })
    } else {
      addPart({
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
      title={partToEdit ? 'Edit part' : 'Add part'}
      subtitle="Define sub-phase capital divisions (e.g. Part 1: 100 Cr, Part II: 35 Cr) feeding into engineering sections."
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Select
          label="Project"
          {...register('projectId', { required: 'Parent project is required' })}
          options={projects.map(p => ({ value: p.id, label: `${p.code} - ${p.name}` }))}
          error={errors.projectId?.message}
        />

        <Select
          label="Phase"
          {...register('phaseId', { required: 'Parent phase is required' })}
          options={availablePhases.map(ph => ({
            value: ph.id,
            label: `${ph.wbsNumber} - ${ph.name}`
          }))}
          error={errors.phaseId?.message}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="WBS Identifier"
            {...register('wbsNumber', { required: 'WBS number is required' })}
            error={errors.wbsNumber?.message}
            placeholder="e.g. 1.1.1"
          />

          <Input
            label="Part Name"
            {...register('name', { required: 'Part name is required' })}
            error={errors.name?.message}
            placeholder="e.g. Part 1, Part II"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Part Allocated Budget (₹)"
            type="number"
            {...register('budgetAmount', {
              required: 'Allocated budget is required',
              min: { value: 1, message: 'Amount must be greater than 0' }
            })}
            error={errors.budgetAmount?.message}
            placeholder="e.g. 1000000000"
          />

          <Select
            label="Part Status"
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
        </div>

        <div>
          <label className="block text-xs font-semibold text-[#0F172A] mb-1.5 uppercase tracking-wider">
            Description & Notes (Optional)
          </label>
          <textarea
            {...register('description')}
            rows={3}
            placeholder="Part scope, utility coverage, or functional boundaries..."
            className="w-full text-xs p-3 bg-white text-[#0F172A] border border-[#CBD5E1] rounded-lg focus:outline-hidden focus:ring-2 focus:ring-[#2563EB]/25 focus:border-[#2563EB]"
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#E2E8F0]">
          <Button variant="outline" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" disabled={isSubmitting}>
            {partToEdit ? 'Save Changes' : 'Create Part'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
