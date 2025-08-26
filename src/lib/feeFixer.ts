
import { createWalletClient, custom, http, defineChain, getContract, Address, PublicClient, WalletClient, createPublicClient } from 'viem';
import { localhost } from 'viem/chains';

// --- CONTRACTS & ABI ---

const TREASURY_ADDRESS = process.env.NEXT_PUBLIC_TREASURY_ADDRESS as Address;
const FACTORY_ADDRESS = process.env.NEXT_PUBLIC_DEX_FACTORY_ADDRESS as Address;

const FACTORY_ABI = [
    { type: 'function', name: 'feeTo', view: true, inputs: [], outputs: [{ name: '', type: 'address' }] },
    { type: 'function', name: 'setFeeTo', inputs: [{ name: '_feeTo', type: 'address' }], outputs: [] },
] as const;

const anvilChain = defineChain({ ...localhost, id: 31337 });

let walletClient: WalletClient | null = null;
const publicClient = createPublicClient({
    chain: anvilChain,
    transport: http(),
});

export async function connect(): Promise<Address> {
    if (!window.ethereum) {
        throw new Error("Browser wallet (like MetaMask) not installed");
    }

    walletClient = createWalletClient({
        chain: anvilChain,
        transport: custom(window.ethereum),
    });

    const [address] = await walletClient.requestAddresses();
    if (!address) {
        throw new Error("Failed to get wallet address.");
    }

    return address;
}

export function isWalletConnected(): boolean {
    return !!walletClient;
}

export async function getFactoryFeeTo(): Promise<Address | 'Error'> {
    if (!FACTORY_ADDRESS) {
        console.error("Factory address is not set in environment variables.");
        return 'Error';
    }
    try {
        const feeTo = await publicClient.readContract({
            address: FACTORY_ADDRESS,
            abi: FACTORY_ABI,
            functionName: 'feeTo',
        });
        return feeTo;
    } catch (e) {
        console.error("Error fetching factory feeTo:", e);
        return 'Error';
    }
}

export async function setFactoryFeeTo(feeRecipient: Address = TREASURY_ADDRESS): Promise<{hash: Address}> {
    if (!walletClient) {
        throw new Error("Wallet not connected.");
    }
    if (!FACTORY_ADDRESS || !TREASURY_ADDRESS) {
        throw new Error("Contract addresses are not configured in environment variables.");
    }
    
    const [account] = await walletClient.getAddresses();
    
    const { request } = await publicClient.simulateContract({
        account,
        address: FACTORY_ADDRESS,
        abi: FACTORY_ABI,
        functionName: 'setFeeTo',
        args: [feeRecipient],
    });
    
    const hash = await walletClient.writeContract(request);
    await publicClient.waitForTransactionReceipt({ hash });
    return { hash };
}
