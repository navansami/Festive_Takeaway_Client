import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import type { MenuItem, OrderItem } from '../types';
import { PaymentMethod } from '../types';
import api from '../services/api';
import GuestSearch from '../components/GuestSearch';
import { X, ShoppingCart, Plus, Trash2, Calendar, Clock, CreditCard, User, MapPin, Percent, Tag } from 'lucide-react';
import './OrderForm.css';

const OrderForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditMode = !!id;

  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Form state
  const [guestId, setGuestId] = useState<string | undefined>();
  const [guestDetails, setGuestDetails] = useState<{
    name: string;
    email: string;
    phone: string;
    address: string;
    _id?: string;
  }>({
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
  const [discountPercentage, setDiscountPercentage] = useState<number>(0);
  const [discountName, setDiscountName] = useState<string>('');

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
      if (order.guest) {
        setGuestId(typeof order.guest === 'string' ? order.guest : order.guest._id);
      }

      setCollectionPerson(order.collectionPerson);
      setCollectionDate(order.collectionDate.split('T')[0]);
      setCollectionTime(order.collectionTime);
      setPaymentMethod(order.paymentMethod);
      setDiscountPercentage(order.discountPercentage || 0);
      setDiscountName(order.discountName || '');

      const items = order.items.map((item: any) => ({
        ...item,
        menuItem: typeof item.menuItem === 'string' ? item.menuItem : item.menuItem._id,
        _id: item._id
      }));

      setOrderItems(items);
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

    newItems[index].totalPrice =
      newItems[index].price * newItems[index].quantity;

    setOrderItems(newItems);
  };

  const calculateSubtotal = () => {
    return orderItems.reduce((sum, item) => sum + item.totalPrice, 0);
  };

  const calculateDiscountAmount = () => {
    const subtotal = calculateSubtotal();
    return Math.round((subtotal * discountPercentage / 100) * 100) / 100;
  };

  const calculateTotal = () => {
    const subtotal = calculateSubtotal();
    const discount = calculateDiscountAmount();
    return subtotal - discount;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const orderData = {
        guestId: guestId || guestDetails._id,
        guestDetails: {
          name: guestDetails.name,
          email: guestDetails.email,
          phone: guestDetails.phone,
          address: guestDetails.address
        },
        collectionPerson: {
          name: collectionPerson.name || guestDetails.name,
          email: collectionPerson.email,
          phone: collectionPerson.phone,
        },
        items: orderItems.map(item => ({
          menuItem: item.menuItem,
          name: item.name,
          servingSize: item.servingSize,
          quantity: item.quantity,
          price: item.price,
          totalPrice: item.totalPrice,
          status: item.status,
          notes: item.notes
        })),
        discountPercentage: discountPercentage || 0,
        discountName: discountPercentage > 0 ? discountName : undefined,
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

  const handleClose = () => {
    navigate('/dashboard/orders');
  };

  return (
    <div className="order-form-modal-overlay">
      <div className="order-form-modal">
        {/* Header */}
        <div className="order-form-header">
          <div className="header-content">
            <div className="header-title-group">
              <h1>{isEditMode ? 'Edit Order' : 'Create New Order'}</h1>
              <p>
                {isEditMode
                  ? 'Update order details and items'
                  : 'Complete the form below to create a new takeaway order'}
              </p>
            </div>
            <button className="close-button" onClick={handleClose} type="button">
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="order-form-content">
          {error && (
            <div className="error-banner">
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} id="order-form">
            {/* Guest Information */}
            <section className="form-section">
              <div className="section-title">
                <div className="section-icon">
                  <User size={20} />
                </div>
                <div>
                  <h2>Guest Information</h2>
                  <p>Search for existing guest or add new details</p>
                </div>
              </div>
              <div className="section-content">
                <GuestSearch
                  selectedGuest={guestDetails.name ? guestDetails : null}
                  onSelectGuest={(guest) => {
                    setGuestDetails(guest);
                    setGuestId(guest._id);
                  }}
                  onAddNew={() => {
                    setGuestDetails({
                      name: '',
                      email: '',
                      phone: '',
                      address: ''
                    });
                    setGuestId(undefined);
                  }}
                />
              </div>
            </section>

            {/* Collection Person */}
            <section className="form-section">
              <div className="section-title">
                <div className="section-icon">
                  <MapPin size={20} />
                </div>
                <div>
                  <h2>Collection Person</h2>
                  <p>If different from guest (optional)</p>
                </div>
              </div>
              <div className="section-content">
                <div className="input-grid-3">
                  <div className="input-group">
                    <label>Name</label>
                    <input
                      type="text"
                      value={collectionPerson.name}
                      onChange={(e) =>
                        setCollectionPerson({
                          ...collectionPerson,
                          name: e.target.value,
                        })
                      }
                      placeholder="Leave blank if same as guest"
                    />
                  </div>
                  <div className="input-group">
                    <label>Email</label>
                    <input
                      type="email"
                      value={collectionPerson.email}
                      onChange={(e) =>
                        setCollectionPerson({
                          ...collectionPerson,
                          email: e.target.value,
                        })
                      }
                      placeholder="Optional"
                    />
                  </div>
                  <div className="input-group">
                    <label>Phone</label>
                    <input
                      type="tel"
                      value={collectionPerson.phone}
                      onChange={(e) =>
                        setCollectionPerson({
                          ...collectionPerson,
                          phone: e.target.value,
                        })
                      }
                      placeholder="Optional"
                    />
                  </div>
                </div>
              </div>
            </section>

            {/* Collection & Payment */}
            <section className="form-section">
              <div className="section-title">
                <div className="section-icon">
                  <Calendar size={20} />
                </div>
                <div>
                  <h2>Collection & Payment</h2>
                  <p>When and how will this order be collected</p>
                </div>
              </div>
              <div className="section-content">
                <div className="input-grid-3">
                  <div className="input-group">
                    <label>
                      Collection Date <span className="required">*</span>
                    </label>
                    <div className="input-with-icon">
                      <Calendar size={18} />
                      <input
                        type="date"
                        value={collectionDate}
                        onChange={(e) => setCollectionDate(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  <div className="input-group">
                    <label>
                      Collection Time <span className="required">*</span>
                    </label>
                    <div className="input-with-icon">
                      <Clock size={18} />
                      <input
                        type="time"
                        value={collectionTime}
                        onChange={(e) => setCollectionTime(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  <div className="input-group">
                    <label>
                      Payment Method <span className="required">*</span>
                    </label>
                    <div className="input-with-icon">
                      <CreditCard size={18} />
                      <select
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
              </div>
            </section>

            {/* Order Items */}
            <section className="form-section">
              <div className="section-title">
                <div className="section-icon">
                  <ShoppingCart size={20} />
                </div>
                <div>
                  <h2>Order Items</h2>
                  <p>Add items to this order</p>
                </div>
                <button
                  type="button"
                  className="add-item-btn"
                  onClick={addItem}
                >
                  <Plus size={18} />
                  Add Item
                </button>
              </div>

              <div className="section-content">
                {orderItems.length === 0 ? (
                  <div className="empty-items">
                    <ShoppingCart size={64} strokeWidth={1} />
                    <h3>No items added yet</h3>
                    <p>Click "Add Item" to start building the order</p>
                    <button
                      type="button"
                      className="btn-primary"
                      onClick={addItem}
                    >
                      <Plus size={18} />
                      Add First Item
                    </button>
                  </div>
                ) : (
                  <div className="items-list">
                    {orderItems.map((item, index) => {
                      const menuItem = getMenuItemById(item.menuItem);
                      return (
                        <div key={index} className="item-row">
                          <div className="item-number">
                            <span>{index + 1}</span>
                          </div>

                          <div className="item-fields">
                            <div className="item-row-top">
                              <div className="input-group flex-2">
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
                                  <option value="">Select an item...</option>
                                  {menuItems.map((mi) => (
                                    <option key={mi._id} value={mi._id}>
                                      {mi.name}
                                    </option>
                                  ))}
                                </select>
                              </div>

                              {item.menuItem && menuItem && (
                                <div className="input-group flex-2">
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
                                    {menuItem.pricing.map((pricing) => (
                                      <option
                                        key={pricing.servingSize}
                                        value={pricing.servingSize}
                                      >
                                        {pricing.servingSize} - AED {pricing.price.toFixed(2)}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                              )}

                              <div className="input-group flex-1">
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

                              <div className="item-total">
                                <label>Total</label>
                                <div className="total-price">
                                  AED {item.totalPrice.toFixed(2)}
                                </div>
                              </div>
                            </div>

                            <div className="input-group">
                              <label>Special Instructions</label>
                              <input
                                type="text"
                                value={item.notes || ''}
                                onChange={(e) =>
                                  updateItem(index, 'notes', e.target.value)
                                }
                                placeholder="e.g., No salt, extra gravy..."
                              />
                            </div>
                          </div>

                          <button
                            type="button"
                            className="remove-item-btn"
                            onClick={() => removeItem(index)}
                            title="Remove item"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Order Summary */}
                {orderItems.length > 0 && (
                  <div className="order-summary-box">
                    <div className="summary-header">
                      <h3>Order Summary</h3>
                      <span className="item-count">{orderItems.length} {orderItems.length === 1 ? 'item' : 'items'}</span>
                    </div>

                    <div className="summary-rows">
                      <div className="summary-row">
                        <span>Subtotal</span>
                        <span className="amount">AED {calculateSubtotal().toFixed(2)}</span>
                      </div>

                      {/* Discount Section */}
                      <div className="discount-inputs">
                        <div className="input-group flex-1">
                          <label>
                            <Percent size={14} />
                            Discount Percentage
                          </label>
                          <input
                            type="number"
                            min="0"
                            max="100"
                            step="0.01"
                            value={discountPercentage}
                            onChange={(e) => setDiscountPercentage(parseFloat(e.target.value) || 0)}
                            placeholder="0"
                          />
                        </div>
                        <div className="input-group flex-2">
                          <label>
                            <Tag size={14} />
                            Discount Reason
                          </label>
                          <input
                            type="text"
                            value={discountName}
                            onChange={(e) => setDiscountName(e.target.value)}
                            placeholder="e.g., VIP Customer, Holiday Promotion"
                            disabled={discountPercentage === 0}
                          />
                        </div>
                      </div>

                      {discountPercentage > 0 && (
                        <div className="summary-row discount">
                          <span>Discount ({discountPercentage}%{discountName ? ` - ${discountName}` : ''})</span>
                          <span className="amount">-AED {calculateDiscountAmount().toFixed(2)}</span>
                        </div>
                      )}

                      <div className="summary-row total">
                        <span>Total Amount</span>
                        <span className="amount">AED {calculateTotal().toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </section>
          </form>
        </div>

        {/* Footer */}
        <div className="order-form-footer">
          <button
            type="button"
            className="btn-secondary"
            onClick={handleClose}
          >
            Cancel
          </button>
          <button
            type="submit"
            form="order-form"
            className="btn-submit"
            disabled={loading || orderItems.length === 0 || !guestDetails.name}
          >
            {loading
              ? 'Saving...'
              : isEditMode
              ? 'Update Order'
              : 'Create Order'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrderForm;
