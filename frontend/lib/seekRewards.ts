import { createPublicClient, createWalletClient, http, parseAbi, formatEther } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'

export const SEEK_REWARDS_ADDRESS = '0x23482CC461D0c19ffA1F5599cF3f8aEBbbccF16B' as const
export const SEEK_TOKEN_ADDRESS = '0x3b52D032e9A9C064e38Bbe0f7c1C8814f05b7777' as const
export const AGENT_REGISTRY_ADDRESS = '0x769c418EA0481f45Ea20071186cd00013Ef7eD28' as const

export const SEEK_REWARDS_ABI = parseAbi([
  'function rewardPerVisit() view returns (uint256)',
  'function rewardPerAgent() view returns (uint256)',
  'function pendingRewards(address user) view returns (uint256)',
  'function rewardBalance() view returns (uint256)',
  'function claimVisitReward(uint256 agentId)',
  'function claimAgentReward(uint256 agentId)',
  'function claimRewards()',
  'function visitRewarded(uint256 agentId, address visitor) view returns (bool)',
  'function agentRewarded(uint256 agentId) view returns (bool)',
  'event VisitRewarded(uint256 indexed agentId, address indexed visitor, uint256 amount)',
  'event RewardsClaimed(address indexed user, uint256 amount)',
])

export const MONAD_CHAIN = {
  id: 143,
  name: 'Monad',
  nativeCurrency: { name: 'MON', symbol: 'MON', decimals: 18 },
  rpcUrls: { default: { http: ['https://rpc.monad.xyz'] } },
}

export function getPublicClient() {
  return createPublicClient({
    chain: MONAD_CHAIN as any,
    transport: http('https://rpc.monad.xyz'),
  })
}

export async function getRewardBalance(): Promise<string> {
  const client = getPublicClient()
  const balance = await client.readContract({
    address: SEEK_REWARDS_ADDRESS,
    abi: SEEK_REWARDS_ABI,
    functionName: 'rewardBalance',
  })
  return formatEther(balance as bigint)
}

export async function getPendingRewards(userAddress: string): Promise<string> {
  const client = getPublicClient()
  const pending = await client.readContract({
    address: SEEK_REWARDS_ADDRESS,
    abi: SEEK_REWARDS_ABI,
    functionName: 'pendingRewards',
    args: [userAddress as `0x${string}`],
  })
  return formatEther(pending as bigint)
}

export async function getRewardRates(): Promise<{ perVisit: string; perAgent: string }> {
  const client = getPublicClient()
  
  const [perVisit, perAgent] = await Promise.all([
    client.readContract({
      address: SEEK_REWARDS_ADDRESS,
      abi: SEEK_REWARDS_ABI,
      functionName: 'rewardPerVisit',
    }),
    client.readContract({
      address: SEEK_REWARDS_ADDRESS,
      abi: SEEK_REWARDS_ABI,
      functionName: 'rewardPerAgent',
    }),
  ])
  
  return {
    perVisit: formatEther(perVisit as bigint),
    perAgent: formatEther(perAgent as bigint),
  }
}

export async function canClaimVisitReward(agentId: number, userAddress: string): Promise<boolean> {
  const client = getPublicClient()
  const rewarded = await client.readContract({
    address: SEEK_REWARDS_ADDRESS,
    abi: SEEK_REWARDS_ABI,
    functionName: 'visitRewarded',
    args: [BigInt(agentId), userAddress as `0x${string}`],
  })
  return !(rewarded as boolean)
}
