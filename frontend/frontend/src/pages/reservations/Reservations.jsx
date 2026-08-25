import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PageHeader } from '../../components/common/PageHeader'
import { Panel } from '../../components/common/Panel'
import { StatCard } from '../../components/common/StatCard'
import { StatusBadge } from '../../components/common/StatusBadge'
import { DataTable } from '../../components/common/DataTable'
import { Toolbar, FilterChips } from '../../components/common/FilterBar'
import { SearchBar } from '../../components/common/SearchBar'
import { ConfirmDialog } from '../../components/common/ConfirmDialog'
import { UnavailableState } from '../../components/common/ErrorState'
import { useApi, useMutation } from '../../hooks/useApi'
import { useDebounce } from '../../hooks/useDebounce'
import { useToast } from '../../context/ToastContext'
import { useAuth } from '../../context/AuthContext'
import * as reservationService from '../../services/reservationService'
import { formatDate } from '../../utils/date'

const STATUS_FILTERS = ['All', 'Pending', 'Approved', 'Completed', 'Cancelled', 'Expired']

export default function Reservations() {
  const { role } = useAuth()
  const isStaff = role === 'Admin' || role === 'Librarian'
  const toast = useToast()

  const [status, setStatus] = useState('All')
  const [query, setQuery] = useState('')
  const debouncedQuery = useDebounce(query, 250)
  const [cancelTarget, setCancelTarget] = useState(null)

  const { data: reservations, loading, error, refetch } = useApi(
    () => reservationService.getAllReservations(),
    [],
    { enabled: isStaff }
  )
  const [updateRun, updateState] = useMutation(({ id, payload }) => reservationService.updateReservation(id, payload))
  const [deleteRun, deleteState] = useMutation((id) => reservationService.deleteReservation(id))

  const rows = useMemo(() => {
    let list = reservations || []
    if (status !== 'All') list = list.filter((r) => r.status === status)
    const q = debouncedQuery.toLowerCase()
    if (q) list = list.filter((r) => String(r.book_id).includes(q) || String(r.student_id).includes(q))
    return list
  }, [reservations, status, debouncedQuery])

  async function setReservationStatus(row, newStatus) {
    try {
      await updateRun({ id: row.reservation_id, payload: { expiry_date: row.expiry_date, status: newStatus } })
      toast.success(`Reservation #${row.reservation_id} marked ${newStatus.toLowerCase()}.`)
      refetch()
    } catch (err) {
      toast.error(err?.message || 'Could not update this reservation.')
    }
  }

  async function handleDelete() {
    try {
      await deleteRun(cancelTarget.reservation_id)
      toast.success('Reservation deleted.')
      setCancelTarget(null)
      refetch()
    } catch (err) {
      toast.error(err?.message || 'Could not delete this reservation.')
    }
  }

  if (!isStaff) {
    return <MyReservations />
  }

  const columns = [
    { key: 'reservation_id', header: 'ID', mono: true, sortable: true },
    { key: 'student_id', header: 'Student', render: (r) => `#${r.student_id}`, sortable: true },
    { key: 'book_id', header: 'Book', render: (r) => `#${r.book_id}`, sortable: true },
    { key: 'reservation_date', header: 'Reserved', sortable: true, render: (r) => formatDate(r.reservation_date) },
    { key: 'expiry_date', header: 'Expires', sortable: true, render: (r) => formatDate(r.expiry_date) },
    { key: 'status', header: 'Status', render: (r) => <StatusBadge status={r.status} /> },
  ]

  return (
    <div>
      <PageHeader title="Reservations" subtitle="Review the reservation queue and process holds." />

      <div className="clms-stat-row">
        <StatCard icon="ti-bookmark" label="Total" value={(reservations || []).length} />
        <StatCard icon="ti-hourglass" label="Pending" value={(reservations || []).filter((r) => r.status === 'Pending').length} tone="warning" />
        <StatCard icon="ti-circle-check" label="Approved" value={(reservations || []).filter((r) => r.status === 'Approved').length} />
        <StatCard icon="ti-circle-x" label="Cancelled / Expired" value={(reservations || []).filter((r) => ['Cancelled', 'Expired'].includes(r.status)).length} tone="danger" />
      </div>

      <Panel>
        <Toolbar>
          <SearchBar value={query} onChange={setQuery} placeholder="Search by student ID or book ID..." />
          <FilterChips options={STATUS_FILTERS} active={status} onChange={setStatus} />
        </Toolbar>

        <DataTable
          columns={columns}
          rows={rows}
          keyField="reservation_id"
          loading={loading}
          error={error}
          onRetry={refetch}
          emptyTitle="No reservations"
          emptyMessage="No reservations match your filters."
          emptyIcon="ti-bookmark"
          rowActions={(r) => (
            <>
              {r.status === 'Pending' && (
                <button className="clms-btn clms-btn-ghost clms-btn-small" disabled={updateState.loading} onClick={() => setReservationStatus(r, 'Approved')}>
                  Approve
                </button>
              )}
              {r.status === 'Approved' && (
                <button className="clms-btn clms-btn-ghost clms-btn-small" disabled={updateState.loading} onClick={() => setReservationStatus(r, 'Completed')}>
                  Complete
                </button>
              )}
              {['Pending', 'Approved'].includes(r.status) && (
                <button className="clms-btn clms-btn-ghost clms-btn-small" disabled={updateState.loading} onClick={() => setReservationStatus(r, 'Cancelled')}>
                  Cancel
                </button>
              )}
              <button className="clms-btn clms-btn-danger clms-btn-small" onClick={() => setCancelTarget(r)}>
                <i className="ti ti-trash" />
              </button>
            </>
          )}
        />
      </Panel>

      <ConfirmDialog
        open={Boolean(cancelTarget)}
        title="Delete reservation"
        message={cancelTarget ? `Permanently delete reservation #${cancelTarget.reservation_id}? This cannot be undone.` : ''}
        confirmLabel="Delete"
        loading={deleteState.loading}
        onConfirm={handleDelete}
        onCancel={() => setCancelTarget(null)}
      />
    </div>
  )
}

