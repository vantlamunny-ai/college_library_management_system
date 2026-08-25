import { useMemo, useState } from 'react'
import { PageHeader } from '../../components/common/PageHeader'
import { Panel } from '../../components/common/Panel'
import { StatCard } from '../../components/common/StatCard'
import { StatusBadge } from '../../components/common/StatusBadge'
import { DataTable } from '../../components/common/DataTable'
import { Toolbar, FilterChips } from '../../components/common/FilterBar'
import { SearchBar } from '../../components/common/SearchBar'
import { Modal } from '../../components/common/Modal'
import { useApi, useMutation } from '../../hooks/useApi'
import { useDebounce } from '../../hooks/useDebounce'
import { useToast } from '../../context/ToastContext'
import { useAuth } from '../../context/AuthContext'
import * as returnService from '../../services/returnService'
import * as reportService from '../../services/reportService'
import { formatDate } from '../../utils/date'

const FILTERS = ['All', 'Damaged', 'Lost']

export default function LostDamaged() {
  const { role } = useAuth()
  const canReport = role === 'Librarian'
  const toast = useToast()

  const [filter, setFilter] = useState('All')
  const [query, setQuery] = useState('')
  const debouncedQuery = useDebounce(query, 250)
  const [reportOpen, setReportOpen] = useState(false)
  const [resolveTarget, setResolveTarget] = useState(null)

  const { data: returns, loading, error, refetch } = useApi(() => returnService.getAllReturns(), [])
  const { data: copyReport } = useApi(() => reportService.getCopyReport(), [])

  const incidents = useMemo(
    () => (returns || []).filter((r) => r.condition_status === 'Damaged' || r.condition_status === 'Lost'),
    [returns]
  )

  const affectedCopies = useMemo(
    () => (copyReport || []).filter((c) => c.availability_status === 'Damaged' || c.availability_status === 'Lost'),
    [copyReport]
  )

  const rows = useMemo(() => {
    let list = incidents
    if (filter !== 'All') list = list.filter((r) => r.condition_status === filter)
    const q = debouncedQuery.toLowerCase()
    if (q) list = list.filter((r) => String(r.issue_id).includes(q) || (r.remarks || '').toLowerCase().includes(q))
    return list
  }, [incidents, filter, debouncedQuery])

  const [resolveRun, resolveState] = useMutation(({ id, payload }) => returnService.updateReturn(id, payload))

  async function handleResolve(remarks) {
    try {
      await resolveRun({
        id: resolveTarget.return_id,
        payload: {
          return_date: resolveTarget.return_date,
          condition_status: 'Good',
          remarks: remarks || 'Resolved — copy returned to circulation.',
          processed_by: resolveTarget.processed_by,
        },
      })
      toast.success('Marked resolved — the copy is available again.')
      setResolveTarget(null)
      refetch()
    } catch (err) {
      toast.error(err?.message || 'Could not resolve this incident.')
    }
  }

  const columns = [
    { key: 'issue_id', header: 'Issue #', mono: true },
    { key: 'return_date', header: 'Reported', sortable: true, render: (r) => formatDate(r.return_date) },
    { key: 'condition_status', header: 'Type', render: (r) => <StatusBadge status={r.condition_status} /> },
    { key: 'remarks', header: 'Description', render: (r) => r.remarks || '—' },
  ]

  return (
    <div>
      <PageHeader
        title="Lost / Damaged Management"
        subtitle="Track copies reported damaged or lost, and resolve them once repaired or replaced."
        actions={
          canReport ? (
            <button className="clms-btn clms-btn-primary" onClick={() => setReportOpen(true)}>
              <i className="ti ti-alert-triangle" /> Report incident
            </button>
          ) : (
            <span className="clms-badge clms-badge-neutral" title="POST /returns is restricted to the Librarian role on the current backend.">
              Reporting requires Librarian role
            </span>
          )
        }
      />

      <div className="clms-stat-row">
        <StatCard icon="ti-tools" label="Damaged copies" value={affectedCopies.filter((c) => c.availability_status === 'Damaged').length} tone="warning" />
        <StatCard icon="ti-circle-x" label="Lost copies" value={affectedCopies.filter((c) => c.availability_status === 'Lost').length} tone="danger" />
        <StatCard icon="ti-list-details" label="Total incidents" value={incidents.length} />
      </div>

      <Panel>
        <Toolbar>
          <SearchBar value={query} onChange={setQuery} placeholder="Search by issue # or description..." />
          <FilterChips options={FILTERS} active={filter} onChange={setFilter} />
        </Toolbar>

        <DataTable
          columns={columns}
          rows={rows}
          keyField="return_id"
          loading={loading}
          error={error}
          onRetry={refetch}
          emptyTitle="No lost or damaged copies"
          emptyMessage="Everything currently in circulation is in good condition."
          emptyIcon="ti-shield-check"
          rowActions={(r) =>
            canReport ? (
              <button className="clms-btn clms-btn-ghost clms-btn-small" onClick={() => setResolveTarget(r)}>
                <i className="ti ti-circle-check" /> Resolve
              </button>
            ) : (
              <span className="clms-badge clms-badge-neutral" title="PUT /returns/:id is restricted to the Librarian role on the current backend.">
                Librarian only
              </span>
            )
          }
        />
      </Panel>

      {canReport && <ReportIncidentModal open={reportOpen} onClose={() => setReportOpen(false)} onReported={refetch} />}

      <Modal open={Boolean(resolveTarget)} title="Resolve incident" onClose={() => setResolveTarget(null)}>
        {resolveTarget && (
          <ResolveForm loading={resolveState.loading} onSubmit={handleResolve} onCancel={() => setResolveTarget(null)} />
        )}
      </Modal>
    </div>
  )
}

