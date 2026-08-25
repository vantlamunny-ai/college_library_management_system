import { useMemo, useState } from 'react'
import { PageHeader } from '../../components/common/PageHeader'
import { Panel } from '../../components/common/Panel'
import { Toolbar, FilterChips } from '../../components/common/FilterBar'
import { EmptyState } from '../../components/common/EmptyState'
import { ErrorState, UnavailableState } from '../../components/common/ErrorState'
import { SkeletonRows } from '../../components/common/LoadingSkeleton'
import { useApi, useMutation } from '../../hooks/useApi'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import * as notificationService from '../../services/notificationService'
import { relativeTime, formatDateTime } from '../../utils/date'
import './Notifications.css'

const TYPE_ICON = {
  'Book Issue': 'ti-book-2',
  Fine: 'ti-receipt',
  Reservation: 'ti-bookmark',
  General: 'ti-speakerphone',
}

export default function Notifications() {
  const { role } = useAuth()
  const toast = useToast()
  const isStudent = role === 'Student'
  const [filter, setFilter] = useState('All')

  const { data: notifications, loading, error, refetch } = useApi(
    () => notificationService.getMyNotifications(),
    [],
    { enabled: isStudent }
  )

  const [markReadRun] = useMutation((id) => notificationService.markNotificationRead(id))
  const [markAllReadRun, markAllReadState] = useMutation(() => notificationService.markAllNotificationsRead())

  const types = useMemo(() => {
    const set = new Set((notifications || []).map((n) => n.notification_type).filter(Boolean))
    return ['All', 'Unread', ...Array.from(set)]
  }, [notifications])

  const rows = useMemo(() => {
    let list = notifications || []
    if (filter === 'Unread') list = list.filter((n) => !n.is_read)
    else if (filter !== 'All') list = list.filter((n) => n.notification_type === filter)
    return [...list].sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
  }, [notifications, filter])

  const unreadCount = (notifications || []).filter((n) => !n.is_read).length

  async function handleMarkRead(id) {
    try {
      await markReadRun(id)
      refetch()
    } catch (err) {
      toast.error(err?.message || 'Could not mark this as read.')
    }
  }

  async function handleMarkAllRead() {
    try {
      await markAllReadRun()
      toast.success('All notifications marked as read.')
      refetch()
    } catch (err) {
      toast.error(err?.message || 'Could not mark all as read.')
    }
  }

  if (!isStudent) {
    return (
      <div>
        <PageHeader title="Notifications" subtitle="Library alerts and account updates." />
        <Panel>
          <UnavailableState
            title="Notifications aren't available for your role yet"
            message="GET /notifications/my is restricted to the Student role on the current backend — there's no notifications endpoint for Admin/Librarian accounts yet."
          />
        </Panel>
      </div>
    )
  }

  return (
    <div>
      <PageHeader
        title="Notifications"
        subtitle="Due dates, fines, reservations, and library announcements."
        actions={
          unreadCount > 0 && (
            <button className="clms-btn clms-btn-ghost" onClick={handleMarkAllRead} disabled={markAllReadState.loading}>
              {markAllReadState.loading && <span className="clms-spinner" />} Mark all as read
            </button>
          )
        }
      />

      <Panel>
        <Toolbar>
          <FilterChips options={types} active={filter} onChange={setFilter} />
        </Toolbar>

        {loading ? (
          <SkeletonRows count={5} />
        ) : error ? (
          <ErrorState message="Could not load your notifications." onRetry={refetch} />
        ) : rows.length === 0 ? (
          <EmptyState icon="ti-bell-off" title="No notifications" message="You're all caught up." />
        ) : (
          <ul className="notif-list">
            {rows.map((n) => (
              <li key={n.notification_id} className={`notif-item ${n.is_read ? '' : 'is-unread'}`}>
                <div className="notif-icon"><i className={`ti ${TYPE_ICON[n.notification_type] || 'ti-bell'}`} /></div>
                <div className="notif-body">
                  <div className="notif-title">{n.title}</div>
                  <div className="notif-message">{n.message}</div>
                  <div className="notif-time" title={formatDateTime(n.created_at)}>{relativeTime(n.created_at)}</div>
                </div>
                {!n.is_read && (
                  <button className="clms-btn clms-btn-ghost clms-btn-small" onClick={() => handleMarkRead(n.notification_id)}>
                    Mark read
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  )
}
