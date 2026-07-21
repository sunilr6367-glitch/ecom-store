'use client';

import { createContext, useContext, useRef, useState, ReactNode } from 'react';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';

interface Notification {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
  duration?: number;
}

interface NotificationContextType {
  showNotification: (
    type: Notification['type'],
    message: string,
    duration?: number
  ) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined
);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const notificationSequence = useRef(0);

  const createNotificationId = () => {
    if (typeof globalThis.crypto?.randomUUID === 'function') {
      return globalThis.crypto.randomUUID();
    }

    notificationSequence.current += 1;
    return `notification-${notificationSequence.current}`;
  };

  const showNotification = (
    type: Notification['type'],
    message: string,
    duration = 3000
  ) => {
    const id = createNotificationId();
    const newNotification = { id, type, message, duration };

    setNotifications((prev) => [...prev, newNotification]);

    if (duration > 0) {
      setTimeout(() => {
        removeNotification(id);
      }, duration);
    }
  };

  const removeNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  return (
    <NotificationContext.Provider value={{ showNotification }}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg text-white text-sm font-medium transition-all transform translate-y-0 opacity-100 ${
              notification.type === 'success'
                ? 'bg-green-600'
                : notification.type === 'error'
                  ? 'bg-red-600'
                  : notification.type === 'warning'
                    ? 'bg-yellow-600'
                    : 'bg-blue-600'
            }`}
            role="alert"
          >
            {notification.type === 'success' && <CheckCircle size={16} />}
            {notification.type === 'error' && <AlertCircle size={16} />}
            {notification.type === 'warning' && <AlertCircle size={16} />}
            {notification.type === 'info' && <Info size={16} />}

            <span>{notification.message}</span>

            <button
              onClick={() => removeNotification(notification.id)}
              className="ml-2 hover:bg-white/20 rounded-full p-1 transition-colors"
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </NotificationContext.Provider>
  );
}

export function useNotification() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error(
      'useNotification must be used within a NotificationProvider'
    );
  }
  return context;
}
