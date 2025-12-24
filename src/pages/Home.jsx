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
        <div className="space-y-12">
            {/* Hero Section */}
            <div className="relative overflow-hidden rounded-[3rem] bg-slate-900 text-white p-10 md:p-20 shadow-2xl">
                <div className="relative z-10 max-w-2xl">
                    <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-2 rounded-full mb-8 border border-white/10">
                        <span className="flex h-2 w-2 rounded-full bg-primary-400 animate-pulse"></span>
                        <span className="text-xs font-black uppercase tracking-[0.2em] text-white/80">Premium Bike Auctions</span>
                    </div>
                    <h1 className="text-5xl md:text-7xl font-black mb-8 leading-[1.1] tracking-tighter">
                        Find Your Next <br />
                        <span className="gradient-text">Dream Ride.</span>
                    </h1>
                    <p className="text-xl text-slate-400 mb-10 max-w-lg font-medium leading-relaxed">
                        Join the elite community of bike enthusiasts. Bid, win, and ride with BikeBid's premium real-time auction platform.
                    </p>
                    <div className="flex flex-wrap gap-6">
                        <button className="btn-primary !px-10 !py-4 shadow-primary-500/20">
                            Start Bidding
                        </button>
                        <button className="px-10 py-4 bg-white/5 backdrop-blur-md text-white font-black rounded-2xl border border-white/10 hover:bg-white/10 transition shadow-xl">
                            How it Works
                        </button>
                    </div>
                </div>

                {/* Background effects */}
                <div className="absolute top-0 right-0 -mr-20 -mt-20 w-[500px] h-[500px] bg-primary-600/30 rounded-full blur-[120px]"></div>
                <div className="absolute bottom-0 left-1/2 -ml-20 -mb-20 w-[300px] h-[300px] bg-blue-600/20 rounded-full blur-[100px]"></div>
            </div>

            {/* Filter & Search Bar */}
            <div className="glass-card p-4 rounded-[2.5rem] flex flex-col md:flex-row gap-6 items-center justify-between sticky top-24 z-40 mx-2 border bg-slate-100">
                <form onSubmit={handleSearch} className="relative w-full md:max-w-md group">
                    <input
                        type="text"
                        placeholder="Search premium bikes..."
                        className="input-field !pl-12 !bg-slate-50 border-none group-focus-within:!bg-white"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                    <svg className="w-5 h-5 absolute left-4 top-3.5 text-slate-400 group-focus-within:text-primary-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                </form>

                <div className="flex gap-3 w-full md:w-auto overflow-x-auto no-scrollbar">
                    {[
                        { label: 'All Listings', value: '' },
                        { label: 'Live Now', value: 'LIVE' },
                        { label: 'Upcoming', value: 'SCHEDULED' }
                    ].map((btn) => (
                        <button
                            key={btn.value}
                            onClick={() => setStatus(btn.value)}
                            className={`px-8 py-3 rounded-2xl text-xs font-black uppercase tracking-widest whitespace-nowrap transition-all duration-300 ${status === btn.value ? 'bg-slate-900 text-white shadow-xl translate-y-[-2px]' : 'bg-slate-100/50 text-slate-500 hover:bg-slate-100 hover:text-slate-700'}`}
                        >
                            {btn.label}
                        </button>
                    ))}
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
