import { ethers } from 'ethers';
import { config } from 'dotenv';
import { POLYMARKET_ABI } from '../polymarket-abi.js';

config();

const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;
const OPERATOR_PRIVATE_KEY = process.env.OPERATOR_PRIVATE_KEY;
const RPC_URL = process.env.RPC_URL;

async function resolveMarket() {
    try {
        const provider = new ethers.JsonRpcProvider(RPC_URL);
        const signer = new ethers.Wallet(OPERATOR_PRIVATE_KEY, provider);
        const contract = new ethers.Contract(CONTRACT_ADDRESS, POLYMARKET_ABI, signer);

        // Resolution parameters
        const marketId = 0;
        const referenceTaskIndex = 0; // First resolution task created
        const winningOutcomeIndex = 0; // First outcome wins
        
        // Create the task structure that matches what was stored
        const task = {
            marketId: marketId,
            question: "Who will win the 2024 US Presidential Election?", // Should match actual market
            description: "This market will resolve to the candidate who wins the 2024 US Presidential Election",
            marketType: 1, // CATEGORICAL
            possibleOutcomes: ["Donald Trump", "Joe Biden", "Other"],
            resolutionSource: 1, // CONSENSUS
            resolutionCriteria: ethers.utils.toUtf8Bytes(
                "Market will be resolved based on official election results as reported by major news sources (CNN, BBC, Reuters) and confirmed by electoral authorities."
            ),
            taskCreatedBlock: 1 // This should be the actual block number from the task creation
        };

        // Create signature for the resolution
        const messageHash = ethers.utils.keccak256(
            ethers.utils.solidityPack(
                ['uint256', 'uint32', 'string'],
                [winningOutcomeIndex, task.marketId, task.question]
            )
        );
        
        const signature = await signer.signMessage(ethers.utils.arrayify(messageHash));

        console.log('Resolving market with parameters:');
        console.log(`Market ID: ${marketId}`);
        console.log(`Reference Task Index: ${referenceTaskIndex}`);
        console.log(`Winning Outcome Index: ${winningOutcomeIndex}`);
        console.log(`Operator: ${signer.address}`);
        console.log(`Task Question: ${task.question}`);
        console.log(`Winning Outcome: ${task.possibleOutcomes[winningOutcomeIndex]}`);

        console.log('Calling resolveMarket...');
        const tx = await contract.resolveMarket(
            task,
            referenceTaskIndex,
            winningOutcomeIndex,
            signature
        );
        
        console.log(`Transaction hash: ${tx.hash}`);
        console.log('Waiting for confirmation...');
        
        const receipt = await tx.wait();
        console.log(`Transaction confirmed in block: ${receipt.blockNumber}`);
        
        // Parse events to get resolution details
        const marketResolvedEvent = receipt.logs.find(log => {
            try {
                const parsed = contract.interface.parseLog(log);
                return parsed.name === 'MarketResolved';
            } catch {
                return false;
            }
        });

        if (marketResolvedEvent) {
            const parsed = contract.interface.parseLog(marketResolvedEvent);
            console.log(`Market resolved successfully!`);
            console.log(`Market ID: ${parsed.args.marketId}`);
            console.log(`Winning Outcome: ${parsed.args.winningOutcome}`);
            console.log(`Task Index: ${parsed.args.taskIndex}`);
            console.log(`Operator: ${parsed.args.operator}`);
        } else {
            console.log('Market resolved successfully!');
        }

    } catch (error) {
        console.error('Error resolving market:', error.message);
        if (error.reason) {
            console.error('Revert reason:', error.reason);
        }
    }
}

resolveMarket();