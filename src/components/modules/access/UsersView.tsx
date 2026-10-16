import React, { useMemo, useState } from 'react'
import { Pencil, Plus, ShieldCheck, Trash2, Users } from 'lucide-react'
import { Card } from '../../common/Card'
import { Button } from '../../common/Button'
import { Badge, StatusBadge, type BadgeVariant } from '../../common/Badge'
import { EmptyState } from '../../common/EmptyState'
import { IconButton } from '../../common/IconButton'
import { ConfirmDialog } from '../../common/ConfirmDialog'
import { PageHeader } from '../../common/PageHeader'
import { FilterSelect, SearchInput, Toolbar } from '../../common/Toolbar'
import { UserModal } from './UserModal'
import { useCapex } from '../../../context/CapexContext'
import type { UserPermission } from '../../../types/capex'

const ROLE_VARIANT: Record<string, BadgeVariant> = {
  Admin: 'violet',
  'CAPEX Admin': 'default',
  Viewer: 'neutral'
}

export const UsersView: React.FC = () => {
  const { userPermissions, currentUser, deleteUser, setActiveModule, hasPermission } = useCapex()

  const [search, setSearch] = useState('')
  const [role, setRole] = useState('ALL')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<UserPermission | null>(null)
  const [deleting, setDeleting] = useState<UserPermission | null>(null)

  const canCreate = hasPermission('access', 'create')
  const canEdit = hasPermission('access', 'edit')
  const canDelete = hasPermission('access', 'delete')

  const rows = useMemo(() => {
    const needle = search.trim().toLowerCase()
    return userPermissions.filter(user => {
      if (role !== 'ALL' && user.role !== role) return false
      return !needle || `${user.userName} ${user.userEmail} ${user.department}`.toLowerCase().includes(needle)
    })
  }, [userPermissions, search, role])

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Access"
        title="Users & Roles"
        description="Who can use the tracker and in which role. Admins approve; the capex team raises PRs and POs; viewers (auditors, management) read."
        actions={
          <>
            <Button variant="outline" leftIcon={<ShieldCheck className="h-4 w-4" />} onClick={() => setActiveModule('access-matrix')}>
              Permission matrix
            </Button>
            {canCreate && (
              <Button
                leftIcon={<Plus className="h-4 w-4" />}
                onClick={() => {
                  setEditing(null)
                  setModalOpen(true)
                }}
              >
                Add user
              </Button>
            )}
          </>
        }
      />

      <Card noPadding>
        <Toolbar>
          <SearchInput value={search} onChange={setSearch} placeholder="Search name, email or department…" />
          <FilterSelect
            label="Role"
            value={role}
            onChange={setRole}
            options={[
              { value: 'ALL', label: `All (${userPermissions.length})` },
              { value: 'Admin', label: 'Admin' },
              { value: 'CAPEX Admin', label: 'CAPEX Admin' },
              { value: 'Viewer', label: 'Viewer' }
            ]}
          />
        </Toolbar>

        {rows.length === 0 ? (
          <div className="p-5">
            <EmptyState icon={<Users className="h-6 w-6" />} title="No users match" description="Change the search or role filter." />
          </div>
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Role</th>
                  <th>Department</th>
                  <th>Status</th>
                  <th className="actions">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(user => {
                  const isMe = user.userId === currentUser?.userId
                  return (
                    <tr key={user.userId}>
                      <td>
                        <div className="flex items-center gap-3">
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-semibold text-blue-700">
                            {user.avatar}
                          </span>
                          <div className="min-w-0">
                            <p className="truncate font-semibold text-slate-900">
                              {user.userName}
                              {isMe && <span className="ml-2 text-xs font-normal text-slate-500">(you)</span>}
                            </p>
                            <p className="truncate text-xs text-slate-500">{user.userEmail}</p>
                          </div>
                        </div>
                      </td>
                      <td>
                        <Badge variant={ROLE_VARIANT[user.role] ?? 'neutral'} dot={false}>
                          {user.role}
                        </Badge>
                      </td>
                      <td>{user.department || '—'}</td>
                      <td>
                        <StatusBadge status={user.status} />
                      </td>
                      <td className="actions">
                        <div className="flex justify-end gap-1">
                          {canEdit && (
                            <IconButton
                              label="Edit user"
                              onClick={() => {
                                setEditing(user)
                                setModalOpen(true)
                              }}
                            >
                              <Pencil className="h-4 w-4" />
                            </IconButton>
                          )}
                          {canDelete && (
                            <IconButton
                              label="Remove user"
                              tone="danger"
                              disabledReason={isMe ? 'You cannot remove yourself' : undefined}
                              onClick={() => setDeleting(user)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </IconButton>
                          )}
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

      <UserModal isOpen={modalOpen} onClose={() => setModalOpen(false)} userToEdit={editing} />
      <ConfirmDialog
        isOpen={deleting !== null}
        title={`Remove ${deleting?.userName ?? 'user'}?`}
        message="They lose access to the tracker. Their past activity stays in the Activity Log."
        confirmLabel="Remove user"
        onConfirm={() => deleting && deleteUser(deleting.userId)}
        onClose={() => setDeleting(null)}
      />
    </div>
  )
}
