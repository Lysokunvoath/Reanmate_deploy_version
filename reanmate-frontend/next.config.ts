import type { NextConfig } from "next";

const apiUrl = (process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000").replace(/\/$/, "");

const nextConfig: NextConfig = {
  // Browser requests to /api/* are proxied to the NestJS backend, so auth
  // cookies are set on this site's own domain (frontend and backend can live
  // on different hosts, e.g. two Vercel projects).
  async rewrites() {
    return [{ source: "/api/:path*", destination: `${apiUrl}/:path*` }];
  },
  experimental: {
    // Gemini chapter generation can take longer than the 30 s proxy default.
    proxyTimeout: 120_000,
  },
};

export default nextConfig;
