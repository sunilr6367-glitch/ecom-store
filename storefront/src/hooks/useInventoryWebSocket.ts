'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

interface InventoryUpdate {
  variantId: string;
  productId: string;
  quantity: number;
  timestamp: string;
}

interface UseInventoryWebSocketOptions {
  onInventoryUpdate?: (update: InventoryUpdate) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: Error) => void;
}

export function useInventoryWebSocket(
  options: UseInventoryWebSocketOptions = {}
) {
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<InventoryUpdate | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const subscribedVariants = useRef<Set<string>>(new Set());

  // Stable refs for callbacks to prevent reconnects
  const inventoryUpdateRef = useRef(options.onInventoryUpdate);
  const connectRef = useRef(options.onConnect);
  const disconnectRef = useRef(options.onDisconnect);
  const errorRef = useRef(options.onError);

  // Update refs when callbacks change
  useEffect(() => {
    inventoryUpdateRef.current = options.onInventoryUpdate;
    connectRef.current = options.onConnect;
    disconnectRef.current = options.onDisconnect;
    errorRef.current = options.onError;
  }, [
    options.onInventoryUpdate,
    options.onConnect,
    options.onDisconnect,
    options.onError,
  ]);

  // Initialize WebSocket connection
  useEffect(() => {
    const WS_URL =
      process.env.NEXT_PUBLIC_WS_URL ||
      process.env.NEXT_PUBLIC_API_URL ||
      'http://localhost:4000';
    const isE2E = process.env.NEXT_PUBLIC_E2E === 'true';

    // Don't connect in development if explicitly disabled
    if (
      isE2E ||
      process.env.NODE_ENV === 'development' &&
      !process.env.NEXT_PUBLIC_ENABLE_WS_DEV
    ) {
      console.log('[Inventory WebSocket] Disabled for local verification');
      return;
    }

    let socket: Socket | null = null;

    try {
      socket = io(WS_URL, {
        path: '/socket.io',
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        timeout: 10000,
      });

      socketRef.current = socket;

      socket.on('connect', () => {
        console.log('[Inventory WebSocket] Connected');
        setIsConnected(true);
        connectRef.current?.();

        // Re-subscribe to previously subscribed variants
        subscribedVariants.current.forEach((variantId) => {
          socket?.emit('subscribe:inventory', { variantId });
        });
      });

      socket.on('disconnect', () => {
        console.log('[Inventory WebSocket] Disconnected');
        setIsConnected(false);
        disconnectRef.current?.();
      });

      socket.on('inventory:update', (update: InventoryUpdate) => {
        console.log('[Inventory WebSocket] Update received:', update);
        setLastUpdate(update);
        inventoryUpdateRef.current?.(update);
      });

      socket.on('error', (error: Error) => {
        console.error('[Inventory WebSocket] Error:', error);
        errorRef.current?.(error);
      });

      socket.on('connect_error', (error: Error) => {
        console.error('[Inventory WebSocket] Connection error:', error);
        errorRef.current?.(error);
      });
    } catch (error) {
      console.error('[Inventory WebSocket] Failed to initialize:', error);
      // Clean up socket on partial initialization failure
      if (socket) {
        socket.disconnect();
        socketRef.current = null;
      }
      errorRef.current?.(error as Error);
    }

    return () => {
      socket?.disconnect();
      socketRef.current = null;
    };
  }, []); // Empty deps - socket initialized once

  // Subscribe to inventory updates for a variant
  const subscribeToInventory = useCallback((variantId: string) => {
    if (!socketRef.current?.connected) {
      console.warn(
        '[Inventory WebSocket] Not connected, queueing subscription'
      );
      subscribedVariants.current.add(variantId);
      return;
    }

    socketRef.current.emit('subscribe:inventory', { variantId });
    subscribedVariants.current.add(variantId);
    console.log('[Inventory WebSocket] Subscribed to:', variantId);
  }, []);

  // Unsubscribe from inventory updates
  const unsubscribeFromInventory = useCallback((variantId: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('unsubscribe:inventory', { variantId });
    }
    subscribedVariants.current.delete(variantId);
    console.log('[Inventory WebSocket] Unsubscribed from:', variantId);
  }, []);

  // Subscribe to multiple variants
  const subscribeToMultiple = useCallback(
    (variantIds: string[]) => {
      variantIds.forEach((id) => subscribeToInventory(id));
    },
    [subscribeToInventory]
  );

  // Unsubscribe from all
  const unsubscribeAll = useCallback(() => {
    subscribedVariants.current.forEach((id) => {
      if (socketRef.current?.connected) {
        socketRef.current.emit('unsubscribe:inventory', { variantId: id });
      }
    });
    subscribedVariants.current.clear();
  }, []);

  return {
    isConnected,
    lastUpdate,
    subscribeToInventory,
    unsubscribeFromInventory,
    subscribeToMultiple,
    unsubscribeAll,
  };
}

export type { InventoryUpdate };
