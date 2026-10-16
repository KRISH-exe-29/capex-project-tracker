import React, { useMemo, useState } from 'react'
import { Download, History, Info, Search } from 'lucide-react'
import { Card } from '../../common/Card'
import { Button } from '../../common/Button'
import { EmptyState } from '../../common/EmptyState'
import { PageHeader } from '../../common/PageHeader'
import { StatusBadge } from '../../common/Badge'
import { useCapex } from '../../../context/CapexContext'
import type { AuditEntry } from '../../../types/capex'
import { downloadCsv } from '../../../utils/csv'

const ACTIONS: AuditEntry['action'][] = ['create', 'update', 'delete', 'approve', 'reject', 'request', 'blocked']
const PAGE_SIZE = 50


export const AuditLogView: React.FC = () => {
  const { auditLog, hasPermission, addToast } = useCapex()

  const [query, setQuery] = useState('')
  const [entityType, setEntityType] = useState('all')
  const [user, setUser] = useState('all')
  const [action, setAction] = useState('all')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [limit, setLimit] = useState(PAGE_SIZE)

  const entityTypes = useMemo(() => [...new Set(auditLog.map(entry => entry.entityType))].sort(), [auditLog])
  const users = useMemo(() => [...new Set(auditLog.map(entry => entry.userName))].sort(), [auditLog])

  const rows = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return auditLog.filter(entry => {
      // Compare in local time (IST), not UTC.
      const day = new Date(entry.at).toLocaleDateString('en-CA')
      if (entityType !== 'all' && entry.entityType !== entityType) return false
      if (user !== 'all' && entry.userName !== user) return false
      if (action !== 'all' && entry.action !== action) return false
      if (from && day < from) return false
      if (to && day > to) return false
      if (!needle) return true
      return [entry.entityLabel, entry.entityType, entry.userName, entry.before, entry.after, entry.reason]
        .join(' ')
        .toLowerCase()
        .includes(needle)
    })
  }, [auditLog, query, entityType, user, action, from, to])

  const exportCsv = () => {
    downloadCsv(
      `capex-activity-log-${new Date().toISOString().slice(0, 10)}.csv`,
      ['Time (ISO)', 'User', 'Action', 'Record type', 'Record', 'Before', 'After', 'Reason'],
      rows.map(entry => [
        entry.at,
        entry.userName,
        entry.action,
        entry.entityType,
        entry.entityLabel,
        entry.before,
        entry.after,
        entry.reason
      ])
    )
    addToast(`Exported ${rows.length} log entries.`, 'info')
  }

  const clearFilters = () => {
    setQuery('')
    setEntityType('all')
    setUser('all')
    setAction('all')
    setFrom('')
    setTo('')
  }

  const filtered = query || entityType !== 'all' || user !== 'all' || action !== 'all' || from || to

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Records"
        title="Activity Log"
        description="Every change, approval and blocked attempt: who did it, when, and what changed. Entries cannot be edited or deleted from the app."
        actions={
          hasPermission('access', 'export') || hasPermission('finance', 'export') ? (
            <Button variant="outline" leftIcon={<Download className="h-4 w-4" />} onClick={exportCsv} disabled={!rows.length}>
              Export CSV
            </Button>
          ) : undefined
        }
      />

      <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50/80 px-4 py-3 text-sm text-amber-900">
        <Info className="mt-0.5 h-4 w-4 shrink-0" />
        <p>
          Recorded in this browser. It becomes tamper-proof when the app moves to the server (Supabase) with real
          login.
        </p>
      </div>

      <Card noPadding>
        <div className="grid grid-cols-1 gap-3 border-b border-slate-200/70 p-4 sm:grid-cols-2 lg:grid-cols-4 2xl:grid-cols-7">
          <div className="relative sm:col-span-2 lg:col-span-2">
            <label htmlFor="log-search" className="field-label">
              Search
            </label>
            <Search className="pointer-events-none absolute bottom-3 left-3 h-4 w-4 text-slate-400" />
            <input
              id="log-search"
              className="field-control pl-9"
              value={query}
              onChange={event => setQuery(event.target.value)}
              placeholder="PR, PO, value, reason…"
            />
          </div>
          <div>
            <label htmlFor="log-type" className="field-label">
              Record type
            </label>
            <select id="log-type" className="field-control" value={entityType} onChange={event => setEntityType(event.target.value)}>
              <option value="all">All</option>
              {entityTypes.map(item => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="log-action" className="field-label">
              Action
            </label>
            <select id="log-action" className="field-control" value={action} onChange={event => setAction(event.target.value)}>
              <option value="all">All</option>
              {ACTIONS.map(item => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="log-user" className="field-label">
              User
            </label>
            <select id="log-user" className="field-control" value={user} onChange={event => setUser(event.target.value)}>
              <option value="all">All</option>
              {users.map(item => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:col-span-2 lg:col-span-2 2xl:col-span-2">
            <div>
              <label htmlFor="log-from" className="field-label">
                From
              </label>
              <input id="log-from" type="date" className="field-control" value={from} onChange={event => setFrom(event.target.value)} />
            </div>
            <div>
              <label htmlFor="log-to" className="field-label">
                To
              </label>
              <input id="log-to" type="date" className="field-control" value={to} onChange={event => setTo(event.target.value)} />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between px-4 py-2.5 text-xs text-slate-500">
          <span>
            {rows.length} of {auditLog.length} entries
          </span>
          {filtered && (
            <button onClick={clearFilters} className="font-medium text-blue-700 hover:underline">
              Clear filters
            </button>
          )}
        </div>

        {rows.length === 0 ? (
          <div className="p-5 pt-0">
            <EmptyState
              icon={<History className="h-6 w-6" />}
              title={auditLog.length ? 'No entries match' : 'No activity yet'}
              description={
                auditLog.length
                  ? 'Change or clear the filters.'
                  : 'Creating a project, raising a PR or approving anything adds an entry here.'
              }
            />
          </div>
        ) : (
          <>
            <div className="table-wrap border-t border-slate-200/70">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>When</th>
                    <th>User</th>
                    <th>Action</th>
                    <th>Record</th>
                    <th>Before</th>
                    <th>After</th>
                    <th>Reason</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.slice(0, limit).map(entry => (
                    <tr key={entry.id} className={entry.action === 'blocked' ? 'bg-rose-50/50' : undefined}>
                      <td className="mono-num whitespace-nowrap text-xs">{new Date(entry.at).toLocaleString('en-IN')}</td>
                      <td className="whitespace-nowrap">{entry.userName}</td>
                      <td>
                        <StatusBadge status={entry.action} />
                      </td>
                      <td>
                        <div className="font-medium text-slate-800">{entry.entityLabel}</div>
                        <div className="text-xs text-slate-500">{entry.entityType}</div>
                      </td>
                      <td className="max-w-[240px] text-xs text-slate-500">{entry.before ?? '—'}</td>
                      <td className="max-w-[240px] text-xs text-slate-700">{entry.after ?? '—'}</td>
                      <td className="max-w-[240px] text-xs text-slate-600">{entry.reason ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {rows.length > limit && (
              <div className="border-t border-slate-200/70 p-3 text-center">
                <Button variant="ghost" size="sm" onClick={() => setLimit(value => value + PAGE_SIZE)}>
                  Show {Math.min(PAGE_SIZE, rows.length - limit)} more
                </Button>
              </div>
            )}
          </>
        )}
      </Card>
    </div>
  )
}
