import { ethers } from 'ethers';
import { config } from 'dotenv';
import { POLYMARKET_ABI } from '../polymarket-abi.js';

config();

const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const RPC_URL = process.env.RPC_URL;

async function claimWinnings() {
    try {
        const provider = new ethers.JsonRpcProvider(RPC_URL);
        const signer = new ethers.Wallet(PRIVATE_KEY, provider);
        const contract = new ethers.Contract(CONTRACT_ADDRESS, POLYMARKET_ABI, signer);

        // Claim parameters
        const marketId = 0; // First market created

        console.log('Claiming winnings with parameters:');
        console.log(`Market ID: ${marketId}`);
        console.log(`User: ${signer.address}`);

        // Check user's balance before claiming
        const balanceBefore = await provider.getBalance(signer.address);
        console.log(`Balance before claim: ${ethers.utils.formatEther(balanceBefore)} ETH`);

        console.log('Calling claimWinnings...');
        const tx = await contract.claimWinnings(marketId);
        
        console.log(`Transaction hash: ${tx.hash}`);
        console.log('Waiting for confirmation...');
        
        const receipt = await tx.wait();
        console.log(`Transaction confirmed in block: ${receipt.blockNumber}`);
        
        // Check user's balance after claiming
        const balanceAfter = await provider.getBalance(signer.address);
        console.log(`Balance after claim: ${ethers.utils.formatEther(balanceAfter)} ETH`);
        
        const winnings = balanceAfter.sub(balanceBefore).add(receipt.gasUsed.mul(receipt.effectiveGasPrice));
        console.log(`Winnings claimed: ${ethers.utils.formatEther(winnings)} ETH`);
        console.log(`Gas used: ${receipt.gasUsed} (${ethers.utils.formatEther(receipt.gasUsed.mul(receipt.effectiveGasPrice))} ETH)`);
        
        console.log('Winnings claimed successfully!');

    } catch (error) {
        console.error('Error claiming winnings:', error.message);
        if (error.reason) {
            console.error('Revert reason:', error.reason);
        }
    }
}

claimWinnings();