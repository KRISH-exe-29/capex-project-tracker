import React, { useEffect, useState } from 'react'
import { AlertTriangle } from 'lucide-react'
import { Modal } from '../../common/Modal'
import { Button } from '../../common/Button'
import type { Project } from '../../../types/capex'
import { closeGapAfter, laterInSequence, nextProjectCode, parseProjectCode } from '../../../utils/projectCodes'
import { cn } from '../../../utils/cn'

interface DeleteProjectDialogProps {
  project: Project | null
  projects: Project[]
  onConfirm: (closeGap: boolean) => void
  onClose: () => void
}

type Choice = 'keep' | 'close'

/**
 * Confirms a project delete. When later projects exist in the same year it also asks whether to keep their
 * numbers (leaving a gap) or renumber them so the sequence has no gap.
 */
export const DeleteProjectDialog: React.FC<DeleteProjectDialogProps> = ({ project, projects, onConfirm, onClose }) => {
  const [choice, setChoice] = useState<Choice>('keep')

  useEffect(() => {
    if (project) setChoice('keep')
  }, [project])

  if (!project) return null

  const others = projects.filter(item => item.id !== project.id)
  const later = laterInSequence(project.code, others)
  const moves = closeGapAfter(project.code, others)
  const parsed = parseProjectCode(project.code)
  const year = parsed?.year ?? new Date().getFullYear()
  const nextIfKept = nextProjectCode(projects.map(item => item.code), year)
  const nextIfClosed = nextProjectCode(
    others.map(item => moves.find(move => move.id === item.id)?.to ?? item.code),
    year
  )
  const preview = moves.slice(0, 3)

  const options: { value: Choice; title: string; detail: React.ReactNode }[] = [
    {
      value: 'keep',
      title: 'Keep the numbers as they are',
      detail: (
        <>
          {project.code} stays unused. Later projects keep their codes. The next new project gets{' '}
          <span className="mono-num whitespace-nowrap font-semibold">{nextIfKept}</span>.
        </>
      )
    },
    {
      value: 'close',
      title: 'Close the gap',
      detail: (
        <>
          The {later.length} later project{later.length === 1 ? '' : 's'} move down by one (
          {preview.map((move, index) => (
            <React.Fragment key={move.id}>
              {index > 0 && ', '}
              <span className="mono-num whitespace-nowrap">
                {move.from} → {move.to}
              </span>
            </React.Fragment>
          ))}
          {moves.length > preview.length ? ', …' : ''}). The next new project gets{' '}
          <span className="mono-num whitespace-nowrap font-semibold">{nextIfClosed}</span>. Each change is recorded in the Activity Log.
        </>
      )
    }
  ]

  return (
    <Modal isOpen onClose={onClose} title={`Delete ${project.code}?`} subtitle={project.name} maxWidth="md">
      <div className="space-y-5">
        <div className="flex items-start gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-rose-50 text-rose-600">
            <AlertTriangle className="h-5 w-5" />
          </span>
          <p className="text-sm text-slate-600">
            This removes the project with its phases, sections, work packages, team, progress reports and documents.
            The deletion is recorded in the Activity Log.
          </p>
        </div>

        {later.length > 0 && (
          <fieldset className="space-y-2">
            <legend className="mb-2 text-sm font-semibold text-slate-900">
              What should happen to the project numbers after {project.code}?
            </legend>
            {options.map(option => (
              <label
                key={option.value}
                className={cn(
                  'flex cursor-pointer items-start gap-3 rounded-xl border p-3.5 transition-colors',
                  choice === option.value ? 'border-blue-400 bg-blue-50/70' : 'border-slate-200 bg-white/70 hover:bg-white'
                )}
              >
                <input
                  type="radio"
                  name="project-sequence"
                  value={option.value}
                  checked={choice === option.value}
                  onChange={() => setChoice(option.value)}
                  className="mt-0.5 h-4 w-4 accent-blue-600"
                />
                <span>
                  <span className="block text-sm font-semibold text-slate-900">{option.title}</span>
                  <span className="mt-0.5 block text-sm text-slate-600">{option.detail}</span>
                </span>
              </label>
            ))}
            {choice === 'close' && (
              <p className="rounded-lg border border-amber-200 bg-amber-50/80 px-3 py-2 text-xs text-amber-900">
                Renumbered codes change wherever they appear in the app and in new exports. Update any paper or email
                that already quotes the old codes.
              </p>
            )}
          </fieldset>
        )}

        <div className="flex flex-col-reverse gap-2 border-t border-slate-200/70 pt-4 sm:flex-row sm:justify-end">
          <Button variant="outline" onClick={onClose}>
            Keep the project
          </Button>
          <Button
            variant="danger"
            onClick={() => {
              onConfirm(later.length > 0 && choice === 'close')
              onClose()
            }}
          >
            {later.length > 0 && choice === 'close' ? 'Delete and renumber' : 'Delete project'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
