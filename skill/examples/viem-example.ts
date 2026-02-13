/**
 * HideSeek Agent - viem Example
 * 
 * This example shows how to:
 * 1. Connect to Monad
 * 2. Read agent data
 * 3. Birth a new agent
 * 4. Enter an agent's world
 */

import { 
  createPublicClient, 
  createWalletClient, 
  http, 
  parseEther, 
  formatEther 
} from 'viem'
import { privateKeyToAccount } from 'viem/accounts'

// Contract details
const HIDESEEK_ADDRESS = '0x769c418EA0481f45Ea20071186cd00013Ef7eD28' as const
const MONAD_RPC = 'https://rpc.monad.xyz'

// Monad chain config
const monadChain = {
  id: 143,
  name: 'Monad',
  nativeCurrency: { name: 'MON', symbol: 'MON', decimals: 18 },
  rpcUrls: { default: { http: [MONAD_RPC] } }
}

// Contract ABI (essential functions)
const HIDESEEK_ABI = [
  // Read functions
  {
    name: 'totalAgents',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'uint256' }]
  },
  {
    name: 'agents',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'agentId', type: 'uint256' }],
    outputs: [
      { name: 'owner', type: 'address' },
      { name: 'name', type: 'string' },
      { name: 'worldStyle', type: 'string' },
      { name: 'entryFee', type: 'uint64' },
      { name: 'balance', type: 'uint64' },
      { name: 'rewardRate', type: 'uint16' },
      { name: 'level', type: 'uint8' },
      { name: 'isActive', type: 'bool' },
      { name: 'metadataURI', type: 'string' }
    ]
  },
  {
    name: 'hasVisited',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'agentId', type: 'uint256' },
      { name: 'visitor', type: 'address' }
    ],
    outputs: [{ type: 'bool' }]
  },
  {
    name: 'creatorPending',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'creator', type: 'address' }],
    outputs: [{ type: 'uint256' }]
  },
  // Write functions
  {
    name: 'birthAgent',
    type: 'function',
    stateMutability: 'payable',
    inputs: [
      { name: 'name', type: 'string' },
      { name: 'worldStyle', type: 'string' },
      { name: 'entryFee', type: 'uint64' },
      { name: 'rewardRate', type: 'uint16' },
      { name: 'metadataURI', type: 'string' }
    ],
    outputs: [{ type: 'uint256' }]
  },
  {
    name: 'enterWorld',
    type: 'function',
    stateMutability: 'payable',
    inputs: [{ name: 'agentId', type: 'uint256' }],
    outputs: []
  },
  {
    name: 'creatorWithdraw',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [],
    outputs: []
  }
] as const

// World styles
type WorldStyle = 'neon_jungle' | 'crystal_caves' | 'cyber_city' | 'void_realm'

// Create clients
const publicClient = createPublicClient({
  chain: monadChain,
  transport: http(MONAD_RPC)
})

// Example functions

/**
 * Get total number of agents
 */
async function getTotalAgents(): Promise<bigint> {
  return publicClient.readContract({
    address: HIDESEEK_ADDRESS,
    abi: HIDESEEK_ABI,
    functionName: 'totalAgents'
  })
}

/**
 * Get agent details
 */
async function getAgent(agentId: number) {
  const result = await publicClient.readContract({
    address: HIDESEEK_ADDRESS,
    abi: HIDESEEK_ABI,
    functionName: 'agents',
    args: [BigInt(agentId)]
  })
  
  return {
    owner: result[0],
    name: result[1],
    worldStyle: result[2],
    entryFee: formatEther(BigInt(result[3])),
    balance: formatEther(BigInt(result[4])),
    rewardRate: result[5],
    level: result[6],
    isActive: result[7],
    metadataURI: result[8]
  }
}

/**
 * Check if address has visited an agent's world
 */
async function hasVisited(agentId: number, visitorAddress: `0x${string}`): Promise<boolean> {
  return publicClient.readContract({
    address: HIDESEEK_ADDRESS,
    abi: HIDESEEK_ABI,
    functionName: 'hasVisited',
    args: [BigInt(agentId), visitorAddress]
  })
}

/**
 * Birth a new agent (requires wallet)
 */
async function birthAgent(
  privateKey: `0x${string}`,
  name: string,
  worldStyle: WorldStyle,
  entryFee: string, // in MON
  rewardRate: number // 0-100
) {
  const account = privateKeyToAccount(privateKey)
  
  const walletClient = createWalletClient({
    account,
    chain: monadChain,
    transport: http(MONAD_RPC)
  })

  const entryFeeWei = BigInt(Math.floor(parseFloat(entryFee) * 1e18))
  
  const hash = await walletClient.writeContract({
    address: HIDESEEK_ADDRESS,
    abi: HIDESEEK_ABI,
    functionName: 'birthAgent',
    args: [name, worldStyle, entryFeeWei, rewardRate, ''],
    value: parseEther('0.01') // Minimum funding
  })

  console.log(`Transaction: ${hash}`)
  
  // Wait for confirmation
  const receipt = await publicClient.waitForTransactionReceipt({ hash })
  console.log(`Confirmed in block: ${receipt.blockNumber}`)
  
  return receipt
}

/**
 * Enter an agent's world (requires wallet)
 */
async function enterWorld(
  privateKey: `0x${string}`,
  agentId: number,
  entryFee: string // in MON
) {
  const account = privateKeyToAccount(privateKey)
  
  const walletClient = createWalletClient({
    account,
    chain: monadChain,
    transport: http(MONAD_RPC)
  })

  const hash = await walletClient.writeContract({
    address: HIDESEEK_ADDRESS,
    abi: HIDESEEK_ABI,
    functionName: 'enterWorld',
    args: [BigInt(agentId)],
    value: parseEther(entryFee)
  })

  console.log(`Transaction: ${hash}`)
  
  const receipt = await publicClient.waitForTransactionReceipt({ hash })
  console.log(`Confirmed in block: ${receipt.blockNumber}`)
  
  return receipt
}

// Example usage
async function main() {
  console.log('🎮 HideSeek Agent - viem Example\n')
  
  // 1. Get total agents
  const total = await getTotalAgents()
  console.log(`Total agents: ${total}`)
  
  // 2. Get agent #1 details
  if (total > BigInt(0)) {
    const agent = await getAgent(1)
    console.log('\nAgent #1:')
    console.log(`  Name: ${agent.name}`)
    console.log(`  World: ${agent.worldStyle}`)
    console.log(`  Entry Fee: ${agent.entryFee} MON`)
    console.log(`  Balance: ${agent.balance} MON`)
    console.log(`  Active: ${agent.isActive ? 'Yes' : 'No'}`)
  }
  
  // 3. To birth an agent or enter a world, you need a private key:
  // const PRIVATE_KEY = '0x...' as const
  // await birthAgent(PRIVATE_KEY, 'MyAgent', 'neon_jungle', '0.003', 75)
  // await enterWorld(PRIVATE_KEY, 1, '0.003')
}

main().catch(console.error)
