import React, { useMemo, useState } from 'react'
import { ChevronDown, ChevronRight, ClipboardList, FileSearch, Network, Pencil, Plus, Trash2 } from 'lucide-react'
import { Card } from '../../common/Card'
import { Button } from '../../common/Button'
import { StatusBadge } from '../../common/Badge'
import { EmptyState } from '../../common/EmptyState'
import { PageHeader } from '../../common/PageHeader'
import { SearchInput, Toolbar } from '../../common/Toolbar'
import { IconButton } from '../../common/IconButton'
import { PhaseModal } from './PhaseModal'
import { PartModal } from './PartModal'
import { SectionModal } from './SectionModal'
import { TaskModal } from './TaskModal'
import { ProjectModal } from './ProjectModal'
import { SubWorkModal } from './SubWorkModal'
import { RaisePrModal } from '../procurement/RaisePrModal'
import { useCapex } from '../../../context/CapexContext'
import { available } from '../../../utils/capexRules'
import { formatINR } from '../../../utils/formatters'
import { cn } from '../../../utils/cn'
import type { ProjectPart, ProjectPhase, Section, SubWork, Task } from '../../../types/capex'

type Kind = 'project' | 'phase' | 'part' | 'section' | 'task' | 'po'

interface TreeNode {
  id: string
  kind: Kind
  wbs: string
  name: string
  meta?: string
  amount?: number
  amountHint?: React.ReactNode
  status?: string
  children: TreeNode[]
  actions: React.ReactNode
}

const KIND_CHIP: Record<Kind, string> = {
  project: 'bg-blue-600 text-white',
  phase: 'bg-violet-100 text-violet-800',
  part: 'bg-sky-100 text-sky-800',
  section: 'bg-slate-200 text-slate-800',
  task: 'bg-emerald-100 text-emerald-800',
  po: 'bg-amber-100 text-amber-900'
}

const KIND_LABEL: Record<Kind, string> = {
  project: 'Project',
  phase: 'Phase',
  part: 'Part',
  section: 'Section',
  task: 'Work package',
  po: 'PO'
}

type ModalState =
  | { type: 'project' }
  | { type: 'phase'; edit?: ProjectPhase; projectId: string }
  | { type: 'part'; edit?: ProjectPart; projectId: string; phaseId?: string }
  | { type: 'section'; edit?: Section; projectId: string; partId?: string }
  | { type: 'task'; edit?: Task; projectId: string; sectionId?: string }
  | { type: 'po'; edit?: SubWork; taskId?: string }
  | { type: 'pr'; taskId: string }
  | null

