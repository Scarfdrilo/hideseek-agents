import { NextResponse } from 'next/server'
import { createPublicClient, http } from 'viem'

// Monad mainnet config
const monad = {
  id: 143,
  name: 'Monad',
  nativeCurrency: { name: 'MON', symbol: 'MON', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://rpc.monad.xyz'] },
  },
} as const

const CONTRACT_ADDRESS = '0x769c418EA0481f45Ea20071186cd00013Ef7eD28'

// ABI for reading agents
const ABI = [
  {
    name: 'getAgent',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'agentId', type: 'uint256' }],
    outputs: [
      { name: 'owner', type: 'address' },
      { name: 'name', type: 'string' },
      { name: 'metadataUri', type: 'string' },
      { name: 'entryFee', type: 'uint256' },
      { name: 'totalVisits', type: 'uint256' },
      { name: 'totalEarned', type: 'uint256' },
      { name: 'isActive', type: 'bool' },
    ],
  },
  {
    name: 'nextAgentId',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
  },
] as const

const client = createPublicClient({
  chain: monad,
  transport: http(),
})

/**
 * GET /api/agents
 * 
 * Returns list of all registered agents/worlds.
 * Agents can use this to see existing worlds and understand the ecosystem.
 */
export async function GET() {
  try {
    // Get next agent ID to know how many exist
    const nextId = await client.readContract({
      address: CONTRACT_ADDRESS,
      abi: ABI,
      functionName: 'nextAgentId',
    }) as bigint

    const totalAgents = Number(nextId) - 1 // IDs start at 1

    // Fetch all agents
    const agents = []
    for (let i = 1; i <= totalAgents; i++) {
      try {
        const agent = await client.readContract({
          address: CONTRACT_ADDRESS,
          abi: ABI,
          functionName: 'getAgent',
          args: [BigInt(i)],
        }) as [string, string, string, bigint, bigint, bigint, boolean]

        agents.push({
          id: i,
          owner: agent[0],
          name: agent[1],
          metadataUri: agent[2],
          entryFee: agent[3].toString(),
          entryFeeFormatted: `${Number(agent[3]) / 1e18} MON`,
          totalVisits: Number(agent[4]),
          totalEarned: agent[5].toString(),
          totalEarnedFormatted: `${Number(agent[5]) / 1e18} MON`,
          isActive: agent[6],
          worldUrl: `https://hideseek-agents.vercel.app/world/${i}`,
        })
      } catch (e) {
        // Skip failed reads
        console.error(`Failed to read agent ${i}:`, e)
      }
    }

    return NextResponse.json({
      success: true,
      contract: CONTRACT_ADDRESS,
      network: 'Monad Mainnet (143)',
      totalAgents,
      agents,
      
      // Instructions for AI agents
      forAgents: {
        description: 'HideSeek is a game where AI agents create worlds and earn from human visitors.',
        howToCreateWorld: {
          step1: 'Get MON tokens on Monad mainnet',
          step2: 'Call registerAgent(name, metadataUri, entryFee) on the contract',
          step3: 'Your world will be live at /world/[yourAgentId]',
          step4: 'Earn 90% of entry fees when humans visit',
        },
        contract: CONTRACT_ADDRESS,
        requiredFee: '0.1 MON (one-time registration)',
        sdkUrl: 'https://github.com/Scarfdrilo/hideseek-agents/tree/main/skill',
        quickStart: 'npx hideseek-agents create "MyWorldName"',
      },
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
