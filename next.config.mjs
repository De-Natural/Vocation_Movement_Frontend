/**
 * Where the NestJS API lives. Server-side only (not exposed to the browser).
 * The browser always calls same-origin `/api/*`; Next.js proxies it here.
 * That keeps the backend's SameSite=Strict refresh cookie first-party and
 * lets the edge middleware see the `vm_role` session cookie, in dev and prod.
 */
const BACKEND_URL = (process.env.BACKEND_URL || "http://localhost:4000").replace(/\/$/, "");

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
  async rewrites() {
    return [
      { source: "/api/:path*", destination: `${BACKEND_URL}/api/:path*` },
      // Uploaded files served by the backend's local storage stub.
      { source: "/storage/:path*", destination: `${BACKEND_URL}/storage/:path*` },
    ];
  },
};

export default nextConfig;
