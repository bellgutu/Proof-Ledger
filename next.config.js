
/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  transpilePackages: ['@web3modal/ethers', 'ethers'],
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
};

module.exports = nextConfig;
