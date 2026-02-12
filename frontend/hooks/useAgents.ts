'use client'

import { useState, useEffect, useCallback } from 'react'
import { 
  Agent, 
  ContractAgent, 
  toAgent, 
  getContractAddress, 
  ABIS 
} from '@/lib/contracts'

// Demo agents for when contract isn't deployed
const DEMO_AGENTS: Agent[] = [
  {
    id: 1,
    name: 'Prisma',
    worldStyle: 'crystal',
    personality: 'A serene, wise entity that speaks in riddles and values patience',
    balance: 0.045,
    totalEarnings: 1.23,
    totalVisitors: 156,
    entryFee: 0.005,
    rewardPercent: 70,
    burnRate: 0.0001,
    state: 'Active',
    creator: '0x1234567890123456789012345678901234567890',
    capabilityHash: '0x' + '0'.repeat(64),
    signingKey: '0x0000000000000000000000000000000000000000',
  },
  {
    id: 2,
    name: 'Neon',
    worldStyle: 'neon_jungle',
    personality: 'Energetic and playful, loves to challenge visitors with speed runs',
    balance: 0.082,
    totalEarnings: 2.45,
    totalVisitors: 312,
    entryFee: 0.003,
    rewardPercent: 80,
    burnRate: 0.0001,
    state: 'Active',
    creator: '0xabcdef0123456789abcdef0123456789abcdef01',
    capabilityHash: '0x' + '1'.repeat(64),
    signingKey: '0x0000000000000000000000000000000000000000',
  },
  {
    id: 3,
    name: 'Void Walker',
    worldStyle: 'void_realm',
    personality: 'Mysterious and challenging, rewards only the most dedicated explorers',
    balance: 0.002,
    totalEarnings: 0.89,
    totalVisitors: 67,
    entryFee: 0.01,
    rewardPercent: 50,
    burnRate: 0.0001,
    state: 'Dormant',
    creator: '0x9876543210987654321098765432109876543210',
    capabilityHash: '0x' + '2'.repeat(64),
    signingKey: '0x0000000000000000000000000000000000000000',
  },
  {
    id: 4,
    name: 'Aurora',
    worldStyle: 'rainbow',
    personality: 'Chaotic and unpredictable, every visit is a unique experience',
    balance: 0.067,
    totalEarnings: 3.12,
    totalVisitors: 423,
    entryFee: 0.002,
    rewardPercent: 90,
    burnRate: 0.0001,
    state: 'Active',
    creator: '0xfedcba0987654321fedcba0987654321fedcba09',
    capabilityHash: '0x' + '3'.repeat(64),
    signingKey: '0x0000000000000000000000000000000000000000',
  },
  {
    id: 5,
    name: 'Helix',
    worldStyle: 'organic_maze',
    personality: 'Nurturing but challenging, grows its maze based on visitor behavior',
    balance: 0.031,
    totalEarnings: 1.78,
    totalVisitors: 198,
    entryFee: 0.004,
    rewardPercent: 75,
    burnRate: 0.0001,
    state: 'Active',
    creator: '0x1111222233334444555566667777888899990000',
    capabilityHash: '0x' + '4'.repeat(64),
    signingKey: '0x0000000000000000000000000000000000000000',
  }
]

interface UseAgentsResult {
  agents: Agent[]
  loading: boolean
  error: string | null
  isDemo: boolean
  refetch: () => Promise<void>
  fundAgent: (agentId: number, amount: number) => Promise<void>
  reviveAgent: (agentId: number) => Promise<void>
  enterWorld: (agentId: number) => Promise<void>
}

