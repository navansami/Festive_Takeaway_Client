import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Order } from '../types';
import { OrderStatus } from '../types';
import api from '../services/api';
import './Dashboard.css';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await api.getOrders() as { orders: Order[] };
      setOrders(response.orders || []);
    } catch (err) {
      console.error('Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  };

  const stats = {
    total: orders.length,
    pending: orders.filter((o) => o.status === OrderStatus.PENDING).length,
    confirmed: orders.filter((o) => o.status === OrderStatus.CONFIRMED).length,
    collected: orders.filter((o) => o.status === OrderStatus.COLLECTED).length,
    totalRevenue: orders.reduce((sum, o) => sum + o.totalAmount, 0),
    totalPaid: orders.reduce((sum, o) => sum + o.totalPaid, 0),
  };

  const recentOrders = orders.slice(0, 5);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="loading-container">
        <p>Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      <div className="page-header">
        <div>
          <h1>Dashboard</h1>
          <p>Overview of festive takeaway orders</p>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card card">
          <div className="stat-icon">📦</div>
          <div className="stat-details">
            <p className="stat-label">Total Orders</p>
            <h2 className="stat-value">{stats.total}</h2>
          </div>
        </div>

        <div className="stat-card card">
          <div className="stat-icon">⏳</div>
          <div className="stat-details">
            <p className="stat-label">Pending</p>
            <h2 className="stat-value">{stats.pending}</h2>
          </div>
        </div>

        <div className="stat-card card">
          <div className="stat-icon">✅</div>
          <div className="stat-details">
            <p className="stat-label">Confirmed</p>
            <h2 className="stat-value">{stats.confirmed}</h2>
          </div>
        </div>

        <div className="stat-card card">
          <div className="stat-icon">✨</div>
          <div className="stat-details">
            <p className="stat-label">Collected</p>
            <h2 className="stat-value">{stats.collected}</h2>
          </div>
        </div>

        <div className="stat-card card">
          <div className="stat-icon">💰</div>
          <div className="stat-details">
            <p className="stat-label">Total Revenue</p>
            <h2 className="stat-value">AED {stats.totalRevenue.toFixed(2)}</h2>
          </div>
        </div>

        <div className="stat-card card">
          <div className="stat-icon">💳</div>
          <div className="stat-details">
            <p className="stat-label">Total Paid</p>
            <h2 className="stat-value">AED {stats.totalPaid.toFixed(2)}</h2>
          </div>
        </div>
      </div>

      <div className="dashboard-sections">
        <div className="card">
          <div className="section-header">
            <h3>Recent Orders</h3>
            <button
              className="btn-secondary btn-sm"
              onClick={() => navigate('/dashboard/orders')}
            >
              View All
            </button>
          </div>

          {recentOrders.length === 0 ? (
            <div className="empty-state">
              <p>No orders yet</p>
              <button
                className="btn-primary mt-md"
                onClick={() => navigate('/dashboard/orders/new')}
              >
                Create Your First Order
              </button>
            </div>
          ) : (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Order #</th>
                    <th>Customer</th>
                    <th>Collection Date</th>
                    <th>Total</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map((order) => (
                    <tr
                      key={order._id}
                      onClick={() => navigate(`/dashboard/orders/${order._id}`)}
                      style={{ cursor: 'pointer' }}
                    >
                      <td className="order-number">{order.orderNumber}</td>
                      <td>{order.guestDetails.name}</td>
                      <td>{formatDate(order.collectionDate)}</td>
                      <td className="amount">AED {order.totalAmount.toFixed(2)}</td>
                      <td>
                        <span
                          className={`badge ${
                            order.status === OrderStatus.PENDING
                              ? 'badge-warning'
                              : order.status === OrderStatus.CONFIRMED
                              ? 'badge-info'
                              : order.status === OrderStatus.COLLECTED
                              ? 'badge-success'
                              : 'badge-default'
                          }`}
                        >
                          {order.status.replace(/_/g, ' ')}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
