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
import './OrderDetail.css';

const OrderDetail: React.FC = () => {
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
      `Are you sure you want to delete order ${order.orderNumber}?\n\nCustomer: ${order.guestDetails.name}\nTotal: AED ${order.totalAmount.toFixed(2)}\n\nThis action cannot be undone.`
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
      const newTotalPaid = order.totalPaid + paymentAmountNum;
      const isPaidInFull = newTotalPaid >= order.totalAmount;

      // Auto-confirm order if paid in full and currently pending
      if (isPaidInFull && order.status === OrderStatus.PENDING) {
        await api.updateOrderStatus(id, OrderStatus.CONFIRMED, 'Order automatically confirmed - payment received in full');
      }

      setShowPaymentModal(false);
      setPaymentAmount('');
      setPaymentNotes('');
      await fetchOrder();
    } catch (err) {
      setError('Failed to add payment');
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
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

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
    <div className="order-detail-page">
      <div className="order-summary-card card">
        <div className="order-summary-header">
          <div>
            <p className="order-summary-label">Order</p>
            <h1>Order {order.orderNumber}</h1>
            <p className="order-summary-meta">Created on {formatDateTime(order.createdAt)}</p>
          </div>
          <div className="order-summary-badges">
            <span className={`badge badge-large ${getStatusBadgeClass(order.status)}`}>
              {order.status.replace(/_/g, ' ')}
            </span>
            <span className={`badge badge-large ${getPaymentBadgeClass(order.paymentStatus)}`}>
              {order.paymentStatus}
            </span>
          </div>
        </div>
        <div className="order-actions-grid">
          <button
            className="btn-secondary"
            onClick={() => navigate('/dashboard/orders')}
          >
            Back
          </button>
          <button
            className="btn-primary"
            onClick={() => navigate(`/dashboard/orders/${id}/edit`)}
          >
            Edit Order
          </button>
          {user?.role === UserRole.ADMIN && (
            <button
              className="btn-danger"
              onClick={handleDelete}
            >
              Delete Order
            </button>
          )}
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="detail-grid">
        <div className="detail-main">
          <div className="card mb-lg">
            <div className="card-header">
              <h3>Guest Information</h3>
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
              <div className="info-item full-width">
                <label>Address</label>
                <p>{order.guestDetails.address}</p>
              </div>
            </div>
          </div>

          {order.collectionPerson.name && (
            <div className="card mb-lg">
              <div className="card-header">
                <h3>Collection Person</h3>
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

          <div className="card mb-lg">
            <div className="card-header">
              <h3>Order Items</h3>
            </div>
            <div className="items-list">
              {order.items.map((item, index) => (
                <div key={item._id || index} className="order-item">
                  <div className="item-details">
                    <h4>{item.name}</h4>
                    <p>{item.servingSize}</p>
                    {item.notes && <p className="item-notes">{item.notes}</p>}
                  </div>
                  <div className="item-pricing">
                    <p>Qty: {item.quantity}</p>
                    <p className="price">AED {item.totalPrice.toFixed(2)}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="items-total">
              <h3>Total: AED {order.totalAmount.toFixed(2)}</h3>
            </div>
          </div>
        </div>

        <div className="detail-sidebar">
          <div className="card mb-lg">
            <div className="card-header">
              <h3>Status</h3>
            </div>
            <div className="status-section">
              <span
                className={`badge badge-large ${getStatusBadgeClass(
                  order.status
                )}`}
              >
                {order.status.replace(/_/g, ' ')}
              </span>
              <button
                className="btn-primary w-full mt-md"
                onClick={() => setShowStatusModal(true)}
              >
                Update Status
              </button>
            </div>
          </div>

          <div className="card mb-lg">
            <div className="card-header">
              <h3>Collection Details</h3>
            </div>
            <div className="info-item">
              <label>Date</label>
              <p>{formatDate(order.collectionDate)}</p>
            </div>
            <div className="info-item">
              <label>Time</label>
              <p>{order.collectionTime}</p>
            </div>
          </div>

          <div className="card mb-lg">
            <div className="card-header">
              <h3>Payment</h3>
            </div>
            <div className="payment-section">
              <div className="info-item">
                <label>Method</label>
                <p>{order.paymentMethod.replace(/_/g, ' ').toUpperCase()}</p>
              </div>
              <div className="info-item">
                <label>Status</label>
                <span
                  className={`badge ${getPaymentBadgeClass(
                    order.paymentStatus
                  )}`}
                >
                  {order.paymentStatus}
                </span>
              </div>
              <div className="payment-amounts">
                <div className="amount-row">
                  <span>Total Amount:</span>
                  <strong>AED {order.totalAmount.toFixed(2)}</strong>
                </div>
                <div className="amount-row">
                  <span>Total Paid:</span>
                  <strong className="paid">
                    AED {order.totalPaid.toFixed(2)}
                  </strong>
                </div>
                <div className="amount-row balance">
                  <span>Balance:</span>
                  <strong>
                    AED {(order.totalAmount - order.totalPaid).toFixed(2)}
                  </strong>
                </div>
              </div>
              <button
                className="btn-success w-full mt-md"
                onClick={() => setShowPaymentModal(true)}
              >
                Add Payment
              </button>
            </div>
          </div>

          {order.paymentRecords && order.paymentRecords.length > 0 && (
            <div className="card">
              <div className="card-header">
                <h3>Payment History</h3>
              </div>
              <div className="payment-history">
                {order.paymentRecords.map((payment, index) => (
                  <div key={payment._id || index} className="payment-record">
                    <div className="payment-info">
                      <p className="payment-date">
                        {formatDateTime(payment.receivedAt)}
                      </p>
                      <p className="payment-method">
                        {payment.method.replace(/_/g, ' ')}
                      </p>
                      {payment.notes && (
                        <p className="payment-notes">{payment.notes}</p>
                      )}
                    </div>
                    <p className="payment-amount">
                      AED {payment.amount.toFixed(2)}
                    </p>
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
                >
                  {Object.values(OrderStatus).map((status) => (
                    <option key={status} value={status}>
                      {status.replace(/_/g, ' ').toUpperCase()}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Notes</label>
                <textarea
                  value={statusNotes}
                  onChange={(e) => setStatusNotes(e.target.value)}
                  rows={3}
                  placeholder="Optional notes about this status change..."
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
              <button className="btn-primary" onClick={handleStatusUpdate}>
                Update Status
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Payment Modal */}
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
                  step="0.01"
                  min="0"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  placeholder="0.00"
                />
              </div>
              <div className="form-group">
                <label>Payment Method</label>
                <select
                  value={paymentMethod}
                  onChange={(e) =>
                    setPaymentMethod(e.target.value as PaymentMethod)
                  }
                >
                  <option value={PaymentMethod.CARD}>Card</option>
                  <option value={PaymentMethod.CASH}>Cash</option>
                  <option value={PaymentMethod.SERVME}>Servme</option>
                  <option value={PaymentMethod.SECUREPAY}>Securepay</option>
                  <option value={PaymentMethod.BANK_TRANSFER}>
                    Bank Transfer
                  </option>
                  <option value={PaymentMethod.OTHER}>Other</option>
                </select>
              </div>
              <div className="form-group">
                <label>Notes</label>
                <textarea
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  rows={3}
                  placeholder="Optional payment notes..."
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
              <button className="btn-success" onClick={handlePaymentAdd}>
                Add Payment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderDetail;
