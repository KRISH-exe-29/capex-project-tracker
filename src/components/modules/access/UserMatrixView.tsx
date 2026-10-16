import React, { useState } from 'react'
import { Users } from 'lucide-react'
import { Card } from '../../common/Card'
import { Button } from '../../common/Button'
import { Badge } from '../../common/Badge'
import { PageHeader } from '../../common/PageHeader'
import { SearchInput, Toolbar } from '../../common/Toolbar'
import { useCapex } from '../../../context/CapexContext'
import type { ActionPermissions, ModuleKey } from '../../../types/capex'
import { cn } from '../../../utils/cn'

const MODULES: { key: ModuleKey; label: string; note: string }[] = [
  { key: 'dashboard', label: 'Dashboard', note: 'Overview and KPIs' },
  { key: 'planning', label: 'Planning & procurement', note: 'Projects, WBS, work packages, PRs and POs' },
  { key: 'finance', label: 'Finance', note: 'Budget, billing, and PR / budget-revision approval' },
  { key: 'operation', label: 'Operation', note: 'Team and daily progress' },
  { key: 'document', label: 'Documents', note: 'Document register' },
  { key: 'access', label: 'Access', note: 'Users, roles and this matrix' }
]

const ACTIONS: (keyof ActionPermissions)[] = ['view', 'create', 'edit', 'delete', 'export', 'approve']

export const UserMatrixView: React.FC = () => {
  const { userPermissions, currentUser, toggleUserPermission, setActiveModule, hasPermission } = useCapex()
  const [search, setSearch] = useState('')
  const [scope, setScope] = useState<ModuleKey>('planning')

  const canEdit = hasPermission('access', 'edit')
  const module = MODULES.find(item => item.key === scope)!
  const needle = search.trim().toLowerCase()
  const rows = userPermissions.filter(
    user => !needle || `${user.userName} ${user.userEmail} ${user.role}`.toLowerCase().includes(needle)
  )

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Access"
        title="Permission Matrix"
        description="What each user can do in each area. A role sets the defaults; changes here are recorded in the Activity Log."
        actions={
          <Button variant="outline" leftIcon={<Users className="h-4 w-4" />} onClick={() => setActiveModule('access-users')}>
            Users & roles
          </Button>
        }
      />

      <Card noPadding>
        <div className="flex flex-wrap gap-1.5 border-b border-slate-200/70 px-4 py-3" role="tablist" aria-label="Area">
          {MODULES.map(item => (
            <button
              key={item.key}
              role="tab"
              aria-selected={scope === item.key}
              onClick={() => setScope(item.key)}
              className={cn(
                'rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors',
                scope === item.key ? 'bg-blue-600 text-white shadow-sm' : 'bg-white/70 text-slate-600 ring-1 ring-inset ring-slate-200 hover:bg-white'
              )}
            >
              {item.label}
            </button>
          ))}
        </div>
        <Toolbar>
          <SearchInput value={search} onChange={setSearch} placeholder="Search user, email or role…" />
          <p className="text-xs text-slate-500">{module.note}</p>
        </Toolbar>

        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Role</th>
                {ACTIONS.map(action => (
                  <th key={action} className="text-center! capitalize">
                    {action}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map(user => {
                const isMe = user.userId === currentUser?.userId
                const locked = !canEdit || isMe
                return (
                  <tr key={user.userId}>
                    <td>
                      <p className="font-semibold text-slate-900">
                        {user.userName}
                        {isMe && <span className="ml-2 text-xs font-normal text-slate-500">(you)</span>}
                      </p>
                      <p className="text-xs text-slate-500">{user.userEmail}</p>
                    </td>
                    <td>
                      <Badge variant="neutral" dot={false}>
                        {user.role}
                      </Badge>
                    </td>
                    {ACTIONS.map(action => (
                      <td key={action} className="text-center">
                        <input
                          type="checkbox"
                          checked={Boolean(user.permissions[scope]?.[action])}
                          disabled={locked}
                          onChange={() => toggleUserPermission(user.userId, scope, action)}
                          aria-label={`${user.userName}: ${action} in ${module.label}`}
                          title={isMe ? 'You cannot change your own permissions' : !canEdit ? 'Your role cannot change permissions' : undefined}
                          className="h-4 w-4 cursor-pointer rounded border-slate-300 accent-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
                        />
                      </td>
                    ))}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
