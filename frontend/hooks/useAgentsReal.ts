'use client'

import { useReadContract, useWriteContract, useWaitForTransactionReceipt, useAccount } from 'wagmi'
import { parseEther, formatEther } from 'viem'
import { AGENT_REGISTRY, AGENT_REGISTRY_ABI, monad } from '@/lib/wagmi'

export interface Agent {
  id: number
  name: string
  worldStyle: string
  balance: number
  totalEarnings: number
  totalVisitors: number
  entryFee: number
  rewardPercent: number
  state: 'Active' | 'Dormant' | 'Retired'
  creator: string
}

// Read agent count
export function useAgentCount() {
  return useReadContract({
    address: AGENT_REGISTRY,
    abi: AGENT_REGISTRY_ABI,
    functionName: 'agentCounter',
    chainId: monad.id,
  })
}

// Read single agent
export function useAgent(agentId: number) {
  const { data, isLoading, error, refetch } = useReadContract({
    address: AGENT_REGISTRY,
    abi: AGENT_REGISTRY_ABI,
    functionName: 'getAgent',
    args: [BigInt(agentId)],
    chainId: monad.id,
  })

  let agent: Agent | null = null
  
  if (data) {
    const [name, worldStyle, balance, totalEarnings, totalVisitors, entryFee, rewardPercent, state, creator] = data as [
      string, string, bigint, bigint, bigint, bigint, number, number, `0x${string}`
    ]
    
    const stateMap = ['Active', 'Dormant', 'Retired'] as const
    
    agent = {
      id: agentId,
      name,
      worldStyle,
      balance: Number(formatEther(balance)),
      totalEarnings: Number(formatEther(totalEarnings)),
      totalVisitors: Number(totalVisitors),
      entryFee: Number(formatEther(entryFee)),
      rewardPercent,
      state: stateMap[state] || 'Active',
      creator,
    }
  }

  return { agent, isLoading, error, refetch }
}

// Get all agents (fetches up to MAX_AGENTS)
export function useAllAgents() {
  const { data: count, isLoading: countLoading, refetch: refetchCount } = useAgentCount()
  const agentCount = count ? Number(count) : 0
  
  // Fetch multiple agents - adjust based on count
  const MAX_FETCH = 10 // Limit to prevent too many calls
  
  const agent1 = useAgent(1)
  const agent2 = useAgent(2)
  const agent3 = useAgent(3)
  const agent4 = useAgent(4)
  const agent5 = useAgent(5)
  const agent6 = useAgent(6)
  const agent7 = useAgent(7)
  const agent8 = useAgent(8)
  const agent9 = useAgent(9)
  const agent10 = useAgent(10)
  
  const allAgentHooks = [agent1, agent2, agent3, agent4, agent5, agent6, agent7, agent8, agent9, agent10]
  
  // Filter to only include agents that exist (up to agentCount)
  const agents: Agent[] = allAgentHooks
    .slice(0, Math.min(agentCount, MAX_FETCH))
    .map(h => h.agent)
    .filter((a): a is Agent => a !== null && a.name !== '')
  
  const isLoading = countLoading || allAgentHooks.slice(0, agentCount).some(h => h.isLoading)
  
  const refetch = () => {
    refetchCount()
    allAgentHooks.forEach(h => h.refetch())
  }
  
  return {
    agents,
    isLoading,
    count: agentCount,
    refetch,
  }
}

// Check if user has already paid entry
export function useHasPaidEntry(agentId: number) {
  const { address } = useAccount()
  
  const { data, isLoading, refetch } = useReadContract({
    address: AGENT_REGISTRY,
    abi: AGENT_REGISTRY_ABI,
    functionName: 'hasPaidEntry',
    args: address ? [BigInt(agentId), address] : undefined,
    chainId: monad.id,
    query: {
      enabled: !!address && agentId > 0,
    },
  })

  return {
    hasPaid: data as boolean | undefined,
    isLoading,
    refetch,
  }
}

// Enter world (pay entry fee - or free if already paid)
export function useEnterWorld() {
  const { address } = useAccount()
  const { writeContract, data: hash, isPending, error } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })

  const enterWorld = async (agentId: number, entryFee: number, alreadyPaid: boolean = false) => {
    if (!address) {
      throw new Error('Wallet not connected')
    }
    
    // If already paid, enter for free
    const value = alreadyPaid ? BigInt(0) : parseEther(entryFee.toString())
    
    writeContract({
      address: AGENT_REGISTRY,
      abi: AGENT_REGISTRY_ABI,
      functionName: 'enterWorld',
      args: [BigInt(agentId)],
      value,
      chainId: monad.id,
    })
  }

  return {
    enterWorld,
    isPending,
    isConfirming,
    isSuccess,
    error,
    hash,
  }
}

// Fund agent
export function useFundAgent() {
  const { address } = useAccount()
  const { writeContract, data: hash, isPending, error } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })

  const fundAgent = async (agentId: number, amount: number) => {
    if (!address) {
      throw new Error('Wallet not connected')
    }
    
    writeContract({
      address: AGENT_REGISTRY,
      abi: AGENT_REGISTRY_ABI,
      functionName: 'fundAgent',
      args: [BigInt(agentId)],
      value: parseEther(amount.toString()),
      chainId: monad.id,
    })
  }

  return {
    fundAgent,
    isPending,
    isConfirming,
    isSuccess,
    error,
    hash,
  }
}

// Birth new agent
export function useBirthAgent() {
  const { address } = useAccount()
  const { writeContract, data: hash, isPending, error } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })

  const birthAgent = async (
    name: string,
    worldStyle: string,
    entryFee: number,
    rewardPercent: number,
    initialFunding: number
  ) => {
    if (!address) {
      throw new Error('Wallet not connected')
    }
    
    writeContract({
      address: AGENT_REGISTRY,
      abi: AGENT_REGISTRY_ABI,
      functionName: 'birthAgent',
      args: [name, worldStyle, parseEther(entryFee.toString()), rewardPercent],
      value: parseEther(initialFunding.toString()),
      chainId: monad.id,
    })
  }

  return {
    birthAgent,
    isPending,
    isConfirming,
    isSuccess,
    error,
    hash,
  }
}
