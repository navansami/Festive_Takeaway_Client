import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import GuestSearch from './GuestSearch';
import DateTimePicker from './DateTimePicker';
import MenuItemsGrid from './MenuItemsGrid';
import { X } from 'lucide-react';
import type { MenuItem, OrderItem, GuestDetails } from '../types';
import { PaymentMethod, OrderStatus, PaymentStatus } from '../types';
import api from '../services/api';
import './OrderModal.css';

interface OrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const OrderModal: React.FC<OrderModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showAddGuestForm, setShowAddGuestForm] = useState(false);

  // Form state
  const [guestDetails, setGuestDetails] = useState<GuestDetails>({
    name: '',
    email: '',
    phone: '',
    address: '',
  });

  const [collectionDate, setCollectionDate] = useState('');
  const [collectionTime, setCollectionTime] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(PaymentMethod.CARD);
  const [orderStatus, setOrderStatus] = useState<OrderStatus>(OrderStatus.PENDING);
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>(PaymentStatus.PENDING);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [discount, setDiscount] = useState(0);

  useEffect(() => {
    if (isOpen) {
      fetchMenuItems();
      // Set default date to today
      const today = new Date().toISOString().split('T')[0];
      setCollectionDate(today);
    }
  }, [isOpen]);

  const fetchMenuItems = async () => {
    try {
      const response = (await api.getMenuItems()) as { menuItems: MenuItem[] };
      setMenuItems(response.menuItems || []);
    } catch (err) {
      setError('Failed to fetch menu items');
    }
  };

  const handleSelectGuest = (guest: GuestDetails) => {
    setGuestDetails(guest);
    setShowAddGuestForm(false);
  };

  const handleAddNewGuest = () => {
    setShowAddGuestForm(true);
  };

  const subtotal = orderItems.reduce((sum, item) => sum + item.totalPrice, 0);

  const calculateDiscountAmount = () => {
    return (subtotal * discount) / 100;
  };

  const calculateTotal = () => {
    return Math.max(0, subtotal - calculateDiscountAmount());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!guestDetails.name || !guestDetails.email || !guestDetails.phone || !guestDetails.address) {
      setError('Please fill in all guest details');
      return;
    }

    if (!collectionDate || !collectionTime) {
      setError('Please select collection date and time');
      return;
    }

    if (orderItems.length === 0) {
      setError('Please select at least one menu item');
      return;
    }

    setLoading(true);

    try {
      const orderData = {
        guestDetails,
        collectionPerson: {
          name: guestDetails.name,
          email: guestDetails.email,
          phone: guestDetails.phone,
        },
        items: orderItems,
        discountPercentage: discount,
        totalAmount: calculateTotal(),
        collectionDate,
        collectionTime,
        paymentMethod,
        status: orderStatus,
        paymentStatus: paymentStatus,
      };

      await api.createOrder(orderData);

      // Reset form
      setGuestDetails({
        name: '',
        email: '',
        phone: '',
        address: '',
      });
      setCollectionDate('');
      setCollectionTime('');
      setPaymentMethod(PaymentMethod.CARD);
      setOrderStatus(OrderStatus.PENDING);
      setPaymentStatus(PaymentStatus.PENDING);
      setOrderItems([]);
      setDiscount(0);
      setShowAddGuestForm(false);

      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create order');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="New Order" size="fullscreen">
      <form onSubmit={handleSubmit} className="order-modal-form">
        <div className="order-modal-content">
          {/* Left Column - Guest & Collection Details */}
          <div className="order-modal-left">
            {/* Guest Section */}
            <div className="form-section">
              <h3 className="section-title">Guest Information</h3>
              {!showAddGuestForm ? (
                <GuestSearch
                  selectedGuest={guestDetails.name ? guestDetails : null}
                  onSelectGuest={handleSelectGuest}
                  onAddNew={handleAddNewGuest}
                />
              ) : (
                <div className="add-guest-form">
                  <div className="form-header">
                    <h4>Add New Guest</h4>
                    <button
                      type="button"
                      className="btn-icon"
                      onClick={() => setShowAddGuestForm(false)}
                      title="Cancel"
                    >
                      <X size={20} />
                    </button>
                  </div>
                  <div className="form-grid">
                    <div className="form-group">
                      <label htmlFor="guestName">
                        Name <span className="required">*</span>
                      </label>
                      <input
                        type="text"
                        id="guestName"
                        value={guestDetails.name}
                        onChange={(e) =>
                          setGuestDetails({ ...guestDetails, name: e.target.value })
                        }
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="guestEmail">
                        Email <span className="required">*</span>
                      </label>
                      <input
                        type="email"
                        id="guestEmail"
                        value={guestDetails.email}
                        onChange={(e) =>
                          setGuestDetails({ ...guestDetails, email: e.target.value })
                        }
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="guestPhone">
                        Phone <span className="required">*</span>
                      </label>
                      <input
                        type="tel"
                        id="guestPhone"
                        value={guestDetails.phone}
                        onChange={(e) =>
                          setGuestDetails({ ...guestDetails, phone: e.target.value })
                        }
                        required
                      />
                    </div>

                    <div className="form-group full-width">
                      <label htmlFor="guestAddress">
                        Address <span className="required">*</span>
                      </label>
                      <textarea
                        id="guestAddress"
                        value={guestDetails.address}
                        onChange={(e) =>
                          setGuestDetails({ ...guestDetails, address: e.target.value })
                        }
                        rows={3}
                        required
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Collection Details */}
            <div className="form-section">
              <h3 className="section-title">Collection Details</h3>
              <DateTimePicker
                selectedDate={collectionDate}
                selectedTime={collectionTime}
                onDateChange={setCollectionDate}
                onTimeChange={setCollectionTime}
                allowPastDates={true}
              />
            </div>

            {/* Order Status */}
            <div className="form-section">
              <h3 className="section-title">Order Status</h3>
              <div className="form-group">
                <label htmlFor="orderStatus">Status</label>
                <select
                  id="orderStatus"
                  value={orderStatus}
                  onChange={(e) => setOrderStatus(e.target.value as OrderStatus)}
                  className="form-select"
                >
                  <option value={OrderStatus.PENDING}>Pending</option>
                  <option value={OrderStatus.CONFIRMED}>Confirmed</option>
                  <option value={OrderStatus.AWAITING_COLLECTION}>Awaiting Collection</option>
                  <option value={OrderStatus.COLLECTED}>Collected</option>
                  <option value={OrderStatus.ON_HOLD}>On Hold</option>
                  <option value={OrderStatus.DELAYED}>Delayed</option>
                  <option value={OrderStatus.CANCELLED}>Cancelled</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="paymentStatus">Payment Status</label>
                <select
                  id="paymentStatus"
                  value={paymentStatus}
                  onChange={(e) => setPaymentStatus(e.target.value as PaymentStatus)}
                  className="form-select"
                >
                  <option value={PaymentStatus.PENDING}>Pending</option>
                  <option value={PaymentStatus.PARTIAL}>Partial</option>
                  <option value={PaymentStatus.PAID}>Paid</option>
                  <option value={PaymentStatus.REFUNDED}>Refunded</option>
                </select>
              </div>
            </div>

            {/* Payment Method */}
            <div className="form-section">
              <h3 className="section-title">Payment Method</h3>
              <div className="payment-methods">
                <label className="payment-option">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value={PaymentMethod.CARD}
                    checked={paymentMethod === PaymentMethod.CARD}
                    onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                  />
                  <span>Card</span>
                </label>
                <label className="payment-option">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value={PaymentMethod.CASH}
                    checked={paymentMethod === PaymentMethod.CASH}
                    onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                  />
                  <span>Cash</span>
                </label>
                <label className="payment-option">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value={PaymentMethod.SERVME}
                    checked={paymentMethod === PaymentMethod.SERVME}
                    onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                  />
                  <span>Servme</span>
                </label>
                <label className="payment-option">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value={PaymentMethod.SECUREPAY}
                    checked={paymentMethod === PaymentMethod.SECUREPAY}
                    onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                  />
                  <span>Securepay</span>
                </label>
                <label className="payment-option">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value={PaymentMethod.BANK_TRANSFER}
                    checked={paymentMethod === PaymentMethod.BANK_TRANSFER}
                    onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                  />
                  <span>Bank Transfer</span>
                </label>
                <label className="payment-option">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value={PaymentMethod.OTHER}
                    checked={paymentMethod === PaymentMethod.OTHER}
                    onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                  />
                  <span>Other</span>
                </label>
              </div>
            </div>

            {/* Discount & Summary */}
            <div className="form-section">
              <h3 className="section-title">Order Summary</h3>
              <div className="order-summary">
                <div className="summary-row">
                  <span>Subtotal</span>
                  <span className="summary-amount">AED {subtotal.toFixed(2)}</span>
                </div>
                <div className="form-group">
                  <label htmlFor="discount">Discount Percentage (%)</label>
                  <div className="discount-input">
                    <input
                      type="number"
                      id="discount"
                      min="0"
                      max="100"
                      step="0.1"
                      value={discount}
                      onChange={(e) => setDiscount(Math.min(Math.max(parseFloat(e.target.value) || 0, 0), 100))}
                      placeholder="0.0"
                    />
                    <span className="currency">%</span>
                  </div>
                  {discount > 0 && (
                    <div className="discount-amount">
                      Saving: AED {calculateDiscountAmount().toFixed(2)}
                    </div>
                  )}
                </div>
                <div className="summary-row total">
                  <span>Total</span>
                  <span className="summary-amount">AED {calculateTotal().toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Menu Items */}
          <div className="order-modal-right">
            <div className="form-section">
              <h3 className="section-title">Select Menu Items</h3>
              <MenuItemsGrid
                menuItems={menuItems.filter((item) => item.isAvailable)}
                selectedItems={orderItems}
                onItemsChange={setOrderItems}
              />
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && <div className="error-message">{error}</div>}

        {/* Action Buttons */}
        <div className="modal-actions">
          <button
            type="button"
            className="btn-secondary"
            onClick={handleClose}
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn-primary"
            disabled={loading || orderItems.length === 0}
          >
            {loading ? 'Recording Order...' : 'Record Order'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default OrderModal;
