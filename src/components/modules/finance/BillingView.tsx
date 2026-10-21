import React, { Fragment, useEffect, useMemo, useState } from 'react'
import { BadgeIndianRupee, ChevronDown, ChevronRight, CircleDollarSign, FileSearch, Hourglass, Receipt } from 'lucide-react'
import { Card } from '../../common/Card'
import { Button } from '../../common/Button'
import { Input } from '../../common/Input'
import { Modal } from '../../common/Modal'
import { StatusBadge } from '../../common/Badge'
import { EmptyState } from '../../common/EmptyState'
import { IconButton } from '../../common/IconButton'
import { PageHeader, StatCard } from '../../common/PageHeader'
import { FilterSelect, SearchInput, Toolbar } from '../../common/Toolbar'
import { useCapex } from '../../../context/CapexContext'
import type { Payment, SubWork } from '../../../types/capex'
import { DEFAULT_GST_RATE } from '../../../data/capexLists'
import { paidTotal, paymentTotal } from '../../../utils/capexRules'
import { formatDate, formatINR } from '../../../utils/formatters'

const STATUSES = ['ALL', 'PO Issued', 'In Execution', 'Billed', 'Part Paid', 'Paid']

const EMPTY_FORM = {
  taxableAmount: '',
  gstAmount: '',
  paidDate: '',
  grnNumber: '',
  invoiceNumber: '',
  invoiceDate: '',
  payeeBpCode: '',
  note: ''
}

/** One instalment, recorded with its GRN and invoice so the three-way match is on file. */
const PaymentModal: React.FC<{ po: SubWork | null; onClose: () => void }> = ({ po, onClose }) => {
  const { addPayment } = useCapex()
  const [form, setForm] = useState(EMPTY_FORM)
  // GST follows the taxable amount at 18% until it is typed over (e.g. 0 for exempt POs).
  const [gstTouched, setGstTouched] = useState(false)

  useEffect(() => {
    if (!po) return
    setForm({ ...EMPTY_FORM, paidDate: new Date().toISOString().slice(0, 10), payeeBpCode: po.payeeBpCode || po.bpCode })
    setGstTouched(false)
  }, [po])

  const set = (key: keyof typeof form) => (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value
    setForm(prev => {
      const next = { ...prev, [key]: value }
      if (key === 'taxableAmount' && !gstTouched) {
        next.gstAmount = value ? String(Math.round(Number(value) * DEFAULT_GST_RATE)) : ''
      }
      return next
    })
    if (key === 'gstAmount') setGstTouched(true)
  }

  const value = po?.poValueGst ?? 0
  const paidSoFar = po ? paidTotal(po) : 0
  const balance = value - paidSoFar
  const thisPayment = Math.round(Number(form.taxableAmount) || 0) + Math.round(Number(form.gstAmount) || 0)
  const over = thisPayment > balance
  const payeeDiffers = Boolean(po && form.payeeBpCode.trim() && form.payeeBpCode.trim() !== po.bpCode)
  const ready =
    Number(form.taxableAmount) > 0 && form.paidDate && form.grnNumber.trim() && form.invoiceNumber.trim() && !over

  const submit = (event: React.FormEvent) => {
    event.preventDefault()
    if (!po || !ready) return
    const saved = addPayment(po.id, {
      paidDate: form.paidDate,
      taxableAmount: Number(form.taxableAmount),
      gstAmount: Number(form.gstAmount) || 0,
      grnNumber: form.grnNumber,
      invoiceNumber: form.invoiceNumber,
      invoiceDate: form.invoiceDate,
      note: form.note,
      payeeBpCode: form.payeeBpCode
    })
    if (saved) onClose()
  }

  return (
    <Modal
      isOpen={po !== null}
      onClose={onClose}
      title={`Add payment to PO ${po?.poNumber ?? ''}`}
      subtitle={po ? `${po.supplierName} · PO value incl. GST ${formatINR(value)}` : undefined}
      maxWidth="lg"
    >
      <form onSubmit={submit} className="space-y-5">
        <div className="grid grid-cols-3 gap-3 rounded-xl border border-slate-200/80 bg-white/60 p-3 text-sm">
          <div>
            <p className="text-xs text-slate-500">Paid so far</p>
            <p className="mono-num font-semibold text-slate-900">{formatINR(paidSoFar)}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Balance to be paid</p>
            <p className="mono-num font-semibold text-slate-900">{formatINR(balance)}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Balance after this</p>
            <p className={`mono-num font-semibold ${over ? 'text-rose-600' : 'text-emerald-700'}`}>
              {formatINR(balance - thisPayment)}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label="Taxable amount (₹)"
            type="number"
            inputMode="numeric"
            min={1}
            value={form.taxableAmount}
            onChange={set('taxableAmount')}
            helperText="Before GST, as in the Taxable Amount column"
            required
          />
          <Input
            label="GST amount (₹)"
            type="number"
            inputMode="numeric"
            min={0}
            value={form.gstAmount}
            onChange={set('gstAmount')}
            helperText="Filled at 18%. Change it, or 0 if exempt"
          />
          <Input label="Paid date" type="date" value={form.paidDate} onChange={set('paidDate')} required />
          <Input
            label="Payee BP code"
            value={form.payeeBpCode}
            onChange={set('payeeBpCode')}
            className="font-mono"
            helperText={`Vendor BP is ${po?.bpCode ?? '—'}`}
          />
          <Input label="GRN number" value={form.grnNumber} onChange={set('grnNumber')} className="font-mono" required />
          <Input label="Invoice number" value={form.invoiceNumber} onChange={set('invoiceNumber')} className="font-mono" required />
          <Input label="Invoice date" type="date" value={form.invoiceDate} onChange={set('invoiceDate')} />
          <Input label="Note" value={form.note} onChange={set('note')} placeholder="e.g. 2nd running bill, advance 10%" />
        </div>

        <p className={`text-sm ${over ? 'font-medium text-rose-600' : 'text-slate-600'}`}>
          {over
            ? `This payment (${formatINR(thisPayment)}) is more than the balance to be paid.`
            : `This payment: ${formatINR(thisPayment)} (taxable + GST).`}
        </p>
        {payeeDiffers && (
          <p className="rounded-lg border border-rose-200 bg-rose-50/80 px-3 py-2 text-sm text-rose-800">
            The payee is not the vendor on the PO. This will be flagged as an audit-risk exception.
          </p>
        )}
        <div className="flex flex-col-reverse gap-2 border-t border-slate-200/70 pt-4 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={!ready}>
            Add payment
          </Button>
        </div>
      </form>
    </Modal>
  )
}

