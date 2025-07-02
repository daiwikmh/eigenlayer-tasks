import { createPublicClient, createWalletClient, http, parseEther } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { holesky } from 'viem/chains';
import 'dotenv/config';

// Your contract details
const CONTRACT_ADDRESS = '0xab445Df22d6C95c3F8faE2167aAAdB3EEFDB4FF8';
const DEPLOYER_PRIVATE_KEY = '0xa73f439105df962fa7af1a273c400e562f1065977926c423762d1c48c7432aac';
const OPERATOR_PRIVATE_KEY = '0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d';

// Polymarket Service Manager ABI
const polymarketABI = [
  // View functions
  {
    type: 'function',
    name: 'operatorRegistered',
    inputs: [{ name: 'operator', type: 'address' }],
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'latestMarketId',
    inputs: [],
    outputs: [{ name: '', type: 'uint32' }],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'latestResolutionTaskNum',
    inputs: [],
    outputs: [{ name: '', type: 'uint32' }],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'avsDirectory',
    inputs: [],
    outputs: [{ name: '', type: 'address' }],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'getMarketInfo',
    inputs: [{ name: 'marketId', type: 'uint32' }],
    outputs: [
      { name: 'question', type: 'string' },
      { name: 'description', type: 'string' },
      { name: 'marketType', type: 'uint8' },
      { name: 'resolutionSource', type: 'uint8' },
      { name: 'endTime', type: 'uint256' },
      { name: 'resolutionTime', type: 'uint256' },
      { name: 'resolved', type: 'bool' },
      { name: 'winningOutcome', type: 'uint256' },
      { name: 'totalPool', type: 'uint256' },
      { name: 'outcomes', type: 'string[]' }
    ],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'getMarketOdds',
    inputs: [{ name: 'marketId', type: 'uint32' }],
    outputs: [{ name: 'odds', type: 'uint256[]' }],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'getUserShares',
    inputs: [
      { name: 'marketId', type: 'uint32' },
      { name: 'user', type: 'address' },
      { name: 'outcomeIndex', type: 'uint256' }
    ],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view'
  },
  
  // Write functions
  {
    type: 'function',
    name: 'registerOperatorToAVS',
    inputs: [
      { name: 'operator', type: 'address' },
      {
        name: 'operatorSignature',
        type: 'tuple',
        components: [
          { name: 'signature', type: 'bytes' },
          { name: 'salt', type: 'bytes32' },
          { name: 'expiry', type: 'uint256' }
        ]
      }
    ],
    outputs: [],
    stateMutability: 'nonpayable'
  },
  {
    type: 'function',
    name: 'createBinaryMarket',
    inputs: [
      { name: 'question', type: 'string' },
      { name: 'description', type: 'string' },
      { name: 'duration', type: 'uint256' }
    ],
    outputs: [{ name: '', type: 'uint32' }],
    stateMutability: 'nonpayable'
  },
  {
    type: 'function',
    name: 'createMarket',
    inputs: [
      { name: 'question', type: 'string' },
      { name: 'description', type: 'string' },
      { name: 'marketType', type: 'uint8' },
      { name: 'resolutionSource', type: 'uint8' },
      { name: 'outcomes', type: 'string[]' },
      { name: 'duration', type: 'uint256' },
      { name: 'customData', type: 'bytes' }
    ],
    outputs: [{ name: '', type: 'uint32' }],
    stateMutability: 'nonpayable'
  },
  {
    type: 'function',
    name: 'placeBet',
    inputs: [
      { name: 'marketId', type: 'uint32' },
      { name: 'outcomeIndex', type: 'uint256' }
    ],
    outputs: [],
    stateMutability: 'payable'
  },
  {
    type: 'function',
    name: 'createResolutionTask',
    inputs: [
      { name: 'marketId', type: 'uint32' },
      { name: 'resolutionCriteria', type: 'bytes' }
    ],
    outputs: [
      {
        name: '',
        type: 'tuple',
        components: [
          { name: 'marketId', type: 'uint32' },
          { name: 'question', type: 'string' },
          { name: 'description', type: 'string' },
          { name: 'marketType', type: 'uint8' },
          { name: 'possibleOutcomes', type: 'string[]' },
          { name: 'resolutionSource', type: 'uint8' },
          { name: 'resolutionCriteria', type: 'bytes' },
          { name: 'taskCreatedBlock', type: 'uint32' }
        ]
      }
    ],
    stateMutability: 'nonpayable'
  },
  {
    type: 'function',
    name: 'claimWinnings',
    inputs: [{ name: 'marketId', type: 'uint32' }],
    outputs: [],
    stateMutability: 'nonpayable'
  },

  // Events
  {
    type: 'event',
    name: 'MarketCreated',
    inputs: [
      { name: 'marketId', type: 'uint32', indexed: true },
      { name: 'question', type: 'string', indexed: false },
      { name: 'marketType', type: 'uint8', indexed: false },
      { name: 'outcomes', type: 'string[]', indexed: false }
    ]
  },
  {
    type: 'event',
    name: 'BetPlaced',
    inputs: [
      { name: 'marketId', type: 'uint32', indexed: true },
      { name: 'user', type: 'address', indexed: true },
      { name: 'outcomeIndex', type: 'uint256', indexed: false },
      { name: 'amount', type: 'uint256', indexed: false },
      { name: 'shares', type: 'uint256', indexed: false }
    ]
  }
] as const;

  const account = privateKeyToAccount(process.env.PRIVATE_KEY as `0x${string}`);


