import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'qpnbrexgsalqrjohbihz.supabase.co',
        pathname: '/storage/**',
      },
    ],
  },
};

export default nextConfig;
