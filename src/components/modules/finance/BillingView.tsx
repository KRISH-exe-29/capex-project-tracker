import React, { useEffect, useMemo, useState } from 'react'
import { BadgeIndianRupee, CircleDollarSign, FileSearch, Hourglass, Receipt } from 'lucide-react'
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
import type { SubWork } from '../../../types/capex'
import { formatDate, formatINR } from '../../../utils/formatters'

const STATUSES = ['ALL', 'PO Issued', 'In Execution', 'Billed', 'Paid']

/** Record a payment only with its GRN and invoice, so the three-way match is on file. */
const PaymentModal: React.FC<{ po: SubWork | null; onClose: () => void }> = ({ po, onClose }) => {
  const { updateSubWork } = useCapex()
  const [form, setForm] = useState({ grnNumber: '', grnDate: '', invoiceNumber: '', invoiceDate: '', paidDate: '', payeeBpCode: '' })

  useEffect(() => {
    if (!po) return
    const today = new Date().toISOString().slice(0, 10)
    setForm({
      grnNumber: po.grnNumber ?? '',
      grnDate: po.grnDate ?? '',
      invoiceNumber: po.invoiceNumber ?? '',
      invoiceDate: po.invoiceDate ?? '',
      paidDate: po.paidDate || today,
      payeeBpCode: po.payeeBpCode || po.bpCode
    })
  }, [po])

  const set = (key: keyof typeof form) => (event: React.ChangeEvent<HTMLInputElement>) =>
    setForm(prev => ({ ...prev, [key]: event.target.value }))

  const payeeDiffers = Boolean(po && form.payeeBpCode.trim() && form.payeeBpCode.trim() !== po.bpCode)
  const ready = form.grnNumber.trim() && form.invoiceNumber.trim() && form.paidDate

  const submit = (event: React.FormEvent) => {
    event.preventDefault()
    if (!po || !ready) return
    const saved = updateSubWork(po.id, {
      status: 'Paid',
      grnNumber: form.grnNumber.trim(),
      grnDate: form.grnDate,
      invoiceNumber: form.invoiceNumber.trim(),
      invoiceDate: form.invoiceDate,
      paidDate: form.paidDate,
      payeeBpCode: form.payeeBpCode.trim() || po.bpCode
    })
    if (saved) onClose()
  }

  return (
    <Modal
      isOpen={po !== null}
      onClose={onClose}
      title={`Record payment for PO ${po?.poNumber ?? ''}`}
      subtitle={po ? `${po.supplierName} · ${formatINR(po.poValueGst)}` : undefined}
      maxWidth="md"
    >
      <form onSubmit={submit} className="space-y-5">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input label="GRN number" value={form.grnNumber} onChange={set('grnNumber')} className="font-mono" required />
          <Input label="GRN date" type="date" value={form.grnDate} onChange={set('grnDate')} />
          <Input label="Invoice number" value={form.invoiceNumber} onChange={set('invoiceNumber')} className="font-mono" required />
          <Input label="Invoice date" type="date" value={form.invoiceDate} onChange={set('invoiceDate')} />
          <Input label="Paid date" type="date" value={form.paidDate} onChange={set('paidDate')} required />
          <Input
            label="Payee BP code"
            value={form.payeeBpCode}
            onChange={set('payeeBpCode')}
            className="font-mono"
            helperText={`Vendor BP is ${po?.bpCode ?? '—'}`}
          />
        </div>
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
            Record payment
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

  const live = filteredSubWorks.filter(po => po.status !== 'Cancelled')
  const rows = useMemo(() => {
    const needle = search.trim().toLowerCase()
    return live.filter(po => {
      if (status !== 'ALL' && po.status !== status) return false
      return !needle || `${po.supplierName} ${po.poNumber} ${po.bpCode} ${po.workDescription}`.toLowerCase().includes(needle)
    })
  }, [live, search, status])

  const committedTotal = live.reduce((sum, po) => sum + po.poValueGst, 0)
  const paid = live.filter(po => po.status === 'Paid')
  const paidTotal = paid.reduce((sum, po) => sum + po.poValueGst, 0)
  const canPay = hasPermission('finance', 'edit')

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Finance"
        title="Billing"
        description="Payments against purchase orders. A payment is recorded with its GRN and invoice so every rupee paid can be matched."
        stats={
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <StatCard label="PO committed" value={formatINR(committedTotal, true)} hint={`${live.length} live POs`} icon={<BadgeIndianRupee className="h-4 w-4" />} />
            <StatCard label="Paid" value={formatINR(paidTotal, true)} hint={`${paid.length} POs paid`} tone="success" icon={<CircleDollarSign className="h-4 w-4" />} />
            <StatCard label="To be paid" value={formatINR(committedTotal - paidTotal, true)} tone="warning" icon={<Hourglass className="h-4 w-4" />} />
          </div>
        }
      />

      <Card noPadding>
        <Toolbar>
          <SearchInput value={search} onChange={setSearch} placeholder="Search supplier, PO number, BP code…" />
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
                  <th>GRN</th>
                  <th>Invoice</th>
                  <th>Paid</th>
                  <th>Status</th>
                  <th className="actions">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(po => (
                  <tr key={po.id}>
                    <td className="mono-num font-semibold text-blue-700">{po.poNumber}</td>
                    <td className="max-w-[240px]">
                      <p className="truncate font-medium text-slate-800">{po.supplierName}</p>
                      <p className="mono-num text-xs text-slate-500">BP {po.bpCode}</p>
                    </td>
                    <td className="num font-semibold text-slate-900">{formatINR(po.poValueGst)}</td>
                    <td className="mono-num text-xs">{po.grnNumber || <span className="text-slate-400">—</span>}</td>
                    <td className="mono-num text-xs">{po.invoiceNumber || <span className="text-slate-400">—</span>}</td>
                    <td className="whitespace-nowrap">{po.paidDate ? formatDate(po.paidDate) : <span className="text-slate-400">—</span>}</td>
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
                            Record payment
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <PaymentModal po={paying} onClose={() => setPaying(null)} />
    </div>
  )
}
