import type {
  DprRecord,
  Milestone,
  Project,
  ProjectDocument,
  ProjectPart,
  ProjectPhase,
  RoleDefinition,
  Section,
  SubWork,
  Task,
  TeamMember,
  UserPermission
} from '../types/capex'

export const INITIAL_PROJECTS: Project[] = []
export const INITIAL_PHASES: ProjectPhase[] = []
export const INITIAL_PARTS: ProjectPart[] = []
export const INITIAL_SECTIONS: Section[] = []
export const INITIAL_MILESTONES: Milestone[] = []
export const INITIAL_TASKS: Task[] = []
export const INITIAL_SUBWORKS: SubWork[] = []
export const INITIAL_TEAM: TeamMember[] = []
export const INITIAL_DPR: DprRecord[] = []
export const INITIAL_DOCUMENTS: ProjectDocument[] = []

const full = { view: true, create: true, edit: true, delete: true, export: true, approve: true }
const viewer = { view: true, create: false, edit: false, delete: false, export: true, approve: false }
export const INITIAL_ROLES: RoleDefinition[] = [
  {
    id: 'role-admin',
    name: 'Admin',
    description: 'Approves capex requests and manages the workspace.',
    userCount: 1,
    isSystem: true,
    permissions: {
      dashboard: full,
      planning: full,
      operation: full,
      finance: full,
      document: full,
      access: full
    }
  },
  {
    id: 'role-capex',
    name: 'CAPEX Admin',
    description: 'Builds WBS, raises PRs and creates POs.',
    userCount: 1,
    isSystem: true,
    permissions: {
      dashboard: full,
      planning: full,
      operation: full,
      finance: { ...full, approve: false },
      document: full,
      access: viewer
    }
  },
  {
    id: 'role-viewer',
    name: 'Viewer',
    description: 'Read-only audit access.',
    userCount: 1,
    isSystem: true,
    permissions: {
      dashboard: viewer,
      planning: viewer,
      operation: viewer,
      finance: viewer,
      document: viewer,
      access: viewer
    }
  }
]
export const INITIAL_USER_PERMISSIONS: UserPermission[] = [
  {
    userId: 'user-admin',
    userName: 'Management Approver',
    userEmail: 'approver@indotech.local',
    role: 'Admin',
    department: 'Management',
    avatar: 'MA',
    status: 'Active',
    permissions: {
      dashboard: full,
      planning: full,
      operation: full,
      finance: full,
      document: full,
      access: full
    }
  },
  {
    userId: 'user-capex',
    userName: 'Capex Team',
    userEmail: 'capex@indotech.local',
    role: 'CAPEX Admin',
    department: 'Capex',
    avatar: 'CT',
    status: 'Active',
    permissions: {
      dashboard: full,
      planning: full,
      operation: full,
      finance: { ...full, approve: false },
      document: full,
      access: viewer
    }
  },
  {
    userId: 'user-viewer',
    userName: 'Auditor',
    userEmail: 'auditor@indotech.local',
    role: 'Viewer',
    department: 'Audit',
    avatar: 'AU',
    status: 'Active',
    permissions: {
      dashboard: viewer,
      planning: viewer,
      operation: viewer,
      finance: viewer,
      document: viewer,
      access: viewer
    }
  }
]
