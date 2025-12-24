import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import AuctionCard from '../components/AuctionCard';

export default function MyBids() {
    const [auctions, setAuctions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchMyBids();
    }, []);

    const fetchMyBids = async () => {
        try {
            setLoading(true);
            const response = await api.get('/auctions/my-bids');
            setAuctions(response.data);
        } catch (err) {
            setError('Failed to fetch your bids');
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
                <h1 className="text-4xl font-black text-slate-900 tracking-tighter">Your Active Bids</h1>
                <p className="text-slate-500 font-medium">Tracking all the auctions you've participated in</p>
            </div>

            {error ? (
                <div className="p-12 bg-white rounded-[2rem] text-center border-2 border-dashed border-red-100">
                    <p className="text-red-500 font-black tracking-tight">{error}</p>
                </div>
            ) : auctions.length === 0 ? (
                <div className="p-24 bg-white rounded-[3rem] text-center shadow-sm border border-slate-100">
                    <div className="text-7xl mb-8 grayscale opacity-20">💰</div>
                    <h2 className="text-3xl font-black text-slate-900 mb-4 tracking-tighter">No active bids</h2>
                    <p className="text-slate-400 mb-10 max-w-sm mx-auto font-medium">You haven't placed any bids yet. Start exploring live auctions and find your dream bike!</p>
                    <Link
                        to="/"
                        className="btn-primary inline-block"
                    >
                        BROWSE AUCTIONS
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {auctions.map((auction) => (
                        <AuctionCard key={auction.id} auction={auction} />
                    ))}
                </div>
            )}
        </div>
    );
}