export const WbsTreeView: React.FC = () => {
  const {
    projects,
    phases,
    parts,
    sections,
    tasks,
    subWorks,
    purchaseRequisitions,
    selectedProjectId,
    hasPermission,
    hasFinancialRecords,
    deletePhase,
    deletePart,
    deleteSection,
    deleteTask,
    openRecord
  } = useCapex()

  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({})
  const [search, setSearch] = useState('')
  const [modal, setModal] = useState<ModalState>(null)

  const canCreate = hasPermission('planning', 'create')
  const canEdit = hasPermission('planning', 'edit')
  const canDelete = hasPermission('planning', 'delete')
  const lockedReason = 'Has PRs or POs under it, so it cannot be deleted'

  const tree = useMemo(() => {
    const editButton = (label: string, onClick: () => void) =>
      canEdit && (
        <IconButton label={`Edit ${label}`} onClick={onClick}>
          <Pencil className="h-3.5 w-3.5" />
        </IconButton>
      )
    const deleteButton = (label: string, locked: boolean, onClick: () => void) =>
      canDelete && (
        <IconButton label={`Delete ${label}`} tone="danger" disabledReason={locked ? lockedReason : undefined} onClick={onClick}>
          <Trash2 className="h-3.5 w-3.5" />
        </IconButton>
      )
    const addButton = (label: string, onClick: () => void) =>
      canCreate && (
        <Button size="sm" variant="outline" className="h-7 px-2 text-[11px]" leftIcon={<Plus className="h-3 w-3" />} onClick={onClick}>
          {label}
        </Button>
      )

    const poNode = (po: SubWork): TreeNode => ({
      id: po.id,
      kind: 'po',
      wbs: po.wbsNumber,
      name: po.workDescription,
      meta: `PO ${po.poNumber} · ${po.supplierName}`,
      amount: po.poValueGst,
      status: po.status,
      children: [],
      actions: (
        <IconButton label="Open dossier" onClick={() => openRecord('procurement-dossier', po.id)}>
          <FileSearch className="h-3.5 w-3.5" />
        </IconButton>
      )
    })

    const taskNode = (task: Task): TreeNode => {
      const left = available(task, subWorks, purchaseRequisitions)
      return {
        id: task.id,
        kind: 'task',
        wbs: task.wbsNumber,
        name: task.name,
        amount: task.budgetAmount,
        amountHint: (
          <span className={left < 0 ? 'text-rose-600' : 'text-emerald-700'}>{formatINR(left, true)} left</span>
        ),
        status: task.status,
        children: subWorks.filter(po => po.taskId === task.id).map(poNode),
        actions: (
          <>
            {canCreate && (
              <IconButton label="Raise PR" onClick={() => setModal({ type: 'pr', taskId: task.id })}>
                <ClipboardList className="h-3.5 w-3.5" />
              </IconButton>
            )}
            {editButton('work package', () => setModal({ type: 'task', edit: task, projectId: task.projectId }))}
            {deleteButton('work package', hasFinancialRecords(item => item.id === task.id), () => deleteTask(task.id))}
          </>
        )
      }
    }

    const sectionNode = (section: Section): TreeNode => {
      const sectionTasks = tasks.filter(task => task.sectionId === section.id)
      return {
        id: section.id,
        kind: 'section',
        wbs: section.wbsNumber,
        name: section.name,
        meta: section.description,
        amount: sectionTasks.reduce((sum, task) => sum + task.budgetAmount, 0),
        amountHint: 'work package budgets',
        children: sectionTasks.map(taskNode),
        actions: (
          <>
            {addButton('Work package', () => setModal({ type: 'task', projectId: section.projectId, sectionId: section.id }))}
            {editButton('section', () => setModal({ type: 'section', edit: section, projectId: section.projectId }))}
            {deleteButton('section', hasFinancialRecords(task => task.sectionId === section.id), () => deleteSection(section.id))}
          </>
        )
      }
    }

    const partNode = (part: ProjectPart): TreeNode => ({
      id: part.id,
      kind: 'part',
      wbs: part.wbsNumber,
      name: part.name,
      amount: part.budgetAmount,
      status: part.status,
      children: sections.filter(section => section.partId === part.id).map(sectionNode),
      actions: (
        <>
          {addButton('Section', () => setModal({ type: 'section', projectId: part.projectId, partId: part.id }))}
          {editButton('part', () => setModal({ type: 'part', edit: part, projectId: part.projectId }))}
          {deleteButton('part', hasFinancialRecords(task => task.partId === part.id), () => deletePart(part.id))}
        </>
      )
    })

    const phaseNode = (phase: ProjectPhase): TreeNode => ({
      id: phase.id,
      kind: 'phase',
      wbs: phase.wbsNumber,
      name: phase.name,
      amount: phase.budgetAmount,
      status: phase.status,
      children: parts.filter(part => part.phaseId === phase.id).map(partNode),
      actions: (
        <>
          {addButton('Part', () => setModal({ type: 'part', projectId: phase.projectId, phaseId: phase.id }))}
          {editButton('phase', () => setModal({ type: 'phase', edit: phase, projectId: phase.projectId }))}
          {deleteButton('phase', hasFinancialRecords(task => task.phaseId === phase.id), () => deletePhase(phase.id))}
        </>
      )
    })

    return projects
      .filter(project => selectedProjectId === 'all' || project.id === selectedProjectId)
      .map(
        (project): TreeNode => ({
          id: project.id,
          kind: 'project',
          wbs: project.code,
          name: project.name,
          meta: `PO committed ${formatINR(project.poValue, true)} · ${project.executionTimeline}`,
          amount: project.approvedAmount,
          amountHint: 'approved',
          status: project.status,
          children: [
            ...phases.filter(phase => phase.projectId === project.id).map(phaseNode),
            ...sections.filter(section => section.projectId === project.id && !section.partId).map(sectionNode)
          ],
          actions: (
            <>
              {addButton('Phase', () => setModal({ type: 'phase', projectId: project.id }))}
              {addButton('Section', () => setModal({ type: 'section', projectId: project.id }))}
            </>
          )
        })
      )
  }, [
    projects,
    phases,
    parts,
    sections,
    tasks,
    subWorks,
    purchaseRequisitions,
    selectedProjectId,
    canCreate,
    canEdit,
    canDelete,
    hasFinancialRecords,
    deletePhase,
    deletePart,
    deleteSection,
    deleteTask,
    openRecord
  ])

  // Search keeps a node when it or any descendant matches, and opens everything on the way.
  const visible = useMemo(() => {
    const needle = search.trim().toLowerCase()
    if (!needle) return tree
    const prune = (node: TreeNode): TreeNode | null => {
      const children = node.children.map(prune).filter((child): child is TreeNode => child !== null)
      const hit = `${node.wbs} ${node.name} ${node.meta ?? ''}`.toLowerCase().includes(needle)
      return hit || children.length ? { ...node, children } : null
    }
    return tree.map(prune).filter((node): node is TreeNode => node !== null)
  }, [tree, search])

  const renderNode = (node: TreeNode, depth: number): React.ReactNode => {
    const open = search.trim() ? true : !collapsed[node.id]
    const hasChildren = node.children.length > 0
    const isProject = node.kind === 'project'

    return (
      <React.Fragment key={node.id}>
        <div
          className={cn(
            'group grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-b border-slate-200/60 py-2.5 pr-4 transition-colors md:grid-cols-[minmax(0,1fr)_10rem_8rem_12rem]',
            isProject ? 'bg-blue-50/60' : 'hover:bg-white/70'
          )}
          style={{ paddingLeft: `${16 + depth * 22}px` }}
        >
          <div className="flex min-w-0 items-center gap-2">
            <button
              type="button"
              onClick={() => setCollapsed(prev => ({ ...prev, [node.id]: !prev[node.id] }))}
              className={cn(
                'flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-slate-500 hover:bg-slate-200/70',
                !hasChildren && 'invisible'
              )}
              aria-label={open ? `Collapse ${node.name}` : `Expand ${node.name}`}
              aria-expanded={open}
            >
              {open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </button>
            <span
              className={cn('mono-num shrink-0 rounded px-1.5 py-0.5 text-[11px] font-semibold', KIND_CHIP[node.kind])}
              title={KIND_LABEL[node.kind]}
            >
              {node.wbs}
            </span>
            <div className="min-w-0">
              <p className={cn('truncate text-slate-900', isProject ? 'text-sm font-semibold' : 'text-[13px] font-medium')}>
                {node.name}
              </p>
              {node.meta && <p className="truncate text-xs text-slate-500">{node.meta}</p>}
            </div>
          </div>

          <div className="hidden text-right md:block">
            {node.amount !== undefined && (
              <>
                <p className="mono-num text-[13px] font-semibold text-slate-900">{formatINR(node.amount)}</p>
                {node.amountHint && <p className="text-[11px] text-slate-500">{node.amountHint}</p>}
              </>
            )}
          </div>

          <div className="hidden md:block">{node.status && <StatusBadge status={node.status} />}</div>

          <div className="flex items-center justify-end gap-1">{node.actions}</div>
        </div>
        {open && node.children.map(child => renderNode(child, depth + 1))}
      </React.Fragment>
    )
  }

  const closeModal = () => setModal(null)

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Planning"
        title="Project WBS"
        description="The full breakdown: project → phase → part → section → work package (budget line) → purchase order."
        actions={
          canCreate && (
            <Button leftIcon={<Plus className="h-4 w-4" />} onClick={() => setModal({ type: 'project' })}>
              New project
            </Button>
          )
        }
      />

      <Card noPadding className="overflow-hidden">
        <Toolbar>
          <SearchInput value={search} onChange={setSearch} placeholder="Find by WBS number or name (e.g. 1.2, Civil)" />
          <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500">
            {(Object.keys(KIND_LABEL) as Kind[]).map(kind => (
              <span key={kind} className="inline-flex items-center gap-1.5">
                <span className={cn('h-2.5 w-2.5 rounded-sm', KIND_CHIP[kind])} />
                {KIND_LABEL[kind]}
              </span>
            ))}
          </div>
        </Toolbar>

        {visible.length === 0 ? (
          <div className="p-5">
            <EmptyState
              icon={<Network className="h-6 w-6" />}
              title={tree.length ? 'Nothing matches' : 'No projects yet'}
              description={
                tree.length
                  ? 'Try another WBS number or name.'
                  : 'Create a project, then break it into phases, sections and work packages with budgets.'
              }
              actionLabel={!tree.length && canCreate ? 'New project' : undefined}
              onAction={() => setModal({ type: 'project' })}
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <div className="min-w-[640px]">
              <div className="hidden grid-cols-[minmax(0,1fr)_10rem_8rem_12rem] gap-3 border-b border-slate-200 bg-slate-50/80 py-2 pr-4 pl-4 text-[11px] font-semibold uppercase tracking-[0.05em] text-slate-500 md:grid">
                <span>WBS item</span>
                <span className="text-right">Budget / value</span>
                <span>Status</span>
                <span className="text-right">Actions</span>
              </div>
              {visible.map(node => renderNode(node, 0))}
            </div>
          </div>
        )}
      </Card>

      <ProjectModal isOpen={modal?.type === 'project'} onClose={closeModal} />
      <PhaseModal
        isOpen={modal?.type === 'phase'}
        onClose={closeModal}
        phaseToEdit={modal?.type === 'phase' ? (modal.edit ?? null) : null}
        defaultProjectId={modal?.type === 'phase' ? modal.projectId : undefined}
      />
      <PartModal
        isOpen={modal?.type === 'part'}
        onClose={closeModal}
        partToEdit={modal?.type === 'part' ? (modal.edit ?? null) : null}
        defaultProjectId={modal?.type === 'part' ? modal.projectId : undefined}
        defaultPhaseId={modal?.type === 'part' ? modal.phaseId : undefined}
      />
      <SectionModal
        isOpen={modal?.type === 'section'}
        onClose={closeModal}
        sectionToEdit={modal?.type === 'section' ? (modal.edit ?? null) : null}
        defaultProjectId={modal?.type === 'section' ? modal.projectId : undefined}
        defaultPartId={modal?.type === 'section' ? modal.partId : undefined}
      />
      <TaskModal
        isOpen={modal?.type === 'task'}
        onClose={closeModal}
        taskToEdit={modal?.type === 'task' ? (modal.edit ?? null) : null}
        defaultProjectId={modal?.type === 'task' ? modal.projectId : undefined}
        defaultSectionId={modal?.type === 'task' ? modal.sectionId : undefined}
      />
      <SubWorkModal
        isOpen={modal?.type === 'po'}
        onClose={closeModal}
        subWorkToEdit={modal?.type === 'po' ? (modal.edit ?? null) : null}
        defaultTaskId={modal?.type === 'po' ? modal.taskId : undefined}
      />
      <RaisePrModal isOpen={modal?.type === 'pr'} onClose={closeModal} defaultTaskId={modal?.type === 'pr' ? modal.taskId : undefined} />
    </div>
  )
}
