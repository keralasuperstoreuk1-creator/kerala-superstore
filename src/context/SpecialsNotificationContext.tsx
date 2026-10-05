'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { DailySpecial, CustomerNotification } from '@/types';
import { INITIAL_DAILY_SPECIALS, INITIAL_NOTIFICATIONS } from '@/lib/mock-data';

interface SpecialsNotificationContextType {
  dailySpecials: DailySpecial[];
  addDailySpecial: (special: Omit<DailySpecial, 'id' | 'createdAt'>) => DailySpecial;
  updateDailySpecial: (id: string, updates: Partial<DailySpecial>) => void;
  deleteDailySpecial: (id: string) => void;
  toggleSoldOut: (id: string) => void;
  
  notifications: CustomerNotification[];
  broadcastNotification: (
    title: string, 
    message: string, 
    type?: CustomerNotification['type'], 
    specialItemId?: string
  ) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  unreadCount: number;

  isNotificationModalOpen: boolean;
  setIsNotificationModalOpen: (open: boolean) => void;
  activeToast: CustomerNotification | null;
  dismissToast: () => void;
  requestPushPermission: () => Promise<boolean>;
  pushPermission: NotificationPermission | 'default';
}

const SpecialsNotificationContext = createContext<SpecialsNotificationContextType | undefined>(undefined);

export const SpecialsNotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [dailySpecials, setDailySpecials] = useState<DailySpecial[]>(INITIAL_DAILY_SPECIALS);
  const [notifications, setNotifications] = useState<CustomerNotification[]>(INITIAL_NOTIFICATIONS);
  const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false);
  const [activeToast, setActiveToast] = useState<CustomerNotification | null>(null);
  const [pushPermission, setPushPermission] = useState<NotificationPermission | 'default'>('default');
  const [mounted, setMounted] = useState(false);

  // Load persisted specials & notifications from localStorage
  useEffect(() => {
    setMounted(true);
    try {
      const savedSpecials = localStorage.getItem('kss_daily_specials');
      if (savedSpecials) {
        setDailySpecials(JSON.parse(savedSpecials));
      }

      const savedNotifs = localStorage.getItem('kss_customer_notifications');
      if (savedNotifs) {
        setNotifications(JSON.parse(savedNotifs));
      }

      if (typeof window !== 'undefined' && 'Notification' in window) {
        setPushPermission(Notification.permission);
      }
    } catch {
      // Fallback
    }
  }, []);

  // Sync state to localStorage
  useEffect(() => {
    if (mounted) {
      try {
        localStorage.setItem('kss_daily_specials', JSON.stringify(dailySpecials));
      } catch {}
    }
  }, [dailySpecials, mounted]);

  useEffect(() => {
    if (mounted) {
      try {
        localStorage.setItem('kss_customer_notifications', JSON.stringify(notifications));
      } catch {}
    }
  }, [notifications, mounted]);

  // Request browser push notification permission
  const requestPushPermission = async (): Promise<boolean> => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return false;
    }
    try {
      const perm = await Notification.requestPermission();
      setPushPermission(perm);
      if (perm === 'granted') {
        new Notification('Kerala Superstore UK', {
          body: '🎉 Notifications enabled! You will be alerted when fresh Biriyani & hot kitchen specials drop.',
          icon: '/branding/kerala-superstore-round-logo.png',
        });
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const addDailySpecial = (specialData: Omit<DailySpecial, 'id' | 'createdAt'>): DailySpecial => {
    const newSpecial: DailySpecial = {
      ...specialData,
      id: `spec-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    const updated = [newSpecial, ...dailySpecials];
    setDailySpecials(updated);

    // Automatically broadcast notification for this hot special
    broadcastNotification(
      `🍲 Fresh Kitchen Special: ${newSpecial.title}!`,
      `${newSpecial.availableTime}. £${newSpecial.price.toFixed(2)} - Only ${newSpecial.portionsRemaining} portions available today!`,
      'special_item',
      newSpecial.id
    );

    return newSpecial;
  };

  const updateDailySpecial = (id: string, updates: Partial<DailySpecial>) => {
    setDailySpecials((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...updates } : item))
    );
  };

  const deleteDailySpecial = (id: string) => {
    setDailySpecials((prev) => prev.filter((item) => item.id !== id));
  };

  const toggleSoldOut = (id: string) => {
    setDailySpecials((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, isSoldOut: !item.isSoldOut } : item
      )
    );
  };

  const broadcastNotification = (
    title: string,
    message: string,
    type: CustomerNotification['type'] = 'special_item',
    specialItemId?: string
  ) => {
    const newNotif: CustomerNotification = {
      id: `notif-${Date.now()}`,
      title,
      message,
      type,
      specialItemId,
      timestamp: 'Just now',
      isRead: false,
    };

    setNotifications((prev) => [newNotif, ...prev]);
    setActiveToast(newNotif);

    // If browser notifications allowed, trigger system push notification
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(title, {
          body: message,
          icon: '/branding/kerala-superstore-round-logo.png',
        });
      } catch {}
    }
  };

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const dismissToast = () => {
    setActiveToast(null);
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <SpecialsNotificationContext.Provider
      value={{
        dailySpecials,
        addDailySpecial,
        updateDailySpecial,
        deleteDailySpecial,
        toggleSoldOut,
        notifications,
        broadcastNotification,
        markAsRead,
        markAllAsRead,
        unreadCount,
        isNotificationModalOpen,
        setIsNotificationModalOpen,
        activeToast,
        dismissToast,
        requestPushPermission,
        pushPermission,
      }}
    >
      {children}
    </SpecialsNotificationContext.Provider>
  );
};

export const useSpecialsNotification = () => {
  const context = useContext(SpecialsNotificationContext);
  if (!context) {
    throw new Error('useSpecialsNotification must be used within SpecialsNotificationProvider');
  }
  return context;
};
