import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import type { MenuItem, OrderItem } from '../types';
import { PaymentMethod } from '../types';
import api from '../services/api';
import './OrderForm.css';

const OrderForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditMode = !!id;

  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Form state
  const [guestDetails, setGuestDetails] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
  });

  const [collectionPerson, setCollectionPerson] = useState({
    name: '',
    email: '',
    phone: '',
  });

  const [collectionDate, setCollectionDate] = useState('');
  const [collectionTime, setCollectionTime] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(
    PaymentMethod.CARD
  );
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);

  useEffect(() => {
    fetchMenuItems();
    if (isEditMode) {
      fetchOrder();
    }
  }, [id]);

  const fetchMenuItems = async () => {
    try {
      const response = await api.getMenuItems() as { menuItems: MenuItem[] };
      setMenuItems(response.menuItems || []);
    } catch (err) {
      setError('Failed to fetch menu items');
    }
  };

  const fetchOrder = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const response = await api.getOrderById(id) as { order: any };
      const order = response.order;

      setGuestDetails(order.guestDetails);
      setCollectionPerson(order.collectionPerson);
      setCollectionDate(order.collectionDate.split('T')[0]);
      setCollectionTime(order.collectionTime);
      setPaymentMethod(order.paymentMethod);
      setOrderItems(order.items);
    } catch (err) {
      setError('Failed to fetch order details');
    } finally {
      setLoading(false);
    }
  };

  const addItem = () => {
    setOrderItems([
      ...orderItems,
      {
        menuItem: '',
        name: '',
        servingSize: '',
        quantity: 1,
        price: 0,
        totalPrice: 0,
        status: 'pending' as any,
        notes: '',
      },
    ]);
  };

  const removeItem = (index: number) => {
    setOrderItems(orderItems.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: string, value: any) => {
    const newItems = [...orderItems];

    if (field === 'menuItem') {
      const selectedMenuItem = menuItems.find((item) => item._id === value);
      if (selectedMenuItem) {
        newItems[index] = {
          ...newItems[index],
          menuItem: value,
          name: selectedMenuItem.name,
          servingSize: selectedMenuItem.pricing[0]?.servingSize || '',
          price: selectedMenuItem.pricing[0]?.price || 0,
        };
      }
    } else if (field === 'servingSize') {
      const selectedMenuItem = menuItems.find(
        (item) => item._id === newItems[index].menuItem
      );
      const pricing = selectedMenuItem?.pricing.find(
        (p) => p.servingSize === value
      );
      if (pricing) {
        newItems[index] = {
          ...newItems[index],
          servingSize: value,
          price: pricing.price,
        };
      }
    } else {
      newItems[index] = { ...newItems[index], [field]: value };
    }

    // Recalculate total price
    newItems[index].totalPrice =
      newItems[index].price * newItems[index].quantity;

    setOrderItems(newItems);
  };

  const calculateTotal = () => {
    return orderItems.reduce((sum, item) => sum + item.totalPrice, 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const orderData = {
        guestDetails,
        collectionPerson: {
          name: collectionPerson.name || guestDetails.name,
          email: collectionPerson.email,
          phone: collectionPerson.phone,
        },
        items: orderItems,
        totalAmount: calculateTotal(),
        collectionDate,
        collectionTime,
        paymentMethod,
      };

      if (isEditMode) {
        await api.updateOrder(id!, orderData);
      } else {
        await api.createOrder(orderData);
      }

      navigate('/dashboard/orders');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save order');
    } finally {
      setLoading(false);
    }
  };

  const getMenuItemById = (menuItemId: string) => {
    return menuItems.find((item) => item._id === menuItemId);
  };

  return (
    <div className="order-form-page">
      <div className="page-header">
        <div>
          <h1>{isEditMode ? 'Edit Order' : 'New Order'}</h1>
          <p>
            {isEditMode
              ? 'Update order details'
              : 'Create a new festive takeaway order'}
          </p>
        </div>
        <button
          type="button"
          className="btn-secondary"
          onClick={() => navigate('/dashboard/orders')}
        >
          Cancel
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="form-section card">
          <h3>Guest Information</h3>
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="guestName">
                Guest Name <span className="required">*</span>
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
                Email Address <span className="required">*</span>
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
                Phone Number <span className="required">*</span>
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

        <div className="form-section card">
          <h3>Collection Person (if different)</h3>
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="collectionName">Name</label>
              <input
                type="text"
                id="collectionName"
                value={collectionPerson.name}
                onChange={(e) =>
                  setCollectionPerson({
                    ...collectionPerson,
                    name: e.target.value,
                  })
                }
              />
            </div>

            <div className="form-group">
              <label htmlFor="collectionEmail">Email</label>
              <input
                type="email"
                id="collectionEmail"
                value={collectionPerson.email}
                onChange={(e) =>
                  setCollectionPerson({
                    ...collectionPerson,
                    email: e.target.value,
                  })
                }
              />
            </div>

            <div className="form-group">
              <label htmlFor="collectionPhone">Phone</label>
              <input
                type="tel"
                id="collectionPhone"
                value={collectionPerson.phone}
                onChange={(e) =>
                  setCollectionPerson({
                    ...collectionPerson,
                    phone: e.target.value,
                  })
                }
              />
            </div>
          </div>
        </div>

        <div className="form-section card">
          <h3>Collection Details</h3>
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="collectionDate">
                Collection Date <span className="required">*</span>
              </label>
              <input
                type="date"
                id="collectionDate"
                value={collectionDate}
                onChange={(e) => setCollectionDate(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="collectionTime">
                Collection Time <span className="required">*</span>
              </label>
              <input
                type="time"
                id="collectionTime"
                value={collectionTime}
                onChange={(e) => setCollectionTime(e.target.value)}
                required
              />
              <small>Between 11:00 AM and 9:00 PM</small>
            </div>

            <div className="form-group">
              <label htmlFor="paymentMethod">
                Payment Method <span className="required">*</span>
              </label>
              <select
                id="paymentMethod"
                value={paymentMethod}
                onChange={(e) =>
                  setPaymentMethod(e.target.value as PaymentMethod)
                }
                required
              >
                <option value={PaymentMethod.CARD}>Card</option>
                <option value={PaymentMethod.CASH}>Cash</option>
                <option value={PaymentMethod.BANK_TRANSFER}>
                  Bank Transfer
                </option>
                <option value={PaymentMethod.OTHER}>Other</option>
              </select>
            </div>
          </div>
        </div>

        <div className="form-section card">
          <div className="section-header">
            <h3>Order Items</h3>
            <button
              type="button"
              className="btn-primary"
              onClick={addItem}
            >
              + Add Item
            </button>
          </div>

          {orderItems.length === 0 ? (
            <div className="empty-state">
              <p>No items added yet. Click "Add Item" to get started.</p>
            </div>
          ) : (
            <div className="order-items">
              {orderItems.map((item, index) => (
                <div key={index} className="order-item-card">
                  <div className="item-header">
                    <h4>Item {index + 1}</h4>
                    <button
                      type="button"
                      className="btn-danger btn-sm"
                      onClick={() => removeItem(index)}
                    >
                      Remove
                    </button>
                  </div>

                  <div className="form-grid">
                    <div className="form-group">
                      <label>
                        Menu Item <span className="required">*</span>
                      </label>
                      <select
                        value={item.menuItem}
                        onChange={(e) =>
                          updateItem(index, 'menuItem', e.target.value)
                        }
                        required
                      >
                        <option value="">Select item...</option>
                        {menuItems.map((menuItem) => (
                          <option key={menuItem._id} value={menuItem._id}>
                            {menuItem.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {item.menuItem && (
                      <div className="form-group">
                        <label>
                          Serving Size <span className="required">*</span>
                        </label>
                        <select
                          value={item.servingSize}
                          onChange={(e) =>
                            updateItem(index, 'servingSize', e.target.value)
                          }
                          required
                        >
                          <option value="">Select size...</option>
                          {getMenuItemById(item.menuItem)?.pricing.map(
                            (pricing) => (
                              <option
                                key={pricing.servingSize}
                                value={pricing.servingSize}
                              >
                                {pricing.servingSize} - AED {pricing.price}
                              </option>
                            )
                          )}
                        </select>
                      </div>
                    )}

                    <div className="form-group">
                      <label>
                        Quantity <span className="required">*</span>
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) =>
                          updateItem(
                            index,
                            'quantity',
                            parseInt(e.target.value) || 1
                          )
                        }
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label>Total Price</label>
                      <input
                        type="text"
                        value={`AED ${item.totalPrice.toFixed(2)}`}
                        disabled
                      />
                    </div>

                    <div className="form-group full-width">
                      <label>Notes</label>
                      <textarea
                        value={item.notes || ''}
                        onChange={(e) =>
                          updateItem(index, 'notes', e.target.value)
                        }
                        rows={2}
                        placeholder="Any special instructions..."
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="order-total">
            <h3>Total Amount: AED {calculateTotal().toFixed(2)}</h3>
          </div>
        </div>

        <div className="form-actions">
          <button
            type="button"
            className="btn-secondary"
            onClick={() => navigate('/dashboard/orders')}
          >
            Cancel
          </button>
          <button type="submit" className="btn-primary" disabled={loading || orderItems.length === 0}>
            {loading
              ? 'Saving...'
              : isEditMode
              ? 'Update Order'
              : 'Create Order'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default OrderForm;
