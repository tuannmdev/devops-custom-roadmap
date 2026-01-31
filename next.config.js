/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ["@supabase/supabase-js"]
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.supabase.co",
        pathname: "/storage/v1/object/public/**"
      }
    ]
  },
  compress: true,
  swcMinify: true,
  reactStrictMode: true
};

module.exports = nextConfig;
