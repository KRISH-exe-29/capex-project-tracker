import React, { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { Modal } from '../../common/Modal'
import { Input } from '../../common/Input'
import { Select } from '../../common/Select'
import { Button } from '../../common/Button'
import { TeamMember } from '../../../types/capex'
import { useCapex } from '../../../context/CapexContext'

interface TeamMemberModalProps {
  isOpen: boolean
  onClose: () => void
  memberToEdit?: TeamMember | null
}

interface TeamMemberFormData {
  name: string
  role: string
  email: string
  phone: string
  projectId: string
  workItemsStr: string
  status: 'Active' | 'On Leave'
}

export const TeamMemberModal: React.FC<TeamMemberModalProps> = ({
  isOpen,
  onClose,
  memberToEdit
}) => {
  const { projects, addTeamMember, updateTeamMember, selectedProjectId } = useCapex()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<TeamMemberFormData>({
    defaultValues: {
      name: '',
      role: '',
      email: '',
      phone: '',
      projectId: selectedProjectId !== 'all' ? selectedProjectId : projects[0]?.id || '',
      workItemsStr: '',
      status: 'Active'
    }
  })

  useEffect(() => {
    if (memberToEdit) {
      reset({
        name: memberToEdit.name,
        role: memberToEdit.role,
        email: memberToEdit.email,
        phone: memberToEdit.phone,
        projectId: memberToEdit.projectId,
        workItemsStr: memberToEdit.workItems.join(', '),
        status: memberToEdit.status
      })
    } else {
      reset({
        name: '',
        role: '',
        email: '',
        phone: '',
        projectId: selectedProjectId !== 'all' ? selectedProjectId : projects[0]?.id || '',
        workItemsStr: '',
        status: 'Active'
      })
    }
  }, [memberToEdit, selectedProjectId, projects, reset, isOpen])

  const onSubmit = (data: TeamMemberFormData) => {
    const workItems = data.workItemsStr
      ? data.workItemsStr.split(',').map(s => s.trim()).filter(Boolean)
      : []

    if (memberToEdit) {
      updateTeamMember(memberToEdit.id, {
        name: data.name,
        role: data.role,
        email: data.email,
        phone: data.phone,
        projectId: data.projectId,
        workItems,
        status: data.status
      })
    } else {
      addTeamMember({
        name: data.name,
        role: data.role,
        email: data.email,
        phone: data.phone,
        projectId: data.projectId,
        workItems,
        status: data.status
      })
    }
    onClose()
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={memberToEdit ? 'Edit Team Member' : 'Associate Team Member'}
      subtitle="Assign personnel to supervise and manage capital work items."
      maxWidth="md"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="Full Name"
          {...register('name', { required: 'Name is required' })}
          error={errors.name?.message}
          placeholder="e.g. Rajesh K. Verma"
          required
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Corporate Role / Title"
            {...register('role', { required: 'Role is required' })}
            error={errors.role?.message}
            placeholder="e.g. Lead Project Director"
            required
          />

          <Select
            label="Assigned Project"
            {...register('projectId', { required: 'Project assignment is required' })}
            options={projects.map(p => ({ value: p.id, label: `${p.code} - ${p.name}` }))}
            required
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Corporate Email"
            type="email"
            {...register('email', { required: 'Email is required' })}
            error={errors.email?.message}
            placeholder="name@apexcap.corp"
            required
          />

          <Input
            label="Contact Phone"
            {...register('phone', { required: 'Phone is required' })}
            error={errors.phone?.message}
            placeholder="+91 98201 44521"
            required
          />
        </div>

        <Input
          label="Responsible Work Items (Comma-separated WBS references)"
          {...register('workItemsStr')}
          placeholder="e.g. 1.1 Civil Foundations, 1.2 PEB Superstructure"
          helperText="Reference sections or tasks this engineer is overseeing"
        />

        <Select
          label="Operational Status"
          {...register('status', { required: 'Status is required' })}
          options={[
            { value: 'Active', label: 'Active on Site' },
            { value: 'On Leave', label: 'On Leave / Off-site' }
          ]}
          required
        />

        <div className="flex justify-end gap-3 pt-3 border-t border-slate-200/70">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={isSubmitting}>
            {memberToEdit ? 'Save Changes' : 'Associate Member'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
