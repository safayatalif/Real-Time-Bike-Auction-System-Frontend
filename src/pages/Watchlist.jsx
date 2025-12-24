import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import AuctionCard from '../components/AuctionCard';

export default function Watchlist() {
    const [watchlistItems, setWatchlistItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchWatchlist();
    }, []);

    const fetchWatchlist = async () => {
        try {
            setLoading(true);
            const response = await api.get('/watchlist');
            // Paginated response: { data: [...], meta: {...} }
            setWatchlistItems(response.data.data || []);
        } catch (err) {
            setError('Failed to fetch your watchlist');
            console.error(err);
        } finally {
            setLoading(false);
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
            <div className="mb-12">
                <h1 className="text-4xl font-black text-slate-900 tracking-tighter">Your Watchlist</h1>
                <p className="text-slate-500 font-medium">Keeping track of selection you're interested in</p>
            </div>

            {error ? (
                <div className="p-12 bg-white rounded-[2rem] text-center border-2 border-dashed border-red-100">
                    <p className="text-red-500 font-black tracking-tight">{error}</p>
                </div>
            ) : watchlistItems.length === 0 ? (
                <div className="p-24 bg-white rounded-[3rem] text-center shadow-sm border border-slate-100">
                    <div className="text-7xl mb-8 grayscale opacity-20">⭐</div>
                    <h2 className="text-3xl font-black text-slate-900 mb-4 tracking-tighter">Watchlist is empty</h2>
                    <p className="text-slate-400 mb-10 max-w-sm mx-auto font-medium">Save auctions you're interested in to stay updated on their progress!</p>
                    <Link
                        to="/"
                        className="btn-primary inline-block"
                    >
                        START DISCOVERING
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {watchlistItems.map((item) => (
                        <AuctionCard key={item.id} auction={item.auction} />
                    ))}
                </div>
            )}
        </div>
    );
}
