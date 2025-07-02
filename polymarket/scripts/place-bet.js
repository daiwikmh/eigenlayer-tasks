import { ethers } from 'ethers';
import { config } from 'dotenv';
import { POLYMARKET_ABI } from '../polymarket-abi.js';

config();

const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const RPC_URL = process.env.RPC_URL;

async function placeBet() {
    try {
        // Validate environment variables
        if (!CONTRACT_ADDRESS || !PRIVATE_KEY || !RPC_URL) {
            throw new Error('Missing environment variables');
        }

        const provider = new ethers.JsonRpcProvider(RPC_URL);
        const signer = new ethers.Wallet(PRIVATE_KEY, provider);
        const contract = new ethers.Contract(CONTRACT_ADDRESS, POLYMARKET_ABI, signer);

        // Bet parameters
        const marketId = 0; // First market created
        const outcomeIndex = 0; // Betting on first outcome
        const betAmount = ethers.parseEther("0.1"); // 0.1 ETH

        console.log('Placing bet with parameters:');
        console.log(`Market ID: ${marketId}`);
        console.log(`Outcome Index: ${outcomeIndex}`);
        console.log(`Bet Amount: ${ethers.formatEther(betAmount)} ETH`);

        console.log('Calling placeBet...');
        const tx = await contract.placeBet(marketId, outcomeIndex, {
            value: betAmount
        });

        console.log(`Transaction hash: ${tx.hash}`);
        console.log('Waiting for confirmation...');

        const receipt = await tx.wait();
        console.log(`Transaction confirmed in block: ${receipt.blockNumber}`);

        // Parse events to get bet details
        const betPlacedEvent = receipt.logs.find(log => {
            try {
                const parsed = contract.interface.parseLog(log);
                return parsed.name === 'BetPlaced';
            } catch {
                return false;
            }
        });

        if (betPlacedEvent) {
            const parsed = contract.interface.parseLog(betPlacedEvent);
            console.log(`Bet placed successfully!`);
            console.log(`Market ID: ${parsed.args.marketId}`);
            console.log(`User: ${parsed.args.user}`);
            console.log(`Outcome Index: ${parsed.args.outcomeIndex}`);
            console.log(`Amount: ${ethers.formatEther(parsed.args.amount)} ETH`);
            console.log(`Shares Received: ${parsed.args.shares}`);
        } else {
            console.log('Bet placed successfully!');
        }

    } catch (error) {
        console.error('Error placing bet:', error.message);
        if (error.reason) {
            console.error('Revert reason:', error.reason);
        }
    }
}

placeBet();