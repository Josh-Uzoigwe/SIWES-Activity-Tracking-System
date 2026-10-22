import React, { useContext } from 'react';
import { Outlet, Navigate, useNavigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import { LogOut, User, ShieldCheck } from 'lucide-react';
import NotificationCenter from '../components/NotificationCenter';

const formatRoleLabel = (role) => {
  switch (role) {
    case 'STUDENT': return 'Student';
    case 'SCHOOL': return 'School Supervisor';
    case 'INDUSTRY': return 'Industry Supervisor';
    case 'COORDINATOR': return 'SIWES Coordinator';
    case 'ITF': return 'ITF Officer';
    default: return role;
  }
};

const MainLayout = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <nav className="navbar">
        <div className="navbar-brand" style={{ cursor: 'pointer' }} onClick={() => navigate('/dashboard')}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: '6px',
              backgroundColor: 'var(--primary)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: '1rem',
              letterSpacing: '-0.03em'
            }}
          >
            S
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--text-main)', lineHeight: 1.2 }}>
              SIWES Tracker
            </span>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              Federal Industrial Training System
            </span>
          </div>
        </div>

        <div className="navbar-actions">
          {/* Notifications */}
          <NotificationCenter />

          {/* User badge */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 12px',
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)'
            }}
          >
            <div
              style={{
                width: 24,
                height: 24,
                borderRadius: '50%',
                backgroundColor: 'var(--surface-hover)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--text-main)'
              }}
            >
              <User size={14} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)', lineHeight: 1.2 }}>
                {user.name}
              </span>
              <span style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>
                {formatRoleLabel(user.role)}
              </span>
            </div>
          </div>

          {/* Logout */}
          <button
            type="button"
            className="btn-secondary"
            style={{ padding: '8px 12px', display: 'flex', alignItems: 'center', gap: '6px' }}
            onClick={handleLogout}
            title="Log out"
          >
            <LogOut size={15} />
            <span style={{ fontSize: '0.85rem' }}>Logout</span>
          </button>
        </div>
      </nav>

      <main className="container" style={{ flex: 1, width: '100%' }}>
        <Outlet />
      </main>
    </div>
  );
};

export default MainLayout;
