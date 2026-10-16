import React, { useState, useMemo } from 'react'
import { Receipt, Search, Filter, CheckCircle2, Clock, IndianRupee, AlertCircle } from 'lucide-react'
import { Card } from '../../common/Card'
import { Button } from '../../common/Button'
import { StatusBadge } from '../../common/Badge'
import { EmptyState } from '../../common/EmptyState'
import { useCapex } from '../../../context/CapexContext'
import { formatINR, formatDate } from '../../../utils/formatters'
import { SubWork } from '../../../types/capex'

export const BillingView: React.FC = () => {
  const { subWorks, filteredSubWorks, projects, updateSubWork, addToast } = useCapex()

  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')

  const displayedBills = useMemo(() => {
    return filteredSubWorks.filter(sw => {
      const matchesSearch =
        sw.supplierName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sw.poNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sw.bpCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sw.workDescription.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesStatus = statusFilter === 'ALL' || sw.status === statusFilter
      return matchesSearch && matchesStatus
    })
  }, [filteredSubWorks, searchTerm, statusFilter])

  // Aggregate totals
  const totalInvoiced = displayedBills.reduce((acc, curr) => acc + curr.poValueGst, 0)
  const paidBills = displayedBills.filter(b => b.status === 'Paid')
  const totalPaid = paidBills.reduce((acc, curr) => acc + curr.poValueGst, 0)
  const pendingAmount = totalInvoiced - totalPaid

  // Direct action: Mark as Paid
  const handleMarkPaid = (sw: SubWork) => {
    const today = new Date().toISOString().split('T')[0]
    updateSubWork(sw.id, {
      status: 'Paid',
      paidDate: today
    })
    addToast(`Payment of ${formatINR(sw.poValueGst)} to ${sw.supplierName} recorded.`, 'success')
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Receipt className="w-5 h-5 text-amber-600" />
            <h2 className="text-xl font-bold text-[#0F172A] font-heading tracking-tight">
              Finance — Billing & Payment Tracking
            </h2>
          </div>
          <p className="text-xs text-[#64748B] mt-0.5">
            Procurement billing tracking derived directly from approved sub-work purchase orders and BP vendor records.
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <p className="text-xs font-semibold text-[#64748B] uppercase">Total PO Commitment</p>
          <h3 className="text-xl font-bold font-heading text-[#0F172A] mt-1 font-mono">
            {formatINR(totalInvoiced)}
          </h3>
          <p className="text-[11px] text-[#64748B] mt-1">{displayedBills.length} Purchase Orders</p>
        </Card>

        <Card>
          <p className="text-xs font-semibold text-[#64748B] uppercase">Settled / Paid to Date</p>
          <h3 className="text-xl font-bold font-heading text-emerald-600 mt-1 font-mono">
            {formatINR(totalPaid)}
          </h3>
          <p className="text-[11px] text-[#64748B] mt-1">{paidBills.length} Invoices Closed</p>
        </Card>

        <Card>
          <p className="text-xs font-semibold text-[#64748B] uppercase">Pending Clearance</p>
          <h3 className="text-xl font-bold font-heading text-amber-600 mt-1 font-mono">
            {formatINR(pendingAmount)}
          </h3>
          <p className="text-[11px] text-[#64748B] mt-1">{displayedBills.length - paidBills.length} Unsettled POs</p>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <Card noPadding className="p-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-[#94A3B8] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search by supplier, BP code, PO number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-10 pl-9 pr-3 text-xs bg-white text-[#0F172A] border border-[#CBD5E1] rounded-[6px] focus:outline-hidden focus:ring-2 focus:ring-[#2563EB]/25 focus:border-[#2563EB]"
            />
          </div>

          <div className="flex items-center gap-2.5 w-full md:w-auto">
            <Filter className="w-3.5 h-3.5 text-[#64748B]" />
            <span className="text-xs text-[#64748B] font-medium">Payment Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-10 px-3 text-xs bg-white text-[#0F172A] border border-[#CBD5E1] rounded-[6px] focus:outline-hidden focus:ring-2 focus:ring-[#2563EB]/25 cursor-pointer"
            >
              <option value="ALL">All PO Billings ({filteredSubWorks.length})</option>
              <option value="Paid">Paid (Settled)</option>
              <option value="Billed">Billed (Awaiting Payment)</option>
              <option value="In Execution">In Execution</option>
              <option value="PO Issued">PO Issued</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Billing Table */}
      <Card noPadding className="overflow-hidden">
        {displayedBills.length === 0 ? (
          <EmptyState
            title="No Billing Records Found"
            description="No purchase orders match your filter criteria."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[11px] font-semibold text-[#475569] uppercase tracking-wider sticky top-0 z-10">
                  <th className="py-3 px-4">Supplier Name</th>
                  <th className="py-3 px-3">BP Code</th>
                  <th className="py-3 px-3">PO Number</th>
                  <th className="py-3 px-3">Work Package</th>
                  <th className="py-3 px-3 text-right">PO Value + GST</th>
                  <th className="py-3 px-3">Paid Date</th>
                  <th className="py-3 px-3 text-center">Status</th>
                  <th className="py-3 px-4 text-center">Payment Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F5F9] text-xs text-[#0F172A]">
                {displayedBills.map((bill) => {
                  return (
                    <tr key={bill.id} className="hover:bg-[#F8FAFC]/80 transition-colors">
                      {/* Supplier */}
                      <td className="py-3.5 px-4 font-semibold text-[#0F172A]">
                        {bill.supplierName}
                      </td>

                      {/* BP Code */}
                      <td className="py-3.5 px-3 font-mono text-xs text-[#64748B]">
                        {bill.bpCode}
                      </td>

                      {/* PO Number */}
                      <td className="py-3.5 px-3 font-mono text-xs font-semibold text-blue-700">
                        {bill.poNumber}
                      </td>

                      {/* Work Description */}
                      <td className="py-3.5 px-3 max-w-[220px] truncate text-[#475569]">
                        {bill.workDescription}
                      </td>

                      {/* PO Value + GST */}
                      <td className="py-3.5 px-3 text-right font-mono font-bold text-[#0F172A] whitespace-nowrap">
                        {formatINR(bill.poValueGst)}
                      </td>

                      {/* Paid Date */}
                      <td className="py-3.5 px-3 whitespace-nowrap text-[#64748B]">
                        {bill.paidDate ? (
                          <span className="text-emerald-700 font-medium">
                            {formatDate(bill.paidDate)}
                          </span>
                        ) : (
                          <span className="text-amber-600 font-medium italic">Pending</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-3 text-center whitespace-nowrap">
                        <StatusBadge status={bill.status} />
                      </td>

                      {/* Action */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        {bill.status !== 'Paid' ? (
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100"
                            onClick={() => handleMarkPaid(bill)}
                            leftIcon={<CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
                          >
                            Mark Paid
                          </Button>
                        ) : (
                          <span className="text-[11px] text-emerald-700 font-medium flex items-center justify-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Settled
                          </span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}
