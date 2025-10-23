import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Order } from '../types';
import { OrderStatus, PaymentStatus } from '../types';
import api from '../services/api';
import { Plus, Search, Eye, ShoppingBag, Calendar, X } from 'lucide-react';
import OrderModal from '../components/OrderModal';
import './Orders.css';

const Orders: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [filters, setFilters] = useState({
    status: '',
    paymentStatus: '',
    search: '',
    collectionDate: '',
  });

  const navigate = useNavigate();

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await api.getOrders() as { orders: Order[] };
      setOrders(response.orders || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  };

  const filteredOrders = orders.filter((order) => {
    if (filters.status && order.status !== filters.status) return false;
    if (filters.paymentStatus && order.paymentStatus !== filters.paymentStatus)
      return false;
    if (filters.collectionDate) {
      const orderDate = new Date(order.collectionDate).toISOString().split('T')[0];
      if (orderDate !== filters.collectionDate) return false;
    }
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      return (
        order.orderNumber.toLowerCase().includes(searchLower) ||
        order.guestDetails.name.toLowerCase().includes(searchLower) ||
        order.guestDetails.email.toLowerCase().includes(searchLower)
      );
    }
    return true;
  });

  const getStatusBadgeClass = (status: OrderStatus) => {
    const statusMap: Record<OrderStatus, string> = {
      [OrderStatus.PENDING]: 'badge-warning',
      [OrderStatus.CONFIRMED]: 'badge-info',
      [OrderStatus.AWAITING_COLLECTION]: 'badge-primary',
      [OrderStatus.COLLECTED]: 'badge-success',
      [OrderStatus.CANCELLED]: 'badge-danger',
      [OrderStatus.REFUNDED]: 'badge-danger',
      [OrderStatus.ON_HOLD]: 'badge-warning',
      [OrderStatus.DELAYED]: 'badge-warning',
      [OrderStatus.DELETED]: 'badge-danger',
    };
    return statusMap[status] || 'badge-default';
  };

  const getPaymentBadgeClass = (status: PaymentStatus) => {
    const statusMap: Record<PaymentStatus, string> = {
      [PaymentStatus.PENDING]: 'badge-warning',
      [PaymentStatus.PARTIAL]: 'badge-info',
      [PaymentStatus.PAID]: 'badge-success',
      [PaymentStatus.REFUNDED]: 'badge-danger',
    };
    return statusMap[status] || 'badge-default';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="loading-container">
        <p>Loading orders...</p>
      </div>
    );
  }

  return (
    <div className="orders-page">
      <div className="page-header">
        <div>
          <h1>Orders</h1>
          <p>Manage all festive takeaway orders</p>
        </div>
        <button
          className="btn-primary"
          onClick={() => setIsOrderModalOpen(true)}
        >
          <Plus size={18} />
          <span>New Order</span>
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="card">
        <div className="filters">
          <div className="search-wrapper">
            <Search className="search-icon" size={18} />
            <input
              type="text"
              placeholder="Search by order number, name, or email..."
              value={filters.search}
              onChange={(e) =>
                setFilters({ ...filters, search: e.target.value })
              }
              className="search-input"
            />
          </div>

          <div className="date-filter-wrapper">
            <Calendar className="filter-icon" size={18} />
            <input
              type="date"
              value={filters.collectionDate}
              onChange={(e) =>
                setFilters({ ...filters, collectionDate: e.target.value })
              }
              className="date-filter-input"
              placeholder="Collection Date"
            />
            {filters.collectionDate && (
              <button
                className="clear-date-btn"
                onClick={() => setFilters({ ...filters, collectionDate: '' })}
                title="Clear date filter"
              >
                <X size={16} />
              </button>
            )}
          </div>

          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
          >
            <option value="">All Statuses</option>
            {Object.values(OrderStatus).map((status) => (
              <option key={status} value={status}>
                {status.replace(/_/g, ' ').toUpperCase()}
              </option>
            ))}
          </select>

          <select
            value={filters.paymentStatus}
            onChange={(e) =>
              setFilters({ ...filters, paymentStatus: e.target.value })
            }
          >
            <option value="">All Payment Statuses</option>
            {Object.values(PaymentStatus).map((status) => (
              <option key={status} value={status}>
                {status.toUpperCase()}
              </option>
            ))}
          </select>

          {(filters.status || filters.paymentStatus || filters.collectionDate || filters.search) && (
            <button
              className="btn-secondary btn-sm"
              onClick={() => setFilters({ status: '', paymentStatus: '', search: '', collectionDate: '' })}
            >
              <X size={16} />
              <span>Clear All Filters</span>
            </button>
          )}
        </div>

        {filteredOrders.length === 0 ? (
          <div className="empty-state">
            <ShoppingBag size={48} className="empty-state-icon" />
            <p>No orders found</p>
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Order #</th>
                  <th>Customer</th>
                  <th>Collection Date</th>
                  <th>Items</th>
                  <th>Total</th>
                  <th>Payment</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order) => (
                  <tr key={order._id}>
                    <td className="order-number">{order.orderNumber}</td>
                    <td>
                      <div className="customer-info">
                        <strong>{order.guestDetails.name}</strong>
                        <span>{order.guestDetails.email}</span>
                      </div>
                    </td>
                    <td>
                      {formatDate(order.collectionDate)}
                      <br />
                      <small>{order.collectionTime}</small>
                    </td>
                    <td>{order.items.length}</td>
                    <td className="amount">AED {order.totalAmount.toFixed(2)}</td>
                    <td>
                      <span className={`badge ${getPaymentBadgeClass(order.paymentStatus)}`}>
                        {order.paymentStatus}
                      </span>
                      <br />
                      <small>Paid: AED {order.totalPaid.toFixed(2)}</small>
                    </td>
                    <td>
                      <span className={`badge ${getStatusBadgeClass(order.status)}`}>
                        {order.status.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td>
                      <button
                        className="btn-secondary btn-sm"
                        onClick={() => navigate(`/dashboard/orders/${order._id}`)}
                      >
                        <Eye size={16} />
                        <span>View</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <OrderModal
        isOpen={isOrderModalOpen}
        onClose={() => setIsOrderModalOpen(false)}
        onSuccess={() => {
          fetchOrders();
          setIsOrderModalOpen(false);
        }}
      />
    </div>
  );
};

export default Orders;
