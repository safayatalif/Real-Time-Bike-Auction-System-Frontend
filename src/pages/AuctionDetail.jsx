import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import api from '../services/api';
import socketService from '../services/socket';
import CountdownTimer from '../components/CountdownTimer';

export default function AuctionDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useSelector((state) => state.auth);

    const [auction, setAuction] = useState(null);
    const [loading, setLoading] = useState(true);
    const [bids, setBids] = useState([]);
    const [bidAmount, setBidAmount] = useState('');
    const [placingBid, setPlacingBid] = useState(false);
    const [isWatching, setIsWatching] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    useEffect(() => {
        fetchData();
        setupSocket();

        return () => {
            socketService.leaveAuction(id);
        };
    }, [id]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [auctionRes, bidsRes, watchlistRes] = await Promise.all([
                api.get(`/auctions/${id}`),
                api.get(`/auctions/${id}/bids`),
                api.get(`/watchlist/check/${id}`)
            ]);

            setAuction(auctionRes.data);
            setBids(bidsRes.data);
            setIsWatching(watchlistRes.data.isWatching);

            // Suggest min bid
            const minIncrement = parseFloat(auctionRes.data.minIncrement || 0);
            const currentPrice = parseFloat(auctionRes.data.currentPrice || 0);
            const startingPrice = parseFloat(auctionRes.data.startingPrice || 0);

            // If no bids, suggest starting price, else suggest current price + minIncrement
            const suggestedBid = bidsRes.data.length === 0 ? startingPrice : currentPrice + minIncrement;
            setBidAmount(suggestedBid.toString());

        } catch (err) {
            console.error('Failed to fetch auction details:', err);
            setError('Failed to load auction details.');
        } finally {
            setLoading(false);
        }
    };

    const setupSocket = () => {
        socketService.connect();
        socketService.joinAuction(id);

        const socket = socketService.socket;
        if (socket) {
            socket.on('bidPlaced', (data) => {
                if (data.auctionId === parseInt(id)) {
                    setAuction(prev => ({
                        ...prev,
                        currentPrice: data.newPrice,
                        endTime: data.endTime,
                        _count: { ...prev._count, bids: data.bidCount }
                    }));

                    // Re-fetch bids list for the history table
                    fetchBids();
                }
            });

            socket.on('auctionExtended', (data) => {
                if (data.auctionId === parseInt(id)) {
                    setAuction(prev => ({
                        ...prev,
                        endTime: data.newEndTime
                    }));
                }
            });

            socket.on('auctionEnded', (data) => {
                if (data.auctionId === parseInt(id)) {
                    setAuction(prev => ({
                        ...prev,
                        status: 'ENDED',
                        winnerId: data.winnerId
                    }));
                    setSuccess('Auction has ended!');
                }
            });
        }
    };

    const fetchBids = async () => {
        try {
            const response = await api.get(`/auctions/${id}/bids`);
            setBids(response.data);
        } catch (err) {
            console.error('Failed to fetch bids:', err);
        }
    };

    const handlePlaceBid = async (e) => {
        e.preventDefault();
        if (!user) return navigate('/login');

        setError(null);
        setSuccess(null);
        setPlacingBid(true);

        try {
            const response = await api.post('/bids', {
                auctionId: parseInt(id),
                amount: parseFloat(bidAmount),
                idempotencyKey: `bid-${userId}-${id}-${Date.now()}`
            });

            setSuccess('Bid placed successfuly!');
            // Update local suggested amount
            setBidAmount((parseFloat(bidAmount) + parseFloat(auction.minIncrement)).toString());
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to place bid');
        } finally {
            setPlacingBid(false);
        }
    };

    const handleBuyNow = async () => {
        if (!user) return navigate('/login');
        if (!window.confirm(`Confirm purchase of "${auction.title}" for $${auction.buyNowPrice}?`)) return;

        try {
            await api.post(`/auctions/${id}/buy-now`);
            setSuccess('Item purchased successfully!');
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to complete purchase');
        }
    };

    const toggleWatchlist = async () => {
        if (!user) return navigate('/login');
        try {
            if (isWatching) {
                await api.delete(`/watchlist/${id}`);
                setIsWatching(false);
            } else {
                await api.post('/watchlist', { auctionId: parseInt(id) });
                setIsWatching(true);
            }
        } catch (err) {
            console.error('Watchlist toggle failed:', err);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    if (!auction) return <div className="text-center py-20">Auction not found</div>;

    return (
        <div className="max-w-7xl mx-auto px-4 py-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                {/* Left Column: Images & Info */}
                <div className="space-y-8">
                    <div className="rounded-3xl overflow-hidden bg-white shadow-lg aspect-w-4 aspect-h-3 border border-gray-100">
                        <img
                            src={auction.images?.[0] || 'https://via.placeholder.com/800x600?text=No+Image'}
                            alt={auction.title}
                            className="w-full h-full object-cover"
                        />
                    </div>

                    <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
                        <h2 className="text-2xl font-black mb-4">Description</h2>
                        <div className="prose prose-primary max-w-none text-gray-600">
                            {auction.description}
                        </div>
                    </div>
                </div>

                {/* Right Column: Bidding Action */}
                <div className="space-y-6">
                    <div className="bg-white rounded-3xl p-8 shadow-xl border border-primary-100 relative overflow-hidden">
                        {/* Status Badge */}
                        <div className={`absolute top-0 right-0 px-6 py-2 rounded-bl-3xl text-xs font-black uppercase tracking-widest text-white ${auction.status === 'LIVE' ? 'bg-green-600' : 'bg-blue-600'}`}>
                            {auction.status}
                        </div>

                        <h1 className="text-3xl font-black text-gray-900 mb-2 mt-2">{auction.title}</h1>
                        <p className="text-gray-500 mb-6 flex items-center">
                            <span className="bg-gray-100 px-3 py-1 rounded-full text-sm font-medium">Seller: {auction.seller?.name}</span>
                        </p>

                        <div className="grid grid-cols-2 gap-4 mb-8">
                            <div className="bg-gray-50 p-4 rounded-2xl">
                                <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">Current Price</p>
                                <p className="text-3xl font-black text-primary-600">${auction.currentPrice}</p>
                                <p className="text-xs text-gray-500 mt-1">{bids.length} bids placed</p>
                            </div>
                            <div className="bg-gray-50 p-4 rounded-2xl flex flex-col justify-center">
                                <CountdownTimer targetDate={auction.endTime} onEnd={() => setAuction(a => ({ ...a, status: 'ENDED' }))} />
                            </div>
                        </div>

                        {auction.status === 'LIVE' ? (
                            <form onSubmit={handlePlaceBid} className="space-y-4">
                                {error && <div className="p-3 rounded-xl bg-red-50 text-red-600 text-sm font-medium border border-red-100">{error}</div>}
                                {success && <div className="p-3 rounded-xl bg-green-50 text-green-600 text-sm font-medium border border-green-100">{success}</div>}

                                <div className="flex gap-2">
                                    <div className="flex-grow">
                                        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-2 mb-1 block">Your Bid Amount</label>
                                        <div className="relative">
                                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">$</span>
                                            <input
                                                type="number"
                                                step="0.01"
                                                className="input-field !pl-8 !py-4 !text-xl font-black"
                                                value={bidAmount}
                                                onChange={(e) => setBidAmount(e.target.value)}
                                                min={auction.currentPrice + parseFloat(auction.minIncrement)}
                                            />
                                        </div>
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={placingBid}
                                        className="self-end px-12 py-4 bg-primary-600 text-white rounded-2xl font-black text-lg hover:bg-primary-700 transition transform active:scale-95 shadow-lg shadow-primary-200"
                                    >
                                        {placingBid ? '...' : 'BID NOW'}
                                    </button>
                                </div>

                                <p className="text-xs text-gray-400 text-center font-medium">
                                    Min bid: ${(parseFloat(auction.currentPrice) + parseFloat(auction.minIncrement)).toFixed(2)} | Increment: ${auction.minIncrement}
                                </p>
                            </form>
                        ) : (
                            <div className="p-6 bg-red-50 rounded-2xl border border-red-100 text-center">
                                <p className="text-red-700 font-black tracking-widest uppercase">This Auction is Ended</p>
                                {auction.winnerId && <p className="text-2xl font-black mt-2 text-red-900">Sold for ${auction.currentPrice}</p>}
                            </div>
                        )}

                        {auction.buyNowPrice && auction.status === 'LIVE' && (
                            <div className="mt-8 border-t border-gray-100 pt-8">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Buy It Now</p>
                                        <p className="text-2xl font-black text-gray-900">${auction.buyNowPrice}</p>
                                    </div>
                                    <button
                                        onClick={handleBuyNow}
                                        className="px-8 py-3 bg-white border-2 border-primary-600 text-primary-600 rounded-2xl font-black hover:bg-primary-50 transition"
                                    >
                                        BUY NOW
                                    </button>
                                </div>
                            </div>
                        )}

                        <div className="mt-8 flex gap-3">
                            <button
                                onClick={toggleWatchlist}
                                className={`flex-grow flex items-center justify-center gap-2 py-3 rounded-2xl font-bold transition ${isWatching ? 'bg-primary-100 text-primary-600 border border-primary-200' : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border border-gray-200'}`}
                            >
                                <span>{isWatching ? '★' : '☆'}</span> {isWatching ? 'Saved to Watchlist' : 'Watch Auction'}
                            </button>
                            <button className="p-3 rounded-2xl bg-gray-100 text-gray-600 hover:bg-gray-200 transition">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                                </svg>
                            </button>
                        </div>
                    </div>

                    {/* Bid History */}
                    <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
                        <h2 className="text-xl font-black mb-6 flex items-center gap-3">
                            Bid History
                            <span className="bg-primary-100 text-primary-600 px-3 py-1 rounded-full text-xs font-black">{bids.length}</span>
                        </h2>
                        <div className="overflow-hidden">
                            <table className="w-full">
                                <thead className="border-b border-gray-50">
                                    <tr>
                                        <th className="text-left py-3 text-xs font-black text-gray-400 uppercase tracking-widest">Bidder</th>
                                        <th className="text-left py-3 text-xs font-black text-gray-400 uppercase tracking-widest">Amount</th>
                                        <th className="text-right py-3 text-xs font-black text-gray-400 uppercase tracking-widest">Time</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {bids.length > 0 ? bids.map((bid, index) => (
                                        <tr key={index} className={index === 0 ? 'bg-primary-50/30' : ''}>
                                            <td className="py-4 text-sm font-bold text-gray-700">
                                                {bid.bidder?.name || 'Anonymous'}
                                                {index === 0 && auction.status === 'LIVE' && <span className="ml-2 text-[10px] bg-green-100 text-green-600 px-1.5 py-0.5 rounded font-black uppercase">High</span>}
                                            </td>
                                            <td className="py-4 text-sm font-black text-gray-900">${bid.amount}</td>
                                            <td className="py-4 text-xs text-gray-400 text-right">{new Date(bid.createdAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</td>
                                        </tr>
                                    )) : (
                                        <tr>
                                            <td colSpan="3" className="py-8 text-center text-gray-400 font-medium">No bids yet. Start the auction!</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
