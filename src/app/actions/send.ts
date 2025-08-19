
'use server';

import { config } from 'dotenv';
import path from 'path';
import { parseUnits } from 'viem';
import { createWalletClient, http, parseAbi } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { localhost } from 'viem/chains';

config({ path: path.resolve(process.cwd(), 'src/.env') });

const LOCAL_CHAIN_RPC_URL = 'http://host.docker.internal:8545';

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

const ERC20_CONTRACTS: { [symbol: string]: { address: `0x${string}` | undefined, decimals: number } } = {
    'USDT': { address: '0xf48883f2ae4c4bf4654f45997fe47d73daa4da07', decimals: 18 },
    'USDC': { address: '0x093d305366218d6d09ba10448922f10814b031dd', decimals: 18 },
    'WETH': { address: '0x492844c46cef2d751433739fc3409b7a4a5ba9a7', decimals: 18 },
    'LINK': { address: '0xf0f5e9b00b92f3999021fd8b88ac75c351d93fc7', decimals: 18 },
    'BNB': { address: '0xdc0a0b1cd093d321bd1044b5e0acb71b525abb6b', decimals: 18 },
    'SOL': { address: '0x810090f35dfa6b18b5eb59d298e2a2443a2811e2', decimals: 18 },
};

export async function sendTokensAction(
  toAddress: string,
  tokenSymbol: string,
  amount: number,
): Promise<{ success: boolean; txHash: `0x${string}` }> {

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
      throw new Error(`Contract for ${tokenSymbol} is not configured.`);
    }
    const valueInSmallestUnit = parseUnits(amount.toString(), contractInfo.decimals);
    
    txHash = await client.writeContract({
        account,
        address: contractInfo.address,
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
