import { useState, useEffect } from 'react';
import api from '../services/api';
import AuctionCard from '../components/AuctionCard';

export default function Home() {
    const [auctions, setAuctions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [status, setStatus] = useState(''); // Empty means all relevant (LIVE/SCHEDULED)

    useEffect(() => {
        fetchAuctions();
    }, [status]); // Reload when status filter changes

    const fetchAuctions = async () => {
        try {
            setLoading(true);
            const params = {};
            if (status) params.status = status;
            if (search) params.search = search;

            const response = await api.get('/auctions', { params });
            setAuctions(response.data.data);
        } catch (error) {
            console.error('Failed to fetch auctions:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e) => {
        e.preventDefault();
        fetchAuctions();
    };

    return (
        <div className="space-y-8">
            {/* Hero Section */}
            <div className="relative overflow-hidden rounded-3xl bg-primary-900 text-white p-8 md:p-16 shadow-2xl">
                <div className="relative z-10 max-w-2xl">
                    <h1 className="text-4xl md:text-6xl font-black mb-6 leading-tight">
                        Find Your Next <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-400 to-blue-200">Dream Ride</span>
                    </h1>
                    <p className="text-lg text-primary-100 mb-8 max-w-lg">
                        Join the elite community of bike enthusiasts. Bid, win, and ride with BikeBid's premium real-time auction platform.
                    </p>
                    <div className="flex flex-wrap gap-4">
                        <button className="px-8 py-3 bg-white text-primary-900 font-bold rounded-xl hover:bg-primary-50 transition shadow-lg">
                            Explore Auctions
                        </button>
                        <button className="px-8 py-3 bg-primary-800 text-white font-bold rounded-xl hover:bg-primary-700 border border-primary-700 transition">
                            How it Works
                        </button>
                    </div>
                </div>
                {/* Abstract background shapes */}
                <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 bg-primary-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20"></div>
                <div className="absolute bottom-0 right-0 -mb-20 -mr-20 w-96 h-96 bg-primary-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20"></div>
            </div>

            {/* Filter & Search Bar */}
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4 items-center justify-between">
                <form onSubmit={handleSearch} className="relative w-full md:max-w-md">
                    <input
                        type="text"
                        placeholder="Search bikes, brands, models..."
                        className="w-full pl-10 pr-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-primary-500 transition-all font-medium"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                    <svg className="w-5 h-5 absolute left-3 top-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                </form>

                <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
                    <button
                        onClick={() => setStatus('')}
                        className={`px-6 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-all ${!status ? 'bg-primary-600 text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                    >
                        All Auctions
                    </button>
                    <button
                        onClick={() => setStatus('LIVE')}
                        className={`px-6 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-all ${status === 'LIVE' ? 'bg-green-600 text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                    >
                        Live Now
                    </button>
                    <button
                        onClick={() => setStatus('SCHEDULED')}
                        className={`px-6 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-all ${status === 'SCHEDULED' ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                    >
                        Upcoming
                    </button>
                </div>
            </div>

            {/* Auction Grid */}
            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                        <div key={i} className="bg-gray-100 h-96 rounded-2xl animate-pulse"></div>
                    ))}
                </div>
            ) : auctions.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {auctions.map((auction) => (
                        <AuctionCard key={auction.id} auction={auction} />
                    ))}
                </div>
            ) : (
                <div className="text-center py-20 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
                    <div className="text-6xl mb-4">🔍</div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">No auctions found</h3>
                    <p className="text-gray-500">Try adjusting your filters or search terms.</p>
                </div>
            )}
        </div>
    );
}
