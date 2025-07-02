import { ethers } from 'ethers';
import { config } from 'dotenv';
import { POLYMARKET_ABI } from '../polymarket-abi.js';

config();

const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;
const OPERATOR_PRIVATE_KEY = process.env.OPERATOR_PRIVATE_KEY;
const RPC_URL = process.env.RPC_URL;

async function registerOperator() {
    try {
        const provider = new ethers.JsonRpcProvider(RPC_URL);
        const signer = new ethers.Wallet(OPERATOR_PRIVATE_KEY, provider);
        const contract = new ethers.Contract(CONTRACT_ADDRESS, POLYMARKET_ABI, signer);

        const operatorAddress = signer.address;
        console.log(`Registering operator: ${operatorAddress}`);

        // Create a mock signature structure for testing
        const operatorSignature = {
            signature: ethers.utils.randomBytes(65), // Mock signature
            salt: ethers.utils.randomBytes(32),      // Mock salt
            expiry: Math.floor(Date.now() / 1000) + 3600 // 1 hour from now
        };

        console.log('Calling registerOperatorToAVS...');
        const tx = await contract.registerOperatorToAVS(operatorAddress, operatorSignature);
        
        console.log(`Transaction hash: ${tx.hash}`);
        console.log('Waiting for confirmation...');
        
        const receipt = await tx.wait();
        console.log(`Transaction confirmed in block: ${receipt.blockNumber}`);
        console.log('Operator registered successfully!');

    } catch (error) {
        console.error('Error registering operator:', error.message);
        if (error.reason) {
            console.error('Revert reason:', error.reason);
        }
    }
}

registerOperator();