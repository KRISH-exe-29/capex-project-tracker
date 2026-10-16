import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react'
import {
  Project,
  ProjectPhase,
  ProjectPart,
  Section,
  Milestone,
  Task,
  SubWork,
  TeamMember,
  DprRecord,
  ProjectDocument,
  UserPermission,
  RoleDefinition,
  ActiveModule,
  ActionPermissions,
  ModuleKey,
  getDefaultPermissionsForRole
} from '../types/capex'
import {
  INITIAL_PROJECTS,
  INITIAL_PHASES,
  INITIAL_PARTS,
  INITIAL_SECTIONS,
  INITIAL_MILESTONES,
  INITIAL_TASKS,
  INITIAL_SUBWORKS,
  INITIAL_TEAM,
  INITIAL_DPR,
  INITIAL_DOCUMENTS,
  INITIAL_ROLES,
  INITIAL_USER_PERMISSIONS
} from '../data/initialData'

interface ToastMessage {
  id: string
  message: string
  type: 'success' | 'warning' | 'error' | 'info'
}

interface CapexContextType {
  // Navigation & Project Filter
  activeModule: ActiveModule
  setActiveModule: (mod: ActiveModule) => void
  selectedProjectId: string // 'all' or project ID
  setSelectedProjectId: (id: string) => void
  sidebarCollapsed: boolean
  setSidebarCollapsed: (collapsed: boolean | ((prev: boolean) => boolean)) => void

  // Data Collections
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
  userPermissions: UserPermission[]
  roles: RoleDefinition[]

  // Filtered Data based on selectedProjectId
  filteredPhases: ProjectPhase[]
  filteredParts: ProjectPart[]
  filteredSections: Section[]
  filteredMilestones: Milestone[]
  filteredTasks: Task[]
  filteredSubWorks: SubWork[]
  filteredTeam: TeamMember[]
  filteredDpr: DprRecord[]
  filteredDocuments: ProjectDocument[]

  // CRUD Operations
  addProject: (project: Omit<Project, 'id' | 'poValue' | 'balanceAmount'>) => void
  updateProject: (id: string, updates: Partial<Project>) => void
  deleteProject: (id: string) => void

  addPhase: (phase: Omit<ProjectPhase, 'id'>) => void
  updatePhase: (id: string, updates: Partial<ProjectPhase>) => void
  deletePhase: (id: string) => void

  addPart: (part: Omit<ProjectPart, 'id'>) => void
  updatePart: (id: string, updates: Partial<ProjectPart>) => void
  deletePart: (id: string) => void

  addSection: (section: Omit<Section, 'id'>) => void
  updateSection: (id: string, updates: Partial<Section>) => void
  deleteSection: (id: string) => void

  addMilestone: (milestone: Omit<Milestone, 'id'>) => void
  updateMilestone: (id: string, updates: Partial<Milestone>) => void
  deleteMilestone: (id: string) => void

  addTask: (task: Omit<Task, 'id'>) => void
  updateTask: (id: string, updates: Partial<Task>) => void
  deleteTask: (id: string) => void

  addSubWork: (subWork: Omit<SubWork, 'id'>) => void
  updateSubWork: (id: string, updates: Partial<SubWork>) => void
  deleteSubWork: (id: string) => void

  addTeamMember: (member: Omit<TeamMember, 'id'>) => void
  updateTeamMember: (id: string, updates: Partial<TeamMember>) => void
  deleteTeamMember: (id: string) => void

  addDprRecord: (dpr: Omit<DprRecord, 'id'>) => void
  updateDprRecord: (id: string, updates: Partial<DprRecord>) => void
  deleteDprRecord: (id: string) => void

  addDocument: (doc: Omit<ProjectDocument, 'id' | 'uploadDate'>) => void
  updateDocument: (id: string, updates: Partial<ProjectDocument>) => void
  deleteDocument: (id: string) => void

