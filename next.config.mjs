/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // PRD §8 — WebP, responsive; Unsplash placeholder imagery for the demo.
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
};

export default nextConfig;
