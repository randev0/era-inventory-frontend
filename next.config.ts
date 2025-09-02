import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        // Apply CORS headers to all API routes
        source: '/api/:path*',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: '*',
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET,POST,PUT,DELETE,OPTIONS',
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Content-Type,Authorization,X-Org-Override',
          },
        ],
      },
    ];
  },
  async rewrites() {
    return [
      {
        source: '/api/backend/:path*',
        destination: 'http://localhost:8080/:path*',
      },
    ];
  },
  env: {
    NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL,
  },
};

export default nextConfig;
