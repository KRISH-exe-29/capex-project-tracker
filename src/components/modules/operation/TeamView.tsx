import React, { useState, useMemo } from 'react'
import { Plus, Search, Filter, Edit2, Trash2, Users2, Mail, Phone, Briefcase } from 'lucide-react'
import { Card } from '../../common/Card'
import { Button } from '../../common/Button'
import { StatusBadge } from '../../common/Badge'
import { EmptyState } from '../../common/EmptyState'
import { TeamMemberModal } from './TeamMemberModal'
import { useCapex } from '../../../context/CapexContext'
import { TeamMember } from '../../../types/capex'

export const TeamView: React.FC = () => {
  const {
    teamMembers,
    filteredTeam,
    projects,
    deleteTeamMember,
    selectedProjectId
  } = useCapex()

  const [searchTerm, setSearchTerm] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [memberToEdit, setMemberToEdit] = useState<TeamMember | null>(null)

  const displayedTeam = useMemo(() => {
    return filteredTeam.filter(m => {
      const proj = projects.find(p => p.id === m.projectId)
      const matchesSearch =
        m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (proj && proj.name.toLowerCase().includes(searchTerm.toLowerCase()))

      return matchesSearch
    })
  }, [filteredTeam, searchTerm, projects])

  const handleEdit = (tm: TeamMember) => {
    setMemberToEdit(tm)
    setIsModalOpen(true)
  }

  const handleCreate = () => {
    setMemberToEdit(null)
    setIsModalOpen(true)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Users2 className="w-5 h-5 text-emerald-600" />
            <h2 className="text-xl font-bold text-[#0F172A] font-heading tracking-tight">
              Project Team & Resource Allocation
            </h2>
          </div>
          <p className="text-xs text-[#64748B] mt-0.5">
            Associate key engineering personnel, consultants, and project directors with relevant CAPEX projects and work items.
          </p>
        </div>

        <Button
          variant="primary"
          onClick={handleCreate}
          leftIcon={<Plus className="w-4 h-4" />}
        >
          Associate Member
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <Card noPadding className="p-4">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-[#94A3B8] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by engineer name, role, email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-10 pl-9 pr-3 text-xs bg-white text-[#0F172A] border border-[#CBD5E1] rounded-[6px] focus:outline-hidden focus:ring-2 focus:ring-[#2563EB]/25 focus:border-[#2563EB]"
          />
        </div>
      </Card>

      {/* Team Cards Grid */}
      {displayedTeam.length === 0 ? (
        <Card noPadding>
          <EmptyState
            title="No Team Members Found"
            description="No personnel are associated with this project. Click Associate Member to assign staff."
            actionLabel="Associate Member"
            onAction={handleCreate}
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {displayedTeam.map((member) => {
            const proj = projects.find(p => p.id === member.projectId)
            const initials = member.name
              .split(' ')
              .map(n => n[0])
              .join('')
              .toUpperCase()
              .substring(0, 2)

            return (
              <Card key={member.id} className="relative flex flex-col justify-between hover:shadow-md transition-shadow">
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center justify-center shrink-0 border border-emerald-200">
                        {initials}
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-[#0F172A] leading-tight">
                          {member.name}
                        </h4>
                        <p className="text-xs text-[#2563EB] font-medium mt-0.5">
                          {member.role}
                        </p>
                      </div>
                    </div>

                    <StatusBadge status={member.status} />
                  </div>

                  <div className="space-y-2 text-xs text-[#64748B] pt-2 border-t border-[#F1F5F9]">
                    <div className="flex items-center gap-2 truncate">
                      <Briefcase className="w-3.5 h-3.5 text-[#94A3B8] shrink-0" />
                      <span className="truncate text-[#0F172A] font-medium">
                        {proj ? `${proj.code} - ${proj.name}` : 'Unassigned'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 truncate">
                      <Mail className="w-3.5 h-3.5 text-[#94A3B8] shrink-0" />
                      <span className="truncate">{member.email}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-[#94A3B8] shrink-0" />
                      <span>{member.phone}</span>
                    </div>
                  </div>

                  {member.workItems.length > 0 && (
                    <div className="mt-3 pt-2.5 border-t border-[#F1F5F9]">
                      <p className="text-[10px] uppercase font-bold text-[#94A3B8] tracking-wider mb-1.5">
                        Supervised WBS Packages
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {member.workItems.map((item, idx) => (
                          <span
                            key={idx}
                            className="text-[10px] font-mono bg-slate-100 text-slate-700 px-2 py-0.5 rounded-[4px] border border-slate-200"
                          >
                            {item}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-end gap-2 pt-4 mt-4 border-t border-[#F1F5F9]">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 text-xs text-[#64748B]"
                    leftIcon={<Edit2 className="w-3.5 h-3.5" />}
                    onClick={() => handleEdit(member)}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 text-xs text-rose-600 hover:bg-rose-50"
                    leftIcon={<Trash2 className="w-3.5 h-3.5" />}
                    onClick={() => deleteTeamMember(member.id)}
                  >
                    Remove
                  </Button>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      <TeamMemberModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        memberToEdit={memberToEdit}
      />
    </div>
  )
}
