export const UserRole = {
  OPERATIONS: 'operations',
  ORDER_TAKER: 'order-taker',
  ADMIN: 'admin'
} as const;
export type UserRole = typeof UserRole[keyof typeof UserRole];

export const OrderStatus = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  CANCELLED: 'cancelled',
  REFUNDED: 'refunded',
  ON_HOLD: 'on_hold',
  COLLECTED: 'collected',
  AWAITING_COLLECTION: 'awaiting_collection',
  DELAYED: 'delayed',
  DELETED: 'deleted'
} as const;
export type OrderStatus = typeof OrderStatus[keyof typeof OrderStatus];

export const PaymentStatus = {
  PENDING: 'pending',
  PARTIAL: 'partial',
  PAID: 'paid',
  REFUNDED: 'refunded'
} as const;
export type PaymentStatus = typeof PaymentStatus[keyof typeof PaymentStatus];

export const PaymentMethod = {
  CARD: 'card',
  CASH: 'cash',
  SERVME: 'servme',
  SECUREPAY: 'securepay',
  BANK_TRANSFER: 'bank_transfer',
  OTHER: 'other'
} as const;
export type PaymentMethod = typeof PaymentMethod[keyof typeof PaymentMethod];

export const ItemStatus = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  NOT_COLLECTED: 'not_collected',
  COLLECTED: 'collected'
} as const;
export type ItemStatus = typeof ItemStatus[keyof typeof ItemStatus];

export const MenuCategory = {
  ROASTS: 'roasts',
  SMOKED_SALMON: 'smoked_salmon',
  POTATOES: 'potatoes',
  VEGETABLES: 'vegetables',
  SAUCES: 'sauces',
  DESSERTS: 'desserts',
  OFF_THE_MENU: 'off_the_menu'
} as const;
export type MenuCategory = typeof MenuCategory[keyof typeof MenuCategory];

export interface User {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface BundleConfig {
  servingSize: string;
  maxPortions: number;
  maxSauces: number;
  allowMixing: boolean;
  portionValues?: {
    servingSize: string;
    portionValue: number;
  }[];
}

export interface PackageConstraints {
  servingSize: string;
  allowedSides?: {
    maxCount: number;
    servingSize: string;
    categories: string[];
  };
  allowedSauces?: {
    maxCount: number;
    servingSize: string;
  };
}

export interface MenuItem {
  _id: string;
  name: string;
  description?: string;
  category: MenuCategory;
  pricing: {
    servingSize: string;
    price: number;
  }[];
  allergens?: string[];
  isAvailable: boolean;
  bundleConfig?: BundleConfig[];
  packageConstraints?: PackageConstraints[];
  createdAt: string;
  updatedAt: string;
}

export interface OrderItem {
  _id?: string;
  menuItem: string;
  name: string;
  servingSize: string;
  quantity: number;
  price: number;
  totalPrice: number;
  status: ItemStatus;
  notes?: string;
  isIncludedInBundle?: boolean; // For items included in Turkey with Sides bundle
}

export interface PaymentRecord {
  _id?: string;
  amount: number;
  method: PaymentMethod;
  receivedAt: string;
  notes?: string;
}

export interface StatusHistory {
  _id?: string;
  status: OrderStatus;
  changedBy: string;
  changedAt: string;
  notes?: string;
}

export interface GuestDetails {
  name: string;
  email: string;
  phone: string;
  address: string;
}

export interface Guest {
  _id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  notes?: string;
  dietaryRequirements?: string;
  preferredContactMethod?: 'email' | 'phone';
  totalOrders: number;
  totalSpent: number;
  lastOrderDate?: string;
  createdBy: string;
  lastModifiedBy: string;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Order {
  _id: string;
  orderNumber: string;
  guest?: Guest | string; // Can be populated Guest object or just ID
  guestDetails: GuestDetails;
  collectionPerson: {
    name: string;
    email?: string;
    phone?: string;
  };
  items: OrderItem[];
  subtotalAmount: number; // Amount before discount
  discountPercentage?: number; // Discount percentage (e.g., 20 for 20%)
  discountName?: string; // Name/reason for the discount
  discountAmount: number; // Calculated discount amount
  totalAmount: number; // Final amount after discount
  collectionDate: string;
  collectionTime: string;
  status: OrderStatus;
  statusHistory: StatusHistory[];
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  paymentRecords: PaymentRecord[];
  totalPaid: number;
  createdBy: string;
  lastModifiedBy: string;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  token: string;
  user: User;
  mustChangePassword?: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface PaginationInfo {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface GuestSearchResult {
  _id?: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  totalOrders?: number;
  totalSpent?: number;
  hasProfile?: boolean;
}
