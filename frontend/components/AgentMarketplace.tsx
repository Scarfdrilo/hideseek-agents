'use client'

import { useState, useEffect } from 'react'
import AgentCard from './AgentCard'

interface Agent {
  id: number
  name: string
  worldStyle: string
  personality: string
  balance: number
  totalEarnings: number
  totalVisitors: number
  entryFee: number
  rewardPercent: number
  state: 'Active' | 'Dormant' | 'Retired'
  creator: string
}

// Demo agents for MVP
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
    state: 'Active',
    creator: '0x1234...5678'
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
    state: 'Active',
    creator: '0xabcd...efgh'
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
    state: 'Dormant',
    creator: '0x9876...5432'
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
    state: 'Active',
    creator: '0xfedc...ba98'
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
    state: 'Active',
    creator: '0x1111...2222'
  }
]

interface Props {
  onEnterWorld: (agent: Agent) => void
}

export default function AgentMarketplace({ onEnterWorld }: Props) {
  const [agents, setAgents] = useState<Agent[]>(DEMO_AGENTS)
  const [filter, setFilter] = useState<'all' | 'active' | 'dormant'>('all')
  const [sortBy, setSortBy] = useState<'visitors' | 'earnings' | 'balance'>('visitors')
  const [notification, setNotification] = useState<string | null>(null)
  
  // Simulate life force decreasing over time
  useEffect(() => {
    const interval = setInterval(() => {
      setAgents(prev => prev.map(agent => {
        if (agent.state !== 'Active') return agent
        
        const burnRate = 0.0001 // per 5 seconds for demo
        const newBalance = Math.max(0, agent.balance - burnRate)
        
        // Check for dormancy
        if (newBalance < 0.001 && agent.state === 'Active') {
          setNotification(`💀 ${agent.name} has gone dormant!`)
          setTimeout(() => setNotification(null), 3000)
          return { ...agent, balance: newBalance, state: 'Dormant' as const }
        }
        
        return { ...agent, balance: newBalance }
      }))
    }, 5000)
    
    return () => clearInterval(interval)
  }, [])

  const handleFund = (agent: Agent, amount: number) => {
    setAgents(prev => prev.map(a => {
      if (a.id !== agent.id) return a
      const newBalance = a.balance + amount
      const newState = newBalance >= 0.001 ? 'Active' : a.state
      
      if (a.state === 'Dormant' && newState === 'Active') {
        setNotification(`✨ ${a.name} has been revived!`)
        setTimeout(() => setNotification(null), 3000)
      }
      
      return { ...a, balance: newBalance, state: newState as any }
    }))
  }

  const handleRevive = (agent: Agent) => {
    handleFund(agent, 0.01)
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

  return (
    <div className="marketplace">
      {/* Header */}
      <div className="header">
        <div className="title-section">
          <h1>🌐 Agent Worlds</h1>
          <p>Explore autonomous worlds, earn rewards, keep agents alive</p>
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
            onEnterWorld={onEnterWorld}
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
          <button className="btn-birth">Coming Soon</button>
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
          margin: 0 auto 2rem;
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

        .btn-birth {
          padding: 0.75rem 2rem;
          background: transparent;
          border: 1px solid var(--primary);
          border-radius: 8px;
          color: var(--primary);
          font-weight: bold;
          cursor: not-allowed;
          opacity: 0.5;
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
        }
      `}</style>
    </div>
  )
}
