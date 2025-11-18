import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  ShoppingBag,
  UserCircle,
  UtensilsCrossed,
  Users as UsersIcon,
  TrendingUp,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { UserRole } from '../types';
import './MobileNav.css';

const MobileNav: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const navLinks = [
    { to: '/dashboard', label: 'Home', icon: LayoutDashboard, exact: true },
    { to: '/dashboard/orders', label: 'Orders', icon: ShoppingBag },
    { to: '/dashboard/guests', label: 'Guests', icon: UserCircle },
  ];

  if (user?.role === UserRole.ADMIN) {
    navLinks.push(
      { to: '/dashboard/menu-items', label: 'Menu', icon: UtensilsCrossed },
      { to: '/dashboard/users', label: 'Users', icon: UsersIcon },
    );
  }

  navLinks.push({ to: '/dashboard/analytics', label: 'Insights', icon: TrendingUp });

  const isActive = (path: string, exact?: boolean) => {
    if (exact) {
      return location.pathname === path;
    }
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };

  return (
    <nav className="mobile-nav" role="navigation" aria-label="Primary">
      {navLinks.map((link) => {
        const ActiveIcon = link.icon;
        const active = isActive(link.to, link.exact);
        return (
          <button
            key={link.to}
            type="button"
            className={`mobile-nav-link ${active ? 'active' : ''}`}
            onClick={() => navigate(link.to)}
            aria-current={active ? 'page' : undefined}
          >
            <ActiveIcon size={20} />
            <span>{link.label}</span>
          </button>
        );
      })}
    </nav>
  );
};

export default MobileNav;
