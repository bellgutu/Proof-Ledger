
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
    'USDT': { address: '0xF48883F2ae4C4bf4654f45997fE47D73daA4da07', decimals: 18 },
    'USDC': { address: '0x093D305366218D6d09bA10448922F10814b031dd', decimals: 18 },
    'WETH': { address: '0x492844c46CEf2d751433739fc3409B7A4a5ba9A7', decimals: 18 },
    'LINK': { address: '0xf0F5e9b00b92f3999021fD8B88aC75c351D93fc7', decimals: 18 },
    'BNB': { address: '0xDC0a0B1Cd093d321bD1044B5e0Acb71b525ABb6b', decimals: 18 },
    'SOL': { address: '0x810090f35DFA6B18b5EB59d298e2A2443a2811E2', decimals: 18 },
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
