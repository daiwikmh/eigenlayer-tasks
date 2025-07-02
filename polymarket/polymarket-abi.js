export const POLYMARKET_ABI = [
  {
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
    name: 'registerOperatorToAVS',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [{ name: 'operator', type: 'address' }],
    name: 'deregisterOperatorFromAVS',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [
      { name: 'question', type: 'string' },
      { name: 'description', type: 'string' },
      { name: 'marketType', type: 'uint8' },
      { name: 'resolutionSource', type: 'uint8' },
      { name: 'outcomes', type: 'string[]' },
      { name: 'duration', type: 'uint256' },
      { name: 'customData', type: 'bytes' }
    ],
    name: 'createMarket',
    outputs: [{ name: '', type: 'uint32' }],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [
      { name: 'question', type: 'string' },
      { name: 'description', type: 'string' },
      { name: 'duration', type: 'uint256' }
    ],
    name: 'createBinaryMarket',
    outputs: [{ name: '', type: 'uint32' }],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [
      { name: 'marketId', type: 'uint32' },
      { name: 'outcomeIndex', type: 'uint256' }
    ],
    name: 'placeBet',
    outputs: [],
    stateMutability: 'payable',
    type: 'function'
  },
  {
    inputs: [
      { name: 'marketId', type: 'uint32' },
      { name: 'resolutionCriteria', type: 'bytes' }
    ],
    name: 'createResolutionTask',
    outputs: [{
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
    }],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [
      {
        name: 'task',
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
      },
      { name: 'referenceTaskIndex', type: 'uint32' },
      { name: 'winningOutcomeIndex', type: 'uint256' },
      { name: 'signature', type: 'bytes' }
    ],
    name: 'resolveMarket',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [{ name: 'marketId', type: 'uint32' }],
    name: 'claimWinnings',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [{ name: 'marketId', type: 'uint32' }],
    name: 'getMarketInfo',
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
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [{ name: 'marketId', type: 'uint32' }],
    name: 'getMarketOdds',
    outputs: [{ name: 'odds', type: 'uint256[]' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [
      { name: 'marketId', type: 'uint32' },
      { name: 'user', type: 'address' },
      { name: 'outcomeIndex', type: 'uint256' }
    ],
    name: 'getUserShares',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function'
  }
]