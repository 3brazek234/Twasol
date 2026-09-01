import { io, Socket } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:4001';

class AdminSocketClient {
  private socket: Socket | null = null;
  private isConnecting = false;
  private onReconnectCallbacks: (() => void)[] = [];

  connect() {
    if (this.socket || this.isConnecting) return;
    this.isConnecting = true;

    this.socket = io(SOCKET_URL, {
      withCredentials: true,
      transports: ['websocket', 'polling']
    });

    this.socket.on('connect', () => {
      this.isConnecting = false;
    });

    this.socket.on('disconnect', (reason) => {
    });

    this.socket.io.on('reconnect', () => {
      this.onReconnectCallbacks.forEach(cb => cb());
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  on(event: string, callback: (...args: any[]) => void) {
    if (!this.socket) this.connect();
    this.socket?.on(event, callback);
  }

  off(event: string, callback: (...args: any[]) => void) {
    this.socket?.off(event, callback);
  }

  onReconnect(callback: () => void) {
    this.onReconnectCallbacks.push(callback);
    return () => {
      this.onReconnectCallbacks = this.onReconnectCallbacks.filter(cb => cb !== callback);
    };
  }
}

export const adminSocket = new AdminSocketClient();
