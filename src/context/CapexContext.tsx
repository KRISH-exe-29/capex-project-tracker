import React, { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import type {
  ActionPermissions,
  ActiveModule,
  AuditEntry,
  BudgetRevision,
  DprRecord,
  Milestone,
  ModuleKey,
  Project,
  ProjectDocument,
  ProjectPart,
  ProjectPhase,
  PurchaseRequisition,
  RoleDefinition,
  Section,
  SubWork,
  Task,
  TeamMember,
  UserPermission
} from '../types/capex'
import { getDefaultPermissionsForRole } from '../types/capex'
import {
  INITIAL_DOCUMENTS,
  INITIAL_DPR,
  INITIAL_MILESTONES,
  INITIAL_PARTS,
  INITIAL_PHASES,
  INITIAL_PROJECTS,
  INITIAL_ROLES,
  INITIAL_SECTIONS,
  INITIAL_SUBWORKS,
  INITIAL_TASKS,
  INITIAL_TEAM,
  INITIAL_USER_PERMISSIONS
} from '../data/initialData'
import { canApprove, canCancelPo, canCreatePo, canEditPo, canRaisePr, committed, isSettled, openPr } from '../utils/capexRules'
import { formatINR } from '../utils/formatters'

type ToastMessage = { id: string; message: string; type: 'success' | 'warning' | 'error' | 'info' }
type New<T> = Omit<T, 'id'>
type AuditInput = Omit<AuditEntry, 'id' | 'at' | 'userId' | 'userName'>

// Every collection lives in one state object so a business action (e.g. PO creation, which also
// converts its PR and writes an audit entry) is committed in a single, atomic update.
interface Collections {
  projects: Project[]
  phases: ProjectPhase[]
  parts: ProjectPart[]
  sections: Section[]
  milestones: Milestone[]
  tasks: Task[]
  subWorks: SubWork[]
  teamMembers: TeamMember[]
  dprRecords: DprRecord[]
  documents: ProjectDocument[]
  roles: RoleDefinition[]
  userPermissions: UserPermission[]
  purchaseRequisitions: PurchaseRequisition[]
  budgetRevisions: BudgetRevision[]
  auditLog: AuditEntry[]
}

interface CapexContextType extends Omit<Collections, 'projects'> {
  activeModule: ActiveModule
  setActiveModule: (value: ActiveModule) => void
  /** Record to focus when a view opens (e.g. the PO picked from the exceptions register). */
  focusRecordId: string
  openRecord: (module: ActiveModule, recordId: string) => void
  selectedProjectId: string
  setSelectedProjectId: (value: string) => void
  sidebarCollapsed: boolean
  setSidebarCollapsed: React.Dispatch<React.SetStateAction<boolean>>
  mobileNavOpen: boolean
  setMobileNavOpen: (open: boolean) => void

  /** Projects with PO value and balance rolled up from their (non-cancelled) POs. */
  projects: Project[]
  currentUser: UserPermission
  setCurrentUserId: (id: string) => void
  hasPermission: (module: ModuleKey, action: keyof ActionPermissions) => boolean

  filteredPhases: ProjectPhase[]
  filteredParts: ProjectPart[]
  filteredSections: Section[]
  filteredMilestones: Milestone[]
  filteredTasks: Task[]
  filteredSubWorks: SubWork[]
  filteredTeam: TeamMember[]
  filteredDpr: DprRecord[]
  filteredDocuments: ProjectDocument[]
  filteredPrs: PurchaseRequisition[]

  addProject: (value: Omit<Project, 'id' | 'poValue' | 'balanceAmount'>) => void
  updateProject: (id: string, value: Partial<Project>) => void
  deleteProject: (id: string) => void
  addPhase: (value: New<ProjectPhase>) => void
  updatePhase: (id: string, value: Partial<ProjectPhase>) => void
  deletePhase: (id: string) => void
  addPart: (value: New<ProjectPart>) => void
  updatePart: (id: string, value: Partial<ProjectPart>) => void
  deletePart: (id: string) => void
  addSection: (value: New<Section>) => void
  updateSection: (id: string, value: Partial<Section>) => void
  deleteSection: (id: string) => void
  addMilestone: (value: New<Milestone>) => void
  updateMilestone: (id: string, value: Partial<Milestone>) => void
  deleteMilestone: (id: string) => void
  addTask: (value: New<Task>) => boolean
  updateTask: (id: string, value: Partial<Task>) => boolean
  deleteTask: (id: string) => void
  addSubWork: (value: New<SubWork>) => boolean
  updateSubWork: (id: string, value: Partial<SubWork>) => boolean
  cancelSubWork: (id: string, reason: string) => void
  addTeamMember: (value: New<TeamMember>) => void
  updateTeamMember: (id: string, value: Partial<TeamMember>) => void
  deleteTeamMember: (id: string) => void
  addDprRecord: (value: New<DprRecord>) => void
  updateDprRecord: (id: string, value: Partial<DprRecord>) => void
  deleteDprRecord: (id: string) => void
  addDocument: (value: Omit<ProjectDocument, 'id' | 'uploadDate'>) => void
  updateDocument: (id: string, value: Partial<ProjectDocument>) => void
  deleteDocument: (id: string) => void
  addUser: (
    value: Omit<UserPermission, 'userId' | 'avatar' | 'permissions'> & {
      permissions?: UserPermission['permissions']
    }
  ) => void
  updateUser: (id: string, value: Partial<UserPermission>) => void
  deleteUser: (id: string) => void
  toggleUserPermission: (id: string, module: ModuleKey, action: keyof ActionPermissions) => void
  updateRole: (id: string, value: Partial<RoleDefinition>) => void

  raisePr: (
    value: Omit<PurchaseRequisition, 'id' | 'prNumber' | 'requestedAt' | 'requestedBy' | 'status'>
  ) => boolean
  decidePr: (id: string, approve: boolean, reason?: string) => boolean
  cancelPr: (id: string, reason: string) => boolean
  requestBudgetRevision: (taskId: string, newBudget: number, reason: string) => boolean
  decideBudgetRevision: (id: string, approve: boolean, note?: string) => boolean
  /** Is there a PR or PO anywhere under the matching work packages? */
  hasFinancialRecords: (match: (task: Task) => boolean) => boolean

  toasts: ToastMessage[]
  addToast: (message: string, type?: ToastMessage['type']) => void
  removeToast: (id: string) => void
}

const CapexContext = createContext<CapexContextType | undefined>(undefined)
const STORAGE_PREFIX = 'capex_v2_'

const STORAGE_KEYS: Record<keyof Collections, string> = {
  projects: 'projects',
  phases: 'phases',
  parts: 'parts',
  sections: 'sections',
  milestones: 'milestones',
  tasks: 'tasks',
  subWorks: 'subworks',
  teamMembers: 'team',
  dprRecords: 'dpr',
  documents: 'documents',
  roles: 'roles',
  userPermissions: 'users',
  purchaseRequisitions: 'prs',
  budgetRevisions: 'revisions',
  auditLog: 'auditLog'
}

const newId = (prefix: string) => `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`

function stored<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

function persist(key: string, value: unknown) {
  try {
    localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(value))
  } catch {
    // Storage full or blocked: the session keeps working in memory.
  }
}

