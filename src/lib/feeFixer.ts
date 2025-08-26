
import { createWalletClient, custom, http, defineChain, publicActions, getContract, Address, PublicClient, WalletClient, createPublicClient } from 'viem';
import { localhost } from 'viem/chains';

// --- CONTRACTS & ABI ---

const TREASURY_ADDRESS = process.env.NEXT_PUBLIC_TREASURY_ADDRESS as Address;
const FACTORY_ADDRESS = process.env.NEXT_PUBLIC_DEX_FACTORY_ADDRESS as Address;

const FACTORY_ABI = [
    { type: 'function', name: 'feeTo', view: true, inputs: [], outputs: [{ name: '', type: 'address' }] },
    { type: 'function', name: 'setFeeTo', inputs: [{ name: '_feeTo', type: 'address' }], outputs: [] }
] as const;

const anvilChain = defineChain({ ...localhost, id: 31337 });

class FeeFixer {
    private publicClient: PublicClient;
    private walletClient: WalletClient | null = null;
    private factoryContract: any = null;

    constructor() {
        this.publicClient = createPublicClient({
            chain: anvilChain,
            transport: http(),
        });
    }

    async connect(): Promise<Address> {
        if (!window.ethereum) {
            throw new Error("Browser wallet (like MetaMask) not installed");
        }

        this.walletClient = createWalletClient({
            chain: anvilChain,
            transport: custom(window.ethereum),
        });

        const [address] = await this.walletClient.requestAddresses();
        if (!address) {
            throw new Error("Failed to get wallet address.");
        }
        
        this.factoryContract = getContract({
            address: FACTORY_ADDRESS,
            abi: FACTORY_ABI,
            client: { public: this.publicClient, wallet: this.walletClient }
        });

        return address;
    }
    
    async getFactoryFeeTo(): Promise<Address | 'Error' | 'Not Connected'> {
        if (!this.factoryContract) return 'Not Connected';
        try {
            return await this.factoryContract.read.feeTo();
        } catch (e) {
            console.error("Error fetching factory feeTo:", e);
            return 'Error';
        }
    }

    async setFactoryFeeTo(feeRecipient: Address = TREASURY_ADDRESS): Promise<{hash: Address}> {
        if (!this.walletClient || !this.factoryContract) {
            throw new Error("Wallet not connected or contract not initialized.");
        }
        const [account] = await this.walletClient.getAddresses();
        
        const { request } = await this.publicClient.simulateContract({
            account,
            address: FACTORY_ADDRESS,
            abi: FACTORY_ABI,
            functionName: 'setFeeTo',
            args: [feeRecipient],
        });
        
        const hash = await this.walletClient.writeContract(request);
        await this.publicClient.waitForTransactionReceipt({ hash });
        return { hash };
    }
}

export default new FeeFixer();
