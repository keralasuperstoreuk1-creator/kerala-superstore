import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    unoptimized: true,
    dangerouslyAllowSVG: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  async redirects() {
    return [
      {
        source: '/downloads/KSS-POS-Sync.exe',
        destination: 'https://github.com/keralasuperstoreuk1-creator/kerala-superstore/releases/download/v1.0.0/KSS-POS-Sync.exe',
        permanent: false,
      },
      {
        source: '/downloads/KSS-POS-Sync-Setup.exe',
        destination: 'https://github.com/keralasuperstoreuk1-creator/kerala-superstore/releases/download/v1.0.0/KSS-POS-Sync-Setup.exe',
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