const MONEY_FIELDS = new Set([
  'approvedAmount',
  'estimatedCost',
  'budgetAmount',
  'poValueGst',
  'amount',
  'oldBudget',
  'newBudget'
])
const PAYMENT_FIELDS = new Set<string>([
  'status',
  'grnNumber',
  'grnDate',
  'invoiceNumber',
  'invoiceDate',
  'paidDate',
  'payeeBpCode'
])
const IGNORED_FIELDS = new Set(['id', 'poValue', 'balanceAmount', 'password'])

function showValue(key: string, value: unknown): string {
  if (value === undefined || value === null || value === '') return '—'
  if (MONEY_FIELDS.has(key) && typeof value === 'number') return formatINR(value)
  if (Array.isArray(value)) return value.join(', ') || '—'
  if (typeof value === 'object') return '…'
  return String(value)
}

/** Field-level change summary: "budgetAmount: ₹ 10,00,000 → ₹ 11,00,000; status: Pending → Completed". */
function describeChanges<T extends object>(before: T, after: T): { before: string; after: string } | null {
  const oldValues = before as Record<string, unknown>
  const newValues = after as Record<string, unknown>
  const changed = Object.keys(newValues).filter(
    key => !IGNORED_FIELDS.has(key) && JSON.stringify(oldValues[key]) !== JSON.stringify(newValues[key])
  )
  if (!changed.length) return null
  return {
    before: changed.map(key => `${key}: ${showValue(key, oldValues[key])}`).join('; '),
    after: changed.map(key => `${key}: ${showValue(key, newValues[key])}`).join('; ')
  }
}

/** Drop keys whose value is undefined, so a partial update never blanks a field (disabled inputs submit undefined). */
function defined<T extends object>(updates: Partial<T>): Partial<T> {
  return Object.fromEntries(Object.entries(updates).filter(([, value]) => value !== undefined)) as Partial<T>
}

