import { ethers } from 'ethers';
import { config } from 'dotenv';
import { POLYMARKET_ABI } from '../polymarket-abi.js';

config();

const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;
const OPERATOR_PRIVATE_KEY = process.env.OPERATOR_PRIVATE_KEY;
const RPC_URL = process.env.RPC_URL;

async function deregisterOperator() {
    try {
        const provider = new ethers.JsonRpcProvider(RPC_URL);
        const signer = new ethers.Wallet(OPERATOR_PRIVATE_KEY, provider);
        const contract = new ethers.Contract(CONTRACT_ADDRESS, POLYMARKET_ABI, signer);

        const operatorAddress = signer.address;
        console.log(`Deregistering operator: ${operatorAddress}`);

        console.log('Calling deregisterOperatorFromAVS...');
        const tx = await contract.deregisterOperatorFromAVS(operatorAddress);
        
        console.log(`Transaction hash: ${tx.hash}`);
        console.log('Waiting for confirmation...');
        
        const receipt = await tx.wait();
        console.log(`Transaction confirmed in block: ${receipt.blockNumber}`);
        console.log('Operator deregistered successfully!');

    } catch (error) {
        console.error('Error deregistering operator:', error.message);
        if (error.reason) {
            console.error('Revert reason:', error.reason);
        }
    }
}

deregisterOperator();