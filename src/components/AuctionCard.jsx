import { Link } from 'react-router-dom';
import CountdownTimer from './CountdownTimer';

export default function AuctionCard({ auction }) {
    const {
        id,
        title,
        images,
        currentPrice,
        endTime,
        status,
        _count
    } = auction;

    const mainImage = images && images.length > 0 ? images[0] : 'https://via.placeholder.com/400x300?text=No+Image';

    return (
        <div className="card group">
            <Link to={`/auctions/${id}`} className="relative block h-56 -mx-6 -mt-6 mb-4 overflow-hidden rounded-t-[2rem]">
                <img
                    src={mainImage}
                    alt={title}
                    className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

                {status === 'SCHEDULED' && (
                    <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-md text-primary-600 badge shadow-lg !text-[11px] !py-2 !px-4">
                        Upcoming
                    </div>
                )}
                {status === 'LIVE' && (
                    <div className="absolute top-4 right-4 bg-red-500 text-white badge shadow-lg shadow-red-200 animate-pulse !text-[11px] !py-2 !px-4">
                        Live Now
                    </div>
                )}
            </Link>

            <div className="flex flex-col flex-grow">
                <Link to={`/auctions/${id}`}>
                    <h3 className="text-xl font-black text-slate-900 group-hover:text-primary-600 transition-colors line-clamp-1 mb-2 tracking-tight">{title}</h3>
                </Link>

                <div className="flex justify-between items-center mb-6">
                    <div>
                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] mb-1">Current Price</p>
                        <p className="text-2xl font-black text-slate-900 tracking-tighter">${currentPrice}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] mb-1">Total Bids</p>
                        <div className="bg-slate-50 px-3 py-1 rounded-full text-sm font-black text-slate-700">
                            {_count?.bids || 0}
                        </div>
                    </div>
                </div>

                <div className="mt-auto space-y-4">
                    <div className="pt-4 border-t border-slate-50">
                        <CountdownTimer targetDate={endTime} />
                    </div>

                    <Link
                        to={`/auctions/${id}`}
                        className="btn-primary block text-center !rounded-2xl !py-3 bg-slate-900 hover:bg-primary-600 shadow-none hover:shadow-primary-200"
                    >
                        Place Bid
                    </Link>
                </div>
            </div>
        </div>
    );
}
