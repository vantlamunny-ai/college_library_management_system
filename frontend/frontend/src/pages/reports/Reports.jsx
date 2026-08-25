import { useMemo, useState } from 'react'
import { PageHeader } from '../../components/common/PageHeader'
import { Panel } from '../../components/common/Panel'
import { StatCard } from '../../components/common/StatCard'
import { StatusBadge } from '../../components/common/StatusBadge'
import { DataTable } from '../../components/common/DataTable'
import { Toolbar, FilterChips } from '../../components/common/FilterBar'
import { SearchBar } from '../../components/common/SearchBar'
import { BarChart } from '../../components/common/BarChart'
import { DonutChart } from '../../components/common/DonutChart'
import { ErrorState } from '../../components/common/ErrorState'
import { useApi } from '../../hooks/useApi'
import { useDebounce } from '../../hooks/useDebounce'
import * as reportService from '../../services/reportService'
import { formatDate, groupByMonth } from '../../utils/date'
import { formatCurrency } from '../../utils/format'

const TABS = ['Overview', 'Books', 'Circulation', 'Returns', 'Students', 'Fines', 'Reservations', 'Copies']

export default function Reports() {
  const [tab, setTab] = useState('Overview')
  const [query, setQuery] = useState('')
  const debouncedQuery = useDebounce(query, 250)

  const { data: dashboard, error: dashboardError, refetch: refetchDashboard } = useApi(() => reportService.getDashboardReport(), [])
  const { data: books, loading: booksLoading } = useApi(() => reportService.getBookReport(), [], { enabled: tab === 'Books' || tab === 'Overview' })
  const { data: issues, loading: issuesLoading } = useApi(() => reportService.getIssueReport(), [], { enabled: tab === 'Circulation' || tab === 'Overview' })
  const { data: returns, loading: returnsLoading } = useApi(() => reportService.getReturnReport(), [], { enabled: tab === 'Returns' })
  const { data: students, loading: studentsLoading } = useApi(() => reportService.getStudentReport(), [], { enabled: tab === 'Students' })
  const { data: fines, loading: finesLoading } = useApi(() => reportService.getFineReport(), [], { enabled: tab === 'Fines' || tab === 'Overview' })
  const { data: reservations, loading: reservationsLoading } = useApi(() => reportService.getReservationReport(), [], { enabled: tab === 'Reservations' })
  const { data: copies, loading: copiesLoading } = useApi(() => reportService.getCopyReport(), [], { enabled: tab === 'Copies' })

  const monthlyIssues = useMemo(() => groupByMonth(issues || [], 'issue_date', 6), [issues])
  const fineDonut = useMemo(() => {
    const list = fines || []
    return [
      { label: 'Pending', value: list.filter((f) => f.payment_status === 'Pending').length },
      { label: 'Paid', value: list.filter((f) => f.payment_status === 'Paid').length },
      { label: 'Waived', value: list.filter((f) => f.payment_status === 'Waived').length },
    ]
  }, [fines])

  function filterRows(list, fields) {
    if (!debouncedQuery) return list
    const q = debouncedQuery.toLowerCase()
    return (list || []).filter((row) => fields.some((f) => String(row[f] ?? '').toLowerCase().includes(q)))
  }

  return (
    <div>
      <PageHeader title="Library Reports" subtitle="Live analytics generated directly from the library database." />

      <Toolbar>
        <FilterChips options={TABS} active={tab} onChange={setTab} />
        {tab !== 'Overview' && <SearchBar value={query} onChange={setQuery} placeholder="Search this report..." />}
      </Toolbar>

      {tab === 'Overview' && (
        <>
          {dashboardError ? (
            <Panel><ErrorState message="Could not load the summary metrics." onRetry={refetchDashboard} /></Panel>
          ) : (
            <div className="clms-stat-row">
              <StatCard icon="ti-books" label="Total books" value={dashboard?.total_books || 0} />
              <StatCard icon="ti-users" label="Active students" value={dashboard?.active_students || 0} tone="info" />
              <StatCard icon="ti-clock-exclamation" label="Overdue" value={dashboard?.overdue_books || 0} tone="danger" />
              <StatCard icon="ti-receipt" label="Pending fines" value={dashboard?.pending_fines || 0} prefix="₹" tone="warning" />
            </div>
          )}
          <div className="clms-grid-2" style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 16 }}>
            <Panel title="Issues — last 6 months">
              <BarChart data={monthlyIssues} />
            </Panel>
            <Panel title="Fines by status">
              <DonutChart segments={fineDonut} />
            </Panel>
          </div>
        </>
      )}

      {tab === 'Books' && (
        <Panel>
          <DataTable
            loading={booksLoading}
            rows={filterRows(books, ['title', 'isbn', 'category_name'])}
            keyField="book_id"
            emptyIcon="ti-books"
            emptyTitle="No books"
            columns={[
              { key: 'title', header: 'Title', sortable: true },
              { key: 'isbn', header: 'ISBN', mono: true },
              { key: 'category_name', header: 'Category', render: (r) => r.category_name || '—' },
              { key: 'total_copies', header: 'Copies', sortable: true, align: 'right' },
              { key: 'available_copies', header: 'Available', sortable: true, align: 'right' },
              { key: 'issued_copies', header: 'Issued', sortable: true, align: 'right' },
            ]}
          />
        </Panel>
      )}

      {tab === 'Circulation' && (
        <Panel>
          <DataTable
            loading={issuesLoading}
            rows={filterRows(issues, ['title', 'student_name', 'roll_number'])}
            keyField="issue_id"
            emptyIcon="ti-transfer"
            emptyTitle="No circulation data"
            columns={[
              { key: 'student_name', header: 'Student', sortable: true },
              { key: 'title', header: 'Book', sortable: true },
              { key: 'issue_date', header: 'Issued', sortable: true, render: (r) => formatDate(r.issue_date) },
              { key: 'due_date', header: 'Due', sortable: true, render: (r) => formatDate(r.due_date) },
              { key: 'status', header: 'Status', render: (r) => <StatusBadge status={r.status} /> },
              { key: 'renewal_count', header: 'Renewals', align: 'right' },
            ]}
          />
        </Panel>
      )}

      {tab === 'Returns' && (
        <Panel>
          <DataTable
            loading={returnsLoading}
            rows={filterRows(returns, ['title', 'student_name', 'roll_number'])}
            keyField="return_id"
            emptyIcon="ti-corner-down-left"
            emptyTitle="No returns yet"
            columns={[
              { key: 'student_name', header: 'Student', sortable: true },
              { key: 'title', header: 'Book', sortable: true },
              { key: 'return_date', header: 'Returned', sortable: true, render: (r) => formatDate(r.return_date) },
              { key: 'condition_status', header: 'Condition', render: (r) => <StatusBadge status={r.condition_status} /> },
              { key: 'processed_by', header: 'Processed by', render: (r) => r.processed_by || '—' },
            ]}
          />
        </Panel>
      )}

      {tab === 'Students' && (
        <Panel>
          <DataTable
            loading={studentsLoading}
            rows={filterRows(students, ['student_name', 'roll_number', 'department'])}
            keyField="student_id"
            emptyIcon="ti-users"
            emptyTitle="No students"
            columns={[
              { key: 'student_name', header: 'Name', sortable: true },
              { key: 'roll_number', header: 'Roll No.', mono: true },
              { key: 'department', header: 'Department' },
              { key: 'total_books_borrowed', header: 'Borrowed', align: 'right', sortable: true },
              { key: 'currently_issued', header: 'Active', align: 'right' },
              { key: 'overdue_books', header: 'Overdue', align: 'right' },
              { key: 'status', header: 'Status', render: (r) => <StatusBadge status={r.status} /> },
            ]}
          />
        </Panel>
      )}

      {tab === 'Fines' && (
        <Panel>
          <DataTable
            loading={finesLoading}
            rows={filterRows(fines, ['student_name', 'roll_number', 'title'])}
            keyField="fine_id"
            emptyIcon="ti-receipt"
            emptyTitle="No fines"
            columns={[
              { key: 'student_name', header: 'Student', sortable: true },
              { key: 'title', header: 'Book' },
              { key: 'fine_type', header: 'Type' },
              { key: 'amount', header: 'Amount', sortable: true, render: (r) => formatCurrency(r.amount) },
              { key: 'payment_status', header: 'Status', render: (r) => <StatusBadge status={r.payment_status} /> },
            ]}
          />
        </Panel>
      )}

      {tab === 'Reservations' && (
        <Panel>
          <DataTable
            loading={reservationsLoading}
            rows={filterRows(reservations, ['student_name', 'roll_number', 'title'])}
            keyField="reservation_id"
            emptyIcon="ti-bookmark"
            emptyTitle="No reservations"
            columns={[
              { key: 'student_name', header: 'Student', sortable: true },
              { key: 'title', header: 'Book' },
              { key: 'reservation_date', header: 'Reserved', sortable: true, render: (r) => formatDate(r.reservation_date) },
              { key: 'expiry_date', header: 'Expires', render: (r) => formatDate(r.expiry_date) },
              { key: 'status', header: 'Status', render: (r) => <StatusBadge status={r.status} /> },
            ]}
          />
        </Panel>
      )}

      {tab === 'Copies' && (
        <Panel>
          <DataTable
            loading={copiesLoading}
            rows={filterRows(copies, ['title', 'accession_number', 'category_name'])}
            keyField="copy_id"
            emptyIcon="ti-books"
            emptyTitle="No copies"
            columns={[
              { key: 'title', header: 'Book', sortable: true },
              { key: 'accession_number', header: 'Accession', mono: true },
              { key: 'shelf_location', header: 'Location', render: (r) => r.shelf_location || '—' },
              { key: 'condition_status', header: 'Condition', render: (r) => <StatusBadge status={r.condition_status} /> },
              { key: 'availability_status', header: 'Availability', render: (r) => <StatusBadge status={r.availability_status} /> },
            ]}
          />
        </Panel>
      )}
    </div>
  )
}
