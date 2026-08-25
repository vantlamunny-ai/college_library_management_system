import { useMemo, useState } from 'react'
import { PageHeader } from '../../components/common/PageHeader'
import { Panel } from '../../components/common/Panel'
import { StatCard } from '../../components/common/StatCard'
import { StatusBadge } from '../../components/common/StatusBadge'
import { DataTable } from '../../components/common/DataTable'
import { Toolbar, FilterChips } from '../../components/common/FilterBar'
import { SearchBar } from '../../components/common/SearchBar'
import { Modal } from '../../components/common/Modal'
import { ConfirmDialog } from '../../components/common/ConfirmDialog'
import { DetailDrawer } from '../../components/common/DetailDrawer'
import { EmptyState } from '../../components/common/EmptyState'
import { useApi, useMutation } from '../../hooks/useApi'
import { useDebounce } from '../../hooks/useDebounce'
import { useToast } from '../../context/ToastContext'
import { useAuth } from '../../context/AuthContext'
import * as studentService from '../../services/studentService'
import * as issueService from '../../services/issueService'
import * as reportService from '../../services/reportService'
import * as librarianService from '../../services/librarianService'
import { formatDate } from '../../utils/date'
import { formatCurrency } from '../../utils/format'

const STATUS_FILTERS = ['All', 'Active', 'Inactive', 'Graduated']

