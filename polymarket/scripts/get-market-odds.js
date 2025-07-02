import { ethers } from 'ethers';
import { config } from 'dotenv';
import { POLYMARKET_ABI } from '../polymarket-abi.js';

config();

const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;
const RPC_URL = process.env.RPC_URL;

async function getMarketOdds() {
    try {
        const provider = new ethers.JsonRpcProvider(RPC_URL);
        const contract = new ethers.Contract(CONTRACT_ADDRESS, POLYMARKET_ABI, provider);

        // Market parameters
        const marketId = process.argv[2] ? parseInt(process.argv[2]) : 0;

        console.log(`Getting market odds for Market ID: ${marketId}`);

        // Get market info first to get outcome names
        const marketInfo = await contract.getMarketInfo(marketId);
        const odds = await contract.getMarketOdds(marketId);
        
        console.log('\n=== MARKET ODDS ===');
        console.log(`Market: ${marketInfo.question}`);
        console.log(`Total Pool: ${ethers.utils.formatEther(marketInfo.totalPool)} ETH`);
        console.log();
        
        odds.forEach((odd, index) => {
            const percentage = (odd.toNumber() / 100).toFixed(2);
            const probability = (odd.toNumber() / 10000 * 100).toFixed(2);
            console.log(`${index}: ${marketInfo.outcomes[index]}`);
            console.log(`   Odds: ${percentage}% (${probability}% probability)`);
            console.log();
        });

        // Show total to verify it adds up to 100%
        const totalPercentage = odds.reduce((sum, odd) => sum + odd.toNumber(), 0) / 100;
        console.log(`Total: ${totalPercentage.toFixed(2)}%`);

    } catch (error) {
        console.error('Error getting market odds:', error.message);
        if (error.reason) {
            console.error('Revert reason:', error.reason);
        }
    }
}

getMarketOdds();