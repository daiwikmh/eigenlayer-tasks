import { createPublicClient, createWalletClient, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { holesky } from 'viem/chains';
import 'dotenv/config';

const PRIVATE_KEY = '';

// Simplified ABI without complex types
const abi: any = [
  {
    type: 'function',
    name: 'createNewTask',
    inputs: [{ name: 'contents', type: 'string' }],
    outputs: [
      {
        type: 'tuple',
        components: [
          { name: 'contents', type: 'string' },
          { name: 'taskCreatedBlock', type: 'uint32' }
        ]
      }
    ],
    stateMutability: 'nonpayable'
  }
];

async function main() {
  const contractAddress = '0x0b6D8B9A2b84F3A40282a99674dA8E388B1eEC28';

  const account = privateKeyToAccount(PRIVATE_KEY as `0x${string}`);

  const publicClient = createPublicClient({
    chain: holesky,
    transport: http('https://1rpc.io/holesky'),
  });

  const walletClient = createWalletClient({
    chain: holesky,
    transport: http('https://1rpc.io/holesky'),
    account,
  });

  try {
    console.log('Creating new task...');
    console.log('Contract address:', contractAddress);
    console.log('Account address:', account.address);

    const { request } = await publicClient.simulateContract({
      address: contractAddress as any,
      abi,
      functionName: 'createNewTask',
      args: ['I am a thief'],
      account,
    });

    const hash = await walletClient.writeContract(request as any);
    console.log('Transaction hash:', hash);
    
    const receipt = await publicClient.waitForTransactionReceipt({ hash });
    console.log('Transaction receipt:', receipt);
    console.log('Task created successfully!');
    
  } catch (error) {
    console.error('Error creating task:', error);
  }
}

main().catch(console.error);