export const CapexProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [activeModule, setActiveModuleState] = useState<ActiveModule>('dashboard')
  const [focusRecordId, setFocusRecordId] = useState('')
  const [selectedProjectId, setSelectedProjectId] = useState('all')
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const [toasts, setToasts] = useState<ToastMessage[]>([])
  const [actingUserId, setActingUserId] = useState(() =>
    stored('actingUser', INITIAL_USER_PERMISSIONS[1]?.userId ?? '')
  )

  const [data, setData] = useState<Collections>(() => ({
    projects: stored('projects', INITIAL_PROJECTS),
    phases: stored('phases', INITIAL_PHASES),
    parts: stored('parts', INITIAL_PARTS),
    sections: stored('sections', INITIAL_SECTIONS),
    milestones: stored('milestones', INITIAL_MILESTONES),
    tasks: stored('tasks', INITIAL_TASKS),
    subWorks: stored('subworks', INITIAL_SUBWORKS),
    teamMembers: stored('team', INITIAL_TEAM),
    dprRecords: stored('dpr', INITIAL_DPR),
    documents: stored('documents', INITIAL_DOCUMENTS),
    roles: stored('roles', INITIAL_ROLES),
    // Older versions kept plain-text passwords here; never load them back.
    userPermissions: stored<(UserPermission & { password?: string })[]>('users', INITIAL_USER_PERMISSIONS).map(
      ({ password: _password, ...user }) => user
    ),
    purchaseRequisitions: stored<PurchaseRequisition[]>('prs', []),
    budgetRevisions: stored<BudgetRevision[]>('revisions', []),
    auditLog: stored<AuditEntry[]>('auditLog', [])
  }))

  // Guards read and write through this ref so two quick submissions see each other's effect
  // before React re-renders. It is only touched inside event handlers, never during render.
  const db = useRef(data)
  const actingRef = useRef(actingUserId)
  const persisted = useRef<Partial<Collections>>({})

  useEffect(() => {
    ;(Object.keys(STORAGE_KEYS) as (keyof Collections)[]).forEach(key => {
      if (persisted.current[key] !== data[key]) {
        persist(STORAGE_KEYS[key], data[key])
      }
    })
    persisted.current = data
  }, [data])

  useEffect(() => {
    persist('actingUser', actingUserId)
  }, [actingUserId])

  const currentUser =
    data.userPermissions.find(user => user.userId === actingUserId) ?? data.userPermissions[0]

  const actor = () => {
    const users = db.current.userPermissions
    return users.find(user => user.userId === actingRef.current) ?? users[0]
  }

  const can = (module: ModuleKey, action: keyof ActionPermissions) =>
    Boolean(actor()?.permissions[module]?.[action])

  const hasPermission = (module: ModuleKey, action: keyof ActionPermissions) =>
    Boolean(currentUser?.permissions[module]?.[action])

  const setCurrentUserId = (userId: string) => {
    actingRef.current = userId
    setActingUserId(userId)
  }

  const addToast = (message: string, type: ToastMessage['type'] = 'success') => {
    const toast = { id: newId('toast'), message, type }
    setToasts(prev => [...prev, toast])
    setTimeout(() => setToasts(prev => prev.filter(item => item.id !== toast.id)), 4500)
  }

  const removeToast = (toastId: string) => setToasts(prev => prev.filter(item => item.id !== toastId))

  const setActiveModule = (module: ActiveModule) => {
    setActiveModuleState(module)
    setFocusRecordId('')
    setMobileNavOpen(false)
  }

  const openRecord = (module: ActiveModule, recordId: string) => {
    setActiveModuleState(module)
    setFocusRecordId(recordId)
    setMobileNavOpen(false)
  }

  const auditEntry = (input: AuditInput): AuditEntry => {
    const user = actor()
    return {
      ...input,
      id: newId('audit'),
      at: new Date().toISOString(),
      userId: user?.userId ?? 'unknown',
      userName: user?.userName ?? 'Unknown user'
    }
  }

  /** Commit a patch plus its audit entries in one update. The audit log is only ever prepended to. */
  const commit = (patch: Partial<Collections>, ...entries: AuditInput[]) => {
    const next: Collections = { ...db.current, ...patch }
    if (entries.length) {
      next.auditLog = [...entries.map(auditEntry), ...db.current.auditLog]
    }
    db.current = next
    setData(next)
  }

  const logBlocked = (entityType: string, entityId: string, entityLabel: string, reason: string) => {
    commit({}, { action: 'blocked', entityType, entityId, entityLabel, reason })
    addToast(reason, 'error')
  }

  const permitted = (module: ModuleKey, action: keyof ActionPermissions) => {
    if (can(module, action)) return true
    addToast('Your role does not allow this action.', 'error')
    return false
  }

  /**
   * A work package's part and phase, resolved from the CURRENT section and part (sections and parts can move),
   * falling back to what was stored on the work package.
   */
  const lineageOf = (state: Collections, task: Task): Task => {
    const section = state.sections.find(item => item.id === task.sectionId)
    const partId = section ? section.partId || undefined : task.partId
    const phaseId =
      state.parts.find(item => item.id === partId)?.phaseId || section?.phaseId || (section ? undefined : task.phaseId)
    return { ...task, partId, phaseId }
  }

  /** PRs, POs or a pending budget revision under any work package matching `match`. */
  const hasFinancialRecordsIn = (state: Collections, match: (task: Task) => boolean) => {
    const taskIds = new Set(state.tasks.filter(task => match(lineageOf(state, task))).map(task => task.id))
    if (!taskIds.size) return false
    return (
      state.subWorks.some(po => taskIds.has(po.taskId)) ||
      state.purchaseRequisitions.some(pr => taskIds.has(pr.taskId)) ||
      state.budgetRevisions.some(revision => revision.status === 'Pending' && taskIds.has(revision.taskId))
    )
  }

  /** Everything below a set of sections: their work packages and milestones. */
  const withoutSections = (state: Collections, sectionIds: Set<string>): Partial<Collections> => ({
    tasks: state.tasks.filter(task => !sectionIds.has(task.sectionId)),
    milestones: state.milestones.filter(item => !sectionIds.has(item.sectionId))
  })

  const hasFinancialRecords = (match: (task: Task) => boolean) => hasFinancialRecordsIn(data, match)

  // ---------- Generic CRUD for records without financial rules ----------
  type SimpleKey =
    | 'projects'
    | 'phases'
    | 'parts'
    | 'sections'
    | 'milestones'
    | 'teamMembers'
    | 'dprRecords'
    | 'documents'
    | 'roles'

  function crud<K extends SimpleKey>(
    key: K,
    module: ModuleKey,
    entityType: string,
    labelOf: (record: Collections[K][number]) => string
  ) {
    type Item = Collections[K][number]
    return {
      add: (value: Omit<Item, 'id'>) => {
        if (!permitted(module, 'create')) return
        const record = { ...value, id: newId(key) } as Item
        const list = db.current[key] as Item[]
        commit({ [key]: [record, ...list] } as Partial<Collections>, {
          action: 'create',
          entityType,
          entityId: record.id,
          entityLabel: labelOf(record)
        })
        addToast(`${entityType} "${labelOf(record)}" created.`)
      },
      update: (recordId: string, updates: Partial<Item>) => {
        if (!permitted(module, 'edit')) return
        const list = db.current[key] as Item[]
        const current = list.find(item => item.id === recordId)
        if (!current) return
        const next = { ...current, ...defined(updates), id: current.id } as Item
        const change = describeChanges(current, next)
        if (!change) return
        commit(
          { [key]: list.map(item => (item.id === recordId ? next : item)) } as Partial<Collections>,
          { action: 'update', entityType, entityId: recordId, entityLabel: labelOf(next), ...change }
        )
        addToast(`${entityType} "${labelOf(next)}" updated.`)
      },
      /** Removes the record plus anything returned by `cascade`, all audited. */
      remove: (recordId: string, cascade?: (state: Collections) => Partial<Collections>) => {
        if (!permitted(module, 'delete')) return
        const list = db.current[key] as Item[]
        const current = list.find(item => item.id === recordId)
        if (!current) return
        const extra = cascade ? cascade(db.current) : {}
        commit(
          { ...extra, [key]: list.filter(item => item.id !== recordId) } as Partial<Collections>,
          { action: 'delete', entityType, entityId: recordId, entityLabel: labelOf(current) }
        )
        addToast(`${entityType} "${labelOf(current)}" deleted.`, 'warning')
      }
    }
  }

  const project = crud('projects', 'planning', 'Project', item => `${item.code} ${item.name}`)
  const phase = crud('phases', 'planning', 'Phase', item => `${item.wbsNumber} ${item.name}`)
  const part = crud('parts', 'planning', 'Part', item => `${item.wbsNumber} ${item.name}`)
  const section = crud('sections', 'planning', 'Section', item => `${item.wbsNumber} ${item.name}`)
  const milestone = crud('milestones', 'planning', 'Milestone', item => `${item.wbsNumber} ${item.name}`)
  const team = crud('teamMembers', 'operation', 'Team member', item => item.name)
  const dpr = crud('dprRecords', 'operation', 'DPR', item => `DPR ${item.reportDate}`)
  const document = crud('documents', 'document', 'Document', item => item.name)
  const role = crud('roles', 'access', 'Role', item => item.name)

  /** Refuse deleting WBS records that carry PRs or POs: financial history is never erased. */
  const guardedRemove = (
    remove: (id: string, cascade?: (state: Collections) => Partial<Collections>) => void,
    recordId: string,
    match: (task: Task) => boolean,
    cascade?: (state: Collections) => Partial<Collections>
  ) => {
    if (hasFinancialRecordsIn(db.current, match)) {
      addToast('This record has PRs or POs under it, so it cannot be deleted.', 'warning')
      return
    }
    remove(recordId, cascade)
  }

  const deleteProject = (projectId: string) => {
    const inProject = <T extends { projectId: string }>(items: T[]) =>
      items.filter(item => item.projectId !== projectId)
    if (
      db.current.purchaseRequisitions.some(pr => pr.projectId === projectId) ||
      db.current.subWorks.some(po => po.projectId === projectId) ||
      hasFinancialRecordsIn(db.current, task => task.projectId === projectId)
    ) {
      addToast('This project has PRs, POs or a pending revision, so it cannot be deleted.', 'warning')
      return
    }
    project.remove(projectId, state => ({
      phases: inProject(state.phases),
      parts: inProject(state.parts),
      sections: inProject(state.sections),
      milestones: inProject(state.milestones),
      tasks: inProject(state.tasks),
      teamMembers: inProject(state.teamMembers),
      dprRecords: inProject(state.dprRecords),
      documents: inProject(state.documents)
    }))
  }

  // ---------- Work packages (budget lines) ----------
  const addTask = (value: New<Task>) => {
    if (!permitted('planning', 'create')) return false
    const sectionOk = db.current.sections.some(
      item => item.id === value.sectionId && item.projectId === value.projectId
    )
    if (!sectionOk) {
      addToast('Choose a section in the selected project.', 'error')
      return false
    }
    const budgetAmount = Math.round(Number(value.budgetAmount) || 0)
    if (budgetAmount <= 0) {
      addToast('Enter a budget above zero.', 'error')
      return false
    }
    const record: Task = lineageOf(db.current, { ...value, budgetAmount, id: newId('task') })
    commit(
      { tasks: [record, ...db.current.tasks] },
      {
        action: 'create',
        entityType: 'Work package',
        entityId: record.id,
        entityLabel: `${record.wbsNumber} ${record.name}`,
        after: `budgetAmount: ${formatINR(budgetAmount)}`
      }
    )
    addToast(`Work package "${record.name}" created.`)
    return true
  }

  const updateTask = (taskId: string, updates: Partial<Task>) => {
    if (!permitted('planning', 'edit')) return false
    const current = db.current.tasks.find(task => task.id === taskId)
    if (!current) return false
    const locked = hasFinancialRecordsIn(db.current, task => task.id === taskId)
    const next: Task = {
      ...current,
      ...defined(updates),
      id: current.id,
      budgetAmount:
        updates.budgetAmount === undefined
          ? current.budgetAmount
          : Math.round(Number(updates.budgetAmount) || 0)
    }
    if (locked && next.budgetAmount !== current.budgetAmount) {
      logBlocked(
        'Work package',
        taskId,
        current.name,
        'This work package has PRs, POs or a pending revision. Change its budget through a budget revision.'
      )
      return false
    }
    if (locked && (next.projectId !== current.projectId || next.sectionId !== current.sectionId)) {
      addToast('A work package with PRs or POs cannot move to another project or section.', 'error')
      return false
    }
    if (next.sectionId !== current.sectionId) {
      const moved = lineageOf(db.current, { ...next, partId: undefined, phaseId: undefined })
      next.partId = moved.partId
      next.phaseId = moved.phaseId
    }
    const change = describeChanges(current, next)
    if (!change) return true
    commit(
      { tasks: db.current.tasks.map(task => (task.id === taskId ? next : task)) },
      {
        action: 'update',
        entityType: 'Work package',
        entityId: taskId,
        entityLabel: `${next.wbsNumber} ${next.name}`,
        ...change
      }
    )
    addToast(`Work package "${next.name}" updated.`)
    return true
  }

  const deleteTask = (taskId: string) => {
    if (!permitted('planning', 'delete')) return
    const current = db.current.tasks.find(task => task.id === taskId)
    if (!current) return
    if (hasFinancialRecordsIn(db.current, task => task.id === taskId)) {
      addToast('This work package has PRs or POs, so it cannot be deleted.', 'warning')
      return
    }
    commit(
      { tasks: db.current.tasks.filter(task => task.id !== taskId) },
      {
        action: 'delete',
        entityType: 'Work package',
        entityId: taskId,
        entityLabel: `${current.wbsNumber} ${current.name}`
      }
    )
    addToast(`Work package "${current.name}" deleted.`, 'warning')
  }

  // ---------- Purchase orders (sub-works) ----------
  const addSubWork = (value: New<SubWork>) => {
    if (!permitted('planning', 'create')) return false
    const task = db.current.tasks.find(item => item.id === value.taskId)
    if (!task || task.projectId !== value.projectId) {
      addToast('Choose a valid work package in the selected project.', 'error')
      return false
    }
    const pr = db.current.purchaseRequisitions.find(item => item.id === value.prId)
    const poValueGst = Math.round(Number(value.poValueGst) || 0)
    const check = canCreatePo(task, pr, poValueGst, db.current.subWorks, db.current.purchaseRequisitions)
    if (!check.ok) {
      logBlocked('PO', value.poNumber || task.id, value.poNumber || task.name, check.reason ?? 'Blocked')
      return false
    }
    const record: SubWork = {
      ...value,
      poValueGst,
      sectionId: task.sectionId,
      phaseId: task.phaseId,
      partId: task.partId,
      milestoneId: task.milestoneId,
      status: value.status === 'Cancelled' ? 'PO Issued' : value.status,
      id: newId('po')
    }
    commit(
      {
        subWorks: [record, ...db.current.subWorks],
        purchaseRequisitions: db.current.purchaseRequisitions.map(item =>
          item.id === pr!.id ? { ...item, status: 'Converted to PO', subWorkId: record.id } : item
        )
      },
      {
        action: 'create',
        entityType: 'PO',
        entityId: record.id,
        entityLabel: record.poNumber,
        after: `poValueGst: ${formatINR(poValueGst)}; from ${pr!.prNumber}`
      }
    )
    addToast(`PO ${record.poNumber} created from ${pr!.prNumber}.`)
    return true
  }

  const updateSubWork = (poId: string, updates: Partial<SubWork>) => {
    const current = db.current.subWorks.find(po => po.id === poId)
    if (!current) return false
    // Receipt, invoice and payment details belong to finance; the rest of the order to planning.
    // Blank and missing count as the same value, so untouched empty fields are not "changes".
    const changed = (Object.keys(defined(updates)) as (keyof SubWork)[]).filter(
      key => JSON.stringify(current[key] ?? '') !== JSON.stringify(updates[key] ?? '')
    )
    const settledStatus = (status?: string) => status === 'Billed' || status === 'Paid'
    const paymentChange = changed.some(
      key =>
        PAYMENT_FIELDS.has(key) &&
        (key !== 'status' || settledStatus(updates.status) || settledStatus(current.status))
    )
    if (!changed.length) return true
    const statusIsPayment = settledStatus(updates.status) || settledStatus(current.status)
    const orderChange = changed.some(key => !PAYMENT_FIELDS.has(key) || (key === 'status' && !statusIsPayment))
    if (orderChange && !permitted('planning', 'edit')) return false
    if (paymentChange && !permitted('finance', 'edit')) return false
    if (current.status === 'Cancelled') {
      addToast('A cancelled PO cannot be edited.', 'error')
      return false
    }
    if (updates.status === 'Cancelled') {
      addToast('Use Cancel PO and give a reason.', 'error')
      return false
    }
    // The links that tie a PO to its budget line and PR never change after creation.
    const next: SubWork = {
      ...current,
      ...defined(updates),
      id: current.id,
      projectId: current.projectId,
      taskId: current.taskId,
      sectionId: current.sectionId,
      phaseId: current.phaseId,
      partId: current.partId,
      milestoneId: current.milestoneId,
      prId: current.prId,
      poValueGst:
        updates.poValueGst === undefined ? current.poValueGst : Math.round(Number(updates.poValueGst) || 0)
    }
    if (isSettled(current) && !isSettled(next)) {
      logBlocked('PO', poId, current.poNumber, 'A billed, invoiced or paid PO cannot be reopened.')
      return false
    }
    if (next.poValueGst !== current.poValueGst) {
      const task = db.current.tasks.find(item => item.id === current.taskId)
      const check = task
        ? canEditPo(task, current, next.poValueGst, db.current.subWorks, db.current.purchaseRequisitions)
        : { ok: false, reason: 'The work package for this PO no longer exists.' }
      if (!check.ok) {
        logBlocked('PO', poId, current.poNumber, check.reason ?? 'Blocked')
        return false
      }
    }
    const change = describeChanges(current, next)
    if (!change) return true
    commit(
      { subWorks: db.current.subWorks.map(po => (po.id === poId ? next : po)) },
      { action: 'update', entityType: 'PO', entityId: poId, entityLabel: next.poNumber, ...change }
    )
    addToast(`PO ${next.poNumber} updated.`)
    return true
  }

  const cancelSubWork = (poId: string, reason: string) => {
    if (!permitted('planning', 'delete')) return
    const current = db.current.subWorks.find(po => po.id === poId)
    if (!current) return
    const check = canCancelPo(current)
    if (!check.ok) {
      logBlocked('PO', poId, current.poNumber, check.reason ?? 'Blocked')
      return
    }
    if (!reason.trim()) {
      addToast('Give a reason for cancelling the PO.', 'error')
      return
    }
    commit(
      {
        subWorks: db.current.subWorks.map(po =>
          po.id === poId ? { ...po, status: 'Cancelled', cancellationReason: reason.trim() } : po
        )
      },
      {
        action: 'update',
        entityType: 'PO',
        entityId: poId,
        entityLabel: current.poNumber,
        before: `status: ${current.status}`,
        after: 'status: Cancelled',
        reason: reason.trim()
      }
    )
    addToast(`PO ${current.poNumber} cancelled. ${formatINR(current.poValueGst)} is back on the budget line.`, 'warning')
  }

  // ---------- Purchase requisitions ----------
  const raisePr = (
    value: Omit<PurchaseRequisition, 'id' | 'prNumber' | 'requestedAt' | 'requestedBy' | 'status'>
  ) => {
    if (!permitted('planning', 'create')) return false
    const task = db.current.tasks.find(item => item.id === value.taskId)
    if (!task || task.projectId !== value.projectId) {
      addToast('Choose a work package in the selected project.', 'error')
      return false
    }
    const amount = Math.round(Number(value.amount) || 0)
    const check = canRaisePr(task, amount, value.purpose, db.current.subWorks, db.current.purchaseRequisitions)
    if (!check.ok) {
      logBlocked('PR', task.id, `${task.wbsNumber} ${task.name}`, `${check.reason} (requested ${formatINR(amount)})`)
      return false
    }
    const year = new Date().getFullYear()
    const sameYear = db.current.purchaseRequisitions.filter(pr => pr.prNumber.startsWith(`PR-${year}-`))
    const record: PurchaseRequisition = {
      ...value,
      purpose: value.purpose.trim(),
      amount,
      id: newId('pr'),
      prNumber: `PR-${year}-${String(sameYear.length + 1).padStart(4, '0')}`,
      requestedAt: new Date().toISOString(),
      requestedBy: actor().userId,
      status: 'Pending Approval'
    }
    commit(
      { purchaseRequisitions: [record, ...db.current.purchaseRequisitions] },
      {
        action: 'create',
        entityType: 'PR',
        entityId: record.id,
        entityLabel: record.prNumber,
        after: `amount: ${formatINR(amount)}; work package: ${task.name}`,
        reason: record.purpose
      }
    )
    addToast(`${record.prNumber} raised for ${formatINR(amount)}. It now waits for approval.`)
    return true
  }

  const decidePr = (prId: string, approve: boolean, reason = '') => {
    const pr = db.current.purchaseRequisitions.find(item => item.id === prId)
    if (!pr) return false
    if (pr.status !== 'Pending Approval') {
      addToast(`${pr.prNumber} is already ${pr.status.toLowerCase()}.`, 'error')
      return false
    }
    const check = canApprove(pr, actor().userId, can('finance', 'approve'))
    if (!check.ok) {
      addToast(check.reason ?? 'Not allowed.', 'error')
      return false
    }
    if (!approve && !reason.trim()) {
      addToast('Give a reason for rejecting the PR.', 'error')
      return false
    }
    const now = new Date().toISOString()
    commit(
      {
        purchaseRequisitions: db.current.purchaseRequisitions.map(item =>
          item.id === prId
            ? {
                ...item,
                status: approve ? 'Approved' : 'Rejected',
                approvedBy: actor().userId,
                approvedAt: now,
                rejectionReason: approve ? undefined : reason.trim()
              }
            : item
        )
      },
      {
        action: approve ? 'approve' : 'reject',
        entityType: 'PR',
        entityId: prId,
        entityLabel: pr.prNumber,
        before: 'status: Pending Approval',
        after: `status: ${approve ? 'Approved' : 'Rejected'}`,
        reason: reason.trim() || undefined
      }
    )
    addToast(`${pr.prNumber} ${approve ? 'approved' : 'rejected'}.`, approve ? 'success' : 'warning')
    return true
  }

  const cancelPr = (prId: string, reason: string) => {
    if (!permitted('planning', 'create')) return false
    const pr = db.current.purchaseRequisitions.find(item => item.id === prId)
    if (!pr) return false
    if (pr.requestedBy !== actor().userId) {
      addToast('Only the person who raised the PR can cancel it.', 'error')
      return false
    }
    if (pr.status !== 'Pending Approval' && pr.status !== 'Approved') {
      addToast(`${pr.prNumber} is ${pr.status.toLowerCase()} and cannot be cancelled.`, 'error')
      return false
    }
    if (!reason.trim()) {
      addToast('Give a reason for cancelling the PR.', 'error')
      return false
    }
    commit(
      {
        purchaseRequisitions: db.current.purchaseRequisitions.map(item =>
          item.id === prId ? { ...item, status: 'Cancelled', rejectionReason: reason.trim() } : item
        )
      },
      {
        action: 'update',
        entityType: 'PR',
        entityId: prId,
        entityLabel: pr.prNumber,
        before: `status: ${pr.status}`,
        after: 'status: Cancelled',
        reason: reason.trim()
      }
    )
    addToast(`${pr.prNumber} cancelled.`, 'warning')
    return true
  }

  // ---------- Budget revisions ----------
  const requestBudgetRevision = (taskId: string, newBudget: number, reason: string) => {
    if (!permitted('planning', 'create')) return false
    const task = db.current.tasks.find(item => item.id === taskId)
    if (!task) return false
    const target = Math.round(Number(newBudget) || 0)
    if (target <= task.budgetAmount) {
      addToast(`The new ceiling must be above the current ${formatINR(task.budgetAmount)}.`, 'error')
      return false
    }
    if (!reason.trim()) {
      addToast('Give a reason for the budget revision.', 'error')
      return false
    }
    if (db.current.budgetRevisions.some(item => item.taskId === taskId && item.status === 'Pending')) {
      addToast('A revision for this work package is already waiting for approval.', 'error')
      return false
    }
    const record: BudgetRevision = {
      id: newId('revision'),
      taskId,
      oldBudget: task.budgetAmount,
      newBudget: target,
      reason: reason.trim(),
      requestedBy: actor().userId,
      requestedAt: new Date().toISOString(),
      status: 'Pending'
    }
    commit(
      { budgetRevisions: [record, ...db.current.budgetRevisions] },
      {
        action: 'request',
        entityType: 'Budget revision',
        entityId: record.id,
        entityLabel: `${task.wbsNumber} ${task.name}`,
        before: `budgetAmount: ${formatINR(task.budgetAmount)}`,
        after: `budgetAmount: ${formatINR(target)}`,
        reason: record.reason
      }
    )
    addToast('Budget revision sent for approval.')
    return true
  }

  const decideBudgetRevision = (revisionId: string, approve: boolean, note = '') => {
    const revision = db.current.budgetRevisions.find(item => item.id === revisionId)
    if (!revision) return false
    if (revision.status !== 'Pending') {
      addToast(`This revision is already ${revision.status.toLowerCase()}.`, 'error')
      return false
    }
    const check = canApprove(revision, actor().userId, can('finance', 'approve'))
    if (!check.ok) {
      addToast(check.reason ?? 'Not allowed.', 'error')
      return false
    }
    if (!approve && !note.trim()) {
      addToast('Give a reason for rejecting the revision.', 'error')
      return false
    }
    const task = db.current.tasks.find(item => item.id === revision.taskId)
    if (approve) {
      if (!task) {
        addToast('The work package for this revision no longer exists. Reject it instead.', 'error')
        return false
      }
      if (task.budgetAmount !== revision.oldBudget) {
        addToast(
          `The budget changed to ${formatINR(task.budgetAmount)} after this request. Reject it and ask for a new one.`,
          'error'
        )
        return false
      }
      const reserved = committed(task.id, db.current.subWorks) + openPr(task.id, db.current.purchaseRequisitions)
      if (revision.newBudget < reserved) {
        addToast(`The new ceiling is below the ${formatINR(reserved)} already committed and reserved.`, 'error')
        return false
      }
    }
    const now = new Date().toISOString()
    commit(
      {
        budgetRevisions: db.current.budgetRevisions.map(item =>
          item.id === revisionId
            ? {
                ...item,
                status: approve ? 'Approved' : 'Rejected',
                decidedBy: actor().userId,
                decidedAt: now,
                decisionNote: note.trim() || undefined
              }
            : item
        ),
        tasks: approve
          ? db.current.tasks.map(item =>
              item.id === revision.taskId ? { ...item, budgetAmount: revision.newBudget } : item
            )
          : db.current.tasks
      },
      {
        action: approve ? 'approve' : 'reject',
        entityType: 'Budget revision',
        entityId: revisionId,
        entityLabel: task ? `${task.wbsNumber} ${task.name}` : revision.taskId,
        before: `budgetAmount: ${formatINR(revision.oldBudget)}`,
        after: approve ? `budgetAmount: ${formatINR(revision.newBudget)}` : 'unchanged',
        reason: note.trim() || undefined
      }
    )
    addToast(approve ? 'Budget revision approved. The new ceiling applies now.' : 'Budget revision rejected.', approve ? 'success' : 'warning')
    return true
  }

  // ---------- Users and permissions ----------
  const addUser: CapexContextType['addUser'] = value => {
    if (!permitted('access', 'create')) return
    const record: UserPermission = {
      ...value,
      userId: newId('user'),
      avatar: value.userName
        .split(' ')
        .map(word => word[0])
        .join('')
        .slice(0, 2)
        .toUpperCase(),
      permissions: value.permissions ?? getDefaultPermissionsForRole(value.role)
    }
    commit(
      { userPermissions: [...db.current.userPermissions, record] },
      { action: 'create', entityType: 'User', entityId: record.userId, entityLabel: record.userName, after: `role: ${record.role}` }
    )
    addToast(`User "${record.userName}" added.`)
  }

  const updateUser = (userId: string, updates: Partial<UserPermission>) => {
    if (!permitted('access', 'edit')) return
    const current = db.current.userPermissions.find(user => user.userId === userId)
    if (!current) return
    if (userId === actingRef.current && ((updates.role && updates.role !== current.role) || updates.permissions)) {
      addToast('You cannot change your own role or permissions.', 'error')
      return
    }
    const next: UserPermission = { ...current, ...defined(updates), userId: current.userId }
    if (updates.role && updates.role !== current.role && !updates.permissions) {
      next.permissions = getDefaultPermissionsForRole(updates.role)
    }
    const change = describeChanges(current, next)
    if (!change) return
    commit(
      { userPermissions: db.current.userPermissions.map(user => (user.userId === userId ? next : user)) },
      { action: 'update', entityType: 'User', entityId: userId, entityLabel: next.userName, ...change }
    )
    addToast(`User "${next.userName}" updated.`)
  }

  const deleteUser = (userId: string) => {
    if (!permitted('access', 'delete')) return
    const current = db.current.userPermissions.find(user => user.userId === userId)
    if (!current) return
    if (userId === actingRef.current) {
      addToast('You cannot delete the user you are acting as.', 'error')
      return
    }
    commit(
      { userPermissions: db.current.userPermissions.filter(user => user.userId !== userId) },
      { action: 'delete', entityType: 'User', entityId: userId, entityLabel: current.userName }
    )
    addToast(`User "${current.userName}" removed.`, 'warning')
  }

  const toggleUserPermission = (userId: string, module: ModuleKey, action: keyof ActionPermissions) => {
    if (!permitted('access', 'edit')) return
    if (userId === actingRef.current) {
      addToast('You cannot change your own permissions.', 'error')
      return
    }
    const current = db.current.userPermissions.find(user => user.userId === userId)
    if (!current) return
    const value = !current.permissions[module][action]
    const next: UserPermission = {
      ...current,
      permissions: { ...current.permissions, [module]: { ...current.permissions[module], [action]: value } }
    }
    commit(
      { userPermissions: db.current.userPermissions.map(user => (user.userId === userId ? next : user)) },
      {
        action: 'update',
        entityType: 'Permission',
        entityId: userId,
        entityLabel: current.userName,
        before: `${module}.${action}: ${!value ? 'on' : 'off'}`,
        after: `${module}.${action}: ${value ? 'on' : 'off'}`
      }
    )
  }

  // ---------- Derived data ----------
  const projects = useMemo(
    () =>
      data.projects.map(item => {
        const poValue = data.subWorks
          .filter(po => po.projectId === item.id)
          .reduce((sum, po) => sum + (po.status === 'Cancelled' ? 0 : Math.round(po.poValueGst)), 0)
        return { ...item, poValue, balanceAmount: Math.round(item.approvedAmount) - poValue }
      }),
    [data.projects, data.subWorks]
  )

  const byProject = <T extends { projectId: string }>(items: T[]) =>
    selectedProjectId === 'all' ? items : items.filter(item => item.projectId === selectedProjectId)

  const value: CapexContextType = {
    ...data,
    projects,
    activeModule,
    setActiveModule,
    focusRecordId,
    openRecord,
    selectedProjectId,
    setSelectedProjectId,
    sidebarCollapsed,
    setSidebarCollapsed,
    mobileNavOpen,
    setMobileNavOpen,
    currentUser,
    setCurrentUserId,
    hasPermission,
    filteredPhases: byProject(data.phases),
    filteredParts: byProject(data.parts),
    filteredSections: byProject(data.sections),
    filteredMilestones: byProject(data.milestones),
    filteredTasks: byProject(data.tasks),
    filteredSubWorks: byProject(data.subWorks),
    filteredTeam: byProject(data.teamMembers),
    filteredDpr: byProject(data.dprRecords),
    filteredDocuments: byProject(data.documents),
    filteredPrs: byProject(data.purchaseRequisitions),
    addProject: value => project.add({ ...value, poValue: 0, balanceAmount: Math.round(value.approvedAmount) }),
    updateProject: project.update,
    deleteProject,
    addPhase: phase.add,
    updatePhase: phase.update,
    deletePhase: phaseId =>
      guardedRemove(phase.remove, phaseId, task => task.phaseId === phaseId, state => {
        const partIds = new Set(state.parts.filter(item => item.phaseId === phaseId).map(item => item.id))
        const sectionIds = new Set(
          state.sections
            // Same rule as lineageOf: a section's part decides its phase; section.phaseId only counts without a part.
            .filter(item => (item.partId ? partIds.has(item.partId) : item.phaseId === phaseId))
            .map(item => item.id)
        )
        return {
          parts: state.parts.filter(item => !partIds.has(item.id)),
          sections: state.sections.filter(item => !sectionIds.has(item.id)),
          ...withoutSections(state, sectionIds)
        }
      }),
    addPart: part.add,
    updatePart: part.update,
    deletePart: partId =>
      guardedRemove(part.remove, partId, task => task.partId === partId, state => {
        const sectionIds = new Set(state.sections.filter(item => item.partId === partId).map(item => item.id))
        return {
          sections: state.sections.filter(item => !sectionIds.has(item.id)),
          ...withoutSections(state, sectionIds)
        }
      }),
    addSection: section.add,
    updateSection: section.update,
    deleteSection: sectionId =>
      guardedRemove(section.remove, sectionId, task => task.sectionId === sectionId, state =>
        withoutSections(state, new Set([sectionId]))
      ),
    addMilestone: milestone.add,
    updateMilestone: milestone.update,
    deleteMilestone: milestoneId =>
      guardedRemove(milestone.remove, milestoneId, task => task.milestoneId === milestoneId),
    addTask,
    updateTask,
    deleteTask,
    addSubWork,
    updateSubWork,
    cancelSubWork,
    addTeamMember: team.add,
    updateTeamMember: team.update,
    deleteTeamMember: memberId => team.remove(memberId),
    addDprRecord: dpr.add,
    updateDprRecord: dpr.update,
    deleteDprRecord: recordId => dpr.remove(recordId),
    addDocument: value => document.add({ ...value, uploadDate: new Date().toISOString().slice(0, 10) }),
    updateDocument: document.update,
    deleteDocument: documentId => document.remove(documentId),
    addUser,
    updateUser,
    deleteUser,
    toggleUserPermission,
    updateRole: role.update,
    raisePr,
    decidePr,
    cancelPr,
    requestBudgetRevision,
    decideBudgetRevision,
    hasFinancialRecords,
    toasts,
    addToast,
    removeToast
  }

  return <CapexContext.Provider value={value}>{children}</CapexContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useCapex() {
  const context = useContext(CapexContext)
  if (!context) throw new Error('useCapex must be used inside CapexProvider')
  return context
}
