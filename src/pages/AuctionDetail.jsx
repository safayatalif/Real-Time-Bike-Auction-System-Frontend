import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import api from '../services/api';
import socketService from '../services/socket';
import CountdownTimer from '../components/CountdownTimer';
import toast from 'react-hot-toast';
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
        if (bidSuccess) {
            toast.success('Bid placed successfully!');
            setBidAmount('');
            dispatch(clearBidStatus());
        }
        if (bidError) {
            toast.error(bidError);
            dispatch(clearBidStatus());
        }
    }, [bidSuccess, bidError, dispatch]);

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
            toast.success('Purchase successful! You now own this bike.');
            // The socket 'auctionEnded' will handle the UI state transition
        } catch (err) {
            toast.error(err.response?.data?.error || 'Failed to complete purchase');
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
                <div className="space-y-8">
                    <div className="bg-white rounded-[3rem] p-10 shadow-[0_20px_50px_rgb(0,0,0,0.05)] border border-slate-100 relative overflow-hidden">
                        {/* Premium Status Badge */}
                        <div className={`absolute top-0 right-0 px-8 py-3 rounded-bl-[2rem] text-[10px] font-black uppercase tracking-[0.3em] text-white shadow-lg ${auction.status === 'LIVE' ? 'bg-red-500 shadow-red-200 animate-pulse' : 'bg-blue-600 shadow-blue-200'}`}>
                            {auction.status === 'LIVE' ? 'Live Now' : auction.status}
                        </div>

                        <h1 className="text-4xl font-black text-slate-900 mb-4 mt-4 tracking-tighter leading-tight">{auction.title}</h1>

                        <div className="flex flex-wrap items-center gap-3 mb-10">
                            <span className="bg-slate-50 text-slate-500 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest border border-slate-100">
                                Seller: {auction.seller?.name}
                            </span>
                            {user && bids.length > 0 && (
                                isLeading ? (
                                    <span className="bg-green-500 text-white px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-lg shadow-green-200 flex items-center gap-2">
                                        <span className="h-1.5 w-1.5 bg-white rounded-full animate-ping"></span>
                                        Leading
                                    </span>
                                ) : (
                                    bids.some(b => b.bidderId === user.id) && (
                                        <span className="bg-red-50 text-red-600 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] border border-red-100">Outbid</span>
                                    )
                                )
                            )}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-10">
                            <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100">
                                <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] mb-2">Current Prime Bid</p>
                                <div className="flex items-baseline gap-1">
                                    <p className="text-4xl font-black text-slate-900 tracking-tighter">${auction.currentPrice}</p>
                                </div>
                                <p className="text-xs text-slate-500 mt-2 font-bold">{auction._count?.bids || 0} secure bids</p>
                            </div>
                            <div className="bg-slate-900 p-6 rounded-[2rem] shadow-xl shadow-slate-200 flex flex-col justify-center">
                                <CountdownTimer targetDate={auction.endTime} onEnd={() => {
                                    dispatch(fetchAuctionById(id));
                                    dispatch(fetchAuctionBids(id));
                                }} />
                            </div>
                        </div>
                        {/* Bid Form Section */}
                        {auction.status === 'LIVE' ? (
                            <>
                                {isLeading ? (
                                    <div className="p-8 bg-green-50 rounded-[2rem] border border-green-100 text-center mt-10">
                                        <div className="w-16 h-16 bg-green-500 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-2xl shadow-lg shadow-green-200">
                                            ✓
                                        </div>
                                        <h3 className="text-xl font-black text-green-900">You are the highest bidder!</h3>
                                        <p className="text-green-700 font-medium mt-1">Excellent choice! Keep an eye on it.</p>
                                    </div>
                                ) : (
                                    <form onSubmit={handlePlaceBid} className="space-y-6 mt-10">
                                        <div className="flex flex-col sm:flex-row gap-4">
                                            <div className="flex-grow">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 mb-2 block">Quick Bid Entry</label>
                                                <div className="relative group">
                                                    <span className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 font-black text-xl transition-colors group-focus-within:text-primary-500">$</span>
                                                    <input
                                                        type="number"
                                                        step="0.01"
                                                        className="input-field !pl-12 !py-5 !text-2xl font-black !bg-slate-50 group-focus-within:!bg-white tracking-tighter"
                                                        value={bidAmount}
                                                        onChange={(e) => setBidAmount(e.target.value)}
                                                        disabled={bidLoading}
                                                    />
                                                </div>
                                            </div>
                                            <button
                                                type="submit"
                                                disabled={bidLoading}
                                                className="sm:self-end px-12 py-5 bg-slate-900 text-white rounded-[1.5rem] font-black text-lg hover:bg-primary-600 transition-all transform active:scale-95 shadow-2xl shadow-slate-200 disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none"
                                            >
                                                {bidLoading ? 'Processing...' : 'Place Bid'}
                                            </button>
                                        </div>

                                        <div className="px-6 py-3 bg-slate-50 rounded-2xl border border-slate-100 flex justify-between items-center">
                                            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Minimum Next Bid</p>
                                            <p className="text-sm font-black text-slate-700">
                                                ${(parseFloat(auction.currentPrice) + parseFloat(auction.minIncrement)).toFixed(2)}
                                            </p>
                                        </div>
                                    </form>
                                )}

                                {auction.buyNowPrice && !isLeading && (
                                    <div className="mt-10 pt-10 border-t border-slate-100">
                                        <div className="flex items-center justify-between bg-primary-50 p-6 rounded-[2rem] border border-primary-100">
                                            <div>
                                                <p className="text-[10px] text-primary-600 font-black uppercase tracking-[0.2em] mb-1">Direct Purchase</p>
                                                <p className="text-3xl font-black text-slate-900 tracking-tighter">${auction.buyNowPrice}</p>
                                            </div>
                                            <button
                                                onClick={handleBuyNow}
                                                className="px-10 py-4 bg-white text-primary-600 rounded-2xl font-black shadow-lg shadow-primary-200/50 hover:bg-primary-600 hover:text-white transition-all transform active:scale-95"
                                            >
                                                BUY IT NOW
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </>
                        ) : auction.status === 'SCHEDULED' ? (
                            <div className="p-10 bg-blue-50 rounded-[2.5rem] border border-blue-100 text-center mt-10">
                                <div className="w-16 h-16 bg-blue-500 text-white rounded-full flex items-center justify-center mx-auto mb-6 text-2xl shadow-lg shadow-blue-200">
                                    📅
                                </div>
                                <h3 className="text-xl font-black text-blue-900 tracking-tighter uppercase">Auction Starting Soon</h3>
                                <p className="text-blue-700 font-medium mt-2">
                                    Available for bidding on: <br />
                                    <span className="text-lg font-black">{new Date(auction.startTime).toLocaleString()}</span>
                                </p>
                                <p className="text-sm text-blue-600 mt-4 italic">Save to your watchlist to get notified!</p>
                            </div>
                        ) : (
                            <div className="p-10 bg-slate-50 rounded-[2.5rem] border border-slate-100 text-center mt-10">
                                <div className="w-16 h-16 bg-slate-200 rounded-full flex items-center justify-center mx-auto mb-6 text-2xl">
                                    {auction.winnerId ? '🏆' : '⌛'}
                                </div>
                                <p className="text-slate-400 font-black tracking-[0.2em] uppercase text-[10px] mb-2">Auction Concluded</p>
                                {auction.winnerId ? (
                                    <>
                                        <p className="text-3xl font-black mt-2 text-slate-900 tracking-tighter">Sold for ${auction.currentPrice}</p>
                                        {user?.id === auction.winnerId ? (
                                            <div className="mt-6 p-4 bg-green-500 text-white rounded-2xl font-black shadow-lg shadow-green-200 animate-bounce">
                                                🎉 CONGRATULATIONS! YOU WON
                                            </div>
                                        ) : (
                                            <p className="text-slate-500 font-medium mt-2">New owner found</p>
                                        )}
                                    </>
                                ) : (
                                    <p className="text-xl font-black mt-2 text-slate-900">Ended without Sale</p>
                                )}
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
                                            <td className="py-4 text-xs text-gray-400 text-right">{new Date(bid.timestamp).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</td>
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
