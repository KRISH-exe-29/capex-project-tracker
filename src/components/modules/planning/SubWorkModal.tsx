import React, { useEffect, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { AlertCircle } from 'lucide-react'
import { Modal } from '../../common/Modal'
import { Input } from '../../common/Input'
import { Select } from '../../common/Select'
import { Button } from '../../common/Button'
import type { SubWork, SubWorkStatus } from '../../../types/capex'
import { useCapex } from '../../../context/CapexContext'
import { committed, isSettled, openPr } from '../../../utils/capexRules'
import { formatINR } from '../../../utils/formatters'
import { BudgetGauge } from '../procurement/BudgetGauge'

interface SubWorkModalProps {
  isOpen: boolean
  onClose: () => void
  subWorkToEdit?: SubWork | null
  /** Pre-select this approved PR when creating a PO. */
  defaultPrId?: string
  /** Limit the PR list to one work package (e.g. opened from the WBS tree). */
  defaultTaskId?: string
}

interface PoFormData {
  prId: string
  poNumber: string
  workDescription: string
  supplierName: string
  bpCode: string
  payeeBpCode: string
  poValueGst: number
  targetDate: string
  status: SubWorkStatus
  quotesCompared: number
  lowestQuoteSelected: 'yes' | 'no'
  selectionJustification: string
  grnNumber: string
  grnDate: string
  invoiceNumber: string
  invoiceDate: string
  paidDate: string
}

const inDays = (days: number) => new Date(Date.now() + days * 86_400_000).toISOString().slice(0, 10)

const EMPTY: PoFormData = {
  prId: '',
  poNumber: '',
  workDescription: '',
  supplierName: '',
  bpCode: '',
  payeeBpCode: '',
  poValueGst: 0,
  targetDate: inDays(30),
  status: 'PO Issued',
  quotesCompared: 3,
  lowestQuoteSelected: 'yes',
  selectionJustification: '',
  grnNumber: '',
  grnDate: '',
  invoiceNumber: '',
  invoiceDate: '',
  paidDate: ''
}

const STATUS_OPTIONS: { value: SubWorkStatus; label: string }[] = [
  { value: 'PO Issued', label: 'PO issued' },
  { value: 'In Execution', label: 'In execution' },
  { value: 'Billed', label: 'Billed' },
  { value: 'Paid', label: 'Paid' }
]

const SectionTitle: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <h4 className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">{children}</h4>
)