/** Payments are never edited or deleted; a wrong one is reversed with a reason. */
const ReverseModal: React.FC<{ target: { po: SubWork; payment: Payment } | null; onClose: () => void }> = ({
  target,
  onClose
}) => {
  const { reversePayment } = useCapex()
  const [reason, setReason] = useState('')
  useEffect(() => setReason(''), [target])

  const submit = (event: React.FormEvent) => {
    event.preventDefault()
    if (target && reversePayment(target.po.id, target.payment.id, reason)) onClose()
  }

  return (
    <Modal
      isOpen={target !== null}
      onClose={onClose}
      title="Reverse payment"
      subtitle={
        target
          ? `${formatINR(paymentTotal(target.payment))} on PO ${target.po.poNumber}, paid ${formatDate(target.payment.paidDate)}`
          : undefined
      }
      maxWidth="md"
    >
      <form onSubmit={submit} className="space-y-4">
        <p className="text-sm text-slate-600">
          The payment stays on record, marked as reversed, and no longer counts towards the amount paid.
        </p>
        <Input label="Reason" value={reason} onChange={event => setReason(event.target.value)} required />
        <div className="flex flex-col-reverse gap-2 border-t border-slate-200/70 pt-4 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="danger" disabled={!reason.trim()}>
            Reverse payment
          </Button>
        </div>
      </form>
    </Modal>
  )
}

