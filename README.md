# BikeBid Frontend

A modern, premium React frontend for the BikeBid real-time auction platform.

## Tech Stack

- **React 18** - UI library
- **Vite** - Build tool and dev server
- **Redux Toolkit** - State management
- **React Router** - Routing
- **Tailwind CSS** - Modern, custom styling
- **Axios** - HTTP client for API communication
- **Socket.IO Client** - Real-time updates and notifications
- **React Hot Toast** - Premium notification alerts

## Getting Started

### Prerequisites

- Node.js 16+
- Backend server running on `http://localhost:5000`

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

The app will be available at `http://localhost:5173`

### Build

```bash
npm run build
```

## Project Structure

```
src/
├── components/       # Reusable components (AuctionCard, CountdownTimer, etc.)
├── features/         # Redux slices (auth, auction, notification)
├── layouts/          # Layout components (MainLayout)
├── pages/            # Page components
│   ├── Login.jsx
│   ├── Register.jsx
│   ├── Home.jsx
│   ├── AuctionDetail.jsx
│   ├── CreateAuction.jsx
│   ├── ManageAuctions.jsx
│   ├── MyBids.jsx
│   ├── Watchlist.jsx
│   └── AdminDashboard.jsx
├── services/         # API & Socket services
├── store/            # Redux store configuration
└── index.css         # Global styles & Tailwind theme
```

## Key Features

- **Real-Time Bidding**: Dynamic auction updates via WebSockets.
- **Auction Lifecycle**: Full support for Drafts, Scheduled, Live, and Concluded auctions.
- **Premium Aesthetics**: Sleek glassmorphism design with custom gradients and micro-animations.
- **Role-Based Access**: Specialized views for Buyers, Sellers, and Admins.
- **Global Notifications**: Toast alerts for outbid status, successful bids, and system errors.
- **Watchlist & Tracking**: Save favorite auctions and monitor bid history.
- **Robust Auth**: Persistent sessions with automatic token refresh on reload.

## Environment Variables

Create a `.env` file in the root directory:

```env
VITE_API_URL=http://localhost:5000/api
```

## Available Routes

- `/login` - Login with modern UI
- `/register` - Account creation
- `/` - Auction gallery (Buyer view)
- `/auctions/:id` - Detailed auction view with real-time bid history
- `/my-bids` - Tracking of your active and past bids
- `/watchlist` - Saved auctions for quick access
- `/my-auctions` - Seller dashboard for inventory control
- `/create-auction` - Listing creator with Draft support
- `/edit-auction/:id` - Refine drafts or scheduled listings
- `/admin` - Global moderation and audit logs

## Authentication Flow

1. User logs in/registers.
2. Access token and refresh token stored in `localStorage`.
3. Persistent session maintenance fetches user profile automatically on page reload.
4. Automatic token refresh interceptors handle session expiry gracefully.

## License

MIT
