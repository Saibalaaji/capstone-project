import { io } from 'socket.io-client';
import toast from 'react-hot-toast';

// In production, this would be your API URL
const SOCKET_URL = process.env.NODE_ENV === 'production' ? '/' : 'http://localhost:5000';

let socket;

export const initSocket = (token) => {
    if (socket) return socket;
    
    socket = io(SOCKET_URL, {
        auth: { token },
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
    });

    socket.on('connect', () => {
        console.log('Connected to real-time events:', socket.id);
    });

    socket.on('disconnect', () => {
        console.log('Disconnected from real-time events');
    });

    // --- Global Application Event Listeners ---
    socket.on('NEW_ASSIGNMENT', (data) => {
        toast.success(`You have a new assignment: Request #${data.request_id}`, {
            duration: 6000,
            icon: '📣',
            style: {
                borderRadius: '10px',
                background: '#333',
                color: '#fff',
            },
        });
    });

    socket.on('NEW_MESSAGE', (data) => {
        toast(`New message regarding Request #${data.request_id || ''}`, {
            duration: 5000,
            icon: '💬',
            style: {
                borderRadius: '10px',
                background: '#4F46E5',
                color: '#fff',
            },
        });
    });

    socket.on('SYSTEM_NOTIFICATION', (data) => {
        toast(data.message || 'System Notification', {
            icon: '🔔',
        });
    });

    return socket;
};

export const getSocket = () => socket;

export const disconnectSocket = () => {
    if (socket) {
        socket.disconnect();
        socket = null;
    }
};
