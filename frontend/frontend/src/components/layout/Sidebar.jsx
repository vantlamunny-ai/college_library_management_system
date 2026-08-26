import { NavLink, useNavigate } from 'react-router-dom';
import logo from '../../assets/nri-logo-white.png';
import { NAV_BY_ROLE } from './navConfig';
import { useAuth } from '../../context/AuthContext';
import { ThemeSwitcher } from '../common/ThemeSwitcher';

export function Sidebar({ collapsed, onToggle, mobileOpen, onCloseMobile }) {
  const { role, logout } = useAuth();
  const navigate = useNavigate();
  const items = NAV_BY_ROLE[role] || [];

  function handleLogout() {
    logout();
    navigate('/login', { replace: true });
  }

  return (
    <aside className={`clms-sidebar ${collapsed ? 'is-collapsed' : ''} ${mobileOpen ? 'is-mobile-open' : ''}`}>
      <div className="clms-sidebar-top">
        <div className="clms-brand">
          <img src={logo} alt="NRI" />
        </div>
        <button
          className="clms-sidebar-toggle"
          onClick={onToggle}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <i className={`ti ${collapsed ? 'ti-chevron-right' : 'ti-chevron-left'}`} />
        </button>
        <button className="clms-sidebar-close" onClick={onCloseMobile} aria-label="Close menu">
          <i className="ti ti-x" />
        </button>
      </div>

      <nav className="clms-nav">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => `clms-nav-item ${isActive ? 'active' : ''}`}
            title={item.label}
          >
            <i className={`ti ${item.icon}`} />
            <span className="clms-nav-label">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <ThemeSwitcher itemClassName="clms-nav-item" labelClassName="clms-nav-label" />

      <button className="clms-nav-item logout" onClick={handleLogout} title="Logout">
        <i className="ti ti-logout" />
        <span className="clms-nav-label">Logout</span>
      </button>
    </aside>
  );
}
