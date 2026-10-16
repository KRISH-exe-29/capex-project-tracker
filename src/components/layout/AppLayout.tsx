import React from 'react'
import { Sidebar } from './Sidebar'
import { Header } from './Header'
import { ToastContainer } from '../common/ToastContainer'
import { useCapex } from '../../context/CapexContext'
import { cn } from '../../utils/cn'

export const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { sidebarCollapsed } = useCapex()

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] flex flex-col antialiased">
      <Sidebar />
      <Header />

      <main
        className={cn(
          'flex-1 pt-16 transition-all duration-300 ease-in-out min-h-screen flex flex-col',
          sidebarCollapsed ? 'lg:pl-[72px]' : 'lg:pl-[260px]'
        )}
      >
        <div className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1600px] w-full mx-auto">
          {children}
        </div>
      </main>

      <ToastContainer />
    </div>
  )
}
