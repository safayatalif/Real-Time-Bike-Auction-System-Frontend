import { useState, useEffect } from 'react';
import api from '../services/api';

export default function AdminDashboard() {
    const [activeTab, setActiveTab] = useState('USERS');
    const [users, setUsers] = useState([]);
    const [auctions, setAuctions] = useState([]);
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchData();
    }, [activeTab]);

    const fetchData = async () => {
        setLoading(true);
        try {
            if (activeTab === 'USERS') {
                const res = await api.get('/admin/users');
                setUsers(res.data.data);
            } else if (activeTab === 'AUCTIONS') {
                const res = await api.get('/admin/auctions');
                setAuctions(res.data.data);
            } else if (activeTab === 'LOGS') {
                const res = await api.get('/admin/audit-logs');
                setLogs(res.data.data);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const toggleUserStatus = async (user) => {
        if (!window.confirm(`Are you sure you want to ${user.status === 'ACTIVE' ? 'suspend' : 'unsuspend'} this user?`)) return;
        try {
            const endpoint = user.status === 'ACTIVE' ? 'suspend' : 'unsuspend';
            const body = user.status === 'ACTIVE' ? { reason: 'Admin action' } : {};
            await api.patch(`/admin/users/${user.id}/${endpoint}`, body);
            fetchData();
        } catch (err) {
            alert(err.response?.data?.error || 'Action failed');
        }
    };

    const cancelAuction = async (id) => {
        const reason = prompt("Enter cancellation reason:");
        if (!reason) return;

        try {
            await api.patch(`/admin/auctions/${id}/cancel`, { reason });
            fetchData();
        } catch (err) {
            alert(err.response?.data?.error || 'Action failed');
        }
    };

    return (
        <div className="max-w-7xl mx-auto py-8 px-4">
            <h1 className="text-3xl font-black text-gray-900 mb-8">Admin Dashboard</h1>

            {/* Tabs */}
            <div className="flex gap-4 mb-6 border-b border-gray-200">
                {['USERS', 'AUCTIONS', 'LOGS'].map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-4 py-2 font-bold transition-all ${activeTab === tab ? 'text-primary-600 border-b-2 border-primary-600' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="text-center py-20 bg-gray-50 rounded-lg">Loading...</div>
            ) : (
                <div className="bg-white rounded-lg shadow border border-gray-100 overflow-hidden">
                    {/* USERS TABLE */}
                    {activeTab === 'USERS' && (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-gray-50 border-b border-gray-100">
                                    <tr>
                                        <th className="p-4 text-xs font-black text-gray-500 uppercase">User</th>
                                        <th className="p-4 text-xs font-black text-gray-500 uppercase">Role</th>
                                        <th className="p-4 text-xs font-black text-gray-500 uppercase">Status</th>
                                        <th className="p-4 text-xs font-black text-gray-500 uppercase">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {users.map(user => (
                                        <tr key={user.id} className="hover:bg-gray-50/50">
                                            <td className="p-4">
                                                <div className="font-bold text-gray-900">{user.name}</div>
                                                <div className="text-sm text-gray-500">{user.email}</div>
                                            </td>
                                            <td className="p-4">
                                                <span className="bg-gray-100 px-2 py-1 rounded text-xs font-bold text-gray-600">{user.role}</span>
                                            </td>
                                            <td className="p-4">
                                                <span className={`px-2 py-1 rounded text-xs font-bold ${user.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                    {user.status}
                                                </span>
                                            </td>
                                            <td className="p-4">
                                                {user.role !== 'ADMIN' && (
                                                    <button
                                                        onClick={() => toggleUserStatus(user)}
                                                        className={`text-xs font-bold px-3 py-1 rounded border ${user.status === 'ACTIVE' ? 'border-red-200 text-red-600 hover:bg-red-50' : 'border-green-200 text-green-600 hover:bg-green-50'}`}
                                                    >
                                                        {user.status === 'ACTIVE' ? 'SUSPEND' : 'ACTIVATE'}
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* AUCTIONS TABLE */}
                    {activeTab === 'AUCTIONS' && (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-gray-50 border-b border-gray-100">
                                    <tr>
                                        <th className="p-4 text-xs font-black text-gray-500 uppercase">Auction</th>
                                        <th className="p-4 text-xs font-black text-gray-500 uppercase">Price</th>
                                        <th className="p-4 text-xs font-black text-gray-500 uppercase">Status</th>
                                        <th className="p-4 text-xs font-black text-gray-500 uppercase">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {auctions.map(auction => (
                                        <tr key={auction.id} className="hover:bg-gray-50/50">
                                            <td className="p-4">
                                                <div className="font-bold text-gray-900 line-clamp-1">{auction.title}</div>
                                                <div className="text-sm text-gray-500">Seller: {auction.seller.name}</div>
                                            </td>
                                            <td className="p-4 font-mono font-medium">${auction.currentPrice}</td>
                                            <td className="p-4">
                                                <span className="bg-gray-100 px-2 py-1 rounded text-xs font-bold text-gray-600">{auction.status}</span>
                                            </td>
                                            <td className="p-4">
                                                {(auction.status === 'LIVE' || auction.status === 'SCHEDULED') && (
                                                    <button
                                                        onClick={() => cancelAuction(auction.id)}
                                                        className="text-xs font-bold text-red-600 hover:text-red-800"
                                                    >
                                                        CANCEL
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* LOGS TABLE */}
                    {activeTab === 'LOGS' && (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-gray-50 border-b border-gray-100">
                                    <tr>
                                        <th className="p-4 text-xs font-black text-gray-500 uppercase">Time</th>
                                        <th className="p-4 text-xs font-black text-gray-500 uppercase">Action</th>
                                        <th className="p-4 text-xs font-black text-gray-500 uppercase">User</th>
                                        <th className="p-4 text-xs font-black text-gray-500 uppercase">Details</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {logs.map(log => (
                                        <tr key={log.id} className="hover:bg-gray-50/50">
                                            <td className="p-4 text-xs text-gray-500 whitespace-nowrap">
                                                {new Date(log.createdAt).toLocaleString()}
                                            </td>
                                            <td className="p-4 text-sm font-bold text-gray-700">{log.action}</td>
                                            <td className="p-4 text-sm text-gray-600">{log.user?.name || log.userId}</td>
                                            <td className="p-4 text-xs text-gray-500 font-mono max-w-xs truncate">
                                                {JSON.stringify(log.details)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
