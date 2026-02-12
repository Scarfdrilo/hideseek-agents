'use client'

import { useState, useEffect } from 'react'
import { type Agent } from '@/hooks/useAgentsReal'

const WORLD_STYLES: Record<string, { gradient: string; emoji: string; description: string }> = {
  crystal: {
    gradient: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
    emoji: '💎',
    description: 'Crystalline labyrinths with prismatic walls'
  },
  neon_jungle: {
    gradient: 'linear-gradient(135deg, #00ff87 0%, #60efff 100%)',
    emoji: '🌴',
    description: 'Bioluminescent forests of neon flora'
  },
  organic_maze: {
    gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    emoji: '🧬',
    description: 'Living, breathing organic structures'
  },
  void_realm: {
    gradient: 'linear-gradient(135deg, #232526 0%, #414345 100%)',
    emoji: '🌑',
    description: 'Floating islands in infinite darkness'
  },
  rainbow: {
    gradient: 'linear-gradient(135deg, #f5af19 0%, #f12711 50%, #a855f7 100%)',
    emoji: '🌈',
    description: 'Chaotic colorful dreamscapes'
  }
}

export default function AgentCard({ 
  agent, 
  onEnterWorld, 
  onFund, 
  onRevive,
  isPending = false
}: { 
  agent: Agent
  onEnterWorld: (agent: Agent) => void
  onFund: (agent: Agent, amount: number) => void
  onRevive: (agent: Agent) => void
  isPending?: boolean
}) {
  const [lifePercent, setLifePercent] = useState(100)
  const [isHovered, setIsHovered] = useState(false)
  const [showFundModal, setShowFundModal] = useState(false)
  const [fundAmount, setFundAmount] = useState('0.01')
  
  const style = WORLD_STYLES[agent.worldStyle] || WORLD_STYLES.crystal
  const isActive = agent.state === 'Active'
  const isDormant = agent.state === 'Dormant'
  
  // Calculate life percentage (max 0.1 ETH = 100%)
  useEffect(() => {
    const maxLife = 0.1 // ETH
    const percent = Math.min((agent.balance / maxLife) * 100, 100)
    setLifePercent(percent)
  }, [agent.balance])

  const formatBalance = (eth: number) => {
    if (eth < 0.001) return '< 0.001'
    return eth.toFixed(4)
  }

  return (
    <>
      <div 
        className={`agent-card ${isDormant ? 'dormant' : ''} ${isHovered ? 'hovered' : ''}`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* World Preview */}
        <div className="world-preview" style={{ background: style.gradient }}>
          <div className="world-emoji">{style.emoji}</div>
          {agent.id === 1 && (
            <div className="genesis-badge">
              <span>🦾 GENESIS</span>
            </div>
          )}
          {isDormant && (
            <div className="dormant-overlay">
              <span className="dormant-icon">💀</span>
              <span>DORMANT</span>
            </div>
          )}
        </div>

        {/* Agent Info */}
        <div className="agent-info">
          <div className="agent-header">
            <h3>{agent.name}</h3>
            <span className={`state-badge ${agent.state.toLowerCase()}`}>
              {agent.state}
            </span>
          </div>
          
          <p className="world-style">{style.description}</p>

          {/* Life Force Bar */}
          <div className="life-container">
            <div className="life-label">
              <span>⚡ Life Force</span>
              <span>{formatBalance(agent.balance)} MON</span>
            </div>
            <div className="life-bar">
              <div 
                className="life-fill"
                style={{ 
                  width: `${lifePercent}%`,
                  background: lifePercent > 50 
                    ? 'var(--primary)' 
                    : lifePercent > 20 
                      ? 'var(--warning)' 
                      : 'var(--danger)'
                }}
              />
            </div>
          </div>

          {/* Stats */}
          <div className="stats-row">
            <div className="stat">
              <span className="stat-label">Entry Fee</span>
              <span className="stat-value">{agent.entryFee} MON</span>
            </div>
            <div className="stat">
              <span className="stat-label">Rewards</span>
              <span className="stat-value">{agent.rewardPercent}%</span>
            </div>
            <div className="stat">
              <span className="stat-label">Visitors</span>
              <span className="stat-value">{agent.totalVisitors}</span>
            </div>
          </div>

          {/* Actions */}
          <div className="actions">
            {isActive ? (
              <>
                <button 
                  className="btn-primary"
                  onClick={() => onEnterWorld(agent)}
                >
                  🚀 Enter World
                </button>
                <button 
                  className="btn-secondary"
                  onClick={() => setShowFundModal(true)}
                >
                  💰 Fund
                </button>
              </>
            ) : isDormant ? (
              <button 
                className="btn-revive"
                onClick={() => onRevive(agent)}
              >
                ✨ Revive Agent (0.01 MON)
              </button>
            ) : (
              <button className="btn-disabled" disabled>
                Agent Retired
              </button>
            )}
          </div>
        </div>

        <style jsx>{`
          .agent-card {
            background: var(--card);
            border-radius: 16px;
            overflow: hidden;
            border: 1px solid var(--border);
            transition: all 0.3s ease;
          }

          .agent-card.hovered {
            transform: translateY(-4px);
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
            border-color: var(--primary);
          }

          .agent-card.dormant {
            animation: dormantPulse 3s infinite;
          }

          .world-preview {
            height: 120px;
            display: flex;
            align-items: center;
            justify-content: center;
            position: relative;
          }

          .world-emoji {
            font-size: 3rem;
            filter: drop-shadow(0 4px 8px rgba(0,0,0,0.3));
          }

          .genesis-badge {
            position: absolute;
            top: 8px;
            right: 8px;
            background: linear-gradient(135deg, #ffd700, #ff8c00);
            padding: 0.25rem 0.5rem;
            border-radius: 4px;
            font-size: 0.7rem;
            font-weight: bold;
            color: #000;
            animation: glow 2s infinite;
          }

          @keyframes glow {
            0%, 100% { box-shadow: 0 0 5px rgba(255, 215, 0, 0.5); }
            50% { box-shadow: 0 0 20px rgba(255, 215, 0, 0.8); }
          }

          .dormant-overlay {
            position: absolute;
            inset: 0;
            background: rgba(0, 0, 0, 0.7);
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 0.5rem;
            color: #666;
            font-weight: bold;
            font-size: 0.9rem;
          }

          .dormant-icon {
            font-size: 2rem;
          }

          .agent-info {
            padding: 1rem;
          }

          .agent-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 0.5rem;
          }

          .agent-header h3 {
            font-size: 1.2rem;
            color: #fff;
          }

          .state-badge {
            padding: 0.25rem 0.5rem;
            border-radius: 4px;
            font-size: 0.7rem;
            font-weight: bold;
            text-transform: uppercase;
          }

          .state-badge.active {
            background: rgba(0, 255, 136, 0.2);
            color: var(--primary);
          }

          .state-badge.dormant {
            background: rgba(255, 68, 68, 0.2);
            color: var(--danger);
          }

          .state-badge.retired {
            background: rgba(100, 100, 100, 0.2);
            color: #666;
          }

          .world-style {
            color: #888;
            font-size: 0.85rem;
            margin-bottom: 1rem;
          }

          .life-container {
            margin-bottom: 1rem;
          }

          .life-label {
            display: flex;
            justify-content: space-between;
            font-size: 0.8rem;
            margin-bottom: 0.25rem;
            color: #aaa;
          }

          .life-bar {
            height: 8px;
            background: var(--border);
            border-radius: 4px;
            overflow: hidden;
          }

          .life-fill {
            height: 100%;
            border-radius: 4px;
            transition: width 0.5s ease, background 0.3s ease;
          }

          .stats-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 1rem;
          }

          .stat {
            text-align: center;
          }

          .stat-label {
            display: block;
            font-size: 0.7rem;
            color: #666;
            margin-bottom: 0.25rem;
          }

          .stat-value {
            font-size: 0.9rem;
            font-weight: bold;
            color: var(--primary);
          }

          .actions {
            display: flex;
            gap: 0.5rem;
          }

          .btn-primary, .btn-secondary, .btn-revive, .btn-disabled {
            flex: 1;
            padding: 0.75rem;
            border: none;
            border-radius: 8px;
            font-weight: bold;
            cursor: pointer;
            transition: all 0.2s ease;
            font-size: 0.9rem;
          }

          .btn-primary {
            background: var(--primary);
            color: #000;
          }

          .btn-primary:hover {
            background: #00cc6a;
            transform: scale(1.02);
          }

          .btn-secondary {
            background: transparent;
            border: 1px solid var(--primary);
            color: var(--primary);
          }

          .btn-secondary:hover {
            background: rgba(0, 255, 136, 0.1);
          }

          .btn-revive {
            background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
            color: #fff;
            width: 100%;
          }

          .btn-revive:hover {
            transform: scale(1.02);
            box-shadow: 0 0 20px rgba(240, 147, 251, 0.5);
          }

          .btn-disabled {
            background: #333;
            color: #666;
            cursor: not-allowed;
            width: 100%;
          }
        `}</style>
      </div>

      {/* Fund Modal */}
      {showFundModal && (
        <div className="modal-overlay" onClick={() => setShowFundModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>💰 Fund {agent.name}</h3>
            <p>Keep this agent alive by adding to their life force.</p>
            <input 
              type="number" 
              value={fundAmount}
              onChange={e => setFundAmount(e.target.value)}
              step="0.001"
              min="0.001"
            />
            <div className="modal-actions">
              <button 
                className="btn-secondary"
                onClick={() => setShowFundModal(false)}
              >
                Cancel
              </button>
              <button 
                className="btn-primary"
                onClick={() => {
                  onFund(agent, parseFloat(fundAmount))
                  setShowFundModal(false)
                }}
              >
                Fund {fundAmount} MON
              </button>
            </div>
          </div>
          <style jsx>{`
            .modal-overlay {
              position: fixed;
              inset: 0;
              background: rgba(0, 0, 0, 0.8);
              display: flex;
              align-items: center;
              justify-content: center;
              z-index: 1000;
            }

            .modal {
              background: var(--card);
              padding: 2rem;
              border-radius: 16px;
              border: 1px solid var(--border);
              max-width: 400px;
              width: 90%;
            }

            .modal h3 {
              margin-bottom: 0.5rem;
            }

            .modal p {
              color: #888;
              margin-bottom: 1rem;
            }

            .modal input {
              width: 100%;
              padding: 0.75rem;
              border: 1px solid var(--border);
              border-radius: 8px;
              background: var(--darker);
              color: #fff;
              font-size: 1.1rem;
              margin-bottom: 1rem;
            }

            .modal-actions {
              display: flex;
              gap: 0.5rem;
            }

            .modal-actions button {
              flex: 1;
              padding: 0.75rem;
              border-radius: 8px;
              font-weight: bold;
              cursor: pointer;
            }

            .btn-primary {
              background: var(--primary);
              color: #000;
              border: none;
            }

            .btn-secondary {
              background: transparent;
              border: 1px solid var(--border);
              color: #fff;
            }
          `}</style>
        </div>
      )}
    </>
  )
}
