import { useMemo, useState } from 'react'
import { PageHeader } from '../../components/common/PageHeader'
import { Panel } from '../../components/common/Panel'
import { StatCard } from '../../components/common/StatCard'
import { StatusBadge } from '../../components/common/StatusBadge'
import { DataTable } from '../../components/common/DataTable'
import { Toolbar, FilterChips } from '../../components/common/FilterBar'
import { SearchBar } from '../../components/common/SearchBar'
import { Modal } from '../../components/common/Modal'
import { UnavailableState } from '../../components/common/ErrorState'
import { useApi, useMutation } from '../../hooks/useApi'
import { useDebounce } from '../../hooks/useDebounce'
import { useToast } from '../../context/ToastContext'
import { useAuth } from '../../context/AuthContext'
import * as reportService from '../../services/reportService'
import * as fineService from '../../services/fineService'
import * as studentService from '../../services/studentService'
import * as issueService from '../../services/issueService'
import { formatDate } from '../../utils/date'
import { formatCurrency } from '../../utils/format'

const STATUS_FILTERS = ['All', 'Pending', 'Paid', 'Waived']

export default function Fines() {
  const { role, studentProfileStatus } = useAuth()
  const isStaff = role === 'Admin' || role === 'Librarian'

  const [status, setStatus] = useState('All')
  const [query, setQuery] = useState('')
  const debouncedQuery = useDebounce(query, 250)
  const [createOpen, setCreateOpen] = useState(false)

  const { data: fines, loading, error, refetch } = useApi(() => reportService.getFineReport(), [], { enabled: isStaff })

  const rows = useMemo(() => {
    let list = fines || []
    if (status !== 'All') list = list.filter((f) => f.payment_status === status)
    const q = debouncedQuery.toLowerCase()
    if (q) list = list.filter((f) => f.student_name?.toLowerCase().includes(q) || f.roll_number?.toLowerCase().includes(q) || f.title?.toLowerCase().includes(q))
    return list
  }, [fines, status, debouncedQuery])

  const totals = useMemo(() => {
    const list = fines || []
    return {
      pending: list.filter((f) => f.payment_status === 'Pending').reduce((s, f) => s + Number(f.amount), 0),
      paid: list.filter((f) => f.payment_status === 'Paid').reduce((s, f) => s + Number(f.amount), 0),
      count: list.filter((f) => f.payment_status === 'Pending').length,
    }
  }, [fines])

  if (!isStaff) {
    return <MyFines studentProfileStatus={studentProfileStatus} />
  }

  const columns = [
    {
      key: 'student', header: 'Student', sortable: true, sortValue: (r) => r.student_name,
      render: (r) => (<><div className="clms-cell-title">{r.student_name}</div><div className="clms-cell-sub">{r.roll_number}</div></>),
    },
    { key: 'title', header: 'Book' },
    { key: 'fine_type', header: 'Type' },
    { key: 'amount', header: 'Amount', sortable: true, render: (r) => formatCurrency(r.amount) },
    { key: 'created_at', header: 'Issued', sortable: true, render: (r) => formatDate(r.created_at) },
    { key: 'payment_status', header: 'Status', render: (r) => <StatusBadge status={r.payment_status} /> },
  ]

  return (
    <div>
      <PageHeader
        title="Fine Management"
        subtitle="Track and settle outstanding library fines."
        actions={
          <button className="clms-btn clms-btn-primary" onClick={() => setCreateOpen(true)}>
            <i className="ti ti-plus" /> Record a fine
          </button>
        }
      />

      <div className="clms-stat-row">
        <StatCard icon="ti-receipt" label="Pending fines" value={totals.count} tone="warning" />
        <StatCard icon="ti-cash" label="Pending amount" value={totals.pending} prefix="₹" tone="danger" animate={false} />
        <StatCard icon="ti-circle-check" label="Collected" value={totals.paid} prefix="₹" animate={false} />
      </div>

      <Panel>
        <Toolbar>
          <SearchBar value={query} onChange={setQuery} placeholder="Search student or book..." />
          <FilterChips options={STATUS_FILTERS} active={status} onChange={setStatus} />
        </Toolbar>

        <DataTable
          columns={columns}
          rows={rows}
          keyField="fine_id"
          loading={loading}
          error={error}
          onRetry={refetch}
          emptyTitle="No fines"
          emptyMessage="No fines match your filters."
          emptyIcon="ti-receipt"
          rowActions={(r) =>
            r.payment_status === 'Pending' ? (
              <span className="clms-badge clms-badge-neutral" title="PUT /fines/:id is restricted to the Student role on the current backend — only the student who owes the fine can mark it paid.">
                Awaiting student payment
              </span>
            ) : null
          }
        />
      </Panel>

      <CreateFineModal open={createOpen} onClose={() => setCreateOpen(false)} onCreated={refetch} />
    </div>
  )
}