  // RBAC & User Operations
  addUser: (user: Omit<UserPermission, 'userId' | 'avatar' | 'permissions'> & { permissions?: UserPermission['permissions'] }) => void
  updateUser: (userId: string, updates: Partial<UserPermission>) => void
  deleteUser: (userId: string) => void
  toggleUserPermission: (userId: string, module: ModuleKey, action: keyof ActionPermissions) => void
  updateRole: (roleId: string, updates: Partial<RoleDefinition>) => void

  // System
  resetToSampleData: () => void
  toasts: ToastMessage[]
  addToast: (message: string, type?: 'success' | 'warning' | 'error' | 'info') => void
  removeToast: (id: string) => void
}

const CapexContext = createContext<CapexContextType | undefined>(undefined)

const STORAGE_PREFIX = 'capex_enterprise_app_'

function getStored<T>(key: string, defaultValue: T): T {
  try {
    const item = localStorage.getItem(STORAGE_PREFIX + key)
    return item ? JSON.parse(item) : defaultValue
  } catch {
    return defaultValue
  }
}

export const CapexProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [activeModule, setActiveModule] = useState<ActiveModule>('dashboard')
  const [selectedProjectId, setSelectedProjectId] = useState<string>('all')
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false)
  const [toasts, setToasts] = useState<ToastMessage[]>([])

  // State collections initialized from localStorage or defaults
  const [projects, setProjects] = useState<Project[]>(() => getStored('projects', INITIAL_PROJECTS))
  const [phases, setPhases] = useState<ProjectPhase[]>(() => getStored('phases', INITIAL_PHASES))
  const [parts, setParts] = useState<ProjectPart[]>(() => getStored('parts', INITIAL_PARTS))
  const [sections, setSections] = useState<Section[]>(() => getStored('sections', INITIAL_SECTIONS))
  const [milestones, setMilestones] = useState<Milestone[]>(() => getStored('milestones', INITIAL_MILESTONES))
  const [tasks, setTasks] = useState<Task[]>(() => getStored('tasks', INITIAL_TASKS))
  const [subWorks, setSubWorks] = useState<SubWork[]>(() => getStored('subworks', INITIAL_SUBWORKS))
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>(() => getStored('team', INITIAL_TEAM))
  const [dprRecords, setDprRecords] = useState<DprRecord[]>(() => getStored('dpr', INITIAL_DPR))
  const [documents, setDocuments] = useState<ProjectDocument[]>(() => getStored('documents', INITIAL_DOCUMENTS))
  const [roles, setRoles] = useState<RoleDefinition[]>(() => getStored('roles', INITIAL_ROLES))
  const [userPermissions, setUserPermissions] = useState<UserPermission[]>(() => getStored('userPermissions', INITIAL_USER_PERMISSIONS))

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_PREFIX + 'projects', JSON.stringify(projects))
  }, [projects])
  useEffect(() => {
    localStorage.setItem(STORAGE_PREFIX + 'phases', JSON.stringify(phases))
  }, [phases])
  useEffect(() => {
    localStorage.setItem(STORAGE_PREFIX + 'parts', JSON.stringify(parts))
  }, [parts])
  useEffect(() => {
    localStorage.setItem(STORAGE_PREFIX + 'sections', JSON.stringify(sections))
  }, [sections])
  useEffect(() => {
    localStorage.setItem(STORAGE_PREFIX + 'milestones', JSON.stringify(milestones))
  }, [milestones])
  useEffect(() => {
    localStorage.setItem(STORAGE_PREFIX + 'tasks', JSON.stringify(tasks))
  }, [tasks])
  useEffect(() => {
    localStorage.setItem(STORAGE_PREFIX + 'subworks', JSON.stringify(subWorks))
  }, [subWorks])
  useEffect(() => {
    localStorage.setItem(STORAGE_PREFIX + 'team', JSON.stringify(teamMembers))
  }, [teamMembers])
  useEffect(() => {
    localStorage.setItem(STORAGE_PREFIX + 'dpr', JSON.stringify(dprRecords))
  }, [dprRecords])
  useEffect(() => {
    localStorage.setItem(STORAGE_PREFIX + 'documents', JSON.stringify(documents))
  }, [documents])
  useEffect(() => {
    localStorage.setItem(STORAGE_PREFIX + 'roles', JSON.stringify(roles))
  }, [roles])
  useEffect(() => {
    localStorage.setItem(STORAGE_PREFIX + 'userPermissions', JSON.stringify(userPermissions))
  }, [userPermissions])

  // Helper for Toasts
  const addToast = (message: string, type: 'success' | 'warning' | 'error' | 'info' = 'success') => {
    const id = Date.now().toString() + Math.random().toString(36).substring(2, 6)
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, 4500)
  }

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }

  // Recalculate Project Financials whenever subworks change
  // Formula:
  // Total PO Value = Sum of all subworks under that project
  // Balance Amount = Approved Amount - Total PO Value
  useEffect(() => {
    setProjects(prevProjects => {
      let changed = false
      const updated = prevProjects.map(proj => {
        const projSubworks = subWorks.filter(sw => sw.projectId === proj.id)
        const computedPoValue = projSubworks.reduce((acc, curr) => acc + (Number(curr.poValueGst) || 0), 0)
        const computedBalance = proj.approvedAmount - computedPoValue

        if (proj.poValue !== computedPoValue || proj.balanceAmount !== computedBalance) {
          changed = true
          return {
            ...proj,
            poValue: computedPoValue,
            balanceAmount: computedBalance
          }
        }
        return proj
      })
      return changed ? updated : prevProjects
    })
  }, [subWorks])

  // Filtered views based on selected project
  const filteredPhases = useMemo(() => {
    return selectedProjectId === 'all'
      ? phases
      : phases.filter(ph => ph.projectId === selectedProjectId)
  }, [phases, selectedProjectId])

  const filteredParts = useMemo(() => {
    return selectedProjectId === 'all'
      ? parts
      : parts.filter(pt => pt.projectId === selectedProjectId)
  }, [parts, selectedProjectId])

  const filteredSections = useMemo(() => {
    return selectedProjectId === 'all' 
      ? sections 
      : sections.filter(s => s.projectId === selectedProjectId)
  }, [sections, selectedProjectId])

  const filteredMilestones = useMemo(() => {
    return selectedProjectId === 'all' 
      ? milestones 
      : milestones.filter(m => m.projectId === selectedProjectId)
  }, [milestones, selectedProjectId])

  const filteredTasks = useMemo(() => {
    return selectedProjectId === 'all' 
      ? tasks 
      : tasks.filter(t => t.projectId === selectedProjectId)
  }, [tasks, selectedProjectId])

  const filteredSubWorks = useMemo(() => {
    return selectedProjectId === 'all' 
      ? subWorks 
      : subWorks.filter(sw => sw.projectId === selectedProjectId)
  }, [subWorks, selectedProjectId])

  const filteredTeam = useMemo(() => {
    return selectedProjectId === 'all' 
      ? teamMembers 
      : teamMembers.filter(tm => tm.projectId === selectedProjectId)
  }, [teamMembers, selectedProjectId])

  const filteredDpr = useMemo(() => {
    return selectedProjectId === 'all' 
      ? dprRecords 
      : dprRecords.filter(d => d.projectId === selectedProjectId)
  }, [dprRecords, selectedProjectId])

  const filteredDocuments = useMemo(() => {
    return selectedProjectId === 'all' 
      ? documents 
      : documents.filter(doc => doc.projectId === selectedProjectId)
  }, [documents, selectedProjectId])

  // Project CRUD
  const addProject = (projectData: Omit<Project, 'id' | 'poValue' | 'balanceAmount'>) => {
    const id = `proj-${Date.now().toString().slice(-4)}`
    const newProject: Project = {
      ...projectData,
      id,
      poValue: 0,
      balanceAmount: projectData.approvedAmount
    }
    setProjects(prev => [newProject, ...prev])
    addToast(`Project "${newProject.name}" created successfully.`, 'success')
  }

  const updateProject = (id: string, updates: Partial<Project>) => {
    setProjects(prev => prev.map(p => {
      if (p.id === id) {
        const updated = { ...p, ...updates }
        // Ensure balance is consistent
        updated.balanceAmount = updated.approvedAmount - (updated.poValue || 0)
        return updated
      }
      return p
    }))
    addToast('Project updated successfully.', 'success')
  }

  const deleteProject = (id: string) => {
    const proj = projects.find(p => p.id === id)
    setProjects(prev => prev.filter(p => p.id !== id))
    // Cascade delete WBS
    setPhases(prev => prev.filter(ph => ph.projectId !== id))
    setParts(prev => prev.filter(pt => pt.projectId !== id))
    setSections(prev => prev.filter(s => s.projectId !== id))
    setMilestones(prev => prev.filter(m => m.projectId !== id))
    setTasks(prev => prev.filter(t => t.projectId !== id))
    setSubWorks(prev => prev.filter(sw => sw.projectId !== id))
    if (selectedProjectId === id) setSelectedProjectId('all')
    addToast(`Project "${proj?.name || id}" and related records deleted.`, 'warning')
  }

  // Phase CRUD
  const addPhase = (data: Omit<ProjectPhase, 'id'>) => {
    const id = `phase-${Date.now().toString().slice(-4)}`
    setPhases(prev => [...prev, { ...data, id }])
    addToast(`Phase "${data.name}" created with budget allocation.`, 'success')
  }

  const updatePhase = (id: string, updates: Partial<ProjectPhase>) => {
    setPhases(prev => prev.map(ph => ph.id === id ? { ...ph, ...updates } : ph))
    addToast('Phase updated successfully.', 'success')
  }

  const deletePhase = (id: string) => {
    setPhases(prev => prev.filter(ph => ph.id !== id))
    setParts(prev => prev.filter(pt => pt.phaseId !== id))
    addToast('Phase and associated parts deleted.', 'warning')
  }

  // Part CRUD
  const addPart = (data: Omit<ProjectPart, 'id'>) => {
    const id = `part-${Date.now().toString().slice(-4)}`
    setParts(prev => [...prev, { ...data, id }])
    addToast(`Part "${data.name}" created under phase.`, 'success')
  }

  const updatePart = (id: string, updates: Partial<ProjectPart>) => {
    setParts(prev => prev.map(pt => pt.id === id ? { ...pt, ...updates } : pt))
    addToast('Part updated successfully.', 'success')
  }

  const deletePart = (id: string) => {
    setParts(prev => prev.filter(pt => pt.id !== id))
    addToast('Part deleted.', 'warning')
  }

  // Section CRUD
  const addSection = (data: Omit<Section, 'id'>) => {
    const id = `sec-${Date.now().toString().slice(-4)}`
    setSections(prev => [...prev, { ...data, id }])
    addToast(`Section "${data.name}" added to WBS.`, 'success')
  }

  const updateSection = (id: string, updates: Partial<Section>) => {
    setSections(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s))
    addToast('Section updated successfully.', 'success')
  }

  const deleteSection = (id: string) => {
    setSections(prev => prev.filter(s => s.id !== id))
    setMilestones(prev => prev.filter(m => m.sectionId !== id))
    setTasks(prev => prev.filter(t => t.sectionId !== id))
    setSubWorks(prev => prev.filter(sw => sw.sectionId !== id))
    addToast('Section and associated sub-items deleted.', 'warning')
  }

  // Milestone CRUD
  const addMilestone = (data: Omit<Milestone, 'id'>) => {
    const id = `ms-${Date.now().toString().slice(-4)}`
    setMilestones(prev => [...prev, { ...data, id }])
    addToast(`Milestone "${data.name}" scheduled.`, 'success')
  }

  const updateMilestone = (id: string, updates: Partial<Milestone>) => {
    setMilestones(prev => prev.map(m => m.id === id ? { ...m, ...updates } : m))
    addToast('Milestone updated successfully.', 'success')
  }

  const deleteMilestone = (id: string) => {
    setMilestones(prev => prev.filter(m => m.id !== id))
    setTasks(prev => prev.filter(t => t.milestoneId !== id))
    setSubWorks(prev => prev.filter(sw => sw.milestoneId !== id))
    addToast('Milestone deleted.', 'warning')
  }

  // Task CRUD
  const addTask = (data: Omit<Task, 'id'>) => {
    const id = `tsk-${Date.now().toString().slice(-4)}`
    setTasks(prev => [...prev, { ...data, id }])
    addToast(`Task "${data.name}" added.`, 'success')
  }

  const updateTask = (id: string, updates: Partial<Task>) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t))
    addToast('Task updated successfully.', 'success')
  }

  const deleteTask = (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id))
    setSubWorks(prev => prev.filter(sw => sw.taskId !== id))
    addToast('Task deleted.', 'warning')
  }

  // SubWork CRUD
  const addSubWork = (data: Omit<SubWork, 'id'>) => {
    const id = `sw-${Date.now().toString().slice(-4)}`
    setSubWorks(prev => [...prev, { ...data, id }])
    addToast(`Sub-work PO "${data.poNumber}" recorded.`, 'success')
  }

  const updateSubWork = (id: string, updates: Partial<SubWork>) => {
    setSubWorks(prev => prev.map(sw => sw.id === id ? { ...sw, ...updates } : sw))
    addToast('Sub-work updated successfully.', 'success')
  }

  const deleteSubWork = (id: string) => {
    setSubWorks(prev => prev.filter(sw => sw.id !== id))
    addToast('Sub-work record removed.', 'warning')
  }

  // Team CRUD
  const addTeamMember = (data: Omit<TeamMember, 'id'>) => {
    const id = `tm-${Date.now().toString().slice(-4)}`
    setTeamMembers(prev => [...prev, { ...data, id }])
    addToast(`Team member "${data.name}" associated.`, 'success')
  }

  const updateTeamMember = (id: string, updates: Partial<TeamMember>) => {
    setTeamMembers(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t))
    addToast('Team member details updated.', 'success')
  }

  const deleteTeamMember = (id: string) => {
    setTeamMembers(prev => prev.filter(t => t.id !== id))
    addToast('Team member removed from project.', 'info')
  }

  // DPR CRUD
  const addDprRecord = (data: Omit<DprRecord, 'id'>) => {
    const id = `dpr-${Date.now().toString().slice(-4)}`
    setDprRecords(prev => [ { ...data, id }, ...prev ])
    addToast('Daily Progress Report submitted.', 'success')
  }

  const updateDprRecord = (id: string, updates: Partial<DprRecord>) => {
    setDprRecords(prev => prev.map(d => d.id === id ? { ...d, ...updates } : d))
    addToast('DPR record updated.', 'success')
  }

  const deleteDprRecord = (id: string) => {
    setDprRecords(prev => prev.filter(d => d.id !== id))
    addToast('DPR record deleted.', 'info')
  }

  // Documents CRUD
  const addDocument = (data: Omit<ProjectDocument, 'id' | 'uploadDate'>) => {
    const id = `doc-${Date.now().toString().slice(-4)}`
    const today = new Date().toISOString().split('T')[0]
    setDocuments(prev => [ { ...data, id, uploadDate: today }, ...prev ])
    addToast(`Document "${data.name}" uploaded successfully.`, 'success')
  }

  const updateDocument = (id: string, updates: Partial<ProjectDocument>) => {
    setDocuments(prev => prev.map(d => d.id === id ? { ...d, ...updates } : d))
    addToast('Document metadata updated.', 'success')
  }

  const deleteDocument = (id: string) => {
    setDocuments(prev => prev.filter(d => d.id !== id))
    addToast('Document removed.', 'warning')
  }

  // RBAC Operations
  const toggleUserPermission = (userId: string, module: ModuleKey, action: keyof ActionPermissions) => {
    setUserPermissions(prev => prev.map(user => {
      if (user.userId === userId) {
        const currentModulePerms = user.permissions[module]
        const updatedModulePerms = {
          ...currentModulePerms,
          [action]: !currentModulePerms[action]
        }
        return {
          ...user,
          permissions: {
            ...user.permissions,
            [module]: updatedModulePerms
          }
        }
      }
      return user
    }))
    addToast('User permission matrix updated.', 'info')
  }

  const addUser = (data: Omit<UserPermission, 'userId' | 'avatar' | 'permissions'> & { permissions?: UserPermission['permissions'] }) => {
    const userId = `usr-${Date.now().toString().slice(-4)}`
    const initials = data.userName
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2) || 'U'
    const defaultPerms = data.permissions || getDefaultPermissionsForRole(data.role)
    const newUser: UserPermission = {
      ...data,
      userId,
      avatar: initials,
      permissions: defaultPerms
    }
    setUserPermissions(prev => [...prev, newUser])
    addToast(`User "${data.userName}" created with role ${data.role}.`, 'success')
  }

  const updateUser = (userId: string, updates: Partial<UserPermission>) => {
    setUserPermissions(prev => prev.map(u => {
      if (u.userId === userId) {
        let perms = u.permissions
        if (updates.role && updates.role !== u.role && !updates.permissions) {
          perms = getDefaultPermissionsForRole(updates.role)
        } else if (updates.permissions) {
          perms = updates.permissions
        }
        return {
          ...u,
          ...updates,
          permissions: perms
        }
      }
      return u
    }))
    addToast('User account updated successfully.', 'success')
  }

  const deleteUser = (userId: string) => {
    setUserPermissions(prev => prev.filter(u => u.userId !== userId))
    addToast('User account removed.', 'warning')
  }

  const updateRole = (roleId: string, updates: Partial<RoleDefinition>) => {
    setRoles(prev => prev.map(r => r.id === roleId ? { ...r, ...updates } : r))
    addToast('Role definition updated.', 'success')
  }

  // Reset demo data
  const resetToSampleData = () => {
    setProjects(INITIAL_PROJECTS)
    setPhases(INITIAL_PHASES)
    setParts(INITIAL_PARTS)
    setSections(INITIAL_SECTIONS)
    setMilestones(INITIAL_MILESTONES)
    setTasks(INITIAL_TASKS)
    setSubWorks(INITIAL_SUBWORKS)
    setTeamMembers(INITIAL_TEAM)
    dprRecords && setDprRecords(INITIAL_DPR)
    setDocuments(INITIAL_DOCUMENTS)
    setRoles(INITIAL_ROLES)
    setUserPermissions(INITIAL_USER_PERMISSIONS)
    addToast('All data has been reset to default corporate dataset.', 'info')
  }

  return (
    <CapexContext.Provider
      value={{
        activeModule,
        setActiveModule,
        selectedProjectId,
        setSelectedProjectId,
        sidebarCollapsed,
        setSidebarCollapsed,

        projects,
        phases,
        parts,
        sections,
        milestones,
        tasks,
        subWorks,
        teamMembers,
        dprRecords,
        documents,
        userPermissions,
        roles,

        filteredPhases,
        filteredParts,
        filteredSections,
        filteredMilestones,
        filteredTasks,
        filteredSubWorks,
        filteredTeam,
        filteredDpr,
        filteredDocuments,

        addProject,
        updateProject,
        deleteProject,

        addPhase,
        updatePhase,
        deletePhase,

        addPart,
        updatePart,
        deletePart,

        addSection,
        updateSection,
        deleteSection,

        addMilestone,
        updateMilestone,
        deleteMilestone,

        addTask,
        updateTask,
        deleteTask,

        addSubWork,
        updateSubWork,
        deleteSubWork,

        addTeamMember,
        updateTeamMember,
        deleteTeamMember,

        addDprRecord,
        updateDprRecord,
        deleteDprRecord,

        addDocument,
        updateDocument,
        deleteDocument,

        addUser,
        updateUser,
        deleteUser,
        toggleUserPermission,
        updateRole,

        resetToSampleData,
        toasts,
        addToast,
        removeToast
      }}
    >
      {children}
    </CapexContext.Provider>
  )
}

export const useCapex = () => {
  const context = useContext(CapexContext)
  if (!context) {
    throw new Error('useCapex must be used within a CapexProvider')
  }
  return context
}
