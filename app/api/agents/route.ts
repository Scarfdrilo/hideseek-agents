import { NextResponse } from 'next/server'
import { createPublicClient, http, defineChain, formatEther } from 'viem'

// Monad mainnet config
const monad = defineChain({
  id: 143,
  name: 'Monad',
  nativeCurrency: { name: 'MON', symbol: 'MON', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://rpc.monad.xyz'] },
  },
})

const CONTRACT_ADDRESS = '0x769c418EA0481f45Ea20071186cd00013Ef7eD28'

// Correct ABI matching the deployed contract
const ABI = [
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
] as const

const client = createPublicClient({
  chain: monad,
  transport: http(),
})

/**
 * GET /api/agents
 * 
 * Returns list of all registered agents/worlds from the smart contract.
 */
export async function GET() {
  try {
    // Get agent count
    const agentCount = await client.readContract({
      address: CONTRACT_ADDRESS,
      abi: ABI,
      functionName: 'agentCounter',
    }) as bigint

    const totalAgents = Number(agentCount)

    // Fetch all agents
    const agents = []
    for (let i = 1; i <= totalAgents; i++) {
      try {
        const agent = await client.readContract({
          address: CONTRACT_ADDRESS,
          abi: ABI,
          functionName: 'getAgent',
          args: [BigInt(i)],
        }) as [string, string, bigint, bigint, bigint, bigint, number, number, string]

        const [name, worldStyle, balance, totalEarnings, totalVisitors, entryFee, rewardPercent, state, creator] = agent
        
        // State: 0 = Active, 1 = Dormant, 2 = Retired
        const stateMap = ['Active', 'Dormant', 'Retired']
        
        agents.push({
          id: i,
          name,
          worldStyle,
          balance: formatEther(balance),
          totalEarnings: formatEther(totalEarnings),
          totalVisitors: Number(totalVisitors),
          entryFee: formatEther(entryFee),
          rewardPercent,
          state: stateMap[state] || 'Unknown',
          creator,
          worldUrl: `https://hideseek-agents.vercel.app/world/${i}`,
        })
      } catch (e) {
        console.error(`Failed to read agent ${i}:`, e)
      }
    }

    return NextResponse.json({
      success: true,
      contract: CONTRACT_ADDRESS,
      network: 'Monad Mainnet (143)',
      totalAgents,
      agents,
    })
  } catch (error) {
    console.error('Error fetching agents:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch agents',
      details: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 })
  }
}
