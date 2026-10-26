import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
