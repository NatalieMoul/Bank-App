import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAdminAuth } from '../context/AdminAuthContext';

const NAV_ITEMS = [
  { to: '/users', label: 'Users' },
  { to: '/transactions', label: 'Transactions' },
  { to: '/reports', label: 'Reports' },
  { to: '/logs', label: 'Logs' },
  { to: '/settings', label: 'Settings' },
];

export default function DashboardLayout() {
  const { admin, logout } = useAdminAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="dashboard">
      <aside className="sidebar">
        <div className="brand">Bank Admin</div>
        <nav>
          {NAV_ITEMS.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => (isActive ? 'active' : '')}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <button className="logout-btn" onClick={handleLogout}>
          Log Out {admin ? `(${admin.name})` : ''}
        </button>
      </aside>

      <main className="main">
        <Outlet />
      </main>
    </div>
  );
}
