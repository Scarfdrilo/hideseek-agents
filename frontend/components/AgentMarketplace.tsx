'use client'

import { useState, useEffect } from 'react'
import AgentCard from './AgentCard'
import { useAgents } from '@/hooks/useAgents'
import { Agent } from '@/lib/contracts'

interface Props {
  onEnterWorld: (agent: Agent) => void
}

export default function AgentMarketplace({ onEnterWorld }: Props) {
  const { agents, loading, error, isDemo, fundAgent, reviveAgent, enterWorld } = useAgents()
  const [filter, setFilter] = useState<'all' | 'active' | 'dormant'>('all')
  const [sortBy, setSortBy] = useState<'visitors' | 'earnings' | 'balance'>('visitors')
  const [notification, setNotification] = useState<string | null>(null)
  
  // Watch for dormancy events
  useEffect(() => {
    const dormantAgents = agents.filter(a => a.state === 'Dormant')
    // Could show notifications here
  }, [agents])

  const handleFund = async (agent: Agent, amount: number) => {
    try {
      await fundAgent(agent.id, amount)
      if (agent.state === 'Dormant') {
        setNotification(`✨ ${agent.name} has been revived!`)
        setTimeout(() => setNotification(null), 3000)
      } else {
        setNotification(`💰 Funded ${agent.name} with ${amount} MON`)
        setTimeout(() => setNotification(null), 3000)
      }
    } catch (err) {
      setNotification(`❌ Failed to fund agent`)
      setTimeout(() => setNotification(null), 3000)
    }
  }

  const handleRevive = async (agent: Agent) => {
    try {
      await reviveAgent(agent.id)
      setNotification(`✨ ${agent.name} has been revived!`)
      setTimeout(() => setNotification(null), 3000)
    } catch (err) {
      setNotification(`❌ Failed to revive agent`)
      setTimeout(() => setNotification(null), 3000)
    }
  }

  const handleEnterWorld = async (agent: Agent) => {
    await enterWorld(agent.id)
    onEnterWorld(agent)
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

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loader"></div>
        <p>Loading agents from chain...</p>
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
          {isDemo && (
            <span className="demo-badge">🎮 Demo Mode - Contract Not Deployed</span>
          )}
        </div>
        
        {/* Global Stats */}
        <div className="global-stats">
          <div className="global-stat">
            <span className="stat-value active">{totalActiveAgents}</span>
            <span className="stat-label">Active Agents</span>
          </div>
          <div className="global-stat">
            <span className="stat-value dormant">{totalDormant}</span>
            <span className="stat-label">Dormant</span>
          </div>
          <div className="global-stat">
            <span className="stat-value">{totalEconomy.toFixed(3)}</span>
            <span className="stat-label">Total MON</span>
          </div>
        </div>
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
        {filteredAgents.map(agent => (
          <AgentCard
            key={agent.id}
            agent={agent}
            onEnterWorld={handleEnterWorld}
            onFund={handleFund}
            onRevive={handleRevive}
          />
        ))}
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
          <button className="btn-birth" disabled={isDemo}>
            {isDemo ? 'Deploy Contract First' : 'Birth Agent'}
          </button>
        </div>
      </div>

      {/* Notification Toast */}
      {notification && (
        <div className="notification">
          {notification}
        </div>
      )}

      <style jsx>{`
        .marketplace {
          min-height: 100vh;
          background: var(--dark);
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
          background: linear-gradient(45deg, var(--primary), var(--secondary));
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          margin-bottom: 0.5rem;
        }

        .title-section p {
          color: #888;
          font-size: 1.1rem;
        }

        .demo-badge {
          display: inline-block;
          margin-top: 0.5rem;
          padding: 0.25rem 0.75rem;
          background: rgba(255, 170, 0, 0.2);
          border: 1px solid #ffaa00;
          border-radius: 4px;
          color: #ffaa00;
          font-size: 0.8rem;
        }

        .global-stats {
          display: flex;
          gap: 2rem;
          background: var(--card);
          padding: 1rem 2rem;
          border-radius: 12px;
          border: 1px solid var(--border);
        }

        .global-stat {
          text-align: center;
        }

        .global-stat .stat-value {
          display: block;
          font-size: 1.5rem;
          font-weight: bold;
          color: var(--primary);
        }

        .global-stat .stat-value.active {
          color: var(--primary);
        }

        .global-stat .stat-value.dormant {
          color: var(--danger);
        }

        .global-stat .stat-label {
          font-size: 0.8rem;
          color: #666;
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

        .badge-icon {
          font-size: 1.5rem;
        }

        .badge-text {
          font-weight: bold;
          color: #00aaff;
        }

        .badge-info {
          color: #888;
          font-size: 0.85rem;
          margin-left: auto;
        }

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
          background: var(--card);
          border: 1px solid var(--border);
          border-radius: 8px;
          color: #888;
          cursor: pointer;
          transition: all 0.2s;
        }

        .filter-group button:hover {
          border-color: var(--primary);
          color: #fff;
        }

        .filter-group button.active {
          background: var(--primary);
          color: #000;
          border-color: var(--primary);
        }

        .sort-group {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: #888;
        }

        .sort-group select {
          padding: 0.5rem;
          background: var(--card);
          border: 1px solid var(--border);
          border-radius: 8px;
          color: #fff;
          cursor: pointer;
        }

        .agent-grid {
          max-width: 1400px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 1.5rem;
        }

        .birth-cta {
          max-width: 1400px;
          margin: 3rem auto 0;
          background: linear-gradient(135deg, rgba(0, 255, 136, 0.1), rgba(0, 170, 255, 0.1));
          border: 1px dashed var(--primary);
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
          background: var(--primary);
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

        .notification {
          position: fixed;
          bottom: 2rem;
          left: 50%;
          transform: translateX(-50%);
          background: var(--card);
          padding: 1rem 2rem;
          border-radius: 12px;
          border: 2px solid var(--primary);
          font-size: 1.1rem;
          animation: slideUp 0.3s ease;
          z-index: 1000;
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translate(-50%, 20px);
          }
          to {
            opacity: 1;
            transform: translate(-50%, 0);
          }
        }

        @media (max-width: 768px) {
          .marketplace {
            padding: 1rem;
          }

          .header {
            flex-direction: column;
          }

          .global-stats {
            width: 100%;
            justify-content: space-around;
          }

          .title-section h1 {
            font-size: 1.8rem;
          }

          .erc-badge {
            flex-wrap: wrap;
          }

          .badge-info {
            width: 100%;
            margin-left: 0;
            margin-top: 0.5rem;
          }

          .cta-details {
            flex-direction: column;
            gap: 0.5rem;
          }
        }
      `}</style>
    </div>
  )
}
