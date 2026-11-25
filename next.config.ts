import type { NextConfig } from "next";
import EventEmitter from "node:events";

// Increase default max listeners to prevent false-positive warnings during concurrent stream pipes in development
if (EventEmitter.defaultMaxListeners < 30) {
  EventEmitter.defaultMaxListeners = 30;
}

const nextConfig: NextConfig = {
  // Disable Node.js server gzip compression. In production, reverse proxies/CDNs (Cloudflare, Nginx, Vercel)
  // handle compression much more efficiently, and in dev it avoids Gzip stream drain backpressure warnings.
  compress: false,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
    ],
  },
  async redirects() {
    return [
      {
        source: "/sitemap",
        destination: "/sitemap.xml",
        permanent: true,
      },
      {
        source: "/pressrelease",
        destination: "/press-release",
        permanent: true,
      },
      {
        source: "/gallery-album",
        destination: "/gallery/album",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
