import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import logo from '../../assets/nri-logo-white.png'
import { useAuth } from '../../context/AuthContext'
import { useApi } from '../../hooks/useApi'
import * as issueService from '../../services/issueService'
import * as notificationService from '../../services/notificationService'
import { daysUntil, countdownParts, groupByMonth, formatDate } from '../../utils/date'
import { formatCurrency } from '../../utils/format'
import { StatusBadge } from '../../components/common/StatusBadge'
import { Avatar } from '../../components/common/Avatar'
import { ThemeSwitcher } from '../../components/common/ThemeSwitcher'
import * as reservationService from '../../services/reservationService'
import * as fineService from '../../services/fineService'
import './StudentDashboard.css'

export default function StudentDashboard() {
  const { user, studentProfile, studentProfileStatus, logout } = useAuth()
  const [query, setQuery] = useState('')
  const [mobileOpen, setMobileOpen] = useState(false)
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate('/login', { replace: true })
  }

  const studentId = studentProfile?.student_id
  const profileReady = studentProfileStatus === 'ready' && Boolean(studentId)

  const {
    data: activeIssues,
    loading: issuesLoading,
    error: issuesError,
    refetch: refetchIssues
  } = useApi(
    () => issueService.getStudentActiveIssues(studentId),
    [studentId],
    { enabled: profileReady }
  )

  const { data: allIssues } = useApi(
    () => issueService.getStudentIssues(studentId),
    [studentId],
    { enabled: profileReady }
  )

  const { data: notifications } = useApi(
    () => notificationService.getMyNotifications(),
    []
  )

  const {
    data: myReservations,
    loading: reservationsLoading,
    error: reservationsError,
    refetch: refetchReservations,
  } = useApi(
    () => reservationService.getMyReservations(),
    [profileReady],
    { enabled: profileReady }
  )

  const {
    data: myFines,
    loading: finesLoading,
    error: finesError,
    refetch: refetchFines,
  } = useApi(
    () => fineService.getMyFines(),
    [profileReady],
    { enabled: profileReady }
  )

  const reservations = Array.isArray(myReservations)
    ? myReservations
    : []

  const fines = Array.isArray(myFines)
    ? myFines
    : []

  const activeReservations = reservations.filter(
    (r) => ['Pending', 'Approved'].includes(r.status)
  )

  const pendingFines = fines.filter(
    (f) => f.payment_status === 'Pending'
  )

  const issues = Array.isArray(activeIssues)
    ? activeIssues
    : []

  const history = (Array.isArray(allIssues) ? allIssues : [])
    .filter((i) => i.issue_status === 'Returned')
    .slice(0, 6)

  const monthly = useMemo(
    () => groupByMonth(
      Array.isArray(allIssues) ? allIssues : [],
      'issue_date',
      6
    ),
    [allIssues]
  )

  const totalBorrowedAllTime = Array.isArray(allIssues)
    ? allIssues.length
    : 0

  // FIX: notifications may be an object instead of an array
  const unreadCount = Array.isArray(notifications)
    ? notifications.filter((n) => !n.is_read).length
    : 0

  const dueSoon = issues.filter(
    (i) => daysUntil(i.due_date) <= 3
  )

  const urgent = [...issues].sort(
    (a, b) => daysUntil(a.due_date) - daysUntil(b.due_date)
  )[0]

  const cd = urgent
    ? countdownParts(urgent.due_date)
    : null

  const displayName =
    studentProfile?.student_name ||
    user?.username ||
    'Reader'

  const firstName = displayName.split(' ')[0]

  return (
    <div className="sdg">
      <a href="#sdg-main-content" className="clms-skip-link">
        Skip to main content
      </a>

      {mobileOpen && (
        <div
          className="sdg-sidebar-backdrop"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside className={`sdg-sidebar ${mobileOpen ? 'is-open' : ''}`}>
        <button
          className="sdg-sidebar-close"
          onClick={() => setMobileOpen(false)}
          aria-label="Close menu"
        >
          <i className="ti ti-x" />
        </button>

        <div className="sdg-brand">
          <img src={logo} alt="NRI" />
        </div>

        <nav className="sdg-nav">
          <a className="sdg-nav-item active">
            <i className="ti ti-layout-grid" />
            Dashboard
          </a>

          <a
            className="sdg-nav-item"
            onClick={() => navigate('/library')}
          >
            <i className="ti ti-book-2" />
            Browse Catalog
          </a>

          <a
            className="sdg-nav-item"
            onClick={() => navigate('/due-dates')}
          >
            <i className="ti ti-clock-exclamation" />
            Due Dates
          </a>

          <a
            className="sdg-nav-item"
            onClick={() => navigate('/reservations')}
          >
            <i className="ti ti-bookmark" />
            Reservations
          </a>

          <a
            className="sdg-nav-item"
            onClick={() => navigate('/fines')}
          >
            <i className="ti ti-receipt" />
            Fines
          </a>

          <a
            className="sdg-nav-item"
            onClick={() => navigate('/notifications')}
          >
            <i className="ti ti-bell" />
            Notifications
          </a>
        </nav>

        <ThemeSwitcher itemClassName="sdg-nav-item" />

        <a
          className="sdg-nav-item logout"
          onClick={handleLogout}
        >
          <i className="ti ti-logout" />
          Logout
        </a>
      </aside>

      <main
        className="sdg-main"
        id="sdg-main-content"
        tabIndex={-1}
      >
        <header className="sdg-topbar">
          <button
            className="sdg-menu-btn"
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
          >
            <i className="ti ti-menu-2" />
          </button>

          <div className="sdg-search">
            <i className="ti ti-search" />

            <input
              placeholder="Search books, authors, ISBN..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) =>
                e.key === 'Enter' &&
                navigate(
                  `/library?q=${encodeURIComponent(query)}`
                )
              }
            />
          </div>

          <div className="sdg-topbar-right">
            <button
              className="sdg-icon-btn"
              aria-label="Notifications"
              onClick={() => navigate('/notifications')}
            >
              <i className="ti ti-bell" />

              {unreadCount > 0 && (
                <span className="sdg-pulse-dot">
                  <span className="sdg-pulse-ring" />
                </span>
              )}
            </button>

            <button
              className="sdg-profile"
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                textAlign: 'left',
                padding: 0,
                color: 'inherit',
                font: 'inherit'
              }}
              onClick={() => navigate('/profile')}
            >
              <Avatar
                picture={studentProfile?.profile_picture}
                name={displayName}
                size={38}
                className="sdg-avatar"
              />

              <div>
                <div className="sdg-profile-name">
                  {displayName}
                </div>

                <div className="sdg-profile-role">
                  {studentProfile?.roll_number || user?.email}
                </div>
              </div>
            </button>
          </div>
        </header>

        <section className="sdg-hero">
          <div className="sdg-hero-text">
            <span className="sdg-eyebrow">
              Welcome back
            </span>

            <h1>
              {firstName}, your library at a glance
            </h1>

            <p>
              {studentProfile
                ? `${studentProfile.department} · Year ${studentProfile.year} · Semester ${studentProfile.semester}`
                : user?.email}
            </p>

            <div className="sdg-hero-actions">
              <a
                className="sdg-btn-primary"
                href="/library"
                onClick={(e) => {
                  e.preventDefault()
                  navigate('/library')
                }}
              >
                <i className="ti ti-search" />
                Browse catalog
              </a>

              <a
                className="sdg-btn-ghost"
                href="/due-dates"
                onClick={(e) => {
                  e.preventDefault()
                  navigate('/due-dates')
                }}
              >
                <i className="ti ti-refresh" />
                View due dates
              </a>
            </div>
          </div>

          <div className="sdg-streak-card">
            <div className="sdg-streak-flame">
              <i className="ti ti-book-2" />
            </div>

            <div className="sdg-streak-value">
              {totalBorrowedAllTime}
            </div>

            <div className="sdg-streak-label">
              books borrowed all-time
            </div>
          </div>
        </section>

        {!profileReady &&
          studentProfileStatus === 'unavailable' && (
            <section
              className="sdg-panel"
              style={{ marginBottom: 22 }}
            >
              <div className="sdg-empty-panel">
                <i className="ti ti-tool" />

                <p>
                  Your personalized library activity isn't
                  available yet.
                </p>

                <p className="hint">
                  Your account has no linked student profile —
                  ask an admin to add one from Student Management
                  (or, if you signed up before this was added,
                  register again). Once it's linked, this
                  dashboard populates automatically.
                </p>
              </div>
            </section>
          )}

        {profileReady && urgent && cd && (
          <section className="sdg-urgent-banner">
            <div className="sdg-urgent-icon">
              <i className="ti ti-clock-exclamation" />
            </div>

            <div className="sdg-urgent-body">
              <div className="sdg-urgent-title">
                &quot;{urgent.title}&quot; is due soon
              </div>

              <div className="sdg-urgent-sub">
                Return or renew before the due date to avoid a fine
              </div>
            </div>

            <div className="sdg-countdown">
              <div className="sdg-countdown-unit">
                <span>{cd.h}</span>
                <label>hrs</label>
              </div>

              <div className="sdg-countdown-unit">
                <span>{cd.m}</span>
                <label>min</label>
              </div>
            </div>

            <button
              className="sdg-btn-primary sdg-urgent-cta"
              onClick={() => navigate('/due-dates')}
            >
              View due dates
            </button>
          </section>
        )}

        <section className="sdg-stat-row">
          <div className="sdg-stat-card">
            <div className="sdg-stat-icon tone-a">
              <i className="ti ti-book-2" />
            </div>

            <div>
              <div className="sdg-stat-value">
                {profileReady ? issues.length : '—'}
              </div>

              <div className="sdg-stat-label">
                Currently borrowed
              </div>
            </div>
          </div>

          <div className="sdg-stat-card">
            <div className="sdg-stat-icon tone-b">
              <i className="ti ti-clock-exclamation" />
            </div>

            <div>
              <div className="sdg-stat-value">
                {profileReady ? dueSoon.length : '—'}
              </div>

              <div className="sdg-stat-label">
                Due within 3 days
              </div>
            </div>
          </div>

          <div className="sdg-stat-card">
            <div className="sdg-stat-icon tone-c">
              <i className="ti ti-bookmark" />
            </div>

            <div>
              <div className="sdg-stat-value">
                {profileReady
                  ? activeReservations.length
                  : '—'}
              </div>

              <div className="sdg-stat-label">
                Active reservations
              </div>
            </div>
          </div>

          <div className="sdg-stat-card">
            <div className="sdg-stat-icon tone-d">
              <i className="ti ti-receipt" />
            </div>

            <div>
              <div className="sdg-stat-value">
                {profileReady
                  ? pendingFines.length
                  : '—'}
              </div>

              <div className="sdg-stat-label">
                Pending fines
              </div>
            </div>
          </div>
        </section>

        <section className="sdg-grid-2">
          <div className="sdg-panel">
            <div className="sdg-panel-head">
              <h2>Currently borrowed</h2>

              <button
                className="sdg-panel-link"
                onClick={() => navigate('/due-dates')}
              >
                View all
              </button>
            </div>

            {!profileReady ? (
              <div className="sdg-empty-panel">
                <i className="ti ti-tool" />
                <p>
                  Unavailable until your student profile
                  endpoint is added.
                </p>
              </div>
            ) : issuesLoading ? (
              <div
                className="sdg-skeleton"
                style={{ height: 140 }}
              />
            ) : issuesError ? (
              <div className="sdg-empty-panel">
                <i className="ti ti-alert-triangle" />

                <p>
                  Could not load your borrowed books.
                </p>

                <button
                  className="sdg-panel-link"
                  onClick={refetchIssues}
                >
                  Try again
                </button>
              </div>
            ) : issues.length === 0 ? (
              <div className="sdg-empty-panel">
                <i className="ti ti-book-2" />

                <p>
                  You have no books borrowed right now.
                </p>
              </div>
            ) : (
              <table className="sdg-table">
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Accession</th>
                    <th>Due date</th>
                    <th>Status</th>
                  </tr>
                </thead>

                <tbody>
                  {issues.map((issue) => {
                    const d = daysUntil(issue.due_date)

                    const statusLabel =
                      d < 0
                        ? `${Math.abs(d)}d overdue`
                        : d === 0
                          ? 'Due today'
                          : `${d}d left`

                    const statusClass =
                      d < 0
                        ? 'sdg-badge-danger'
                        : d <= 3
                          ? 'sdg-badge-warning'
                          : 'sdg-badge-success'

                    return (
                      <tr key={issue.issue_id}>
                        <td>
                          <div className="sdg-book-title">
                            {issue.title}
                          </div>

                          {issue.renewal_count > 0 && (
                            <div className="sdg-book-sub">
                              Renewed {issue.renewal_count}x
                            </div>
                          )}
                        </td>

                        <td className="sdg-mono">
                          {issue.accession_number}
                        </td>

                        <td>
                          {formatDate(issue.due_date)}
                        </td>

                        <td>
                          <span
                            className={`sdg-badge ${statusClass}`}
                          >
                            {statusLabel}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>

          <div className="sdg-panel">
            <div className="sdg-panel-head">
              <h2>Monthly borrowing activity</h2>
            </div>

            {!profileReady ? (
              <div className="sdg-empty-panel">
                <i className="ti ti-chart-bar" />

                <p>
                  Unavailable until your student profile
                  endpoint is added.
                </p>
              </div>
            ) : (
              <div className="sdg-bar-chart">
                {monthly.map((m) => {
                  const max = Math.max(
                    1,
                    ...monthly.map((x) => x.v)
                  )

                  return (
                    <div
                      className="sdg-bar-col"
                      key={m.key}
                    >
                      <div
                        className="sdg-bar"
                        style={{
                          height: `${(m.v / max) * 100}%`
                        }}
                      />

                      <span className="sdg-bar-label">
                        {m.m}
                      </span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </section>

        <section className="sdg-grid-2">
          <div className="sdg-panel">
            <div className="sdg-panel-head">
              <h2>Reservations</h2>

              <button
                className="sdg-panel-link"
                onClick={() => navigate('/reservations')}
              >
                View all
              </button>
            </div>

            {!profileReady ? (
              <div className="sdg-empty-panel">
                <i className="ti ti-tool" />

                <p>
                  Unavailable until your student profile is linked.
                </p>
              </div>
            ) : reservationsLoading ? (
              <div
                className="sdg-skeleton"
                style={{ height: 140 }}
              />
            ) : reservationsError ? (
              <div className="sdg-empty-panel">
                <i className="ti ti-alert-triangle" />

                <p>
                  Could not load your reservations.
                </p>

                <button
                  className="sdg-panel-link"
                  onClick={refetchReservations}
                >
                  Try again
                </button>
              </div>
            ) : reservations.length === 0 ? (
              <div className="sdg-empty-panel">
                <i className="ti ti-bookmark" />

                <p>
                  You haven't reserved anything yet.
                </p>
              </div>
            ) : (
              <table className="sdg-table">
                <thead>
                  <tr>
                    <th>Book</th>
                    <th>Reserved</th>
                    <th>Expires</th>
                    <th>Status</th>
                  </tr>
                </thead>

                <tbody>
                  {reservations.slice(0, 5).map((r) => (
                    <tr key={r.reservation_id}>
                      <td>
                        <div className="sdg-book-title">
                          {r.title}
                        </div>
                      </td>

                      <td>
                        {formatDate(r.reservation_date)}
                      </td>

                      <td>
                        {formatDate(r.expiry_date)}
                      </td>

                      <td>
                        <StatusBadge status={r.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div className="sdg-panel">
            <div className="sdg-panel-head">
              <h2>Fines</h2>

              <button
                className="sdg-panel-link"
                onClick={() => navigate('/fines')}
              >
                View all
              </button>
            </div>

            {!profileReady ? (
              <div className="sdg-empty-panel">
                <i className="ti ti-tool" />

                <p>
                  Unavailable until your student profile is linked.
                </p>
              </div>
            ) : finesLoading ? (
              <div
                className="sdg-skeleton"
                style={{ height: 140 }}
              />
            ) : finesError ? (
              <div className="sdg-empty-panel">
                <i className="ti ti-alert-triangle" />

                <p>
                  Could not load your fines.
                </p>

                <button
                  className="sdg-panel-link"
                  onClick={refetchFines}
                >
                  Try again
                </button>
              </div>
            ) : fines.length === 0 ? (
              <div className="sdg-empty-panel">
                <i className="ti ti-receipt" />

                <p>
                  You have no fines on record.
                </p>
              </div>
            ) : (
              <table className="sdg-table">
                <thead>
                  <tr>
                    <th>Book</th>
                    <th>Type</th>
                    <th>Amount</th>
                    <th>Status</th>
                  </tr>
                </thead>

                <tbody>
                  {fines.slice(0, 5).map((f) => (
                    <tr key={f.fine_id}>
                      <td>
                        <div className="sdg-book-title">
                          {f.title}
                        </div>
                      </td>

                      <td>{f.fine_type}</td>

                      <td>
                        {formatCurrency(f.amount)}
                      </td>

                      <td>
                        <StatusBadge
                          status={f.payment_status}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>

        <section className="sdg-panel">
          <div className="sdg-panel-head">
            <h2>Recent history</h2>
          </div>

          {!profileReady ? (
            <div className="sdg-empty-panel">
              <i className="ti ti-history" />

              <p>
                Unavailable until your student profile
                endpoint is added.
              </p>
            </div>
          ) : history.length === 0 ? (
            <div className="sdg-empty-panel">
              <i className="ti ti-history" />

              <p>
                No returned books yet.
              </p>
            </div>
          ) : (
            <table className="sdg-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Issued</th>
                  <th>Status</th>
                </tr>
              </thead>

              <tbody>
                {history.map((h) => (
                  <tr key={h.issue_id}>
                    <td className="sdg-book-title">
                      {h.title}
                    </td>

                    <td>
                      {formatDate(h.issue_date)}
                    </td>

                    <td>
                      <StatusBadge
                        status={h.issue_status}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      </main>
    </div>
  )
}