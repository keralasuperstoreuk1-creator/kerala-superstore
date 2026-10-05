'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

interface AppDownloadContextType {
  isOpen: boolean;
  activeTab: 'android' | 'ios';
  openModal: (tab?: 'android' | 'ios') => void;
  closeModal: () => void;
  deferredPrompt: any;
  isInstallable: boolean;
  triggerInstall: () => Promise<boolean>;
  isIOS: boolean;
  isAndroid: boolean;
}

const AppDownloadContext = createContext<AppDownloadContextType | undefined>(undefined);

export const AppDownloadProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'android' | 'ios'>('android');
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);

  useEffect(() => {
    // Detect OS
    if (typeof window !== 'undefined') {
      const ua = window.navigator.userAgent.toLowerCase();
      const ios = /iphone|ipad|ipod/.test(ua);
      const android = /android/.test(ua);
      setIsIOS(ios);
      setIsAndroid(android);
      if (ios) {
        setActiveTab('ios');
      } else {
        setActiveTab('android');
      }

      // Listen for PWA beforeinstallprompt
      const handleBeforeInstall = (e: Event) => {
        e.preventDefault();
        setDeferredPrompt(e);
      };

      window.addEventListener('beforeinstallprompt', handleBeforeInstall);
      return () => {
        window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      };
    }
  }, []);

  const openModal = (tab?: 'android' | 'ios') => {
    if (tab) {
      setActiveTab(tab);
    } else if (isIOS) {
      setActiveTab('ios');
    } else {
      setActiveTab('android');
    }
    setIsOpen(true);
  };

  const closeModal = () => {
    setIsOpen(false);
  };

  const triggerInstall = async (): Promise<boolean> => {
    if (deferredPrompt) {
      try {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
          setDeferredPrompt(null);
          closeModal();
          return true;
        }
      } catch (err) {
        console.error('PWA install error:', err);
      }
    }
    return false;
  };

  return (
    <AppDownloadContext.Provider
      value={{
        isOpen,
        activeTab,
        openModal,
        closeModal,
        deferredPrompt,
        isInstallable: !!deferredPrompt,
        triggerInstall,
        isIOS,
        isAndroid,
      }}
    >
      {children}
    </AppDownloadContext.Provider>
  );
};

export const useAppDownload = () => {
  const context = useContext(AppDownloadContext);
  if (!context) {
    throw new Error('useAppDownload must be used within an AppDownloadProvider');
  }
  return context;
};
