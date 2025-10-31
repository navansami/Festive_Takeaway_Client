import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Order } from '../types';
import { OrderStatus, PaymentStatus, UserRole } from '../types';
import api from '../services/api';
import { Plus, Search, Eye, ShoppingBag, Calendar, X, Trash2, Copy, Check } from 'lucide-react';
import OrderModal from '../components/OrderModal';
import { useAuth } from '../contexts/AuthContext';
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
  const [hoveredOrder, setHoveredOrder] = useState<string | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const [copied, setCopied] = useState(false);
  const tooltipRef = useRef<HTMLDivElement>(null);

  const navigate = useNavigate();
  const { user } = useAuth();

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

  const formatOrderSummary = (order: Order): string => {
    const collectionDateTime = `${formatDate(order.collectionDate)} at ${order.collectionTime}`;
    const divider = '─'.repeat(40);

    let summary = `Collection: ${collectionDateTime}\n${divider}\n\n`;

    order.items.forEach((item) => {
      const itemPrice = item.isIncludedInBundle
        ? 'AED 0.00 (included)'
        : `AED ${item.price.toFixed(2)}`;
      summary += `${item.quantity}x ${item.name} - ${item.servingSize}\n   ${itemPrice}\n\n`;
    });

    summary += `${divider}\n`;
    summary += `Total: AED ${order.totalAmount.toFixed(2)}`;

    return summary;
  };

  const handleCopyToClipboard = async (order: Order) => {
    const summary = formatOrderSummary(order);
    try {
      await navigator.clipboard.writeText(summary);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
    }
  };

  const handleRowHover = (orderId: string, event: React.MouseEvent<HTMLTableRowElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    setTooltipPosition({
      x: rect.right + 10,
      y: rect.top
    });
    setHoveredOrder(orderId);
  };

  const handleDelete = async (order: Order) => {
    if (!window.confirm(
      `Are you sure you want to delete order ${order.orderNumber}?\n\nCustomer: ${order.guestDetails.name}\nTotal: AED ${order.totalAmount.toFixed(2)}\n\nThis action cannot be undone.`
    )) {
      return;
    }

    try {
      await api.deleteOrder(order._id);
      setOrders(orders.filter(o => o._id !== order._id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete order');
    }
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
                  <tr
                    key={order._id}
                    onMouseEnter={(e) => handleRowHover(order._id, e)}
                    onMouseLeave={() => setHoveredOrder(null)}
                  >
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
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                          className="btn-secondary btn-sm"
                          onClick={() => navigate(`/dashboard/orders/${order._id}`)}
                        >
                          <Eye size={16} />
                          <span>View</span>
                        </button>
                        {user?.role === UserRole.ADMIN && (
                          <button
                            className="btn-danger btn-sm"
                            onClick={() => handleDelete(order)}
                          >
                            <Trash2 size={16} />
                            <span>Delete</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Order Details Tooltip */}
      {hoveredOrder && (
        <div
          ref={tooltipRef}
          className="order-tooltip"
          style={{
            position: 'fixed',
            left: `${tooltipPosition.x}px`,
            top: `${tooltipPosition.y}px`,
            zIndex: 1000,
          }}
        >
          {(() => {
            const order = orders.find(o => o._id === hoveredOrder);
            if (!order) return null;

            return (
              <>
                <div className="tooltip-header">
                  <h4>Order {order.orderNumber}</h4>
                  <button
                    className="btn-copy"
                    onClick={() => handleCopyToClipboard(order)}
                    title="Copy to clipboard"
                  >
                    {copied ? <Check size={16} /> : <Copy size={16} />}
                  </button>
                </div>
                <div className="tooltip-content">
                  <div className="tooltip-section">
                    <Calendar size={14} />
                    <span>
                      {formatDate(order.collectionDate)} at {order.collectionTime}
                    </span>
                  </div>
                  <div className="tooltip-divider"></div>
                  <div className="tooltip-items">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="tooltip-item">
                        <div className="tooltip-item-details">
                          <span className="tooltip-item-qty">{item.quantity}x</span>
                          <div className="tooltip-item-info">
                            <span className="tooltip-item-name">{item.name}</span>
                            <span className="tooltip-item-serving">{item.servingSize}</span>
                          </div>
                        </div>
                        <span className={`tooltip-item-price ${item.isIncludedInBundle ? 'included' : ''}`}>
                          {item.isIncludedInBundle
                            ? 'Included'
                            : `AED ${item.price.toFixed(2)}`}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="tooltip-divider"></div>
                  <div className="tooltip-total">
                    <span>Total</span>
                    <span className="tooltip-total-amount">AED {order.totalAmount.toFixed(2)}</span>
                  </div>
                </div>
              </>
            );
          })()}
        </div>
      )}

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
