import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import type { Guest, Order, PaginationInfo } from '../types';
import { OrderStatus, PaymentStatus } from '../types';
import api from '../services/api';
import { ArrowLeft, Edit, Mail, Phone, MapPin, Calendar, ShoppingBag, DollarSign } from 'lucide-react';
import GuestFormModal from '../components/GuestFormModal';
import './GuestDetail.css';

interface GuestOrdersResponse {
  success: boolean;
  orders: Order[];
  pagination: PaginationInfo;
}

const GuestDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [guest, setGuest] = useState<Guest | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  useEffect(() => {
    if (id) {
      fetchGuestData();
    }
  }, [id]);

  const fetchGuestData = async () => {
    try {
      setLoading(true);
      const [guestResponse, ordersResponse] = await Promise.all([
        api.getGuestById(id!) as Promise<{ success: boolean; guest: Guest }>,
        api.getGuestOrders(id!) as Promise<GuestOrdersResponse>
      ]);

      setGuest(guestResponse.guest);
      setOrders(ordersResponse.orders || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch guest data');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
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
        <p>Loading guest details...</p>
      </div>
    );
  }

  if (error || !guest) {
    return (
      <div className="error-container">
        <p>{error || 'Guest not found'}</p>
        <button className="btn-primary" onClick={() => navigate('/dashboard/guests')}>
          Back to Guests
        </button>
      </div>
    );
  }

  return (
    <div className="guest-detail-page">
      <div className="page-header">
        <button className="back-button" onClick={() => navigate('/dashboard/guests')}>
          <ArrowLeft size={20} />
          <span>Back to Guests</span>
        </button>
        <button className="btn-primary" onClick={() => setIsEditModalOpen(true)}>
          <Edit size={18} />
          <span>Edit Profile</span>
        </button>
      </div>

      <div className="guest-info-section">
        <div className="card guest-info-card">
          <div className="guest-header">
            <div className="guest-avatar">
              {guest.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2>{guest.name}</h2>
              {guest.dietaryRequirements && (
                <span className="dietary-badge">{guest.dietaryRequirements}</span>
              )}
            </div>
          </div>

          <div className="guest-details">
            <div className="detail-item">
              <Mail size={18} />
              <div>
                <span className="detail-label">Email</span>
                <span className="detail-value">{guest.email}</span>
              </div>
            </div>

            <div className="detail-item">
              <Phone size={18} />
              <div>
                <span className="detail-label">Phone</span>
                <span className="detail-value">{guest.phone}</span>
              </div>
            </div>

            <div className="detail-item">
              <MapPin size={18} />
              <div>
                <span className="detail-label">Address</span>
                <span className="detail-value">{guest.address}</span>
              </div>
            </div>

            {guest.notes && (
              <div className="detail-item">
                <div>
                  <span className="detail-label">Notes</span>
                  <span className="detail-value">{guest.notes}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon total-orders">
              <ShoppingBag size={24} />
            </div>
            <div className="stat-content">
              <span className="stat-label">Total Orders</span>
              <span className="stat-value">{guest.totalOrders}</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon total-spent">
              <DollarSign size={24} />
            </div>
            <div className="stat-content">
              <span className="stat-label">Total Spent</span>
              <span className="stat-value">AED {guest.totalSpent.toFixed(2)}</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon last-order">
              <Calendar size={24} />
            </div>
            <div className="stat-content">
              <span className="stat-label">Last Order</span>
              <span className="stat-value">
                {guest.lastOrderDate ? formatDate(guest.lastOrderDate) : 'N/A'}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="card orders-section">
        <div className="section-header">
          <h3>Order History</h3>
          <span className="order-count-badge">{orders.length} orders</span>
        </div>

        {orders.length === 0 ? (
          <div className="empty-state">
            <ShoppingBag size={48} className="empty-state-icon" />
            <p>No orders yet</p>
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Order #</th>
                  <th>Collection Date</th>
                  <th>Items</th>
                  <th>Total</th>
                  <th>Payment</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order._id}>
                    <td className="order-number">{order.orderNumber}</td>
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
                    </td>
                    <td>
                      <span className={`badge ${getStatusBadgeClass(order.status)}`}>
                        {order.status}
                      </span>
                    </td>
                    <td>
                      <button
                        className="btn-link"
                        onClick={() => navigate(`/dashboard/orders/${order._id}`)}
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <GuestFormModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSuccess={fetchGuestData}
        guest={guest}
      />
    </div>
  );
};

export default GuestDetail;
