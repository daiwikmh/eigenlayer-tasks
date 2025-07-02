import { ethers } from 'ethers';
import { config } from 'dotenv';
import { POLYMARKET_ABI } from '../polymarket-abi.js';

config();

const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;
const RPC_URL = process.env.RPC_URL;

async function getMarketInfo() {
    try {
        const provider = new ethers.JsonRpcProvider(RPC_URL);
        const contract = new ethers.Contract(CONTRACT_ADDRESS, POLYMARKET_ABI, provider);

        // Market parameters
        const marketId = process.argv[2] ? parseInt(process.argv[2]) : 0;

        console.log(`Getting market info for Market ID: ${marketId}`);

        const marketInfo = await contract.getMarketInfo(marketId);
        
        console.log('\n=== MARKET INFORMATION ===');
        console.log(`Question: ${marketInfo.question}`);
        console.log(`Description: ${marketInfo.description}`);
        console.log(`Market Type: ${marketInfo.marketType}`);
        console.log(`Resolution Source: ${marketInfo.resolutionSource}`);
        // console.log(`End Time: ${new Date(marketInfo.endTime.toNumber() * 1000).toLocaleString()}`);
        // console.log(`Resolution Time: ${new Date(marketInfo.resolutionTime.toNumber() * 1000).toLocaleString()}`);
        console.log(`Resolved: ${marketInfo.resolved}`);
        console.log(`Winning Outcome: ${marketInfo.winningOutcome}`);
        // console.log(`Total Pool: ${ethers.utils.formatEther(marketInfo.totalPool)} ETH`);
        console.log(`Possible Outcomes:`);
        marketInfo.outcomes.forEach((outcome, index) => {
            console.log(`  ${index}: ${outcome}`);
        });

        if (marketInfo.resolved) {
            console.log(`\n🏆 WINNER: ${marketInfo.outcomes[marketInfo.winningOutcome]}`);
        }

    } catch (error) {
        console.error('Error getting market info:', error.message);
        if (error.reason) {
            console.error('Revert reason:', error.reason);
        }
    }
}

getMarketInfo();