class PolymarketAVS {
  private publicClient;
  private deployerWalletClient;
  private deployerAccount;
  private operatorAccount;

  

  constructor() {
    // Create accounts
    this.deployerAccount = privateKeyToAccount(DEPLOYER_PRIVATE_KEY as `0x${string}`);
    this.operatorAccount = privateKeyToAccount(OPERATOR_PRIVATE_KEY as `0x${string}`);

    // Create clients
    this.publicClient = createPublicClient({
      chain: holesky,
      transport: http('http://localhost:8545'),
    });

    this.deployerWalletClient = createWalletClient({
      chain: holesky,
      transport: http('http://localhost:8545'),
      account,
    });
  }

  // ========================================
  // STATUS CHECK FUNCTIONS
  // ========================================

  async checkContractStatus() {
    console.log('🔍 Checking Contract Status');
    console.log('============================');
    
    try {
      // Check if contract exists
      const code = await this.publicClient.getBytecode({
        address: CONTRACT_ADDRESS as `0x${string}`
      });

      if (!code || code === '0x') {
        console.log('❌ Contract not found at address:', CONTRACT_ADDRESS);
        return false;
      }

      console.log('✅ Contract exists at:', CONTRACT_ADDRESS);
      console.log('Deployer address:', this.deployerAccount.address);
      console.log('Operator address:', this.operatorAccount.address);

      // Check balances
      const deployerBalance = await this.publicClient.getBalance({
        address: this.deployerAccount.address
      });
      const operatorBalance = await this.publicClient.getBalance({
        address: this.operatorAccount.address
      });

      console.log('Deployer balance:', parseFloat((Number(deployerBalance) / 1e18).toFixed(4)), 'ETH');
      console.log('Operator balance:', parseFloat((Number(operatorBalance) / 1e18).toFixed(4)), 'ETH');

      // Test basic contract calls
      console.log('\n📊 Contract State:');
      
      const latestMarketId = await this.publicClient.readContract({
        address: CONTRACT_ADDRESS as `0x${string}`,
        abi: polymarketABI,
        functionName: 'latestMarketId'
      });
      console.log('Latest Market ID:', latestMarketId.toString());

      const latestTaskNum = await this.publicClient.readContract({
        address: CONTRACT_ADDRESS as `0x${string}`,
        abi: polymarketABI,
        functionName: 'latestResolutionTaskNum'
      });
      console.log('Latest Resolution Task Number:', latestTaskNum.toString());

      const avsDirectory = await this.publicClient.readContract({
        address: CONTRACT_ADDRESS as `0x${string}`,
        abi: polymarketABI,
        functionName: 'avsDirectory'
      });
      console.log('AVS Directory:', avsDirectory);

      const isOperatorRegistered = await this.publicClient.readContract({
        address: CONTRACT_ADDRESS as `0x${string}`,
        abi: polymarketABI,
        functionName: 'operatorRegistered',
        args: [this.operatorAccount.address]
      });
      console.log('Operator Registered:', isOperatorRegistered);

      return true;

    } catch (error) {
      console.error('❌ Contract status check failed:', error);
      return false;
    }
  }

