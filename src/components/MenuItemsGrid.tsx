import React from 'react';
import { Plus, Minus, Check } from 'lucide-react';
import type { MenuItem, OrderItem } from '../types';
import { ItemStatus } from '../types';
import './MenuItemsGrid.css';

interface MenuItemsGridProps {
  menuItems: MenuItem[];
  selectedItems: OrderItem[];
  onItemsChange: (items: OrderItem[]) => void;
}

const MenuItemsGrid: React.FC<MenuItemsGridProps> = ({
  menuItems,
  selectedItems,
  onItemsChange,
}) => {
  // Group menu items by category
  const groupedItems = menuItems.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, MenuItem[]>);

  // Helper to check if an item + serving size is selected
  const isItemSelected = (menuItemId: string, servingSize: string): boolean => {
    return selectedItems.some(
      (item) => item.menuItem === menuItemId && item.servingSize === servingSize
    );
  };

  // Get quantity for a specific item + serving size
  const getItemQuantity = (menuItemId: string, servingSize: string): number => {
    const item = selectedItems.find(
      (item) => item.menuItem === menuItemId && item.servingSize === servingSize
    );
    return item?.quantity || 1;
  };

  // Toggle item selection
  const toggleItem = (menuItem: MenuItem, servingSize: string, price: number) => {
    const isSelected = isItemSelected(menuItem._id, servingSize);

    if (isSelected) {
      // Remove the item
      const newItems = selectedItems.filter(
        (item) => !(item.menuItem === menuItem._id && item.servingSize === servingSize)
      );
      onItemsChange(newItems);
    } else {
      // Add the item
      const newItem: OrderItem = {
        menuItem: menuItem._id,
        name: menuItem.name,
        servingSize,
        quantity: 1,
        price,
        totalPrice: price,
        status: ItemStatus.PENDING,
        notes: '',
      };
      onItemsChange([...selectedItems, newItem]);
    }
  };

  // Update quantity for an item
  const updateQuantity = (menuItemId: string, servingSize: string, newQuantity: number) => {
    if (newQuantity < 1) return;

    const newItems = selectedItems.map((item) => {
      if (item.menuItem === menuItemId && item.servingSize === servingSize) {
        return {
          ...item,
          quantity: newQuantity,
          totalPrice: item.price * newQuantity,
        };
      }
      return item;
    });
    onItemsChange(newItems);
  };

  // Update notes for an item
  const updateNotes = (menuItemId: string, servingSize: string, notes: string) => {
    const newItems = selectedItems.map((item) => {
      if (item.menuItem === menuItemId && item.servingSize === servingSize) {
        return { ...item, notes };
      }
      return item;
    });
    onItemsChange(newItems);
  };

  // Calculate total
  const calculateTotal = (): number => {
    return selectedItems.reduce((sum, item) => sum + item.totalPrice, 0);
  };

  // Category display names
  const categoryNames: Record<string, string> = {
    roasts: 'Roasts',
    smoked_salmon: 'Smoked Salmon',
    potatoes: 'Potatoes',
    vegetables: 'Vegetables',
    sauces: 'Sauces',
    desserts: 'Desserts',
  };

  return (
    <div className="menu-items-grid">
      {Object.entries(groupedItems).map(([category, items]) => (
        <div key={category} className="menu-category">
          <h3 className="category-title">{categoryNames[category] || category}</h3>
          <div className="menu-items-list">
            {items.map((menuItem) => (
              <div key={menuItem._id} className="menu-item-card">
                <div className="menu-item-header">
                  <div className="menu-item-info">
                    <h4 className="menu-item-name">{menuItem.name}</h4>
                    {menuItem.description && (
                      <p className="menu-item-description">{menuItem.description}</p>
                    )}
                    {menuItem.allergens && menuItem.allergens.length > 0 && (
                      <div className="menu-item-allergens">
                        <span className="allergen-label">Allergens:</span>
                        {menuItem.allergens.join(', ')}
                      </div>
                    )}
                  </div>
                  {!menuItem.isAvailable && (
                    <span className="unavailable-badge">Unavailable</span>
                  )}
                </div>

                <div className="menu-item-pricing">
                  {menuItem.pricing.map((pricing) => {
                    const isSelected = isItemSelected(menuItem._id, pricing.servingSize);
                    const quantity = getItemQuantity(menuItem._id, pricing.servingSize);
                    const selectedItem = selectedItems.find(
                      (item) =>
                        item.menuItem === menuItem._id &&
                        item.servingSize === pricing.servingSize
                    );

                    return (
                      <div
                        key={pricing.servingSize}
                        className={`pricing-option ${isSelected ? 'selected' : ''} ${
                          !menuItem.isAvailable ? 'disabled' : ''
                        }`}
                      >
                        <div className="pricing-header">
                          <button
                            type="button"
                            className={`select-button ${isSelected ? 'selected' : ''}`}
                            onClick={() =>
                              menuItem.isAvailable &&
                              toggleItem(menuItem, pricing.servingSize, pricing.price)
                            }
                            disabled={!menuItem.isAvailable}
                          >
                            <span className="checkbox">
                              {isSelected && <Check size={16} />}
                            </span>
                            <div className="pricing-details">
                              <span className="serving-size">{pricing.servingSize}</span>
                              <span className="price">AED {pricing.price.toFixed(2)}</span>
                            </div>
                          </button>
                        </div>

                        {isSelected && (
                          <div className="quantity-controls">
                            <div className="quantity-adjuster">
                              <button
                                type="button"
                                className="qty-button"
                                onClick={() =>
                                  updateQuantity(
                                    menuItem._id,
                                    pricing.servingSize,
                                    quantity - 1
                                  )
                                }
                                disabled={quantity <= 1}
                              >
                                <Minus size={16} />
                              </button>
                              <span className="quantity-display">{quantity}</span>
                              <button
                                type="button"
                                className="qty-button"
                                onClick={() =>
                                  updateQuantity(
                                    menuItem._id,
                                    pricing.servingSize,
                                    quantity + 1
                                  )
                                }
                              >
                                <Plus size={16} />
                              </button>
                            </div>
                            <span className="item-total">
                              AED {(pricing.price * quantity).toFixed(2)}
                            </span>
                          </div>
                        )}

                        {isSelected && (
                          <div className="item-notes">
                            <input
                              type="text"
                              placeholder="Special instructions (optional)"
                              value={selectedItem?.notes || ''}
                              onChange={(e) =>
                                updateNotes(menuItem._id, pricing.servingSize, e.target.value)
                              }
                              className="notes-input"
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {selectedItems.length > 0 && (
        <div className="order-summary">
          <div className="summary-content">
            <div className="summary-items">
              <span className="summary-label">
                {selectedItems.length} item{selectedItems.length !== 1 ? 's' : ''} selected
              </span>
            </div>
            <div className="summary-total">
              <span className="total-label">Total:</span>
              <span className="total-amount">AED {calculateTotal().toFixed(2)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MenuItemsGrid;