function ResolveForm({ loading, onSubmit, onCancel }) {
  const [remarks, setRemarks] = useState('')
  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(remarks) }}>
      <p style={{ marginTop: 0, color: 'var(--muted)', fontSize: '0.86rem' }}>
        This marks the copy's condition as Good and returns it to circulation.
      </p>
      <div className="clms-field">
        <label>Resolution notes</label>
        <textarea className="clms-textarea" rows={3} value={remarks} onChange={(e) => setRemarks(e.target.value)} placeholder="e.g. Repaired and rebound" />
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
        <button type="button" className="clms-btn clms-btn-ghost" onClick={onCancel}>Cancel</button>
        <button type="submit" className="clms-btn clms-btn-primary" disabled={loading}>
          {loading && <span className="clms-spinner" />} Mark resolved
        </button>
      </div>
    </form>
  )
}

function ReportIncidentModal({ open, onClose, onReported }) {
  const toast = useToast()
  const [issueId, setIssueId] = useState('')
  const [conditionStatus, setConditionStatus] = useState('Damaged')
  const [remarks, setRemarks] = useState('')
  const [processedBy, setProcessedBy] = useState('')
  const [createRun, createState] = useMutation((payload) => returnService.createReturn(payload))

  function reset() {
    setIssueId(''); setConditionStatus('Damaged'); setRemarks(''); setProcessedBy('')
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!issueId || !processedBy) {
      toast.error('Enter the issue ID and your librarian ID.')
      return
    }
    try {
      await createRun({
        issue_id: Number(issueId),
        return_date: new Date().toISOString().slice(0, 10),
        condition_status: conditionStatus,
        remarks,
        processed_by: Number(processedBy),
      })
      toast.success('Incident reported and the copy status updated.')
      reset()
      onReported?.()
      onClose()
    } catch (err) {
      toast.error(err?.message || 'Could not report this incident.')
    }
  }

  return (
    <Modal open={open} title="Report lost or damaged copy" onClose={() => { reset(); onClose() }} width={520}>
      <form onSubmit={handleSubmit}>
        <p className="clms-hint" style={{ marginBottom: 14 }}>
          This is filed against an active issue record (find the issue # on the Circulation page) — the same real
          endpoint used to process returns, since this backend doesn't have a separate lost/damaged module.
        </p>
        <div className="clms-field">
          <label>Issue #<span className="required">*</span></label>
          <input className="clms-input" type="number" value={issueId} onChange={(e) => setIssueId(e.target.value)} />
        </div>
        <div className="clms-field">
          <label>Type<span className="required">*</span></label>
          <select className="clms-select" style={{ width: '100%' }} value={conditionStatus} onChange={(e) => setConditionStatus(e.target.value)}>
            <option>Damaged</option>
            <option>Lost</option>
          </select>
        </div>
        <div className="clms-field">
          <label>Description</label>
          <textarea className="clms-textarea" rows={2} value={remarks} onChange={(e) => setRemarks(e.target.value)} />
        </div>
        <div className="clms-field">
          <label>Librarian ID<span className="required">*</span></label>
          <input className="clms-input" type="number" value={processedBy} onChange={(e) => setProcessedBy(e.target.value)} />
          <p className="clms-hint">Backend has no self-lookup endpoint yet — enter your librarian ID manually.</p>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <button type="button" className="clms-btn clms-btn-ghost" onClick={() => { reset(); onClose() }}>Cancel</button>
          <button type="submit" className="clms-btn clms-btn-primary" disabled={createState.loading}>
            {createState.loading && <span className="clms-spinner" />} Report incident
          </button>
        </div>
      </form>
    </Modal>
  )
}
