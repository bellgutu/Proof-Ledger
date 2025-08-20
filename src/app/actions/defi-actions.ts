
'use server';

import { createWalletClient, custom, http, createPublicClient, parseUnits, getContract, formatUnits } from 'viem';
import { localhost } from 'viem/chains';
import { privateKeyToAccount } from 'viem/accounts';
import { ERC20_CONTRACTS, DEX_CONTRACT_ADDRESS, VAULT_CONTRACT_ADDRESS, GOVERNOR_CONTRACT_ADDRESS, DEX_ABI, VAULT_ABI, GOVERNOR_ABI } from '@/services/blockchain-service';

const localKey = process.env.LOCAL_PRIVATE_KEY;

if (!localKey) {
  throw new Error('LOCAL_PRIVATE_KEY is not set in the environment variables.');
}

const anvilChain = { ...localhost, id: 31337 };

const account = privateKeyToAccount(`0x${localKey}`);

const walletClient = createWalletClient({
  account,
  chain: anvilChain,
  transport: http(),
});

const publicClient = createPublicClient({
  chain: anvilChain,
  transport: http(),
});

const getDexContract = () => getContract({ address: DEX_CONTRACT_ADDRESS, abi: DEX_ABI, client: { public: publicClient, wallet: walletClient } });
const getVaultContract = () => getContract({ address: VAULT_CONTRACT_ADDRESS, abi: VAULT_ABI, client: { public: publicClient, wallet: walletClient } });
const getGovernorContract = () => getContract({ address: GOVERNOR_CONTRACT_ADDRESS, abi: GOVERNOR_ABI, client: { public: publicClient, wallet: walletClient } });


export async function swapTokensAction(
    fromToken: string,
    toToken: string,
    amountIn: number
): Promise<{ success: boolean; txHash: `0x${string}` }> {
    const fromTokenInfo = ERC20_CONTRACTS[fromToken];
    const dexContract = getDexContract();

    if (!fromTokenInfo || !fromTokenInfo.address) throw new Error("Unsupported fromToken");
   
    const amountInWei = parseUnits(amountIn.toString(), fromTokenInfo.decimals);

    // First, approve the DEX contract to spend the token
    const tokenContract = getContract({ address: fromTokenInfo.address, abi: ERC20_CONTRACTS.USDT.abi, client: { public: publicClient, wallet: walletClient } });
    
    const approveHash = await tokenContract.write.approve([DEX_CONTRACT_ADDRESS, amountInWei]);
    await publicClient.waitForTransactionReceipt({ hash: approveHash });

    // Then, perform the swap
    const toTokenAddress = fromToken === 'ETH' ? '0x0000000000000000000000000000000000000000' : (ERC20_CONTRACTS[toToken]?.address || '0x0000000000000000000000000000000000000000');

    const { request } = await publicClient.simulateContract({
        account,
        address: DEX_CONTRACT_ADDRESS,
        abi: DEX_ABI,
        functionName: 'swap',
        args: [fromTokenInfo.address, toTokenAddress, amountInWei],
    });

    const txHash = await walletClient.writeContract(request);
    
    return { success: true, txHash };
}


export async function depositToVaultAction(
    amount: number
): Promise<{ success: boolean; txHash: `0x${string}` }> {
    const wethInfo = ERC20_CONTRACTS['WETH'];
    if (!wethInfo || !wethInfo.address) throw new Error("WETH contract not found");
    
    const amountInWei = parseUnits(amount.toString(), wethInfo.decimals);
    
    // Approve Vault
    const tokenContract = getContract({ address: wethInfo.address, abi: wethInfo.abi, client: { public: publicClient, wallet: walletClient } });
    const approveHash = await tokenContract.write.approve([VAULT_CONTRACT_ADDRESS, amountInWei]);
    await publicClient.waitForTransactionReceipt({ hash: approveHash });
    
    // Deposit
    const { request } = await publicClient.simulateContract({
        account,
        address: VAULT_CONTRACT_ADDRESS,
        abi: VAULT_ABI,
        functionName: 'deposit',
        args: [amountInWei]
    });
    
    const txHash = await walletClient.writeContract(request);
    return { success: true, txHash };
}

export async function withdrawFromVaultAction(
    amount: number
): Promise<{ success: boolean; txHash: `0x${string}` }> {
    const wethInfo = ERC20_CONTRACTS['WETH'];
    if (!wethInfo) throw new Error("WETH contract not found");
    const amountInWei = parseUnits(amount.toString(), wethInfo.decimals);

    const { request } = await publicClient.simulateContract({
        account,
        address: VAULT_CONTRACT_ADDRESS,
        abi: VAULT_ABI,
        functionName: 'withdraw',
        args: [amountInWei]
    });
    
    const txHash = await walletClient.writeContract(request);
    return { success: true, txHash };
}

export async function voteOnProposalAction(
    proposalId: string,
    support: number
): Promise<{ success: boolean; txHash: `0x${string}` }> {
     const { request } = await publicClient.simulateContract({
        account,
        address: GOVERNOR_CONTRACT_ADDRESS,
        abi: GOVERNOR_ABI,
        functionName: 'castVote',
        args: [BigInt(proposalId), support]
    });

    const txHash = await walletClient.writeContract(request);
    return { success: true, txHash };
}
