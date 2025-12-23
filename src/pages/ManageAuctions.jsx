import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';

export default function ManageAuctions() {
    const [auctions, setAuctions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchMyAuctions();
    }, []);

    const fetchMyAuctions = async () => {
        try {
            setLoading(true);
            // We need an endpoint for seller's own auctions. Let's assume /auctions?sellerId=me or similar, 
            // but usually many systems have a specific endpoint. 
            // If none exists, we use /auctions?sellerId=... or filter from list.
            // Based on previous tools, we have /api/admin/auctions?sellerId=X but users can't call /admin.
            // Let's check auctionController methods for a seller view.
            const response = await api.get('/auctions/seller');
            setAuctions(response.data);
        } catch (err) {
            setError('Failed to fetch your auctions');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const cancelAuction = async (id, title) => {
        if (!window.confirm(`Are you sure you want to cancel "${title}"? This cannot be undone.`)) return;

        try {
            await api.patch(`/auctions/${id}/cancel`, { reason: 'Cancelled by seller' });
            fetchMyAuctions();
        } catch (err) {
            alert(err.response?.data?.error || 'Failed to cancel auction');
        }
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'LIVE': return <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">Live</span>;
            case 'SCHEDULED': return <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">Scheduled</span>;
            case 'ENDED': return <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">Ended</span>;
            case 'CANCELED': return <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">Cancelled</span>;
            default: return <span className="bg-gray-50 text-gray-500 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">{status}</span>;
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto py-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
                <div>
                    <h1 className="text-3xl font-black text-gray-900">Manage Your Auctions</h1>
                    <p className="text-gray-500 font-medium">Tracking and controlling your active and past listings</p>
                </div>
                <Link
                    to="/create-auction"
                    className="bg-primary-600 text-white px-8 py-3 rounded-2xl font-black shadow-lg shadow-primary-200 hover:bg-primary-700 transition text-center"
                >
                    + NEW LISTING
                </Link>
            </div>

            {error ? (
                <div className="p-8 bg-white rounded-3xl text-center border-2 border-dashed border-red-100">
                    <p className="text-red-500 font-bold">{error}</p>
                </div>
            ) : auctions.length === 0 ? (
                <div className="p-20 bg-white rounded-3xl text-center border-2 border-dashed border-gray-100 shadow-sm">
                    <div className="text-6xl mb-6 grayscale opacity-50">🚲</div>
                    <h2 className="text-2xl font-black text-gray-900 mb-2">You haven't listed any bikes yet</h2>
                    <p className="text-gray-500 mb-8 max-w-sm mx-auto">Ready to sell your bike to our community? Create your first auction today!</p>
                    <Link
                        to="/create-auction"
                        className="inline-block px-12 py-3 bg-primary-600 text-white font-black rounded-2xl hover:bg-primary-700 transition"
                    >
                        START SELLING
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-6">
                    {auctions.map((auction) => (
                        <div key={auction.id} className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex flex-col md:flex-row gap-6 items-center">
                            <div className="w-full md:w-32 h-32 rounded-2xl overflow-hidden bg-gray-50 flex-shrink-0">
                                <img
                                    src={auction.images?.[0] || 'https://via.placeholder.com/150'}
                                    alt={auction.title}
                                    className="w-full h-full object-cover"
                                />
                            </div>

                            <div className="flex-grow space-y-2 text-center md:text-left">
                                <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                                    <h3 className="text-lg font-black text-gray-900">{auction.title}</h3>
                                    {getStatusBadge(auction.status)}
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2">
                                    <div>
                                        <p className="text-[10px] font-black text-gray-400 border uppercase tracking-wider">Starting</p>
                                        <p className="text-sm font-bold text-gray-700">${auction.startingPrice}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-gray-400 border uppercase tracking-wider">Current</p>
                                        <p className="text-sm font-black text-primary-600">${auction.currentPrice}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-gray-400 border uppercase tracking-wider">Bids</p>
                                        <p className="text-sm font-bold text-gray-700">{auction._count?.bids || 0}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-gray-400 border uppercase tracking-wider">Ending</p>
                                        <p className="text-sm font-bold text-gray-700">{new Date(auction.endTime).toLocaleDateString()}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-wrap gap-2 w-full md:w-auto">
                                <Link
                                    to={`/auctions/${auction.id}`}
                                    className="flex-grow md:flex-initial px-6 py-3 bg-gray-50 text-gray-700 font-black rounded-xl hover:bg-gray-100 transition text-center"
                                >
                                    VIEW
                                </Link>
                                {auction.status === 'LIVE' || auction.status === 'SCHEDULED' ? (
                                    <button
                                        onClick={() => cancelAuction(auction.id, auction.title)}
                                        className="flex-grow md:flex-initial px-6 py-3 bg-red-50 text-red-600 font-black rounded-xl hover:bg-red-100 transition flex items-center justify-center gap-2"
                                    >
                                        CANCEL
                                    </button>
                                ) : null}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
