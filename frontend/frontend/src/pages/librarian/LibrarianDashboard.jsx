import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import logo from '../../assets/nri-logo-white.png';
import { useAuth } from '../../hooks/useAuth';
import { useApi } from '../../hooks/useApi';

import * as issueService from '../../services/issueService';
import * as reservationService from '../../services/reservationService';
import * as returnService from '../../services/returnService';
import * as reportService from '../../services/reportService';

import { formatDate, dueStatus } from '../../utils/date';
import { formatCurrency, initials } from '../../utils/format';
import { StatusBadge } from '../../components/common/StatusBadge';
import { ThemeSwitcher } from '../../components/common/ThemeSwitcher';

import '../admin/AdminDashboard.css';

export default function LibrarianDashboard() {
  const { user, logout } = useAuth();
  const [query, setQuery] = useState('');
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login', { replace: true });
  }

  const {
    data: activeIssuesResponse,
    loading: activeLoading,
    error: activeError,
    refetch: refetchActive,
  } = useApi(
    () => issueService.getActiveIssues(),
    []
  );

  const { data: overdueIssuesResponse } = useApi(
    () => issueService.getOverdueIssues(),
    []
  );

  const { data: reservationsResponse } = useApi(
    () => reservationService.getAllReservations(),
    []
  );

  const { data: returnsResponse } = useApi(
    () => returnService.getAllReturns(),
    []
  );

  const { data: copyReportResponse } = useApi(
    () => reportService.getCopyReport(),
    []
  );

  const { data: fineReportResponse } = useApi(
    () => reportService.getFineReport(),
    []
  );

  /*
   * Backend response safe handling.
   * API may return:
   *   [...]
   *   { data: [...] }
   *   { issues: [...] }
   *   { reservations: [...] }
   * etc.
   */

  const activeIssues = useMemo(() => {
    if (Array.isArray(activeIssuesResponse)) {
      return activeIssuesResponse;
    }

    if (Array.isArray(activeIssuesResponse?.data)) {
      return activeIssuesResponse.data;
    }

    if (Array.isArray(activeIssuesResponse?.issues)) {
      return activeIssuesResponse.issues;
    }

    return [];
  }, [activeIssuesResponse]);

  const overdueIssues = useMemo(() => {
    if (Array.isArray(overdueIssuesResponse)) {
      return overdueIssuesResponse;
    }

    if (Array.isArray(overdueIssuesResponse?.data)) {
      return overdueIssuesResponse.data;
    }

    if (Array.isArray(overdueIssuesResponse?.issues)) {
      return overdueIssuesResponse.issues;
    }

    return [];
  }, [overdueIssuesResponse]);

  const reservations = useMemo(() => {
    if (Array.isArray(reservationsResponse)) {
      return reservationsResponse;
    }

    if (Array.isArray(reservationsResponse?.data)) {
      return reservationsResponse.data;
    }

    if (Array.isArray(reservationsResponse?.reservations)) {
      return reservationsResponse.reservations;
    }

    return [];
  }, [reservationsResponse]);

  const returns = useMemo(() => {
    if (Array.isArray(returnsResponse)) {
      return returnsResponse;
    }

    if (Array.isArray(returnsResponse?.data)) {
      return returnsResponse.data;
    }

    if (Array.isArray(returnsResponse?.returns)) {
      return returnsResponse.returns;
    }

    return [];
  }, [returnsResponse]);

  const copyReport = useMemo(() => {
    if (Array.isArray(copyReportResponse)) {
      return copyReportResponse;
    }

    if (Array.isArray(copyReportResponse?.data)) {
      return copyReportResponse.data;
    }

    if (Array.isArray(copyReportResponse?.copies)) {
      return copyReportResponse.copies;
    }

    return [];
  }, [copyReportResponse]);

  const fineReport = useMemo(() => {
    if (Array.isArray(fineReportResponse)) {
      return fineReportResponse;
    }

    if (Array.isArray(fineReportResponse?.data)) {
      return fineReportResponse.data;
    }

    if (Array.isArray(fineReportResponse?.fines)) {
      return fineReportResponse.fines;
    }

    return [];
  }, [fineReportResponse]);

  const dueToday = useMemo(
    () =>
      activeIssues.filter(
        (i) => dueStatus(i.due_date).key === 'today'
      ),
    [activeIssues]
  );

  const pendingReservations = useMemo(
    () =>
      reservations.filter(
        (r) => r.status === 'Pending'
      ),
    [reservations]
  );

  const lostDamaged = useMemo(
    () =>
      returns.filter(
        (r) =>
          r.condition_status === 'Damaged' ||
          r.condition_status === 'Lost'
      ),
    [returns]
  );

  const availableCopies = useMemo(
    () =>
      copyReport.filter(
        (c) =>
          c.availability_status === 'Available'
      ).length,
    [copyReport]
  );

  const outstandingFines = useMemo(
    () =>
      fineReport
        .filter(
          (f) => f.payment_status === 'Pending'
        )
        .reduce(
          (sum, f) => sum + Number(f.amount || 0),
          0
        ),
    [fineReport]
  );

  const recentCirculation = useMemo(
    () =>
      [...activeIssues]
        .sort(
          (a, b) =>
            Number(b.issue_id || 0) -
            Number(a.issue_id || 0)
        )
        .slice(0, 6),
    [activeIssues]
  );

  const displayName =
    user?.username || 'Librarian';

  return (
    <div className="ag">
      <a
        href="#lg-dash-main-content"
        className="clms-skip-link"
      >
        Skip to main content
      </a>

      {mobileOpen && (
        <div
          className="ag-sidebar-backdrop"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={`ag-sidebar ${
          mobileOpen ? 'is-open' : ''
        }`}
      >
        <button
          className="ag-sidebar-close"
          onClick={() => setMobileOpen(false)}
          aria-label="Close menu"
        >
          <i className="ti ti-x" />
        </button>

        <div className="ag-brand">
          <img src={logo} alt="NRI" />
        </div>

        <nav className="ag-nav">
          <a className="ag-nav-item active">
            <i className="ti ti-layout-grid" />
            Dashboard
          </a>

          <a
            className="ag-nav-item"
            onClick={() => navigate('/library')}
          >
            <i className="ti ti-books" />
            Books
          </a>

          <a
            className="ag-nav-item"
            onClick={() => navigate('/circulation')}
          >
            <i className="ti ti-transfer" />
            Circulation
          </a>

          <a
            className="ag-nav-item"
            onClick={() => navigate('/reservations')}
          >
            <i className="ti ti-bookmark" />
            Reservations
          </a>

          <a
            className="ag-nav-item"
            onClick={() => navigate('/due-dates')}
          >
            <i className="ti ti-clock-exclamation" />
            Due Dates
          </a>

          <a
            className="ag-nav-item"
            onClick={() => navigate('/fines')}
          >
            <i className="ti ti-receipt" />
            Fines
          </a>

          <a
            className="ag-nav-item"
            onClick={() =>
              navigate('/lost-damaged')
            }
          >
            <i className="ti ti-alert-triangle" />
            Lost / Damaged
          </a>

          <a
            className="ag-nav-item"
            onClick={() => navigate('/reports')}
          >
            <i className="ti ti-chart-bar" />
            Reports
          </a>
        </nav>

        <ThemeSwitcher itemClassName="ag-nav-item" />

        <a
          className="ag-nav-item logout"
          onClick={handleLogout}
        >
          <i className="ti ti-logout" />
          Logout
        </a>
      </aside>

      <main
        className="ag-main"
        id="lg-dash-main-content"
        tabIndex={-1}
      >
        <header className="ag-topbar">
          <button
            className="ag-menu-btn"
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
          >
            <i className="ti ti-menu-2" />
          </button>

          <div className="ag-search">
            <i className="ti ti-search" />

            <input
              placeholder="Search books, students, issues..."
              value={query}
              onChange={(e) =>
                setQuery(e.target.value)
              }
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  navigate(
                    `/library?q=${encodeURIComponent(
                      query
                    )}`
                  );
                }
              }}
            />
          </div>

          <div className="ag-topbar-right">
            <button
              className="ag-icon-btn"
              aria-label="Notifications"
              onClick={() =>
                navigate('/notifications')
              }
            >
              <i className="ti ti-bell" />
            </button>

            <div className="ag-profile">
              <div className="ag-avatar">
                {initials(displayName)}
              </div>

              <div>
                <div className="ag-profile-name">
                  {displayName}
                </div>

                <div className="ag-profile-role">
                  Librarian
                </div>
              </div>
            </div>
          </div>
        </header>

        <section className="ag-tile-row">
          <div className="ag-tile tone-gold">
            <div className="ag-tile-top">
              <span>Currently issued</span>
              <i className="ti ti-book-2" />
            </div>

            <div className="ag-tile-value">
              {activeLoading
                ? '—'
                : activeIssues.length}
            </div>

            <div className="ag-tile-sub">
              {dueToday.length} due today
            </div>
          </div>

          <div className="ag-tile tone-copper">
            <div className="ag-tile-top">
              <span>Overdue</span>
              <i className="ti ti-clock-exclamation" />
            </div>

            <div className="ag-tile-value">
              {overdueIssues.length}
            </div>

            <div className="ag-tile-sub">
              Needs follow-up
            </div>
          </div>

          <div className="ag-tile tone-sage">
            <div className="ag-tile-top">
              <span>Available copies</span>
              <i className="ti ti-books" />
            </div>

            <div className="ag-tile-value">
              {availableCopies}
            </div>

            <div className="ag-tile-sub">
              Ready to issue
            </div>
          </div>

          <div className="ag-tile tone-ink">
            <div className="ag-tile-top">
              <span>Outstanding fines</span>
              <i className="ti ti-receipt" />
            </div>

            <div className="ag-tile-value">
              {formatCurrency(outstandingFines)}
            </div>

            <div className="ag-tile-sub">
              Across all students
            </div>
          </div>
        </section>

        <section className="ag-grid-2">
          <button
            className="ag-panel"
            style={{
              textAlign: 'left',
              cursor: 'pointer',
              border: 'none',
            }}
            onClick={() =>
              navigate('/circulation')
            }
          >
            <div className="ag-panel-head">
              <h2>
                <i
                  className="ti ti-transfer"
                  style={{
                    marginRight: 8,
                    color: 'var(--gold-text)',
                  }}
                />
                Issue or return a book
              </h2>
            </div>

            <p
              style={{
                margin: 0,
                fontSize: '0.82rem',
                color: 'var(--muted)',
              }}
            >
              Jump to Circulation Management to
              process a loan or return.
            </p>
          </button>

          <button
            className="ag-panel"
            style={{
              textAlign: 'left',
              cursor: 'pointer',
              border: 'none',
            }}
            onClick={() =>
              navigate('/lost-damaged')
            }
          >
            <div className="ag-panel-head">
              <h2>
                <i
                  className="ti ti-alert-triangle"
                  style={{
                    marginRight: 8,
                    color: 'var(--gold-text)',
                  }}
                />
                Report lost or damaged
              </h2>
            </div>

            <p
              style={{
                margin: 0,
                fontSize: '0.82rem',
                color: 'var(--muted)',
              }}
            >
              {lostDamaged.length} incident
              {lostDamaged.length === 1
                ? ''
                : 's'} on record.
            </p>
          </button>
        </section>

        <section className="ag-grid-2">
          <div className="ag-panel">
            <div className="ag-panel-head">
              <h2>Due today</h2>

              <button
                className="ag-panel-link"
                onClick={() =>
                  navigate('/due-dates')
                }
              >
                View all
              </button>
            </div>

            {activeLoading ? (
              <div
                className="ag-skeleton"
                style={{ height: 140 }}
              />
            ) : activeError ? (
              <div className="ag-empty-panel">
                <i className="ti ti-alert-triangle" />

                <p>
                  Could not load due dates.{' '}
                  <button
                    className="ag-panel-link"
                    onClick={refetchActive}
                  >
                    Retry
                  </button>
                </p>
              </div>
            ) : dueToday.length === 0 ? (
              <div className="ag-empty-panel">
                <i className="ti ti-calendar-due" />
                <p>Nothing due today.</p>
              </div>
            ) : (
              <table className="ag-table">
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Book</th>
                    <th>Status</th>
                  </tr>
                </thead>

                <tbody>
                  {dueToday.map((i) => (
                    <tr key={i.issue_id}>
                      <td>
                        <div className="ag-book-title">
                          {i.student_name}
                        </div>

                        <div className="ag-book-sub">
                          {i.roll_number}
                        </div>
                      </td>

                      <td>{i.title}</td>

                      <td>
                        <StatusBadge
                          status="Due today"
                          tone="warning"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div className="ag-panel">
            <div className="ag-panel-head">
              <h2>Pending reservations</h2>

              <button
                className="ag-panel-link"
                onClick={() =>
                  navigate('/reservations')
                }
              >
                View all
              </button>
            </div>

            {pendingReservations.length === 0 ? (
              <div className="ag-empty-panel">
                <i className="ti ti-bookmark" />
                <p>No reservations waiting.</p>
              </div>
            ) : (
              <ul className="ag-activity-list">
                {pendingReservations
                  .slice(0, 6)
                  .map((r) => (
                    <li
                      className="ag-activity-row"
                      key={r.reservation_id}
                    >
                      <div className="ag-activity-icon">
                        <i className="ti ti-bookmark" />
                      </div>

                      <div>
                        <div className="ag-activity-text">
                          Book #{r.book_id} — Student #
                          {r.student_id}
                        </div>

                        <div className="ag-activity-time">
                          Reserved{' '}
                          {formatDate(
                            r.reservation_date
                          )}
                        </div>
                      </div>
                    </li>
                  ))}
              </ul>
            )}
          </div>
        </section>

        <section className="ag-panel ag-panel-wide">
          <div className="ag-panel-head">
            <h2>Recent circulation</h2>

            <button
              className="ag-panel-link"
              onClick={() =>
                navigate('/circulation')
              }
            >
              View all
            </button>
          </div>

          {recentCirculation.length === 0 ? (
            <div className="ag-empty-panel">
              <i className="ti ti-transfer" />
              <p>No circulation activity yet.</p>
            </div>
          ) : (
            <table className="ag-table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Book</th>
                  <th>Issued</th>
                  <th>Due</th>
                  <th>Status</th>
                </tr>
              </thead>

              <tbody>
                {recentCirculation.map((i) => {
                  const s = dueStatus(i.due_date);

                  return (
                    <tr key={i.issue_id}>
                      <td>
                        <div className="ag-book-title">
                          {i.student_name}
                        </div>

                        <div className="ag-book-sub">
                          {i.roll_number}
                        </div>
                      </td>

                      <td>{i.title}</td>

                      <td>
                        {formatDate(i.issue_date)}
                      </td>

                      <td>
                        {formatDate(i.due_date)}
                      </td>

                      <td>
                        <StatusBadge
                          status={s.label}
                          tone={s.tone}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </section>
      </main>
    </div>
  );
}