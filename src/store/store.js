import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../features/authSlice';
import auctionReducer from '../features/auctionSlice';

export const store = configureStore({
    reducer: {
        auth: authReducer,
        auction: auctionReducer,
    },
});
