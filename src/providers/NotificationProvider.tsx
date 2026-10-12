import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
  ReactNode,
} from 'react';
import { supabase } from '@/lib/supabase';
import {
  NotificationItem,
  CreateNotificationParams,
  getNotifications,
  getUnreadNotificationsCount,
  markNotificationAsRead as apiMarkAsRead,
  markAllNotificationsAsRead as apiMarkAllAsRead,
  deleteNotification as apiDeleteNotification,
  createNotification as apiCreateNotification,
} from '@/services/notifications';
import { dataSync } from '@/lib/dataSync';
import { useAuth } from '@/providers/AuthProvider';

interface NotificationContextType {
  notifications: NotificationItem[];
  unreadCount: number;
  loading: boolean;
  refreshing: boolean;
  activeBanner: NotificationItem | null;
  dismissBanner: () => void;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  refetch: () => Promise<void>;
  sendNotification: (params: CreateNotificationParams) => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth();
  const currentUserId = session?.user?.id;

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [activeBanner, setActiveBanner] = useState<NotificationItem | null>(null);

  const bannerTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isFetchingRef = useRef(false);

  // Trigger temporary popup banner
  const triggerBanner = useCallback((item: NotificationItem) => {
    if (bannerTimerRef.current) {
      clearTimeout(bannerTimerRef.current);
    }
    setActiveBanner(item);
    bannerTimerRef.current = setTimeout(() => {
      setActiveBanner(null);
      bannerTimerRef.current = null;
    }, 4500);
  }, []);

  const dismissBanner = useCallback(() => {
    if (bannerTimerRef.current) {
      clearTimeout(bannerTimerRef.current);
      bannerTimerRef.current = null;
    }
    setActiveBanner(null);
  }, []);

  // Fetch notifications
  const loadNotifications = useCallback(async (isRefresh = false) => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;

    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const [items, count] = await Promise.all([
        getNotifications(50),
        getUnreadNotificationsCount(),
      ]);
      setNotifications(items);
      setUnreadCount(count);
      dataSync.markClean('notifications');
    } catch (err) {
      console.warn('[NotificationProvider] Failed to load notifications:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
      isFetchingRef.current = false;
    }
  }, []);

  // Initial load
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadNotifications();
  }, [loadNotifications]);

  // Realtime Supabase Channel Subscription
  useEffect(() => {
    const channel = supabase
      .channel('public:notifications')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
        },
        (payload: any) => {
          const { eventType, new: newRecord, old: oldRecord } = payload;

          if (eventType === 'INSERT') {
            const row = newRecord as NotificationItem;
            // Check if notification is directed to this user or broadcast
            if (!row.user_id || row.user_id === currentUserId) {
              setNotifications((prev) => {
                if (prev.some((n) => n.id === row.id)) return prev;
                return [row, ...prev];
              });
              setUnreadCount((prev) => (row.read ? prev : prev + 1));
              triggerBanner(row);
            }
          } else if (eventType === 'UPDATE') {
            const row = newRecord as NotificationItem;
            setNotifications((prev) =>
              prev.map((n) => (n.id === row.id ? { ...n, ...row } : n))
            );
            // Recalculate unread count
            setNotifications((currentList) => {
              const unread = currentList.filter((n) => !n.read).length;
              setUnreadCount(unread);
              return currentList;
            });
          } else if (eventType === 'DELETE') {
            const id = oldRecord?.id;
            if (id) {
              setNotifications((prev) => prev.filter((n) => n.id !== id));
              setNotifications((currentList) => {
                const unread = currentList.filter((n) => !n.read).length;
                setUnreadCount(unread);
                return currentList;
              });
            }
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          // Channel active
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUserId, triggerBanner]);

  // In-app DataSync Event Bus Subscription (client-side zero-latency fallback)
  useEffect(() => {
    const unsubscribe = dataSync.subscribe('notifications', (event) => {
      if (event.action === 'create') {
        const item = event.payload as NotificationItem;
        setNotifications((prev) => {
          if (prev.some((n) => n.id === item.id)) return prev;
          return [item, ...prev];
        });
        setUnreadCount((prev) => (item.read ? prev : prev + 1));
        triggerBanner(item);
      } else if (event.action === 'update') {
        const item = event.payload as NotificationItem;
        setNotifications((prev) =>
          prev.map((n) => (n.id === item.id ? { ...n, ...item } : n))
        );
        setNotifications((currentList) => {
          setUnreadCount(currentList.filter((n) => !n.read).length);
          return currentList;
        });
      } else if (event.action === 'delete') {
        const { id } = event.payload as { id: string };
        setNotifications((prev) => prev.filter((n) => n.id !== id));
        setNotifications((currentList) => {
          setUnreadCount(currentList.filter((n) => !n.read).length);
          return currentList;
        });
      } else if (event.action === 'invalidate') {
        loadNotifications(true);
      }
    });

    return unsubscribe;
  }, [triggerBanner, loadNotifications]);

  // Mark single as read
  const markAsRead = useCallback(async (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));

    try {
      await apiMarkAsRead(id);
    } catch (err) {
      console.warn('[NotificationProvider] Failed to mark as read:', err);
      // Rollback if needed
      loadNotifications(true);
    }
  }, [loadNotifications]);

  // Mark all as read
  const markAllAsRead = useCallback(async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);

    try {
      await apiMarkAllAsRead();
    } catch (err) {
      console.warn('[NotificationProvider] Failed to mark all as read:', err);
      loadNotifications(true);
    }
  }, [loadNotifications]);

  // Delete notification
  const deleteNotification = useCallback(async (id: string) => {
    const target = notifications.find((n) => n.id === id);
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    if (target && !target.read) {
      setUnreadCount((prev) => Math.max(0, prev - 1));
    }

    try {
      await apiDeleteNotification(id);
    } catch (err) {
      console.warn('[NotificationProvider] Failed to delete notification:', err);
      loadNotifications(true);
    }
  }, [notifications, loadNotifications]);

  // Refetch
  const refetch = useCallback(async () => {
    await loadNotifications(true);
  }, [loadNotifications]);

  // Send new notification
  const sendNotification = useCallback(
    async (params: CreateNotificationParams) => {
      await apiCreateNotification(params);
    },
    []
  );

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        loading,
        refreshing,
        activeBanner,
        dismissBanner,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        refetch,
        sendNotification,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}
