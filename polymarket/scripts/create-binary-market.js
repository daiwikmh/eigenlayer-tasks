import { ethers } from 'ethers';
import { config } from 'dotenv';
import { POLYMARKET_ABI } from '../polymarket-abi.js';

config();

const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const RPC_URL = process.env.RPC_URL;

async function createBinaryMarket() {
    try {
        const provider = new ethers.JsonRpcProvider(RPC_URL);
        const signer = new ethers.Wallet(PRIVATE_KEY, provider);
        const contract = new ethers.Contract(CONTRACT_ADDRESS, POLYMARKET_ABI, signer);

        // Binary market parameters
        const question = "Will Bitcoin reach $100,000 by end of 2024?";
        const description = "This market will resolve to YES if Bitcoin (BTC) reaches or exceeds $100,000 USD by December 31, 2024, 11:59 PM UTC";
        const duration = 90 * 24 * 60 * 60; // 90 days in seconds

        console.log('Creating binary market with parameters:');
        console.log(`Question: ${question}`);
        console.log(`Description: ${description}`);
        console.log(`Duration: ${duration} seconds`);

        console.log('Calling createBinaryMarket...');
        const tx = await contract.createBinaryMarket(
            question,
            description,
            duration
        );
        
        console.log(`Transaction hash: ${tx.hash}`);
        console.log('Waiting for confirmation...');
        
        const receipt = await tx.wait();
        console.log(`Transaction confirmed in block: ${receipt.blockNumber}`);
        
        // Parse events to get market ID
        const marketCreatedEvent = receipt.logs.find(log => {
            try {
                const parsed = contract.interface.parseLog(log);
                return parsed.name === 'MarketCreated';
            } catch {
                return false;
            }
        });

        if (marketCreatedEvent) {
            const parsed = contract.interface.parseLog(marketCreatedEvent);
            console.log(`Binary market created successfully with ID: ${parsed.args.marketId}`);
        } else {
            console.log('Binary market created successfully!');
        }

    } catch (error) {
        console.error('Error creating binary market:', error.message);
        if (error.reason) {
            console.error('Revert reason:', error.reason);
        }
    }
}

createBinaryMarket();