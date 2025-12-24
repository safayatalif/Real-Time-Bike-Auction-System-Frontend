import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';

export default function CreateAuction() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [isEditing, setIsEditing] = useState(false);

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        images: '',
        startTime: '',
        endTime: '',
        startingPrice: '',
        minIncrement: '10',
        reservePrice: '',
        buyNowPrice: ''
    });

    useEffect(() => {
        if (id) {
            fetchAuctionData();
        } else {
            // Reset form for new auction
            setIsEditing(false);
            setFormData({
                title: '',
                description: '',
                images: '',
                startTime: '',
                endTime: '',
                startingPrice: '',
                minIncrement: '10',
                reservePrice: '',
                buyNowPrice: ''
            });
        }
    }, [id]);

    const fetchAuctionData = async () => {
        try {
            setLoading(true);
            const response = await api.get(`/auctions/${id}`);
            const auction = response.data;

            // Format dates for datetime-local input (YYYY-MM-DDThh:mm)
            const fmtDate = (d) => d ? new Date(d).toISOString().slice(0, 16) : '';

            setFormData({
                title: auction.title || '',
                description: auction.description || '',
                images: auction.images?.join(', ') || '',
                startTime: fmtDate(auction.startTime),
                endTime: fmtDate(auction.endTime),
                startingPrice: auction.startingPrice || '',
                minIncrement: auction.minIncrement || '10',
                reservePrice: auction.reservePrice || '',
                buyNowPrice: auction.buyNowPrice || ''
            });
            setIsEditing(true);
        } catch (err) {
            toast.error('Failed to load auction data');
            navigate('/my-auctions');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e, status = 'PUBLISHED') => {
        if (e) e.preventDefault();
        setLoading(true);

        // Basic validation for published auctions
        if (status !== 'DRAFT' && new Date(formData.startTime) >= new Date(formData.endTime)) {
            toast.error('End time must be after start time');
            setLoading(false);
            return;
        }

        if (status !== 'DRAFT' && (!formData.startingPrice || !formData.startTime || !formData.endTime)) {
            toast.error('Please fill in all required fields to publish');
            setLoading(false);
            return;
        }

        try {
            // Process images (simple comma separated for now)
            const imagesArray = formData.images ? formData.images.split(',').map(s => s.trim()) : [];

            const payload = {
                ...formData,
                images: imagesArray,
                startingPrice: parseFloat(formData.startingPrice) || 0,
                minIncrement: parseFloat(formData.minIncrement) || 10,
                reservePrice: (formData.reservePrice && !isNaN(parseFloat(formData.reservePrice))) ? parseFloat(formData.reservePrice) : null,
                buyNowPrice: (formData.buyNowPrice && !isNaN(parseFloat(formData.buyNowPrice))) ? parseFloat(formData.buyNowPrice) : null,
                startTime: formData.startTime ? new Date(formData.startTime).toISOString() : new Date().toISOString(),
                endTime: formData.endTime ? new Date(formData.endTime).toISOString() : new Date(Date.now() + 86400000).toISOString(),
                status: status === 'DRAFT' ? 'DRAFT' : 'SCHEDULED'
            };

            if (isEditing) {
                await api.patch(`/auctions/${id}`, payload);
                toast.success(status === 'DRAFT' ? 'Draft updated!' : 'Auction published!');
            } else {
                await api.post('/auctions', payload);
                toast.success(status === 'DRAFT' ? 'Draft saved!' : 'Auction published!');
            }
            navigate('/my-auctions');
        } catch (err) {
            toast.error(err.response?.data?.error || 'Failed to process auction');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto py-8 px-4">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-black text-gray-900">{isEditing ? 'Edit Auction' : 'Create New Auction'}</h1>
                    <p className="text-gray-500 font-medium">{isEditing ? 'Refine your listing details' : 'List your bike and start receiving bids'}</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">

                {/* Basic Details */}
                <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 space-y-6">
                    <h2 className="text-xl font-black text-gray-900 border-b border-gray-50 pb-4">Bike Details</h2>

                    <div className="grid grid-cols-1 gap-6">
                        <div>
                            <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1 mb-2 block">Auction Title</label>
                            <input
                                name="title"
                                type="text"
                                required
                                placeholder="e.g. 2023 Specialized Tarmac SL7 - Mint Condition"
                                className="input-field"
                                value={formData.title}
                                onChange={handleChange}
                            />
                        </div>

                        <div>
                            <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1 mb-2 block">Description</label>
                            <textarea
                                name="description"
                                required
                                rows="4"
                                placeholder="Describe your bike's components, condition, history..."
                                className="input-field"
                                value={formData.description}
                                onChange={handleChange}
                            ></textarea>
                        </div>

                        <div>
                            <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1 mb-2 block">Images (URLs, comma separated)</label>
                            <input
                                name="images"
                                type="text"
                                placeholder="https://example.com/image1.jpg, https://example.com/image2.jpg"
                                className="input-field"
                                value={formData.images}
                                onChange={handleChange}
                            />
                            <p className="mt-2 text-xs text-gray-400 font-medium italic">Tip: Use high-quality photos to attract more bidders</p>
                        </div>
                    </div>
                </div>

                {/* Pricing & Timing */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 space-y-6">
                        <h2 className="text-xl font-black text-gray-900 border-b border-gray-50 pb-4">Pricing</h2>

                        <div className="space-y-4">
                            <div>
                                <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1 mb-2 block">Starting Price ($)</label>
                                <input
                                    name="startingPrice"
                                    type="number"
                                    step="0.01"
                                    required
                                    className="input-field"
                                    value={formData.startingPrice}
                                    onChange={handleChange}
                                />
                            </div>

                            <div>
                                <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1 mb-2 block">Minimum Increment ($)</label>
                                <input
                                    name="minIncrement"
                                    type="number"
                                    step="0.01"
                                    required
                                    className="input-field"
                                    value={formData.minIncrement}
                                    onChange={handleChange}
                                />
                            </div>

                            <div>
                                <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1 mb-2 block">Reserve Price (Optional, Hidden)</label>
                                <input
                                    name="reservePrice"
                                    type="number"
                                    step="0.01"
                                    className="input-field"
                                    value={formData.reservePrice}
                                    onChange={handleChange}
                                />
                            </div>

                            <div>
                                <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1 mb-2 block">Buy Now Price (Optional)</label>
                                <input
                                    name="buyNowPrice"
                                    type="number"
                                    step="0.01"
                                    className="input-field"
                                    value={formData.buyNowPrice}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 space-y-6">
                        <h2 className="text-xl font-black text-gray-900 border-b border-gray-50 pb-4">Schedule</h2>

                        <div className="space-y-4">
                            <div>
                                <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1 mb-2 block">Start Date/Time</label>
                                <input
                                    name="startTime"
                                    type="datetime-local"
                                    required
                                    className="input-field"
                                    value={formData.startTime}
                                    onChange={handleChange}
                                />
                            </div>

                            <div>
                                <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1 mb-2 block">End Date/Time</label>
                                <input
                                    name="endTime"
                                    type="datetime-local"
                                    required
                                    className="input-field"
                                    value={formData.endTime}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>

                        <div className="p-4 bg-primary-50 rounded-2xl border border-primary-100">
                            <p className="text-sm text-primary-900 font-bold leading-relaxed">
                                📢 Pro Tip: Auctions ending on weekends or during evening hours usually perform better!
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end gap-4 pb-12">
                    <button
                        type="button"
                        onClick={() => navigate(-1)}
                        className="px-8 py-3 bg-white border border-gray-200 text-gray-600 font-black rounded-2xl hover:bg-gray-50 transition"
                    >
                        CANCEL
                    </button>
                    <button
                        type="button"
                        disabled={loading}
                        onClick={(e) => handleSubmit(e, 'DRAFT')}
                        className="px-8 py-3 bg-slate-100 text-slate-700 font-black rounded-2xl hover:bg-slate-200 transition"
                    >
                        SAVE AS DRAFT
                    </button>
                    <button
                        type="button"
                        disabled={loading}
                        onClick={(e) => handleSubmit(e, 'PUBLISHED')}
                        className="px-12 py-3 bg-primary-600 text-white font-black rounded-2xl hover:bg-primary-700 transition shadow-lg shadow-primary-200 disabled:bg-gray-400"
                    >
                        {loading ? 'PROCESSING...' : 'PUBLISH AUCTION'}
                    </button>
                </div>
            </form>
        </div>
    );
}
