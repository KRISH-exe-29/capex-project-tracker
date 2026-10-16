import React, { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Modal } from '../../common/Modal'
import { Input } from '../../common/Input'
import { Select } from '../../common/Select'
import { Button } from '../../common/Button'
import { UserPermission, AppRole } from '../../../types/capex'
import { useCapex } from '../../../context/CapexContext'
import { Eye, EyeOff, Shield, User, Key, Building2, Mail, Lock } from 'lucide-react'

interface UserModalProps {
  isOpen: boolean
  onClose: () => void
  userToEdit?: UserPermission | null
  isViewOnly?: boolean
}

interface UserFormData {
  userName: string
  userEmail: string
  password?: string
  role: AppRole
  department: string
  status: 'Active' | 'Inactive'
}

export const UserModal: React.FC<UserModalProps> = ({
  isOpen,
  onClose,
  userToEdit,
  isViewOnly = false
}) => {
  const { addUser, updateUser } = useCapex()
  const [showPassword, setShowPassword] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<UserFormData>({
    defaultValues: {
      userName: '',
      userEmail: '',
      password: '',
      role: 'Viewer',
      department: 'Infrastructure',
      status: 'Active'
    }
  })

  useEffect(() => {
    if (userToEdit) {
      reset({
        userName: userToEdit.userName,
        userEmail: userToEdit.userEmail,
        password: userToEdit.password || 'Secure@2026#Pass',
        role: (userToEdit.role as AppRole) || 'Viewer',
        department: userToEdit.department || 'Corporate Operations',
        status: userToEdit.status || 'Active'
      })
    } else {
      reset({
        userName: '',
        userEmail: '',
        password: `User@${Math.floor(1000 + Math.random() * 9000)}`,
        role: 'CAPEX Admin',
        department: 'Capital Expenditure & Strategy',
        status: 'Active'
      })
    }
    setShowPassword(false)
  }, [userToEdit, reset, isOpen])

  const onSubmit = (data: UserFormData) => {
    if (userToEdit) {
      updateUser(userToEdit.userId, {
        userName: data.userName,
        userEmail: data.userEmail,
        password: data.password,
        role: data.role,
        department: data.department,
        status: data.status
      })
    } else {
      addUser({
        userName: data.userName,
        userEmail: data.userEmail,
        password: data.password || 'Default@2026',
        role: data.role,
        department: data.department,
        status: data.status
      })
    }
    onClose()
  }

  const roleDescriptions: Record<string, string> = {
    Admin: 'Unrestricted enterprise authority across all modules, configuration, and data operations.',
    'CAPEX Admin': 'Management authority over CAPEX Projects, WBS hierarchies, budgets, billing, and documents.',
    Viewer: 'Read-only exploratory access across all dashboards, project reports, and financial summaries.'
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isViewOnly ? 'User Identity Profile' : userToEdit ? 'Edit User Credentials & Role' : 'Create New User Account'}
      subtitle="Configure identity, secure credentials, and system role (`Admin`, `Viewer`, `CAPEX Admin`)."
      maxWidth="md"
    >
      {isViewOnly && userToEdit ? (
        <div className="space-y-4">
          <div className="flex items-center gap-3.5 p-4 bg-slate-50 rounded-[8px] border border-[#E2E8F0]">
            <div className="w-12 h-12 rounded-full bg-blue-600 text-white font-bold text-base flex items-center justify-center shrink-0 shadow-xs">
              {userToEdit.avatar}
            </div>
            <div>
              <h4 className="text-base font-bold text-[#0F172A]">{userToEdit.userName}</h4>
              <p className="text-xs text-[#64748B]">{userToEdit.userEmail}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 bg-white rounded-[6px] border border-[#E2E8F0]">
              <span className="text-[#64748B] block text-[11px]">System Role</span>
              <span className="font-bold text-[#0F172A] text-sm mt-0.5 block">{userToEdit.role}</span>
            </div>
            <div className="p-3 bg-white rounded-[6px] border border-[#E2E8F0]">
              <span className="text-[#64748B] block text-[11px]">Account Password</span>
              <div className="flex items-center justify-between mt-0.5">
                <span className="font-mono text-xs text-[#0F172A]">
                  {showPassword ? userToEdit.password || 'N/A' : '••••••••••••'}
                </span>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-[#64748B] hover:text-[#0F172A] p-0.5 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
            <div className="p-3 bg-white rounded-[6px] border border-[#E2E8F0]">
              <span className="text-[#64748B] block text-[11px]">Department</span>
              <span className="font-medium text-[#0F172A] block mt-0.5">{userToEdit.department}</span>
            </div>
            <div className="p-3 bg-white rounded-[6px] border border-[#E2E8F0]">
              <span className="text-[#64748B] block text-[11px]">Account Status</span>
              <span className="font-semibold text-emerald-700 block mt-0.5">{userToEdit.status}</span>
            </div>
          </div>

          <div className="p-3 bg-blue-50/70 border border-blue-200/80 rounded-[6px] text-xs text-blue-900 leading-relaxed">
            <p className="font-semibold">Role Authority ({userToEdit.role}):</p>
            <p className="text-[11px] text-blue-800 mt-0.5">
              {roleDescriptions[userToEdit.role] || 'Standard organizational access.'}
            </p>
          </div>

          <div className="flex justify-end pt-3 border-t border-[#F1F5F9]">
            <Button variant="outline" size="sm" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label="User Name"
            {...register('userName', { required: 'User name is required' })}
            error={errors.userName?.message}
            placeholder="e.g. Rajesh K. Verma"
            leftIcon={<User className="w-4 h-4" />}
            required
          />

          <Input
            label="Corporate Email Address"
            type="email"
            {...register('userEmail', { required: 'Email address is required' })}
            error={errors.userEmail?.message}
            placeholder="e.g. rajesh.verma@apexcap.corp"
            leftIcon={<Mail className="w-4 h-4" />}
            required
          />

          {/* Password field with toggle */}
          <div className="space-y-1.5 text-left">
            <label className="block text-xs font-medium text-[#334155] tracking-tight">
              Password <span className="text-[#EF4444]">*</span>
            </label>
            <div className="relative flex items-center">
              <div className="absolute left-3 text-[#94A3B8] pointer-events-none flex items-center">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                {...register('password', { required: 'Password is required' })}
                placeholder="Enter account password..."
                className="w-full h-10 pl-9 pr-10 py-2 text-sm bg-white text-[#0F172A] border border-[#CBD5E1] rounded-[6px] focus:outline-hidden focus:ring-2 focus:ring-[#2563EB]/25 focus:border-[#2563EB]"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 text-[#64748B] hover:text-[#0F172A] cursor-pointer"
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.password && (
              <p className="text-xs text-[#EF4444] font-medium">{errors.password.message}</p>
            )}
          </div>

          {/* Role Selection: Admin, Viewer, CAPEX Admin */}
          <div className="space-y-1.5 text-left">
            <Select
              label="System Role"
              {...register('role', { required: 'Role is required' })}
              options={[
                { value: 'Admin', label: 'Admin (Full System Access)' },
                { value: 'CAPEX Admin', label: 'CAPEX Admin (Planning & Financial Authority)' },
                { value: 'Viewer', label: 'Viewer (Read-Only Access)' }
              ]}
              required
            />
            <p className="text-[11px] text-[#64748B]">
              * Selecting this role automatically configures corresponding default permissions in the User Matrix.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Department"
              {...register('department')}
              placeholder="e.g. Infrastructure & Strategy"
            />

            <Select
              label="Account Status"
              {...register('status', { required: 'Status is required' })}
              options={[
                { value: 'Active', label: 'Active' },
                { value: 'Inactive', label: 'Inactive / Suspended' }
              ]}
              required
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-[#F1F5F9]">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isSubmitting}>
              {userToEdit ? 'Save Changes' : 'Create User'}
            </Button>
          </div>
        </form>
      )}
    </Modal>
  )
}
