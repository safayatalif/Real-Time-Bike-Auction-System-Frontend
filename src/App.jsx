import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchCurrentUser } from './features/authSlice';
import ProtectedRoute from './components/ProtectedRoute';
import MainLayout from './layouts/MainLayout';
import Login from './pages/Login';
import Register from './pages/Register';
import Home from './pages/Home';
import AuctionDetail from './pages/AuctionDetail';
import ManageAuctions from './pages/ManageAuctions';
import CreateAuction from './pages/CreateAuction';
import AdminDashboard from './pages/AdminDashboard';
import MyBids from './pages/MyBids';
import Watchlist from './pages/Watchlist';
import socketService from './services/socket';
import { addNotification } from './features/notificationSlice';
import { Toaster } from 'react-hot-toast';

function App() {
  const dispatch = useDispatch();
  const { isAuthenticated, loading, user } = useSelector((state) => state.auth);

  useEffect(() => {
    if (isAuthenticated && !user) {
      dispatch(fetchCurrentUser());
    }
  }, [dispatch, isAuthenticated, user]);

  useEffect(() => {
    if (isAuthenticated && user) {
      // Setup global socket for notifications
      const socket = socketService.connect();
      socketService.joinUser(user.id);

      socket.on('outbid', (data) => {
        // Simple alert for now, can be replaced with a toast
        alert(`You've been outbid on auction #${data.auctionId}! New price: $${data.newPrice}`);
      });

      socket.on('notification', (data) => {
        console.log('New notification:', data);
        dispatch(addNotification(data));
      });

      return () => {
        socketService.disconnect();
      };
    }
  }, [dispatch, isAuthenticated, user]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <Toaster position="top-right" reverseOrder={false} />
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Protected Routes */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <MainLayout>
                <Home />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/auctions/:id"
          element={
            <ProtectedRoute>
              <MainLayout>
                <AuctionDetail />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/my-bids"
          element={
            <ProtectedRoute>
              <MainLayout>
                <MyBids />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/watchlist"
          element={
            <ProtectedRoute>
              <MainLayout>
                <Watchlist />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/my-auctions"
          element={
            <ProtectedRoute roles={['SELLER', 'ADMIN']}>
              <MainLayout>
                <ManageAuctions />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/create-auction"
          element={
            <ProtectedRoute roles={['SELLER', 'ADMIN']}>
              <MainLayout>
                <CreateAuction />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/edit-auction/:id"
          element={
            <ProtectedRoute roles={['SELLER', 'ADMIN']}>
              <MainLayout>
                <CreateAuction />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin"
          element={
            <ProtectedRoute roles={['ADMIN']}>
              <MainLayout>
                <AdminDashboard />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        {/* Catch all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
