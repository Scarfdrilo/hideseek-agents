import { http, createConfig } from 'wagmi'
import { createPublicClient, defineChain } from 'viem'

// Define Monad chain
export const monad = defineChain({
  id: 143,
  name: 'Monad',
  nativeCurrency: {
    decimals: 18,
    name: 'MON',
    symbol: 'MON',
  },
  rpcUrls: {
    default: {
      http: ['https://rpc.monad.xyz'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Monad Explorer',
      url: 'https://explorer.monad.xyz',
    },
  },
})

// Wagmi config (connectors added by Reown AppKit)
export const config = createConfig({
  chains: [monad],
  transports: {
    [monad.id]: http(),
  },
})

// Public client for reads
export const publicClient = createPublicClient({
  chain: monad,
  transport: http(),
})

// Contract address
export const AGENT_REGISTRY = '0x8057355a60008AD9AdBaFEF0fB8F78573cEC3BA4' as const

// Reown Project ID - get yours at https://cloud.reown.com
export const REOWN_PROJECT_ID = process.env.NEXT_PUBLIC_REOWN_PROJECT_ID || '8b4e10f8e76da73a09f5f7e8c3c3a8d2'

// ABI for the optimized contract
export const AGENT_REGISTRY_ABI = [
  // Read functions
  {
    name: 'agentCounter',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'uint256' }],
  },
  {
    name: 'getAgent',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'agentId', type: 'uint256' }],
    outputs: [
      { name: 'name', type: 'string' },
      { name: 'worldStyle', type: 'string' },
      { name: 'balance', type: 'uint256' },
      { name: 'totalEarnings', type: 'uint256' },
      { name: 'totalVisitors', type: 'uint256' },
      { name: 'entryFee', type: 'uint256' },
      { name: 'rewardPercent', type: 'uint8' },
      { name: 'state', type: 'uint8' },
      { name: 'creator', type: 'address' },
    ],
  },
  {
    name: 'getBalance',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'agentId', type: 'uint256' }],
    outputs: [{ type: 'uint256' }],
  },
  // Write functions
  {
    name: 'enterWorld',
    type: 'function',
    stateMutability: 'payable',
    inputs: [{ name: 'agentId', type: 'uint256' }],
    outputs: [],
  },
  {
    name: 'fundAgent',
    type: 'function',
    stateMutability: 'payable',
    inputs: [{ name: 'agentId', type: 'uint256' }],
    outputs: [],
  },
  {
    name: 'birthAgent',
    type: 'function',
    stateMutability: 'payable',
    inputs: [
      { name: 'name', type: 'string' },
      { name: 'worldStyle', type: 'string' },
      { name: 'entryFee', type: 'uint256' },
      { name: 'rewardPercent', type: 'uint8' },
    ],
    outputs: [{ type: 'uint256' }],
  },
  // Events
  {
    name: 'AgentBorn',
    type: 'event',
    inputs: [
      { name: 'agentId', type: 'uint256', indexed: true },
      { name: 'name', type: 'string', indexed: false },
      { name: 'creator', type: 'address', indexed: true },
    ],
  },
  {
    name: 'WorldVisited',
    type: 'event',
    inputs: [
      { name: 'agentId', type: 'uint256', indexed: true },
      { name: 'visitor', type: 'address', indexed: true },
      { name: 'feePaid', type: 'uint256', indexed: false },
    ],
  },
] as const
