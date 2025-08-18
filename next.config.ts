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
    NEXT_PUBLIC_USDT_CONTRACT_ADDRESS: process.env.NEXT_PUBLIC_USDT_CONTRACT_ADDRESS,
    NEXT_PUBLIC_USDC_CONTRACT_ADDRESS: process.env.NEXT_PUBLIC_USDC_CONTRACT_ADDRESS,
    NEXT_PUBLIC_WETH_CONTRACT_ADDRESS: process.env.NEXT_PUBLIC_WETH_CONTRACT_ADDRESS,
    NEXT_PUBLIC_LINK_CONTRACT_ADDRESS: process.env.NEXT_PUBLIC_LINK_CONTRACT_ADDRESS,
    NEXT_PUBLIC_BNB_CONTRACT_ADDRESS: process.env.NEXT_PUBLIC_BNB_CONTRACT_ADDRESS,
    NEXT_PUBLIC_SOL_CONTRACT_ADDRESS: process.env.NEXT_PUBLIC_SOL_CONTRACT_ADDRESS,
    NEXT_PUBLIC_PERPETUALS_CONTRACT_ADDRESS: process.env.NEXT_PUBLIC_PERPETUALS_CONTRACT_ADDRESS,
    NEXT_PUBLIC_VAULT_CONTRACT_ADDRESS: process.env.NEXT_PUBLIC_VAULT_CONTRACT_ADDRESS,
    NEXT_PUBLIC_PRICE_ORACLE_ADDRESS: process.env.NEXT_PUBLIC_PRICE_ORACLE_ADDRESS,
    NEXT_PUBLIC_DEX_ROUTER_ADDRESS: process.env.NEXT_PUBLIC_DEX_ROUTER_ADDRESS,
    NEXT_PUBLIC_DEX_FACTORY_ADDRESS: process.env.NEXT_PUBLIC_DEX_FACTORY_ADDRESS,
    NEXT_PUBLIC_POOL_DEPLOYER_ADDRESS: process.env.NEXT_PUBLIC_POOL_DEPLOYER_ADDRESS,
    NEXT_PUBLIC_TREASURY_ADDRESS: process.env.NEXT_PUBLIC_TREASURY_ADDRESS,
    CRYTOPANIC_API_KEY: process.env.CRYTOPANIC_API_KEY,
    LOCAL_PRIVATE_KEY: process.env.LOCAL_PRIVATE_KEY,
  }
};

export default nextConfig;
