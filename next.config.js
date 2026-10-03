/** @type {import('next').NextConfig} */

// Content Security Policy
// Note: Allowed origins include Firebase Auth endpoints (apis.google.com, *.firebaseapp.com),
// Google Fonts, Vercel Insights/Analytics, and external platform avatar/asset hosts.
const ContentSecurityPolicy = `
  default-src 'self';
  script-src 'self' 'unsafe-inline' 'unsafe-eval' https://apis.google.com https://*.firebaseapp.com https://va.vercel-scripts.com;
  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
  img-src 'self' data: blob: https://*.googleusercontent.com https://avatars.githubusercontent.com https://assets.leetcode.com https://media.geeksforgeeks.org https://images.unsplash.com https://*.firebaseapp.com;
  font-src 'self' https://fonts.gstatic.com data:;
  connect-src 'self' https://*.googleapis.com https://*.firebaseio.com https://*.firebaseapp.com https://identitytoolkit.googleapis.com https://securetoken.googleapis.com https://leetcode.com https://geeks-for-geeks-api.vercel.app https://www.geeksforgeeks.org https://vitals.vercel-insights.com https://*.upstash.io;
  frame-src 'self' https://*.firebaseapp.com https://accounts.google.com;
  frame-ancestors 'none';
  object-src 'none';
  base-uri 'self';
  form-action 'self';
`
  .replace(/\s{2,}/g, " ")
  .trim();

const securityHeaders = [
  {
    key: "Content-Security-Policy",
    value: ContentSecurityPolicy,
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "X-Frame-Options",
    value: "DENY",
  },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  },
];

const nextConfig = {
  reactStrictMode: false,
  compress: true,
  poweredByHeader: false,
  experimental: {
    optimizePackageImports: ["lucide-react", "canvas-confetti", "jose", "firebase"],
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

module.exports = nextConfig;
