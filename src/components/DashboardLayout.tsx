import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { UserRole } from '../types';
import './DashboardLayout.css';

const DashboardLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="dashboard-layout">
      <aside className="sidebar">
        <div className="sidebar-header">
          <h2>Turkey Take-Away</h2>
          <p>Order Management</p>
        </div>

        <nav className="sidebar-nav">
          <NavLink to="/dashboard" end className="nav-link">
            <span className="nav-icon">📊</span>
            <span>Dashboard</span>
          </NavLink>

          <NavLink to="/dashboard/orders" className="nav-link">
            <span className="nav-icon">📋</span>
            <span>Orders</span>
          </NavLink>

          {user?.role === UserRole.ADMIN && (
            <NavLink to="/dashboard/menu-items" className="nav-link">
              <span className="nav-icon">🍽️</span>
              <span>Menu Items</span>
            </NavLink>
          )}

          {user?.role === UserRole.ADMIN && (
            <NavLink to="/dashboard/users" className="nav-link">
              <span className="nav-icon">👥</span>
              <span>Users</span>
            </NavLink>
          )}

          <NavLink to="/dashboard/analytics" className="nav-link">
            <span className="nav-icon">📈</span>
            <span>Analytics</span>
          </NavLink>
        </nav>

        <div className="sidebar-footer">
          <div className="user-info">
            <div className="user-avatar">
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="user-details">
              <p className="user-name">{user?.name}</p>
              <p className="user-role">{user?.role}</p>
            </div>
          </div>
          <button onClick={handleLogout} className="btn-secondary w-full">
            Logout
          </button>
        </div>
      </aside>

      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
};

export default DashboardLayout;
