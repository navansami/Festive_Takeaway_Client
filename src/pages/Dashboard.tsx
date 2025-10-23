import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  TrendingUp,
  ShoppingBag,
  Clock,
  CheckCircle,
  DollarSign,
  Users,
  Calendar,
  Package,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import api from '../services/api';
import './Dashboard.css';

interface DashboardStats {
  totalRevenue: number;
  totalPaid: number;
  totalOrders: number;
  averageOrderValue: number;
  todayRevenue: number;
  todayOrdersCount: number;
  totalGuests: number;
  statusCounts: Record<string, number>;
  revenueTrend: Array<{
    date: string;
    revenue: number;
    orders: number;
  }>;
  topItems: Array<{
    name: string;
    servingSize: string;
    quantity: number;
    totalRevenue: number;
  }>;
  upcomingCollections: Array<{
    _id: string;
    orderNumber: string;
    guestName: string;
    collectionDate: string;
    collectionTime: string;
    totalAmount: number;
    status: string;
  }>;
}

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const response = await api.getDashboardStats() as { success: boolean; stats: DashboardStats };
      setStats(response.stats);
    } catch (err) {
      console.error('Failed to fetch dashboard stats:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !stats) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  // Prepare chart data
  const statusData = Object.entries(stats.statusCounts).map(([status, count]) => ({
    name: status.replace(/_/g, ' '),
    value: count,
  }));

  const COLORS = {
    PENDING: '#f59e0b',
    CONFIRMED: '#3b82f6',
    COLLECTED: '#10b981',
    CANCELLED: '#ef4444',
    REFUNDED: '#8b5cf6',
    ON_HOLD: '#f97316',
    AWAITING_COLLECTION: '#06b6d4',
    DELAYED: '#ec4899',
    DELETED: '#6b7280',
  };

  const formatCurrency = (value: number) => `AED ${value.toFixed(2)}`;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const formatFullDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="dashboard-page-new">
      {/* Header */}
      <div className="dashboard-header-new">
        <div>
          <h1>Dashboard</h1>
          <p className="dashboard-subtitle">Welcome back! Here's what's happening with your festive orders.</p>
        </div>
      </div>

      {/* Stats Cards Grid */}
      <div className="stats-grid-new">
        {/* Total Revenue Card */}
        <div className="stat-card-new gradient-primary">
          <div className="stat-card-icon">
            <DollarSign size={20} />
          </div>
          <div className="stat-card-content">
            <p className="stat-label-new">Total Revenue</p>
            <h2 className="stat-value-new">{formatCurrency(stats.totalRevenue)}</h2>
            <div className="stat-footer">
              <span className="stat-badge success">
                <ArrowUpRight size={14} />
                Total orders value
              </span>
            </div>
          </div>
        </div>

        {/* Total Orders Card */}
        <div className="stat-card-new gradient-info">
          <div className="stat-card-icon">
            <ShoppingBag size={20} />
          </div>
          <div className="stat-card-content">
            <p className="stat-label-new">Total Orders</p>
            <h2 className="stat-value-new">{stats.totalOrders}</h2>
            <div className="stat-footer">
              <span className="stat-badge info">All time</span>
            </div>
          </div>
        </div>

        {/* Pending Orders Card */}
        <div className="stat-card-new gradient-warning">
          <div className="stat-card-icon">
            <Clock size={20} />
          </div>
          <div className="stat-card-content">
            <p className="stat-label-new">Pending Orders</p>
            <h2 className="stat-value-new">{stats.statusCounts.PENDING || 0}</h2>
            <div className="stat-footer">
              <span className="stat-badge warning">Needs attention</span>
            </div>
          </div>
        </div>

        {/* Collected Orders Card */}
        <div className="stat-card-new gradient-success">
          <div className="stat-card-icon">
            <CheckCircle size={20} />
          </div>
          <div className="stat-card-content">
            <p className="stat-label-new">Collected Orders</p>
            <h2 className="stat-value-new">{stats.statusCounts.COLLECTED || 0}</h2>
            <div className="stat-footer">
              <span className="stat-badge success">
                <ArrowUpRight size={14} />
                Completed
              </span>
            </div>
          </div>
        </div>

        {/* Average Order Value Card */}
        <div className="stat-card-new gradient-purple">
          <div className="stat-card-icon">
            <TrendingUp size={20} />
          </div>
          <div className="stat-card-content">
            <p className="stat-label-new">Avg Order Value</p>
            <h2 className="stat-value-new">{formatCurrency(stats.averageOrderValue)}</h2>
            <div className="stat-footer">
              <span className="stat-badge purple">Per order</span>
            </div>
          </div>
        </div>

        {/* Total Guests Card */}
        <div className="stat-card-new gradient-secondary">
          <div className="stat-card-icon">
            <Users size={20} />
          </div>
          <div className="stat-card-content">
            <p className="stat-label-new">Total Guests</p>
            <h2 className="stat-value-new">{stats.totalGuests}</h2>
            <div className="stat-footer">
              <span className="stat-badge secondary">Registered</span>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="charts-row">
        {/* Revenue Trend Chart */}
        <div className="chart-card">
          <div className="chart-header">
            <h3>Revenue Trend (Last 30 Days)</h3>
            <p>Daily revenue and order count</p>
          </div>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={stats.revenueTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  dataKey="date"
                  tickFormatter={formatDate}
                  stroke="#6b7280"
                  style={{ fontSize: '12px' }}
                />
                <YAxis
                  stroke="#6b7280"
                  style={{ fontSize: '12px' }}
                  tickFormatter={(value) => `${value}`}
                />
                <Tooltip
                  formatter={(value: any, name: string) => {
                    if (name === 'revenue') return [formatCurrency(value), 'Revenue'];
                    return [value, 'Orders'];
                  }}
                  labelFormatter={(label) => formatDate(label)}
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="#6366f1"
                  strokeWidth={3}
                  dot={{ fill: '#6366f1', r: 4 }}
                  activeDot={{ r: 6 }}
                  name="Revenue (AED)"
                />
                <Line
                  type="monotone"
                  dataKey="orders"
                  stroke="#10b981"
                  strokeWidth={3}
                  dot={{ fill: '#10b981', r: 4 }}
                  activeDot={{ r: 6 }}
                  name="Orders"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Order Status Distribution */}
        <div className="chart-card">
          <div className="chart-header">
            <h3>Order Status Distribution</h3>
            <p>Current order statuses</p>
          </div>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="45%"
                  innerRadius={40}
                  outerRadius={65}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[entry.name.replace(/ /g, '_').toUpperCase() as keyof typeof COLORS] || '#6b7280'} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: any) => [value, 'Orders']}
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                  }}
                />
                <Legend
                  verticalAlign="bottom"
                  align="center"
                  layout="horizontal"
                  iconType="circle"
                  iconSize={8}
                  formatter={(value, entry: any) => {
                    const percentage = entry.payload && statusData.length > 0
                      ? ((entry.payload.value / statusData.reduce((sum, item) => sum + item.value, 0)) * 100).toFixed(0)
                      : '0';
                    return `${value} (${percentage}%)`;
                  }}
                  wrapperStyle={{
                    fontSize: '0.688rem',
                    paddingTop: '10px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Top Selling Items Chart */}
      <div className="chart-card full-width">
        <div className="chart-header">
          <h3>Top Selling Items</h3>
          <p>Most popular menu items by quantity sold</p>
        </div>
        <div className="chart-container">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={stats.topItems.slice(0, 8)}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="name"
                stroke="#6b7280"
                style={{ fontSize: '12px' }}
                angle={-45}
                textAnchor="end"
                height={100}
              />
              <YAxis
                stroke="#6b7280"
                style={{ fontSize: '12px' }}
              />
              <Tooltip
                formatter={(value: any, name: string) => {
                  if (name === 'quantity') return [value, 'Quantity Sold'];
                  return [formatCurrency(value), 'Revenue'];
                }}
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                }}
              />
              <Legend />
              <Bar dataKey="quantity" fill="#6366f1" radius={[8, 8, 0, 0]} name="Quantity Sold" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bottom Row - Upcoming Collections and Quick Stats */}
      <div className="bottom-row">
        {/* Upcoming Collections */}
        <div className="upcoming-collections-card">
          <div className="section-header-new">
            <div>
              <h3>Upcoming Collections</h3>
              <p>Next 7 days</p>
            </div>
            <button
              className="btn-text"
              onClick={() => navigate('/dashboard/orders')}
            >
              View All
            </button>
          </div>

          {stats.upcomingCollections.length === 0 ? (
            <div className="empty-state-new">
              <Calendar size={48} className="empty-state-icon" />
              <p>No upcoming collections</p>
            </div>
          ) : (
            <div className="collections-list">
              {stats.upcomingCollections.map((collection) => (
                <div
                  key={collection._id}
                  className="collection-item"
                  onClick={() => navigate(`/dashboard/orders/${collection._id}`)}
                >
                  <div className="collection-icon">
                    <Package size={18} />
                  </div>
                  <div className="collection-details">
                    <div className="collection-header-row">
                      <span className="collection-order-number">{collection.orderNumber}</span>
                      <span className={`collection-badge ${collection.status.toLowerCase()}`}>
                        {collection.status.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <p className="collection-guest">{collection.guestName}</p>
                    <div className="collection-footer-row">
                      <span className="collection-date">
                        <Calendar size={14} />
                        {formatFullDate(collection.collectionDate)} at {collection.collectionTime}
                      </span>
                      <span className="collection-amount">{formatCurrency(collection.totalAmount)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions & Today's Stats */}
        <div className="quick-stats-card">
          <div className="section-header-new">
            <h3>Today's Performance</h3>
          </div>

          <div className="today-stats">
            <div className="today-stat-item">
              <div className="today-stat-icon revenue">
                <DollarSign size={18} />
              </div>
              <div>
                <p className="today-stat-label">Today's Revenue</p>
                <h4 className="today-stat-value">{formatCurrency(stats.todayRevenue)}</h4>
              </div>
            </div>

            <div className="today-stat-item">
              <div className="today-stat-icon orders">
                <ShoppingBag size={18} />
              </div>
              <div>
                <p className="today-stat-label">Today's Orders</p>
                <h4 className="today-stat-value">{stats.todayOrdersCount}</h4>
              </div>
            </div>

            <div className="today-stat-item">
              <div className="today-stat-icon pending">
                <Clock size={18} />
              </div>
              <div>
                <p className="today-stat-label">Amount Pending</p>
                <h4 className="today-stat-value">{formatCurrency(stats.totalRevenue - stats.totalPaid)}</h4>
              </div>
            </div>
          </div>

          <div className="quick-actions">
            <button
              className="btn-primary-new w-full"
              onClick={() => navigate('/dashboard/orders/new')}
            >
              <ShoppingBag size={16} />
              Create New Order
            </button>
            <button
              className="btn-secondary-new w-full"
              onClick={() => navigate('/dashboard/guests')}
            >
              <Users size={16} />
              Manage Guests
            </button>
            <button
              className="btn-secondary-new w-full"
              onClick={() => navigate('/dashboard/analytics')}
            >
              <TrendingUp size={16} />
              View Analytics
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
