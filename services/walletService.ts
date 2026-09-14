import { ethers } from 'ethers';

export interface AgentWallet {
    address: string;
    privateKey: string;
    balance: string;
    network: string;
}

const STORAGE_KEY = 'mz_agent_wallet_v1';

export class WalletService {
    static getOrCreateWallet(): AgentWallet {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            return JSON.parse(stored);
        }

        // Generate a new random Ethereum wallet for the swarm
        const wallet = ethers.Wallet.createRandom();
        
        const newWallet: AgentWallet = {
            address: wallet.address,
            privateKey: wallet.privateKey,
            balance: "0.00",
            network: "Ethereum Mainnet (Simulation)",
        };

        localStorage.setItem(STORAGE_KEY, JSON.stringify(newWallet));
        return newWallet;
    }

    static async getRealBalance(address: string): Promise<string> {
        try {
            const provider = new ethers.JsonRpcProvider('https://polygon-rpc.com');
            const balance = await provider.getBalance(address);
            return ethers.formatEther(balance);
        } catch (error) {
            return "0.00";
        }
    }

    static async approveTradeAllowance(amount: number): Promise<boolean> {
        // Simulate smart contract approval for the Economic Swarm
        console.log(`[Swarm Contract] Approved ${amount} ETH for autonomic trading.`);
        return true;
    }

    static async sendTransaction(privateKey: string, to: string, amount: string): Promise<string> {
        try {
            const provider = new ethers.JsonRpcProvider('https://polygon-rpc.com');
            const wallet = new ethers.Wallet(privateKey, provider);
            const value = ethers.parseEther(amount);
            
            const tx = await wallet.sendTransaction({
                to: to,
                value: value
            });
            
            return tx.hash;
        } catch (error: any) {
            throw new Error(error.shortMessage || "Failed to send transaction");
        }
    }

    static async callContractWithdraw(privateKey: string, contractAddress: string): Promise<string> {
        try {
            const provider = new ethers.JsonRpcProvider('https://polygon-rpc.com');
            const wallet = new ethers.Wallet(privateKey, provider);
            
            const abi = [
                "function withdrawNative() public onlyOwner"
            ];
            
            const contract = new ethers.Contract(contractAddress, abi, wallet);
            const tx = await contract.withdrawNative();
            
            return tx.hash;
        } catch (error: any) {
            console.error("Withdraw Error:", error);
            throw new Error(error.shortMessage || error.message || "Failed to call withdrawNative");
        }
    }
}
