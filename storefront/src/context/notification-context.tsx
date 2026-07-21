'use client';

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
} from 'react';
import { UnstyledButton } from '@/components/ui/Button';

interface Notification {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
}

interface NotificationContextType {
  notifications: Notification[];
  showNotification: (type: Notification['type'], message: string) => void;
  removeNotification: (id: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined
);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const showNotification = useCallback(
    (type: Notification['type'], message: string) => {
      const id = Math.random().toString(36).substring(7);
      setNotifications((prev) => [...prev, { id, type, message }]);

      // Auto-remove after 3 seconds
      setTimeout(() => {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
      }, 3000);
    },
    []
  );

  const removeNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  return (
    <NotificationContext.Provider
      value={{ notifications, showNotification, removeNotification }}
    >
      {children}

      {/* Notification Toast Container */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className={`rounded px-4 py-3 text-body-sm font-medium text-inverse shadow-lg animate-fade-in
                            ${notification.type === 'success' ? 'bg-success' : ''}
                            ${notification.type === 'error' ? 'bg-danger' : ''}
                            ${notification.type === 'info' ? 'bg-info' : ''}
                            ${notification.type === 'warning' ? 'bg-warning' : ''}
                        `}
          >
            <div className="flex items-center gap-2">
              <span>{notification.message}</span>
              <UnstyledButton
                onClick={() => removeNotification(notification.id)}
                className="ml-2 text-inverse opacity-80 transition-opacity hover:opacity-100"
                aria-label="Dismiss notification"
              >
                <span aria-hidden="true">x</span>
              </UnstyledButton>
            </div>
          </div>
        ))}
      </div>
    </NotificationContext.Provider>
  );
}

export function useNotification() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error(
      'useNotification must be used within a NotificationProvider'
    );
  }
  return context;
}
