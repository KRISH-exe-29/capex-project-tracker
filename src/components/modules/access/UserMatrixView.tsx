import React, { useState } from 'react'
import {
  ShieldCheck,
  Search,
  Filter,
  Eye,
  Edit2,
  Trash2,
  Plus,
  Users,
  AlertTriangle,
  ChevronDown
} from 'lucide-react'
import { Card } from '../../common/Card'
import { Button } from '../../common/Button'
import { StatusBadge } from '../../common/Badge'
import { UserModal } from './UserModal'
import { useCapex } from '../../../context/CapexContext'
import { ModuleKey, ActionPermissions, UserPermission } from '../../../types/capex'

export const UserMatrixView: React.FC = () => {
  const { userPermissions, toggleUserPermission, deleteUser, setActiveModule } = useCapex()
  const [searchTerm, setSearchTerm] = useState('')
  const [activeModuleScope, setActiveModuleScope] = useState<ModuleKey>('planning')

  // Modal & action state
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [userToEdit, setUserToEdit] = useState<UserPermission | null>(null)
  const [isViewOnly, setIsViewOnly] = useState(false)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

  const moduleOptions: { key: ModuleKey; label: string }[] = [
    { key: 'dashboard', label: '1. Dashboard' },
    { key: 'planning', label: '2. Planning & WBS' },
    { key: 'operation', label: '3. Operation & DPR' },
    { key: 'finance', label: '4. Finance & Billing' },
    { key: 'document', label: '5. Document Vault' },
    { key: 'access', label: '6. Access & RBAC' }
  ]

  const actions: (keyof ActionPermissions)[] = [
    'view',
    'create',
    'edit',
    'delete',
    'export',
    'approve'
  ]

  const filteredUsers = userPermissions.filter(u =>
    u.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.userEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.department.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleCheckboxChange = (userId: string, module: ModuleKey, action: keyof ActionPermissions) => {
    toggleUserPermission(userId, module, action)
  }

  const handleCreate = () => {
    setUserToEdit(null)
    setIsViewOnly(false)
    setIsModalOpen(true)
  }

  const handleView = (user: UserPermission) => {
    setUserToEdit(user)
    setIsViewOnly(true)
    setIsModalOpen(true)
  }

  const handleEdit = (user: UserPermission) => {
    setUserToEdit(user)
    setIsViewOnly(false)
    setIsModalOpen(true)
  }

  const getRoleBadge = (role: string) => {
    const r = role.toLowerCase()
    if (r.includes('admin') && !r.includes('capex')) {
      return (
        <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
          Admin
        </span>
      )
    } else if (r.includes('capex')) {
      return (
        <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
          CAPEX Admin
        </span>
      )
    } else {
      return (
        <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-300">
          Viewer
        </span>
      )
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-purple-600" />
            <h2 className="text-xl font-bold text-[#0F172A] font-heading tracking-tight">
              Access Management — User Permission Matrix
            </h2>
          </div>
          <p className="text-xs text-[#64748B] mt-0.5">
            Checkbox-based granular access matrix mapping users against module actions. Modifying role updates default matrix authorizations.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setActiveModule('access-users')}
            leftIcon={<Users className="w-4 h-4 text-blue-600" />}
          >
            User Roles Table
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleCreate}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Add New User
          </Button>
        </div>
      </div>

      {/* Filter and Module Selection Toolbar (No bulky tab bar, no blue callout) */}
      <Card noPadding className="p-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-[#94A3B8] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search user, role, email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-10 pl-9 pr-3 text-xs bg-white text-[#0F172A] border border-[#CBD5E1] rounded-[6px] focus:outline-hidden focus:ring-2 focus:ring-[#2563EB]/25 focus:border-[#2563EB]"
            />
          </div>

          {/* Module Scope Dropdown */}
          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <Filter className="w-4 h-4 text-[#64748B] shrink-0" />
            <span className="text-xs text-[#475569] font-medium whitespace-nowrap">
              Module Scope:
            </span>
            <div className="relative min-w-[200px]">
              <select
                value={activeModuleScope}
                onChange={(e) => setActiveModuleScope(e.target.value as ModuleKey)}
                aria-label="Module Scope"
                className="w-full h-10 pl-3 pr-8 text-xs font-semibold bg-white text-[#0F172A] border border-[#CBD5E1] rounded-[6px] appearance-none focus:outline-hidden focus:ring-2 focus:ring-[#2563EB]/25 focus:border-[#2563EB] cursor-pointer"
              >
                {moduleOptions.map(m => (
                  <option key={m.key} value={m.key}>
                    {m.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-[#64748B] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        </div>
      </Card>

      {/* Matrix Table with View, Edit, Delete Actions */}
      <Card noPadding className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[11px] font-semibold text-[#475569] uppercase tracking-wider sticky top-0 z-10">
                <th className="py-3 px-4 min-w-[200px]">User Name</th>
                <th className="py-3 px-3 min-w-[130px]">Role</th>
                <th className="py-3 px-3 min-w-[140px]">Department</th>
                {actions.map(act => (
                  <th key={act} className="py-3 px-3 text-center uppercase min-w-[70px]">
                    {act}
                  </th>
                ))}
                <th className="py-3 px-4 text-center min-w-[110px]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F1F5F9] text-xs text-[#0F172A]">
              {filteredUsers.map((user) => {
                const userPerms = user.permissions[activeModuleScope]

                return (
                  <tr key={user.userId} className="hover:bg-[#F8FAFC]/80 transition-colors">
                    {/* User Identity */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center shrink-0 border border-blue-200">
                          {user.avatar}
                        </div>
                        <div className="overflow-hidden">
                          <p className="font-semibold text-[#0F172A] truncate">
                            {user.userName}
                          </p>
                          <p className="text-[11px] text-[#64748B] truncate">
                            {user.userEmail}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Role */}
                    <td className="py-3.5 px-3 whitespace-nowrap">
                      {getRoleBadge(user.role)}
                    </td>

                    {/* Department */}
                    <td className="py-3.5 px-3 text-[#64748B] whitespace-nowrap">
                      {user.department}
                    </td>

                    {/* Action Checkboxes for selected module */}
                    {actions.map(act => {
                      const isChecked = userPerms[act]

                      return (
                        <td key={act} className="py-3.5 px-3 text-center">
                          <label className="inline-flex items-center justify-center cursor-pointer p-1 rounded-sm hover:bg-slate-100">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => handleCheckboxChange(user.userId, activeModuleScope, act)}
                              className="w-4 h-4 rounded-xs border-[#CBD5E1] text-[#2563EB] focus:ring-[#2563EB]/30 cursor-pointer"
                              aria-label={`Toggle ${act} for ${user.userName}`}
                            />
                          </label>
                        </td>
                      )
                    })}

                    {/* Row Actions: View, Edit, Delete */}
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleView(user)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-[4px] cursor-pointer"
                          title="View User Details"
                          aria-label={`View ${user.userName}`}
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleEdit(user)}
                          className="p-1.5 text-[#64748B] hover:text-[#0F172A] hover:bg-[#F1F5F9] rounded-[4px] cursor-pointer"
                          title="Edit User"
                          aria-label={`Edit ${user.userName}`}
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteId(user.userId)}
                          className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-[4px] cursor-pointer"
                          title="Delete User"
                          aria-label={`Delete ${user.userName}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* User Modal (Create, Edit, View in Form format) */}
      <UserModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        userToEdit={userToEdit}
        isViewOnly={isViewOnly}
      />

      {/* Delete Confirmation Modal */}
      {confirmDeleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0F172A]/40 backdrop-blur-xs">
          <div className="bg-white rounded-[16px] border border-[#E2E8F0] shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <h3 className="text-base font-bold text-[#0F172A] font-heading">
                Confirm Account Deletion
              </h3>
            </div>
            <p className="text-xs text-[#64748B] leading-relaxed">
              Are you sure you want to remove this user account? Their permissions in the User Matrix and access credentials will be permanently revoked.
            </p>
            <div className="flex justify-end gap-2.5 pt-2">
              <Button variant="outline" size="sm" onClick={() => setConfirmDeleteId(null)}>
                Cancel
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={() => {
                  deleteUser(confirmDeleteId)
                  setConfirmDeleteId(null)
                }}
              >
                Delete User
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