  // ========================================
  // OPERATOR REGISTRATION
  // ========================================

  async registerOperator() {
    console.log('\n🔐 Registering Operator');
    console.log('========================');

    try {
      // Check if already registered
      const isRegistered = await this.publicClient.readContract({
        address: CONTRACT_ADDRESS as `0x${string}`,
        abi: polymarketABI,
        functionName: 'operatorRegistered',
        args: [this.operatorAccount.address]
      });

      if (isRegistered) {
        console.log('✅ Operator is already registered!');
        return true;
      }

      // Create operator signature (simplified for testing)
      const salt = `0x${'0'.repeat(64)}` as `0x${string}`;
      const expiry = BigInt(Math.floor(Date.now() / 1000) + 3600); // 1 hour from now
      const signature = `0x${'0'.repeat(130)}` as `0x${string}`; // Mock signature for testing

      const operatorSignature = {
        signature,
        salt,
        expiry
      };

      console.log('📝 Attempting to register operator...');
      console.log('Operator address:', this.operatorAccount.address);

      // Simulate the transaction first
      const { request } = await this.publicClient.simulateContract({
        address: CONTRACT_ADDRESS as `0x${string}`,
        abi: polymarketABI,
        functionName: 'registerOperatorToAVS',
        args: [this.operatorAccount.address, operatorSignature],
        account: this.deployerAccount,
      });

      // Execute the transaction
      const hash = await this.deployerWalletClient.writeContract(request);
      console.log('⏳ Transaction sent:', hash);

      const receipt = await this.publicClient.waitForTransactionReceipt({ hash });
      console.log('✅ Operator registered successfully!');
      console.log('Gas used:', receipt.gasUsed.toString());

      return true;

    } catch (error) {
      console.error('❌ Failed to register operator:', error);
      return false;
    }
  }

  // ========================================
  // MARKET CREATION
  // ========================================

  async createBinaryMarket() {
    console.log('\n📊 Creating Binary Market');
    console.log('==========================');

    try {
      const question = "Will Bitcoin reach $150,000 by end of 2025?";
      const description = "This market resolves to YES if Bitcoin (BTC) reaches or exceeds $150,000 USD at any point before December 31, 2025, 11:59 PM UTC.";
      const duration = BigInt(7 * 24 * 60 * 60); // 7 days

      console.log('📝 Creating market...');
      console.log('Question:', question);
      console.log('Duration:', duration.toString(), 'seconds');

      // Simulate the transaction
      const { request } = await this.publicClient.simulateContract({
        address: CONTRACT_ADDRESS as `0x${string}`,
        abi: polymarketABI,
        functionName: 'createBinaryMarket',
        args: [question, description, duration],
        account: this.deployerAccount,
      });

      // Execute the transaction
      const hash = await this.deployerWalletClient.writeContract(request);
      console.log('⏳ Transaction sent:', hash);

      const receipt = await this.publicClient.waitForTransactionReceipt({ hash });
      console.log('✅ Binary market created successfully!');

      // Get the new market ID
      const latestMarketId = await this.publicClient.readContract({
        address: CONTRACT_ADDRESS as `0x${string}`,
        abi: polymarketABI,
        functionName: 'latestMarketId'
      });

      const marketId = Number(latestMarketId) - 1; // Latest created market
      console.log('📊 Market ID:', marketId);

      return marketId;

    } catch (error) {
      console.error('❌ Failed to create binary market:', error);
      return null;
    }
  }

  // ========================================
  // BETTING
  // ========================================

