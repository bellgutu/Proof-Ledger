import type {NextConfig} from 'next';

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
    CRYTOPANIC_API_KEY: process.env.CRYTOPANIC_API_KEY,
    // Note: LOCAL_PRIVATE_KEY is a server-side variable and should not be exposed here.
    // It is loaded directly via dotenv on the server.
    NEXT_PUBLIC_PERPETUALS_CONTRACT_ADDRESS: process.env.NEXT_PUBLIC_PERPETUALS_CONTRACT_ADDRESS,
    NEXT_PUBLIC_DEX_ROUTER: process.env.NEXT_PUBLIC_DEX_ROUTER,
    NEXT_PUBLIC_VAULT_CONTRACT_ADDRESS: process.env.NEXT_PUBLIC_VAULT_CONTRACT_ADDRESS,
    NEXT_PUBLIC_GOVERNOR_CONTRACT_ADDRESS: process.env.NEXT_PUBLIC_GOVERNOR_CONTRACT_ADDRESS,
    NEXT_PUBLIC_USDT_CONTRACT_ADDRESS: process.env.NEXT_PUBLIC_USDT_CONTRACT_ADDRESS,
    NEXT_PUBLIC_USDC_CONTRACT_ADDRESS: process.env.NEXT_PUBLIC_USDC_CONTRACT_ADDRESS,
    NEXT_PUBLIC_WETH_CONTRACT_ADDRESS: process.env.NEXT_PUBLIC_WETH_CONTRACT_ADDRESS,
    NEXT_PUBLIC_LINK_CONTRACT_ADDRESS: process.env.NEXT_PUBLIC_LINK_CONTRACT_ADDRESS,
    NEXT_PUBLIC_BNB_CONTRACT_ADDRESS: process.env.NEXT_PUBLIC_BNB_CONTRACT_ADDRESS,
    NEXT_PUBLIC_SOL_CONTRACT_ADDRESS: process.env.NEXT_PUBLIC_SOL_CONTRACT_ADDRESS,
  }
};

export default nextConfig;
