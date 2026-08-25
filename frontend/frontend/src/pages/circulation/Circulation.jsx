import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
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
import * as issueService from '../../services/issueService'
import * as bookService from '../../services/bookService'
import * as studentService from '../../services/studentService'
import * as returnService from '../../services/returnService'
import { formatDate, dueStatus } from '../../utils/date'
import './Circulation.css'

const TABS = ['All', 'Active', 'Overdue', 'Returned']

export default function Circulation() {
  const { role } = useAuth()
  const canProcessReturns = role === 'Librarian'
  const [searchParams, setSearchParams] = useSearchParams()
  const [tab, setTab] = useState('All')
  const [query, setQuery] = useState('')
  const debouncedQuery = useDebounce(query, 250)
  const [issueOpen, setIssueOpen] = useState(Boolean(searchParams.get('bookId')))
  const [returnTarget, setReturnTarget] = useState(null)

  const { data: allIssues, loading, error, refetch } = useApi(() => issueService.getAllIssues(), [])
  const { data: stats } = useApi(() => issueService.getIssueStatistics(), [])

  const rows = useMemo(() => {
    let list = allIssues || []
    if (tab === 'Active') list = list.filter((i) => i.issue_status === 'Issued')
    if (tab === 'Overdue') list = list.filter((i) => i.issue_status === 'Issued' && dueStatus(i.due_date).key === 'overdue')
    if (tab === 'Returned') list = list.filter((i) => i.issue_status === 'Returned')
    const q = debouncedQuery.toLowerCase()
    if (q) {
      list = list.filter(
        (i) =>
          i.student_name?.toLowerCase().includes(q) ||
          i.roll_number?.toLowerCase().includes(q) ||
          i.title?.toLowerCase().includes(q) ||
          i.accession_number?.toLowerCase().includes(q)
      )
    }
    return list
  }, [allIssues, tab, debouncedQuery])

  const columns = [
    {
      key: 'student', header: 'Student', sortable: true, sortValue: (r) => r.student_name,
      render: (r) => (
        <>
          <div className="clms-cell-title">{r.student_name}</div>
          <div className="clms-cell-sub">{r.roll_number}</div>
        </>
      ),
    },
    { key: 'title', header: 'Book', sortable: true },
    { key: 'accession_number', header: 'Accession', mono: true },
    { key: 'issue_date', header: 'Issued', sortable: true, render: (r) => formatDate(r.issue_date) },
    { key: 'due_date', header: 'Due', sortable: true, render: (r) => formatDate(r.due_date) },
    {
      key: 'status', header: 'Status',
      render: (r) => r.issue_status === 'Issued'
        ? <StatusBadge status={dueStatus(r.due_date).label} tone={dueStatus(r.due_date).tone} />
        : <StatusBadge status={r.issue_status} />,
    },
  ]

  return (
    <div>
      <PageHeader
        title="Circulation Management"
        subtitle="Issue, return, and track every book loan in real time."
        actions={
          <button className="clms-btn clms-btn-primary" onClick={() => setIssueOpen(true)}>
            <i className="ti ti-plus" /> Issue a book
          </button>
        }
      />

      <div className="clms-stat-row">
        <StatCard icon="ti-transfer" label="Total issues" value={stats?.total_issues || 0} />
        <StatCard icon="ti-book-2" label="Active loans" value={stats?.active_issues || 0} tone="info" />
        <StatCard icon="ti-clock-exclamation" label="Overdue" value={stats?.overdue_issues || 0} tone="danger" />
        <StatCard icon="ti-corner-down-left" label="Returned" value={stats?.returned_books || 0} tone="warning" />
      </div>

      <Panel>
        <Toolbar>
          <SearchBar value={query} onChange={setQuery} placeholder="Search student, roll number, or title..." />
          <FilterChips options={TABS} active={tab} onChange={setTab} />
        </Toolbar>

        <DataTable
          columns={columns}
          rows={rows}
          keyField="issue_id"
          loading={loading}
          error={error}
          onRetry={refetch}
          emptyTitle="No circulation records"
          emptyMessage="No book issues match your filters yet."
          emptyIcon="ti-transfer"
          rowActions={(r) => (
            <>
              {r.issue_status === 'Issued' ? (
                canProcessReturns ? (
                  <button className="clms-btn clms-btn-ghost clms-btn-small" onClick={() => setReturnTarget(r)}>
                    <i className="ti ti-corner-down-left" /> Return
                  </button>
                ) : (
                  <span className="clms-badge clms-badge-neutral" title="POST/PUT /returns is restricted to the Librarian role on the current backend.">
                    Librarian only
                  </span>
                )
              ) : (
                <StatusBadge status={r.issue_status} />
              )}
              <button className="clms-btn clms-btn-ghost clms-btn-small" disabled title="Renewal isn't supported by the backend yet">
                <i className="ti ti-refresh" />
              </button>
            </>
          )}
        />
      </Panel>

      <IssueBookModal
        open={issueOpen}
        initialBookId={searchParams.get('bookId') ? Number(searchParams.get('bookId')) : null}
        onClose={() => { setIssueOpen(false); searchParams.delete('bookId'); setSearchParams(searchParams, { replace: true }) }}
        onIssued={refetch}
      />
      <ReturnBookModal issue={returnTarget} onClose={() => setReturnTarget(null)} onReturned={refetch} />
    </div>
  )
}

