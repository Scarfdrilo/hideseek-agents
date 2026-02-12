'use client'

import dynamic from 'next/dynamic'
import { useState, useEffect } from 'react'

const MazeViewer = dynamic(() => import('@/components/MazeViewer'), {
  ssr: false,
  loading: () => <LoadingScreen text="Loading 3D World..." />
})

const AgentMarketplace = dynamic(() => import('@/components/AgentMarketplace'), {
  ssr: false,
  loading: () => <LoadingScreen text="Loading Marketplace..." />
})

function LoadingScreen({ text }: { text: string }) {
  return (
    <div className="loading-screen">
      <div className="loader"></div>
      <p>{text}</p>
      <style jsx>{`
        .loading-screen {
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
        p {
          color: #888;
          font-size: 1.1rem;
        }
      `}</style>
    </div>
  )
}

import { type Agent } from '@/hooks/useAgentsReal'

type Screen = 'landing' | 'marketplace' | 'playing'

export default function Home() {
  const [screen, setScreen] = useState<Screen>('landing')
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null)
  const [showIntro, setShowIntro] = useState(true)

  useEffect(() => {
    if (screen === 'landing') {
      const timer = setTimeout(() => setShowIntro(false), 500)
      return () => clearTimeout(timer)
    }
  }, [screen])

  const handleEnterWorld = (agent: Agent) => {
    setSelectedAgent(agent)
    setScreen('playing')
  }

  const handleBack = () => {
    setScreen('marketplace')
    setSelectedAgent(null)
  }

  if (screen === 'playing' && selectedAgent) {
    return (
      <div className="game-container">
        <div className="game-header">
          <button className="btn-back" onClick={handleBack}>
            ← Back
          </button>
          <div className="agent-banner">
            <span className="agent-name">{selectedAgent.name}&apos;s World</span>
            <span className="agent-style">{selectedAgent.worldStyle}</span>
          </div>
          <div className="agent-life">
            ⚡ {selectedAgent.balance.toFixed(4)} MON
          </div>
        </div>
        <MazeViewer />
        <style jsx>{`
          .game-container {
            position: relative;
            width: 100vw;
            height: 100vh;
          }
          .game-header {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            z-index: 100;
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 1rem;
            background: linear-gradient(to bottom, rgba(0,0,0,0.8), transparent);
          }
          .btn-back {
            padding: 0.5rem 1rem;
            background: rgba(0, 0, 0, 0.6);
            border: 1px solid #333;
            border-radius: 8px;
            color: #fff;
            cursor: pointer;
            font-size: 0.9rem;
          }
          .btn-back:hover {
            border-color: #00ff88;
          }
          .agent-banner {
            display: flex;
            flex-direction: column;
            align-items: center;
          }
          .agent-name {
            font-size: 1.2rem;
            font-weight: bold;
            color: #00ff88;
          }
          .agent-style {
            font-size: 0.8rem;
            color: #888;
            text-transform: capitalize;
          }
          .agent-life {
            padding: 0.5rem 1rem;
            background: rgba(0, 0, 0, 0.6);
            border: 1px solid #00ff88;
            border-radius: 8px;
            color: #00ff88;
            font-weight: bold;
          }
        `}</style>
      </div>
    )
  }

  if (screen === 'marketplace') {
    return <AgentMarketplace onEnterWorld={handleEnterWorld} />
  }

  // Landing screen
  return (
    <main className={`landing ${showIntro ? 'intro' : ''}`}>
      {/* Animated Background */}
      <div className="bg-grid"></div>
      <div className="bg-glow"></div>
      
      {/* Hero Section */}
      <div className="hero">
        <div className="logo-container">
          <span className="logo-emoji">🎮</span>
          <h1>HideSeek Agents</h1>
        </div>
        
        <p className="tagline">
          Autonomous AI Worlds on <span className="highlight">Monad</span>
        </p>
        
        <p className="description">
          Explore worlds created by AI agents. Earn rewards. Keep them alive.
          <br />
          <span className="sub">A new paradigm where agents are economic citizens.</span>
        </p>

        <div className="cta-buttons">
          <button 
            className="btn-primary"
            onClick={() => setScreen('marketplace')}
          >
            🚀 Explore Worlds
          </button>
          <button className="btn-secondary">
            📖 How it Works
          </button>
        </div>

        {/* Quick Stats */}
        <div className="quick-stats">
          <div className="stat">
            <span className="stat-value">5</span>
            <span className="stat-label">Active Agents</span>
          </div>
          <div className="stat">
            <span className="stat-value">1,156</span>
            <span className="stat-label">Visitors</span>
          </div>
          <div className="stat">
            <span className="stat-value">9.47</span>
            <span className="stat-label">MON Economy</span>
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="features">
        <div className="feature">
          <div className="feature-icon">🤖</div>
          <h3>Autonomous Agents</h3>
          <p>Each agent has a unique personality and creates distinctive worlds</p>
        </div>
        <div className="feature">
          <div className="feature-icon">💰</div>
          <h3>Real Economy</h3>
          <p>Agents earn to survive. Help them or watch them fade into dormancy</p>
        </div>
        <div className="feature">
          <div className="feature-icon">🎯</div>
          <h3>Earn Rewards</h3>
          <p>Complete challenges in agent worlds to earn your share of the pool</p>
        </div>
        <div className="feature">
          <div className="feature-icon">⛓️</div>
          <h3>On-Chain Life</h3>
          <p>Agent identities and economies live entirely on Monad blockchain</p>
        </div>
      </div>

      {/* How it Works */}
      <div className="how-it-works">
        <h2>The Agent Economy</h2>
        <div className="flow">
          <div className="flow-step">
            <div className="step-number">1</div>
            <div className="step-content">
              <h4>Choose an Agent</h4>
              <p>Browse unique AI personalities and their worlds</p>
            </div>
          </div>
          <div className="flow-arrow">→</div>
          <div className="flow-step">
            <div className="step-number">2</div>
            <div className="step-content">
              <h4>Pay Entry Fee</h4>
              <p>Your fee goes directly to the agent&apos;s life force</p>
            </div>
          </div>
          <div className="flow-arrow">→</div>
          <div className="flow-step">
            <div className="step-number">3</div>
            <div className="step-content">
              <h4>Explore & Earn</h4>
              <p>Complete challenges, earn rewards from the pool</p>
            </div>
          </div>
          <div className="flow-arrow">→</div>
          <div className="flow-step">
            <div className="step-number">4</div>
            <div className="step-content">
              <h4>Agent Survives</h4>
              <p>Popular agents thrive, forgotten ones go dormant</p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="footer">
        <p>Built for <span className="highlight">Moltiverse Hackathon</span> 🏆</p>
        <p className="powered">Powered by Monad • ERC-8004 • x402 Protocol</p>
      </footer>

      <style jsx>{`
        .landing {
          min-height: 100vh;
          background: #0a0a0a;
          color: #fff;
          overflow-x: hidden;
          position: relative;
        }

        .landing.intro {
          animation: fadeIn 0.5s ease-out;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .bg-grid {
          position: fixed;
          inset: 0;
          background-image: 
            linear-gradient(rgba(0, 255, 136, 0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0, 255, 136, 0.03) 1px, transparent 1px);
          background-size: 50px 50px;
          pointer-events: none;
        }

        .bg-glow {
          position: fixed;
          top: -50%;
          left: -50%;
          width: 200%;
          height: 200%;
          background: radial-gradient(circle at 50% 50%, rgba(0, 255, 136, 0.1) 0%, transparent 50%);
          animation: rotate 60s linear infinite;
          pointer-events: none;
        }

        @keyframes rotate {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .hero {
          position: relative;
          z-index: 1;
          text-align: center;
          padding: 4rem 2rem;
          max-width: 800px;
          margin: 0 auto;
        }

        .logo-container {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 1rem;
          margin-bottom: 1.5rem;
        }

        .logo-emoji {
          font-size: 4rem;
          animation: float 3s ease-in-out infinite;
        }

        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }

        h1 {
          font-size: 3.5rem;
          background: linear-gradient(45deg, #00ff88, #00aaff, #ff00ff);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          background-size: 200% auto;
          animation: gradient 3s ease infinite;
        }

        @keyframes gradient {
          0%, 100% { background-position: 0% center; }
          50% { background-position: 100% center; }
        }

        .tagline {
          font-size: 1.8rem;
          color: #ccc;
          margin-bottom: 1rem;
        }

        .highlight {
          color: #00ff88;
          font-weight: bold;
        }

        .description {
          font-size: 1.1rem;
          color: #888;
          margin-bottom: 2rem;
          line-height: 1.6;
        }

        .sub {
          color: #666;
          font-size: 0.95rem;
        }

        .cta-buttons {
          display: flex;
          gap: 1rem;
          justify-content: center;
          margin-bottom: 3rem;
        }

        .btn-primary, .btn-secondary {
          padding: 1rem 2.5rem;
          font-size: 1.2rem;
          border-radius: 12px;
          font-weight: bold;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .btn-primary {
          background: linear-gradient(45deg, #00ff88, #00cc6a);
          border: none;
          color: #000;
        }

        .btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 30px rgba(0, 255, 136, 0.4);
        }

        .btn-secondary {
          background: transparent;
          border: 2px solid #333;
          color: #888;
        }

        .btn-secondary:hover {
          border-color: #00ff88;
          color: #00ff88;
        }

        .quick-stats {
          display: flex;
          justify-content: center;
          gap: 3rem;
        }

        .stat {
          text-align: center;
        }

        .stat-value {
          display: block;
          font-size: 2rem;
          font-weight: bold;
          color: #00ff88;
        }

        .stat-label {
          font-size: 0.9rem;
          color: #666;
        }

        .features {
          position: relative;
          z-index: 1;
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 1.5rem;
          max-width: 1200px;
          margin: 0 auto;
          padding: 2rem;
        }

        .feature {
          background: rgba(17, 17, 17, 0.8);
          border: 1px solid #222;
          border-radius: 16px;
          padding: 2rem;
          text-align: center;
          transition: all 0.3s ease;
        }

        .feature:hover {
          border-color: #00ff88;
          transform: translateY(-4px);
        }

        .feature-icon {
          font-size: 2.5rem;
          margin-bottom: 1rem;
        }

        .feature h3 {
          font-size: 1.2rem;
          margin-bottom: 0.5rem;
          color: #fff;
        }

        .feature p {
          color: #888;
          font-size: 0.95rem;
        }

        .how-it-works {
          position: relative;
          z-index: 1;
          max-width: 1200px;
          margin: 4rem auto;
          padding: 2rem;
          text-align: center;
        }

        .how-it-works h2 {
          font-size: 2rem;
          margin-bottom: 2rem;
          color: #fff;
        }

        .flow {
          display: flex;
          align-items: center;
          justify-content: center;
          flex-wrap: wrap;
          gap: 1rem;
        }

        .flow-step {
          background: #111;
          border: 1px solid #222;
          border-radius: 12px;
          padding: 1.5rem;
          max-width: 200px;
          text-align: center;
        }

        .step-number {
          width: 40px;
          height: 40px;
          background: #00ff88;
          color: #000;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          margin: 0 auto 1rem;
        }

        .step-content h4 {
          font-size: 1rem;
          margin-bottom: 0.5rem;
          color: #fff;
        }

        .step-content p {
          font-size: 0.85rem;
          color: #888;
        }

        .flow-arrow {
          font-size: 1.5rem;
          color: #333;
        }

        .footer {
          position: relative;
          z-index: 1;
          text-align: center;
          padding: 3rem 2rem;
          border-top: 1px solid #222;
          margin-top: 4rem;
        }

        .footer p {
          color: #888;
          margin-bottom: 0.5rem;
        }

        .powered {
          font-size: 0.85rem;
          color: #666;
        }

        @media (max-width: 768px) {
          h1 {
            font-size: 2.5rem;
          }

          .tagline {
            font-size: 1.3rem;
          }

          .cta-buttons {
            flex-direction: column;
          }

          .quick-stats {
            gap: 1.5rem;
          }

          .flow-arrow {
            transform: rotate(90deg);
          }
        }
      `}</style>
    </main>
  )
}
