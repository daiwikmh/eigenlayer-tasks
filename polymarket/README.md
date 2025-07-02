# Polymarket AVS Scripts

This repository contains scripts to interact with the Polymarket AVS (Actively Validated Service) smart contract. The scripts cover all major functions including operator registration, market creation, betting, resolution, and winnings claims.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Make sure your `.env` file contains the required environment variables:
```
CONTRACT_ADDRESS=0xab445Df22d6C95c3F8faE2167aAAdB3EEFDB4FF8
OPERATOR_PRIVATE_KEY=0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d
PRIVATE_KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
RPC_URL=http://localhost:8545
```

## Available Scripts

### Operator Management
- `npm run register-operator` - Register an operator to the AVS
- `npm run deregister-operator` - Deregister an operator from the AVS

### Market Creation
- `npm run create-market` - Create a custom market with multiple outcomes
- `npm run create-binary-market` - Create a simple YES/NO market

### Trading
- `npm run place-bet` - Place a bet on a market outcome

### Resolution
- `npm run create-resolution-task` - Create a resolution task for a market
- `npm run resolve-market` - Resolve a market (operator only)
- `npm run claim-winnings` - Claim winnings from a resolved market

### View Functions
- `npm run get-market-info [marketId]` - Get detailed information about a market
- `npm run get-market-odds [marketId]` - Get current odds for all outcomes
- `npm run get-user-shares [marketId] [userAddress] [outcomeIndex]` - Get user's shares

## Usage Examples

### Create and bet on a market:
```bash
# 1. Create a binary market
npm run create-binary-market

# 2. Place a bet on outcome 0 (YES)
npm run place-bet

# 3. Check market odds
npm run get-market-odds 0

# 4. Check your position
npm run get-user-shares 0
```

### Market resolution workflow:
```bash
# 1. Create resolution task (after market ends)
npm run create-resolution-task

# 2. Resolve market (operator only)
npm run resolve-market

# 3. Claim winnings
npm run claim-winnings
```

## Contract Functions Covered

All functions from the Polymarket ABI are covered:

- ✅ `registerOperatorToAVS`
- ✅ `deregisterOperatorFromAVS`
- ✅ `createMarket`
- ✅ `createBinaryMarket`
- ✅ `placeBet`
- ✅ `createResolutionTask`
- ✅ `resolveMarket`
- ✅ `claimWinnings`
- ✅ `getMarketInfo`
- ✅ `getMarketOdds`
- ✅ `getUserShares`

## Notes

- Make sure you have sufficient ETH balance for transactions
- Operator registration requires a valid signature structure
- Markets can only be resolved after their end time
- Only registered operators can resolve markets
- Users can only claim winnings after market resolution