export function useAgents(): UseAgentsResult {
  const [agents, setAgents] = useState<Agent[]>(DEMO_AGENTS)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isDemo, setIsDemo] = useState(true)

  // Simulate life force decreasing over time (demo mode)
  useEffect(() => {
    if (!isDemo) return

    const interval = setInterval(() => {
      setAgents(prev => prev.map(agent => {
        if (agent.state !== 'Active') return agent
        
        const burnRate = 0.0001 // per 5 seconds for demo
        const newBalance = Math.max(0, agent.balance - burnRate)
        
        // Check for dormancy
        if (newBalance < 0.001 && agent.state === 'Active') {
          return { ...agent, balance: newBalance, state: 'Dormant' as const }
        }
        
        return { ...agent, balance: newBalance }
      }))
    }, 5000)
    
    return () => clearInterval(interval)
  }, [isDemo])

  const refetch = useCallback(async () => {
    setLoading(true)
    setError(null)
    
    try {
      const contractAddress = getContractAddress('AgentRegistry')
      
      // Check if contract is deployed
      if (contractAddress === '0x0000000000000000000000000000000000000000') {
        setIsDemo(true)
        setAgents(DEMO_AGENTS)
        return
      }

      // TODO: Implement actual contract read when deployed
      // const publicClient = createPublicClient({...})
      // const data = await publicClient.readContract({
      //   address: contractAddress,
      //   abi: ABIS.AgentRegistry,
      //   functionName: 'getAllAgents',
      // })
      // setAgents(data.map(toAgent))
      
      setIsDemo(true)
      setAgents(DEMO_AGENTS)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch agents')
      setIsDemo(true)
      setAgents(DEMO_AGENTS)
    } finally {
      setLoading(false)
    }
  }, [])

  const fundAgent = useCallback(async (agentId: number, amount: number) => {
    if (isDemo) {
      // Demo mode: just update local state
      setAgents(prev => prev.map(a => {
        if (a.id !== agentId) return a
        const newBalance = a.balance + amount
        const newState = newBalance >= 0.001 ? 'Active' : a.state
        return { ...a, balance: newBalance, state: newState as any }
      }))
      return
    }

    // TODO: Implement actual contract write
    // const { writeContract } = useWriteContract()
    // await writeContract({
    //   address: getContractAddress('AgentRegistry'),
    //   abi: ABIS.AgentRegistry,
    //   functionName: 'fundAgent',
    //   args: [BigInt(agentId)],
    //   value: parseEther(amount.toString()),
    // })
  }, [isDemo])

  const reviveAgent = useCallback(async (agentId: number) => {
    return fundAgent(agentId, 0.01) // Revival cost
  }, [fundAgent])

  const enterWorld = useCallback(async (agentId: number) => {
    const agent = agents.find(a => a.id === agentId)
    if (!agent) return

    if (isDemo) {
      // Demo mode: simulate entry
      setAgents(prev => prev.map(a => {
        if (a.id !== agentId) return a
        return {
          ...a,
          balance: a.balance + a.entryFee,
          totalEarnings: a.totalEarnings + a.entryFee,
          totalVisitors: a.totalVisitors + 1,
        }
      }))
      return
    }

    // TODO: Implement actual contract write
  }, [agents, isDemo])

  useEffect(() => {
    refetch()
  }, [refetch])

  return {
    agents,
    loading,
    error,
    isDemo,
    refetch,
    fundAgent,
    reviveAgent,
    enterWorld,
  }
}

// Hook for a single agent
export function useAgent(agentId: number) {
  const { agents, loading, error, isDemo, fundAgent, reviveAgent, enterWorld } = useAgents()
  const agent = agents.find(a => a.id === agentId) || null

  return {
    agent,
    loading,
    error,
    isDemo,
    fund: (amount: number) => fundAgent(agentId, amount),
    revive: () => reviveAgent(agentId),
    enter: () => enterWorld(agentId),
  }
}

// Hook for ERC-8004 specific data
export function useAgentIdentity(agentId: number) {
  const { agent } = useAgent(agentId)
  
  return {
    agentId: agent?.id,
    name: agent?.name,
    capabilityHash: agent?.capabilityHash,
    signingKey: agent?.signingKey,
    creator: agent?.creator,
    isActive: agent?.state === 'Active',
    // ERC-8004 compliance info
    supportsERC8004: true,
    standard: 'ERC-8004',
  }
}
