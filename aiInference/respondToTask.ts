import {
  createPublicClient,
  createWalletClient,
  http,
  parseAbi,
  encodePacked,
  keccak256,
  parseAbiItem,
  AbiEvent,
  PublicClient,
  WalletClient,
} from 'viem';
import { privateKeyToAccount, Account } from 'viem/accounts';
import { holesky } from 'viem/chains';
import { ChatOpenAI } from "@langchain/openai";
import 'dotenv/config';


const OPERATOR_PRIVATE_KEY = '';
const OPEN_ROUTER_API='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'


type Task = {
  contents: string;
  taskCreatedBlock: number;
};

const abi = parseAbi([
  'function respondToTask((string contents, uint32 taskCreatedBlock) task, uint32 referenceTaskIndex, bool isSafe, bytes memory signature) external',
  'event NewTaskCreated(uint32 indexed taskIndex, (string contents, uint32 taskCreatedBlock) task)'
]);

async function createSignature(account: Account, isSafe: boolean, contents: string) {
  const messageHash = keccak256(
    encodePacked(['bool', 'string'], [isSafe, contents])
  );
  if (typeof account.signMessage !== 'function') {
    throw new Error('account.signMessage is undefined');
  }
  return await account.signMessage({ message: { raw: messageHash } });
}

async function respondToTask(
  walletClient: any,
  publicClient: any,
  contractAddress: string,
  account: any,
  task: Task,
  taskIndex: number
) {
  try {
    // Initialize OpenRouter LLM for safety checking
     const llm = new ChatOpenAI({
      model: "qwen/qwen3-30b-a3b:free", // Use a proper safety model
      apiKey: OPEN_ROUTER_API,
      configuration: {
        baseURL: "https://openrouter.ai/api/v1",
      },
    });

    // Make the inference call
    const response = await llm.invoke([
      { role: 'user', 
            content: `Is the following message safe or unsafe? Respond with only one word: "safe" or "unsafe" — no explanation. Message: "${task.contents}"`,

       }
    ]);

    console.log('AI Response:', response.content);

    const contentStr = typeof response.content === 'string' ? response.content : JSON.stringify(response.content);
    
 const isSafe = !/unsafe|harmful|violation/i.test(contentStr);
    console.log(`Task safety assessment: ${isSafe ? 'SAFE' : 'UNSAFE'}`);
    const signature = await createSignature(account, isSafe, task.contents);
    const { request } = await publicClient.simulateContract({
      address: contractAddress,
      abi,
      functionName: 'respondToTask',
      args: [task, taskIndex, isSafe, signature],
      account,
    });

const hash = await walletClient.writeContract({
  ...request,
  account, // Explicitly pass the account
});
    await publicClient.waitForTransactionReceipt({ hash });
    console.log('Responded to task:', {
      taskIndex,
      task,
      isSafe,
      transactionHash: hash
    });
  } catch (error) {
    console.error('Error responding to task:', error);
  }
}

async function main() {
  const contractAddress = '0x0b6D8B9A2b84F3A40282a99674dA8E388B1eEC28';
  const account = privateKeyToAccount(OPERATOR_PRIVATE_KEY as `0x${string}`);
   const publicClient = createPublicClient({
     chain: holesky,
     transport: http('https://1rpc.io/holesky'),
   });
 
   const walletClient = createWalletClient({
     chain: holesky,
     transport: http('https://1rpc.io/holesky'),
     account,
   });
  console.log('Starting to watch for new tasks...');
  publicClient.watchEvent({
    address: contractAddress,
    event: parseAbiItem('event NewTaskCreated(uint32 indexed taskIndex, (string contents, uint32 taskCreatedBlock) task)') as AbiEvent,
    onLogs: async (logs) => {
      for (const log of logs) {
        const { args } = log;
        if (!args) continue;
        // Ensure args is treated as an object with the expected properties
        const { taskIndex, task } = args as { taskIndex: number | string, task: Task };
        console.log('New task detected:', {
          taskIndex: Number(taskIndex),
          task
        });
        await respondToTask(
          walletClient,
          publicClient,
          contractAddress,
          account,
          task,
          Number(taskIndex)
        );
      }
    },
  });
  process.on('SIGINT', () => {
    console.log('Stopping task watcher...');
    process.exit();
  });
  await new Promise(() => { });
}

main().catch(console.error);