
'use server';

import { config } from 'dotenv';
import path from 'path';
import { parseUnits } from 'viem';
import { createWalletClient, http, parseAbi } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { localhost } from 'viem/chains';

config({ path: path.resolve(process.cwd(), 'src/.env') });

const LOCAL_CHAIN_RPC_URL = 'http://127.0.0.1:8545';

if (!process.env.LOCAL_PRIVATE_KEY) {
  throw new Error('FATAL: LOCAL_PRIVATE_KEY is not defined in the environment variables. Please check your .env file.');
}

const account = privateKeyToAccount(process.env.LOCAL_PRIVATE_KEY as `0x${string}`);

const client = createWalletClient({
  account,
  chain: localhost,
  transport: http(LOCAL_CHAIN_RPC_URL),
});

const erc20Abi = parseAbi([
    "function transfer(address to, uint256 amount) external returns (bool)"
]);

const ERC20_CONTRACTS: { [symbol: string]: { address: string | undefined, decimals: number } } = {
    'USDT': { address: process.env.NEXT_PUBLIC_USDT_CONTRACT_ADDRESS, decimals: 18 },
    'USDC': { address: process.env.NEXT_PUBLIC_USDC_CONTRACT_ADDRESS, decimals: 18 },
    'WETH': { address: process.env.NEXT_PUBLIC_WETH_CONTRACT_ADDRESS, decimals: 18 },
    'LINK': { address: process.env.NEXT_PUBLIC_LINK_CONTRACT_ADDRESS, decimals: 18 },
    'BNB': { address: process.env.NEXT_PUBLIC_BNB_CONTRACT_ADDRESS, decimals: 18 },
    'SOL': { address: process.env.NEXT_PUBLIC_SOL_CONTRACT_ADDRESS, decimals: 18 },
};

export async function sendTokensAction(
  toAddress: string,
  tokenSymbol: string,
  amount: number,
): Promise<{ success: boolean; txHash: string }> {

  const contractInfo = ERC20_CONTRACTS[tokenSymbol as keyof typeof ERC20_CONTRACTS];
  let txHash: `0x${string}`;

  if (tokenSymbol === 'ETH') {
    const valueInWei = parseUnits(amount.toString(), 18);
    txHash = await client.sendTransaction({
        account,
        to: toAddress as `0x${string}`,
        value: valueInWei
    });
  } else {
    if (!contractInfo || !contractInfo.address) {
      throw new Error(`Contract for ${tokenSymbol} is not configured in .env file.`);
    }
    const valueInSmallestUnit = parseUnits(amount.toString(), contractInfo.decimals);
    
    txHash = await client.writeContract({
        account,
        address: contractInfo.address as `0x${string}`,
        abi: erc20Abi,
        functionName: "transfer",
        args: [toAddress as `0x${string}`, valueInSmallestUnit]
    });
  }
  
  return {
    success: true,
    txHash: txHash,
  };
}
