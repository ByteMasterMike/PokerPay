import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'ngrok-skip-browser-warning', value: '1' },
          { key: 'Permissions-Policy', value: 'camera=*' },
        ],
      },
    ];
  },
};

export default nextConfig;
