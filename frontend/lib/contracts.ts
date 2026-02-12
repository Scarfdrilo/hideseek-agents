import AgentRegistryABI from './AgentRegistryABI.json'

// Contract addresses - update after deployment
export const CONTRACTS = {
  // Monad Testnet
  testnet: {
    AgentRegistry: '0x0000000000000000000000000000000000000000' as `0x${string}`,
  },
  // Monad Mainnet
  mainnet: {
    AgentRegistry: '0x0000000000000000000000000000000000000000' as `0x${string}`,
  }
}

// Use testnet by default
export const ACTIVE_NETWORK = 'testnet' as const

export const getContractAddress = (contract: keyof typeof CONTRACTS.testnet) => {
  return CONTRACTS[ACTIVE_NETWORK][contract]
}

// ABIs
export const ABIS = {
  AgentRegistry: AgentRegistryABI,
}

// Chain config for Monad
export const MONAD_CHAIN = {
  id: 10242, // Monad testnet chain ID (placeholder)
  name: 'Monad Testnet',
  network: 'monad-testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'MON',
    symbol: 'MON',
  },
  rpcUrls: {
    default: {
      http: ['https://testnet.monad.xyz'],
    },
    public: {
      http: ['https://testnet.monad.xyz'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Monad Explorer',
      url: 'https://explorer.testnet.monad.xyz',
    },
  },
}

// Agent state enum mapping
export const AgentState = {
  Active: 0,
  Dormant: 1,
  Retired: 2,
} as const

export type AgentStateType = typeof AgentState[keyof typeof AgentState]

// Agent struct type from contract
export interface ContractAgent {
  id: bigint
  name: string
  worldStyle: string
  personality: string
  balance: bigint
  totalEarnings: bigint
  totalVisitors: bigint
  entryFee: bigint
  rewardPercent: bigint
  burnRate: bigint
  lastHeartbeat: bigint
  state: AgentStateType
  creator: `0x${string}`
  capabilityHash: `0x${string}`
  signingKey: `0x${string}`
}

// Frontend-friendly agent type
export interface Agent {
  id: number
  name: string
  worldStyle: string
  personality: string
  balance: number // in ETH
  totalEarnings: number
  totalVisitors: number
  entryFee: number
  rewardPercent: number
  burnRate: number
  state: 'Active' | 'Dormant' | 'Retired'
  creator: string
  capabilityHash: string
  signingKey: string
}

// Convert contract agent to frontend agent
export function toAgent(contractAgent: ContractAgent): Agent {
  const stateMap = ['Active', 'Dormant', 'Retired'] as const
  
  return {
    id: Number(contractAgent.id),
    name: contractAgent.name,
    worldStyle: contractAgent.worldStyle,
    personality: contractAgent.personality,
    balance: Number(contractAgent.balance) / 1e18,
    totalEarnings: Number(contractAgent.totalEarnings) / 1e18,
    totalVisitors: Number(contractAgent.totalVisitors),
    entryFee: Number(contractAgent.entryFee) / 1e18,
    rewardPercent: Number(contractAgent.rewardPercent),
    burnRate: Number(contractAgent.burnRate) / 1e18,
    state: stateMap[contractAgent.state],
    creator: contractAgent.creator,
    capabilityHash: contractAgent.capabilityHash,
    signingKey: contractAgent.signingKey,
  }
}

// ERC-8004 capability types
export const AgentCapabilities = {
  WORLD_GENERATION: 'world_generation',
  PUZZLE_CREATION: 'puzzle_creation',
  NPC_DIALOGUE: 'npc_dialogue',
  REWARD_DISTRIBUTION: 'reward_distribution',
  DYNAMIC_DIFFICULTY: 'dynamic_difficulty',
} as const

export type AgentCapability = typeof AgentCapabilities[keyof typeof AgentCapabilities]
