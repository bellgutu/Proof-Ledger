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
    NEXT_PUBLIC_USDT_CONTRACT_ADDRESS: '0xF48883F2ae4C4bf4654f45997fE47D73daA4da07',
    NEXT_PUBLIC_USDC_CONTRACT_ADDRESS: '0x093D305366218D6d09bA10448922F10814b031dd',
    NEXT_PUBLIC_WETH_CONTRACT_ADDRESS: '0x492844c46CEf2d751433739fc3409B7A4a5ba9A7',
    NEXT_PUBLIC_LINK_CONTRACT_ADDRESS: '0xf0F5e9b00b92f3999021fD8B88aC75c351D93fc7',
    NEXT_PUBLIC_BNB_CONTRACT_ADDRESS: '0xDC0a0B1Cd093d321bD1044B5e0Acb71b525ABb6b',
    NEXT_PUBLIC_SOL_CONTRACT_ADDRESS: '0x810090f35DFA6B18b5EB59d298e2A2443a2811E2',
    NEXT_PUBLIC_PERPETUALS_CONTRACT_ADDRESS: process.env.PERPETUALS_CONTRACT_ADDRESS,
    NEXT_PUBLIC_VAULT_CONTRACT_ADDRESS: process.env.VAULT_CONTRACT_ADDRESS,
    NEXT_PUBLIC_PRICE_ORACLE_ADDRESS: process.env.PRICE_ORACLE_ADDRESS,
    NEXT_PUBLIC_DEX_ROUTER_ADDRESS: process.env.DEX_ROUTER_ADDRESS,
    NEXT_PUBLIC_DEX_FACTORY_ADDRESS: process.env.DEX_FACTORY_ADDRESS,
    NEXT_PUBLIC_POOL_DEPLOYER_ADDRESS: process.env.POOL_DEPLOYER_ADDRESS,
    NEXT_PUBLIC_TREASURY_ADDRESS: process.env.TREASURY_ADDRESS,
    CRYTOPANIC_API_KEY: process.env.CRYTOPANIC_API_KEY,
  }
};

export default nextConfig;
