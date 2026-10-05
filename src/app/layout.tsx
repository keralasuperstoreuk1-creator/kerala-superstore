import type { Metadata, Viewport } from "next";
import "./globals.css";
import { CartProvider } from "@/context/CartContext";
import { StoreConfigProvider } from "@/context/StoreConfigContext";
import { SpecialsNotificationProvider } from "@/context/SpecialsNotificationContext";
import { AppDownloadProvider } from "@/context/AppDownloadContext";
import { ThemeParticleEffect } from "@/components/ThemeParticleEffect";
import { ToastNotificationBanner } from "@/components/ToastNotificationBanner";
import { NotificationBellModal } from "@/components/NotificationBellModal";
import { AppDownloadModal } from "@/components/AppDownloadModal";

export const viewport: Viewport = {
  themeColor: "#064e3b",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  title: "Kerala Superstore Manchester | Authentic Kerala Groceries & Spices UK",
  description: "Buy authentic Kerala Matta rice, curry powders, banana chips, pickles, and frozen snacks in Manchester & UK. Cash on Delivery and fast nationwide delivery.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Kerala Superstore",
  },
  keywords: ["Kerala Grocery Manchester", "Kerala Superstore UK", "Matta Rice UK", "Nirapara UK", "Eastern Masala UK", "Kerala Banana Chips", "Wallbrook Drive Manchester"],
  openGraph: {
    title: "Kerala Superstore Manchester | Authentic Groceries & Spices UK",
    description: "Your neighbourhood Kerala superstore at 4 Wallbrook Drive, Manchester M9 8PX. Groceries & spices delivered across the UK.",
    type: "website",
    locale: "en_GB",
  }
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className="h-full antialiased"
    >
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/branding/kerala-superstore-round-logo.png" />
      </head>
      <body className="min-h-full flex flex-col bg-[#fcfcfb] text-slate-900 relative">
        <StoreConfigProvider>
          <CartProvider>
            <SpecialsNotificationProvider>
              <AppDownloadProvider>
                <ThemeParticleEffect />
                <ToastNotificationBanner />
                <NotificationBellModal />
                <AppDownloadModal />
                {children}
              </AppDownloadProvider>
            </SpecialsNotificationProvider>
          </CartProvider>
        </StoreConfigProvider>
      </body>
    </html>
  );
}
