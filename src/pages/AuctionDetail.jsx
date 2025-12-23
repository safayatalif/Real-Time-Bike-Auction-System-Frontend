import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import api from '../services/api';
import socketService from '../services/socket';
import CountdownTimer from '../components/CountdownTimer';
import {
    fetchAuctionById,
    fetchAuctionBids,
    placeBid,
    updateAuctionFromSocket,
    addBidFromSocket,
    auctionEndedFromSocket,
    clearBidStatus,
    setOptimisticBid
} from '../features/auctionSlice';

export default function AuctionDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { user } = useSelector((state) => state.auth);
    const {
        currentAuction: auction,
        bids,
        loading,
        bidLoading,
        bidError,
        bidSuccess
    } = useSelector((state) => state.auction);

    const [bidAmount, setBidAmount] = useState('');
    const [isWatching, setIsWatching] = useState(false);

    // Determine if the current user is the leading bidder
    const isLeading = useMemo(() => {
        if (!user || bids.length === 0) return false;
        return bids[0].bidderId === user.id;
    }, [user, bids]);

    useEffect(() => {
        dispatch(fetchAuctionById(id));
        dispatch(fetchAuctionBids(id));
        checkWatchlist();
        setupSocket();

        return () => {
            socketService.leaveAuction(id);
            dispatch(clearBidStatus());
        };
    }, [id, dispatch]);

    useEffect(() => {
        if (auction) {
            // Suggest min bid if amount is empty or was just an old price
            const minIncrement = parseFloat(auction.minIncrement || 0);
            const currentPrice = parseFloat(auction.currentPrice || 0);
            const startingPrice = parseFloat(auction.startingPrice || 0);

            const suggestedBid = bids.length === 0 ? startingPrice : currentPrice + minIncrement;
            setBidAmount(suggestedBid.toFixed(2));
        }
    }, [auction?.id, bids.length === 0]); // Only when auction changes or first bid arrives

    const checkWatchlist = async () => {
        try {
            const response = await api.get(`/watchlist/check/${id}`);
            setIsWatching(response.data.isWatching);
        } catch (err) {
            console.error('Watchlist check failed');
        }
    };

    const setupSocket = () => {
        socketService.connect();
        socketService.joinAuction(id);

        const socket = socketService.socket;
        if (socket) {
            socket.on('bidPlaced', (data) => {
                if (data.auctionId === parseInt(id)) {
                    dispatch(updateAuctionFromSocket(data));
                    // We could also add the bid here, but usually a separate fetch or specific bid object from socket is better
                    // For now let's just re-fetch bids to be accurate
                    dispatch(fetchAuctionBids(id));
                }
            });

            socket.on('auctionExtended', (data) => {
                if (data.auctionId === parseInt(id)) {
                    dispatch(updateAuctionFromSocket({ ...data, newPrice: auction?.currentPrice, bidCount: auction?._count?.bids }));
                }
            });

            socket.on('auctionEnded', (data) => {
                if (data.auctionId === parseInt(id)) {
                    dispatch(auctionEndedFromSocket(data));
                }
            });

            socket.on('outbid', (data) => {
                if (data.auctionId === parseInt(id)) {
                    // Show a browser notification or a custom toast if wanted
                    // In this UI, the "Outbid" badge will appear automatically via Redux
                }
            });
        }
    };

    const handlePlaceBid = async (e) => {
        e.preventDefault();
        if (!user) return navigate('/login');

        const amount = parseFloat(bidAmount);

        // Simple frontend validation
        const minRequired = bids.length === 0
            ? parseFloat(auction.startingPrice)
            : parseFloat(auction.currentPrice) + parseFloat(auction.minIncrement);

        if (amount < minRequired) {
            // Handled by backend too, but nice to catch
            return;
        }

        // DISPATCH PLACE BID
        dispatch(setOptimisticBid({ amount, bidder: user, auctionId: parseInt(id) }));

        try {
            await dispatch(placeBid({ auctionId: parseInt(id), amount, bidder: user })).unwrap();
            // Success handled by Redux extraReducers and sockets
        } catch (err) {
            // Revert or refresh on error
            dispatch(fetchAuctionBids(id));
            dispatch(fetchAuctionById(id));
        }
    };

    const handleBuyNow = async () => {
        if (!user) return navigate('/login');
        if (!window.confirm(`Confirm purchase of "${auction.title}" for $${auction.buyNowPrice}?`)) return;

        try {
            await api.post(`/auctions/${id}/buy-now`);
            // The socket 'auctionEnded' will handle the UI state transition
        } catch (err) {
            alert(err.response?.data?.error || 'Failed to complete purchase');
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

    if (loading && !auction) {
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

                        <div className="flex items-center gap-2 mb-6">
                            <span className="bg-gray-100 px-3 py-1 rounded-full text-sm font-medium">Seller: {auction.seller?.name}</span>
                            {user && bids.length > 0 && (
                                isLeading ? (
                                    <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider animate-bounce">Leading</span>
                                ) : (
                                    bids.some(b => b.bidderId === user.id) && (
                                        <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider">Outbid</span>
                                    )
                                )
                            )}
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-8">
                            <div className="bg-gray-50 p-4 rounded-2xl">
                                <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">Current Price</p>
                                <div className="flex items-baseline gap-1">
                                    <p className="text-3xl font-black text-primary-600">${auction.currentPrice}</p>
                                </div>
                                <p className="text-xs text-gray-500 mt-1">{auction._count?.bids || 0} bids placed</p>
                            </div>
                            <div className="bg-gray-50 p-4 rounded-2xl flex flex-col justify-center">
                                <CountdownTimer targetDate={auction.endTime} onEnd={() => fetchData()} />
                            </div>
                        </div>

                        {auction.status === 'LIVE' ? (
                            <form onSubmit={handlePlaceBid} className="space-y-4">
                                {bidError && <div className="p-3 rounded-xl bg-red-50 text-red-600 text-sm font-medium border border-red-100">{bidError}</div>}
                                {bidSuccess && <div className="p-3 rounded-xl bg-green-50 text-green-600 text-sm font-medium border border-green-100">{bidSuccess}</div>}

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
                                                disabled={isLeading || bidLoading}
                                            />
                                        </div>
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={bidLoading || isLeading}
                                        className="self-end px-12 py-4 bg-primary-600 text-white rounded-2xl font-black text-lg hover:bg-primary-700 transition transform active:scale-95 shadow-lg shadow-primary-200 disabled:bg-gray-400 disabled:shadow-none disabled:active:scale-100"
                                    >
                                        {bidLoading ? 'PLACING...' : isLeading ? 'LEADING' : 'BID NOW'}
                                    </button>
                                </div>

                                <p className="text-xs text-gray-400 text-center font-medium">
                                    Min bid: ${(parseFloat(auction.currentPrice) + parseFloat(auction.minIncrement)).toFixed(2)} | Increment: ${auction.minIncrement}
                                </p>
                            </form>
                        ) : (
                            <div className="p-6 bg-red-50 rounded-2xl border border-red-100 text-center">
                                <p className="text-red-700 font-black tracking-widest uppercase">This Auction is Ended</p>
                                {auction.winnerId ? (
                                    <p className="text-2xl font-black mt-2 text-red-900">Sold for ${auction.currentPrice}</p>
                                ) : (
                                    <p className="text-xl font-bold mt-2 text-red-900">Ended without Sale</p>
                                )}
                            </div>
                        )}

                        {auction.buyNowPrice && auction.status === 'LIVE' && !isLeading && (
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
                                        <tr key={bid.id || index} className={index === 0 ? 'bg-primary-50/30' : ''}>
                                            <td className="py-4 text-sm font-bold text-gray-700">
                                                {bid.bidder?.name || 'Anonymous'}
                                                {index === 0 && auction.status === 'LIVE' && <span className="ml-2 text-[10px] bg-green-100 text-green-600 px-1.5 py-0.5 rounded font-black uppercase">High</span>}
                                            </td>
                                            <td className="py-4 text-sm font-black text-gray-900">
                                                ${typeof bid.amount === 'number' ? bid.amount.toFixed(2) : bid.amount}
                                            </td>
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
