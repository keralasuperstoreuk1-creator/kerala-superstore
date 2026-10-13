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
import { StructuredData } from "@/components/StructuredData";

export const viewport: Viewport = {
  themeColor: "#064e3b",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  metadataBase: new URL('https://keralasuperstore.com'),
  title: {
    default: "Kerala Superstore Manchester | Authentic Kerala Groceries & Spices UK",
    template: "%s | Kerala Superstore Manchester",
  },
  description: "Buy authentic Kerala Matta rice, curry powders, banana chips, pickles, and frozen snacks in Manchester & across the UK. Cash on Delivery and fast nationwide delivery.",
  manifest: "/manifest.json",
  alternates: {
    canonical: "https://keralasuperstore.com",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Kerala Superstore",
  },
  keywords: [
    "Kerala Grocery Manchester",
    "Kerala Supermarket UK",
    "Kerala Superstore UK",
    "Matta Rice UK",
    "Palakkadan Matta Rice Manchester",
    "Nirapara UK",
    "Eastern Masala UK",
    "Double Horse UK",
    "Brahmins UK",
    "Kerala Banana Chips UK",
    "Thalassery Biriyani Manchester",
    "South Indian Grocery Manchester",
    "Old Market Street Manchester",
    "Malayali Store UK",
    "Cash on Delivery Grocery UK",
  ],
  openGraph: {
    title: "Kerala Superstore Manchester | Authentic Groceries & Spices UK",
    description: "Your neighbourhood Kerala superstore at Unit 2, 73 Old Market Street, Manchester M9 8DX. Genuine Matta rice, spices & snacks with fast UK delivery and Cash on Delivery.",
    url: "https://keralasuperstore.com",
    siteName: "Kerala Superstore",
    images: [
      {
        url: "/branding/kerala-superstore-round-logo.png",
        width: 800,
        height: 800,
        alt: "Kerala Superstore Manchester",
      },
    ],
    type: "website",
    locale: "en_GB",
  },
  twitter: {
    card: "summary_large_image",
    title: "Kerala Superstore Manchester | Authentic Kerala Groceries & Spices UK",
    description: "Buy authentic Kerala Matta rice, curry powders, banana chips, and frozen snacks in Manchester & across the UK.",
    images: ["/branding/kerala-superstore-round-logo.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
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
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Kerala Superstore" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.addEventListener('beforeinstallprompt', function (e) {
                e.preventDefault();
                window.__kssInstallPrompt = e;
                window.dispatchEvent(new Event('kss-install-ready'));
              });
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function () {
                  navigator.serviceWorker.register('/sw.js').catch(function () {});
                });
              }
            `,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-[#fafaf8] text-slate-900 relative">
        <StoreConfigProvider>
          <CartProvider>
            <SpecialsNotificationProvider>
              <AppDownloadProvider>
                <ThemeParticleEffect />
                <ToastNotificationBanner />
                <NotificationBellModal />
                <AppDownloadModal />
                <StructuredData />
                {children}
              </AppDownloadProvider>
            </SpecialsNotificationProvider>
          </CartProvider>
        </StoreConfigProvider>
      </body>
    </html>
  );
}
