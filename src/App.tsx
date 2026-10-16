import React from 'react'
import { CapexProvider, useCapex } from './context/CapexContext'
import { AppLayout } from './components/layout/AppLayout'

// Module Views
import { DashboardView } from './components/modules/dashboard/DashboardView'
import { ProjectListView } from './components/modules/planning/ProjectListView'
import { WbsTreeView } from './components/modules/planning/WbsTreeView'
import { MilestoneListView } from './components/modules/planning/MilestoneListView'
import { TaskListView } from './components/modules/planning/TaskListView'
import { SubWorkListView } from './components/modules/planning/SubWorkListView'
import { GanttChartView } from './components/modules/planning/GanttChartView'
import { TeamView } from './components/modules/operation/TeamView'
import { DprView } from './components/modules/operation/DprView'
import { BudgetView } from './components/modules/finance/BudgetView'
import { BillingView } from './components/modules/finance/BillingView'
import { DocumentView } from './components/modules/document/DocumentView'
import { UserMatrixView } from './components/modules/access/UserMatrixView'
import { UsersView } from './components/modules/access/UsersView'

const AppContent: React.FC = () => {
  const { activeModule } = useCapex()

  const renderModuleView = () => {
    switch (activeModule) {
      case 'dashboard':
        return <DashboardView />

      case 'planning-project':
        return <ProjectListView />

      case 'planning-wbs':
        return <WbsTreeView />

      case 'planning-milestone':
        return <MilestoneListView />

      case 'planning-task':
        return <TaskListView />

      case 'planning-subwork':
        return <SubWorkListView />

      case 'planning-gantt':
        return <GanttChartView />

      case 'operation-team':
        return <TeamView />

      case 'operation-dpr':
        return <DprView />

      case 'finance-budget':
        return <BudgetView />

      case 'finance-billing':
        return <BillingView />

      case 'document':
        return <DocumentView />

      case 'access-matrix':
        return <UserMatrixView />

      case 'access-users':
      case 'access-roles':
        return <UsersView />

      default:
        return <DashboardView />
    }
  }

  return (
    <AppLayout>
      {renderModuleView()}
    </AppLayout>
  )
}

export function App() {
  return (
    <CapexProvider>
      <AppContent />
    </CapexProvider>
  )
}

export default App
