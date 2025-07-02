import { ethers } from 'ethers';
import { config } from 'dotenv';
import { POLYMARKET_ABI } from '../polymarket-abi.js';

config();

const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const RPC_URL = process.env.RPC_URL;

async function getUserShares() {
    try {
        const provider = new ethers.JsonRpcProvider(RPC_URL);
        const signer = new ethers.Wallet(PRIVATE_KEY, provider);
        const contract = new ethers.Contract(CONTRACT_ADDRESS, POLYMARKET_ABI, provider);

        // Parameters
        const marketId = process.argv[2] ? parseInt(process.argv[2]) : 0;
        const userAddress = process.argv[3] || signer.address;
        const outcomeIndex = process.argv[4] ? parseInt(process.argv[4]) : null;

        console.log(`Getting user shares for:`);
        console.log(`Market ID: ${marketId}`);
        console.log(`User: ${userAddress}`);

        // Get market info first to get outcome names
        const marketInfo = await contract.getMarketInfo(marketId);
        
        console.log(`\n=== USER POSITION ===`);
        console.log(`Market: ${marketInfo.question}`);
        console.log(`User: ${userAddress}`);
        console.log();

        if (outcomeIndex !== null) {
            // Get shares for specific outcome
            const shares = await contract.getUserShares(marketId, userAddress, outcomeIndex);
            console.log(`Outcome ${outcomeIndex} (${marketInfo.outcomes[outcomeIndex]}):`);
            console.log(`  Shares: ${shares}`);
        } else {
            // Get shares for all outcomes
            console.log('Shares by outcome:');
            let totalShares = ethers.BigNumber.from(0);
            
            for (let i = 0; i < marketInfo.outcomes.length; i++) {
                const shares = await contract.getUserShares(marketId, userAddress, i);
                console.log(`  ${i}: ${marketInfo.outcomes[i]} - ${shares} shares`);
                totalShares = totalShares.add(shares);
            }
            
            console.log(`\nTotal shares: ${totalShares}`);
            
            if (marketInfo.resolved && totalShares.gt(0)) {
                const winningShares = await contract.getUserShares(marketId, userAddress, marketInfo.winningOutcome);
                if (winningShares.gt(0)) {
                    console.log(`\n🏆 You have ${winningShares} winning shares in "${marketInfo.outcomes[marketInfo.winningOutcome]}"!`);
                    console.log('You can claim your winnings using the claim-winnings script.');
                } else {
                    console.log(`\n❌ No winning shares. The winning outcome was "${marketInfo.outcomes[marketInfo.winningOutcome]}".`);
                }
            }
        }

    } catch (error) {
        console.error('Error getting user shares:', error.message);
        if (error.reason) {
            console.error('Revert reason:', error.reason);
        }
    }
}

getUserShares();