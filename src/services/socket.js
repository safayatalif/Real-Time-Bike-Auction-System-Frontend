import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

class SocketService {
    socket = null;

    connect() {
        this.socket = io(SOCKET_URL, {
            transports: ['websocket'],
            autoConnect: true,
        });

        this.socket.on('connect', () => {
            console.log('Connected to socket server');
        });

        this.socket.on('disconnect', () => {
            console.log('Disconnected from socket server');
        });

        return this.socket;
    }

    joinAuction(auctionId) {
        if (this.socket) {
            this.socket.emit('joinAuction', auctionId);
        }
    }

    leaveAuction(auctionId) {
        if (this.socket) {
            this.socket.emit('leaveAuction', auctionId);
        }
    }

    joinUser(userId) {
        if (this.socket) {
            this.socket.emit('joinUser', userId);
        }
    }

    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
        }
    }
}

const socketService = new SocketService();
export default socketService;
