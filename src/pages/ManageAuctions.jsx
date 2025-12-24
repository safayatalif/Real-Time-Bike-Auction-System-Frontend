import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';

export default function ManageAuctions() {
    const [auctions, setAuctions] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchMyAuctions();
    }, []);

    const fetchMyAuctions = async () => {
        try {
            setLoading(true);
            const response = await api.get('/auctions/seller');
            setAuctions(response.data);
        } catch (err) {
            toast.error('Failed to fetch your auctions');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const cancelAuction = async (id, title) => {
        if (!window.confirm(`Are you sure you want to cancel "${title}"? This cannot be undone.`)) return;

        try {
            await api.patch(`/auctions/${id}/cancel`, { reason: 'Cancelled by seller' });
            toast.success('Auction cancelled successfully');
            fetchMyAuctions();
        } catch (err) {
            toast.error(err.response?.data?.error || 'Failed to cancel auction');
        }
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'LIVE': return <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">Live</span>;
            case 'SCHEDULED': return <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">Scheduled</span>;
            case 'DRAFT': return <span className="bg-slate-100 text-slate-700 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">Draft</span>;
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
        <div className="max-w-7xl mx-auto py-12 px-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
                <div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tighter">Inventory Control</h1>
                    <p className="text-slate-500 font-medium">Tracking and controlling your elite listings</p>
                </div>
                <Link
                    to="/create-auction"
                    className="btn-primary"
                >
                    + NEW AUCTION
                </Link>
            </div>

            {auctions.length === 0 ? (
                <div className="p-24 bg-white rounded-[3rem] text-center shadow-sm border border-slate-100">
                    <div className="text-7xl mb-8 grayscale opacity-20">🚲</div>
                    <h2 className="text-3xl font-black text-slate-900 mb-4 tracking-tighter">Your showroom is empty</h2>
                    <p className="text-slate-400 mb-10 max-w-sm mx-auto font-medium">Ready to list your premium bike? Join our community of elite sellers today.</p>
                    <Link
                        to="/create-auction"
                        className="btn-primary inline-block"
                    >
                        START SELLING
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-8">
                    {auctions.map((auction) => (
                        <div key={auction.id} className="card group flex flex-col md:flex-row gap-8 items-center !p-8">
                            <div className="w-full md:w-40 h-40 rounded-[1.5rem] overflow-hidden bg-slate-50 flex-shrink-0 shadow-inner">
                                <img
                                    src={auction.images?.[0] || 'https://via.placeholder.com/150'}
                                    alt={auction.title}
                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                />
                            </div>

                            <div className="flex-grow space-y-4 text-center md:text-left">
                                <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
                                    <h3 className="text-2xl font-black text-slate-900 tracking-tight">{auction.title}</h3>
                                    {getStatusBadge(auction.status)}
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                                    <div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Starting</p>
                                        <p className="text-lg font-black text-slate-900 tracking-tight">${auction.startingPrice}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Current</p>
                                        <p className="text-lg font-black text-primary-600 tracking-tight">${auction.currentPrice}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Bids</p>
                                        <p className="text-lg font-black text-slate-900 tracking-tight">{auction._count?.bids || 0}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Ending</p>
                                        <p className="text-sm font-black text-slate-600 tracking-tight">{new Date(auction.endTime).toLocaleDateString()}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-wrap gap-4 w-full md:w-auto">
                                {auction.status === 'DRAFT' ? (
                                    <Link
                                        to={`/edit-auction/${auction.id}`}
                                        className="flex-grow md:flex-initial px-8 py-3 bg-primary-600 text-white font-black rounded-2xl hover:bg-primary-700 transition shadow-lg shadow-primary-200"
                                    >
                                        EDIT DRAFT
                                    </Link>
                                ) : (
                                    <Link
                                        to={`/auctions/${auction.id}`}
                                        className="flex-grow md:flex-initial px-8 py-3 bg-slate-900 text-white font-black rounded-2xl hover:bg-primary-600 transition shadow-lg shadow-slate-200"
                                    >
                                        MANAGE
                                    </Link>
                                )}
                                {auction.status === 'LIVE' || auction.status === 'SCHEDULED' || auction.status === 'DRAFT' ? (
                                    <button
                                        onClick={() => cancelAuction(auction.id, auction.title)}
                                        className="flex-grow md:flex-initial px-8 py-3 bg-red-50 text-red-600 font-black rounded-2xl hover:bg-red-100 transition border border-red-100"
                                    >
                                        {auction.status === 'DRAFT' ? 'DELETE' : 'CANCEL'}
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
