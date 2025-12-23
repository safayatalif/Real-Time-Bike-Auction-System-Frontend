import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../services/api';

export const fetchNotifications = createAsyncThunk(
    'notifications/fetchAll',
    async ({ page = 1, unreadOnly = false } = {}, { rejectWithValue }) => {
        try {
            const response = await api.get('/notifications', {
                params: { page, unreadOnly }
            });
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.error || 'Failed to fetch notifications');
        }
    }
);

export const markAsRead = createAsyncThunk(
    'notifications/markRead',
    async (id, { rejectWithValue }) => {
        try {
            const response = await api.patch(`/notifications/${id}/read`);
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.error || 'Failed to mark as read');
        }
    }
);

export const markAllAsRead = createAsyncThunk(
    'notifications/markAllRead',
    async (_, { rejectWithValue }) => {
        try {
            const response = await api.patch('/notifications/mark-all-read');
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.error || 'Failed to mark all as read');
        }
    }
);

const initialState = {
    notifications: [],
    unreadCount: 0,
    total: 0,
    loading: false,
    error: null,
};

const notificationSlice = createSlice({
    name: 'notifications',
    initialState,
    reducers: {
        addNotification: (state, action) => {
            state.notifications = [action.payload, ...state.notifications];
            state.unreadCount += 1;
            state.total += 1;
        },
        clearNotifications: (state) => {
            state.notifications = [];
            state.unreadCount = 0;
            state.total = 0;
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchNotifications.pending, (state) => {
                state.loading = true;
            })
            .addCase(fetchNotifications.fulfilled, (state, action) => {
                state.loading = false;
                state.notifications = action.payload.data;
                state.unreadCount = action.payload.meta.unreadCount;
                state.total = action.payload.meta.total;
            })
            .addCase(fetchNotifications.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            .addCase(markAsRead.fulfilled, (state, action) => {
                const index = state.notifications.findIndex(n => n.id === action.payload.id);
                if (index !== -1 && !state.notifications[index].isRead) {
                    state.notifications[index].isRead = true;
                    state.unreadCount = Math.max(0, state.unreadCount - 1);
                }
            })
            .addCase(markAllAsRead.fulfilled, (state) => {
                state.notifications = state.notifications.map(n => ({ ...n, isRead: true }));
                state.unreadCount = 0;
            });
    },
});

export const { addNotification, clearNotifications } = notificationSlice.actions;
export default notificationSlice.reducer;
