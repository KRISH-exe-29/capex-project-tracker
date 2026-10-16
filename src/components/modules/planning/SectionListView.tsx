import React, { useMemo, useState } from 'react'
import { Layers, Pencil, Plus, Trash2 } from 'lucide-react'
import { Card } from '../../common/Card'
import { Button } from '../../common/Button'
import { EmptyState } from '../../common/EmptyState'
import { PageHeader } from '../../common/PageHeader'
import { SearchInput, Toolbar } from '../../common/Toolbar'
import { IconButton } from '../../common/IconButton'
import { ConfirmDialog } from '../../common/ConfirmDialog'
import { SectionModal } from './SectionModal'
import { useCapex } from '../../../context/CapexContext'
import type { Section } from '../../../types/capex'
import { committed, openPr } from '../../../utils/capexRules'
import { formatINR } from '../../../utils/formatters'
import { cn } from '../../../utils/cn'

/** WBS sections (Civil, MEP, Winding…) with the budget of their work packages rolled up. */
export const SectionListView: React.FC = () => {
  const {
    projects,
    parts,
    filteredSections,
    tasks,
    subWorks,
    purchaseRequisitions,
    deleteSection,
    hasPermission,
    hasFinancialRecords
  } = useCapex()

  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Section | null>(null)
  const [deleting, setDeleting] = useState<Section | null>(null)

  const canCreate = hasPermission('planning', 'create')
  const canEdit = hasPermission('planning', 'edit')
  const canDelete = hasPermission('planning', 'delete')

  const rows = useMemo(() => {
    const needle = search.trim().toLowerCase()
    return filteredSections
      .filter(section => !needle || `${section.wbsNumber} ${section.name}`.toLowerCase().includes(needle))
      .map(section => {
        const sectionTasks = tasks.filter(task => task.sectionId === section.id)
        const budget = sectionTasks.reduce((sum, task) => sum + task.budgetAmount, 0)
        const po = sectionTasks.reduce((sum, task) => sum + committed(task.id, subWorks), 0)
        const pr = sectionTasks.reduce((sum, task) => sum + openPr(task.id, purchaseRequisitions), 0)
        return { section, count: sectionTasks.length, budget, po, pr, left: budget - po - pr }
      })
  }, [filteredSections, search, tasks, subWorks, purchaseRequisitions])

  const openCreate = () => {
    setEditing(null)
    setModalOpen(true)
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Planning"
        title="Sections"
        description="Areas of the project such as Civil, MEP or Testlab. Budgets roll up from the work packages inside each section."
        actions={
          canCreate &&
          projects.length > 0 && (
            <Button leftIcon={<Plus className="h-4 w-4" />} onClick={openCreate}>
              New section
            </Button>
          )
        }
      />

      <Card noPadding>
        <Toolbar>
          <SearchInput value={search} onChange={setSearch} placeholder="Search WBS number or section name…" />
        </Toolbar>

        {rows.length === 0 ? (
          <div className="p-5">
            <EmptyState
              icon={<Layers className="h-6 w-6" />}
              title={filteredSections.length ? 'No sections match' : 'No sections yet'}
              description={
                filteredSections.length
                  ? 'Change the search.'
                  : projects.length
                    ? 'Add sections such as Civil or MEP, then add work packages under them.'
                    : 'Create a project first.'
              }
              actionLabel={!filteredSections.length && projects.length && canCreate ? 'New section' : undefined}
              onAction={openCreate}
            />
          </div>
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Section</th>
                  <th>Project / part</th>
                  <th className="num">Work packages</th>
                  <th className="num">Budget</th>
                  <th className="num">PO committed</th>
                  <th className="num">Open PRs</th>
                  <th className="num">Available</th>
                  <th className="actions">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(({ section, count, budget, po, pr, left }) => {
                  const project = projects.find(item => item.id === section.projectId)
                  const part = parts.find(item => item.id === section.partId)
                  return (
                    <tr key={section.id}>
                      <td className="max-w-[280px]">
                        <div className="flex items-start gap-2">
                          <span className="mono-num shrink-0 rounded bg-slate-100 px-1.5 py-0.5 text-[11px] font-semibold text-slate-700 ring-1 ring-inset ring-slate-200">
                            {section.wbsNumber}
                          </span>
                          <div className="min-w-0">
                            <p className="truncate font-semibold text-slate-900">{section.name}</p>
                            {section.description && <p className="truncate text-xs text-slate-500">{section.description}</p>}
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="text-slate-700">{project?.code ?? '—'}</div>
                        <div className="text-xs text-slate-500">{part ? `${part.wbsNumber} ${part.name}` : 'Directly under project'}</div>
                      </td>
                      <td className="num">{count}</td>
                      <td className="num font-semibold text-slate-900">{formatINR(budget)}</td>
                      <td className="num">{formatINR(po)}</td>
                      <td className="num">{formatINR(pr)}</td>
                      <td className={cn('num font-semibold', left < 0 ? 'text-rose-600' : 'text-emerald-700')}>{formatINR(left)}</td>
                      <td className="actions">
                        <div className="flex justify-end gap-1">
                          {canEdit && (
                            <IconButton
                              label="Edit section"
                              onClick={() => {
                                setEditing(section)
                                setModalOpen(true)
                              }}
                            >
                              <Pencil className="h-4 w-4" />
                            </IconButton>
                          )}
                          {canDelete && (
                            <IconButton
                              label="Delete section"
                              tone="danger"
                              disabledReason={
                                hasFinancialRecords(task => task.sectionId === section.id)
                                  ? 'Has PRs or POs, so it cannot be deleted'
                                  : undefined
                              }
                              onClick={() => setDeleting(section)}
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

      <SectionModal isOpen={modalOpen} onClose={() => setModalOpen(false)} sectionToEdit={editing} />
      <ConfirmDialog
        isOpen={deleting !== null}
        title={`Delete section ${deleting?.name ?? ''}?`}
        message="Work packages under it will no longer have a section. The deletion is recorded in the Activity Log."
        confirmLabel="Delete section"
        onConfirm={() => deleting && deleteSection(deleting.id)}
        onClose={() => setDeleting(null)}
      />
    </div>
  )
}
