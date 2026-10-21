import React, { useMemo, useState } from 'react'
import { CalendarRange, FolderKanban, Network, Pencil, Plus, Trash2 } from 'lucide-react'
import { Card } from '../../common/Card'
import { Button } from '../../common/Button'
import { StatusBadge } from '../../common/Badge'
import { EmptyState } from '../../common/EmptyState'
import { PageHeader } from '../../common/PageHeader'
import { FilterSelect, SearchInput, Toolbar } from '../../common/Toolbar'
import { IconButton } from '../../common/IconButton'
import { DeleteProjectDialog } from './DeleteProjectDialog'
import { ProjectModal } from './ProjectModal'
import { useCapex } from '../../../context/CapexContext'
import type { Project } from '../../../types/capex'
import { formatDate, formatINR } from '../../../utils/formatters'

const STATUSES = ['ALL', 'Planning', 'Approved', 'Active', 'Under Review', 'Completed', 'Delayed']

export const ProjectListView: React.FC = () => {
  const {
    projects,
    purchaseRequisitions,
    subWorks,
    deleteProject,
    setActiveModule,
    setSelectedProjectId,
    hasPermission
  } = useCapex()

  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('ALL')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Project | null>(null)
  const [deleting, setDeleting] = useState<Project | null>(null)

  const canCreate = hasPermission('planning', 'create')
  const canEdit = hasPermission('planning', 'edit')
  const canDelete = hasPermission('planning', 'delete')

  const rows = useMemo(() => {
    const needle = search.trim().toLowerCase()
    return projects
      .filter(project => {
        if (status !== 'ALL' && project.status !== status) return false
        return !needle || `${project.code} ${project.name} ${project.location}`.toLowerCase().includes(needle)
      })
      .sort((a, b) => a.code.localeCompare(b.code, undefined, { numeric: true }))
  }, [projects, search, status])

  const hasFinance = (projectId: string) =>
    purchaseRequisitions.some(pr => pr.projectId === projectId) || subWorks.some(po => po.projectId === projectId)

  const openIn = (projectId: string, module: 'planning-wbs' | 'planning-gantt') => {
    setSelectedProjectId(projectId)
    setActiveModule(module)
  }

  const openCreate = () => {
    setEditing(null)
    setModalOpen(true)
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Planning"
        title="Projects"
        description="Capital projects with their approved capex ceiling. PO commitments roll up from the purchase orders under each project."
        actions={
          canCreate && (
            <Button leftIcon={<Plus className="h-4 w-4" />} onClick={openCreate}>
              New project
            </Button>
          )
        }
      />

      <Card noPadding>
        <Toolbar>
          <SearchInput value={search} onChange={setSearch} placeholder="Search code, name or location…" />
          <FilterSelect
            label="Status"
            value={status}
            onChange={setStatus}
            options={STATUSES.map(item => ({ value: item, label: item === 'ALL' ? `All (${projects.length})` : item }))}
          />
        </Toolbar>

        {rows.length === 0 ? (
          <div className="p-5">
            <EmptyState
              icon={<FolderKanban className="h-6 w-6" />}
              title={projects.length ? 'No projects match' : 'No projects yet'}
              description={
                projects.length
                  ? 'Change the search or status filter.'
                  : 'Create the first capex project with its approved amount and timeline.'
              }
              actionLabel={!projects.length && canCreate ? 'New project' : undefined}
              onAction={openCreate}
            />
          </div>
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Project</th>
                  <th>Schedule</th>
                  <th className="num">Approved</th>
                  <th className="num">PO committed</th>
                  <th className="num">Balance</th>
                  <th>Status</th>
                  <th className="actions">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(project => (
                  <tr key={project.id}>
                    <td className="max-w-[320px]">
                      <div className="flex items-start gap-2.5">
                        <span className="mono-num shrink-0 rounded bg-blue-50 px-1.5 py-0.5 text-[11px] font-semibold text-blue-700 ring-1 ring-inset ring-blue-200">
                          {project.code}
                        </span>
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-slate-900">{project.name}</p>
                          {project.location && <p className="truncate text-xs text-slate-500">{project.location}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="whitespace-nowrap">
                      <div>
                        {formatDate(project.startDate || project.approvedDate)} – {formatDate(project.endDate)}
                      </div>
                      <div className="text-xs text-slate-500">{project.executionTimeline}</div>
                    </td>
                    <td className="num font-semibold text-slate-900">{formatINR(project.approvedAmount)}</td>
                    <td className="num">{formatINR(project.poValue)}</td>
                    <td className={`num font-semibold ${project.balanceAmount < 0 ? 'text-rose-600' : 'text-emerald-700'}`}>
                      {formatINR(project.balanceAmount)}
                    </td>
                    <td>
                      <StatusBadge status={project.status} />
                    </td>
                    <td className="actions">
                      <div className="flex justify-end gap-1">
                        <IconButton label="Open WBS" onClick={() => openIn(project.id, 'planning-wbs')}>
                          <Network className="h-4 w-4" />
                        </IconButton>
                        <IconButton label="Open Gantt chart" onClick={() => openIn(project.id, 'planning-gantt')}>
                          <CalendarRange className="h-4 w-4" />
                        </IconButton>
                        {canEdit && (
                          <IconButton
                            label="Edit project"
                            onClick={() => {
                              setEditing(project)
                              setModalOpen(true)
                            }}
                          >
                            <Pencil className="h-4 w-4" />
                          </IconButton>
                        )}
                        {canDelete && (
                          <IconButton
                            label="Delete project"
                            tone="danger"
                            disabledReason={hasFinance(project.id) ? 'Has PRs or POs, so it cannot be deleted' : undefined}
                            onClick={() => setDeleting(project)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </IconButton>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <ProjectModal isOpen={modalOpen} onClose={() => setModalOpen(false)} projectToEdit={editing} />
      <DeleteProjectDialog
        project={deleting}
        projects={projects}
        onConfirm={closeGap => deleting && deleteProject(deleting.id, { closeGap })}
        onClose={() => setDeleting(null)}
      />
    </div>
  )
}