function CreateFineModal({ open, onClose, onCreated }) {
  const toast = useToast()
  const [studentQuery, setStudentQuery] = useState('')
  const [selectedStudentId, setSelectedStudentId] = useState(null)
  const [selectedIssueId, setSelectedIssueId] = useState(null)
  const [fineType, setFineType] = useState('Late Return')
  const [amount, setAmount] = useState('')
  const [reason, setReason] = useState('')

  const { data: students } = useApi(() => studentService.getAllStudents(), [], { enabled: open })
  const { data: studentIssues } = useApi(
    () => issueService.getStudentIssues(selectedStudentId),
    [selectedStudentId],
    { enabled: Boolean(selectedStudentId) }
  )
  const [createRun, createState] = useMutation((payload) => fineService.createFine(payload))

  const studentMatches = (students || []).filter((s) => {
    const q = studentQuery.toLowerCase()
    return !q || s.student_name.toLowerCase().includes(q) || s.roll_number.toLowerCase().includes(q)
  }).slice(0, 8)

  function reset() {
    setStudentQuery(''); setSelectedStudentId(null); setSelectedIssueId(null)
    setFineType('Late Return'); setAmount(''); setReason('')
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!selectedStudentId || !selectedIssueId || !amount) {
      toast.error('Select a student, an issue record, and an amount.')
      return
    }
    try {
      await createRun({
        issue_id: selectedIssueId,
        student_id: selectedStudentId,
        fine_type: fineType,
        amount: Number(amount),
        reason,
      })
      toast.success('Fine recorded and the student notified.')
      reset()
      onCreated?.()
      onClose()
    } catch (err) {
      toast.error(err?.message || 'Could not create this fine.')
    }
  }

  return (
    <Modal open={open} title="Record a fine" onClose={() => { reset(); onClose() }} width={560}>
      <form onSubmit={handleSubmit}>
        <div className="clms-field">
          <label>Student<span className="required">*</span></label>
          <input className="clms-input" placeholder="Search by name or roll number" value={studentQuery} onChange={(e) => setStudentQuery(e.target.value)} />
          <div style={{ maxHeight: 140, overflowY: 'auto', border: '1px solid var(--border)', borderRadius: 10, marginTop: 8 }}>
            {studentMatches.map((s) => (
              <div
                key={s.student_id}
                onClick={() => { setSelectedStudentId(s.student_id); setSelectedIssueId(null) }}
                style={{ padding: '9px 12px', cursor: 'pointer', fontSize: '0.82rem', background: selectedStudentId === s.student_id ? 'rgba(217,164,65,0.15)' : 'transparent' }}
              >
                {s.student_name} <span style={{ color: 'var(--muted)' }}>({s.roll_number})</span>
              </div>
            ))}
          </div>
        </div>

        {selectedStudentId && (
          <div className="clms-field">
            <label>Related issue<span className="required">*</span></label>
            {!studentIssues || studentIssues.length === 0 ? (
              <p className="clms-hint">This student has no issue records to attach a fine to.</p>
            ) : (
              <select className="clms-select" style={{ width: '100%' }} value={selectedIssueId || ''} onChange={(e) => setSelectedIssueId(Number(e.target.value))}>
                <option value="" disabled>Select an issue</option>
                {studentIssues.map((i) => (
                  <option key={i.issue_id} value={i.issue_id}>{i.title} — {i.issue_status}</option>
                ))}
              </select>
            )}
          </div>
        )}

        <div className="clms-field-row">
          <div className="clms-field">
            <label>Fine type</label>
            <select className="clms-select" style={{ width: '100%' }} value={fineType} onChange={(e) => setFineType(e.target.value)}>
              <option>Late Return</option>
              <option>Damaged Book</option>
              <option>Lost Book</option>
            </select>
          </div>
          <div className="clms-field">
            <label>Amount (₹)<span className="required">*</span></label>
            <input className="clms-input" type="number" min="1" value={amount} onChange={(e) => setAmount(e.target.value)} />
          </div>
        </div>

        <div className="clms-field">
          <label>Reason</label>
          <textarea className="clms-textarea" rows={2} value={reason} onChange={(e) => setReason(e.target.value)} />
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <button type="button" className="clms-btn clms-btn-ghost" onClick={() => { reset(); onClose() }}>Cancel</button>
          <button type="submit" className="clms-btn clms-btn-primary" disabled={createState.loading}>
            {createState.loading && <span className="clms-spinner" />} Record fine
          </button>
        </div>
      </form>
    </Modal>
  )
}

