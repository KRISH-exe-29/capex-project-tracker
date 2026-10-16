import React from 'react'
import { ShieldCheck, Users, Lock, CheckCircle2, ChevronRight, Key } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription } from '../../common/Card'
import { Button } from '../../common/Button'
import { StatusBadge } from '../../common/Badge'
import { useCapex } from '../../../context/CapexContext'

export const RolesPermissionsView: React.FC = () => {
  const { roles, setActiveModule, addToast } = useCapex()

  const handleEditRole = (roleName: string) => {
    setActiveModule('access-matrix')
    addToast(`Viewing granular matrix allocations for ${roleName}.`, 'info')
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Key className="w-5 h-5 text-purple-600" />
            <h2 className="text-xl font-bold text-[#0F172A] font-heading tracking-tight">
              Roles & Security Governance
            </h2>
          </div>
          <p className="text-xs text-[#64748B] mt-0.5">
            Pre-configured corporate RBAC role definitions with scoped module authority and audit constraints.
          </p>
        </div>

        <Button
          variant="primary"
          onClick={() => setActiveModule('access-matrix')}
          leftIcon={<ShieldCheck className="w-4 h-4" />}
        >
          Open User Matrix
        </Button>
      </div>

      {/* Role Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {roles.map((role) => {
          return (
            <Card key={role.id} className="flex flex-col justify-between hover:shadow-md transition-shadow">
              <div>
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center font-bold text-xs border border-purple-200">
                      <Lock className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-[#0F172A] font-heading">
                        {role.name}
                      </h4>
                      <p className="text-[11px] text-[#64748B]">
                        {role.userCount} Active Assignees
                      </p>
                    </div>
                  </div>

                  {role.isSystem ? (
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700 px-2 py-0.5 rounded-sm border border-slate-200">
                      System Role
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-700 px-2 py-0.5 rounded-sm border border-blue-200">
                      Custom Role
                    </span>
                  )}
                </div>

                <p className="text-xs text-[#475569] leading-relaxed my-3">
                  {role.description}
                </p>

                {/* Module Permission Pills */}
                <div className="space-y-2 pt-3 border-t border-[#F1F5F9]">
                  <p className="text-[10px] uppercase font-bold text-[#94A3B8] tracking-wider">
                    Authorized Scope
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {Object.entries(role.permissions).map(([mod, perms]) => {
                      if (!perms.view) return null
                      const canEdit = perms.create || perms.edit

                      return (
                        <span
                          key={mod}
                          className={`text-[10px] font-mono px-2 py-0.5 rounded-[4px] border ${
                            canEdit
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              : 'bg-slate-100 text-slate-700 border-slate-200'
                          }`}
                        >
                          {mod}: {canEdit ? 'Read/Write' : 'Read-only'}
                        </span>
                      )
                    })}
                  </div>
                </div>
              </div>

              <div className="pt-4 mt-4 border-t border-[#F1F5F9] flex items-center justify-between">
                <span className="text-xs text-[#64748B]">Enforced server-side</span>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs"
                  onClick={() => handleEditRole(role.name)}
                  rightIcon={<ChevronRight className="w-3.5 h-3.5" />}
                >
                  Manage Users
                </Button>
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
