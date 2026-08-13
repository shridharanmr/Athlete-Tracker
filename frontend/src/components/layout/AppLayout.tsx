import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Users, CreditCard, TrendingUp,
  Settings, LogOut, Menu, X, Wifi, WifiOff, Trophy, Sun, Moon, CalendarDays,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../hooks/useSocket';
import NotificationBell from '../ui/NotificationBell';
import './AppLayout.css';

interface NavItem {
  to: string;
  icon: React.ReactNode;
  label: string;
}

const NAV_ITEMS_FULL: NavItem[] = [
  { to: '/dashboard',   icon: <LayoutDashboard size={17} />, label: 'Dashboard' },
  { to: '/athletes',    icon: <Users size={17} />,           label: 'Athletes' },
  { to: '/fees',        icon: <CreditCard size={17} />,      label: 'Fee Management' },
  { to: '/performance', icon: <TrendingUp size={17} />,      label: 'Performance' },
  { to: '/events',      icon: <CalendarDays size={17} />,    label: 'Events' },
];

const ADMIN_ITEMS: NavItem[] = [
  { to: '/admin', icon: <Settings size={17} />, label: 'Admin Panel' },
];

// Map route to readable page title
const PAGE_TITLES: Record<string, string> = {
  '/dashboard':   'Dashboard',
  '/athletes':    'Athletes',
  '/fees':        'Fee Management',
  '/performance': 'Performance Analytics',
  '/admin':       'Admin Panel',
};

export default function AppLayout() {
  const { user, athleteName, logout, isAdmin, isAthlete } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [dark, setDark] = useState(() => localStorage.getItem('theme') === 'dark');
  const { notifications, unreadCount, markAllRead, connected } = useSocket();

  const displayName = isAthlete && athleteName ? athleteName : user?.username;

  const navItems: NavItem[] = isAthlete
    ? [
        { to: '/dashboard', icon: <LayoutDashboard size={17} />, label: 'Dashboard' },
        { to: '/my-fees',   icon: <CreditCard size={17} />,      label: 'My Fees' },
      ]
    : NAV_ITEMS_FULL;

  // Apply theme to document
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
    localStorage.setItem('theme', dark ? 'dark' : 'light');
  }, [dark]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const pageTitle = Object.entries(PAGE_TITLES).find(([path]) =>
    location.pathname.startsWith(path)
  )?.[1] ?? 'Smart Athlete';

  return (
    <div className="app-shell">
      {/* ── Sidebar ── */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="logo">
            <div className="logo-icon-wrap">
              <Trophy size={20} color="#fff" />
            </div>
            <div>
              <div className="logo-name">Smart Athlete</div>
              <div className="logo-sub">Performance System</div>
            </div>
          </div>
          <button className="sidebar-close" onClick={() => setSidebarOpen(false)}>
            <X size={16} />
          </button>
        </div>

        <div className="sidebar-user">
          <div className="user-avatar">{displayName?.[0]?.toUpperCase()}</div>
          <div>
            <div className="user-name">{displayName}</div>
            <span className={`badge badge-${user?.role}`}>{user?.role}</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-section-label">Main Menu</div>
          {navItems.map(({ to, icon, label }) => (
            <NavLink
              key={to} to={to}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              onClick={() => setSidebarOpen(false)}
            >
              <span className="nav-icon">{icon}</span>
              <span>{label}</span>
            </NavLink>
          ))}

          {isAdmin && (
            <>
              <div className="nav-section-label" style={{ marginTop: '12px' }}>Admin</div>
              {ADMIN_ITEMS.map(({ to, icon, label }) => (
                <NavLink
                  key={to} to={to}
                  className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <span className="nav-icon">{icon}</span>
                  <span>{label}</span>
                </NavLink>
              ))}
            </>
          )}
        </nav>

        <div className="sidebar-footer">
          <div className="connection-status">
            {connected
              ? <><Wifi size={11} color="#22c55e" /> <span style={{ color: '#22c55e' }}>Live</span></>
              : <><WifiOff size={11} /> Offline</>}
          </div>
          <button className="nav-item logout-btn" onClick={handleLogout}>
            <span className="nav-icon"><LogOut size={17} /></span>
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {sidebarOpen && <div className="overlay" onClick={() => setSidebarOpen(false)} />}

      {/* ── Main ── */}
      <div className="main-area">
        <header className="top-header">
          <button className="hamburger" onClick={() => setSidebarOpen(true)}>
            <Menu size={20} />
          </button>

          <span className="header-page-title">{pageTitle}</span>

          <div className="header-right">
            {/* Dark mode toggle */}
            <button className="theme-toggle" onClick={() => setDark((d) => !d)}
              title={dark ? 'Switch to light mode' : 'Switch to dark mode'}>
              {dark ? <Sun size={16} /> : <Moon size={16} />}
            </button>

            <NotificationBell
              notifications={notifications}
              unreadCount={unreadCount}
              onMarkAllRead={markAllRead}
            />

            <div className="header-user">
              <div className="header-avatar">{displayName?.[0]?.toUpperCase()}</div>
              <span className="header-username">{displayName}</span>
            </div>
          </div>
        </header>

        <main className="page-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
