# Turkey Take-Away - Frontend

Professional order management system for festive takeaway service.

## Features

- **Authentication**: Secure login for staff members
- **Order Management**: Create, view, and manage festive takeaway orders
- **Menu Items Management**: Admin interface to manage menu items and pricing
- **Payment Tracking**: Record and track payments with full payment history
- **Order Status Updates**: Track orders through their lifecycle
- **Analytics & Export**: Export orders to Excel for reporting
- **Responsive Design**: Modern, clean interface with professional styling

## Tech Stack

- **React 19** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **React Router** - Client-side routing
- **CSS** - Custom CSS with modern design system

## Color Scheme

- **White** (#ffffff) - Primary background
- **Grey shades** (#fafafa, #f5f5f5, #e0e0e0) - Secondary backgrounds and borders
- **Black** (#333333) - Primary text
- **Blue** (#1e88e5) - Primary actions and accents

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Backend server running (see `../back` folder)

### Installation

```bash
# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Update .env with your backend URL
# VITE_API_URL=http://localhost:5000/api
```

### Development

```bash
# Start development server
npm run dev

# The app will be available at http://localhost:5173
```

### Building for Production

```bash
# Build for production
npm run build

# Preview production build
npm run preview
```

## Project Structure

```
src/
├── components/         # Reusable components
│   ├── DashboardLayout.tsx
│   └── ProtectedRoute.tsx
├── contexts/          # React contexts
│   └── AuthContext.tsx
├── pages/             # Page components
│   ├── Login.tsx
│   ├── Dashboard.tsx
│   ├── Orders.tsx
│   ├── OrderForm.tsx
│   ├── OrderDetail.tsx
│   ├── MenuItems.tsx
│   └── Analytics.tsx
├── services/          # API services
│   └── api.ts
├── types/             # TypeScript types
│   └── index.ts
├── App.tsx            # Main app component
├── main.tsx           # Entry point
└── index.css          # Global styles
```

## User Roles

- **Order Taker**: Can create and manage orders
- **Operations**: Can view and update order status
- **Admin**: Full access including menu item management

## Key Pages

### Login
- Secure authentication for staff members
- Email and password validation
- Automatic redirect to dashboard

### Dashboard
- Overview statistics
- Recent orders
- Quick access to key functions

### Orders
- List all orders with filtering
- Search by order number, name, or email
- Status and payment status badges
- Quick view and edit actions

### Order Form
- Create new orders
- Edit existing orders
- Dynamic menu item selection
- Automatic price calculation
- Guest and collection person details
- Collection date and time selection

### Order Detail
- Complete order information
- Payment tracking and history
- Status update functionality
- Guest and collection details
- Item breakdown

### Menu Items (Admin Only)
- View all menu items by category
- Add, edit, and delete items
- Manage pricing for different serving sizes
- Toggle item availability
- Allergen information

### Analytics
- Export orders to Excel
- Date range selection
- Quick date range presets

## Environment Variables

```
VITE_API_URL=http://localhost:5000/api
```

## Default Credentials

Check with the backend administrator for default login credentials.

## Support

For issues or questions, contact the development team.
