import { io, Socket } from 'socket.io-client';
import * as SecureStore from 'expo-secure-store';
import { useAuthStore } from '../stores/authStore';
import { useSocketStore } from '../stores/socketStore';
import { Platform } from 'react-native';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:4001/api';
const SOCKET_URL = API_URL.replace('/api', '');
let socketInstance: Socket | null = null;

export const initializeSocket = async () => {
  if (socketInstance) {
    return socketInstance;
  }

  const token = await SecureStore.getItemAsync('accessToken');
  if (!token) return null;

  socketInstance = io(SOCKET_URL, {
    auth: { token },
    transports: ['websocket'],
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
  });

  const { setConnected, setSocket } = useSocketStore.getState();
  setSocket(socketInstance);

  socketInstance.on('connect', () => {
    setConnected(true);
  });

  socketInstance.on('disconnect', (reason) => {
    setConnected(false);
  });

  socketInstance.on('connect_error', (err) => {
    console.error('Socket connect_error:', err.message);
    setConnected(false);
  });

  return socketInstance;
};

export const disconnectSocket = () => {
  if (socketInstance) {
    socketInstance.disconnect();
    socketInstance = null;
    useSocketStore.getState().setSocket(null);
    useSocketStore.getState().setConnected(false);
  }
};

// Listen to auth changes to connect/disconnect socket automatically
useAuthStore.subscribe((state, prevState) => {
  if (state.isAuthenticated && !prevState.isAuthenticated) {
    initializeSocket();
  } else if (!state.isAuthenticated && prevState.isAuthenticated) {
    disconnectSocket();
  }
});