export default function StudentManagement() {
  const { role } = useAuth()
  const toast = useToast()
  const [status, setStatus] = useState('All')
  const [query, setQuery] = useState('')
  const debouncedQuery = useDebounce(query, 250)
  const [detailId, setDetailId] = useState(null)
  const [editTarget, setEditTarget] = useState(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [statusChange, setStatusChange] = useState(null) // { student, nextStatus }
  const [librarianCreateOpen, setLibrarianCreateOpen] = useState(false)

  const { data: students, loading, error, refetch } = useApi(() => studentService.getAllStudents(), [])
  const { data: allIssues } = useApi(() => issueService.getAllIssues(), [])
  const { data: fineReport } = useApi(() => reportService.getFineReport(), [])
  const { data: reservationReport } = useApi(() => reportService.getReservationReport(), [])
  const {
    data: librarians,
    loading: librariansLoading,
    error: librariansError,
    refetch: refetchLibrarians,
  } = useApi(() => librarianService.getAllLibrarians(), [], { enabled: role === 'Admin' })

  const [deleteRun, deleteState] = useMutation((id) => studentService.deleteStudent(id))
  const [statusRun, statusState] = useMutation(({ id, status }) => studentService.updateAccountStatus(id, status))

  const withCounts = useMemo(() => {
    return (students || []).map((s) => {
      const issues = (allIssues || []).filter((i) => i.student_id === s.student_id)
      return {
        ...s,
        borrowed_count: issues.length,
        active_count: issues.filter((i) => i.issue_status === 'Issued').length,
        overdue_count: issues.filter((i) => i.issue_status === 'Overdue').length,
      }
    })
  }, [students, allIssues])

  const rows = useMemo(() => {
    let list = withCounts
    if (status !== 'All') list = list.filter((s) => s.status === status)
    const q = debouncedQuery.toLowerCase()
    if (q) list = list.filter((s) => s.student_name.toLowerCase().includes(q) || s.roll_number.toLowerCase().includes(q) || s.department?.toLowerCase().includes(q))
    return list
  }, [withCounts, status, debouncedQuery])

  const detailStudent = withCounts.find((s) => s.student_id === detailId)

  async function handleDelete() {
    try {
      await deleteRun(deleteTarget.student_id)
      toast.success(`${deleteTarget.student_name} removed.`)
      setDeleteTarget(null)
      refetch()
    } catch (err) {
      toast.error(err?.message || 'Could not remove this student.')
    }
  }

  async function handleStatusChange() {
    if (!statusChange) return
    try {
      await statusRun({ id: statusChange.student.student_id, status: statusChange.nextStatus })
      toast.success(`${statusChange.student.student_name}'s account is now ${statusChange.nextStatus.toLowerCase()}.`)
      setStatusChange(null)
      refetch()
    } catch (err) {
      toast.error(err?.message || 'Could not update this account\'s status.')
    }
  }

  const columns = [
    {
      key: 'student_name', header: 'Student', sortable: true,
      render: (r) => (<><div className="clms-cell-title">{r.student_name}</div><div className="clms-cell-sub">{r.roll_number}</div></>),
    },
    { key: 'department', header: 'Department', sortable: true },
    { key: 'year', header: 'Year / Sem', render: (r) => (r.year || r.semester) ? `Y${r.year ?? '—'} / S${r.semester ?? '—'}` : '—' },
    { key: 'borrowed_count', header: 'Borrowed', align: 'right', sortable: true },
    { key: 'overdue_count', header: 'Overdue', align: 'right' },
    { key: 'status', header: 'Status', render: (r) => <StatusBadge status={r.status} /> },
    { key: 'account_status', header: 'Account', render: (r) => <StatusBadge status={r.account_status || 'Active'} /> },
  ]

  return (
    <div>
      <PageHeader
        title="Student Management"
        subtitle="Manage student records and review their library activity."
        actions={
          <>
            {role === 'Admin' && (
              <button className="clms-btn clms-btn-ghost" onClick={() => setLibrarianCreateOpen(true)}>
                <i className="ti ti-id-badge-2" /> Add librarian
              </button>
            )}
            <button className="clms-btn clms-btn-primary" onClick={() => setCreateOpen(true)}>
              <i className="ti ti-user-plus" /> Add student
            </button>
          </>
        }
      />

      <div className="clms-stat-row">
        <StatCard icon="ti-users" label="Total students" value={withCounts.length} />
        <StatCard icon="ti-user-check" label="Active" value={withCounts.filter((s) => s.status === 'Active').length} />
        <StatCard icon="ti-clock-exclamation" label="With overdue books" value={withCounts.filter((s) => s.overdue_count > 0).length} tone="danger" />
      </div>

      <Panel>
        <Toolbar>
          <SearchBar value={query} onChange={setQuery} placeholder="Search by name, roll number, department..." />
          <FilterChips options={STATUS_FILTERS} active={status} onChange={setStatus} />
        </Toolbar>

        <DataTable
          columns={columns}
          rows={rows}
          keyField="student_id"
          loading={loading}
          error={error}
          onRetry={refetch}
          onRowClick={(r) => setDetailId(r.student_id)}
          emptyTitle="No students found"
          emptyMessage="No students match your search or filters."
          emptyIcon="ti-users"
          rowActions={(r) => (
            <>
              <button className="clms-btn clms-btn-ghost clms-btn-small" onClick={() => setEditTarget(r)}><i className="ti ti-edit" /></button>
              {(r.account_status || 'Active') === 'Blocked' ? (
                <button className="clms-btn clms-btn-ghost clms-btn-small" onClick={() => setStatusChange({ student: r, nextStatus: 'Active' })}>
                  <i className="ti ti-lock-open" /> Unblock
                </button>
              ) : (
                <button className="clms-btn clms-btn-danger clms-btn-small" onClick={() => setStatusChange({ student: r, nextStatus: 'Blocked' })}>
                  <i className="ti ti-lock" /> Block
                </button>
              )}
              {role === 'Admin' && (
                <button className="clms-btn clms-btn-danger clms-btn-small" onClick={() => setDeleteTarget(r)}><i className="ti ti-trash" /></button>
              )}
            </>
          )}
        />
      </Panel>

      {role === 'Admin' && (
        <Panel title="Librarians" className="clms-panel" style={{ marginTop: 16 }}>
          <DataTable
            columns={[
              {
                key: 'librarian_name', header: 'Name',
                render: (l) => (<><div className="clms-cell-title">{l.librarian_name}</div><div className="clms-cell-sub">{l.employee_id}</div></>),
              },
              { key: 'email', header: 'Email' },
              { key: 'designation', header: 'Designation', render: (l) => l.designation || '—' },
              { key: 'account_status', header: 'Account', render: (l) => <StatusBadge status={l.account_status || 'Active'} /> },
            ]}
            rows={librarians || []}
            keyField="librarian_id"
            loading={librariansLoading}
            error={librariansError}
            onRetry={refetchLibrarians}
            emptyTitle="No librarians yet"
            emptyMessage="Add a librarian account to enable circulation and returns."
            emptyIcon="ti-id-badge-2"
          />
        </Panel>
      )}

      <DetailDrawer
        open={Boolean(detailStudent)}
        title={detailStudent?.student_name}
        subtitle={detailStudent?.roll_number}
        onClose={() => setDetailId(null)}
      >
        {detailStudent && (
          <StudentDetail
            student={detailStudent}
            issues={(allIssues || []).filter((i) => i.student_id === detailStudent.student_id)}
            fines={(fineReport || []).filter((f) => f.student_id === detailStudent.student_id)}
            reservations={(reservationReport || []).filter((r) => r.student_id === detailStudent.student_id)}
            onChangeStatus={(nextStatus) => setStatusChange({ student: detailStudent, nextStatus })}
          />
        )}
      </DetailDrawer>

      <StudentFormModal open={createOpen} onClose={() => setCreateOpen(false)} onSaved={refetch} />
      <StudentFormModal open={Boolean(editTarget)} student={editTarget} onClose={() => setEditTarget(null)} onSaved={refetch} />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Remove student"
        message={deleteTarget ? `Permanently remove ${deleteTarget.student_name} (${deleteTarget.roll_number})? This also deletes their account and cannot be undone.` : ''}
        confirmLabel="Remove"
        loading={deleteState.loading}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      <ConfirmDialog
        open={Boolean(statusChange)}
        title={`${statusChange?.nextStatus === 'Blocked' ? 'Block' : statusChange?.nextStatus === 'Active' ? 'Activate' : 'Deactivate'} account`}
        message={
          statusChange
            ? statusChange.nextStatus === 'Blocked'
              ? `Block ${statusChange.student.student_name}'s account? They won't be able to borrow books, renew, or make reservations until unblocked.`
              : `Set ${statusChange.student.student_name}'s account status to ${statusChange.nextStatus}?`
            : ''
        }
        confirmLabel={statusChange?.nextStatus === 'Blocked' ? 'Block' : 'Confirm'}
        tone={statusChange?.nextStatus === 'Blocked' ? 'danger' : 'neutral'}
        loading={statusState.loading}
        onConfirm={handleStatusChange}
        onCancel={() => setStatusChange(null)}
      />

      {role === 'Admin' && (
        <LibrarianFormModal
          open={librarianCreateOpen}
          onClose={() => setLibrarianCreateOpen(false)}
          onSaved={refetchLibrarians}
        />
      )}
    </div>
  )
}

function StudentDetail({ student, issues, fines, reservations, onChangeStatus }) {
  const active = issues.filter((i) => i.issue_status === 'Issued')
  const history = issues.filter((i) => i.issue_status !== 'Issued')
  const accountStatus = student.account_status || 'Active'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
      <div>
        <div className="clms-panel-head"><h2>Profile</h2></div>
        <div className="clms-row-card-fields">
          <div className="clms-row-card-field"><span>Email</span><span>{student.email || '—'}</span></div>
          <div className="clms-row-card-field"><span>Phone</span><span>{student.phone || '—'}</span></div>
          <div className="clms-row-card-field"><span>Department</span><span>{student.department}</span></div>
          <div className="clms-row-card-field"><span>Year / Semester</span><span>Y{student.year} / S{student.semester}</span></div>
          <div className="clms-row-card-field"><span>Admission year</span><span>{student.admission_year || '—'}</span></div>
          <div className="clms-row-card-field"><span>Student status</span><StatusBadge status={student.status} /></div>
          <div className="clms-row-card-field"><span>Account status</span><StatusBadge status={accountStatus} /></div>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
          {accountStatus !== 'Active' && (
            <button className="clms-btn clms-btn-ghost clms-btn-small" onClick={() => onChangeStatus('Active')}>
              <i className="ti ti-circle-check" /> Activate
            </button>
          )}
          {accountStatus !== 'Inactive' && (
            <button className="clms-btn clms-btn-ghost clms-btn-small" onClick={() => onChangeStatus('Inactive')}>
              <i className="ti ti-player-pause" /> Deactivate
            </button>
          )}
          {accountStatus === 'Blocked' ? (
            <button className="clms-btn clms-btn-ghost clms-btn-small" onClick={() => onChangeStatus('Active')}>
              <i className="ti ti-lock-open" /> Unblock
            </button>
          ) : (
            <button className="clms-btn clms-btn-danger clms-btn-small" onClick={() => onChangeStatus('Blocked')}>
              <i className="ti ti-lock" /> Block
            </button>
          )}
        </div>
      </div>

      <div>
        <div className="clms-panel-head"><h2>Current loans ({active.length})</h2></div>
        {active.length === 0 ? <EmptyState icon="ti-book-2" title="No active loans" /> : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {active.map((i) => (
              <div key={i.issue_id} className="clms-row-card">
                <div className="clms-row-card-field"><span>{i.title}</span><span>{formatDate(i.due_date)}</span></div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <div className="clms-panel-head"><h2>Reservation history ({reservations.length})</h2></div>
        {reservations.length === 0 ? <EmptyState icon="ti-bookmark" title="No reservations" /> : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {reservations.map((r) => (
              <div key={r.reservation_id} className="clms-row-card">
                <div className="clms-row-card-field"><span>{r.title}</span><StatusBadge status={r.status} /></div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <div className="clms-panel-head"><h2>Fine history ({fines.length})</h2></div>
        {fines.length === 0 ? <EmptyState icon="ti-receipt" title="No fines" /> : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {fines.map((f) => (
              <div key={f.fine_id} className="clms-row-card">
                <div className="clms-row-card-field"><span>{f.fine_type}</span><span>{formatCurrency(f.amount)}</span></div>
                <div className="clms-row-card-field"><span>Status</span><StatusBadge status={f.payment_status} /></div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <div className="clms-panel-head"><h2>Borrowing history ({history.length})</h2></div>
        {history.length === 0 ? <EmptyState icon="ti-history" title="No past loans" /> : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {history.map((i) => (
              <div key={i.issue_id} className="clms-row-card">
                <div className="clms-row-card-field"><span>{i.title}</span><StatusBadge status={i.issue_status} /></div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function StudentFormModal({ open, student, onClose, onSaved }) {
  const toast = useToast()
  const isEdit = Boolean(student)
  const [form, setForm] = useState(() => emptyForm(student))

  const key = student?.student_id || 'new'
  const [lastKey, setLastKey] = useState(key)
  if (key !== lastKey) {
    setLastKey(key)
    setForm(emptyForm(student))
  }

  const [createRun, createState] = useMutation((payload) => studentService.createStudent(payload))
  const [updateRun, updateState] = useMutation(({ id, payload }) => studentService.updateStudent(id, payload))
  const loading = createState.loading || updateState.loading

  function set(field, value) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.student_name || !form.roll_number || (!isEdit && (!form.email || !form.password))) {
      toast.error('Please fill in all required fields.')
      return
    }
    try {
      if (isEdit) {
        await updateRun({
          id: student.student_id,
          payload: {
            student_name: form.student_name,
            department: form.department,
            year: Number(form.year) || 1,
            semester: Number(form.semester) || 1,
            phone: form.phone,
            address: form.address,
            status: form.status,
          },
        })
        toast.success('Student updated.')
      } else {
        await createRun({
          username: form.roll_number,
          email: form.email,
          password: form.password,
          roll_number: form.roll_number,
          student_name: form.student_name,
          department: form.department,
          year: Number(form.year) || 1,
          semester: Number(form.semester) || 1,
          phone: form.phone,
          address: form.address,
          admission_year: form.admission_year ? Number(form.admission_year) : undefined,
        })
        toast.success('Student added.')
      }
      onSaved?.()
      onClose()
    } catch (err) {
      toast.error(err?.message || 'Could not save this student.')
    }
  }

  return (
    <Modal open={open} title={isEdit ? 'Edit student' : 'Add student'} onClose={onClose} width={560}>
      <form onSubmit={handleSubmit}>
        <div className="clms-field-row">
          <div className="clms-field">
            <label>Full name<span className="required">*</span></label>
            <input className="clms-input" value={form.student_name} onChange={(e) => set('student_name', e.target.value)} required />
          </div>
          <div className="clms-field">
            <label>Roll number<span className="required">*</span></label>
            <input className="clms-input" value={form.roll_number} onChange={(e) => set('roll_number', e.target.value)} required disabled={isEdit} />
          </div>
        </div>

        {!isEdit && (
          <div className="clms-field-row">
            <div className="clms-field">
              <label>Email<span className="required">*</span></label>
              <input className="clms-input" type="email" value={form.email} onChange={(e) => set('email', e.target.value)} required />
            </div>
            <div className="clms-field">
              <label>Password<span className="required">*</span></label>
              <input className="clms-input" type="password" value={form.password} onChange={(e) => set('password', e.target.value)} required />
            </div>
          </div>
        )}

        <div className="clms-field-row">
          <div className="clms-field">
            <label>Department</label>
            <input className="clms-input" value={form.department} onChange={(e) => set('department', e.target.value)} />
          </div>
          <div className="clms-field-row" style={{ gridTemplateColumns: '1fr 1fr' }}>
            <div className="clms-field">
              <label>Year</label>
              <input className="clms-input" type="number" min="1" max="6" value={form.year} onChange={(e) => set('year', e.target.value)} />
            </div>
            <div className="clms-field">
              <label>Semester</label>
              <input className="clms-input" type="number" min="1" max="12" value={form.semester} onChange={(e) => set('semester', e.target.value)} />
            </div>
          </div>
        </div>

        <div className="clms-field-row">
          <div className="clms-field">
            <label>Phone</label>
            <input className="clms-input" value={form.phone} onChange={(e) => set('phone', e.target.value)} />
          </div>
          {isEdit ? (
            <div className="clms-field">
              <label>Status</label>
              <select className="clms-select" style={{ width: '100%' }} value={form.status} onChange={(e) => set('status', e.target.value)}>
                <option>Active</option>
                <option>Inactive</option>
                <option>Graduated</option>
              </select>
            </div>
          ) : (
            <div className="clms-field">
              <label>Admission year</label>
              <input className="clms-input" type="number" value={form.admission_year} onChange={(e) => set('admission_year', e.target.value)} />
            </div>
          )}
        </div>

        <div className="clms-field">
          <label>Address</label>
          <textarea className="clms-textarea" rows={2} value={form.address} onChange={(e) => set('address', e.target.value)} />
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <button type="button" className="clms-btn clms-btn-ghost" onClick={onClose}>Cancel</button>
          <button type="submit" className="clms-btn clms-btn-primary" disabled={loading}>
            {loading && <span className="clms-spinner" />} {isEdit ? 'Save changes' : 'Add student'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

function emptyForm(student) {
  if (!student) {
    return { student_name: '', roll_number: '', email: '', password: '', department: '', year: 1, semester: 1, phone: '', address: '', admission_year: '', status: 'Active' }
  }
  return {
    student_name: student.student_name || '',
    roll_number: student.roll_number || '',
    email: student.email || '',
    password: '',
    department: student.department || '',
    year: student.year || 1,
    semester: student.semester || 1,
    phone: student.phone || '',
    address: student.address || '',
    admission_year: student.admission_year || '',
    status: student.status || 'Active',
  }
}

const emptyLibrarianForm = { librarian_name: '', employee_id: '', email: '', password: '', phone: '', designation: '' }

function LibrarianFormModal({ open, onClose, onSaved }) {
  const toast = useToast()
  const [form, setForm] = useState(emptyLibrarianForm)
  const [createRun, createState] = useMutation((payload) => librarianService.createLibrarian(payload))

  function set(field, value) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  function handleClose() {
    setForm(emptyLibrarianForm)
    onClose()
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.librarian_name || !form.employee_id || !form.email || !form.password) {
      toast.error('Please fill in all required fields.')
      return
    }
    if (form.password.length < 8) {
      toast.error('Password must be at least 8 characters.')
      return
    }
    try {
      await createRun({
        username: form.employee_id,
        email: form.email,
        password: form.password,
        employee_id: form.employee_id,
        librarian_name: form.librarian_name,
        phone: form.phone || undefined,
        designation: form.designation || undefined,
      })
      toast.success(`Librarian account created for ${form.librarian_name}. Share the password with them directly — it won't be shown again.`)
      setForm(emptyLibrarianForm)
      onSaved?.()
      onClose()
    } catch (err) {
      toast.error(err?.message || 'Could not create this librarian account.')
    }
  }

  return (
    <Modal open={open} title="Add librarian" onClose={handleClose} width={520}>
      <form onSubmit={handleSubmit}>
        <p className="clms-hint" style={{ marginBottom: 14 }}>
          Creates a real login (role = Librarian) plus their staff record. Set an initial password now and hand it
          to them directly — no endpoint will ever return it again.
        </p>
        <div className="clms-field-row">
          <div className="clms-field">
            <label>Full name<span className="required">*</span></label>
            <input className="clms-input" value={form.librarian_name} onChange={(e) => set('librarian_name', e.target.value)} required />
          </div>
          <div className="clms-field">
            <label>Employee ID<span className="required">*</span></label>
            <input className="clms-input" value={form.employee_id} onChange={(e) => set('employee_id', e.target.value)} required />
          </div>
        </div>
        <div className="clms-field-row">
          <div className="clms-field">
            <label>Email<span className="required">*</span></label>
            <input className="clms-input" type="email" value={form.email} onChange={(e) => set('email', e.target.value)} required />
          </div>
          <div className="clms-field">
            <label>Initial password<span className="required">*</span></label>
            <input className="clms-input" type="password" value={form.password} onChange={(e) => set('password', e.target.value)} required />
          </div>
        </div>
        <div className="clms-field-row">
          <div className="clms-field">
            <label>Phone</label>
            <input className="clms-input" value={form.phone} onChange={(e) => set('phone', e.target.value)} />
          </div>
          <div className="clms-field">
            <label>Designation</label>
            <input className="clms-input" value={form.designation} onChange={(e) => set('designation', e.target.value)} placeholder="e.g. Circulation Librarian" />
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <button type="button" className="clms-btn clms-btn-ghost" onClick={handleClose}>Cancel</button>
          <button type="submit" className="clms-btn clms-btn-primary" disabled={createState.loading}>
            {createState.loading && <span className="clms-spinner" />} Create librarian
          </button>
        </div>
      </form>
    </Modal>
  )
}
