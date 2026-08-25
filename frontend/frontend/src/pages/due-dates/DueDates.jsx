import { useMemo, useState } from 'react'
import { PageHeader } from '../../components/common/PageHeader'
import { Panel } from '../../components/common/Panel'
import { StatCard } from '../../components/common/StatCard'
import { StatusBadge } from '../../components/common/StatusBadge'
import { DataTable } from '../../components/common/DataTable'
import { Toolbar, FilterChips } from '../../components/common/FilterBar'
import { SearchBar } from '../../components/common/SearchBar'
import { UnavailableState } from '../../components/common/ErrorState'
import { useApi } from '../../hooks/useApi'
import { useDebounce } from '../../hooks/useDebounce'
import { useAuth } from '../../context/AuthContext'
import * as issueService from '../../services/issueService'
import { formatDate, dueStatus } from '../../utils/date'

const FILTERS = ['All', 'Due today', 'Due soon', 'Overdue']

export default function DueDates() {
  const { role, studentProfile, studentProfileStatus } = useAuth()
  const isStaff = role === 'Admin' || role === 'Librarian'
  const [filter, setFilter] = useState('All')
  const [query, setQuery] = useState('')
  const debouncedQuery = useDebounce(query, 250)

  const studentReady = studentProfileStatus === 'ready' && Boolean(studentProfile?.student_id)

  const { data: activeIssues, loading, error, refetch } = useApi(
    () => (isStaff ? issueService.getActiveIssues() : issueService.getStudentActiveIssues(studentProfile.student_id)),
    [isStaff, studentProfile?.student_id],
    { enabled: isStaff || studentReady }
  )

  const rows = useMemo(() => {
    let list = activeIssues || []
    const q = debouncedQuery.toLowerCase()
    if (q) {
      list = list.filter(
        (i) => i.title?.toLowerCase().includes(q) || i.student_name?.toLowerCase().includes(q) || i.roll_number?.toLowerCase().includes(q)
      )
    }
    if (filter !== 'All') {
      list = list.filter((i) => {
        const s = dueStatus(i.due_date)
        if (filter === 'Due today') return s.key === 'today'
        if (filter === 'Due soon') return s.key === 'soon' || s.key === 'today'
        if (filter === 'Overdue') return s.key === 'overdue'
        return true
      })
    }
    return list
  }, [activeIssues, filter, debouncedQuery])

  const counts = useMemo(() => {
    const list = activeIssues || []
    return {
      today: list.filter((i) => dueStatus(i.due_date).key === 'today').length,
      soon: list.filter((i) => dueStatus(i.due_date).key === 'soon').length,
      overdue: list.filter((i) => dueStatus(i.due_date).key === 'overdue').length,
    }
  }, [activeIssues])

  const columns = [
    ...(isStaff
      ? [{
          key: 'student', header: 'Student', sortable: true, sortValue: (r) => r.student_name,
          render: (r) => (<><div className="clms-cell-title">{r.student_name}</div><div className="clms-cell-sub">{r.roll_number}</div></>),
        }]
      : []),
    { key: 'title', header: 'Book', sortable: true },
    { key: 'accession_number', header: 'Copy', mono: true },
    { key: 'issue_date', header: 'Issued', render: (r) => formatDate(r.issue_date) },
    { key: 'due_date', header: 'Due date', sortable: true, render: (r) => formatDate(r.due_date) },
    {
      key: 'status', header: 'Status',
      render: (r) => { const s = dueStatus(r.due_date); return <StatusBadge status={s.label} tone={s.tone} /> },
    },
    {
      key: 'renew', header: 'Renewal',
      render: () => <span className="clms-badge clms-badge-neutral" title="Not supported by the backend yet">Not available</span>,
    },
  ]

  if (!isStaff && studentProfileStatus === 'unavailable') {
    return (
      <div>
        <PageHeader title="Due Dates" subtitle="Track your active loans and avoid late fees." />
        <Panel>
          <UnavailableState
            title="Your due dates aren't available yet"
            message="Your account has no linked student profile yet — ask an admin to add one from Student Management, then this will populate automatically."
          />
        </Panel>
      </div>
    )
  }

  return (
    <div>
      <PageHeader title="Due Dates" subtitle={isStaff ? 'Track every active loan across the library.' : 'Track your active loans and avoid late fees.'} />

      <div className="clms-stat-row">
        <StatCard icon="ti-calendar-due" label="Due today" value={counts.today} tone="warning" />
        <StatCard icon="ti-clock" label="Due soon (≤3 days)" value={counts.soon} tone="warning" />
        <StatCard icon="ti-clock-exclamation" label="Overdue" value={counts.overdue} tone="danger" />
      </div>

      <Panel>
        <Toolbar>
          <SearchBar value={query} onChange={setQuery} placeholder={isStaff ? 'Search student or book...' : 'Search your books...'} />
          <FilterChips options={FILTERS} active={filter} onChange={setFilter} />
        </Toolbar>

        <DataTable
          columns={columns}
          rows={rows}
          keyField="issue_id"
          loading={loading}
          error={error}
          onRetry={refetch}
          emptyTitle="No active loans"
          emptyMessage={isStaff ? 'No books are currently on loan.' : "You don't have any borrowed books right now."}
          emptyIcon="ti-calendar-due"
        />
      </Panel>
    </div>
  )
}
