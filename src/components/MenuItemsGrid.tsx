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
  // Check if Turkey with Sides is selected and which size
  const getTurkeyWithSidesBundle = () => {
    const turkeyItem = selectedItems.find(
      item => item.name.toLowerCase().includes('turkey') &&
             item.name.toLowerCase().includes('side')
    );
    if (!turkeyItem) return null;

    // Determine bundle size based on serving size
    const servingLower = turkeyItem.servingSize.toLowerCase();
    if (servingLower.includes('4')) {
      // AED 650: Choose either 2 sides for 4ppl OR 1 side for 8ppl + 1 sauce
      return { size: 4, maxPortions: 2, maxSauces: 1, price: 650, noMixing: true };
    } else if (servingLower.includes('8')) {
      // AED 850: 4 portions of sides (can be mixed) + 1 sauce
      // Examples: 2x8ppl OR 2x4ppl+1x8ppl OR 4x4ppl
      return { size: 8, maxPortions: 4, maxSauces: 1, price: 850, noMixing: false };
    }
    return null;
  };

  const turkeyBundle = getTurkeyWithSidesBundle();

  // Calculate portions based on serving size
  const getPortionsForServingSize = (servingSize: string): number => {
    const servingLower = servingSize.toLowerCase();
    if (servingLower.includes('8')) return 2; // 8 people = 2 portions
    if (servingLower.includes('4')) return 1; // 4 people = 1 portion
    return 0;
  };

  // Count included items in bundle (using portion-based logic)
  const getIncludedBundleCounts = () => {
    if (!turkeyBundle) return { portions: 0, sauces: 0, has4ppl: false, has8ppl: false };

    const includedItems = selectedItems.filter(item => item.isIncludedInBundle);

    const sideItems = includedItems.filter(item => {
      const menuItem = menuItems.find(m => m._id === item.menuItem);
      return menuItem && (menuItem.category === 'potatoes' || menuItem.category === 'vegetables');
    });

    // Check if we have any 4ppl or 8ppl sides
    const has4ppl = sideItems.some(item => item.servingSize.toLowerCase().includes('4'));
    const has8ppl = sideItems.some(item => item.servingSize.toLowerCase().includes('8'));

    // Calculate total portions used for sides
    const portions = sideItems.reduce((total, item) => {
      return total + getPortionsForServingSize(item.servingSize);
    }, 0);

    const sauces = includedItems.filter(item => {
      const menuItem = menuItems.find(m => m._id === item.menuItem);
      return menuItem && menuItem.category === 'sauces';
    }).length;

    return { portions, sauces, has4ppl, has8ppl };
  };

  const bundleCounts = getIncludedBundleCounts();
  // Group menu items by category
  const groupedItems = menuItems.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, MenuItem[]>);

  // Define category order
  const categoryOrder = [
    'roasts',
    'smoked_salmon',
    'potatoes',
    'vegetables',
    'sauces',
    'desserts',
  ];

  // Define roasts item order (by name)
  const roastsItemOrder = [
    'Turkey',
    'Turkey with Sides',
    'Honey Smoked Ham',
    'Wild Mushroom and Chickpea Wellington',
  ];

  // Sort items within roasts category
  const sortRoastsItems = (items: MenuItem[]): MenuItem[] => {
    return items.sort((a, b) => {
      const indexA = roastsItemOrder.findIndex(name =>
        a.name.toLowerCase().includes(name.toLowerCase())
      );
      const indexB = roastsItemOrder.findIndex(name =>
        b.name.toLowerCase().includes(name.toLowerCase())
      );

      // If both found, sort by index
      if (indexA !== -1 && indexB !== -1) {
        return indexA - indexB;
      }
      // If only one found, put it first
      if (indexA !== -1) return -1;
      if (indexB !== -1) return 1;
      // If neither found, maintain original order
      return 0;
    });
  };

  // Sort grouped items by category order
  const sortedCategories = categoryOrder
    .filter(category => groupedItems[category])
    .map(category => {
      const items = groupedItems[category];
      // Sort roasts items specially
      const sortedItems = category === 'roasts' ? sortRoastsItems([...items]) : items;
      return [category, sortedItems] as [string, MenuItem[]];
    });

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

  // Check if item can be included in bundle
  const canBeIncludedInBundle = (menuItem: MenuItem): boolean => {
    if (!turkeyBundle) return false;
    return menuItem.category === 'potatoes' ||
           menuItem.category === 'vegetables' ||
           menuItem.category === 'sauces';
  };

  // Determine if this item should be free as part of bundle
  const shouldBeIncludedInBundle = (menuItem: MenuItem, servingSize: string): boolean => {
    if (!turkeyBundle || !canBeIncludedInBundle(menuItem)) return false;

    const isSide = menuItem.category === 'potatoes' || menuItem.category === 'vegetables';
    const isSauce = menuItem.category === 'sauces';

    if (isSide) {
      const portionsNeeded = getPortionsForServingSize(servingSize);
      const remainingPortions = turkeyBundle.maxPortions - bundleCounts.portions;

      // For AED 650 (noMixing = true): Can't mix 4ppl and 8ppl sizes
      if (turkeyBundle.noMixing) {
        const is4ppl = servingSize.toLowerCase().includes('4');
        const is8ppl = servingSize.toLowerCase().includes('8');

        // If we already have 4ppl items, can't add 8ppl
        if (bundleCounts.has4ppl && is8ppl) return false;
        // If we already have 8ppl items, can't add 4ppl
        if (bundleCounts.has8ppl && is4ppl) return false;
      }

      return portionsNeeded <= remainingPortions;
    }

    if (isSauce && bundleCounts.sauces < turkeyBundle.maxSauces) return true;

    return false;
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
      // Determine if this should be included in bundle
      const isIncluded = shouldBeIncludedInBundle(menuItem, servingSize);

      // Add the item
      const newItem: OrderItem = {
        menuItem: menuItem._id,
        name: menuItem.name,
        servingSize,
        quantity: 1,
        price,
        totalPrice: isIncluded ? 0 : price,
        status: ItemStatus.PENDING,
        notes: '',
        isIncludedInBundle: isIncluded,
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
      {turkeyBundle && (
        <div className="bundle-info-banner">
          <div className="bundle-info-content">
            <h4>🎉 Turkey Bundle Active (AED {turkeyBundle.price})</h4>
            <p>
              {turkeyBundle.size === 4 ? (
                <>
                  Choose <strong>either</strong> 2 side dishes for 4 people <strong>OR</strong> 1 side dish for 8 people + 1 sauce included in your package.
                  {bundleCounts.has4ppl && <> (Currently selecting 4-person sides)</>}
                  {bundleCounts.has8ppl && <> (Currently selecting 8-person sides)</>}
                </>
              ) : (
                <>Select sides worth 4 portions (1 side for 8ppl = 2 portions, 1 side for 4ppl = 1 portion) and 1 sauce included in your package.</>
              )}
              {' '}
              ({bundleCounts.portions}/{turkeyBundle.maxPortions} portions used, {bundleCounts.sauces}/{turkeyBundle.maxSauces} sauce selected)
            </p>
          </div>
        </div>
      )}
      {sortedCategories.map(([category, items]) => (
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
                              <span className="price">
                                {isSelected && selectedItem?.isIncludedInBundle ? (
                                  <>
                                    <span className="original-price">AED {pricing.price.toFixed(2)}</span>
                                    <span className="included-badge">INCLUDED</span>
                                  </>
                                ) : (
                                  `AED ${pricing.price.toFixed(2)}`
                                )}
                              </span>
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
                              {selectedItem?.isIncludedInBundle ? (
                                <span className="free-item">FREE</span>
                              ) : (
                                `AED ${(pricing.price * quantity).toFixed(2)}`
                              )}
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
