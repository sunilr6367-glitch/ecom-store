'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';

export interface StudioSocketMessage {
  id: string;
  sender_type: 'customer' | 'admin' | string;
  sender_name: string | null;
  sender_email?: string | null;
  message: string;
  created_at: string;
}

interface StudioSocketPayload {
  inquiryId: string;
  message: StudioSocketMessage;
  inquiry?: unknown;
}

interface UseStudioChatSocketOptions {
  inquiryId?: string | null;
  token?: string | null;
  authMode?: 'token' | 'account' | 'account-inbox';
  enabled?: boolean;
  onMessage?: (payload: StudioSocketPayload) => void;
  onTyping?: (payload: { inquiryId: string; senderType: string; isTyping: boolean }) => void;
}

function getSocketUrl() {
  return (
    process.env.NEXT_PUBLIC_WS_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    'http://localhost:4000'
  );
}

export function useStudioChatSocket({
  inquiryId,
  token,
  authMode = 'token',
  enabled = true,
  onMessage,
  onTyping,
}: UseStudioChatSocketOptions) {
  const [isConnected, setIsConnected] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const messageRef = useRef(onMessage);
  const typingRef = useRef(onTyping);

  useEffect(() => {
    messageRef.current = onMessage;
    typingRef.current = onTyping;
  }, [onMessage, onTyping]);

  useEffect(() => {
    if (!enabled || (authMode !== 'account-inbox' && !inquiryId) || (authMode === 'token' && !token)) return;

    const socket = io(getSocketUrl(), {
      path: '/socket.io',
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 8,
      reconnectionDelay: 1000,
      timeout: 10000,
      withCredentials: true,
    });

    socketRef.current = socket;

    const subscribe = () => {
      if (authMode === 'account') {
        socket.emit('subscribe:studio:customer-account', { inquiryId });
      } else if (authMode === 'account-inbox') {
        socket.emit('subscribe:studio:customer-inbox');
      } else {
        socket.emit('subscribe:studio:customer', { inquiryId, token });
      }
    };

    socket.on('connect', () => {
      setIsConnected(true);
      subscribe();
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
      setIsSubscribed(false);
    });

    socket.on('studio:subscribed', () => {
      setIsSubscribed(true);
    });

    socket.on('studio:message', (payload: StudioSocketPayload) => {
      if (payload.inquiryId === inquiryId || authMode === 'account-inbox') {
        messageRef.current?.(payload);
      }
    });

    socket.on('studio:inquiry-updated', (payload: StudioSocketPayload) => {
      if (payload.inquiryId === inquiryId || authMode === 'account-inbox') {
        messageRef.current?.(payload);
      }
    });

    socket.on('studio:typing', (payload: { inquiryId: string; senderType: string; isTyping: boolean }) => {
      if (payload.inquiryId === inquiryId) {
        typingRef.current?.(payload);
      }
    });

    socket.on('connect_error', () => {
      setIsConnected(false);
      setIsSubscribed(false);
    });

    return () => {
      socket.emit('unsubscribe:studio', { inquiryId });
      socket.disconnect();
      socketRef.current = null;
    };
  }, [authMode, enabled, inquiryId, token]);

  const sendTyping = useCallback(
    (isTyping: boolean) => {
      if (!socketRef.current?.connected || !inquiryId) return;
      socketRef.current.emit('studio:typing', {
        inquiryId,
        senderType: 'customer',
        isTyping,
      });
    },
    [inquiryId]
  );

  return { isConnected, isSubscribed, sendTyping };
}
