import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react'
import { useCapex } from '../../context/CapexContext'

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useCapex()

  const icons = {
    success: <CheckCircle2 className="w-5 h-5 text-[#10B981] shrink-0" />,
    warning: <AlertTriangle className="w-5 h-5 text-[#F59E0B] shrink-0" />,
    error: <AlertCircle className="w-5 h-5 text-[#EF4444] shrink-0" />,
    info: <Info className="w-5 h-5 text-[#2563EB] shrink-0" />
  }

  const borderColors = {
    success: 'border-l-4 border-l-[#10B981]',
    warning: 'border-l-4 border-l-[#F59E0B]',
    error: 'border-l-4 border-l-[#EF4444]',
    info: 'border-l-4 border-l-[#2563EB]'
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 z-[60] flex flex-col gap-2 pointer-events-none sm:left-auto sm:right-5 sm:bottom-5 sm:w-full sm:max-w-sm">
      <AnimatePresence>
        {toasts.map(toast => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: 16, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.15 } }}
            className={`pointer-events-auto flex items-center justify-between gap-3 p-3.5 glass-strong rounded-xl shadow-lg ${borderColors[toast.type]}`}
          >
            <div className="flex items-center gap-2.5 overflow-hidden">
              {icons[toast.type]}
              <p className="text-xs font-medium text-[#0F172A] leading-snug line-clamp-2">
                {toast.message}
              </p>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              aria-label="Dismiss notification"
              className="p-1 text-[#94A3B8] hover:text-[#0F172A] rounded-xs cursor-pointer transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
