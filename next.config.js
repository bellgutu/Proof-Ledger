
/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
        {
            protocol: 'https',
            hostname: 'avatars.githubusercontent.com',
        },
        {
            protocol: 'https',
            hostname: 'picsum.photos',
        }
    ],
  },
  webpack: (config) => {
    config.externals.push("pino-pretty", "lokijs", "encoding");
    config.watchOptions = {
      poll: 1000,
      aggregateTimeout: 300,
    }
    return config;
  },
};

module.exports = nextConfig;
