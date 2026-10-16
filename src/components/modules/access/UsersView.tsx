import React, { useState, useMemo } from 'react'
import {
  Users,
  Plus,
  Search,
  Filter,
  Eye,
  EyeOff,
  Edit2,
  Trash2,
  ShieldCheck,
  Lock,
  AlertTriangle
} from 'lucide-react'
import { Card } from '../../common/Card'
import { Button } from '../../common/Button'
import { StatusBadge } from '../../common/Badge'
import { EmptyState } from '../../common/EmptyState'
import { UserModal } from './UserModal'
import { useCapex } from '../../../context/CapexContext'
import { UserPermission } from '../../../types/capex'

export const UsersView: React.FC = () => {
  const { userPermissions, deleteUser, setActiveModule } = useCapex()

  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState('ALL')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [userToEdit, setUserToEdit] = useState<UserPermission | null>(null)
  const [isViewOnly, setIsViewOnly] = useState(false)
  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({})
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

  const togglePasswordVisibility = (userId: string) => {
    setVisiblePasswords(prev => ({ ...prev, [userId]: !prev[userId] }))
  }

  const filteredUsers = useMemo(() => {
    return userPermissions.filter(u => {
      const matchesSearch =
        u.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.userEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.department.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesRole = roleFilter === 'ALL' || u.role.toLowerCase() === roleFilter.toLowerCase()

      return matchesSearch && matchesRole
    })
  }, [userPermissions, searchTerm, roleFilter])

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
            <Users className="w-5 h-5 text-blue-600" />
            <h2 className="text-xl font-bold text-[#0F172A] font-heading tracking-tight">
              User Accounts & Role Management
            </h2>
          </div>
          <p className="text-xs text-[#64748B] mt-0.5">
            Manage user credentials, passwords, and assigned roles (`Admin`, `Viewer`, `CAPEX Admin`). Roles automatically configure the User Matrix.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setActiveModule('access-matrix')}
            leftIcon={<ShieldCheck className="w-4 h-4 text-purple-600" />}
          >
            Open User Matrix
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

      {/* Filter and Search Bar */}
      <Card noPadding className="p-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-[#94A3B8] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search user name, email, department..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-10 pl-9 pr-3 text-xs bg-white text-[#0F172A] border border-[#CBD5E1] rounded-[6px] focus:outline-hidden focus:ring-2 focus:ring-[#2563EB]/25 focus:border-[#2563EB]"
            />
          </div>

          <div className="flex items-center gap-2.5 w-full md:w-auto">
            <Filter className="w-3.5 h-3.5 text-[#64748B]" />
            <span className="text-xs text-[#64748B] font-medium">Role:</span>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="h-10 px-3 text-xs bg-white text-[#0F172A] border border-[#CBD5E1] rounded-[6px] focus:outline-hidden focus:ring-2 focus:ring-[#2563EB]/25 cursor-pointer"
            >
              <option value="ALL">All Roles ({userPermissions.length})</option>
              <option value="Admin">Admin</option>
              <option value="CAPEX Admin">CAPEX Admin</option>
              <option value="Viewer">Viewer</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Users Table */}
      <Card noPadding className="overflow-hidden">
        {filteredUsers.length === 0 ? (
          <EmptyState
            title="No Users Found"
            description="No users match the search filter. Create a new user with role Admin, Viewer, or CAPEX Admin."
            actionLabel="Add User"
            onAction={handleCreate}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[11px] font-semibold text-[#475569] uppercase tracking-wider sticky top-0 z-10">
                  <th className="py-3 px-4">User Name</th>
                  <th className="py-3 px-3">Email Address</th>
                  <th className="py-3 px-3">Password</th>
                  <th className="py-3 px-3">Assigned Role</th>
                  <th className="py-3 px-3">Department</th>
                  <th className="py-3 px-3 text-center">Status</th>
                  <th className="py-3 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F5F9] text-xs text-[#0F172A]">
                {filteredUsers.map((user) => {
                  const isPassVisible = visiblePasswords[user.userId] ?? false

                  return (
                    <tr key={user.userId} className="hover:bg-[#F8FAFC]/80 transition-colors">
                      {/* Name & Avatar */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center shrink-0 border border-blue-200">
                            {user.avatar}
                          </div>
                          <div>
                            <p className="font-semibold text-[#0F172A]">{user.userName}</p>
                          </div>
                        </div>
                      </td>

                      {/* Email */}
                      <td className="py-3.5 px-3 text-[#64748B]">
                        {user.userEmail}
                      </td>

                      {/* Password */}
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs text-[#334155] bg-slate-100 px-2 py-0.5 rounded-[4px] border border-slate-200">
                            {isPassVisible ? (user.password || '••••••••') : '••••••••••••'}
                          </span>
                          <button
                            type="button"
                            onClick={() => togglePasswordVisibility(user.userId)}
                            className="p-1 text-[#64748B] hover:text-[#0F172A] cursor-pointer"
                            title={isPassVisible ? 'Hide password' : 'Show password'}
                          >
                            {isPassVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </td>

                      {/* Role Badge */}
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        {getRoleBadge(user.role)}
                      </td>

                      {/* Department */}
                      <td className="py-3.5 px-3 text-[#64748B]">
                        {user.department}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-3 text-center whitespace-nowrap">
                        <StatusBadge status={user.status} />
                      </td>

                      {/* Actions: View, Edit, Delete */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleView(user)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-[4px] cursor-pointer"
                            title="View User Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleEdit(user)}
                            className="p-1.5 text-[#64748B] hover:text-[#0F172A] hover:bg-[#F1F5F9] rounded-[4px] cursor-pointer"
                            title="Edit User"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setConfirmDeleteId(user.userId)}
                            className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-[4px] cursor-pointer"
                            title="Delete User"
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
        )}
      </Card>

      {/* User Modal (Form format) */}
      <UserModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        userToEdit={userToEdit}
        isViewOnly={isViewOnly}
      />

      {/* Delete Confirmation */}
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
