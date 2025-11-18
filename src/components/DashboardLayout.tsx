import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { UserRole } from '../types';
import { LayoutDashboard, ShoppingBag, UtensilsCrossed, Users, TrendingUp, LogOut, UserCircle, Menu, X } from 'lucide-react';
import './DashboardLayout.css';
import MobileNav from './MobileNav';

const DashboardLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <div className="dashboard-layout">
      {/* Mobile Header */}
      <header className="mobile-header">
        <button
          className="mobile-menu-toggle"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label="Toggle menu"
        >
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
        <h1 className="mobile-title">Turkey Take-Away</h1>
        <div className="mobile-user-avatar">
          {user?.name?.charAt(0).toUpperCase() || 'U'}
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="mobile-overlay" onClick={closeMobileMenu} />
      )}

      <aside className={`sidebar ${isMobileMenuOpen ? 'mobile-open' : ''}`}>
        <div className="sidebar-header">
          <h2>Turkey Take-Away</h2>
          <p>Order Management</p>
        </div>

        <nav className="sidebar-nav">
          <NavLink to="/dashboard" end className="nav-link" onClick={closeMobileMenu}>
            <LayoutDashboard className="nav-icon" size={20} />
            <span>Dashboard</span>
          </NavLink>

          <NavLink to="/dashboard/orders" className="nav-link" onClick={closeMobileMenu}>
            <ShoppingBag className="nav-icon" size={20} />
            <span>Orders</span>
          </NavLink>

          <NavLink to="/dashboard/guests" className="nav-link" onClick={closeMobileMenu}>
            <UserCircle className="nav-icon" size={20} />
            <span>Guests</span>
          </NavLink>

          {user?.role === UserRole.ADMIN && (
            <NavLink to="/dashboard/menu-items" className="nav-link" onClick={closeMobileMenu}>
              <UtensilsCrossed className="nav-icon" size={20} />
              <span>Menu Items</span>
            </NavLink>
          )}

          {user?.role === UserRole.ADMIN && (
            <NavLink to="/dashboard/users" className="nav-link" onClick={closeMobileMenu}>
              <Users className="nav-icon" size={20} />
              <span>Users</span>
            </NavLink>
          )}

          <NavLink to="/dashboard/analytics" className="nav-link" onClick={closeMobileMenu}>
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

      <MobileNav />
    </div>
  );
};

export default DashboardLayout;
