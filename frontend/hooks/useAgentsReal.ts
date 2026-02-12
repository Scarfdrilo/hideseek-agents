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

// Get all agents
export function useAllAgents() {
  const { data: count, isLoading: countLoading } = useAgentCount()
  const agentCount = count ? Number(count) : 0
  
  // For now just get agent 1 (genesis) - in production would loop
  const { agent: agent1, isLoading: agent1Loading, refetch } = useAgent(1)
  
  const agents: Agent[] = agent1 ? [agent1] : []
  
  return {
    agents,
    isLoading: countLoading || agent1Loading,
    count: agentCount,
    refetch,
  }
}

// Enter world (pay entry fee)
export function useEnterWorld() {
  const { address } = useAccount()
  const { writeContract, data: hash, isPending, error } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })

  const enterWorld = async (agentId: number, entryFee: number) => {
    if (!address) {
      throw new Error('Wallet not connected')
    }
    
    writeContract({
      address: AGENT_REGISTRY,
      abi: AGENT_REGISTRY_ABI,
      functionName: 'enterWorld',
      args: [BigInt(agentId)],
      value: parseEther(entryFee.toString()),
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
