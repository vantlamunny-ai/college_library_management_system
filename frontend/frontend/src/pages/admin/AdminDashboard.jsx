import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import logo from '../../assets/nri-logo-white.png'
import { useAuth } from '../../context/AuthContext'
import { useApi } from '../../hooks/useApi'
import * as reportService from '../../services/reportService'
import * as issueService from '../../services/issueService'
import * as returnService from '../../services/returnService'
import * as fineService from '../../services/fineService'
import * as reservationService from '../../services/reservationService'
import { groupByMonth, relativeTime } from '../../utils/date'
import { formatCurrency, initials } from '../../utils/format'
import { StatusBadge } from '../../components/common/StatusBadge'
import { ErrorState } from '../../components/common/ErrorState'
import './AdminDashboard.css'

function describeArc(cx, cy, r, startAngle, endAngle) {
  const toRad = (a) => ((a - 90) * Math.PI) / 180
  const x1 = cx + r * Math.cos(toRad(startAngle))
  const y1 = cy + r * Math.sin(toRad(startAngle))
  const x2 = cx + r * Math.cos(toRad(endAngle))
  const y2 = cy + r * Math.sin(toRad(endAngle))
  const large = endAngle - startAngle > 180 ? 1 : 0
  return `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} Z`
}

export default function AdminDashboard() {
  const { user, role, logout } = useAuth()
  const [query, setQuery] = useState('')
  const [mobileOpen, setMobileOpen] = useState(false)
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate('/login', { replace: true })
  }

  const { data: dashboard, loading: dashLoading, error: dashError, refetch: refetchDash } = useApi(() => reportService.getDashboardReport(), [])
  const { data: recentIssues, loading: issuesLoading, error: issuesError, refetch: refetchIssues } = useApi(() => issueService.getAllIssues(), [])
  const { data: copyReport, error: copyError } = useApi(() => reportService.getCopyReport(), [])
  const { data: issueReport, error: issueReportError } = useApi(() => reportService.getIssueReport(), [])
  const { data: returnReport } = useApi(() => returnService.getAllReturns(), [])
  const { data: fines } = useApi(() => fineService.getAllFines(), [])
  const { data: reservations } = useApi(() => reservationService.getAllReservations(), [])

  const d = dashboard || {}
  const monthlyIssues = useMemo(() => groupByMonth(issueReport || [], 'issue_date', 6), [issueReport])
  const maxMonthly = Math.max(1, ...monthlyIssues.map((m) => m.v))

  const copyStatus = useMemo(() => {
    const rows = copyReport || []
    const counts = { Available: 0, Issued: 0, Reserved: 0, Damaged: 0, Lost: 0 }
    for (const c of rows) {
      if (counts[c.availability_status] !== undefined) counts[c.availability_status] += 1
    }
    return [
      { label: 'Available', value: counts.Available, color: 'var(--gold)' },
      { label: 'Issued', value: counts.Issued, color: '#b8c5a8' },
      { label: 'Reserved', value: counts.Reserved, color: '#e8bd6a' },
      { label: 'Damaged', value: counts.Damaged, color: '#8a9a7c' },
      { label: 'Lost', value: counts.Lost, color: '#e0715f' },
    ]
  }, [copyReport])
  const totalCopies = copyStatus.reduce((s, c) => s + c.value, 0)

  const donutSegments = copyStatus.map((c, i) => {
    const prefix = copyStatus.slice(0, i).reduce((sum, s) => sum + s.value, 0)
    const start = totalCopies ? (prefix / totalCopies) * 360 : 0
    const end = totalCopies ? ((prefix + c.value) / totalCopies) * 360 : 0
    return { ...c, start, end }
  })

  const activity = useMemo(() => {
    const items = []
    for (const i of (issueReport || []).slice(0, 5)) {
      items.push({ icon: 'ti-book-2', text: `Book issued — "${i.title}" to ${i.student_name}`, at: i.issue_date })
    }
    for (const r of (returnReport || []).slice(0, 5)) {
      items.push({ icon: 'ti-corner-down-left', text: `Book returned — "${r.title}", condition: ${r.condition_status}`, at: r.return_date || r.created_at })
    }
    for (const f of (fines || []).slice(0, 5)) {
      items.push({ icon: 'ti-receipt', text: `Fine of ${formatCurrency(f.amount)} — ${f.payment_status}`, at: f.created_at })
    }
    for (const res of (reservations || []).slice(0, 5)) {
      items.push({ icon: 'ti-bookmark', text: `Reservation ${res.status.toLowerCase()} — book #${res.book_id}`, at: res.reservation_date })
    }
    return items
      .filter((it) => it.at)
      .sort((a, b) => new Date(b.at) - new Date(a.at))
      .slice(0, 6)
  }, [issueReport, returnReport, fines, reservations])

  const displayName = user?.username || 'Admin'

  return (
    <div className="ag">
      {mobileOpen && <div className="ag-sidebar-backdrop" onClick={() => setMobileOpen(false)} />}
      <aside className={`ag-sidebar ${mobileOpen ? 'is-open' : ''}`}>
        <button className="ag-sidebar-close" onClick={() => setMobileOpen(false)} aria-label="Close menu">
          <i className="ti ti-x" />
        </button>
        <div className="ag-brand"><img src={logo} alt="NRI" /></div>
        <nav className="ag-nav">
          <a className="ag-nav-item active"><i className="ti ti-layout-grid" />Dashboard</a>
          <a className="ag-nav-item" onClick={() => navigate('/library')}><i className="ti ti-books" />Books</a>
          <a className="ag-nav-item" onClick={() => navigate('/students')}><i className="ti ti-users" />Students</a>
          <a className="ag-nav-item" onClick={() => navigate('/circulation')}><i className="ti ti-transfer" />Circulation</a>
          <a className="ag-nav-item" onClick={() => navigate('/reservations')}><i className="ti ti-bookmark" />Reservations</a>
          <a className="ag-nav-item" onClick={() => navigate('/fines')}><i className="ti ti-receipt" />Fines</a>
          <a className="ag-nav-item" onClick={() => navigate('/lost-damaged')}><i className="ti ti-alert-triangle" />Lost / Damaged</a>
          <a className="ag-nav-item" onClick={() => navigate('/reports')}><i className="ti ti-chart-bar" />Reports</a>
        </nav>
        <a className="ag-nav-item logout" onClick={handleLogout}><i className="ti ti-logout" />Logout</a>
      </aside>

      <main className="ag-main">
        <header className="ag-topbar">
          <button className="ag-menu-btn" onClick={() => setMobileOpen(true)} aria-label="Open menu">
            <i className="ti ti-menu-2" />
          </button>
          <div className="ag-search">
            <i className="ti ti-search" />
            <input placeholder="Search books, students, issues..." value={query} onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && navigate(`/library?q=${encodeURIComponent(query)}`)} />
          </div>
          <div className="ag-topbar-right">
            <button className="ag-icon-btn" aria-label="Notifications" onClick={() => navigate('/notifications')}>
              <i className="ti ti-bell" />
            </button>
            <div className="ag-profile">
              <div className="ag-avatar">{initials(displayName)}</div>
              <div>
                <div className="ag-profile-name">{displayName}</div>
                <div className="ag-profile-role">{role}</div>
              </div>
            </div>
          </div>
        </header>

        {dashError ? (
          <div className="ag-panel" style={{ marginBottom: 16 }}>
            <ErrorState message="Could not load the dashboard summary." onRetry={refetchDash} />
          </div>
        ) : (
          <section className="ag-tile-row">
            <div className="ag-tile tone-gold">
              <div className="ag-tile-top"><span>Total books</span><i className="ti ti-books" /></div>
              <div className="ag-tile-value">{dashLoading ? '—' : (d.total_books || 0).toLocaleString('en-IN')}</div>
              <div className="ag-tile-sub">{(d.total_copies || 0).toLocaleString('en-IN')} copies in catalog</div>
            </div>
            <div className="ag-tile tone-sage">
              <div className="ag-tile-top"><span>Active students</span><i className="ti ti-users" /></div>
              <div className="ag-tile-value">{dashLoading ? '—' : (d.active_students || 0).toLocaleString('en-IN')}</div>
              <div className="ag-tile-sub">{d.active_issues || 0} books currently issued</div>
            </div>
            <div className="ag-tile tone-copper">
              <div className="ag-tile-top"><span>Overdue books</span><i className="ti ti-clock-exclamation" /></div>
              <div className="ag-tile-value">{dashLoading ? '—' : (d.overdue_books || 0)}</div>
              <div className="ag-tile-sub">{d.pending_reservations || 0} reservations pending</div>
            </div>
            <div className="ag-tile tone-ink">
              <div className="ag-tile-top"><span>Pending fines</span><i className="ti ti-receipt" /></div>
              <div className="ag-tile-value">{dashLoading ? '—' : formatCurrency(d.pending_fines || 0)}</div>
              <div className="ag-tile-sub">Across all students</div>
            </div>
          </section>
        )}

        <section className="ag-grid-2">
          <div className="ag-panel">
            <div className="ag-panel-head">
              <h2>Issues this term</h2>
              <span className="ag-panel-tag">Last 6 months</span>
            </div>
            {issueReportError ? (
              <div className="ag-empty-panel"><i className="ti ti-alert-triangle" /><p>Could not load this chart.</p></div>
            ) : issueReport && monthlyIssues.every((m) => m.v === 0) ? (
              <div className="ag-empty-panel"><i className="ti ti-chart-bar" /><p>No issues recorded yet.</p></div>
            ) : (
              <div className="ag-bar-chart">
                {monthlyIssues.map((m) => (
                  <div className="ag-bar-col" key={m.key}>
                    <div className="ag-bar" style={{ height: `${(m.v / maxMonthly) * 100}%` }} />
                    <span className="ag-bar-label">{m.m}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="ag-panel">
            <div className="ag-panel-head"><h2>Copy status</h2></div>
            {copyError ? (
              <div className="ag-empty-panel"><i className="ti ti-alert-triangle" /><p>Could not load copy status.</p></div>
            ) : totalCopies === 0 ? (
              <div className="ag-empty-panel"><i className="ti ti-books" /><p>No book copies recorded yet.</p></div>
            ) : (
              <div className="ag-donut-wrap">
                <svg viewBox="0 0 120 120" className="ag-donut">
                  {donutSegments.map((seg) => seg.value > 0 && (
                    <path key={seg.label} d={describeArc(60, 60, 55, seg.start, seg.end)} fill={seg.color} />
                  ))}
                  <circle cx="60" cy="60" r="34" fill="var(--forest-panel)" />
                </svg>
                <div className="ag-donut-legend">
                  {copyStatus.map((c) => (
                    <div className="ag-legend-row" key={c.label}>
                      <span className="ag-legend-dot" style={{ background: c.color }} />
                      <span className="ag-legend-label">{c.label}</span>
                      <span className="ag-legend-value">{c.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>

        <section className="ag-grid-2">
          <div className="ag-panel ag-panel-wide">
            <div className="ag-panel-head">
              <h2>Recent circulation</h2>
              <button className="ag-panel-link" onClick={() => navigate('/circulation')}>View all</button>
            </div>
            {issuesLoading ? (
              <div className="ag-skeleton" style={{ height: 160 }} />
            ) : issuesError ? (
              <ErrorState message="Could not load recent circulation." onRetry={refetchIssues} />
            ) : !recentIssues || recentIssues.length === 0 ? (
              <div className="ag-empty-panel"><i className="ti ti-transfer" /><p>No circulation activity yet.</p></div>
            ) : (
              <table className="ag-table">
                <thead>
                  <tr><th>Student</th><th>Book</th><th>Issue date</th><th>Due date</th><th>Status</th></tr>
                </thead>
                <tbody>
                  {recentIssues.slice(0, 6).map((r) => (
                    <tr key={r.issue_id}>
                      <td>
                        <div className="ag-book-title">{r.student_name}</div>
                        <div className="ag-book-sub">{r.roll_number}</div>
                      </td>
                      <td>{r.title}</td>
                      <td>{r.issue_date?.slice(0, 10)}</td>
                      <td>{r.due_date?.slice(0, 10)}</td>
                      <td><StatusBadge status={r.issue_status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div className="ag-panel">
            <div className="ag-panel-head"><h2>Recent activity</h2></div>
            {activity.length === 0 ? (
              <div className="ag-empty-panel"><i className="ti ti-activity" /><p>No recent activity.</p></div>
            ) : (
              <ul className="ag-activity-list">
                {activity.map((a, i) => (
                  <li className="ag-activity-row" key={i}>
                    <div className="ag-activity-icon"><i className={`ti ${a.icon}`} /></div>
                    <div>
                      <div className="ag-activity-text">{a.text}</div>
                      <div className="ag-activity-time">{relativeTime(a.at)}</div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </main>
    </div>
  )
}
