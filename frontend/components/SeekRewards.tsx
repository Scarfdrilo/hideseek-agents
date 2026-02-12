'use client'

import { useState, useEffect } from 'react'
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { SEEK_REWARDS_ADDRESS, SEEK_REWARDS_ABI, getRewardBalance, getPendingRewards, getRewardRates } from '@/lib/seekRewards'

export function SeekRewardsPanel() {
  const { address, isConnected } = useAccount()
  const [poolBalance, setPoolBalance] = useState<string>('0')
  const [pendingRewards, setPendingRewards] = useState<string>('0')
  const [rates, setRates] = useState({ perVisit: '10', perAgent: '100' })
  const [loading, setLoading] = useState(true)

  const { writeContract, data: hash, isPending } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })

  useEffect(() => {
    async function loadData() {
      try {
        const [balance, ratesData] = await Promise.all([
          getRewardBalance(),
          getRewardRates(),
        ])
        setPoolBalance(balance)
        setRates(ratesData)
        
        if (address) {
          const pending = await getPendingRewards(address)
          setPendingRewards(pending)
        }
      } catch (e) {
        console.error('Error loading rewards:', e)
      }
      setLoading(false)
    }
    loadData()
  }, [address, isSuccess])

  const claimRewards = () => {
    writeContract({
      address: SEEK_REWARDS_ADDRESS,
      abi: SEEK_REWARDS_ABI,
      functionName: 'claimRewards',
    })
  }

  if (loading) return <div className="animate-pulse">Loading $SEEK rewards...</div>

  return (
    <div className="bg-gradient-to-br from-purple-900/50 to-pink-900/50 rounded-xl p-6 border border-purple-500/30">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-2xl">🎯</span>
        <h2 className="text-xl font-bold text-purple-300">$SEEK Rewards</h2>
      </div>
      
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-black/30 rounded-lg p-3">
          <div className="text-sm text-gray-400">Pool Balance</div>
          <div className="text-xl font-bold text-green-400">
            {Number(poolBalance).toLocaleString()} $SEEK
          </div>
        </div>
        
        <div className="bg-black/30 rounded-lg p-3">
          <div className="text-sm text-gray-400">Your Pending</div>
          <div className="text-xl font-bold text-yellow-400">
            {Number(pendingRewards).toLocaleString()} $SEEK
          </div>
        </div>
      </div>

      <div className="text-sm text-gray-400 mb-4 space-y-1">
        <div>🎮 Visit a world: <span className="text-purple-300">{rates.perVisit} $SEEK</span></div>
        <div>🏗️ Create an agent: <span className="text-purple-300">{rates.perAgent} $SEEK</span></div>
      </div>

      {isConnected && Number(pendingRewards) > 0 && (
        <button
          onClick={claimRewards}
          disabled={isPending || isConfirming}
          className="w-full py-3 px-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 rounded-lg font-bold transition-all disabled:opacity-50"
        >
          {isPending || isConfirming ? 'Claiming...' : `Claim ${pendingRewards} $SEEK`}
        </button>
      )}

      {isSuccess && (
        <div className="mt-2 text-sm text-green-400 text-center">
          ✅ Rewards claimed successfully!
        </div>
      )}

      <div className="mt-4 text-xs text-gray-500">
        Contract: <a 
          href={`https://explorer.monad.xyz/address/${SEEK_REWARDS_ADDRESS}`}
          target="_blank"
          className="text-purple-400 hover:underline"
        >
          {SEEK_REWARDS_ADDRESS.slice(0, 10)}...
        </a>
      </div>
    </div>
  )
}

export function SeekRewardsBadge({ agentId }: { agentId: number }) {
  const { address, isConnected } = useAccount()
  const [canClaim, setCanClaim] = useState(false)
  
  const { writeContract, data: hash, isPending } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })

  useEffect(() => {
    // Check if user can claim for this agent
    // Would need to add check function
    if (isConnected && address) {
      setCanClaim(true) // Simplified - should check visitRewarded
    }
  }, [isConnected, address, agentId])

  const claimVisitReward = () => {
    writeContract({
      address: SEEK_REWARDS_ADDRESS,
      abi: SEEK_REWARDS_ABI,
      functionName: 'claimVisitReward',
      args: [BigInt(agentId)],
    })
  }

  if (!isConnected || !canClaim) return null

  return (
    <button
      onClick={claimVisitReward}
      disabled={isPending || isConfirming || isSuccess}
      className="text-xs px-2 py-1 bg-purple-600/50 hover:bg-purple-500/50 rounded border border-purple-400/30 transition-all disabled:opacity-50"
    >
      {isSuccess ? '✅ Claimed!' : isPending || isConfirming ? '...' : '🎯 Claim 10 $SEEK'}
    </button>
  )
}