function LibrarianIdField({ value, onChange }) {
  return (
    <>
      <div className="circ-field-hint">
        <i className="ti ti-info-circle" />
        <span>
          The backend has no way to resolve the logged-in librarian's ID yet (no self-lookup endpoint exists).
          Enter it manually until that's added.
        </span>
      </div>
      <div className="clms-field">
        <label>Librarian ID<span className="required">*</span></label>
        <input className="clms-input" type="number" min="1" value={value} onChange={(e) => onChange(e.target.value)} required />
      </div>
    </>
  )
}

function IssueBookModal({ open, initialBookId, onClose, onIssued }) {
  const toast = useToast()
  const [studentQuery, setStudentQuery] = useState('')
  const [bookQuery, setBookQuery] = useState('')
  const [selectedStudentId, setSelectedStudentId] = useState(null)
  const [selectedBookId, setSelectedBookId] = useState(initialBookId)
  const [selectedCopyId, setSelectedCopyId] = useState(null)
  const [loanDays, setLoanDays] = useState(14)
  const [librarianId, setLibrarianId] = useState('')

  // Sync the preselected book whenever the modal transitions to open —
  // adjusted during render rather than an effect.
  const [wasOpen, setWasOpen] = useState(open)
  if (wasOpen !== open) {
    setWasOpen(open)
    if (open && selectedBookId !== initialBookId) setSelectedBookId(initialBookId)
  }

  const { data: students } = useApi(() => studentService.getAllStudents(), [], { enabled: open })
  const { data: books } = useApi(() => bookService.getAllBooks(), [], { enabled: open })
  const { data: bookDetail } = useApi(
    () => bookService.getBookById(selectedBookId),
    [selectedBookId],
    { enabled: Boolean(selectedBookId) }
  )
  const [issueRun, issueState] = useMutation((payload) => issueService.issueBook(payload))

  const studentMatches = (students || []).filter((s) => {
    const q = studentQuery.toLowerCase()
    return !q || s.student_name.toLowerCase().includes(q) || s.roll_number.toLowerCase().includes(q)
  }).slice(0, 8)

  const bookMatches = (books || []).filter((b) => {
    const q = bookQuery.toLowerCase()
    return !q || b.title.toLowerCase().includes(q)
  }).slice(0, 8)

  const availableCopies = (bookDetail?.copies || []).filter((c) => c.availability_status === 'Available')

  function reset() {
    setStudentQuery(''); setBookQuery(''); setSelectedStudentId(null); setSelectedBookId(null)
    setSelectedCopyId(null); setLoanDays(14); setLibrarianId('')
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!selectedStudentId || !selectedCopyId || !librarianId) {
      toast.error('Select a student, a copy, and enter a librarian ID.')
      return
    }
    try {
      const res = await issueRun({
        student_id: selectedStudentId,
        copy_id: selectedCopyId,
        librarian_id: Number(librarianId),
        loan_days: Number(loanDays) || 14,
      })
      toast.success(`Issued "${res.data.title}" to ${res.data.student_name}.`)
      reset()
      onIssued?.()
      onClose()
    } catch (err) {
      toast.error(err?.message || 'Could not issue this book.')
    }
  }

  return (
    <Modal open={open} title="Issue a book" onClose={() => { reset(); onClose() }} width={620}>
      <form onSubmit={handleSubmit}>
        <div className="clms-field-row">
          <div className="clms-field">
            <label>Student<span className="required">*</span></label>
            <input className="clms-input" placeholder="Search by name or roll number" value={studentQuery} onChange={(e) => setStudentQuery(e.target.value)} />
            <div className="circ-book-pick">
              {studentMatches.length === 0 && <div className="clms-hint">No students found.</div>}
              {studentMatches.map((s) => {
                const blocked = s.account_status === 'Blocked'
                return (
                  <div
                    key={s.student_id}
                    className={`circ-pick-row ${selectedStudentId === s.student_id ? 'active' : ''}`}
                    style={blocked ? { opacity: 0.5, cursor: 'not-allowed' } : undefined}
                    onClick={() => (blocked ? toast.error(`${s.student_name}'s account is blocked.`) : setSelectedStudentId(s.student_id))}
                  >
                    <span>{s.student_name}</span>
                    <span className="sub">{s.roll_number}{blocked && ' — Blocked'}</span>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="clms-field">
            <label>Book<span className="required">*</span></label>
            <input className="clms-input" placeholder="Search by title" value={bookQuery} onChange={(e) => setBookQuery(e.target.value)} disabled={Boolean(initialBookId)} />
            <div className="circ-book-pick">
              {bookMatches.length === 0 && <div className="clms-hint">No books found.</div>}
              {bookMatches.map((b) => (
                <div key={b.book_id} className={`circ-pick-row ${selectedBookId === b.book_id ? 'active' : ''}`} onClick={() => { setSelectedBookId(b.book_id); setSelectedCopyId(null) }}>
                  <span>{b.title}</span>
                  <span className="sub">{b.available_copies ?? 0} available</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {selectedBookId && (
          <div className="clms-field">
            <label>Copy to issue<span className="required">*</span></label>
            {availableCopies.length === 0 ? (
              <p className="clms-hint">No available copies for this title right now.</p>
            ) : (
              <div className="circ-book-pick" style={{ maxHeight: 140 }}>
                {availableCopies.map((c) => (
                  <div key={c.copy_id} className={`circ-pick-row ${selectedCopyId === c.copy_id ? 'active' : ''}`} onClick={() => setSelectedCopyId(c.copy_id)}>
                    <span>{c.accession_number}</span>
                    <span className="sub">{c.shelf_location || 'No location set'}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="clms-field">
          <label>Loan period (days)</label>
          <input className="clms-input" type="number" min="1" value={loanDays} onChange={(e) => setLoanDays(e.target.value)} />
        </div>

        <LibrarianIdField value={librarianId} onChange={setLibrarianId} />

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 6 }}>
          <button type="button" className="clms-btn clms-btn-ghost" onClick={() => { reset(); onClose() }}>Cancel</button>
          <button type="submit" className="clms-btn clms-btn-primary" disabled={issueState.loading}>
            {issueState.loading && <span className="clms-spinner" />} Issue book
          </button>
        </div>
      </form>
    </Modal>
  )
}

function ReturnBookModal({ issue, onClose, onReturned }) {
  const toast = useToast()
  const [condition, setCondition] = useState('Good')
  const [remarks, setRemarks] = useState('')
  const [processedBy, setProcessedBy] = useState('')
  const [returnRun, returnState] = useMutation((payload) => returnService.createReturn(payload))

  async function handleSubmit(e) {
    e.preventDefault()
    if (!processedBy) {
      toast.error('Enter the librarian ID processing this return.')
      return
    }
    try {
      await returnRun({
        issue_id: issue.issue_id,
        return_date: new Date().toISOString().slice(0, 10),
        condition_status: condition,
        remarks,
        processed_by: Number(processedBy),
      })
      toast.success(`"${issue.title}" marked as returned.`)
      setCondition('Good'); setRemarks(''); setProcessedBy('')
      onReturned?.()
      onClose()
    } catch (err) {
      toast.error(err?.message || 'Could not process this return.')
    }
  }

  return (
    <Modal open={Boolean(issue)} title="Return book" onClose={onClose} width={480}>
      {issue && (
        <form onSubmit={handleSubmit}>
          <p style={{ marginTop: 0, color: 'var(--muted)', fontSize: '0.86rem' }}>
            Returning <strong style={{ color: 'var(--cream)' }}>{issue.title}</strong> from {issue.student_name} ({issue.roll_number}).
          </p>
          <div className="clms-field">
            <label>Condition on return</label>
            <select className="clms-select" style={{ width: '100%' }} value={condition} onChange={(e) => setCondition(e.target.value)}>
              <option>New</option>
              <option>Good</option>
              <option>Damaged</option>
              <option>Lost</option>
            </select>
          </div>
          <div className="clms-field">
            <label>Remarks</label>
            <textarea className="clms-textarea" rows={2} value={remarks} onChange={(e) => setRemarks(e.target.value)} />
          </div>
          <LibrarianIdField value={processedBy} onChange={setProcessedBy} />
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
            <button type="button" className="clms-btn clms-btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="clms-btn clms-btn-primary" disabled={returnState.loading}>
              {returnState.loading && <span className="clms-spinner" />} Confirm return
            </button>
          </div>
        </form>
      )}
    </Modal>
  )
}
