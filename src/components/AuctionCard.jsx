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
        <div className="card group hover:shadow-xl transition-shadow duration-300 flex flex-col h-full border border-gray-100 overflow-hidden !p-0">
            <Link to={`/auctions/${id}`} className="relative block h-48 overflow-hidden">
                <img
                    src={mainImage}
                    alt={title}
                    className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500"
                />
                {status === 'SCHEDULED' && (
                    <div className="absolute top-2 right-2 bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded uppercase">
                        Upcoming
                    </div>
                )}
                {status === 'LIVE' && (
                    <div className="absolute top-2 right-2 bg-green-600 text-white text-xs font-bold px-2 py-1 rounded uppercase animate-pulse">
                        Live
                    </div>
                )}
            </Link>

            <div className="p-4 flex flex-col flex-grow">
                <Link to={`/auctions/${id}`} className="hover:text-primary-600 transition-colors">
                    <h3 className="text-lg font-bold text-gray-900 line-clamp-1 mb-1">{title}</h3>
                </Link>

                <div className="flex justify-between items-end mb-4">
                    <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Current Price</p>
                        <p className="text-xl font-black text-gray-900">${currentPrice}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-xs text-gray-500 uppercase font-semibold">{_count?.bids || 0} Bids</p>
                    </div>
                </div>

                <div className="mt-auto pt-4 border-t border-gray-50">
                    <CountdownTimer targetDate={endTime} />
                </div>

                <Link
                    to={`/auctions/${id}`}
                    className="mt-4 w-full bg-gray-900 text-white text-center py-2 rounded-lg font-bold hover:bg-primary-600 transition-colors"
                >
                    View Details
                </Link>
            </div>
        </div>
    );
}
