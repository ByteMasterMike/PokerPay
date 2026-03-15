import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          // Bypass ngrok browser warning in dev
          { key: 'ngrok-skip-browser-warning', value: '1' },
          // Camera restricted to same origin only
          { key: 'Permissions-Policy', value: 'camera=(self)' },
          // Prevent MIME-type sniffing
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          // Block clickjacking
          { key: 'X-Frame-Options', value: 'DENY' },
          // Enforce HTTPS for 1 year (includeSubDomains)
          { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
          // Control referrer information
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          // XSS protection (legacy browsers)
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          // Content Security Policy
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              // Next.js inline scripts + Google Fonts
              "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
              // Styles: self + Google Fonts
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              // Fonts: self + Google Fonts CDN
              "font-src 'self' https://fonts.gstatic.com",
              // Images: self + data URIs (for QR codes)
              "img-src 'self' data: blob:",
              // Camera access for QR scanner
              "media-src 'self' blob:",
              // API calls: self + external APIs
              "connect-src 'self' https://*.supabase.com https://generativelanguage.googleapis.com",
              // No iframes
              "frame-ancestors 'none'",
              // No plugins
              "object-src 'none'",
              // Base URI locked to self
              "base-uri 'self'",
              // Forms only submit to self
              "form-action 'self'",
            ].join('; '),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
