import React from 'react'
import { Sidebar } from './Sidebar'
import { Header } from './Header'
import { ToastContainer } from '../common/ToastContainer'
import { useCapex } from '../../context/CapexContext'
import { cn } from '../../utils/cn'

export const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { sidebarCollapsed } = useCapex()

  return (
    <div className="flex min-h-screen flex-col text-slate-900 antialiased">
      <Sidebar />
      <Header />

      <main
        className={cn(
          'flex min-h-screen flex-1 flex-col pt-16 transition-[padding] duration-300 ease-in-out',
          sidebarCollapsed ? 'lg:pl-[72px]' : 'lg:pl-[260px]'
        )}
      >
        <div className="mx-auto w-full max-w-[1600px] flex-1 space-y-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          {children}
        </div>
      </main>

      <ToastContainer />
    </div>
  )
}
