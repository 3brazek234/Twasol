import {  Socket } from 'socket.io-client';


class AdminSocketClient {
  private socket: Socket | null = null;
  private isConnecting = false;
  private onReconnectCallbacks: (() => void)[] = [];

  connect() {
    if (this.socket || this.isConnecting) return;
    this.isConnecting = true;

    // TODO: WebSocket server is not yet implemented on the Node.js backend.
    // Disabling connection to prevent "bad response" polling errors in the admin dashboard.
    console.warn("[AdminSocketClient] WebSocket connection is disabled because the backend does not have a socket.io server yet.");
    this.isConnecting = false;

    /*
    this.socket = io(SOCKET_URL, {
      withCredentials: true,
      transports: ['websocket', 'polling']
    });
    */

    /*
    this.socket.io.on('reconnect', () => {
      this.onReconnectCallbacks.forEach(cb => cb());
    });
    */
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
