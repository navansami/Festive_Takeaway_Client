import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import type { Order } from '../types';
import {
  OrderStatus,
  PaymentStatus,
  PaymentMethod,
  UserRole,
} from '../types';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { ArrowLeft, Edit, Trash2, Calendar, User, MapPin, CreditCard, Package, Edit2 } from 'lucide-react';
import './OrderDetailNew.css';

const OrderDetailNew: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Status update state
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [newStatus, setNewStatus] = useState<OrderStatus>(OrderStatus.PENDING);
  const [statusNotes, setStatusNotes] = useState('');

  // Payment state
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(
    PaymentMethod.CARD
  );
  const [paymentNotes, setPaymentNotes] = useState('');

  // Edit payment state
  const [showEditPaymentModal, setShowEditPaymentModal] = useState(false);
  const [editingPaymentId, setEditingPaymentId] = useState<string | null>(null);
  const [editPaymentAmount, setEditPaymentAmount] = useState('');
  const [editPaymentMethod, setEditPaymentMethod] = useState<PaymentMethod>(PaymentMethod.CARD);
  const [editPaymentNotes, setEditPaymentNotes] = useState('');

  useEffect(() => {
    if (id) {
      fetchOrder();
    }
  }, [id]);

  const fetchOrder = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const response = await api.getOrderById(id) as { order: Order };
      setOrder(response.order);
      setNewStatus(response.order.status);
    } catch (err) {
      setError('Failed to fetch order details');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!order || !id) return;

    if (!window.confirm(
      `Are you sure you want to delete order ${order.orderNumber}?\n\nCustomer: ${order.guestDetails.name}\nTotal: AED ${(order.totalAmount || 0).toFixed(2)}\n\nThis action cannot be undone.`
    )) {
      return;
    }

    try {
      await api.deleteOrder(id);
      navigate('/dashboard/orders');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete order');
    }
  };

  const handleStatusUpdate = async () => {
    if (!id) return;
    try {
      await api.updateOrderStatus(id, newStatus, statusNotes);
      setShowStatusModal(false);
      setStatusNotes('');
      await fetchOrder();
    } catch (err) {
      setError('Failed to update order status');
    }
  };

  const handlePaymentAdd = async () => {
    if (!id || !order) return;
    try {
      const paymentAmountNum = parseFloat(paymentAmount);

      await api.addPayment(id, {
        amount: paymentAmountNum,
        method: paymentMethod,
        notes: paymentNotes,
      });

      // Check if payment is now complete and order is pending
      const newTotalPaid = (order.totalPaid || 0) + paymentAmountNum;
      const isPaidInFull = newTotalPaid >= (order.totalAmount || 0);

      // Auto-confirm order if paid in full and currently pending
      if (isPaidInFull && order.status === OrderStatus.PENDING) {
        await api.updateOrderStatus(id, OrderStatus.CONFIRMED, 'Auto-confirmed after full payment');
      }

      setShowPaymentModal(false);
      setPaymentAmount('');
      setPaymentNotes('');
      await fetchOrder();
    } catch (err) {
      setError('Failed to add payment');
    }
  };

  const handleEditPayment = (payment: any) => {
    setEditingPaymentId(payment._id);
    setEditPaymentAmount(payment.amount.toString());
    setEditPaymentMethod(payment.method);
    setEditPaymentNotes(payment.notes || '');
    setShowEditPaymentModal(true);
  };

  const handleUpdatePayment = async () => {
    if (!id || !editingPaymentId) return;
    try {
      await api.updatePayment(id, editingPaymentId, {
        amount: parseFloat(editPaymentAmount),
        method: editPaymentMethod,
        notes: editPaymentNotes,
      });

      setShowEditPaymentModal(false);
      setEditingPaymentId(null);
      setEditPaymentAmount('');
      setEditPaymentNotes('');
      await fetchOrder();
    } catch (err) {
      setError('Failed to update payment');
    }
  };

  const handleDeletePayment = async (paymentId: string) => {
    if (!id) return;

    if (!window.confirm('Are you sure you want to delete this payment record? This action cannot be undone.')) {
      return;
    }

    try {
      await api.deletePayment(id, paymentId);
      await fetchOrder();
    } catch (err) {
      setError('Failed to delete payment');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusBadgeClass = (status: OrderStatus) => {
    const statusMap: Record<OrderStatus, string> = {
      [OrderStatus.PENDING]: 'status-badge-warning',
      [OrderStatus.CONFIRMED]: 'status-badge-info',
      [OrderStatus.AWAITING_COLLECTION]: 'status-badge-primary',
      [OrderStatus.COLLECTED]: 'status-badge-success',
      [OrderStatus.CANCELLED]: 'status-badge-danger',
      [OrderStatus.REFUNDED]: 'status-badge-danger',
      [OrderStatus.ON_HOLD]: 'status-badge-warning',
      [OrderStatus.DELAYED]: 'status-badge-warning',
      [OrderStatus.DELETED]: 'status-badge-danger',
    };
    return statusMap[status] || 'status-badge-default';
  };

  const getPaymentBadgeClass = (status: PaymentStatus) => {
    const statusMap: Record<PaymentStatus, string> = {
      [PaymentStatus.PENDING]: 'status-badge-warning',
      [PaymentStatus.PARTIAL]: 'status-badge-info',
      [PaymentStatus.PAID]: 'status-badge-success',
      [PaymentStatus.REFUNDED]: 'status-badge-danger',
    };
    return statusMap[status] || 'status-badge-default';
  };

  if (loading) {
    return (
      <div className="loading-container">
        <p>Loading order details...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="error-container">
        <p>Order not found</p>
        <button
          className="btn-primary"
          onClick={() => navigate('/dashboard/orders')}
        >
          Back to Orders
        </button>
      </div>
    );
  }

  return (
    <div className="order-detail-new">
      {/* Header */}
      <div className="order-header">
        <div className="order-header-top">
          <button className="btn-back" onClick={() => navigate('/dashboard/orders')}>
            <ArrowLeft size={20} />
            <span>Back to Orders</span>
          </button>
          <div className="order-header-actions">
            <button className="btn-secondary-outline" onClick={() => navigate(`/dashboard/orders/${id}/edit`)}>
              <Edit size={18} />
              <span>Edit Order</span>
            </button>
            {user?.role === UserRole.ADMIN && (
              <button className="btn-danger-outline" onClick={handleDelete}>
                <Trash2 size={18} />
                <span>Delete</span>
              </button>
            )}
          </div>
        </div>

        <div className="order-header-content">
          <div className="order-header-info">
            <div className="order-title-group">
              <h1 className="order-title">Order {order.orderNumber}</h1>
              <div className="order-badges">
                <span className={`status-badge ${getStatusBadgeClass(order.status)}`}>
                  {order.status.replace(/_/g, ' ')}
                </span>
                <span className={`status-badge ${getPaymentBadgeClass(order.paymentStatus)}`}>
                  {order.paymentStatus}
                </span>
              </div>
            </div>
            <p className="order-date">Created on {formatDateTime(order.createdAt)}</p>
          </div>
        </div>
      </div>

      {error && <div className="error-alert">{error}</div>}

      {/* Main Content */}
      <div className="order-content">
        <div className="order-main">
          {/* Order Items */}
          <div className="content-card">
            <div className="card-header-icon">
              <Package size={20} />
              <h2>Order Items</h2>
            </div>
            <div className="items-table">
              <table>
                <thead>
                  <tr>
                    <th>Item</th>
                    <th className="text-center">Quantity</th>
                    <th className="text-right">Price</th>
                    <th className="text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {order.items.map((item, index) => (
                    <tr key={item._id || index}>
                      <td>
                        <div className="item-name-group">
                          <span className="item-name">{item.name}</span>
                          <span className="item-serving">{item.servingSize}</span>
                          {item.notes && <span className="item-notes">{item.notes}</span>}
                          {item.isIncludedInBundle && (
                            <span className="item-badge">Included in Bundle</span>
                          )}
                        </div>
                      </td>
                      <td className="text-center">{item.quantity}</td>
                      <td className="text-right">
                        {item.isIncludedInBundle ? (
                          <span className="price-free">FREE</span>
                        ) : (
                          `AED ${item.price.toFixed(2)}`
                        )}
                      </td>
                      <td className="text-right font-semibold">
                        {item.isIncludedInBundle ? (
                          <span className="price-free">AED 0.00</span>
                        ) : (
                          `AED ${item.totalPrice.toFixed(2)}`
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Order Summary */}
            <div className="order-summary">
              <div className="summary-row">
                <span>Subtotal</span>
                <span>AED {(order.subtotalAmount || order.totalAmount || 0).toFixed(2)}</span>
              </div>
              {order.discountPercentage && order.discountPercentage > 0 && (
                <div className="summary-row discount-row">
                  <span>
                    Discount ({order.discountPercentage}%)
                    {order.discountName && <><br /><small className="discount-name">{order.discountName}</small></>}
                  </span>
                  <span className="discount-amount">-AED {(order.discountAmount || 0).toFixed(2)}</span>
                </div>
              )}
              <div className="summary-row total-row">
                <span>Total</span>
                <span className="total-amount">AED {(order.totalAmount || 0).toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Guest Information */}
          <div className="content-card">
            <div className="card-header-icon">
              <User size={20} />
              <h2>Guest Information</h2>
            </div>
            <div className="info-grid">
              <div className="info-item">
                <label>Name</label>
                <p>{order.guestDetails.name}</p>
              </div>
              <div className="info-item">
                <label>Email</label>
                <p>{order.guestDetails.email}</p>
              </div>
              <div className="info-item">
                <label>Phone</label>
                <p>{order.guestDetails.phone}</p>
              </div>
              <div className="info-item info-item-full">
                <label>Address</label>
                <p className="address-text">
                  <MapPin size={14} />
                  {order.guestDetails.address}
                </p>
              </div>
            </div>
          </div>

          {/* Collection Person (if different) */}
          {order.collectionPerson.name && order.collectionPerson.name !== order.guestDetails.name && (
            <div className="content-card">
              <div className="card-header-icon">
                <User size={20} />
                <h2>Collection Person</h2>
              </div>
              <div className="info-grid">
                <div className="info-item">
                  <label>Name</label>
                  <p>{order.collectionPerson.name}</p>
                </div>
                {order.collectionPerson.email && (
                  <div className="info-item">
                    <label>Email</label>
                    <p>{order.collectionPerson.email}</p>
                  </div>
                )}
                {order.collectionPerson.phone && (
                  <div className="info-item">
                    <label>Phone</label>
                    <p>{order.collectionPerson.phone}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="order-sidebar">
          {/* Status Card */}
          <div className="sidebar-card">
            <h3>Status</h3>
            <div className="status-display">
              <span className={`status-badge-large ${getStatusBadgeClass(order.status)}`}>
                {order.status.replace(/_/g, ' ')}
              </span>
              <button className="btn-primary btn-full" onClick={() => setShowStatusModal(true)}>
                Update Status
              </button>
            </div>
          </div>

          {/* Collection Details */}
          <div className="sidebar-card">
            <div className="sidebar-header-icon">
              <Calendar size={18} />
              <h3>Collection Details</h3>
            </div>
            <div className="sidebar-info">
              <div className="sidebar-info-row">
                <span className="label">Date</span>
                <span className="value">{formatDate(order.collectionDate)}</span>
              </div>
              <div className="sidebar-info-row">
                <span className="label">Time</span>
                <span className="value">{order.collectionTime}</span>
              </div>
            </div>
          </div>

          {/* Payment Information */}
          <div className="sidebar-card">
            <div className="sidebar-header-icon">
              <CreditCard size={18} />
              <h3>Payment</h3>
            </div>
            <div className="sidebar-info">
              <div className="sidebar-info-row">
                <span className="label">Method</span>
                <span className="value">{order.paymentMethod.replace(/_/g, ' ').toUpperCase()}</span>
              </div>
              <div className="sidebar-info-row">
                <span className="label">Status</span>
                <span className={`status-badge ${getPaymentBadgeClass(order.paymentStatus)}`}>
                  {order.paymentStatus}
                </span>
              </div>
            </div>

            <div className="payment-amounts-box">
              <div className="payment-amount-row">
                <span>Total Amount</span>
                <span className="amount-large">AED {(order.totalAmount || 0).toFixed(2)}</span>
              </div>
              <div className="payment-amount-row">
                <span>Paid</span>
                <span className="amount-paid">AED {(order.totalPaid || 0).toFixed(2)}</span>
              </div>
              <div className="payment-amount-row balance-row">
                <span>Balance</span>
                <span className="amount-balance">AED {((order.totalAmount || 0) - (order.totalPaid || 0)).toFixed(2)}</span>
              </div>
            </div>

            <button className="btn-success btn-full" onClick={() => setShowPaymentModal(true)}>
              Add Payment
            </button>
          </div>

          {/* Payment History */}
          {order.paymentRecords && order.paymentRecords.length > 0 && (
            <div className="sidebar-card">
              <h3>Payment History</h3>
              <div className="payment-history-list">
                {order.paymentRecords.map((payment, index) => (
                  <div key={payment._id || index} className="payment-record">
                    <div className="payment-record-header">
                      <span className="payment-date">{formatDateTime(payment.receivedAt)}</span>
                      <div className="payment-header-right">
                        <span className="payment-amount">AED {payment.amount.toFixed(2)}</span>
                        {user?.role === UserRole.ADMIN && (
                          <div className="payment-actions">
                            <button
                              className="payment-action-btn"
                              onClick={() => handleEditPayment(payment)}
                              title="Edit payment"
                            >
                              <Edit2 size={14} />
                            </button>
                            <button
                              className="payment-action-btn payment-action-delete"
                              onClick={() => handleDeletePayment(payment._id)}
                              title="Delete payment"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="payment-record-details">
                      <span className="payment-method-label">{payment.method.replace(/_/g, ' ')}</span>
                      {payment.notes && <p className="payment-notes">{payment.notes}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Status Update Modal */}
      {showStatusModal && (
        <div className="modal-overlay" onClick={() => setShowStatusModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Update Order Status</h3>
              <button
                className="modal-close"
                onClick={() => setShowStatusModal(false)}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>New Status</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as OrderStatus)}
                  className="form-select"
                >
                  {Object.values(OrderStatus).map((status) => (
                    <option key={status} value={status}>
                      {status.replace(/_/g, ' ')}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Notes</label>
                <textarea
                  value={statusNotes}
                  onChange={(e) => setStatusNotes(e.target.value)}
                  placeholder="Add notes about this status change..."
                  rows={4}
                  className="form-textarea"
                />
              </div>
            </div>
            <div className="modal-footer">
              <button
                className="btn-secondary"
                onClick={() => setShowStatusModal(false)}
              >
                Cancel
              </button>
              <button
                className="btn-primary"
                onClick={handleStatusUpdate}
              >
                Update Status
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="modal-overlay" onClick={() => setShowPaymentModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Add Payment</h3>
              <button
                className="modal-close"
                onClick={() => setShowPaymentModal(false)}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Amount (AED)</label>
                <input
                  type="number"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  placeholder="0.00"
                  step="0.01"
                  className="form-input"
                />
                <small className="form-hint">
                  Balance due: AED {((order.totalAmount || 0) - (order.totalPaid || 0)).toFixed(2)}
                </small>
              </div>
              <div className="form-group">
                <label>Payment Method</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                  className="form-select"
                >
                  {Object.values(PaymentMethod).map((method) => (
                    <option key={method} value={method}>
                      {method.replace(/_/g, ' ').toUpperCase()}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Notes</label>
                <textarea
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  placeholder="Add payment notes..."
                  rows={3}
                  className="form-textarea"
                />
              </div>
            </div>
            <div className="modal-footer">
              <button
                className="btn-secondary"
                onClick={() => setShowPaymentModal(false)}
              >
                Cancel
              </button>
              <button
                className="btn-success"
                onClick={handlePaymentAdd}
              >
                Add Payment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Payment Modal */}
      {showEditPaymentModal && (
        <div className="modal-overlay" onClick={() => setShowEditPaymentModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Edit Payment</h3>
              <button
                className="modal-close"
                onClick={() => setShowEditPaymentModal(false)}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Amount (AED)</label>
                <input
                  type="number"
                  value={editPaymentAmount}
                  onChange={(e) => setEditPaymentAmount(e.target.value)}
                  placeholder="0.00"
                  step="0.01"
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label>Payment Method</label>
                <select
                  value={editPaymentMethod}
                  onChange={(e) => setEditPaymentMethod(e.target.value as PaymentMethod)}
                  className="form-select"
                >
                  {Object.values(PaymentMethod).map((method) => (
                    <option key={method} value={method}>
                      {method.replace(/_/g, ' ').toUpperCase()}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Notes</label>
                <textarea
                  value={editPaymentNotes}
                  onChange={(e) => setEditPaymentNotes(e.target.value)}
                  placeholder="Add payment notes..."
                  rows={3}
                  className="form-textarea"
                />
              </div>
            </div>
            <div className="modal-footer">
              <button
                className="btn-secondary"
                onClick={() => setShowEditPaymentModal(false)}
              >
                Cancel
              </button>
              <button
                className="btn-primary"
                onClick={handleUpdatePayment}
              >
                Update Payment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderDetailNew;