  async placeBet(marketId: number, outcomeIndex: number, betAmount: string) {
    console.log('\n💰 Placing Bet');
    console.log('===============');

    try {
      console.log('📊 Market ID:', marketId);
      console.log('💰 Outcome Index:', outcomeIndex);
      console.log('💰 Bet Amount:', betAmount, 'ETH');

      const value = parseEther(betAmount);

      // Simulate the transaction
      const { request } = await this.publicClient.simulateContract({
        address: CONTRACT_ADDRESS as `0x${string}`,
        abi: polymarketABI,
        functionName: 'placeBet',
        args: [marketId, BigInt(outcomeIndex)],
        account: this.deployerAccount,
        value,
      });

      // Execute the transaction
      const hash = await this.deployerWalletClient.writeContract(request);
      console.log('⏳ Transaction sent:', hash);

      const receipt = await this.publicClient.waitForTransactionReceipt({ hash });
      console.log('✅ Bet placed successfully!');
      console.log('Gas used:', receipt.gasUsed.toString());

      // Get user shares
      const userShares = await this.publicClient.readContract({
        address: CONTRACT_ADDRESS as `0x${string}`,
        abi: polymarketABI,
        functionName: 'getUserShares',
        args: [marketId, this.deployerAccount.address, BigInt(outcomeIndex)]
      });

      console.log('📈 User shares:', userShares.toString());

      return true;

    } catch (error) {
      console.error('❌ Failed to place bet:', error);
      return false;
    }
  }

  // ========================================
  // MARKET INFO
  // ========================================

  async getMarketInfo(marketId: number) {
    console.log('\n📊 Getting Market Info');
    console.log('=======================');

    try {
      const marketInfo = await this.publicClient.readContract({
        address: CONTRACT_ADDRESS as `0x${string}`,
        abi: polymarketABI,
        functionName: 'getMarketInfo',
        args: [marketId]
      });

      console.log('📊 Market Information:');
      console.log('Question:', marketInfo[0]);
      console.log('Description:', marketInfo[1]);
      console.log('Market Type:', marketInfo[2]);
      console.log('Resolution Source:', marketInfo[3]);
      console.log('End Time:', new Date(Number(marketInfo[4]) * 1000).toLocaleString());
      console.log('Resolution Time:', new Date(Number(marketInfo[5]) * 1000).toLocaleString());
      console.log('Resolved:', marketInfo[6]);
      console.log('Winning Outcome:', marketInfo[7].toString());
      console.log('Total Pool:', (Number(marketInfo[8]) / 1e18).toFixed(4), 'ETH');
      console.log('Outcomes:', marketInfo[9]);

      // Get market odds
      const odds = await this.publicClient.readContract({
        address: CONTRACT_ADDRESS as `0x${string}`,
        abi: polymarketABI,
        functionName: 'getMarketOdds',
        args: [marketId]
      });

      console.log('\n📈 Current Odds:');
      for (let i = 0; i < marketInfo[9].length; i++) {
        const percentage = (Number(odds[i]) / 100).toFixed(2);
        console.log(`  ${marketInfo[9][i]}: ${percentage}%`);
      }

      return marketInfo;

    } catch (error) {
      console.error('❌ Failed to get market info:', error);
      return null;
    }
  }
}

// ============================================================================
// MAIN EXECUTION
// ============================================================================

async function main() {
  console.log('🚀 Polymarket AVS Demo');
  console.log('======================');

  const polymarket = new PolymarketAVS();

  try {
    // Step 1: Check contract status
    const contractExists = await polymarket.checkContractStatus();
    if (!contractExists) {
      console.log('❌ Contract check failed. Exiting...');
      return;
    }

    // Step 2: Register operator
    await polymarket.registerOperator();

    // Step 3: Create a binary market
    const marketId = await polymarket.createBinaryMarket();
    if (marketId === null) {
      console.log('❌ Market creation failed. Exiting...');
      return;
    }

    // Step 4: Place some bets
    await polymarket.placeBet(marketId, 0, '0.01'); // Bet on YES
    await polymarket.placeBet(marketId, 1, '0.005'); // Bet on NO

    // Step 5: Check market info
    await polymarket.getMarketInfo(marketId);

    console.log('\n🎉 Demo completed successfully!');

  } catch (error) {
    console.error('❌ Demo failed:', error);
  }
}

// Run the main function
main().catch(console.error);