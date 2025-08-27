import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const isValidAddress = (address: string | null | undefined): address is `0x${string}` => {
    return address !== null && 
           address !== undefined && 
           /^0x[a-fA-F0-9]{40}$/.test(address);
};
