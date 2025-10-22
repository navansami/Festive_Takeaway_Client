import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { UserRole } from '../types';
import { LayoutDashboard, ShoppingBag, UtensilsCrossed, Users, TrendingUp, LogOut } from 'lucide-react';
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
            <LayoutDashboard className="nav-icon" size={20} />
            <span>Dashboard</span>
          </NavLink>

          <NavLink to="/dashboard/orders" className="nav-link">
            <ShoppingBag className="nav-icon" size={20} />
            <span>Orders</span>
          </NavLink>

          {user?.role === UserRole.ADMIN && (
            <NavLink to="/dashboard/menu-items" className="nav-link">
              <UtensilsCrossed className="nav-icon" size={20} />
              <span>Menu Items</span>
            </NavLink>
          )}

          {user?.role === UserRole.ADMIN && (
            <NavLink to="/dashboard/users" className="nav-link">
              <Users className="nav-icon" size={20} />
              <span>Users</span>
            </NavLink>
          )}

          <NavLink to="/dashboard/analytics" className="nav-link">
            <TrendingUp className="nav-icon" size={20} />
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
          <button onClick={handleLogout} className="btn-secondary w-full logout-btn">
            <LogOut size={18} />
            <span>Logout</span>
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
