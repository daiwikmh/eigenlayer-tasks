import { ethers } from 'ethers';
import { config } from 'dotenv';
import { POLYMARKET_ABI } from '../polymarket-abi.js';

config();

const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const RPC_URL = process.env.RPC_URL;

async function createResolutionTask() {
    try {
        const provider = new ethers.JsonRpcProvider(RPC_URL);
        const signer = new ethers.Wallet(PRIVATE_KEY, provider);
        const contract = new ethers.Contract(CONTRACT_ADDRESS, POLYMARKET_ABI, signer);

        // Resolution task parameters
        const marketId = 0; // First market created
        const resolutionCriteria = ethers.utils.toUtf8Bytes(
            "Market will be resolved based on official election results as reported by major news sources (CNN, BBC, Reuters) and confirmed by electoral authorities."
        );

        console.log('Creating resolution task with parameters:');
        console.log(`Market ID: ${marketId}`);
        console.log(`Resolution Criteria: ${ethers.utils.toUtf8String(resolutionCriteria)}`);

        console.log('Calling createResolutionTask...');
        const tx = await contract.createResolutionTask(marketId, resolutionCriteria);
        
        console.log(`Transaction hash: ${tx.hash}`);
        console.log('Waiting for confirmation...');
        
        const receipt = await tx.wait();
        console.log(`Transaction confirmed in block: ${receipt.blockNumber}`);
        
        // Parse events to get task details
        const taskCreatedEvent = receipt.logs.find(log => {
            try {
                const parsed = contract.interface.parseLog(log);
                return parsed.name === 'NewResolutionTask';
            } catch {
                return false;
            }
        });

        if (taskCreatedEvent) {
            const parsed = contract.interface.parseLog(taskCreatedEvent);
            console.log(`Resolution task created successfully!`);
            console.log(`Task Index: ${parsed.args.taskIndex}`);
            console.log(`Market ID: ${parsed.args.marketId}`);
            
            const task = parsed.args.task;
            console.log(`Task Details:`);
            console.log(`  Question: ${task.question}`);
            console.log(`  Description: ${task.description}`);
            console.log(`  Market Type: ${task.marketType}`);
            console.log(`  Possible Outcomes: ${task.possibleOutcomes.join(', ')}`);
            console.log(`  Resolution Source: ${task.resolutionSource}`);
            console.log(`  Task Created Block: ${task.taskCreatedBlock}`);
        } else {
            console.log('Resolution task created successfully!');
        }

    } catch (error) {
        console.error('Error creating resolution task:', error.message);
        if (error.reason) {
            console.error('Revert reason:', error.reason);
        }
    }
}

createResolutionTask();