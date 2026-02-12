'use client'

import { useState } from 'react'
import { useAccount } from 'wagmi'
import AgentCard from './AgentCard'
import { ConnectWallet } from './ConnectWallet'
import { useAllAgents, useEnterWorld, useFundAgent, useBirthAgent, useHasPaidEntry, type Agent } from '@/hooks/useAgentsReal'

interface Props {
  onEnterWorld: (agent: Agent) => void
}

export default function AgentMarketplace({ onEnterWorld }: Props) {
  const { isConnected } = useAccount()
  const { agents, isLoading, count, refetch } = useAllAgents()
  const { enterWorld, isPending: enterPending, isConfirming: enterConfirming, isSuccess: enterSuccess } = useEnterWorld()
  const { fundAgent, isPending: fundPending, isConfirming: fundConfirming } = useFundAgent()
  const { birthAgent, isPending: birthPending, isConfirming: birthConfirming, isSuccess: birthSuccess } = useBirthAgent()
  
  const [filter, setFilter] = useState<'all' | 'active' | 'dormant'>('all')
  const [sortBy, setSortBy] = useState<'visitors' | 'earnings' | 'balance'>('visitors')
  const [notification, setNotification] = useState<string | null>(null)
  const [showBirthModal, setShowBirthModal] = useState(false)
  const [pendingAgent, setPendingAgent] = useState<Agent | null>(null)

  const showNotification = (msg: string) => {
    setNotification(msg)
    setTimeout(() => setNotification(null), 4000)
  }

  const handleFund = async (agent: Agent, amount: number) => {
    if (!isConnected) {
      showNotification('🔗 Connect wallet first!')
      return
    }
    try {
      await fundAgent(agent.id, amount)
      showNotification(`💰 Funding ${agent.name} with ${amount} MON...`)
    } catch (err: any) {
      showNotification(`❌ ${err.message || 'Failed to fund'}`)
    }
  }

  const handleRevive = async (agent: Agent) => {
    return handleFund(agent, 0.01)
  }

  const handleEnterWorld = async (agent: Agent, hasPaid: boolean = false) => {
    if (!isConnected) {
      showNotification('🔗 Connect wallet to enter worlds!')
      return
    }
    
    setPendingAgent(agent)
    const feeMsg = hasPaid ? 'FREE re-entry!' : `${agent.entryFee} MON`
    showNotification(`🎮 Entering ${agent.name}'s world... (${feeMsg})`)
    
    try {
      await enterWorld(agent.id, agent.entryFee, hasPaid)
      // Will navigate after tx confirms
    } catch (err: any) {
      showNotification(`❌ ${err.message || 'Failed to enter'}`)
      setPendingAgent(null)
    }
  }

  // Navigate when enter tx succeeds
  if (enterSuccess && pendingAgent) {
    onEnterWorld(pendingAgent)
  }

  const filteredAgents = agents
    .filter(a => filter === 'all' || (filter === 'active' ? a.state === 'Active' : a.state === 'Dormant'))
    .sort((a, b) => {
      if (sortBy === 'visitors') return b.totalVisitors - a.totalVisitors
      if (sortBy === 'earnings') return b.totalEarnings - a.totalEarnings
      return b.balance - a.balance
    })

  const totalActiveAgents = agents.filter(a => a.state === 'Active').length
  const totalDormant = agents.filter(a => a.state === 'Dormant').length
  const totalEconomy = agents.reduce((sum, a) => sum + a.balance, 0)

  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="loader"></div>
        <p>Loading agents from Monad...</p>
        <style jsx>{`
          .loading-container {
            min-height: 100vh;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            background: #0a0a0a;
            gap: 1rem;
          }
          .loader {
            width: 50px;
            height: 50px;
            border: 3px solid #222;
            border-top-color: #00ff88;
            border-radius: 50%;
            animation: spin 1s linear infinite;
          }
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
          p { color: #888; }
        `}</style>
      </div>
    )
  }

  return (
    <div className="marketplace">
      {/* Header */}
      <div className="header">
        <div className="title-section">
          <h1>🌐 Agent Worlds</h1>
          <p>Explore autonomous worlds, earn rewards, keep agents alive</p>
          <div className="chain-badge">
            <span className="chain-dot"></span>
            Monad Mainnet • {count} Agent{count !== 1 ? 's' : ''}
          </div>
        </div>
        
        <div className="header-right">
          <ConnectWallet />
        </div>
      </div>

      {/* Global Stats */}
      <div className="stats-bar">
        <div className="global-stat">
          <span className="stat-value active">{totalActiveAgents}</span>
          <span className="stat-label">Active Agents</span>
        </div>
        <div className="global-stat">
          <span className="stat-value dormant">{totalDormant}</span>
          <span className="stat-label">Dormant</span>
        </div>
        <div className="global-stat">
          <span className="stat-value">{totalEconomy.toFixed(4)}</span>
          <span className="stat-label">Total MON</span>
        </div>
        <button className="btn-refresh" onClick={() => refetch()}>
          🔄 Refresh
        </button>
      </div>

      {/* ERC-8004 Badge */}
      <div className="erc-badge">
        <span className="badge-icon">🔐</span>
        <span className="badge-text">ERC-8004 Compliant Agent Identities</span>
        <span className="badge-info">On-chain verifiable • Capability-based • x402 Ready</span>
      </div>

      {/* Filters */}
      <div className="filters">
        <div className="filter-group">
          <button 
            className={filter === 'all' ? 'active' : ''}
            onClick={() => setFilter('all')}
          >
            All
          </button>
          <button 
            className={filter === 'active' ? 'active' : ''}
            onClick={() => setFilter('active')}
          >
            ⚡ Active
          </button>
          <button 
            className={filter === 'dormant' ? 'active' : ''}
            onClick={() => setFilter('dormant')}
          >
            💀 Dormant
          </button>
        </div>
        
        <div className="sort-group">
          <span>Sort by:</span>
          <select value={sortBy} onChange={e => setSortBy(e.target.value as any)}>
            <option value="visitors">Most Visited</option>
            <option value="earnings">Top Earners</option>
            <option value="balance">Healthiest</option>
          </select>
        </div>
      </div>

      {/* Agent Grid */}
      <div className="agent-grid">
        {filteredAgents.length === 0 ? (
          <div className="no-agents">
            <p>No agents found. Birth the first one!</p>
          </div>
        ) : (
          filteredAgents.map(agent => (
            <AgentCard
              key={agent.id}
              agent={agent}
              onEnterWorld={handleEnterWorld}
              onFund={handleFund}
              onRevive={handleRevive}
              isPending={enterPending || enterConfirming}
            />
          ))
        )}
      </div>

      {/* Birth New Agent CTA */}
      <div className="birth-cta">
        <div className="cta-content">
          <h3>🐣 Birth a New Agent</h3>
          <p>Create your own autonomous world with a unique personality</p>
          <div className="cta-details">
            <span>🔐 ERC-8004 Identity</span>
            <span>💰 0.01 MON minimum</span>
            <span>🎨 Custom world style</span>
          </div>
          <button 
            className="btn-birth" 
            onClick={() => setShowBirthModal(true)}
            disabled={!isConnected || birthPending || birthConfirming}
          >
            {!isConnected ? 'Connect Wallet First' : 
             birthPending ? 'Confirm in Wallet...' :
             birthConfirming ? 'Birthing...' :
             'Birth Agent'}
          </button>
        </div>
      </div>

      {/* Transaction Status */}
      {(enterPending || enterConfirming || fundPending || fundConfirming) && (
        <div className="tx-status">
          <div className="tx-spinner"></div>
          <span>
            {enterPending || fundPending ? 'Confirm in wallet...' : 'Waiting for confirmation...'}
          </span>
        </div>
      )}

      {/* Notification Toast */}
      {notification && (
        <div className="notification">
          {notification}
        </div>
      )}

      {/* Birth Modal (simplified) */}
      {showBirthModal && (
        <div className="modal-overlay" onClick={() => setShowBirthModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>🐣 Birth New Agent</h2>
            <form onSubmit={async (e) => {
              e.preventDefault()
              const form = e.target as HTMLFormElement
              const data = new FormData(form)
              try {
                await birthAgent(
                  data.get('name') as string,
                  data.get('style') as string,
                  parseFloat(data.get('entryFee') as string),
                  parseInt(data.get('rewardPercent') as string),
                  parseFloat(data.get('funding') as string)
                )
                setShowBirthModal(false)
                showNotification('🎉 Agent birth initiated!')
              } catch (err: any) {
                showNotification(`❌ ${err.message}`)
              }
            }}>
              <label>
                Agent Name
                <input name="name" required placeholder="e.g. NeoJungler" />
              </label>
              <label>
                World Style
                <select name="style" required>
                  <option value="neon_jungle">🌿 Neon Jungle</option>
                  <option value="cyber_ruins">🏚️ Cyber Ruins</option>
                  <option value="crystal_caves">💎 Crystal Caves</option>
                  <option value="void_space">🌌 Void Space</option>
                </select>
              </label>
              <label>
                Entry Fee (MON)
                <input name="entryFee" type="number" step="0.001" defaultValue="0.003" required />
              </label>
              <label>
                Reward % (to players)
                <input name="rewardPercent" type="number" min="50" max="90" defaultValue="75" required />
              </label>
              <label>
                Initial Funding (MON)
                <input name="funding" type="number" step="0.01" defaultValue="0.05" required />
              </label>
              <div className="modal-actions">
                <button type="button" onClick={() => setShowBirthModal(false)}>Cancel</button>
                <button type="submit" disabled={birthPending || birthConfirming}>
                  {birthPending ? 'Confirm...' : birthConfirming ? 'Birthing...' : 'Birth Agent'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style jsx>{`
        .marketplace {
          min-height: 100vh;
          background: #0a0a0a;
          padding: 2rem;
        }

        .header {
          max-width: 1400px;
          margin: 0 auto 1rem;
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          flex-wrap: wrap;
          gap: 1rem;
        }

        .title-section h1 {
          font-size: 2.5rem;
          background: linear-gradient(45deg, #00ff88, #00aaff);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          margin-bottom: 0.5rem;
        }

        .title-section p {
          color: #888;
          font-size: 1.1rem;
        }

        .chain-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          margin-top: 0.5rem;
          padding: 0.25rem 0.75rem;
          background: rgba(0, 255, 136, 0.1);
          border: 1px solid #00ff88;
          border-radius: 20px;
          color: #00ff88;
          font-size: 0.85rem;
        }

        .chain-dot {
          width: 8px;
          height: 8px;
          background: #00ff88;
          border-radius: 50%;
          animation: pulse 2s infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }

        .header-right {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .stats-bar {
          max-width: 1400px;
          margin: 0 auto 1rem;
          display: flex;
          align-items: center;
          gap: 2rem;
          background: #111;
          padding: 1rem 2rem;
          border-radius: 12px;
          border: 1px solid #222;
        }

        .global-stat {
          text-align: center;
        }

        .global-stat .stat-value {
          display: block;
          font-size: 1.5rem;
          font-weight: bold;
          color: #00ff88;
        }

        .global-stat .stat-value.dormant {
          color: #ff4444;
        }

        .global-stat .stat-label {
          font-size: 0.8rem;
          color: #666;
        }

        .btn-refresh {
          margin-left: auto;
          padding: 0.5rem 1rem;
          background: transparent;
          border: 1px solid #333;
          border-radius: 8px;
          color: #888;
          cursor: pointer;
        }

        .btn-refresh:hover {
          border-color: #00ff88;
          color: #00ff88;
        }

        .erc-badge {
          max-width: 1400px;
          margin: 0 auto 1.5rem;
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.75rem 1.5rem;
          background: linear-gradient(135deg, rgba(0, 170, 255, 0.1), rgba(138, 43, 226, 0.1));
          border: 1px solid rgba(0, 170, 255, 0.3);
          border-radius: 8px;
        }

        .badge-icon { font-size: 1.5rem; }
        .badge-text { font-weight: bold; color: #00aaff; }
        .badge-info { color: #888; font-size: 0.85rem; margin-left: auto; }

        .filters {
          max-width: 1400px;
          margin: 0 auto 1.5rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 1rem;
        }

        .filter-group {
          display: flex;
          gap: 0.5rem;
        }

        .filter-group button {
          padding: 0.5rem 1rem;
          background: #111;
          border: 1px solid #222;
          border-radius: 8px;
          color: #888;
          cursor: pointer;
          transition: all 0.2s;
        }

        .filter-group button:hover {
          border-color: #00ff88;
          color: #fff;
        }

        .filter-group button.active {
          background: #00ff88;
          color: #000;
          border-color: #00ff88;
        }

        .sort-group {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: #888;
        }

        .sort-group select {
          padding: 0.5rem;
          background: #111;
          border: 1px solid #222;
          border-radius: 8px;
          color: #fff;
          cursor: pointer;
        }

        .agent-grid {
          max-width: 1400px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 1.5rem;
        }

        .no-agents {
          grid-column: 1 / -1;
          text-align: center;
          padding: 3rem;
          color: #666;
        }

        .birth-cta {
          max-width: 1400px;
          margin: 3rem auto 0;
          background: linear-gradient(135deg, rgba(0, 255, 136, 0.1), rgba(0, 170, 255, 0.1));
          border: 1px dashed #00ff88;
          border-radius: 16px;
          padding: 2rem;
          text-align: center;
        }

        .cta-content h3 {
          font-size: 1.5rem;
          margin-bottom: 0.5rem;
        }

        .cta-content p {
          color: #888;
          margin-bottom: 1rem;
        }

        .cta-details {
          display: flex;
          justify-content: center;
          gap: 2rem;
          margin-bottom: 1.5rem;
          color: #666;
          font-size: 0.9rem;
        }

        .btn-birth {
          padding: 0.75rem 2rem;
          background: #00ff88;
          border: none;
          border-radius: 8px;
          color: #000;
          font-weight: bold;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-birth:disabled {
          background: #333;
          color: #666;
          cursor: not-allowed;
        }

        .btn-birth:not(:disabled):hover {
          transform: scale(1.02);
          box-shadow: 0 0 20px rgba(0, 255, 136, 0.4);
        }

        .tx-status {
          position: fixed;
          bottom: 6rem;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          align-items: center;
          gap: 0.75rem;
          background: #111;
          padding: 1rem 2rem;
          border-radius: 12px;
          border: 1px solid #00aaff;
          z-index: 1000;
        }

        .tx-spinner {
          width: 20px;
          height: 20px;
          border: 2px solid #222;
          border-top-color: #00aaff;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        .notification {
          position: fixed;
          bottom: 2rem;
          left: 50%;
          transform: translateX(-50%);
          background: #111;
          padding: 1rem 2rem;
          border-radius: 12px;
          border: 2px solid #00ff88;
          font-size: 1.1rem;
          animation: slideUp 0.3s ease;
          z-index: 1000;
        }

        @keyframes slideUp {
          from { opacity: 0; transform: translate(-50%, 20px); }
          to { opacity: 1; transform: translate(-50%, 0); }
        }

        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.8);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 2000;
        }

        .modal {
          background: #111;
          border: 1px solid #333;
          border-radius: 16px;
          padding: 2rem;
          max-width: 400px;
          width: 90%;
        }

        .modal h2 {
          margin-bottom: 1.5rem;
          text-align: center;
        }

        .modal label {
          display: block;
          margin-bottom: 1rem;
          color: #888;
          font-size: 0.9rem;
        }

        .modal input, .modal select {
          width: 100%;
          padding: 0.75rem;
          margin-top: 0.25rem;
          background: #0a0a0a;
          border: 1px solid #333;
          border-radius: 8px;
          color: #fff;
          font-size: 1rem;
        }

        .modal input:focus, .modal select:focus {
          outline: none;
          border-color: #00ff88;
        }

        .modal-actions {
          display: flex;
          gap: 1rem;
          margin-top: 1.5rem;
        }

        .modal-actions button {
          flex: 1;
          padding: 0.75rem;
          border-radius: 8px;
          font-weight: bold;
          cursor: pointer;
        }

        .modal-actions button[type="button"] {
          background: transparent;
          border: 1px solid #333;
          color: #888;
        }

        .modal-actions button[type="submit"] {
          background: #00ff88;
          border: none;
          color: #000;
        }

        .modal-actions button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        @media (max-width: 768px) {
          .marketplace { padding: 1rem; }
          .header { flex-direction: column; }
          .stats-bar { flex-wrap: wrap; gap: 1rem; }
          .title-section h1 { font-size: 1.8rem; }
          .erc-badge { flex-wrap: wrap; }
          .badge-info { width: 100%; margin-left: 0; margin-top: 0.5rem; }
          .cta-details { flex-direction: column; gap: 0.5rem; }
        }
      `}</style>
    </div>
  )
}
