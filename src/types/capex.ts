export type ProjectStatus = 'Planning' | 'Approved' | 'Active' | 'Under Review' | 'Completed' | 'Delayed'

export type MilestoneStatus = 'Not Started' | 'In Progress' | 'Completed' | 'Delayed'

export type TaskStatus = 'Pending' | 'In Progress' | 'Completed' | 'Blocked'

export type SubWorkStatus = 'PO Issued' | 'In Execution' | 'Billed' | 'Paid' | 'Cancelled'

export type DprStatus = 'Submitted' | 'Verified' | 'Approved'

export type DocumentCategory = 
  | 'Approval Note' 
  | 'Vendor Contract' 
  | 'PO Copy' 
  | 'Technical Drawing' 
  | 'Invoice' 
  | 'Inspection Report'

export interface Project {
  id: string
  code: string
  name: string
  approvedAmount: number // CAPEX Project Approved Amount (₹)
  approvedDate: string // YYYY-MM-DD
  startDate?: string // Project Start Date (YYYY-MM-DD)
  endDate: string // YYYY-MM-DD
  executionTimeline: string // e.g. "18 Months"
  estimatedCost: number // ₹
  poValue: number // ₹ (Total PO commitments)
  balanceAmount: number // ₹ (Approved Amount - PO Value)
  status: ProjectStatus
  location: string
  description: string
}

export interface ProjectPhase {
  id: string
  projectId: string
  wbsNumber: string // e.g. "1.1", "1.2"
  name: string // e.g. "Phase I", "Phase II"
  budgetAmount: number // Allocated budget (₹), e.g. 1350000000 (135 Cr)
  capexApprovalDate: string // YYYY-MM-DD
  startDate?: string
  endDate?: string
  status: ProjectStatus
  description?: string
}

export interface ProjectPart {
  id: string
  projectId: string
  phaseId: string
  wbsNumber: string // e.g. "1.1.1", "1.1.2"
  name: string // e.g. "Part 1", "Part II"
  budgetAmount: number // Allocated budget (₹), e.g. 1000000000 (100 Cr)
  status: ProjectStatus
  description?: string
}

export interface Section {
  id: string
  projectId: string
  phaseId?: string
  partId?: string
  wbsNumber: string // e.g., "1.1.1.1" or "1.1"
  name: string // e.g., "Civil", "MEP", "Winding"
  description?: string
}

export interface Milestone {
  id: string
  projectId: string
  phaseId?: string
  partId?: string
  sectionId: string
  wbsNumber: string // e.g. "1.1.1"
  name: string // Milestone Name
  startDate: string
  targetDate: string
  status: MilestoneStatus
  progress: number // 0 to 100
}

export interface Task {
  id: string
  projectId: string
  phaseId?: string
  partId?: string
  sectionId: string
  milestoneId?: string
  wbsNumber: string // e.g., "1.1.1.1"
  name: string // Task Name
  startDate: string
  targetDate: string
  status: TaskStatus
  progress: number // 0 to 100
}

export interface SubWork {
  id: string
  projectId: string
  phaseId?: string
  partId?: string
  sectionId: string
  milestoneId?: string
  taskId: string
  wbsNumber: string // e.g., "1.1.1.1.1"
  workDescription: string
  supplierName: string
  bpCode: string // Business Partner Code
  targetDate: string
  poNumber: string
  poValueGst: number // PO Value + GST (₹)
  paidDate: string // YYYY-MM-DD or empty
  status: SubWorkStatus
}

export interface TeamMember {
  id: string
  name: string
  role: string
  email: string
  phone: string
  projectId: string
  workItems: string[]
  status: 'Active' | 'On Leave'
}

export interface DprRecord {
  id: string
  reportDate: string
  projectId: string
  taskId: string
  dailyProgress: number // percentage
  workDoneToday: string
  manpowerCount: number
  equipmentDeployed: string
  hindrances: string
  submittedBy: string
  status: DprStatus
}

export interface ProjectDocument {
  id: string
  name: string
  projectId: string
  wbsRecordId?: string
  wbsType: 'Project' | 'Section' | 'Milestone' | 'Task' | 'Sub-work'
  category: DocumentCategory
  fileSize: string
  fileType: string
  uploadDate: string
  uploadedBy: string
  status: 'Approved' | 'Under Review' | 'Draft'
  url?: string
}

export type ModuleKey = 
  | 'dashboard'
  | 'planning'
  | 'operation'
  | 'finance'
  | 'document'
  | 'access'

export interface ActionPermissions {
  view: boolean
  create: boolean
  edit: boolean
  delete: boolean
  export: boolean
  approve: boolean
}

export type AppRole = 'Admin' | 'Viewer' | 'CAPEX Admin'

export interface UserPermission {
  userId: string
  userName: string
  userEmail: string
  password?: string
  role: AppRole | string
  department: string
  avatar: string
  status: 'Active' | 'Inactive'
  permissions: {
    dashboard: ActionPermissions
    planning: ActionPermissions
    operation: ActionPermissions
    finance: ActionPermissions
    document: ActionPermissions
    access: ActionPermissions
  }
}

export interface RoleDefinition {
  id: string
  name: string
  description: string
  userCount: number
  isSystem: boolean
  permissions: {
    dashboard: ActionPermissions
    planning: ActionPermissions
    operation: ActionPermissions
    finance: ActionPermissions
    document: ActionPermissions
    access: ActionPermissions
  }
}

export type ActiveModule = 
  | 'dashboard'
  | 'planning-project'
  | 'planning-wbs'
  | 'planning-phase'
  | 'planning-part'
  | 'planning-milestone'
  | 'planning-task'
  | 'planning-subwork'
  | 'planning-gantt'
  | 'operation-team'
  | 'operation-dpr'
  | 'finance-budget'
  | 'finance-billing'
  | 'document'
  | 'access-matrix'
  | 'access-users'
  | 'access-roles'

/**
 * Return default permission set mapped from role
 */
export function getDefaultPermissionsForRole(role: string): {
  dashboard: ActionPermissions
  planning: ActionPermissions
  operation: ActionPermissions
  finance: ActionPermissions
  document: ActionPermissions
  access: ActionPermissions
} {
  const normalized = role.toLowerCase()

  if (normalized.includes('admin') && !normalized.includes('capex')) {
    // Full Administrator
    const full: ActionPermissions = { view: true, create: true, edit: true, delete: true, export: true, approve: true }
    return {
      dashboard: full,
      planning: full,
      operation: full,
      finance: full,
      document: full,
      access: full
    }
  } else if (normalized.includes('capex')) {
    // CAPEX Admin: Full control over Projects, Planning, Finance, Docs; Execution in Ops; View-only in RBAC
    return {
      dashboard: { view: true, create: true, edit: true, delete: true, export: true, approve: true },
      planning: { view: true, create: true, edit: true, delete: true, export: true, approve: true },
      operation: { view: true, create: true, edit: true, delete: false, export: true, approve: true },
      finance: { view: true, create: true, edit: true, delete: true, export: true, approve: true },
      document: { view: true, create: true, edit: true, delete: false, export: true, approve: true },
      access: { view: true, create: false, edit: false, delete: false, export: false, approve: false }
    }
  } else {
    // Viewer: Read-only access across all modules
    const readOnly: ActionPermissions = { view: true, create: false, edit: false, delete: false, export: true, approve: false }
    return {
      dashboard: readOnly,
      planning: readOnly,
      operation: readOnly,
      finance: readOnly,
      document: readOnly,
      access: { view: false, create: false, edit: false, delete: false, export: false, approve: false }
    }
  }
}
