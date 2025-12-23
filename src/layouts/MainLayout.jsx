import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../features/authSlice';
import NotificationPanel from '../components/NotificationPanel';

export default function MainLayout({ children }) {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const { user } = useSelector((state) => state.auth);
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const handleLogout = async () => {
        await dispatch(logout());
        navigate('/login');
    };

    const navigation = [
        { name: 'Browse Auctions', href: '/', icon: '🏠', roles: ['BUYER', 'SELLER', 'ADMIN'] },
        { name: 'My Bids', href: '/my-bids', icon: '💰', roles: ['BUYER', 'SELLER'] },
        { name: 'Watchlist', href: '/watchlist', icon: '⭐', roles: ['BUYER', 'SELLER'] },
        { name: 'My Auctions', href: '/my-auctions', icon: '📦', roles: ['SELLER', 'ADMIN'] },
        { name: 'Create Auction', href: '/create-auction', icon: '➕', roles: ['SELLER', 'ADMIN'] },
        { name: 'Admin Panel', href: '/admin', icon: '⚙️', roles: ['ADMIN'] },
    ];

    const filteredNavigation = navigation.filter(
        (item) => !item.roles || item.roles.includes(user?.role)
    );

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white shadow-sm sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        {/* Logo */}
                        <div className="flex items-center">
                            <Link to="/" className="flex items-center">
                                <span className="text-2xl font-bold text-primary-600">BikeBid</span>
                            </Link>
                        </div>

                        {/* Desktop Navigation */}
                        <nav className="hidden md:flex space-x-8">
                            {filteredNavigation.slice(0, 3).map((item) => (
                                <Link
                                    key={item.name}
                                    to={item.href}
                                    className="text-gray-700 hover:text-primary-600 px-3 py-2 text-sm font-medium transition"
                                >
                                    {item.name}
                                </Link>
                            ))}
                        </nav>

                        {/* Right side */}
                        <div className="flex items-center space-x-4">
                            {/* Notifications */}
                            <NotificationPanel />

                            {/* User Menu */}
                            <div className="relative">
                                <button
                                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                                    className="flex items-center space-x-2 text-gray-700 hover:text-primary-600 transition"
                                >
                                    <div className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center text-white font-medium">
                                        {user?.name?.charAt(0).toUpperCase() || 'U'}
                                    </div>
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </button>

                                {userMenuOpen && (
                                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-1 z-50">
                                        <div className="px-4 py-2 border-b">
                                            <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                                            <p className="text-xs text-gray-500">{user?.email}</p>
                                        </div>
                                        <Link
                                            to="/profile"
                                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                        >
                                            Profile
                                        </Link>
                                        <Link
                                            to="/settings"
                                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                        >
                                            Settings
                                        </Link>
                                        <button
                                            onClick={handleLogout}
                                            className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                                        >
                                            Sign out
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Mobile menu button */}
                            <button
                                onClick={() => setSidebarOpen(!sidebarOpen)}
                                className="md:hidden p-2 text-gray-600 hover:text-primary-600"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Mobile Sidebar */}
            {sidebarOpen && (
                <div className="fixed inset-0 z-40 md:hidden">
                    <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)}></div>
                    <div className="fixed inset-y-0 left-0 max-w-xs w-full bg-white shadow-xl">
                        <div className="p-6">
                            <h2 className="text-lg font-semibold mb-4">Menu</h2>
                            <nav className="space-y-2">
                                {filteredNavigation.map((item) => (
                                    <Link
                                        key={item.name}
                                        to={item.href}
                                        onClick={() => setSidebarOpen(false)}
                                        className="flex items-center space-x-3 px-3 py-2 text-gray-700 hover:bg-primary-50 hover:text-primary-600 rounded-lg transition"
                                    >
                                        <span>{item.icon}</span>
                                        <span>{item.name}</span>
                                    </Link>
                                ))}
                            </nav>
                        </div>
                    </div>
                </div>
            )}

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {children}
            </main>
        </div>
    );
}
