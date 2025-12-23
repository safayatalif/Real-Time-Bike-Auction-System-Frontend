export default function Home() {
    return (
        <div className="space-y-8">
            <div className="text-center">
                <h1 className="text-4xl font-bold text-gray-900 mb-4">
                    Welcome to BikeBid
                </h1>
                <p className="text-lg text-gray-600">
                    Discover amazing bike auctions and place your bids in real-time
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="card text-center">
                    <div className="text-4xl mb-4">🚴</div>
                    <h3 className="text-xl font-semibold mb-2">Browse Auctions</h3>
                    <p className="text-gray-600">
                        Explore a wide variety of bikes from sellers around the world
                    </p>
                </div>

                <div className="card text-center">
                    <div className="text-4xl mb-4">⚡</div>
                    <h3 className="text-xl font-semibold mb-2">Real-Time Bidding</h3>
                    <p className="text-gray-600">
                        Place bids and see updates instantly with our live auction system
                    </p>
                </div>

                <div className="card text-center">
                    <div className="text-4xl mb-4">🏆</div>
                    <h3 className="text-xl font-semibold mb-2">Win Amazing Bikes</h3>
                    <p className="text-gray-600">
                        Compete with other bidders and win your dream bike at great prices
                    </p>
                </div>
            </div>

            <div className="card">
                <h2 className="text-2xl font-bold mb-4">Live Auctions</h2>
                <p className="text-gray-600">
                    Auction listings will appear here. Connect to the backend to see live auctions.
                </p>
            </div>
        </div>
    );
}
