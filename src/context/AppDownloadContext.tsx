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
  installApp: () => Promise<void>;
  isInstalled: boolean;
  isIOS: boolean;
  isAndroid: boolean;
  isInAppBrowser: boolean;
}

const AppDownloadContext = createContext<AppDownloadContextType | undefined>(undefined);

export const AppDownloadProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'android' | 'ios'>('android');
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [isInAppBrowser, setIsInAppBrowser] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Detect OS and in-app browsers
    const ua = window.navigator.userAgent.toLowerCase();
    const ios = /iphone|ipad|ipod/.test(ua) || (ua.includes('macintosh') && 'ontouchend' in document);
    const android = /android/.test(ua);
    const inApp = /whatsapp|fban|fbav|instagram|threads|line|micromessenger/i.test(ua);
    setIsIOS(ios);
    setIsAndroid(android);
    setIsInAppBrowser(inApp);
    setActiveTab(ios ? 'ios' : 'android');

    // Already running as installed app?
    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;
    setIsInstalled(standalone);

    // Pick up prompt captured early in <head> (before React loaded)
    if ((window as any).__kssInstallPrompt) {
      setDeferredPrompt((window as any).__kssInstallPrompt);
    }

    const handleReady = () => setDeferredPrompt((window as any).__kssInstallPrompt || null);
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      (window as any).__kssInstallPrompt = e;
      setDeferredPrompt(e);
    };
    const handleInstalled = () => {
      (window as any).__kssInstallPrompt = null;
      setDeferredPrompt(null);
      setIsInstalled(true);
      setIsOpen(false);
    };

    window.addEventListener('kss-install-ready', handleReady);
    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleInstalled);
    return () => {
      window.removeEventListener('kss-install-ready', handleReady);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleInstalled);
    };
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
    const prompt = deferredPrompt || (typeof window !== 'undefined' ? (window as any).__kssInstallPrompt : null);
    if (prompt) {
      try {
        prompt.prompt();
        const { outcome } = await prompt.userChoice;
        // A prompt can only be used once
        (window as any).__kssInstallPrompt = null;
        setDeferredPrompt(null);
        if (outcome === 'accepted') {
          setIsInstalled(true);
          closeModal();
          return true;
        }
      } catch (err) {
        console.error('PWA install error:', err);
      }
    }
    return false;
  };

  /**
   * One-tap install: shows the phone's native "Add to Home screen" popup
   * directly when the browser supports it. Otherwise (iPhone Safari, or
   * browsers without the API) opens the step-by-step guide.
   */
  const installApp = async (): Promise<void> => {
    const prompt = deferredPrompt || (typeof window !== 'undefined' ? (window as any).__kssInstallPrompt : null);
    if (prompt) {
      await triggerInstall();
      return;
    }
    openModal();
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
        installApp,
        isInstalled,
        isIOS,
        isAndroid,
        isInAppBrowser,
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
