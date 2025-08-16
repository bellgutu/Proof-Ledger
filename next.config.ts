import type {NextConfig} from 'next';
import {config} from 'dotenv';

config({ path: '.env' });

const nextConfig: NextConfig = {
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
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'assets.coingecko.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'api.coingecko.com',
        port: '',
        pathname: '/**',
      }
    ],
  },
   async redirects() {
    return [
      {
        source: '/markets',
        destination: '/',
        permanent: true,
      },
    ]
  },
  env: {
    NEXT_PUBLIC_USDT_CONTRACT_ADDRESS: process.env.USDT_CONTRACT_ADDRESS,
    NEXT_PUBLIC_USDC_CONTRACT_ADDRESS: process.env.USDC_CONTRACT_ADDRESS,
    NEXT_PUBLIC_WETH_CONTRACT_ADDRESS: process.env.WETH_CONTRACT_ADDRESS,
    NEXT_PUBLIC_LINK_CONTRACT_ADDRESS: process.env.LINK_CONTRACT_ADDRESS,
    NEXT_PUBLIC_PERPETUALS_CONTRACT_ADDRESS: process.env.PERPETUALS_CONTRACT_ADDRESS,
    NEXT_PUBLIC_VAULT_CONTRACT_ADDRESS: process.env.VAULT_CONTRACT_ADDRESS,
    NEXT_PUBLIC_PRICE_ORACLE_ADDRESS: process.env.PRICE_ORACLE_ADDRESS,
    CRYTOPANIC_API_KEY: process.env.CRYTOPANIC_API_KEY,
  }
};

export default nextConfig;
