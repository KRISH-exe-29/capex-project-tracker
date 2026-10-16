import React, { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { Modal } from '../../common/Modal'
import { Input } from '../../common/Input'
import { Select } from '../../common/Select'
import { Button } from '../../common/Button'
import type { AppRole, UserPermission } from '../../../types/capex'
import { useCapex } from '../../../context/CapexContext'

interface UserModalProps {
  isOpen: boolean
  onClose: () => void
  userToEdit?: UserPermission | null
}

interface UserFormData {
  userName: string
  userEmail: string
  role: AppRole
  department: string
  status: 'Active' | 'Inactive'
}

const ROLE_HELP: Record<AppRole, string> = {
  Admin: 'Approves PRs and budget revisions, manages users. Full access.',
  'CAPEX Admin': 'Builds the WBS, raises PRs, creates POs, records documents. Cannot manage users.',
  Viewer: 'Read-only access to every screen, plus exports. Suited to auditors and management.'
}

export const UserModal: React.FC<UserModalProps> = ({ isOpen, onClose, userToEdit }) => {
  const { addUser, updateUser } = useCapex()
  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors }
  } = useForm<UserFormData>()

  const role = watch('role')

  useEffect(() => {
    if (!isOpen) return
    reset({
      userName: userToEdit?.userName ?? '',
      userEmail: userToEdit?.userEmail ?? '',
      role: (userToEdit?.role as AppRole) ?? 'Viewer',
      department: userToEdit?.department ?? '',
      status: userToEdit?.status ?? 'Active'
    })
  }, [userToEdit, reset, isOpen])

  const onSubmit = (data: UserFormData) => {
    const values = { ...data, userName: data.userName.trim(), userEmail: data.userEmail.trim() }
    if (userToEdit) updateUser(userToEdit.userId, values)
    else addUser(values)
    onClose()
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={userToEdit ? `Edit ${userToEdit.userName}` : 'Add user'}
      subtitle="The role sets the default permissions. Fine-tune them in the Permission Matrix."
      maxWidth="md"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label="Full name"
            {...register('userName', { required: 'Enter a name' })}
            error={errors.userName?.message}
            required
          />
          <Input
            label="Email"
            type="email"
            {...register('userEmail', {
              required: 'Enter an email',
              pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Enter a valid email' }
            })}
            error={errors.userEmail?.message}
            required
          />
          <div className="sm:col-span-2">
            <Select
              label="Role"
              {...register('role', { required: true })}
              options={[
                { value: 'Admin', label: 'Admin' },
                { value: 'CAPEX Admin', label: 'CAPEX Admin' },
                { value: 'Viewer', label: 'Viewer' }
              ]}
              helperText={role ? ROLE_HELP[role] : undefined}
              required
            />
          </div>
          <Input label="Department" {...register('department')} placeholder="e.g. Capex, Finance, Audit" />
          <Select
            label="Status"
            {...register('status')}
            options={[
              { value: 'Active', label: 'Active' },
              { value: 'Inactive', label: 'Inactive' }
            ]}
          />
        </div>
        {userToEdit && role !== userToEdit.role && (
          <p className="rounded-lg border border-amber-200 bg-amber-50/80 px-3 py-2 text-sm text-amber-900">
            Changing the role resets this user’s permissions to the {role} defaults.
          </p>
        )}
        <div className="flex flex-col-reverse gap-2 border-t border-slate-200/70 pt-4 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit">{userToEdit ? 'Save changes' : 'Add user'}</Button>
        </div>
      </form>
    </Modal>
  )
}
