import { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { fetchNotifications, markAsRead, markAllAsRead } from '../features/notificationSlice';

export default function NotificationPanel() {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);
    const dispatch = useDispatch();
    const { notifications, unreadCount, loading } = useSelector((state) => state.notifications);

    useEffect(() => {
        dispatch(fetchNotifications({ unreadOnly: false }));
    }, [dispatch]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleToggle = () => setIsOpen(!isOpen);

    const handleMarkRead = (id) => {
        dispatch(markAsRead(id));
    };

    const handleMarkAllRead = () => {
        dispatch(markAllAsRead());
    };

    const getIcon = (type) => {
        switch (type) {
            case 'OUTBID': return '💸';
            case 'AUCTION_WON': return '🏆';
            case 'AUCTION_LOST': return '😔';
            case 'AUCTION_SOLD': return '💰';
            case 'AUCTION_ENDING_SOON': return '⏳';
            case 'AUCTION_CANCELED': return '🚫';
            default: return '🔔';
        }
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={handleToggle}
                className="relative p-2 text-gray-600 hover:text-primary-600 transition focus:outline-none"
            >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white ring-2 ring-white">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-3 w-80 max-w-[90vw] bg-white rounded-2xl shadow-2xl ring-1 ring-black ring-opacity-5 z-[100] overflow-hidden">
                    <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                        <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest">Notifications</h3>
                        {unreadCount > 0 && (
                            <button
                                onClick={handleMarkAllRead}
                                className="text-[10px] font-black text-primary-600 hover:text-primary-700 uppercase tracking-tighter"
                            >
                                Mark all as read
                            </button>
                        )}
                    </div>

                    <div className="max-h-[70vh] overflow-y-auto">
                        {loading && notifications.length === 0 ? (
                            <div className="p-8 text-center bg-white">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
                            </div>
                        ) : notifications.length > 0 ? (
                            <div className="divide-y divide-gray-50">
                                {notifications.map((notification) => (
                                    <div
                                        key={notification.id}
                                        onClick={() => !notification.isRead && handleMarkRead(notification.id)}
                                        className={`p-4 transition cursor-pointer hover:bg-primary-50/30 flex gap-3 ${!notification.isRead ? 'bg-primary-50/50' : 'bg-white'}`}
                                    >
                                        <div className="flex-shrink-0 text-xl">
                                            {getIcon(notification.type)}
                                        </div>
                                        <div className="flex-grow">
                                            <p className={`text-sm ${!notification.isRead ? 'text-gray-900 font-bold' : 'text-gray-600 font-medium'}`}>
                                                {notification.message}
                                            </p>
                                            <p className="text-[10px] text-gray-400 mt-1 font-bold">
                                                {new Date(notification.createdAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                                            </p>
                                        </div>
                                        {!notification.isRead && (
                                            <div className="flex-shrink-0 self-center">
                                                <div className="h-2 w-2 rounded-full bg-primary-600"></div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="p-12 text-center bg-white">
                                <div className="text-4xl mb-3 grayscale opacity-30">📭</div>
                                <p className="text-gray-400 font-bold text-sm tracking-tight">No notifications yet</p>
                            </div>
                        )}
                    </div>

                    {notifications.length > 0 && (
                        <Link
                            to="/notifications"
                            onClick={() => setIsOpen(false)}
                            className="block p-3 text-center text-xs font-black text-gray-500 hover:text-primary-600 bg-gray-50/50 border-t border-gray-100 uppercase tracking-widest transition"
                        >
                            View all history
                        </Link>
                    )}
                </div>
            )}
        </div>
    );
}
