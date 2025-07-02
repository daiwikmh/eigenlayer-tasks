import { createPolymarketServiceManager, MarketType, ResolutionSource } from './polymarketService';
import 'dotenv/config';

// Configuration
const PRIVATE_KEY = process.env.PRIVATE_KEY || ;
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS || '0x0b6D8B9A2b84F3A40282a99674dA8E388B1eEC28';
const RPC_URL = process.env.RPC_URL || 'https://1rpc.io/holesky';

async function createBinaryMarket() {
  const service = createPolymarketServiceManager(PRIVATE_KEY, CONTRACT_ADDRESS, RPC_URL);

  try {
    console.log('Creating binary market...');
    
    const { marketId, transactionHash } = await service.createBinaryMarket(
      "Will ETH reach $5000 by end of 2024?",
      "Prediction market for ETH price reaching $5000 by December 31, 2024",
      BigInt(30 * 24 * 60 * 60) // 30 days duration
    );

    console.log('Binary market created successfully!');
    console.log('Market ID:', marketId);
    console.log('Transaction Hash:', transactionHash);
    
  } catch (error) {
    console.error('Error creating binary market:', error);
  }
}

async function createCustomMarket() {
  const service = createPolymarketServiceManager(PRIVATE_KEY, CONTRACT_ADDRESS, RPC_URL);

  try {
    console.log('Creating custom market...');
    
    const { marketId, transactionHash } = await service.createMarket(
      "Which team will win the World Cup 2026?",
      "Prediction market for the FIFA World Cup 2026 winner",
      MarketType.CATEGORICAL,
      ResolutionSource.CONSENSUS,
      ["Brazil", "Argentina", "France", "Germany", "Other"],
      BigInt(365 * 24 * 60 * 60), // 1 year duration
      "FIFA World Cup 2026 prediction"
    );

    console.log('Custom market created successfully!');
    console.log('Market ID:', marketId);
    console.log('Transaction Hash:', transactionHash);
    
  } catch (error) {
    console.error('Error creating custom market:', error);
  }
}

async function main() {
  console.log('Polymarket Service Manager - Create Markets');
  console.log('========================================');
  
  // Get command line argument for market type
  const marketType = process.argv[2];
  
  if (marketType === 'binary') {
    await createBinaryMarket();
  } else if (marketType === 'custom') {
    await createCustomMarket();
  } else {
    console.log('Usage:');
    console.log('  npm run create-market binary   - Create a binary (YES/NO) market');
    console.log('  npm run create-market custom   - Create a custom categorical market');
    console.log('');
    console.log('Or run directly:');
    console.log('  npx ts-node createMarket.ts binary');
    console.log('  npx ts-node createMarket.ts custom');
    
    // Default to binary market if no argument provided
    console.log('\nNo argument provided, creating binary market by default...');
    await createBinaryMarket();
  }
}

main().catch(console.error);