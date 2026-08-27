import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useApi } from '../../hooks/useApi';
import * as notificationService from '../../services/notificationService';
import { Avatar } from '../common/Avatar';

export function Topbar({ search, actions, onMenuClick }) {
  const { user, role, studentProfile } = useAuth();
  const navigate = useNavigate();

  const { data: notifications } = useApi(
    () => notificationService.getMyNotifications(),
    [role],
    { enabled: role === 'Student' }
  );

  const unreadCount = Array.isArray(notifications)
    ? notifications.filter((n) => !n.is_read).length
    : 0;

  const displayName =
    studentProfile?.student_name ||
    user?.username ||
    'Account';

  const displaySub =
    studentProfile?.roll_number ||
    role ||
    '';

  return (
    <header className="clms-topbar">
      <button
        className="clms-menu-btn"
        onClick={onMenuClick}
        aria-label="Open menu"
      >
        <i className="ti ti-menu-2" />
      </button>

      {search ? (
        <div className="clms-search">
          <i className="ti ti-search" />

          <input
            placeholder={search.placeholder || 'Search...'}
            value={search.value}
            onChange={(e) => search.onChange(e.target.value)}
          />
        </div>
      ) : (
        <div className="clms-topbar-spacer" />
      )}

      <div className="clms-topbar-right">
        {actions}

        <button
          className="clms-icon-btn"
          aria-label="Notifications"
          onClick={() => navigate('/notifications')}
        >
          <i className="ti ti-bell" />

          {unreadCount > 0 && (
            <span className="clms-pulse-dot">
              <span className="clms-pulse-ring" />
            </span>
          )}
        </button>

        {role === 'Student' ? (
          <button
            className="clms-profile"
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              textAlign: 'left',
              padding: 0,
              color: 'inherit',
              font: 'inherit',
            }}
            onClick={() => navigate('/profile')}
          >
            <Avatar
              picture={studentProfile?.profile_picture}
              name={displayName}
              size={38}
              className="clms-avatar"
            />

            <div>
              <div className="clms-profile-name">
                {displayName}
              </div>

              <div className="clms-profile-role">
                {displaySub}
              </div>
            </div>
          </button>
        ) : (
          <div className="clms-profile">
            <Avatar
              name={displayName}
              size={38}
              className="clms-avatar"
            />

            <div>
              <div className="clms-profile-name">
                {displayName}
              </div>

              <div className="clms-profile-role">
                {displaySub}
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}