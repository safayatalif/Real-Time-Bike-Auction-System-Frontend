# BikeBid Frontend

A modern React frontend for the BikeBid real-time auction platform.

## Tech Stack

- **React 18** - UI library
- **Vite** - Build tool and dev server
- **Redux Toolkit** - State management
- **React Router** - Routing
- **Tailwind CSS** - Styling
- **Axios** - HTTP client
- **Socket.IO Client** - Real-time communication

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
├── components/       # Reusable components
│   └── ProtectedRoute.jsx
├── features/         # Redux slices
│   └── authSlice.js
├── layouts/          # Layout components
│   └── MainLayout.jsx
├── pages/            # Page components
│   ├── Login.jsx
│   ├── Register.jsx
│   └── Home.jsx
├── services/         # API services
│   └── api.js
├── store/            # Redux store
│   └── store.js
├── utils/            # Utility functions
├── App.jsx           # Main app component
├── main.jsx          # Entry point
└── index.css         # Global styles
```

## Features Implemented

✅ User authentication (Login/Register)
✅ Protected routes with role-based access
✅ Redux state management
✅ Axios interceptors for token refresh
✅ Premium UI with Tailwind CSS
✅ Responsive design
✅ User menu with logout
✅ Notification bell (UI only)

## Environment Variables

Create a `.env` file:

```env
VITE_API_URL=http://localhost:5000/api
```

## Available Routes

- `/login` - Login page
- `/register` - Registration page
- `/` - Home page (protected)

## Authentication Flow

1. User logs in/registers
2. Access token and refresh token stored in localStorage
3. Access token sent with every API request
4. Automatic token refresh on 401 errors
5. Redirect to login on refresh failure

## Next Steps

- [ ] Implement auction listing page
- [ ] Implement auction detail page with real-time bidding
- [ ] Implement watchlist functionality
- [ ] Implement notifications
- [ ] Implement Socket.IO connection
- [ ] Implement seller dashboard
- [ ] Implement admin panel

## License

MIT