function MyFines({ studentProfileStatus }) {
  const toast = useToast()
  const [status, setStatus] = useState('All')
  const enabled = studentProfileStatus === 'ready'

  const { data: fines, loading, error, refetch } = useApi(() => fineService.getMyFines(), [enabled], { enabled })
  const [payRun, payState] = useMutation((fineId) => fineService.payFine(fineId))
  const [payingId, setPayingId] = useState(null)

  const rows = useMemo(() => {
    const list = fines || []
    if (status === 'All') return list
    return list.filter((f) => f.payment_status === status)
  }, [fines, status])

  const totals = useMemo(() => {
    const list = fines || []
    return {
      pending: list.filter((f) => f.payment_status === 'Pending').reduce((s, f) => s + Number(f.amount), 0),
      paid: list.filter((f) => f.payment_status === 'Paid').reduce((s, f) => s + Number(f.amount), 0),
      count: list.filter((f) => f.payment_status === 'Pending').length,
    }
  }, [fines])

  async function handlePay(fine) {
    setPayingId(fine.fine_id)
    try {
      await payRun(fine.fine_id)
      toast.success(`Fine of ${formatCurrency(fine.amount)} paid.`)
      refetch()
    } catch (err) {
      toast.error(err?.message || 'Could not pay this fine.')
    } finally {
      setPayingId(null)
    }
  }

  if (studentProfileStatus === 'unavailable') {
    return (
      <div>
        <PageHeader title="Fines" subtitle="View and settle any outstanding library fines." />
        <Panel>
          <UnavailableState
            title="No student profile linked"
            message="Your account isn't linked to a student record yet — ask an admin to add one from Student Management, then your fines will appear here."
          />
        </Panel>
      </div>
    )
  }

  const columns = [
    { key: 'title', header: 'Book' },
    { key: 'fine_type', header: 'Type' },
    { key: 'amount', header: 'Amount', sortable: true, render: (r) => formatCurrency(r.amount) },
    { key: 'created_at', header: 'Issued', sortable: true, render: (r) => formatDate(r.created_at) },
    { key: 'payment_status', header: 'Status', render: (r) => <StatusBadge status={r.payment_status} /> },
  ]

  return (
    <div>
      <PageHeader title="Fines" subtitle="View and settle any outstanding library fines." />

      <div className="clms-stat-row">
        <StatCard icon="ti-receipt" label="Pending fines" value={totals.count} tone="warning" />
        <StatCard icon="ti-cash" label="You owe" value={totals.pending} prefix="₹" tone="danger" animate={false} />
        <StatCard icon="ti-circle-check" label="Paid so far" value={totals.paid} prefix="₹" animate={false} />
      </div>

      <Panel>
        <Toolbar>
          <FilterChips options={STATUS_FILTERS} active={status} onChange={setStatus} />
        </Toolbar>

        <DataTable
          columns={columns}
          rows={rows}
          keyField="fine_id"
          loading={loading || studentProfileStatus === 'loading'}
          error={error}
          onRetry={refetch}
          emptyTitle="No fines"
          emptyMessage="You have no fines on record — keep it that way."
          emptyIcon="ti-receipt"
          rowActions={(r) =>
            r.payment_status === 'Pending' ? (
              <button
                className="clms-btn clms-btn-primary clms-btn-small"
                disabled={payState.loading && payingId === r.fine_id}
                onClick={() => handlePay(r)}
              >
                {payState.loading && payingId === r.fine_id && <span className="clms-spinner" />} Pay now
              </button>
            ) : null
          }
        />
      </Panel>
    </div>
  )
}