export const SubWorkModal: React.FC<SubWorkModalProps> = ({
  isOpen,
  onClose,
  subWorkToEdit,
  defaultPrId,
  defaultTaskId
}) => {
  const { tasks, subWorks, purchaseRequisitions, addSubWork, updateSubWork, selectedProjectId } = useCapex()
  const editing = Boolean(subWorkToEdit)
  const valueLocked = Boolean(subWorkToEdit && isSettled(subWorkToEdit))

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors }
  } = useForm<PoFormData>({ defaultValues: EMPTY })

  const approvedPrs = useMemo(
    () =>
      purchaseRequisitions.filter(
        pr =>
          pr.status === 'Approved' &&
          (!defaultTaskId || pr.taskId === defaultTaskId) &&
          (selectedProjectId === 'all' || pr.projectId === selectedProjectId)
      ),
    [purchaseRequisitions, defaultTaskId, selectedProjectId]
  )

  const prId = watch('prId')
  const value = Number(watch('poValueGst')) || 0
  const lowest = watch('lowestQuoteSelected')
  const quotes = Number(watch('quotesCompared')) || 0

  const pr = purchaseRequisitions.find(item => item.id === (editing ? subWorkToEdit?.prId : prId))
  const task = tasks.find(item => item.id === (editing ? subWorkToEdit?.taskId : pr?.taskId))

  // Ceiling for this PO: excludes this PR's own reservation (it converts into the PO) and, when
  // editing, this PO's current value.
  const committedOthers = task
    ? committed(task.id, subWorks.filter(po => po.id !== subWorkToEdit?.id))
    : 0
  const openOthers = task ? openPr(task.id, purchaseRequisitions, pr?.id) : 0
  const headroom = task ? task.budgetAmount - committedOthers - openOthers : 0
  const limit = editing ? headroom : Math.min(pr?.amount ?? 0, headroom)
  const overLimit = !valueLocked && value > limit

  useEffect(() => {
    if (!isOpen) return
    if (subWorkToEdit) {
      reset({
        ...EMPTY,
        prId: subWorkToEdit.prId ?? '',
        poNumber: subWorkToEdit.poNumber,
        workDescription: subWorkToEdit.workDescription,
        supplierName: subWorkToEdit.supplierName,
        bpCode: subWorkToEdit.bpCode,
        payeeBpCode: subWorkToEdit.payeeBpCode ?? subWorkToEdit.bpCode,
        poValueGst: subWorkToEdit.poValueGst,
        targetDate: subWorkToEdit.targetDate,
        status: subWorkToEdit.status,
        quotesCompared: subWorkToEdit.quotesCompared ?? 0,
        lowestQuoteSelected: subWorkToEdit.lowestQuoteSelected === false ? 'no' : 'yes',
        selectionJustification: subWorkToEdit.selectionJustification ?? '',
        grnNumber: subWorkToEdit.grnNumber ?? '',
        grnDate: subWorkToEdit.grnDate ?? '',
        invoiceNumber: subWorkToEdit.invoiceNumber ?? '',
        invoiceDate: subWorkToEdit.invoiceDate ?? '',
        paidDate: subWorkToEdit.paidDate ?? ''
      })
    } else {
      const first = approvedPrs.find(item => item.id === defaultPrId) ?? approvedPrs[0]
      reset({
        ...EMPTY,
        prId: first?.id ?? '',
        workDescription: first?.purpose ?? '',
        poValueGst: first?.amount ?? 0
      })
    }
  }, [isOpen, subWorkToEdit, defaultPrId, approvedPrs, reset])

  // Picking another PR pre-fills its amount and purpose.
  const onPrChange = (nextPrId: string) => {
    const next = purchaseRequisitions.find(item => item.id === nextPrId)
    setValue('prId', nextPrId)
    if (next) {
      setValue('poValueGst', next.amount)
      setValue('workDescription', next.purpose)
    }
  }

  const onSubmit = (data: PoFormData) => {
    const common = {
      poNumber: data.poNumber.trim(),
      workDescription: data.workDescription.trim(),
      supplierName: data.supplierName.trim(),
      bpCode: data.bpCode.trim(),
      payeeBpCode: data.payeeBpCode.trim() || data.bpCode.trim(),
      poValueGst: valueLocked ? undefined : Number(data.poValueGst),
      targetDate: data.targetDate,
      quotesCompared: Number(data.quotesCompared),
      lowestQuoteSelected: data.lowestQuoteSelected === 'yes',
      selectionJustification: data.selectionJustification.trim()
    }

    if (subWorkToEdit) {
      const saved = updateSubWork(subWorkToEdit.id, {
        ...common,
        status: data.status,
        grnNumber: data.grnNumber.trim(),
        grnDate: data.grnDate,
        invoiceNumber: data.invoiceNumber.trim(),
        invoiceDate: data.invoiceDate,
        paidDate: data.paidDate
      })
      if (saved) onClose()
      return
    }

    if (!pr || !task) return
    const created = addSubWork({
      ...common,
      prId: pr.id,
      projectId: task.projectId,
      sectionId: task.sectionId,
      phaseId: task.phaseId,
      partId: task.partId,
      milestoneId: task.milestoneId,
      taskId: task.id,
      wbsNumber: `${task.wbsNumber}.${subWorks.filter(po => po.taskId === task.id).length + 1}`,
      status: 'PO Issued',
      paidDate: ''
    })
    if (created) onClose()
  }

  const noPrs = !editing && approvedPrs.length === 0

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editing ? `Edit PO ${subWorkToEdit?.poNumber}` : 'Create PO from approved PR'}
      subtitle={
        editing
          ? 'The PR and work package of a PO cannot change. Value changes are checked against the budget ceiling.'
          : 'Every PO starts from an approved purchase requisition and must fit inside it.'
      }
      maxWidth="2xl"
    >
      {noPrs ? (
        <div className="space-y-4">
          <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50/80 p-4 text-sm text-amber-900">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <p>
              There is no approved PR to convert{defaultTaskId ? ' for this work package' : ''}. Raise a PR under
              Procurement → Requisitions and have it approved first.
            </p>
          </div>
          <div className="flex justify-end">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <section className="space-y-3">
            <SectionTitle>Source requisition</SectionTitle>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {editing ? (
                <Input label="Purchase requisition" value={pr ? `${pr.prNumber} · ${formatINR(pr.amount)}` : 'Not linked'} readOnly disabled />
              ) : (
                <Select
                  label="Approved PR"
                  {...register('prId', { required: 'Choose an approved PR' })}
                  onChange={event => onPrChange(event.target.value)}
                  options={approvedPrs.map(item => ({
                    value: item.id,
                    label: `${item.prNumber} · ${formatINR(item.amount)}`
                  }))}
                  error={errors.prId?.message}
                  required
                />
              )}
              <Input label="Work package" value={task ? `${task.wbsNumber} ${task.name}` : '—'} readOnly disabled />
            </div>
            {task && (
              <div className="rounded-xl border border-slate-200/80 bg-white/60 p-4">
                <BudgetGauge
                  budget={task.budgetAmount}
                  committed={committedOthers}
                  openPr={openOthers}
                  request={value}
                  requestLabel="This PO"
                />
                <p className={`mt-3 text-xs ${overLimit ? 'font-medium text-rose-600' : 'text-slate-500'}`}>
                  {overLimit
                    ? `Too high. The most this PO can be is ${formatINR(Math.max(limit, 0))}.`
                    : `This PO can be up to ${formatINR(Math.max(limit, 0))}${editing ? '' : ' (the PR amount or the budget left, whichever is lower)'}.`}
                </p>
              </div>
            )}
          </section>

          <section className="space-y-3">
            <SectionTitle>Order</SectionTitle>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input
                label="PO number"
                {...register('poNumber', { required: 'Enter the PO number from SAP' })}
                error={errors.poNumber?.message}
                placeholder="e.g. 2521130014"
                className="font-mono"
                required
              />
              <Input
                label="PO value incl. GST (₹)"
                type="number"
                inputMode="numeric"
                {...register('poValueGst', {
                  required: 'Enter the PO value',
                  min: { value: 1, message: 'Must be more than zero' }
                })}
                error={errors.poValueGst?.message}
                helperText={valueLocked ? 'Locked: this PO is billed, invoiced or paid.' : undefined}
                disabled={valueLocked}
                required
              />
              <div className="sm:col-span-2">
                <Input
                  label="What is being bought"
                  {...register('workDescription', { required: 'Describe the order' })}
                  error={errors.workDescription?.message}
                  required
                />
              </div>
              <Input
                label="Target delivery date"
                type="date"
                {...register('targetDate', { required: 'Choose a date' })}
                error={errors.targetDate?.message}
                required
              />
              {editing && (
                <Select label="Status" {...register('status')} options={STATUS_OPTIONS} />
              )}
            </div>
          </section>

          <section className="space-y-3">
            <SectionTitle>Vendor and payee</SectionTitle>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="sm:col-span-3">
                <Input
                  label="Supplier name"
                  {...register('supplierName', { required: 'Enter the supplier' })}
                  error={errors.supplierName?.message}
                  required
                />
              </div>
              <Input
                label="Vendor BP code"
                {...register('bpCode', { required: 'Enter the BP code' })}
                error={errors.bpCode?.message}
                className="font-mono"
                required
              />
              <Input
                label="Payee BP code"
                {...register('payeeBpCode')}
                className="font-mono"
                helperText="Leave blank if the vendor is paid"
              />
            </div>
          </section>

          <section className="space-y-3">
            <SectionTitle>Quote selection</SectionTitle>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input
                label="Quotes compared"
                type="number"
                min={0}
                {...register('quotesCompared', { min: { value: 0, message: 'Cannot be negative' } })}
                error={errors.quotesCompared?.message}
              />
              <Select
                label="Lowest quote selected?"
                {...register('lowestQuoteSelected')}
                options={[
                  { value: 'yes', label: 'Yes, lowest (L1) quote' },
                  { value: 'no', label: 'No, another vendor' }
                ]}
              />
              <div className="sm:col-span-2">
                <label htmlFor="selectionJustification" className="field-label">
                  Reason for selection
                  {(lowest === 'no' || quotes < 3) && <span className="ml-1 text-rose-500">*</span>}
                </label>
                <textarea
                  id="selectionJustification"
                  className="field-control"
                  rows={2}
                  placeholder="Required when fewer than 3 quotes were compared or the lowest quote was not chosen"
                  {...register('selectionJustification', {
                    validate: text =>
                      (lowest === 'yes' && quotes >= 3) || text.trim().length > 0 || 'Give the reason for this vendor'
                  })}
                />
                {errors.selectionJustification && (
                  <p className="mt-1 text-xs font-medium text-rose-600">{errors.selectionJustification.message}</p>
                )}
              </div>
            </div>
          </section>

          {editing && (
            <section className="space-y-3">
              <SectionTitle>Receipt, invoice and payment</SectionTitle>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Input label="GRN number" {...register('grnNumber')} className="font-mono" />
                <Input label="GRN date" type="date" {...register('grnDate')} />
                <Input label="Invoice number" {...register('invoiceNumber')} className="font-mono" />
                <Input label="Invoice date" type="date" {...register('invoiceDate')} />
                <Input label="Paid date" type="date" {...register('paidDate')} helperText="Leave blank until paid" />
              </div>
            </section>
          )}

          <div className="flex flex-col-reverse gap-2 border-t border-slate-200/70 pt-4 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={overLimit || (!editing && !pr)}>
              {editing ? 'Save changes' : 'Create PO'}
            </Button>
          </div>
        </form>
      )}
    </Modal>
  )
}