export const BillingView: React.FC = () => {
  const { filteredSubWorks, hasPermission, openRecord } = useCapex()
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('ALL')
  const [paying, setPaying] = useState<SubWork | null>(null)
  const [reversing, setReversing] = useState<{ po: SubWork; payment: Payment } | null>(null)
  const [expanded, setExpanded] = useState<string | null>(null)

  const live = filteredSubWorks.filter(po => po.status !== 'Cancelled')
  const rows = useMemo(() => {
    const needle = search.trim().toLowerCase()
    return live.filter(po => {
      if (status !== 'ALL' && po.status !== status) return false
      return (
        !needle ||
        `${po.supplierName} ${po.poNumber} ${po.bpCode} ${po.workDescription} ${po.subCategory ?? ''}`
          .toLowerCase()
          .includes(needle)
      )
    })
  }, [live, search, status])

  const committedTotal = live.reduce((sum, po) => sum + po.poValueGst, 0)
  const paidAll = live.reduce((sum, po) => sum + paidTotal(po), 0)
  const fullyPaid = live.filter(po => po.status === 'Paid').length
  const partPaid = live.filter(po => po.status === 'Part Paid').length
  const canPay = hasPermission('finance', 'edit')

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Finance"
        title="Billing"
        description="Payments against purchase orders, one row per instalment. Each payment carries its GRN and invoice so every rupee paid can be matched."
        stats={
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <StatCard label="PO committed" value={formatINR(committedTotal, true)} hint={`${live.length} live POs`} icon={<BadgeIndianRupee className="h-4 w-4" />} />
            <StatCard label="Paid" value={formatINR(paidAll, true)} hint={`${fullyPaid} fully paid · ${partPaid} part paid`} tone="success" icon={<CircleDollarSign className="h-4 w-4" />} />
            <StatCard label="To be paid" value={formatINR(committedTotal - paidAll, true)} tone="warning" icon={<Hourglass className="h-4 w-4" />} />
          </div>
        }
      />

      <Card noPadding>
        <Toolbar>
          <SearchInput value={search} onChange={setSearch} placeholder="Search supplier, PO number, BP code, sub category…" />
          <FilterSelect
            label="Status"
            value={status}
            onChange={setStatus}
            options={STATUSES.map(item => ({ value: item, label: item === 'ALL' ? 'All' : item }))}
          />
        </Toolbar>

        {rows.length === 0 ? (
          <div className="p-5">
            <EmptyState
              icon={<Receipt className="h-6 w-6" />}
              title={live.length ? 'No POs match' : 'Nothing to bill yet'}
              description={live.length ? 'Change the search or status filter.' : 'Payments are recorded against purchase orders.'}
            />
          </div>
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>PO no.</th>
                  <th>Supplier</th>
                  <th className="num">Value incl. GST</th>
                  <th className="num">Paid</th>
                  <th className="num">Balance</th>
                  <th>Status</th>
                  <th className="actions">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(po => {
                  const payments = po.payments ?? []
                  const paid = paidTotal(po)
                  const open = expanded === po.id
                  return (
                    <Fragment key={po.id}>
                      <tr>
                        <td>
                          <div className="mono-num font-semibold text-blue-700">{po.poNumber}</div>
                          <div className="text-xs text-slate-500">{po.poDate ? formatDate(po.poDate) : 'No PO date'}</div>
                        </td>
                        <td className="max-w-[200px]">
                          <p className="truncate font-medium text-slate-800">{po.supplierName}</p>
                          <p className="mono-num text-xs text-slate-500">BP {po.bpCode}</p>
                        </td>
                        <td className="num font-semibold text-slate-900">{formatINR(po.poValueGst)}</td>
                        <td className="num">
                          {formatINR(paid)}
                          {payments.length ? (
                            <button
                              type="button"
                              className="ml-auto flex items-center gap-0.5 text-xs font-medium text-blue-700 hover:underline"
                              onClick={() => setExpanded(open ? null : po.id)}
                              aria-expanded={open}
                            >
                              {open ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                              {payments.length} {payments.length === 1 ? 'payment' : 'payments'}
                            </button>
                          ) : (
                            <div className="text-xs text-slate-400">No payments</div>
                          )}
                        </td>
                        <td className="num font-semibold text-slate-900">{formatINR(po.poValueGst - paid)}</td>
                        <td>
                          <StatusBadge status={po.status} />
                        </td>
                        <td className="actions">
                          <div className="flex items-center justify-end gap-1">
                            <IconButton label="Open dossier" onClick={() => openRecord('procurement-dossier', po.id)}>
                              <FileSearch className="h-4 w-4" />
                            </IconButton>
                            {canPay && po.status !== 'Paid' && (
                              <Button size="sm" variant="outline" onClick={() => setPaying(po)}>
                                Pay
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                      {open && (
                        <tr>
                          <td colSpan={7} className="bg-slate-50/70">
                            <table className="w-full text-sm">
                              <thead>
                                <tr className="text-left text-xs text-slate-500">
                                  <th className="py-1 pr-3 font-medium">Paid date</th>
                                  <th className="py-1 pr-3 text-right font-medium">Taxable</th>
                                  <th className="py-1 pr-3 text-right font-medium">GST</th>
                                  <th className="py-1 pr-3 text-right font-medium">Total</th>
                                  <th className="py-1 pr-3 font-medium">GRN</th>
                                  <th className="py-1 pr-3 font-medium">Invoice</th>
                                  <th className="py-1 pr-3 font-medium">Note</th>
                                  <th className="py-1" />
                                </tr>
                              </thead>
                              <tbody>
                                {payments.map(payment => (
                                  <tr key={payment.id} className={payment.reversed ? 'text-slate-400 line-through' : ''}>
                                    <td className="py-1 pr-3 whitespace-nowrap">{formatDate(payment.paidDate)}</td>
                                    <td className="py-1 pr-3 text-right mono-num">{formatINR(payment.taxableAmount)}</td>
                                    <td className="py-1 pr-3 text-right mono-num">{formatINR(payment.gstAmount)}</td>
                                    <td className="py-1 pr-3 text-right mono-num font-semibold">{formatINR(paymentTotal(payment))}</td>
                                    <td className="py-1 pr-3 mono-num text-xs">{payment.grnNumber || '—'}</td>
                                    <td className="py-1 pr-3 mono-num text-xs">{payment.invoiceNumber || '—'}</td>
                                    <td className="py-1 pr-3 text-xs">
                                      {payment.reversed ? `Reversed: ${payment.reversed.reason}` : payment.note || '—'}
                                    </td>
                                    <td className="py-1 text-right no-underline">
                                      {canPay && !payment.reversed && (
                                        <Button size="sm" variant="ghost" onClick={() => setReversing({ po, payment })}>
                                          Reverse
                                        </Button>
                                      )}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <PaymentModal po={paying} onClose={() => setPaying(null)} />
      <ReverseModal target={reversing} onClose={() => setReversing(null)} />
    </div>
  )
}
