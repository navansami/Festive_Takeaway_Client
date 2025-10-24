import React, { useState, useEffect } from 'react';
import type { MenuItem } from '../types';
import { MenuCategory, UserRole } from '../types';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import './MenuItems.css';

const MenuItems: React.FC = () => {
  const { user } = useAuth();
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);

  const [formData, setFormData] = useState<{
    name: string;
    description: string;
    category: MenuCategory;
    allergens: string;
    isAvailable: boolean;
  }>({
    name: '',
    description: '',
    category: MenuCategory.ROASTS as MenuCategory,
    allergens: '',
    isAvailable: true,
  });

  const [pricingItems, setPricingItems] = useState<
    { servingSize: string; price: number }[]
  >([{ servingSize: '', price: 0 }]);

  const [bundleConfigs, setBundleConfigs] = useState<
    {
      servingSize: string;
      maxPortions: number;
      maxSauces: number;
      allowMixing: boolean;
      portionValues: { servingSize: string; portionValue: number }[];
    }[]
  >([]);

  useEffect(() => {
    fetchMenuItems();
  }, []);

  const fetchMenuItems = async () => {
    try {
      setLoading(true);
      const response = await api.getMenuItems() as { menuItems: MenuItem[] };
      setMenuItems(response.menuItems || []);
    } catch (err) {
      setError('Failed to fetch menu items');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (item?: MenuItem) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        name: item.name,
        description: item.description || '',
        category: item.category,
        allergens: item.allergens?.join(', ') || '',
        isAvailable: item.isAvailable,
      });
      setPricingItems(item.pricing);
      setBundleConfigs(item.bundleConfig || []);
    } else {
      setEditingItem(null);
      setFormData({
        name: '',
        description: '',
        category: MenuCategory.ROASTS,
        allergens: '',
        isAvailable: true,
      });
      setPricingItems([{ servingSize: '', price: 0 }]);
      setBundleConfigs([]);
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingItem(null);
  };

  const addPricingRow = () => {
    setPricingItems([...pricingItems, { servingSize: '', price: 0 }]);
  };

  const removePricingRow = (index: number) => {
    setPricingItems(pricingItems.filter((_, i) => i !== index));
  };

  const updatePricingRow = (
    index: number,
    field: string,
    value: string | number
  ) => {
    const newPricing = [...pricingItems];
    newPricing[index] = { ...newPricing[index], [field]: value };
    setPricingItems(newPricing);
  };

  const addBundleConfig = (servingSize: string) => {
    setBundleConfigs([
      ...bundleConfigs,
      {
        servingSize,
        maxPortions: 0,
        maxSauces: 0,
        allowMixing: false,
        portionValues: [],
      },
    ]);
  };

  const removeBundleConfig = (servingSize: string) => {
    setBundleConfigs(bundleConfigs.filter((bc) => bc.servingSize !== servingSize));
  };

  const updateBundleConfig = (
    servingSize: string,
    field: string,
    value: number | boolean
  ) => {
    setBundleConfigs(
      bundleConfigs.map((bc) =>
        bc.servingSize === servingSize ? { ...bc, [field]: value } : bc
      )
    );
  };

  const addPortionValue = (bundleServingSize: string) => {
    setBundleConfigs(
      bundleConfigs.map((bc) =>
        bc.servingSize === bundleServingSize
          ? {
              ...bc,
              portionValues: [...bc.portionValues, { servingSize: '', portionValue: 0 }],
            }
          : bc
      )
    );
  };

  const removePortionValue = (bundleServingSize: string, index: number) => {
    setBundleConfigs(
      bundleConfigs.map((bc) =>
        bc.servingSize === bundleServingSize
          ? {
              ...bc,
              portionValues: bc.portionValues.filter((_, i) => i !== index),
            }
          : bc
      )
    );
  };

  const updatePortionValue = (
    bundleServingSize: string,
    index: number,
    field: string,
    value: string | number
  ) => {
    setBundleConfigs(
      bundleConfigs.map((bc) =>
        bc.servingSize === bundleServingSize
          ? {
              ...bc,
              portionValues: bc.portionValues.map((pv, i) =>
                i === index ? { ...pv, [field]: value } : pv
              ),
            }
          : bc
      )
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const allergens = formData.allergens
        ? formData.allergens.split(',').map((a) => a.trim())
        : [];

      const data = {
        ...formData,
        allergens,
        pricing: pricingItems,
        bundleConfig: bundleConfigs.length > 0 ? bundleConfigs : undefined,
      };

      if (editingItem) {
        await api.updateMenuItem(editingItem._id, data);
      } else {
        await api.createMenuItem(data);
      }

      handleCloseModal();
      await fetchMenuItems();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save menu item');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this menu item?')) {
      return;
    }

    try {
      await api.deleteMenuItem(id);
      await fetchMenuItems();
    } catch (err) {
      setError('Failed to delete menu item');
    }
  };

  const getCategoryLabel = (category: MenuCategory) => {
    return category.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
  };

  const groupedMenuItems = menuItems.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {} as Record<MenuCategory, MenuItem[]>);

  if (user?.role !== UserRole.ADMIN) {
    return (
      <div className="error-container">
        <p>You do not have permission to access this page.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="loading-container">
        <p>Loading menu items...</p>
      </div>
    );
  }

  return (
    <div className="menu-items-page">
      <div className="page-header">
        <div>
          <h1>Menu Items</h1>
          <p>Manage menu items and pricing</p>
        </div>
        <button className="btn-primary" onClick={() => handleOpenModal()}>
          + Add Menu Item
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="menu-categories">
        {Object.entries(groupedMenuItems).map(([category, items]) => (
          <div key={category} className="card mb-lg">
            <div className="category-header">
              <h2>{getCategoryLabel(category as MenuCategory)}</h2>
            </div>
            <div className="menu-items-list">
              {items.map((item) => (
                <div key={item._id} className="menu-item-card">
                  <div className="menu-item-header">
                    <div>
                      <h3>{item.name}</h3>
                      {item.description && <p>{item.description}</p>}
                    </div>
                    <div className="item-actions">
                      <button
                        className="btn-secondary btn-sm"
                        onClick={() => handleOpenModal(item)}
                      >
                        Edit
                      </button>
                      <button
                        className="btn-danger btn-sm"
                        onClick={() => handleDelete(item._id)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                  <div className="menu-item-details">
                    <div className="pricing-list">
                      {item.pricing.map((pricing, idx) => (
                        <div key={idx} className="pricing-item">
                          <span>{pricing.servingSize}</span>
                          <strong>AED {pricing.price.toFixed(2)}</strong>
                        </div>
                      ))}
                    </div>
                    {item.allergens && item.allergens.length > 0 && (
                      <div className="allergens">
                        <small>Allergens: {item.allergens.join(', ')}</small>
                      </div>
                    )}
                    <div className="availability">
                      <span
                        className={`badge ${
                          item.isAvailable ? 'badge-success' : 'badge-danger'
                        }`}
                      >
                        {item.isAvailable ? 'Available' : 'Unavailable'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal modal-large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingItem ? 'Edit Menu Item' : 'Add Menu Item'}</h3>
              <button className="modal-close" onClick={handleCloseModal}>
                ×
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label>
                    Name <span className="required">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    rows={3}
                  />
                </div>

                <div className="form-group">
                  <label>
                    Category <span className="required">*</span>
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        category: e.target.value as MenuCategory,
                      })
                    }
                    required
                  >
                    {Object.values(MenuCategory).map((cat) => (
                      <option key={cat} value={cat}>
                        {getCategoryLabel(cat)}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Allergens (comma-separated)</label>
                  <input
                    type="text"
                    value={formData.allergens}
                    onChange={(e) =>
                      setFormData({ ...formData, allergens: e.target.value })
                    }
                    placeholder="e.g. Dairy, Gluten, Nuts"
                  />
                </div>

                <div className="form-group">
                  <label>
                    <input
                      type="checkbox"
                      checked={formData.isAvailable}
                      onChange={(e) =>
                        setFormData({ ...formData, isAvailable: e.target.checked })
                      }
                      style={{ width: 'auto', marginRight: '8px' }}
                    />
                    Available
                  </label>
                </div>

                <div className="pricing-section">
                  <div className="section-header">
                    <h4>Pricing</h4>
                    <button
                      type="button"
                      className="btn-primary btn-sm"
                      onClick={addPricingRow}
                    >
                      + Add Price
                    </button>
                  </div>

                  {pricingItems.map((pricing, index) => (
                    <div key={index} className="pricing-row">
                      <input
                        type="text"
                        placeholder="Serving size"
                        value={pricing.servingSize}
                        onChange={(e) =>
                          updatePricingRow(index, 'servingSize', e.target.value)
                        }
                        required
                      />
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="Price"
                        value={pricing.price}
                        onChange={(e) =>
                          updatePricingRow(
                            index,
                            'price',
                            parseFloat(e.target.value) || 0
                          )
                        }
                        required
                      />
                      {pricingItems.length > 1 && (
                        <button
                          type="button"
                          className="btn-danger btn-sm"
                          onClick={() => removePricingRow(index)}
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                {/* Bundle Configuration Section */}
                {formData.category === MenuCategory.ROASTS && (
                  <div className="bundle-config-section">
                    <div className="section-header">
                      <h4>Bundle Configuration (Optional)</h4>
                      <p className="section-description">
                        Configure bundle options for items that include sides and sauces
                      </p>
                    </div>

                    {pricingItems.map((pricing, index) => {
                      const hasBundle = bundleConfigs.some(
                        (bc) => bc.servingSize === pricing.servingSize
                      );
                      const bundleConfig = bundleConfigs.find(
                        (bc) => bc.servingSize === pricing.servingSize
                      );

                      return (
                        <div key={index} className="bundle-config-item">
                          <div className="bundle-config-header">
                            <h5>{pricing.servingSize || 'Pricing Option ' + (index + 1)}</h5>
                            {!hasBundle ? (
                              <button
                                type="button"
                                className="btn-primary btn-sm"
                                onClick={() => addBundleConfig(pricing.servingSize)}
                                disabled={!pricing.servingSize}
                              >
                                + Add Bundle Config
                              </button>
                            ) : (
                              <button
                                type="button"
                                className="btn-danger btn-sm"
                                onClick={() => removeBundleConfig(pricing.servingSize)}
                              >
                                Remove Bundle
                              </button>
                            )}
                          </div>

                          {hasBundle && bundleConfig && (
                            <div className="bundle-config-form">
                              <div className="form-row">
                                <div className="form-group">
                                  <label>Max Portions for Sides</label>
                                  <input
                                    type="number"
                                    min="0"
                                    value={bundleConfig.maxPortions}
                                    onChange={(e) =>
                                      updateBundleConfig(
                                        pricing.servingSize,
                                        'maxPortions',
                                        parseInt(e.target.value) || 0
                                      )
                                    }
                                    placeholder="e.g., 2 or 4"
                                  />
                                </div>

                                <div className="form-group">
                                  <label>Max Sauces</label>
                                  <input
                                    type="number"
                                    min="0"
                                    value={bundleConfig.maxSauces}
                                    onChange={(e) =>
                                      updateBundleConfig(
                                        pricing.servingSize,
                                        'maxSauces',
                                        parseInt(e.target.value) || 0
                                      )
                                    }
                                    placeholder="e.g., 1"
                                  />
                                </div>

                                <div className="form-group">
                                  <label>
                                    <input
                                      type="checkbox"
                                      checked={bundleConfig.allowMixing}
                                      onChange={(e) =>
                                        updateBundleConfig(
                                          pricing.servingSize,
                                          'allowMixing',
                                          e.target.checked
                                        )
                                      }
                                      style={{ width: 'auto', marginRight: '8px' }}
                                    />
                                    Allow mixing different serving sizes
                                  </label>
                                </div>
                              </div>

                              <div className="portion-values-section">
                                <div className="section-header-small">
                                  <label>Portion Values for Different Serving Sizes</label>
                                  <button
                                    type="button"
                                    className="btn-primary btn-sm"
                                    onClick={() => addPortionValue(pricing.servingSize)}
                                  >
                                    + Add Portion Value
                                  </button>
                                </div>

                                {bundleConfig.portionValues.map((pv, pvIndex) => (
                                  <div key={pvIndex} className="portion-value-row">
                                    <input
                                      type="text"
                                      placeholder="Serving size (e.g., For 4 people)"
                                      value={pv.servingSize}
                                      onChange={(e) =>
                                        updatePortionValue(
                                          pricing.servingSize,
                                          pvIndex,
                                          'servingSize',
                                          e.target.value
                                        )
                                      }
                                    />
                                    <input
                                      type="number"
                                      min="0"
                                      step="0.5"
                                      placeholder="Portion value (e.g., 1 or 2)"
                                      value={pv.portionValue}
                                      onChange={(e) =>
                                        updatePortionValue(
                                          pricing.servingSize,
                                          pvIndex,
                                          'portionValue',
                                          parseFloat(e.target.value) || 0
                                        )
                                      }
                                    />
                                    <button
                                      type="button"
                                      className="btn-danger btn-sm"
                                      onClick={() =>
                                        removePortionValue(pricing.servingSize, pvIndex)
                                      }
                                    >
                                      Remove
                                    </button>
                                  </div>
                                ))}
                                {bundleConfig.portionValues.length === 0 && (
                                  <p className="help-text">
                                    Add portion values to define how different serving sizes
                                    count as portions (e.g., "For 4 people" = 1 portion,
                                    "For 8 people" = 2 portions)
                                  </p>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={handleCloseModal}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  {editingItem ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MenuItems;
