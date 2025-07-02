import { ethers } from 'ethers';
import { config } from 'dotenv';
import { POLYMARKET_ABI } from '../polymarket-abi.js';

config();

const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const RPC_URL = process.env.RPC_URL;

async function createMarket() {
    try {
        const provider = new ethers.JsonRpcProvider(RPC_URL);
        const signer = new ethers.Wallet(PRIVATE_KEY, provider);
        const contract = new ethers.Contract(CONTRACT_ADDRESS, POLYMARKET_ABI, signer);

        // Market parameters
        const question = "Who will win the 2024 US Presidential Election?";
        const description = "This market will resolve to the candidate who wins the 2024 US Presidential Election";
        const marketType = 1; // CATEGORICAL
        const resolutionSource = 1; // CONSENSUS
        const outcomes = ["Donald Trump", "Joe Biden", "Other"];
        const duration = 30 * 24 * 60 * 60; // 30 days in seconds
        const customData = ethers.utils.toUtf8Bytes("election-2024");

        console.log('Creating market with parameters:');
        console.log(`Question: ${question}`);
        console.log(`Description: ${description}`);
        console.log(`Market Type: ${marketType}`);
        console.log(`Resolution Source: ${resolutionSource}`);
        console.log(`Outcomes: ${outcomes.join(', ')}`);
        console.log(`Duration: ${duration} seconds`);

        console.log('Calling createMarket...');
        const tx = await contract.createMarket(
            question,
            description,
            marketType,
            resolutionSource,
            outcomes,
            duration,
            customData
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
            console.log(`Market created successfully with ID: ${parsed.args.marketId}`);
        } else {
            console.log('Market created successfully!');
        }

    } catch (error) {
        console.error('Error creating market:', error.message);
        if (error.reason) {
            console.error('Revert reason:', error.reason);
        }
    }
}

createMarket();