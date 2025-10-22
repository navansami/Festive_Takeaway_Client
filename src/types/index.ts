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
  CASH: 'cash',
  CARD: 'card',
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
  DESSERTS: 'desserts'
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

export interface Order {
  _id: string;
  orderNumber: string;
  guestDetails: GuestDetails;
  collectionPerson: {
    name: string;
    email?: string;
    phone?: string;
  };
  items: OrderItem[];
  totalAmount: number;
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
}

export interface LoginCredentials {
  email: string;
  password: string;
}
