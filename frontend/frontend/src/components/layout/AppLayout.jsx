import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import '../../styles/layout.css';

export function AppLayout({ search, actions, children }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  // Close the mobile drawer whenever the route changes — adjusted during
  // render (React's recommended pattern) rather than an effect.
  const [prevPath, setPrevPath] = useState(location.pathname);
  if (prevPath !== location.pathname) {
    setPrevPath(location.pathname);
    if (mobileOpen) setMobileOpen(false);
  }

  return (
    <div className={`clms-shell ${collapsed ? 'sidebar-collapsed' : ''}`}>
      <Sidebar
        collapsed={collapsed}
        onToggle={() => setCollapsed((v) => !v)}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />
      {mobileOpen && <div className="clms-sidebar-backdrop" onClick={() => setMobileOpen(false)} />}
      <div className="clms-main-col">
        <Topbar search={search} actions={actions} onMenuClick={() => setMobileOpen(true)} />
        <main className="clms-main" key={location.pathname}>
          <div className="clms-page-transition">{children}</div>
        </main>
      </div>
    </div>
  );
}
