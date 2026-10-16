import React, { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { Modal } from '../../common/Modal'
import { Input } from '../../common/Input'
import { Select } from '../../common/Select'
import { Button } from '../../common/Button'
import { Project, ProjectStatus } from '../../../types/capex'
import { useCapex } from '../../../context/CapexContext'
import { calculateTimeline } from '../../../utils/formatters'

interface ProjectModalProps {
  isOpen: boolean
  onClose: () => void
  projectToEdit?: Project | null
}

interface ProjectFormData {
  code: string
  name: string
  approvedAmount: number
  approvedDate: string
  startDate: string
  endDate: string
  executionTimeline: string
  status: ProjectStatus
  location: string
  description: string
}

export const ProjectModal: React.FC<ProjectModalProps> = ({
  isOpen,
  onClose,
  projectToEdit
}) => {
  const { addProject, updateProject } = useCapex()

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting }
  } = useForm<ProjectFormData>({
    defaultValues: {
      code: `CPX-2026-${Math.floor(100 + Math.random() * 900)}`,
      name: '',
      approvedAmount: 10000000,
      approvedDate: new Date().toISOString().split('T')[0],
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      executionTimeline: '12 Months',
      status: 'Active',
      location: '',
      description: ''
    }
  })

  const watchApprovedDate = watch('approvedDate')
  const watchStartDate = watch('startDate')
  const watchEndDate = watch('endDate')

  // Auto-calculate execution timeline when dates change
  useEffect(() => {
    const start = watchStartDate || watchApprovedDate
    if (start && watchEndDate) {
      const timeline = calculateTimeline(start, watchEndDate)
      setValue('executionTimeline', timeline)
    }
  }, [watchApprovedDate, watchStartDate, watchEndDate, setValue])

  useEffect(() => {
    if (projectToEdit) {
      reset({
        code: projectToEdit.code,
        name: projectToEdit.name,
        approvedAmount: projectToEdit.approvedAmount,
        approvedDate: projectToEdit.approvedDate,
        startDate: projectToEdit.startDate || projectToEdit.approvedDate || new Date().toISOString().split('T')[0],
        endDate: projectToEdit.endDate,
        executionTimeline: projectToEdit.executionTimeline,
        status: projectToEdit.status,
        location: projectToEdit.location || '',
        description: projectToEdit.description || ''
      })
    } else {
      reset({
        code: `CPX-2026-${Math.floor(100 + Math.random() * 900)}`,
        name: '',
        approvedAmount: 15000000,
        approvedDate: new Date().toISOString().split('T')[0],
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        executionTimeline: '12 Months',
        status: 'Active',
        location: '',
        description: ''
      })
    }
  }, [projectToEdit, reset, isOpen])

  const onSubmit = (data: ProjectFormData) => {
    const estimatedCost = projectToEdit?.estimatedCost || Number(data.approvedAmount)

    if (projectToEdit) {
      updateProject(projectToEdit.id, {
        code: data.code,
        name: data.name,
        approvedAmount: Number(data.approvedAmount),
        approvedDate: data.approvedDate,
        startDate: data.startDate,
        endDate: data.endDate,
        executionTimeline: data.executionTimeline,
        estimatedCost: estimatedCost,
        status: data.status,
        location: data.location,
        description: data.description
      })
    } else {
      addProject({
        code: data.code,
        name: data.name,
        approvedAmount: Number(data.approvedAmount),
        approvedDate: data.approvedDate,
        startDate: data.startDate,
        endDate: data.endDate,
        executionTimeline: data.executionTimeline,
        estimatedCost: estimatedCost,
        status: data.status,
        location: data.location,
        description: data.description
      })
    }
    onClose()
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={projectToEdit ? 'Edit CAPEX Project' : 'Create New CAPEX Project'}
      subtitle="Define approved capital expenditure budget, execution timeline, and governance records."
      maxWidth="2xl"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Row 1: Code & Status */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Input
            label="Project Code"
            {...register('code', { required: 'Project code is required' })}
            error={errors.code?.message}
            className="font-mono text-xs uppercase"
            placeholder="e.g. CPX-2026-005"
            required
          />

          <div className="sm:col-span-2">
            <Select
              label="Project Status"
              {...register('status', { required: 'Status is required' })}
              options={[
                { value: 'Planning', label: 'Planning (Under Sanction)' },
                { value: 'Approved', label: 'Approved (Sanctioned)' },
                { value: 'Active', label: 'Active (Execution Phase)' },
                { value: 'Under Review', label: 'Under Review' },
                { value: 'Completed', label: 'Completed (Handover)' },
                { value: 'Delayed', label: 'Delayed (Overdue)' }
              ]}
              required
            />
          </div>
        </div>

        {/* Row 2: Name */}
        <Input
          label="Project Name"
          {...register('name', { required: 'Project name is required' })}
          error={errors.name?.message}
          placeholder="e.g. Bhiwandi Automated Fulfillment Logistics Hub (Phase 2)"
          required
        />

        {/* Row 3: Financials: Approved Amount */}
        <div>
          <Input
            label="CAPEX Project Approved Amount (₹)"
            type="number"
            {...register('approvedAmount', {
              required: 'Approved amount is required',
              min: { value: 1, message: 'Amount must be greater than 0' }
            })}
            error={errors.approvedAmount?.message}
            helperText="Sanctioned board capital authorization"
            required
          />
        </div>

        {/* Financial Policy Note */}
        <div className="p-3 bg-blue-50/70 border border-blue-200/80 rounded-lg text-xs text-blue-900 leading-relaxed">
          <span className="font-semibold">Financial Calculation Rule:</span> Balance Amount is calculated as{' '}
          <code className="font-mono bg-white px-1.5 py-0.5 rounded-sm border border-blue-200">
            Approved Amount − Total PO Value
          </code>
          . Sub-work PO values will aggregate automatically upon creation.
        </div>

        {/* Row 4: Dates & Execution Timeline (Added Project Start Date) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <Input
            label="CAPEX Approved Date"
            type="date"
            {...register('approvedDate', { required: 'Approved date is required' })}
            error={errors.approvedDate?.message}
            required
          />

          <Input
            label="Project Start Date"
            type="date"
            {...register('startDate', { required: 'Start date is required' })}
            error={errors.startDate?.message}
            required
          />

          <Input
            label="Project End Date"
            type="date"
            {...register('endDate', { required: 'End date is required' })}
            error={errors.endDate?.message}
            required
          />

          <Input
            label="Execution Timeline"
            {...register('executionTimeline', { required: 'Timeline is required' })}
            error={errors.executionTimeline?.message}
            helperText="Auto-computed"
            required
          />
        </div>

        {/* Row 5: Location */}
        <Input
          label="Site Location / SEZ"
          {...register('location')}
          placeholder="e.g. Chakan Industrial Corridor, Pune"
        />

        {/* Row 6: Description */}
        <div className="space-y-1.5 text-left">
          <label className="block text-xs font-medium text-[#334155] tracking-tight">
            Scope / Engineering Description
          </label>
          <textarea
            {...register('description')}
            rows={3}
            placeholder="Detailed technical overview, engineering deliverables, and physical boundary..."
            className="w-full px-3 py-2 text-xs bg-white text-[#0F172A] border border-[#CBD5E1] rounded-lg focus:outline-hidden focus:ring-2 focus:ring-[#2563EB]/25 focus:border-[#2563EB]"
          />
        </div>

        {/* Form Actions */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200/70">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={isSubmitting}>
            {projectToEdit ? 'Save Changes' : 'Create Project'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
