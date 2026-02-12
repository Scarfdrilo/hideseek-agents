'use client'

import { useAccount, useConnect, useDisconnect, useBalance } from 'wagmi'
import { monad } from '@/lib/wagmi'

export function ConnectWallet() {
  const { address, isConnected, chain } = useAccount()
  const { connect, connectors, isPending } = useConnect()
  const { disconnect } = useDisconnect()
  const { data: balance } = useBalance({ address, chainId: monad.id })

  const connector = connectors[0]

  if (isConnected && address) {
    const isWrongNetwork = chain?.id !== monad.id
    
    return (
      <div className="wallet-connected">
        {isWrongNetwork && (
          <span className="wrong-network">⚠️ Wrong Network</span>
        )}
        <span className="balance">
          {balance ? `${(Number(balance.value) / 1e18).toFixed(4)} MON` : '...'} 
        </span>
        <button className="wallet-btn connected" onClick={() => disconnect()}>
          {address.slice(0, 6)}...{address.slice(-4)}
        </button>
        
        <style jsx>{`
          .wallet-connected {
            display: flex;
            align-items: center;
            gap: 0.75rem;
          }
          .wrong-network {
            background: #ff4444;
            color: white;
            padding: 0.25rem 0.5rem;
            border-radius: 6px;
            font-size: 0.8rem;
          }
          .balance {
            color: #00ff88;
            font-weight: bold;
            font-size: 0.9rem;
          }
          .wallet-btn {
            padding: 0.6rem 1rem;
            background: linear-gradient(45deg, #00ff88, #00cc6a);
            border: none;
            border-radius: 8px;
            color: #000;
            font-weight: bold;
            cursor: pointer;
            font-size: 0.9rem;
            transition: all 0.2s;
          }
          .wallet-btn:hover {
            transform: translateY(-1px);
            box-shadow: 0 4px 12px rgba(0, 255, 136, 0.3);
          }
          .wallet-btn.connected {
            background: #1a1a1a;
            border: 1px solid #00ff88;
            color: #00ff88;
          }
        `}</style>
      </div>
    )
  }

  return (
    <button 
      className="wallet-btn"
      onClick={() => connector && connect({ connector, chainId: monad.id })}
      disabled={isPending}
    >
      {isPending ? 'Connecting...' : '🔗 Connect Wallet'}
      
      <style jsx>{`
        .wallet-btn {
          padding: 0.6rem 1.2rem;
          background: linear-gradient(45deg, #00ff88, #00cc6a);
          border: none;
          border-radius: 8px;
          color: #000;
          font-weight: bold;
          cursor: pointer;
          font-size: 0.95rem;
          transition: all 0.2s;
        }
        .wallet-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0, 255, 136, 0.3);
        }
        .wallet-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
      `}</style>
    </button>
  )
}
