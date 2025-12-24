import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../services/api';

export const fetchAuctionById = createAsyncThunk(
    'auction/fetchById',
    async (id, { rejectWithValue }) => {
        try {
            const response = await api.get(`/auctions/${id}`);
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.error || 'Failed to fetch auction');
        }
    }
);

export const fetchAuctionBids = createAsyncThunk(
    'auction/fetchBids',
    async (id, { rejectWithValue }) => {
        try {
            const response = await api.get(`/auctions/${id}/bids`);
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.error || 'Failed to fetch bids');
        }
    }
);

export const placeBid = createAsyncThunk(
    'auction/placeBid',
    async ({ auctionId, amount, bidder }, { rejectWithValue, dispatch }) => {
        try {
            const idempotencyKey = `bid-${bidder.id}-${auctionId}-${Date.now()}`;

            // Optimistic update would be handled in the slice's extraReducers or by a separate action
            // But for simplicity in this thunk, we'll just wait for the response or handle it in the slice

            const response = await api.post('/bids', {
                auctionId,
                amount,
                idempotencyKey
            });

            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.error || 'Failed to place bid');
        }
    }
);

const initialState = {
    currentAuction: null,
    bids: [],
    loading: false,
    bidLoading: false,
    error: null,
    bidError: null,
    bidSuccess: null,
};

const auctionSlice = createSlice({
    name: 'auction',
    initialState,
    reducers: {
        updateAuctionFromSocket: (state, action) => {
            if (state.currentAuction && state.currentAuction.id === action.payload.auctionId) {
                state.currentAuction.currentPrice = action.payload.newPrice;
                state.currentAuction.endTime = action.payload.endTime;
                state.currentAuction._count.bids = action.payload.bidCount;
            }
        },
        addBidFromSocket: (state, action) => {
            // Avoid duplicates if the bidder is the current user (already handled optimistically or via response)
            const bidExists = state.bids.some(b => b.id === action.payload.id);
            if (!bidExists) {
                state.bids = [action.payload, ...state.bids].sort((a, b) => b.amount - a.amount);
            }
        },
        auctionEndedFromSocket: (state, action) => {
            if (state.currentAuction && state.currentAuction.id === action.payload.auctionId) {
                state.currentAuction.status = 'ENDED';
                state.currentAuction.winnerId = action.payload.winnerId;
                state.currentAuction.currentPrice = action.payload.finalPrice;
                // Optionally update bid count if it was a buy now or last second bid
                if (action.payload.reason === 'BUY_NOW' && state.currentAuction._count) {
                    state.currentAuction._count.bids += 1;
                }
            }
        },
        clearBidStatus: (state) => {
            state.bidError = null;
            state.bidSuccess = null;
        },
        setOptimisticBid: (state, action) => {
            // action.payload: { amount, bidder, auctionId }
            const optimisticBid = {
                id: 'optimistic-' + Date.now(),
                amount: action.payload.amount,
                bidder: action.payload.bidder,
                auctionId: action.payload.auctionId,
                createdAt: new Date().toISOString(),
                status: 'PENDING'
            };
            state.bids = [optimisticBid, ...state.bids];
            state.currentAuction.currentPrice = action.payload.amount;
            state.currentAuction._count.bids += 1;
        },
        removeOptimisticBid: (state, action) => {
            state.bids = state.bids.filter(b => b.id !== action.payload);
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchAuctionById.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchAuctionById.fulfilled, (state, action) => {
                state.loading = false;
                state.currentAuction = action.payload;
            })
            .addCase(fetchAuctionById.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            .addCase(fetchAuctionBids.fulfilled, (state, action) => {
                state.bids = action.payload;
            })
            .addCase(placeBid.pending, (state) => {
                state.bidLoading = true;
                state.bidError = null;
                state.bidSuccess = null;
            })
            .addCase(placeBid.fulfilled, (state, action) => {
                state.bidLoading = false;
                state.bidSuccess = 'Bid placed successfully!';
                // The actual bid data will come back and we can replace the optimistic one or just let the socket handle it
            })
            .addCase(placeBid.rejected, (state, action) => {
                state.bidLoading = false;
                state.bidError = action.payload;
            });
    },
});

export const {
    updateAuctionFromSocket,
    addBidFromSocket,
    auctionEndedFromSocket,
    clearBidStatus,
    setOptimisticBid,
    removeOptimisticBid
} = auctionSlice.actions;

export default auctionSlice.reducer;
