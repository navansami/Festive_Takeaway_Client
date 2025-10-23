import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import type { MenuItem, OrderItem } from '../types';
import { PaymentMethod } from '../types';
import api from '../services/api';
import GuestSearch from '../components/GuestSearch';
import { Plus, X, ShoppingCart } from 'lucide-react';
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

      // Set guest details
      setGuestDetails(order.guestDetails);
      if (order.guest) {
        setGuestId(typeof order.guest === 'string' ? order.guest : order.guest._id);
      }

      setCollectionPerson(order.collectionPerson);
      setCollectionDate(order.collectionDate.split('T')[0]);
      setCollectionTime(order.collectionTime);
      setPaymentMethod(order.paymentMethod);

      // Fix: Extract menuItem ID from populated menuItem object
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
              ? 'Update order details and items'
              : 'Create a new festive takeaway order'}
          </p>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="form-section card">
          <h3>Guest Information</h3>
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

        <div className="form-section card">
          <h3>Collection Person (if different from guest)</h3>
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
                placeholder="Leave blank if same as guest"
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
                placeholder="Optional"
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
                placeholder="Optional"
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
            <h3>
              <ShoppingCart size={20} />
              Order Items
            </h3>
            <button
              type="button"
              className="btn-primary btn-sm"
              onClick={addItem}
            >
              <Plus size={16} />
              Add Item
            </button>
          </div>

          {orderItems.length === 0 ? (
            <div className="empty-state">
              <ShoppingCart size={48} className="empty-icon" />
              <p>No items added yet</p>
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
            <div className="order-items">
              {orderItems.map((item, index) => {
                const menuItem = getMenuItemById(item.menuItem);
                return (
                  <div key={index} className="item-card">
                    <div className="item-card-header">
                      <span className="item-number">#{index + 1}</span>
                      <button
                        type="button"
                        className="btn-icon-danger"
                        onClick={() => removeItem(index)}
                        title="Remove item"
                      >
                        <X size={18} />
                      </button>
                    </div>

                    <div className="item-card-body">
                      <div className="form-row">
                        <div className="form-group flex-2">
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
                          <div className="form-group flex-2">
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

                        <div className="form-group flex-1">
                          <label>
                            Qty <span className="required">*</span>
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

                        <div className="form-group flex-1">
                          <label>Total</label>
                          <div className="price-display">
                            AED {item.totalPrice.toFixed(2)}
                          </div>
                        </div>
                      </div>

                      <div className="form-group">
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
                  </div>
                );
              })}
            </div>
          )}

          {orderItems.length > 0 && (
            <div className="order-summary">
              <div className="summary-row">
                <span>Subtotal ({orderItems.length} items)</span>
                <span className="summary-amount">AED {calculateTotal().toFixed(2)}</span>
              </div>
              <div className="summary-row total">
                <span>Total Amount</span>
                <span className="summary-amount">AED {calculateTotal().toFixed(2)}</span>
              </div>
            </div>
          )}
        </div>

        <div className="form-actions">
          <button
            type="button"
            className="btn-secondary"
            onClick={() => navigate('/dashboard/orders')}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn-primary"
            disabled={loading || orderItems.length === 0 || !guestDetails.name}
          >
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
