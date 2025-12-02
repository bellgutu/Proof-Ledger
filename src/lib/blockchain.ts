
'use client';

import { ethers, BrowserProvider, Contract, type Signer } from 'ethers';
import { contracts, type AppContracts } from '@/config/contracts';

/**
 * Gets the ethers provider. In a browser environment, this will be the window.ethereum provider.
 * @returns A BrowserProvider instance, or null if window.ethereum is not available.
 */
export function getProvider(): BrowserProvider | null {
    if (typeof window === 'undefined' || !window.ethereum) {
        console.error("No ethereum provider found. Please install MetaMask or another wallet.");
        return null;
    }
    return new ethers.BrowserProvider(window.ethereum);
}

/**
 * Gets the signer from the provider, which represents the connected user's account.
 * @param provider A BrowserProvider instance.
 * @returns A Signer instance.
 */
export async function getSigner(provider: BrowserProvider): Promise<Signer> {
    return provider.getSigner();
}

/**
 * Gets a contract instance that is connected to a signer, allowing for transactions.
 * @param contractName The name of the contract as defined in the `contracts` config.
 * @param provider A BrowserProvider instance.
 * @returns A Contract instance connected to the user's signer.
 */
export async function getContract(contractName: keyof AppContracts, provider: BrowserProvider): Promise<Contract | null> {
    const signer = await getSigner(provider);
    if (!signer) {
        console.error("Could not get signer");
        return null;
    }
    
    const contractConfig = contracts[contractName];
    if (!contractConfig) {
        console.error(`Contract ${contractName} not found in config`);
        return null;
    }

    return new ethers.Contract(contractConfig.address, contractConfig.abi, signer);
}

/**
* Listens for a specific event on a contract.
* @param contractName The name of the contract.
* @param eventName The name of the event to listen for.
* @param callback The function to execute when the event is emitted.
* @param provider A BrowserProvider instance.
* @returns A function to unsubscribe from the event.
*/
export async function listenToEvent(
    contractName: keyof AppContracts,
    eventName: string,
    callback: (...args: any[]) => void,
    provider: BrowserProvider
): Promise<() => void> {
    const contractConfig = contracts[contractName];
     if (!contractConfig) {
        console.error(`Contract ${contractName} not found in config`);
        return () => {};
    }
    const contract = new Contract(contractConfig.address, contractConfig.abi, provider);

    if (contract) {
        contract.on(eventName, callback);
        
        // Return an unsubscribe function
        return () => {
            contract.off(eventName, callback);
        };
    }

    // Return a no-op if the contract doesn't exist
    return () => {};
}