function MyReservations() {
  const { studentProfileStatus } = useAuth()
  const navigate = useNavigate()
  const [status, setStatus] = useState('All')
  const enabled = studentProfileStatus === 'ready'

  const { data: reservations, loading, error, refetch } = useApi(
    () => reservationService.getMyReservations(),
    [enabled],
    { enabled }
  )

  const rows = useMemo(() => {
    const list = reservations || []
    if (status === 'All') return list
    return list.filter((r) => r.status === status)
  }, [reservations, status])

  const headerActions = (
    <button className="clms-btn clms-btn-primary" onClick={() => navigate('/library')}>
      <i className="ti ti-search" /> Browse catalog to reserve
    </button>
  )

  if (studentProfileStatus === 'unavailable') {
    return (
      <div>
        <PageHeader title="Reservations" subtitle="Hold a title while every copy is checked out." actions={headerActions} />
        <Panel>
          <UnavailableState
            title="No student profile linked"
            message="Your account isn't linked to a student record yet — ask an admin to add one from Student Management, then your reservations will appear here."
          />
        </Panel>
      </div>
    )
  }

  const columns = [
    { key: 'title', header: 'Book' },
    { key: 'reservation_date', header: 'Reserved', sortable: true, render: (r) => formatDate(r.reservation_date) },
    { key: 'expiry_date', header: 'Expires', sortable: true, render: (r) => formatDate(r.expiry_date) },
    { key: 'status', header: 'Status', render: (r) => <StatusBadge status={r.status} /> },
  ]

  return (
    <div>
      <PageHeader title="Reservations" subtitle="Hold a title while every copy is checked out." actions={headerActions} />

      <div className="clms-stat-row">
        <StatCard icon="ti-bookmark" label="Total" value={(reservations || []).length} />
        <StatCard icon="ti-hourglass" label="Pending" value={(reservations || []).filter((r) => r.status === 'Pending').length} tone="warning" />
        <StatCard icon="ti-circle-check" label="Approved" value={(reservations || []).filter((r) => r.status === 'Approved').length} />
        <StatCard icon="ti-circle-x" label="Cancelled / Expired" value={(reservations || []).filter((r) => ['Cancelled', 'Expired'].includes(r.status)).length} tone="danger" />
      </div>

      <Panel>
        <Toolbar>
          <FilterChips options={STATUS_FILTERS} active={status} onChange={setStatus} />
        </Toolbar>

        <DataTable
          columns={columns}
          rows={rows}
          keyField="reservation_id"
          loading={loading || studentProfileStatus === 'loading'}
          error={error}
          onRetry={refetch}
          emptyTitle="No reservations"
          emptyMessage="You haven't reserved anything yet — browse the catalog to hold a title."
          emptyIcon="ti-bookmark"
        />
      </Panel>
    </div>
  )
}
